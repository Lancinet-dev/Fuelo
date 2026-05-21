// ================================================
// FUELO V2 — Routes auth avec Google OAuth
// Fichier : backend/routes/auth.js
// ================================================

const express    = require('express')
const router     = express.Router()
const passport   = require('../config/passport')
const verifyToken = require('../middleware/auth')
const { validate, registerSchema, loginSchema } = require('../utils/zodSchemas')
const { register, login, me }                   = require('../controllers/authController')
const { forgotPassword, resetPassword }         = require('../controllers/forgotPasswordController')
const { googleCallback }                        = require('../controllers/googleAuthController')

// ── Auth classique ────────────────────────────────────
router.post('/register',       validate(registerSchema), register)
router.post('/login',          validate(loginSchema),    login)
router.get('/me',              verifyToken,              me)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

// ── Google OAuth ──────────────────────────────────────
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
)

router.get('/google/callback',
  passport.authenticate('google', {
    session:      false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  googleCallback
)

module.exports = router