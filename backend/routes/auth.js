const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { validateRegister } = require('../middleware/validate')
const { register, login, me } = require('../controllers/authController')

router.post('/register', validateRegister, register)
router.post('/login',    login)
router.get('/me',        verifyToken, me)

module.exports = router