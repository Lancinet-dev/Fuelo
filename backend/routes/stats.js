const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { getResume } = require('../controllers/statsController')

router.get('/resume', verifyToken, getResume)

module.exports = router