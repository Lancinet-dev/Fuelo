// ================================================
// FUELO — Routes : Messagerie interne
// ================================================

const express     = require('express')
const router      = express.Router()
const multer      = require('multer')
const verifyToken = require('../middleware/auth')
const { AppError } = require('../utils/appError')
const {
  getConversations, getMessages, createConversation, sendMessage,
  markRead, uploadFichier, getStationUsers, getTotalNonLus,
} = require('../controllers/messageController')

// Multer dédié messagerie : images ET documents (PDF, Word, Excel…) jusqu'à 10 Mo.
// (le middleware partagé upload.js n'accepte que les images)
const TYPES_OK = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
]
const uploadMessage = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || TYPES_OK.includes(file.mimetype)) return cb(null, true)
    cb(new AppError('Type de fichier non autorisé (images, PDF, Word, Excel)', 400))
  },
})

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// Routes spécifiques AVANT les routes paramétrées
router.get('/users',    getStationUsers)
router.get('/non-lus',  getTotalNonLus)

router.get('/conversations',                         getConversations)
router.post('/conversations',                        createConversation)
router.get('/conversations/:id',                     getMessages)
router.post('/conversations/:id/messages',           sendMessage)
router.put('/conversations/:id/lu',                  markRead)
router.post('/conversations/:id/upload', uploadMessage.single('fichier'), uploadFichier)

module.exports = router
