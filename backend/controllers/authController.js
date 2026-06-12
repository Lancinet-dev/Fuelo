// ================================================
// FUELO V2 — Auth Controller
// ================================================

const pool   = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

// Email stocké et comparé en minuscules + sans espaces — évite les faux
// rejets "identifiants incorrects" quand la casse diffère entre l'inscription
// et la connexion (ex: "Jean@Gmail.com" saisi puis "jean@gmail.com" au login)
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()

const REFRESH_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000 // 30 jours

const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   REFRESH_EXPIRES_MS,
  path:     '/',
})

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' })

const newRefreshToken = () => crypto.randomBytes(40).toString('hex')

const storeRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS)
  await pool.query(
    'UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3',
    [token, expiresAt, userId]
  )
}

// ── REGISTER ─────────────────────────────────────────
const register = async (req, res) => {
  const { nom, password, nom_station } = req.body
  const email = normalizeEmail(req.body.email)

  // Vérification email avant d'ouvrir une transaction
  const existe = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
    [email]
  ).catch(err => { throw err })

  if (existe.rows.length > 0) {
    logger.warn(`Register refusé — email déjà utilisé : ${email}`)
    return res.status(400).json({ error: 'Email déjà utilisé' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash(password, 10)

    const user = await client.query(
      `INSERT INTO users (nom, email, password, role)
       VALUES ($1, $2, $3, 'owner')
       RETURNING id, nom, email, role`,
      [nom, email, hash]
    )

    const station = await client.query(
      `INSERT INTO stations (owner_id, nom) VALUES ($1, $2) RETURNING id`,
      [user.rows[0].id, nom_station || 'Ma Station']
    )

    const station_id = station.rows[0].id

    await client.query(
      `INSERT INTO station_users (station_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [station_id, user.rows[0].id]
    )

    await client.query(
      `INSERT INTO stocks (station_id, type, quantite) VALUES ($1, 'essence', 0), ($1, 'gasoil', 0)
       ON CONFLICT (station_id, type) DO NOTHING`,
      [station_id]
    )

    await client.query('COMMIT')

    const payload      = { id: user.rows[0].id, station_id, role: user.rows[0].role }
    const accessToken  = signAccessToken(payload)
    const refreshToken = newRefreshToken()
    await storeRefreshToken(user.rows[0].id, refreshToken)

    res.cookie('fuelo_refresh', refreshToken, cookieOptions())
    logger.info(`Register réussi — ${email} (id ${user.rows[0].id})`)
    res.status(201).json({ token: accessToken, user: user.rows[0], station_id })
  } catch (err) {
    await client.query('ROLLBACK')
    logger.error(`Register erreur — ${err.message}`)
    res.status(500).json({ error: erreurServeur(err) })
  } finally {
    client.release()
  }
}

// ── LOGIN ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const { password } = req.body

    // Comparaison insensible à la casse + espaces, et on ignore les comptes
    // soft-deleted — sinon un email "Jean@Test.com" enregistré ne matche plus
    // "jean@test.com" saisi au login → faux rejet "identifiants incorrects"
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
      [email]
    )
    if (result.rows.length === 0) {
      logger.warn(`Login échoué — email introuvable : ${email}`)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const user = result.rows[0]

    if (!user.actif) {
      logger.warn(`Login échoué — compte désactivé : ${email} (id ${user.id})`)
      return res.status(403).json({ error: 'Compte désactivé. Contactez votre gérant.' })
    }

    // Compte créé via Google OAuth → pas de mot de passe local.
    // bcrypt.compare() lève une exception si le hash est null (→ 500 confus),
    // donc on renvoie un message clair plutôt que de laisser planter la requête.
    if (!user.password) {
      logger.warn(`Login échoué — compte Google sans mot de passe : ${email} (id ${user.id})`)
      return res.status(401).json({ error: 'Ce compte utilise la connexion Google. Cliquez sur "Continuer avec Google".' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      logger.warn(`Login échoué — mot de passe invalide : ${email} (id ${user.id})`)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    logger.info(`Login réussi — ${email} (id ${user.id}, rôle ${user.role})`)

    const station = await pool.query(
      `SELECT s.id FROM stations s
       JOIN station_users su ON su.station_id = s.id
       WHERE su.user_id = $1 LIMIT 1`,
      [user.id]
    )

    const station_id = station.rows[0]?.id || null

    const payload      = { id: user.id, station_id, role: user.role }
    const accessToken  = signAccessToken(payload)
    const refreshToken = newRefreshToken()
    await storeRefreshToken(user.id, refreshToken)

    res.cookie('fuelo_refresh', refreshToken, cookieOptions())
    res.json({
      token: accessToken,
      user: {
        id:        user.id,
        nom:       user.nom,
        email:     user.email,
        role:      user.role,
        telephone: user.telephone ?? null,
      },
      station_id,
      role: user.role
    })
  } catch (err) {
    logger.error(`Login erreur — ${err.message}`)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── REFRESH TOKEN ─────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.fuelo_refresh
    if (!token) {
      return res.status(401).json({ error: 'Refresh token manquant' })
    }

    const result = await pool.query(
      `SELECT * FROM users
       WHERE refresh_token = $1
         AND refresh_token_expires_at > NOW()
         AND actif = true`,
      [token]
    )

    if (result.rows.length === 0) {
      res.clearCookie('fuelo_refresh', cookieOptions())
      return res.status(401).json({ error: 'Session expirée — veuillez vous reconnecter' })
    }

    const user = result.rows[0]

    const stationResult = await pool.query(
      `SELECT s.id FROM stations s
       JOIN station_users su ON su.station_id = s.id
       WHERE su.user_id = $1 LIMIT 1`,
      [user.id]
    )
    const station_id = stationResult.rows[0]?.id || null

    // Rotation : nouveau refresh token à chaque appel
    const rotatedToken = newRefreshToken()
    await storeRefreshToken(user.id, rotatedToken)

    const accessToken = signAccessToken({ id: user.id, station_id, role: user.role })

    res.cookie('fuelo_refresh', rotatedToken, cookieOptions())
    res.json({
      token: accessToken,
      user: {
        id:        user.id,
        nom:       user.nom,
        email:     user.email,
        role:      user.role,
        telephone: user.telephone ?? null,
      },
      station_id,
    })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── LOGOUT ────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.fuelo_refresh
    if (token) {
      await pool.query(
        'UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL WHERE refresh_token = $1',
        [token]
      )
    }
    res.clearCookie('fuelo_refresh', cookieOptions())
    res.json({ message: 'Déconnecté' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── ME ────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, telephone, actif, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── CHANGE PASSWORD ───────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body
    const user_id = req.user.id

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [user_id])
    const valid  = await bcrypt.compare(mot_de_passe_actuel, result.rows[0].password)

    if (!valid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, user_id])

    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { register, login, me, changePassword, refresh, logout }
