// ── Gestion centralisée des erreurs ───────
// Toutes les erreurs passent ici
// Au lieu de répéter res.status(500) partout

const errorHandler = (err, req, res, next) => {

  console.error('❌ Erreur:', err.message)

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.message
    })
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide'
    })
  }

  // Erreur PostgreSQL — doublon
  if (err.code === '23505') {
    return res.status(400).json({
      error: 'Cette valeur existe déjà'
    })
  }

  // Erreur PostgreSQL — clé étrangère
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Référence invalide'
    })
  }

  // Erreur générale
  res.status(500).json({
    error: 'Erreur serveur interne'
  })
}

module.exports = errorHandler