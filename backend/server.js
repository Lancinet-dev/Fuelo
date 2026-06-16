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
const compression  = require('compression')
const cookieParser = require('cookie-parser')
const passport     = require('./config/passport')
const jwt          = require('jsonwebtoken')
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

// Authentification socket par JWT — la room `user_${id}` est assignée par le
// serveur (et non par le client) pour garantir la privacité des messages directs.
// On n'échoue pas si le token est absent/invalide : le socket reste connecté en
// "anonyme" (events station publics) pour ne rien casser de l'existant.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (token) socket.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch { /* token invalide → socket anonyme */ }
  next()
})

// Présence en ligne — nb de sockets actifs par utilisateur (single-instance Render)
const onlineUsers = new Map()

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connecté: ${socket.id}`)

  // Room privée par utilisateur (messagerie) + room station (présence)
  if (socket.user?.id) {
    const uid = socket.user.id
    socket.join(`user_${uid}`)
    if (socket.user.station_id) socket.join(`station_${socket.user.station_id}`)

    const n = (onlineUsers.get(uid) || 0) + 1
    onlineUsers.set(uid, n)
    // Première connexion → annonce "en ligne" à sa station
    if (n === 1 && socket.user.station_id) {
      io.to(`station_${socket.user.station_id}`).emit('presence:update', { user_id: uid, online: true })
    }
  }

  // Snapshot des utilisateurs en ligne (demandé à l'ouverture de la messagerie)
  socket.on('presence:get', () => {
    socket.emit('presence:list', Array.from(onlineUsers.keys()))
  })

  socket.on('join_station', (station_id) => {
    socket.join(`station_${station_id}`)
    logger.info(`Socket ${socket.id} rejoint station_${station_id}`)
  })

  // Indicateur "en train d'écrire" — relayé uniquement aux destinataires fournis
  // (membres de la conversation, connus côté client via l'API autorisée)
  socket.on('message:typing', ({ conversation_id, recipients }) => {
    if (!socket.user?.id || !Array.isArray(recipients)) return
    recipients
      .filter(uid => uid !== socket.user.id)
      .forEach(uid => io.to(`user_${uid}`).emit('message:typing', {
        conversation_id,
        sender_id: socket.user.id,
        nom:       socket.user.nom,
      }))
  })
  socket.on('message:stop_typing', ({ conversation_id, recipients }) => {
    if (!socket.user?.id || !Array.isArray(recipients)) return
    recipients
      .filter(uid => uid !== socket.user.id)
      .forEach(uid => io.to(`user_${uid}`).emit('message:stop_typing', {
        conversation_id, sender_id: socket.user.id,
      }))
  })

  socket.on('disconnect', () => {
    if (socket.user?.id) {
      const uid = socket.user.id
      const n = (onlineUsers.get(uid) || 1) - 1
      if (n <= 0) {
        onlineUsers.delete(uid)
        // Plus aucun socket → annonce "hors ligne"
        if (socket.user.station_id) io.to(`station_${socket.user.station_id}`).emit('presence:update', { user_id: uid, online: false })
      } else {
        onlineUsers.set(uid, n)
      }
    }
    logger.info(`🔌 Socket déconnecté: ${socket.id}`)
  })
})

// ── Compression gzip/brotli ───────────────────────────
app.use(compression())

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
  ALTER TABLE stations         ADD COLUMN IF NOT EXISTS logo_url              VARCHAR(500);
  ALTER TABLE stations         ADD COLUMN IF NOT EXISTS seuil_fraude_citerne  FLOAT DEFAULT 50;
  ALTER TABLE subscriptions    ADD COLUMN IF NOT EXISTS trial_ends_at         TIMESTAMP;
  ALTER TABLE users            ADD COLUMN IF NOT EXISTS refresh_token          VARCHAR(255);
  ALTER TABLE users            ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;
  ALTER TABLE users            ADD COLUMN IF NOT EXISTS reset_token            VARCHAR(255);
  ALTER TABLE users            ADD COLUMN IF NOT EXISTS reset_token_expires    TIMESTAMP;
  ALTER TABLE couts_transport  ADD COLUMN IF NOT EXISTS fournisseur_transport  VARCHAR(200);
  ALTER TABLE couts_transport  ADD COLUMN IF NOT EXISTS date_transport         DATE;
  ALTER TABLE couts_transport  ADD COLUMN IF NOT EXISTS distance_km            DECIMAL(8,2);
  ALTER TABLE couts_transport  ADD COLUMN IF NOT EXISTS reference_trajet       VARCHAR(100);
  ALTER TABLE gps_points       ADD COLUMN IF NOT EXISTS precision_gps          DECIMAL(8,2);
  ALTER TABLE gps_points       ADD COLUMN IF NOT EXISTS cap                    DECIMAL(5,2);
  ALTER TABLE trajets          ADD COLUMN IF NOT EXISTS distance_km            DECIMAL(8,2) DEFAULT 0;
  ALTER TABLE trajets          ADD COLUMN IF NOT EXISTS vitesse_moyenne        DECIMAL(5,2);
  ALTER TABLE trajets          ADD COLUMN IF NOT EXISTS vitesse_max            DECIMAL(5,2);
  ALTER TABLE trajets          ADD COLUMN IF NOT EXISTS nb_arrets              INT DEFAULT 0;
  -- Vocabulaire : "fraude citerne" → "vol de carburant au cours du transport"
  UPDATE alertes SET type = 'VOL_TRANSPORT' WHERE type = 'FRAUDE_CITERNE';
  CREATE TABLE IF NOT EXISTS zones_geofencing (
    id          SERIAL PRIMARY KEY,
    station_id  INT REFERENCES stations(id) ON DELETE CASCADE,
    nom         VARCHAR(100) NOT NULL,
    type        VARCHAR(30) DEFAULT 'cercle',
    centre_lat  DECIMAL(10,7) NOT NULL,
    centre_lng  DECIMAL(10,7) NOT NULL,
    rayon_km    DECIMAL(6,3) DEFAULT 5,
    couleur     VARCHAR(20) DEFAULT '#2563EB',
    actif       BOOLEAN DEFAULT TRUE,
    created_by  INT REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_zones_geofencing_station ON zones_geofencing(station_id, actif);
  CREATE INDEX IF NOT EXISTS idx_gps_points_trajet_time   ON gps_points(trajet_id, created_at DESC);
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
  CREATE TABLE IF NOT EXISTS performances (
    id                  SERIAL PRIMARY KEY,
    user_id             INT REFERENCES users(id) ON DELETE CASCADE,
    mois                SMALLINT NOT NULL,
    annee               SMALLINT NOT NULL,
    score               FLOAT DEFAULT 0,
    nb_jours_travailles INT DEFAULT 0,
    nb_ventes           INT DEFAULT 0,
    nb_trajets          INT DEFAULT 0,
    nb_fraudes          INT DEFAULT 0,
    nb_alertes          INT DEFAULT 0,
    montant_vendu       BIGINT DEFAULT 0,
    prime_proposee      BOOLEAN DEFAULT FALSE,
    prime_validee       BOOLEAN,
    prime_montant       BIGINT DEFAULT 0,
    validee_par         INT REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, mois, annee)
  );
  CREATE TABLE IF NOT EXISTS primes (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    validee_par INT REFERENCES users(id),
    montant     BIGINT NOT NULL DEFAULT 0,
    mois        SMALLINT NOT NULL,
    annee       SMALLINT NOT NULL,
    motif       TEXT,
    statut      VARCHAR(20) DEFAULT 'propose' NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_performances_user ON performances(user_id);
  CREATE INDEX IF NOT EXISTS idx_primes_user        ON primes(user_id);
  CREATE TABLE IF NOT EXISTS fuel_purchases (
    id                  SERIAL PRIMARY KEY,
    station_id          INT REFERENCES stations(id) ON DELETE CASCADE,
    fournisseur         VARCHAR(100) NOT NULL,
    type_carburant      VARCHAR(20) NOT NULL,
    quantite_commandee  DECIMAL(10,2),
    quantite_recue      DECIMAL(10,2),
    prix_unitaire_ht    DECIMAL(12,2) NOT NULL,
    montant_ht          DECIMAL(15,2),
    tva_taux            DECIMAL(5,2) DEFAULT 0,
    montant_ttc         DECIMAL(15,2),
    numero_bl           VARCHAR(50),
    numero_facture      VARCHAR(50),
    date_achat          TIMESTAMP NOT NULL DEFAULT NOW(),
    date_echeance       TIMESTAMP,
    statut_paiement     VARCHAR(20) DEFAULT 'non_paye',
    mode_paiement       VARCHAR(50),
    depot_origine       VARCHAR(100),
    notes               TEXT,
    created_by          INT REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS bons_livraison (
    id                    SERIAL PRIMARY KEY,
    station_id            INT REFERENCES stations(id) ON DELETE CASCADE,
    numero_bl             VARCHAR(50) NOT NULL,
    date_livraison        TIMESTAMP NOT NULL DEFAULT NOW(),
    fournisseur           VARCHAR(100) NOT NULL,
    depot_origine         VARCHAR(100),
    chauffeur_nom         VARCHAR(100),
    type_carburant        VARCHAR(20) NOT NULL,
    quantite_commandee    DECIMAL(10,2) NOT NULL,
    quantite_livree       DECIMAL(10,2),
    ecart                 DECIMAL(10,2),
    temperature           DECIMAL(5,2),
    densite               DECIMAL(8,4),
    statut                VARCHAR(20) DEFAULT 'en_attente',
    reserves              TEXT,
    document_url          VARCHAR(500),
    signe_chauffeur       BOOLEAN DEFAULT FALSE,
    signe_receptionnaire  BOOLEAN DEFAULT FALSE,
    fuel_purchase_id      INT REFERENCES fuel_purchases(id),
    created_by            INT REFERENCES users(id),
    created_at            TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, numero_bl)
  );
  CREATE TABLE IF NOT EXISTS depenses (
    id               SERIAL PRIMARY KEY,
    station_id       INT REFERENCES stations(id) ON DELETE CASCADE,
    categorie        VARCHAR(50) NOT NULL,
    description      VARCHAR(200),
    montant          DECIMAL(15,2) NOT NULL,
    date_depense     TIMESTAMP NOT NULL DEFAULT NOW(),
    justificatif_url VARCHAR(500),
    created_by       INT REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS couts_transport (
    id                   SERIAL PRIMARY KEY,
    trajet_id            INT REFERENCES trajets(id) ON DELETE CASCADE,
    station_id           INT REFERENCES stations(id),
    carburant_camion     DECIMAL(15,2) DEFAULT 0,
    peages               DECIMAL(15,2) DEFAULT 0,
    prime_chauffeur      DECIMAL(15,2) DEFAULT 0,
    autres_frais         DECIMAL(15,2) DEFAULT 0,
    cout_total           DECIMAL(15,2),
    litres_transportes   DECIMAL(10,2),
    cout_par_litre       DECIMAL(10,4),
    fournisseur_transport VARCHAR(200),
    date_transport       DATE,
    distance_km          DECIMAL(8,2),
    reference_trajet     VARCHAR(100),
    created_by           INT REFERENCES users(id),
    created_at           TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS fiches_paie (
    id             SERIAL PRIMARY KEY,
    station_id     INT REFERENCES stations(id) ON DELETE CASCADE,
    user_id        INT REFERENCES users(id) ON DELETE CASCADE,
    mois           SMALLINT NOT NULL,
    annee          SMALLINT NOT NULL,
    salaire_base   DECIMAL(15,2) NOT NULL DEFAULT 0,
    primes         DECIMAL(15,2) DEFAULT 0,
    avances        DECIMAL(15,2) DEFAULT 0,
    retenues       DECIMAL(15,2) DEFAULT 0,
    salaire_net    DECIMAL(15,2),
    statut         VARCHAR(20) DEFAULT 'en_attente',
    date_paiement  TIMESTAMP,
    notes          TEXT,
    created_by     INT REFERENCES users(id),
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(station_id, user_id, mois, annee)
  );
  CREATE INDEX IF NOT EXISTS idx_fuel_purchases_station ON fuel_purchases(station_id, date_achat DESC);
  CREATE INDEX IF NOT EXISTS idx_bons_livraison_station ON bons_livraison(station_id, date_livraison DESC);
  CREATE INDEX IF NOT EXISTS idx_depenses_station       ON depenses(station_id, date_depense DESC);
  CREATE INDEX IF NOT EXISTS idx_couts_transport_station ON couts_transport(station_id);
  CREATE INDEX IF NOT EXISTS idx_fiches_paie_station    ON fiches_paie(station_id, annee DESC, mois DESC);
  CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(id) ON DELETE CASCADE,
    titre      VARCHAR(200) NOT NULL,
    corps      TEXT,
    type       VARCHAR(50) DEFAULT 'info',
    lien_url   VARCHAR(500),
    lu         BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_lu ON notifications(user_id, lu);
  CREATE TABLE IF NOT EXISTS conversations (
    id          SERIAL PRIMARY KEY,
    station_id  INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    type        VARCHAR(20) DEFAULT 'direct',
    nom         VARCHAR(100),
    created_by  INTEGER REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS conversation_membres (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    derniere_lecture TIMESTAMP DEFAULT NOW(),
    UNIQUE (conversation_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       INTEGER REFERENCES users(id),
    contenu         TEXT,
    type            VARCHAR(20) DEFAULT 'texte',
    fichier_url     VARCHAR(500),
    lu_par          INTEGER[] DEFAULT '{}',
    created_at      TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv          ON messages(conversation_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_conv_membres_user      ON conversation_membres(user_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_station  ON conversations(station_id);
`).catch(err => logger.error('Migration startup error:', err.message))

