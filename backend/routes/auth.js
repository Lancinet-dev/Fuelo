// ================================================
// FUELO V2 — Routes auth complètes
// Fichier : backend/routes/auth.js
// ================================================

const express     = require('express')
const router      = express.Router()
const passport    = require('../config/passport')
const verifyToken = require('../middleware/auth')
const { validate, registerSchema, loginSchema } = require('../utils/zodSchemas')
const { register, login, me, changePassword }   = require('../controllers/authController')
const { forgotPassword, resetPassword }         = require('../controllers/forgotPasswordController')
const { googleCallback }                        = require('../controllers/googleAuthController')
const pool   = require('../config/database')
const logger = require('../utils/logger')

// ── Auth classique ────────────────────────────────────
router.post('/register',        validate(registerSchema), register)
router.post('/login',           validate(loginSchema),    login)
router.get('/me',               verifyToken,              me)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

// ── Changer mot de passe ──────────────────────────────
router.put('/change-password', verifyToken, changePassword)

// ── Mettre à jour le profil ───────────────────────────
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { nom, telephone } = req.body
    if (!nom?.trim()) return res.status(400).json({ error: 'Nom obligatoire' })

    // S'assurer que la colonne telephone existe
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS telephone VARCHAR(20)`
    ).catch(() => {})

    await pool.query(
      'UPDATE users SET nom = $1, telephone = $2 WHERE id = $3',
      [nom.trim(), telephone || null, req.user.id]
    )

    logger.info(`Profil mis à jour — user ${req.user.id}`)
    res.json({ message: 'Profil mis à jour' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Google OAuth ──────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  googleCallback
)

module.exports = router