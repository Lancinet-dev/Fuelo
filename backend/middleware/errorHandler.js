// ================================================
// FUELO V2.1 — Error Handler global (mis à jour)
// ================================================

const logger = require('../utils/logger')

const errorHandler = (err, req, res, next) => {

  // Log l'erreur
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack:  err.stack,
    body:   req.body,
    user:   req.user?.id,
  })

  // Erreur opérationnelle (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status:  err.status,
      error:   err.message,
    })
  }

  // Erreur Multer — upload de photo (pompiste/chauffeur/livraisons...)
  // Sans ce bloc, "fichier trop lourd" ou "mauvais format" remontaient en
  // 500 "Erreur serveur interne" sans aucune indication pour l'utilisateur
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE:       'Photo trop volumineuse (maximum 8 Mo). Réduisez la qualité de l\'appareil photo et réessayez.',
      LIMIT_UNEXPECTED_FILE: 'Champ de fichier invalide.',
    }
    return res.status(400).json({
      status: 'fail',
      error:  messages[err.code] ?? err.message,
    })
  }

  // Erreur PostgreSQL — doublon
  if (err.code === '23505') {
    return res.status(400).json({
      status: 'fail',
      error:  'Cette valeur existe déjà',
    })
  }

  // Erreur PostgreSQL — clé étrangère
  if (err.code === '23503') {
    return res.status(400).json({
      status: 'fail',
      error:  'Référence invalide',
    })
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      error:  'Token invalide',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      error:  'Token expiré — reconnectez-vous',
    })
  }

  // Erreur inconnue — ne pas exposer les détails en production
  const isDev = process.env.NODE_ENV === 'development'
  res.status(500).json({
    status:  'error',
    error:   'Erreur serveur interne',
    ...(isDev && { details: err.message, stack: err.stack }),
  })
}

module.exports = errorHandler