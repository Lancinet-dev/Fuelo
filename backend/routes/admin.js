// ================================================
// FUELO — Routes superadmin
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isAdmin } = require('../middleware/checkRole')
const {
  getStats,
  getClients,
  validerAbonnement,
  suspendreAbonnement,
} = require('../controllers/adminController')

router.get('/stats',                      verifyToken, isAdmin, getStats)
router.get('/clients',                    verifyToken, isAdmin, getClients)
router.put('/abonnements/:id/valider',    verifyToken, isAdmin, validerAbonnement)
router.put('/abonnements/:id/suspendre',  verifyToken, isAdmin, suspendreAbonnement)

module.exports = router
