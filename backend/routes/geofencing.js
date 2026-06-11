const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { isTransport } = require('../middleware/checkRole')
const { getZones, creerZone, modifierZone, supprimerZone } = require('../controllers/geofencingController')

router.get('/',     verifyToken, isTransport, getZones)
router.post('/',    verifyToken, isTransport, creerZone)
router.put('/:id',  verifyToken, isTransport, modifierZone)
router.delete('/:id', verifyToken, isTransport, supprimerZone)

module.exports = router
