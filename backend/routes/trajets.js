// ================================================
// FUELO — Routes : GPS Citernes
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { checkRole, isTransport } = require('../middleware/checkRole')
const {
  demarrerTrajet, ajouterPosition, arriverDestination,
  getTrajetActif, getTrajets, getGpsPoints, exportCSV,
} = require('../controllers/trajetController')

const isChauffeur = checkRole(['chauffeur'])

// Chauffeur
router.post('/',               verifyToken, isChauffeur,  demarrerTrajet)
router.post('/:id/position',   verifyToken, isChauffeur,  ajouterPosition)
router.post('/:id/arriver',    verifyToken, isChauffeur,  arriverDestination)
router.get('/actif',           verifyToken, isChauffeur,  getTrajetActif)

// Owner + gérant + logisticien — routes spécifiques avant paramétrées
router.get('/export/csv',      verifyToken, isTransport,  exportCSV)
router.get('/',                verifyToken, isTransport,  getTrajets)
router.get('/:id/points',      verifyToken, isTransport,  getGpsPoints)

module.exports = router
