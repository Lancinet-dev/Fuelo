// ================================================
// FUELO — Routes : Services / Anti-fraude
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isPompiste, isManager } = require('../middleware/checkRole')
const upload      = require('../middleware/upload')
const {
  demarrerService,
  terminerService,
  getServiceActif,
  getServices,
} = require('../controllers/serviceController')

// Pompiste — gestion de son propre service
router.post('/',              verifyToken, isPompiste, upload.single('photo'), demarrerService)
router.post('/:id/terminer',  verifyToken, isPompiste, upload.single('photo'), terminerService)
router.get('/actif',          verifyToken, isPompiste, getServiceActif)

// Owner + gérant — consultation de tous les services
router.get('/',               verifyToken, isManager,  getServices)

module.exports = router
