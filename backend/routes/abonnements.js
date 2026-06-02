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
  getTousAbonnements,
  validerAbonnement,
} = require('../controllers/abonnementController')

router.get('/',           verifyToken, isOwner, getMonPlan)
router.post('/souscrire', verifyToken, isOwner, souscrire)

// Superadmin
router.get('/tous',         verifyToken, isAdmin, getTousAbonnements)
router.put('/:id/valider',  verifyToken, isAdmin, validerAbonnement)

module.exports = router
