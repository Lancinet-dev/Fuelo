// ================================================
// FUELO — Routes : GPS Citernes
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { checkRole, isTransport } = require('../middleware/checkRole')
const { checkPlan } = require('../middleware/checkPlan')
const upload      = require('../middleware/upload')
const {
  demarrerTrajet, ajouterPosition, arriverDestination, validerQrArrivee,
  getTrajetActif, getTrajets, getGpsPoints, exportCSV, getFlotte, getFlotteStats,
} = require('../controllers/trajetController')

const isChauffeur = checkRole(['chauffeur'])

// Chauffeur (plan ENTERPRISE requis)
router.post('/',               verifyToken, isChauffeur,  checkPlan('trajets'), upload.single('photo'), demarrerTrajet)
router.post('/:id/position',   verifyToken, isChauffeur,  ajouterPosition)
router.post('/:id/arriver',    verifyToken, isChauffeur,  upload.single('photo'), arriverDestination)
router.get('/actif',           verifyToken, isChauffeur,  getTrajetActif)

// Logisticien / Owner — validation QR
router.post('/valider-qr',     verifyToken, isTransport,  validerQrArrivee)

const planTrajets = checkPlan('trajets')
// Routes spécifiques avant paramétrées
router.get('/flotte',          verifyToken, isTransport, planTrajets, getFlotte)
router.get('/flotte/stats',    verifyToken, isTransport, planTrajets, getFlotteStats)
router.get('/export/csv',      verifyToken, isTransport, planTrajets, exportCSV)
router.get('/',                verifyToken, isTransport, planTrajets, getTrajets)
router.get('/:id/points',      verifyToken, isTransport, planTrajets, getGpsPoints)

module.exports = router
