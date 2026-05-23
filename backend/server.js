// ================================================
// FUELO V2.1 — Serveur principal avec Socket.IO
// Fichier : backend/server.js
// ================================================

const Sentry = require('@sentry/node')
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

require('dotenv').config()

const checkEnv = require('./utils/checkEnv')
checkEnv()

const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const cors       = require('cors')
const helmet     = require('helmet')
const passport   = require('./config/passport')
const logger     = require('./utils/logger')

const app    = express()
const server = http.createServer(app)

// ── Socket.IO ─────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  }
})

// Rendre io accessible dans toute l'app
app.set('io', io)

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connecté: ${socket.id}`)

  // Rejoindre une room par station
  socket.on('join_station', (station_id) => {
    socket.join(`station_${station_id}`)
    logger.info(`Socket ${socket.id} rejoint station_${station_id}`)
  })

  socket.on('disconnect', () => {
    logger.info(`🔌 Socket déconnecté: ${socket.id}`)
  })
})

// ── Sécurité ──────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────
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
server.listen(PORT, () => {
  logger.info(`⛽ Fuelo V2.1 démarré sur le port ${PORT}`)
})

process.on('unhandledRejection', (err) => { logger.error('UnhandledRejection', err); process.exit(1) })
process.on('uncaughtException',  (err) => { logger.error('UncaughtException',  err); process.exit(1) })