// ── Rate limiting ─────────────────────────────────────
const { limiterGeneral, limiterAuth } = require('./middleware/rateLimit')
const { blockIfExpired } = require('./middleware/checkPlan')
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
const comptableRoutes       = require('./routes/comptable')
const geofencingRoutes      = require('./routes/geofencing')
const notificationsRoutes   = require('./routes/notificationsRoute')
const activiteRoutes        = require('./routes/activiteRoute')
const messageRoutes         = require('./routes/messages')

app.use('/api/auth',      limiterAuth, authRoutes)
// Abonnements monté AVANT le gate — accessible même quand l'essai est expiré (pour payer)
app.use('/api/abonnements',   abonnementRoutes)
// 🔒 Blocage global si l'essai gratuit est expiré (s'applique à toutes les routes suivantes)
app.use(blockIfExpired)
app.use('/api/stock',     stockRoutes)
app.use('/api/ventes',    venteRoutes)
app.use('/api/alertes',   alerteRoutes)
app.use('/api/stats',     statsRoutes)
app.use('/api/station',   stationRoutes)
app.use('/api/employes',  employeRoutes)
app.use('/api/services',      serviceRoutes)
app.use('/api/trajets',       trajetRoutes)
app.use('/api/citernes',      citerneRoutes)
app.use('/api/search',        searchRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/performances',  performanceRoutes)
app.use('/api/anti-fraude',   antiFraudeRoutes)
app.use('/api/assistant',     assistantRoutes)
app.use('/api/comptable',     comptableRoutes)
app.use('/api/geofencing',    geofencingRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/activite',     activiteRoutes)
app.use('/api/messages',     messageRoutes)

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