const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isPompiste, isManager } = require('../middleware/checkRole')
const {
  enregistrerVente,
  getVentes,
  getVentesRecentes,
  getVentesAujourdhui
} = require('../controllers/venteController')

router.post('/',          verifyToken, isPompiste, enregistrerVente)
router.get('/',           verifyToken, isManager,  getVentes)
router.get('/recentes',   verifyToken, isManager,  getVentesRecentes)
router.get('/aujourdhui', verifyToken, isPompiste, getVentesAujourdhui)

module.exports = router