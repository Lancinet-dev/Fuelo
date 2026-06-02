// ================================================
// FUELO V2 — Google OAuth Controller
// Fichier : backend/controllers/googleAuthController.js
// ================================================

const jwt    = require('jsonwebtoken')
const crypto = require('crypto')
const pool   = require('../config/database')
const logger = require('../utils/logger')

const REFRESH_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000

const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   REFRESH_EXPIRES_MS,
  path:     '/',
})

// ── Callback après authentification Google ────────────
const googleCallback = async (req, res) => {
  try {
    const user = req.user
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_failed`)
    }

    const station = await pool.query(
      `SELECT s.id FROM stations s
       JOIN station_users su ON su.station_id = s.id
       WHERE su.user_id = $1
       LIMIT 1`,
      [user.id]
    )

    const station_id = station.rows[0]?.id ?? null

    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt    = new Date(Date.now() + REFRESH_EXPIRES_MS)
    await pool.query(
      'UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3',
      [refreshToken, expiresAt, user.id]
    )

    const token = jwt.sign(
      { id: user.id, station_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.cookie('fuelo_refresh', refreshToken, cookieOptions())
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&station=${station_id}&role=${user.role}&nom=${encodeURIComponent(user.nom)}&email=${encodeURIComponent(user.email)}`
    )
  } catch (err) {
    logger.error('googleCallback', err)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`)
  }
}

module.exports = { googleCallback }
