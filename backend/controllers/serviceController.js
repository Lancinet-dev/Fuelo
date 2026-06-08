// ================================================
// FUELO — Controller : Services / Anti-fraude
// ================================================

const serviceService = require('../services/serviceService')
const cloudinary     = require('../config/cloudinary')
const logger         = require('../utils/logger')
const erreurServeur  = require('../utils/erreurServeur')

const uploadPhoto = async (buffer, folder, publicId) => {
  const b64    = buffer.toString('base64')
  const mime   = 'image/jpeg'
  const dataUri = `data:${mime};base64,${b64}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: 'image',
    overwrite: true,
  })
  return result.secure_url
}

const demarrerService = async (req, res) => {
  try {
    let photoUrl = null
    if (req.file) {
      const folder = `fuelo/services/station_${req.user?.station_id || 'unknown'}`
      photoUrl = await uploadPhoto(req.file.buffer, folder, `debut_${Date.now()}_${req.user?.id}`)
    }
    const service = await serviceService.demarrerService(req.user, req.body, photoUrl)
    res.status(201).json({ message: 'Service démarré', service })
  } catch (err) {
    logger.error('demarrerService', err)
    res.status(400).json({ error: err.message })
  }
}

const terminerService = async (req, res) => {
  try {
    let photoUrl = null
    if (req.file) {
      const folder = `fuelo/services/station_${req.user?.station_id || 'unknown'}`
      photoUrl = await uploadPhoto(req.file.buffer, folder, `fin_${Date.now()}_${req.user?.id}`)
    }
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
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const getServices = async (req, res) => {
  try {
    const services = await serviceService.getServices(req.user.station_id, req.query)
    res.json({ services })
  } catch (err) {
    logger.error('getServices', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { demarrerService, terminerService, getServiceActif, getServices }
