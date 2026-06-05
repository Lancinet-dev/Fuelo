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
  getTousAbonnements,
  validerAbonnement,
} = require('../controllers/abonnementController')

router.get('/',           verifyToken, isOwner, getMonPlan)
router.post('/souscrire', verifyToken, isOwner, souscrire)

// Webhook Orange Money — public (pas de token, appelé par Orange)
router.post('/callback', handleCallback)

// Superadmin
router.get('/tous',        verifyToken, isAdmin, getTousAbonnements)
router.put('/:id/valider', verifyToken, isAdmin, validerAbonnement)

module.exports = router
