const multer = require('multer')

// multer-storage-cloudinary@4 incompatible avec cloudinary@2 en runtime.
// On utilise memoryStorage + upload manuel dans le controller.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('Seules les images sont acceptées (jpg, png, webp)'))
  },
})

module.exports = upload
