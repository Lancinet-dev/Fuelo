const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { getStation, updateStation } = require('../controllers/stationController')

router.get('/', verifyToken, getStation)
router.put('/', verifyToken, updateStation)

module.exports = router