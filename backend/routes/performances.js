// ================================================
// FUELO — Routes : Performances & Primes
// ================================================

const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { canManageEmployes } = require('../middleware/checkRole')
const {
  listePerformances,
  performanceEmploye,
  validerPrimeHandler,
  badgeCount,
  anneesDisponiblesHandler,
} = require('../controllers/performanceController')

// Routes spécifiques avant paramétrées
router.get('/badge',             verifyToken, canManageEmployes, badgeCount)
router.get('/annees',            verifyToken, canManageEmployes, anneesDisponiblesHandler)
router.get('/',                  verifyToken, canManageEmployes, listePerformances)
router.get('/:userId',           verifyToken, canManageEmployes, performanceEmploye)
router.post('/:userId/valider',  verifyToken, canManageEmployes, validerPrimeHandler)

module.exports = router
