// ================================================
// FUELO — Routes : Services / Anti-fraude
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isPompiste, isManager } = require('../middleware/checkRole')
const { checkPlan } = require('../middleware/checkPlan')
const upload      = require('../middleware/upload')
const {
  demarrerService,
  terminerService,
  getServiceActif,
  getServices,
} = require('../controllers/serviceController')

// Pompiste — gestion de son propre service
// Démarrer un service requiert le plan PRO+
// Terminer est TOUJOURS permis (pompiste bloqué sinon si plan downgrade)
router.post('/',              verifyToken, isPompiste, checkPlan('services'), upload.single('photo'), demarrerService)
router.post('/:id/terminer',  verifyToken, isPompiste,                        upload.single('photo'), terminerService)
router.get('/actif',          verifyToken, isPompiste, getServiceActif)

// Owner + gérant — consultation de tous les services
router.get('/',               verifyToken, isManager,  getServices)

module.exports = router
