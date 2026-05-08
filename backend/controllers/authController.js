const pool = require('../config/database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// ── REGISTER ─────────────────────────────
const register = async (req, res) => {
  try {
    const { nom, email, password, nom_station } = req.body

    // Vérifier si email existe déjà
    const existe = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' })
    }

    // Chiffrer le mot de passe
    const hash = await bcrypt.hash(password, 10)

    // Créer le user
    const user = await pool.query( 'INSERT INTO users (nom, email, password) VALUES ($1, $2, $3) RETURNING id, nom, email',
      [nom, email, hash]
    )

    // Créer la station automatiquement
    const station = await pool.query(
      'INSERT INTO stations (owner_id, nom) VALUES ($1, $2) RETURNING id',
      [user.rows[0].id, nom_station || 'Ma Station']
    )

    // Créer les stocks initiaux (0L)
    const station_id = station.rows[0].id
    await pool.query(
      'INSERT INTO stocks (station_id, type, quantite) VALUES ($1, $2, $3), ($1, $4, $3)',
      [station_id, 'essence', 0, 'gasoil']
    )

    // Générer le token JWT 
     const token = jwt.sign(
      { id: user.rows[0].id, station_id },
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

// ── LOGIN ────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Trouver le user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const user = result.rows[0]

    // Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    // Trouver la station
    const station = await pool.query(
      'SELECT id FROM stations WHERE owner_id = $1', [user.id]
    )

    const station_id = station.rows[0]?.id

    const token = jwt.sign(
      { id: user.id, station_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )
    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email },
      station_id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { register, login }