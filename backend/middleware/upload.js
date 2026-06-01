const multer              = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary          = require('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder:         `fuelo/services/station_${req.user?.station_id || 'unknown'}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, quality: 'auto' }],
    public_id:      `${Date.now()}_${req.user?.id || 'unknown'}`,
  }),
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('Seules les images sont acceptées (jpg, png, webp)'))
  },
})

module.exports = upload
