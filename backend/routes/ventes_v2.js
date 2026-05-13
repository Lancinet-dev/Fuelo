// ================================================
// FUELO V2 — Routes ventes avec validation Zod
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isPompiste, isManager }   = require('../middleware/checkRole')
const { validate, venteSchema }   = require('../utils/zodSchemas')
const {
  enregistrerVente,
  getVentes,
  getVentesRecentes,
  getVentesAujourdhui
} = require('../controllers/venteController_v2')

// POST /api/ventes — validation Zod automatique
router.post('/',          verifyToken, isPompiste, validate(venteSchema), enregistrerVente)
router.get('/',           verifyToken, isManager,  getVentes)
router.get('/recentes',   verifyToken, isManager,  getVentesRecentes)
router.get('/aujourdhui', verifyToken, isPompiste, getVentesAujourdhui)

module.exports = router