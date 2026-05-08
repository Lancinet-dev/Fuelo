const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { getStock, ajouterLivraison } = require('../controllers/stockController')

// Toutes ces routes nécessitent un token JWT
router.get('/current', verifyToken, getStock)
router.post('/livraison', verifyToken, ajouterLivraison)

module.exports = router