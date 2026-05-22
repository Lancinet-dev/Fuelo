// ================================================
// FUELO V2 — Routes alertes
// ================================================

const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { getAlertes, marquerLue, marquerToutesLues } = require('../controllers/alerteController')

router.get('/',            verifyToken, getAlertes)
router.put('/toutes/lire', verifyToken, marquerToutesLues)  // ← avant /:id/lire
router.put('/:id/lire',    verifyToken, marquerLue)

module.exports = router