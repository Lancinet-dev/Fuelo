// ================================================
// FUELO — Controller : Centre Anti-Fraude
// ================================================

const { getDashboard, marquerResolu } = require('../services/antiFraudeService')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

const dashboard = async (req, res) => {
  try {
    const data = await getDashboard(req.user)
    res.json(data)
  } catch (err) {
    logger.error('antiFraude dashboard', err)
    if (err.message === 'Accès refusé') return res.status(403).json({ error: 'Accès refusé' })
    res.status(500).json({ error: erreurServeur(err) })
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
    if (err.message === 'Accès refusé')   return res.status(403).json({ error: 'Accès refusé' })
    if (err.message === 'Cas introuvable') return res.status(404).json({ error: 'Cas introuvable' })
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { dashboard, resoudreHandler }
