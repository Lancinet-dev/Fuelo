// ================================================
// FUELO — Routes notifications in-app
// ================================================

const express      = require('express')
const router       = express.Router()
const verifyToken  = require('../middleware/auth')
const { listerNotifications, marquerToutLu, marquerLu } = require('../controllers/notificationController')

// Routes spécifiques avant routes paramétrées
router.get('/',          verifyToken, listerNotifications)
router.put('/tout-lu',   verifyToken, marquerToutLu)
router.put('/:id/lu',    verifyToken, marquerLu)

module.exports = router
