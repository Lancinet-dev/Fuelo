// ================================================
// FUELO — Routes Assistant IA
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const { checkAssistantLimit } = require('../middleware/checkPlan')
const { chat }    = require('../controllers/assistantController')

router.post('/', verifyToken, isManager, checkAssistantLimit, chat)

module.exports = router
