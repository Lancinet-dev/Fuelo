// ================================================
// FUELO — Routes : Performances & Primes
// ================================================

const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { canManageEmployes } = require('../middleware/checkRole')
const { checkPlan } = require('../middleware/checkPlan')
const {
  listePerformances,
  performanceEmploye,
  validerPrimeHandler,
  badgeCount,
  anneesDisponiblesHandler,
} = require('../controllers/performanceController')

// Routes spécifiques avant paramétrées
const planPerf = checkPlan('performances')
router.get('/badge',             verifyToken, canManageEmployes, planPerf, badgeCount)
router.get('/annees',            verifyToken, canManageEmployes, planPerf, anneesDisponiblesHandler)
router.get('/',                  verifyToken, canManageEmployes, planPerf, listePerformances)
router.get('/:userId',           verifyToken, canManageEmployes, planPerf, performanceEmploye)
router.post('/:userId/valider',  verifyToken, canManageEmployes, planPerf, validerPrimeHandler)

module.exports = router
