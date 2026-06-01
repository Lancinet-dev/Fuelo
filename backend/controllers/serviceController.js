// ================================================
// FUELO — Controller : Services / Anti-fraude
// ================================================

const serviceService = require('../services/serviceService')
const logger         = require('../utils/logger')

const demarrerService = async (req, res) => {
  try {
    const photoUrl = req.file?.path || null
    const service  = await serviceService.demarrerService(req.user, req.body, photoUrl)
    res.status(201).json({ message: 'Service démarré', service })
  } catch (err) {
    logger.error('demarrerService', err)
    res.status(400).json({ error: err.message })
  }
}

const terminerService = async (req, res) => {
  try {
    const photoUrl = req.file?.path || null
    const result   = await serviceService.terminerService(
      req.user,
      parseInt(req.params.id),
      req.body,
      photoUrl,
      req.app
    )
    res.json({
      message: result.alerte_fraude
        ? 'Service terminé — Alerte fraude générée'
        : 'Service terminé avec succès',
      ...result,
    })
  } catch (err) {
    logger.error('terminerService', err)
    res.status(400).json({ error: err.message })
  }
}

const getServiceActif = async (req, res) => {
  try {
    const service = await serviceService.getServiceActif(req.user)
    res.json({ service })
  } catch (err) {
    logger.error('getServiceActif', err)
    res.status(500).json({ error: err.message })
  }
}

const getServices = async (req, res) => {
  try {
    const services = await serviceService.getServices(req.user.station_id, req.query)
    res.json({ services })
  } catch (err) {
    logger.error('getServices', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { demarrerService, terminerService, getServiceActif, getServices }
