// ================================================
// FUELO V2 — Routes ventes avec validation Zod
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isPompiste, isManager }   = require('../middleware/checkRole')
const { validate, venteSchema }   = require('../utils/zodSchemas')
const { autoAudit } = require('../middleware/auditLog')
const {
  enregistrerVente,
  getVentes,
  getVentesRecentes,
  getVentesAujourdhui
} = require('../controllers/venteController')

// POST /api/ventes — validation Zod automatique
router.post('/',          verifyToken, isPompiste, validate(venteSchema), autoAudit('VENTE', 'ventes'), enregistrerVente)
router.get('/',           verifyToken, isManager,  getVentes)
router.get('/recentes',   verifyToken, isManager,  getVentesRecentes)
router.get('/aujourdhui', verifyToken, getVentesAujourdhui)

module.exports = router