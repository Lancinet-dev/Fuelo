// ================================================
// FUELO V2 — Google OAuth Controller
// Fichier : backend/controllers/googleAuthController.js
// ================================================

const jwt    = require('jsonwebtoken')
const pool   = require('../config/database')
const logger = require('../utils/logger')

// ── Callback après authentification Google ────────────
const googleCallback = async (req, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
    }

    // Récupérer la station de l'utilisateur
    const station = await pool.query(
      `SELECT s.id FROM stations s
       JOIN station_users su ON su.station_id = s.id
       WHERE su.user_id = $1
       LIMIT 1`,
      [user.id]
    )

    const station_id = station.rows[0]?.id ?? null

    // Générer JWT
    const token = jwt.sign(
      { id: user.id, station_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    // Rediriger vers frontend avec token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&station=${station_id}&role=${user.role}&nom=${encodeURIComponent(user.nom)}&email=${encodeURIComponent(user.email)}`
    )
  } catch (err) {
    logger.error('googleCallback', err)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}

module.exports = { googleCallback }