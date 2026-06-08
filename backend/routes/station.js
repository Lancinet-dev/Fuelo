// ================================================
// FUELO V2 — Routes station (multi-stations)
// ================================================

const express     = require('express')
const router      = express.Router()
const cloudinary  = require('../config/cloudinary')
const verifyToken = require('../middleware/auth')
const { checkRole, isPompiste, isManager, isOwner } = require('../middleware/checkRole')
const { checkMaxStations } = require('../middleware/checkPlan')
const pool        = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')
const {
  getStation,
  getMesStations,
  creerStation,
  updateStation,
  changerStation,
  getConsolide
} = require('../controllers/stationController')

// Upload partagé : memoryStorage + fileFilter "images uniquement" + limite 8 Mo
const upload = require('../middleware/upload')

// Station actuelle — accessible par tous les rôles (pompiste lit les prix, owner/gerant gèrent)
router.get('/',  verifyToken, checkRole(['pompiste']), getStation)
router.put('/',  verifyToken, isManager,  updateStation)

// Logo station — owner uniquement
router.post('/logo', verifyToken, isOwner, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' })

    const b64    = req.file.buffer.toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${b64}`
    const result = await cloudinary.uploader.upload(dataURI, {
      folder:             'fuelo/logos',
      transformation:     [{ width: 400, height: 400, crop: 'limit' }],
      signature_algorithm:'sha256',
    })

    const station_id = req.user.station_id
    await pool.query('UPDATE stations SET logo_url = $1 WHERE id = $2', [result.secure_url, station_id])

    res.json({ logo_url: result.secure_url })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
})

router.delete('/logo', verifyToken, isOwner, async (req, res) => {
  try {
    await pool.query('UPDATE stations SET logo_url = NULL WHERE id = $1', [req.user.station_id])
    res.json({ message: 'Logo supprimé' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
})

// Multi-stations — propriétaire uniquement
router.get('/mes-stations', verifyToken, isOwner, getMesStations)
router.post('/nouvelle',    verifyToken, isOwner, checkMaxStations, creerStation)
router.post('/changer',     verifyToken, isOwner, changerStation)
router.get('/consolide',    verifyToken, isOwner, getConsolide)

module.exports = router