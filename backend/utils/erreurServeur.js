// ================================================
// FUELO — Message d'erreur serveur générique
// Évite de renvoyer des détails internes (requêtes SQL,
// noms de colonnes/contraintes...) au client en production.
// ================================================

const erreurServeur = (err) =>
  process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur interne'

module.exports = erreurServeur
