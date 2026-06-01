// ================================================
// FUELO — Routes : GPS Citernes
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { checkRole, isManager } = require('../middleware/checkRole')
const {
  demarrerTrajet, ajouterPosition, arriverDestination,
  getTrajetActif, getTrajets, getGpsPoints,
} = require('../controllers/trajetController')

const isChauffeur = checkRole(['chauffeur'])

// Chauffeur
router.post('/',               verifyToken, isChauffeur, demarrerTrajet)
router.post('/:id/position',   verifyToken, isChauffeur, ajouterPosition)
router.post('/:id/arriver',    verifyToken, isChauffeur, arriverDestination)
router.get('/actif',           verifyToken, isChauffeur, getTrajetActif)

// Owner + gérant — routes spécifiques avant paramétrées
router.get('/',                verifyToken, isManager,   getTrajets)
router.get('/:id/points',      verifyToken, isManager,   getGpsPoints)

module.exports = router
