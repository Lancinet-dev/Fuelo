// ================================================
// FUELO — Route rapports manuels
// Fichier : backend/routes/reports.js
// ================================================

const express    = require('express')
const router     = express.Router()
const verifyToken = require('../middleware/auth')
const { isOwner } = require('../middleware/checkRole')
const { envoyerRapportStation } = require('../services/reportService')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

// Envoyer rapport manuellement pour le mois en cours
router.post('/envoyer', verifyToken, isOwner, async (req, res) => {
  try {
    const station_id = req.user.station_id
    const now   = new Date()
    const year  = req.body.year  || now.getFullYear()
    const month = req.body.month || (now.getMonth() + 1)

    logger.info(`Rapport manuel demandé — Station ${station_id} — ${month}/${year}`)

    const result = await envoyerRapportStation(station_id, year, month)

    if (result.success) {
      res.json({ message: `Rapport envoyé par email (${result.ventes} ventes)` })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
})

module.exports = router