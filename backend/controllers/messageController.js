// ================================================
// FUELO — Controller : Messagerie interne
// ================================================

const messageService = require('../services/messageService')
const cloudinary     = require('../config/cloudinary')
const { emitToUsers } = require('../utils/socketNotify')
const logger         = require('../utils/logger')
const erreurServeur  = require('../utils/erreurServeur')

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await messageService.getConversations(req.user.id)
    res.json({ conversations })
  } catch (err) {
    logger.error('getConversations', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// GET /api/messages/conversations/:id
const getMessages = async (req, res) => {
  try {
    const result = await messageService.getMessages(parseInt(req.params.id), req.user.id, req.query)
    res.json(result)
  } catch (err) {
    logger.error('getMessages', err)
    res.status(400).json({ error: err.message })
  }
}

// POST /api/messages/conversations
const createConversation = async (req, res) => {
  try {
    const id = await messageService.createConversation(req.user, req.body)
    res.status(201).json({ conversation_id: id })
  } catch (err) {
    logger.error('createConversation', err)
    res.status(400).json({ error: err.message })
  }
}

// POST /api/messages/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const convId  = parseInt(req.params.id)
    const message = await messageService.sendMessage(req.user, convId, req.body)
    // Temps réel : émettre vers les rooms privées de TOUS les membres
    const membreIds = await messageService.getMembreIds(convId)
    emitToUsers(req.app, membreIds, 'message:nouveau', { conversation_id: convId, message })
    res.status(201).json({ message })
  } catch (err) {
    logger.error('sendMessage', err)
    res.status(400).json({ error: err.message })
  }
}

// PUT /api/messages/conversations/:id/lu
const markRead = async (req, res) => {
  try {
    const convId = parseInt(req.params.id)
    await messageService.markRead(req.user, convId)
    // Accusé de lecture temps réel aux autres membres (✓✓)
    const membreIds = await messageService.getMembreIds(convId)
    emitToUsers(req.app, membreIds.filter(uid => uid !== req.user.id), 'message:lu', {
      conversation_id: convId,
      reader_id:       req.user.id,
    })
    res.json({ ok: true })
  } catch (err) {
    logger.error('markRead', err)
    res.status(400).json({ error: err.message })
  }
}

// POST /api/messages/conversations/:id/upload
const uploadFichier = async (req, res) => {
  try {
    const convId = parseInt(req.params.id)
    await messageService.assertMembre(convId, req.user.id)
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' })

    const isImage = req.file.mimetype.startsWith('image/')
    const b64     = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${b64}`
    const result  = await cloudinary.uploader.upload(dataUri, {
      folder:        `fuelo/messages/conv_${convId}`,
      resource_type: isImage ? 'image' : 'auto',
      public_id:     `${Date.now()}_${req.user.id}`,
    })
    res.json({
      url:  result.secure_url,
      type: isImage ? 'image' : 'document',
      nom:  req.file.originalname,
    })
  } catch (err) {
    logger.error('uploadFichier', err)
    res.status(400).json({ error: err.message })
  }
}

// GET /api/messages/users — employés de la station (nouvelle conversation)
const getStationUsers = async (req, res) => {
  try {
    const users = await messageService.getStationUsers(req.user)
    res.json({ users })
  } catch (err) {
    logger.error('getStationUsers', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// GET /api/messages/non-lus — total non lus (badge)
const getTotalNonLus = async (req, res) => {
  try {
    const total = await messageService.getTotalNonLus(req.user.id)
    res.json({ total })
  } catch (err) {
    logger.error('getTotalNonLus', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = {
  getConversations, getMessages, createConversation, sendMessage,
  markRead, uploadFichier, getStationUsers, getTotalNonLus,
}
