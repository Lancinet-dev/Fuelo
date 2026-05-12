// ================================================
// FUELO V2 — Auth Controller avec rôles
// ================================================

const pool   = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')

// ── REGISTER ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { nom, email, password, nom_station } = req.body

    // Vérifier email existe déjà
    const existe = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' })
    }

    const hash = await bcrypt.hash(password, 10)

    // Créer le user avec rôle 'owner' par défaut à l'inscription
    const user = await pool.query(
      `INSERT INTO users (nom, email, password, role)
       VALUES ($1, $2, $3, 'owner')
       RETURNING id, nom, email, role`,
      [nom, email, hash]
    )

    // Créer la station automatiquement
    const station = await pool.query(
      `INSERT INTO stations (owner_id, nom)
       VALUES ($1, $2) RETURNING id`,
      [user.rows[0].id, nom_station || 'Ma Station']
    )

    const station_id = station.rows[0].id

    // Lier le owner à sa station
    await pool.query(
      `INSERT INTO station_users (station_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [station_id, user.rows[0].id]
    )

    // Créer stocks initiaux
    await pool.query(
      `INSERT INTO stocks (station_id, type, quantite)
       VALUES ($1, 'essence', 0), ($1, 'gasoil', 0)`,
      [station_id]
    )

    const token = jwt.sign(
      { id: user.rows[0].id, station_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.status(201).json({
      token,
      user: user.rows[0],
      station_id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── LOGIN ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const user = result.rows[0]

    // Vérifier si compte actif
    if (!user.actif) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez votre gérant.' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Trouver la station liée à cet utilisateur
    const station = await pool.query(
      `SELECT s.id FROM stations s
       JOIN station_users su ON su.station_id = s.id
       WHERE su.user_id = $1
       LIMIT 1`,
      [user.id]
    )

    const station_id = station.rows[0]?.id || null

    const token = jwt.sign(
      { id: user.id, station_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
      station_id,
      role: user.role
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── ME ────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nom, email, role, actif, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { register, login, me }