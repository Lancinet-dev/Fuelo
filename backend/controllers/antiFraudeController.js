// ================================================
// FUELO — Controller : Centre Anti-Fraude
// ================================================

const { getDashboard, marquerResolu } = require('../services/antiFraudeService')
const logger = require('../utils/logger')

const dashboard = async (req, res) => {
  try {
    const data = await getDashboard(req.user)
    res.json(data)
  } catch (err) {
    logger.error('antiFraude dashboard', err)
    res.status(err.message === 'Accès refusé' ? 403 : 500).json({ error: err.message })
  }
}

const resoudreHandler = async (req, res) => {
  try {
    const { type, id } = req.params
    if (!['service', 'trajet'].includes(type)) return res.status(400).json({ error: 'Type invalide' })
    const data = await marquerResolu(type, parseInt(id), req.user)
    res.json({ message: 'Cas marqué comme résolu', cas: data })
  } catch (err) {
    logger.error('antiFraude resoudre', err)
    const code = err.message === 'Accès refusé' ? 403 : err.message === 'Cas introuvable' ? 404 : 400
    res.status(code).json({ error: err.message })
  }
}

module.exports = { dashboard, resoudreHandler }
