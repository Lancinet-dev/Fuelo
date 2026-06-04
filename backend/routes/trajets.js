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
  getTrajetActif, getTrajets, getGpsPoints, exportCSV,
} = require('../controllers/trajetController')

const isChauffeur = checkRole(['chauffeur'])

// Chauffeur (plan ENTERPRISE requis)
router.post('/',               verifyToken, isChauffeur,  checkPlan('trajets'), upload.single('photo'), demarrerTrajet)
router.post('/:id/position',   verifyToken, isChauffeur,  ajouterPosition)
router.post('/:id/arriver',    verifyToken, isChauffeur,  upload.single('photo'), arriverDestination)
router.get('/actif',           verifyToken, isChauffeur,  getTrajetActif)

// Logisticien / Owner — validation QR à l'arrivée
router.post('/valider-qr',     verifyToken, isTransport,  validerQrArrivee)

// Owner + gérant + logisticien — routes spécifiques avant paramétrées
router.get('/export/csv',      verifyToken, isTransport,  exportCSV)
router.get('/',                verifyToken, isTransport,  getTrajets)
router.get('/:id/points',      verifyToken, isTransport,  getGpsPoints)

module.exports = router
