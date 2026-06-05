// ================================================
// FUELO — Routes abonnements
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isOwner, isAdmin } = require('../middleware/checkRole')
const {
  getMonPlan,
  souscrire,
  handleCallback,
  sandboxSimulate,
  getTousAbonnements,
  validerAbonnement,
} = require('../controllers/abonnementController')

router.get('/',           verifyToken, isOwner, getMonPlan)
router.post('/souscrire', verifyToken, isOwner, souscrire)

// Webhook Orange Money — public (appelé par Orange après paiement)
router.post('/callback', handleCallback)

// Page de simulation sandbox (actif uniquement si ORANGE_MONEY_SANDBOX=true)
router.get('/sandbox/simulate', sandboxSimulate)

// Superadmin
router.get('/tous',        verifyToken, isAdmin, getTousAbonnements)
router.put('/:id/valider', verifyToken, isAdmin, validerAbonnement)

module.exports = router
