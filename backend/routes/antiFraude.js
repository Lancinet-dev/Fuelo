// ================================================
// FUELO — Routes : Centre Anti-Fraude
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const { checkPlan } = require('../middleware/checkPlan')
const { dashboard, resoudreHandler } = require('../controllers/antiFraudeController')

const planAF = checkPlan('performances')
router.get('/',                     verifyToken, isManager, planAF, dashboard)
router.put('/:type/:id/resoudre',   verifyToken, isManager, planAF, resoudreHandler)

module.exports = router
