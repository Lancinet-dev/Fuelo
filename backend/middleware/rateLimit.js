const rateLimit = require('express-rate-limit')

// ── Limite auth — 10 tentatives/5min ────
// Protège contre les attaques brute force
const limiterAuth = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessaie dans 5 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = {  limiterAuth }
