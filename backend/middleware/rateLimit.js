const rateLimit = require('express-rate-limit')

// ── Limite générale — 100 req/15min ───────
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

// ── Limite auth — 10 tentatives/15min ────
// Protège contre les attaques brute force
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { limiterGeneral, limiterAuth }