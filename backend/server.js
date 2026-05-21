// ================================================
// FUELO V2.1 — Serveur principal avec Google OAuth
// Fichier : backend/server.js
// ================================================

require('dotenv').config()

const checkEnv = require('./utils/checkEnv')
checkEnv()

const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const passport = require('./config/passport')
const logger   = require('./utils/logger')

const app = express()

// ── Sécurité ──────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqué : ${origin}`))
  },
  credentials: true,
}))

app.use(express.json({ limit: '10kb' }))

// ── Passport ──────────────────────────────────────────
app.use(passport.initialize())

// ── Database ──────────────────────────────────────────
require('./config/database')

// ── Rate limiting ─────────────────────────────────────
const { limiterGeneral, limiterAuth } = require('./middleware/rateLimit')
app.use(limiterGeneral)

// ── Routes ────────────────────────────────────────────
const authRoutes    = require('./routes/auth')
const stockRoutes   = require('./routes/stock')
const venteRoutes   = require('./routes/ventes')
const alerteRoutes  = require('./routes/alertes')
const statsRoutes   = require('./routes/stats')
const stationRoutes = require('./routes/station')
const employeRoutes = require('./routes/employes')

app.use('/api/auth',     limiterAuth, authRoutes)
app.use('/api/stock',    stockRoutes)
app.use('/api/ventes',   venteRoutes)
app.use('/api/alertes',  alerteRoutes)
app.use('/api/stats',    statsRoutes)
app.use('/api/station',  stationRoutes)
app.use('/api/employes', employeRoutes)

// ── Route test ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '⛽ Fuelo API V2.1 — En ligne', version: '2.1.0', status: 'OK' })
})

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'fail', error: `Route ${req.originalUrl} introuvable` })
})

// ── Error handler ─────────────────────────────────────
const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

// ── Démarrage ─────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info(`⛽ Fuelo V2.1 démarré sur le port ${PORT}`)
})

process.on('unhandledRejection', (err) => { logger.error('UnhandledRejection', err); process.exit(1) })
process.on('uncaughtException',  (err) => { logger.error('UncaughtException',  err); process.exit(1) })