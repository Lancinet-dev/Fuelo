// ================================================
// FUELO V2 — Routes auth
// Fichier : backend/routes/auth.js
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { validate, registerSchema, loginSchema } = require('../utils/zodSchemas')
const { register, login, me }                   = require('../controllers/authController')
const { forgotPassword, resetPassword }         = require('../controllers/forgotPasswordController')

router.post('/register',        validate(registerSchema), register)
router.post('/login',           validate(loginSchema),    login)
router.get('/me',               verifyToken,              me)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password',  resetPassword)

module.exports = router