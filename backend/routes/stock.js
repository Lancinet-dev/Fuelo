const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth')
const { checkExactRole } = require('../middleware/checkRole')
const { getStock, ajouterLivraison } = require('../controllers/stockController')
const { validateLivraison } = require('../middleware/validate')
const { autoAudit } = require('../middleware/auditLog')

// Toutes ces routes nécessitent un token JWT
router.get('/current', verifyToken, getStock)
// Livraisons — gérant uniquement (owner = lecture seule, cf. CLAUDE.md)
router.post('/livraison', verifyToken, checkExactRole(['gerant']), validateLivraison, autoAudit('LIVRAISON', 'stocks'), ajouterLivraison)

module.exports = router