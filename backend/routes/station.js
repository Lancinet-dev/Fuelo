// ================================================
// FUELO V2 — Routes station (multi-stations)
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager, isOwner } = require('../middleware/checkRole')
const {
  getStation,
  getMesStations,
  creerStation,
  updateStation,
  changerStation,
  getConsolide
} = require('../controllers/stationController')

// Station actuelle
router.get('/',           verifyToken, isManager, getStation)
router.put('/',           verifyToken, isManager, updateStation)

// Multi-stations — propriétaire uniquement
router.get('/mes-stations', verifyToken, isOwner, getMesStations)
router.post('/nouvelle',    verifyToken, isOwner, creerStation)
router.post('/changer',     verifyToken, isOwner, changerStation)
router.get('/consolide',    verifyToken, isOwner, getConsolide)

module.exports = router