const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const { getActivite, getEmployesFiltres } = require('../controllers/activiteController')

router.get('/',        verifyToken, isManager, getActivite)
router.get('/employes', verifyToken, isManager, getEmployesFiltres)

module.exports = router
