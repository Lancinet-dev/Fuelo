const multer = require('multer')
const { AppError } = require('../utils/appError')

// multer-storage-cloudinary@4 incompatible avec cloudinary@2 en runtime.
// On utilise memoryStorage + upload manuel dans le controller.
//
// Limite à 8 Mo (au lieu de 5) — les photos prises directement à la caméra
// du téléphone (pompiste/chauffeur, capture="environment") dépassent souvent
// 5 Mo sur les appareils récents, ce qui faisait échouer l'upload avec une
// "Erreur serveur interne" opaque (voir errorHandler.js pour le message clair)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new AppError('Seules les images sont acceptées (jpg, png, webp)', 400))
  },
})

module.exports = upload
