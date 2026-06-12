const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { isTransport } = require('../middleware/checkRole')
const { checkPlan }   = require('../middleware/checkPlan')
const { getZones, creerZone, modifierZone, supprimerZone } = require('../controllers/geofencingController')

const planGeo = checkPlan('trajets')
router.get('/',       verifyToken, isTransport, planGeo, getZones)
router.post('/',      verifyToken, isTransport, planGeo, creerZone)
router.put('/:id',    verifyToken, isTransport, planGeo, modifierZone)
router.delete('/:id', verifyToken, isTransport, planGeo, supprimerZone)

module.exports = router
