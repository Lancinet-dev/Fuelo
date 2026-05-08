const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { getAlertes, marquerLue, marquerToutesLues } = require('../controllers/alerteController')

router.get('/', verifyToken, getAlertes)
router.put('/:id/lire', verifyToken, marquerLue)
router.put('/toutes/lire', verifyToken, marquerToutesLues)

module.exports = router