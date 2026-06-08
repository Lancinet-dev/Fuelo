// ================================================
// FUELO — Routes : Centre Anti-Fraude
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const { dashboard, resoudreHandler } = require('../controllers/antiFraudeController')

router.get('/',                     verifyToken, isManager, dashboard)
router.put('/:type/:id/resoudre',   verifyToken, isManager, resoudreHandler)

module.exports = router
