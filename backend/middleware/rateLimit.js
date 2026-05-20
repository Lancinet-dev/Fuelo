// ================================================
// FUELO V2 — Rate Limiting
// Fichier : backend/middleware/rateLimit.js
// ================================================

const rateLimit = require('express-rate-limit')

const isDev = process.env.NODE_ENV !== 'production'

// ── Limite générale — toutes les routes ──────────────
const limiterGeneral = rateLimit({
  windowMs: 1 * 60 * 1000,       // 1 minute
  max:      isDev ? 500 : 100,   // 500 en dev, 100 en prod
  message:  { error: 'Trop de requêtes. Réessaie dans quelques secondes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => isDev,             // Désactivé complètement en dev
})

// ── Limite auth — login/register ─────────────────────
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minutes
  max:      isDev ? 200 : 20,   // 200 en dev, 20 en prod
  message:  { error: 'Trop de tentatives. Réessaie dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => isDev,            // Désactivé complètement en dev
})

module.exports = { limiterGeneral, limiterAuth }