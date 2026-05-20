// ================================================
// FUELO V2.1 — Serveur principal (version finale)
// ================================================

require('dotenv').config()

// Valider les variables d'env AVANT tout
const checkEnv = require('./utils/checkEnv')
checkEnv()

const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const logger  = require('./utils/logger')

const app = express()

// ── Sécurité headers HTTP ────────────────────────────
app.use(helmet())

// ── CORS — domaines autorisés ────────────────────────
const allowedOrigins = [
  'http://localhost:5173',      // dev frontend
  'http://localhost:3000',      // dev alternatif
  process.env.FRONTEND_URL,     // production
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser Postman / curl (pas d'origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqué : ${origin} non autorisé`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10kb' }))

// ── Database ─────────────────────────────────────────
require('./config/database')

// ── Rate limiting ─────────────────────────────────────
const {limiterAuth, limiterGeneral } = require('./middleware/rateLimit')
app.use(limiterAuth , limiterGeneral )

// ── Routes ────────────────────────────────────────────
const authRoutes    = require('./routes/auth')
const stockRoutes   = require('./routes/stock')
const venteRoutes   = require('./routes/ventes')
const alerteRoutes  = require('./routes/alertes')
const statsRoutes   = require('./routes/stats')
const stationRoutes = require('./routes/station')
const employeRoutes = require('./routes/employes')

app.use('/api/auth',  limiterGeneral,   limiterAuth, authRoutes)
app.use('/api/stock',    stockRoutes)
app.use('/api/ventes',   venteRoutes)
app.use('/api/alertes',  alerteRoutes)
app.use('/api/stats',    statsRoutes)
app.use('/api/station',  stationRoutes)
app.use('/api/employes', employeRoutes)

// ── Route test ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '⛽ Fuelo API V2.1 — En ligne',
    version: '2.1.0',
    status:  'OK',
  })
})

// ── 404 ───────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    error: `Route ${req.originalUrl} introuvable`,
  })
})

// ── Error handler — toujours en dernier ───────────────
const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

// ── Démarrage ─────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info(`⛽ Fuelo V2.1 démarré sur le port ${PORT}`)
})

// ── Erreurs non gérées ────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error('UnhandledRejection', err)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  logger.error('UncaughtException', err)
  process.exit(1)
})