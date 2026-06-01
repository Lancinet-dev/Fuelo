// ================================================
// FUELO V2 — Routes alertes
// ================================================

const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { isTransport } = require('../middleware/checkRole')
const { getAlertes, marquerLue, marquerToutesLues, getAlertesTransport } = require('../controllers/alerteController')

router.get('/transport',   verifyToken, isTransport, getAlertesTransport) // ← avant /:id
router.get('/',            verifyToken, getAlertes)
router.put('/toutes/lire', verifyToken, marquerToutesLues)
router.put('/:id/lire',    verifyToken, marquerLue)

module.exports = router