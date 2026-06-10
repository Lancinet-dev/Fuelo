// ================================================
// FUELO V2.1 — Serveur principal avec Socket.IO
// Fichier : backend/server.js
// ================================================

const Sentry = require('@sentry/node')
Sentry.init({
  dsn:              process.env.SENTRY_DSN,
  environment:      process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

require('dotenv').config()

const checkEnv = require('./utils/checkEnv')
checkEnv()

const express      = require('express')
const http         = require('http')
const { Server }   = require('socket.io')
const cors         = require('cors')
const helmet       = require('helmet')
const cookieParser = require('cookie-parser')
const passport     = require('./config/passport')
const logger       = require('./utils/logger')

const app    = express()
const server = http.createServer(app)

// Render est derrière un reverse proxy — nécessaire pour que express-rate-limit
// utilise la vraie IP client (X-Forwarded-For) et non l'IP du proxy
app.set('trust proxy', 1)

// ── Origins autorisées ────────────────────────────────
// En production, seul FRONTEND_URL (fuelo-kappa.vercel.app) est autorisé —
// les origines localhost ne sont ajoutées qu'en développement
const allowedOrigins = [
  ...(process.env.NODE_ENV !== 'production' ? [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ] : []),
  process.env.FRONTEND_URL,
].filter(Boolean)

// ── Socket.IO ─────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
})

app.set('io', io)

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connecté: ${socket.id}`)
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
app.use(cookieParser())

// ── Passport ──────────────────────────────────────────
app.use(passport.initialize())

// ── Database ──────────────────────────────────────────
const pool = require('./config/database')

// Migrations idempotentes — colonnes ajoutées progressivement
pool.query(`
  ALTER TABLE stations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
  ALTER TABLE stations ADD COLUMN IF NOT EXISTS seuil_fraude_citerne FLOAT DEFAULT 50;
  ALTER TABLE users    ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);
  ALTER TABLE users    ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;
  CREATE INDEX IF NOT EXISTS idx_ventes_station      ON ventes(station_id, deleted_at);
  CREATE INDEX IF NOT EXISTS idx_ventes_station_date ON ventes(station_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_alertes_station     ON alertes(station_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_alertes_lu          ON alertes(station_id, lu);
  CREATE INDEX IF NOT EXISTS idx_services_station    ON services(station_id, started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_stocks_logs_station ON stocks_logs(station_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email) WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_station_users_user  ON station_users(user_id);
  CREATE TABLE IF NOT EXISTS assistant_logs (
    id         SERIAL PRIMARY KEY,
    owner_id   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_assistant_logs_owner ON assistant_logs(owner_id, created_at DESC);
`).catch(err => logger.error('Migration startup error:', err.message))

// ── Rate limiting ─────────────────────────────────────
const { limiterGeneral, limiterAuth } = require('./middleware/rateLimit')
app.use(limiterGeneral)

// ── Routes ────────────────────────────────────────────
const authRoutes     = require('./routes/auth')
const stockRoutes    = require('./routes/stock')
const venteRoutes    = require('./routes/ventes')
const alerteRoutes   = require('./routes/alertes')
const statsRoutes    = require('./routes/stats')
const stationRoutes  = require('./routes/station')
const employeRoutes  = require('./routes/employes')
const serviceRoutes      = require('./routes/services')
const trajetRoutes       = require('./routes/trajets')
const citerneRoutes      = require('./routes/citernes')
const abonnementRoutes      = require('./routes/abonnements')
const adminRoutes           = require('./routes/admin')
const performanceRoutes     = require('./routes/performances')
const searchRoutes          = require('./routes/search')
const antiFraudeRoutes      = require('./routes/antiFraude')
const assistantRoutes       = require('./routes/assistant')

app.use('/api/auth',      limiterAuth, authRoutes)
app.use('/api/stock',     stockRoutes)
app.use('/api/ventes',    venteRoutes)
app.use('/api/alertes',   alerteRoutes)
app.use('/api/stats',     statsRoutes)
app.use('/api/station',   stationRoutes)
app.use('/api/employes',  employeRoutes)
app.use('/api/services',      serviceRoutes)
app.use('/api/trajets',       trajetRoutes)
app.use('/api/citernes',      citerneRoutes)
app.use('/api/abonnements',   abonnementRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/performances',  performanceRoutes)
app.use('/api/anti-fraude',   antiFraudeRoutes)
app.use('/api/assistant',     assistantRoutes)

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
  // Cron jobs démarrés après que le serveur est prêt
  const { initCronJobs } = require('./utils/cronJobs')
  initCronJobs()
})

process.on('unhandledRejection', (err) => { logger.error('UnhandledRejection', err); process.exit(1) })
process.on('uncaughtException',  (err) => { logger.error('UncaughtException',  err); process.exit(1) })