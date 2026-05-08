const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { enregistrerVente, getVentes, getVentesAujourdhui } = require('../controllers/venteController')

router.post('/', verifyToken, enregistrerVente)
router.get('/', verifyToken, getVentes)
router.get('/aujourdhui', verifyToken, getVentesAujourdhui)

module.exports = router