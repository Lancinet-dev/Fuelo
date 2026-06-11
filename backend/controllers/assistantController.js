// ================================================
// FUELO — Assistant IA Controller
// ================================================

const { repondre } = require('../services/assistantService')
const logger       = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

const chat = async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'Aucun message fourni' })
    }

    const reponse = await repondre(req.user, messages)
    res.json({ reponse })
  } catch (err) {
    logger.error('Assistant IA chat', err)
    if (err.message === 'Accès refusé')  return res.status(403).json({ error: 'Accès refusé' })
    if (err.message === 'Message vide')  return res.status(400).json({ error: 'Message vide' })
    if (err.message === 'Assistant IA non configuré (clé API manquante)') return res.status(503).json({ error: err.message })
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { chat }
