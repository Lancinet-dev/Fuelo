// ================================================
// FUELO — Assistant IA Controller
// ================================================

const { repondre } = require('../services/assistantService')
const logger       = require('../utils/logger')

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
    const code = err.message === 'Accès refusé' ? 403
               : err.message === 'Message vide'  ? 400
               : err.message === 'Assistant IA non configuré (clé API manquante)' ? 503
               : 500
    res.status(code).json({ error: err.message })
  }
}

module.exports = { chat }
