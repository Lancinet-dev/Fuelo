// ================================================
// FUELO — Migration base de données Render
// Lance : node migrate.js
// ================================================

require('dotenv').config()
const { Pool } = require('pg')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  nom          VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(255),
  role         VARCHAR(20) DEFAULT 'owner',
  telephone    VARCHAR(20),
  actif        BOOLEAN DEFAULT TRUE,
  avatar       VARCHAR(255),
  google_id    VARCHAR(100),
  provider     VARCHAR(20) DEFAULT 'local',
  created_by   INT,
  deleted_at   TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Stations
CREATE TABLE IF NOT EXISTS stations (
  id            SERIAL PRIMARY KEY,
  owner_id      INT REFERENCES users(id) ON DELETE CASCADE,
  nom           VARCHAR(150) NOT NULL,
  adresse       VARCHAR(255),
  ville         VARCHAR(100) DEFAULT 'Conakry',
  pays          VARCHAR(100) DEFAULT 'Guinée',
  seuil_essence FLOAT DEFAULT 300,
  seuil_gasoil  FLOAT DEFAULT 300,
  prix_essence  BIGINT DEFAULT 10000,
  prix_gasoil   BIGINT DEFAULT 9000,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Station Users
CREATE TABLE IF NOT EXISTS station_users (
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (station_id, user_id)
);

-- Stocks
CREATE TABLE IF NOT EXISTS stocks (
  id         SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  type       VARCHAR(20) NOT NULL,
  quantite   FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(station_id, type)
);

-- Ventes
CREATE TABLE IF NOT EXISTS ventes (
  id          SERIAL PRIMARY KEY,
  station_id  INT REFERENCES stations(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id),
  type        VARCHAR(20) NOT NULL,
  litres      FLOAT NOT NULL,
  montant_gnf BIGINT NOT NULL,
  deleted_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Alertes
CREATE TABLE IF NOT EXISTS alertes (
  id         SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT NOT NULL,
  lu         BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stocks logs
CREATE TABLE IF NOT EXISTS stocks_logs (
  id         SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id),
  type       VARCHAR(20) NOT NULL,
  quantite   FLOAT NOT NULL,
  note       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  action     VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id  INT,
  details    JSONB,
  ip         VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Services pompistes (anti-fraude)
CREATE TABLE IF NOT EXISTS services (
  id                     SERIAL PRIMARY KEY,
  station_id             INT REFERENCES stations(id) ON DELETE CASCADE,
  user_id                INT REFERENCES users(id),
  started_at             TIMESTAMP DEFAULT NOW(),
  ended_at               TIMESTAMP,
  photo_debut_url        VARCHAR(500),
  photo_fin_url          VARCHAR(500),
  compteur_essence_debut FLOAT,
  compteur_essence_fin   FLOAT,
  compteur_gasoil_debut  FLOAT,
  compteur_gasoil_fin    FLOAT,
  ecart_essence          FLOAT,
  ecart_gasoil           FLOAT,
  statut                 VARCHAR(20) DEFAULT 'en_cours',
  created_at             TIMESTAMP DEFAULT NOW()
);

-- Citernes (GPS logistique)
ALTER TABLE stations ADD COLUMN IF NOT EXISTS seuil_fraude_citerne FLOAT DEFAULT 50;

CREATE TABLE IF NOT EXISTS citernes (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(50) UNIQUE NOT NULL,
  capacite     FLOAT NOT NULL,
  owner_id     INT REFERENCES users(id) ON DELETE CASCADE,
  chauffeur_id INT REFERENCES users(id),
  actif        BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trajets (
  id                      SERIAL PRIMARY KEY,
  citerne_id              INT REFERENCES citernes(id) ON DELETE CASCADE,
  chauffeur_id            INT REFERENCES users(id),
  station_destination_id  INT REFERENCES stations(id),
  qty_depart              FLOAT NOT NULL,
  qty_arrivee             FLOAT,
  ecart                   FLOAT,
  seuil_fraude            FLOAT DEFAULT 50,
  statut                  VARCHAR(20) DEFAULT 'en_cours',
  started_at              TIMESTAMP DEFAULT NOW(),
  ended_at                TIMESTAMP,
  alerte_arret_at         TIMESTAMP,
  created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gps_points (
  id         SERIAL PRIMARY KEY,
  trajet_id  INT REFERENCES trajets(id) ON DELETE CASCADE,
  lat        FLOAT NOT NULL,
  lng        FLOAT NOT NULL,
  vitesse    FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_points_trajet ON gps_points(trajet_id, created_at DESC);

-- Abonnements (1 par owner)
CREATE TABLE IF NOT EXISTS subscriptions (
  id             SERIAL PRIMARY KEY,
  owner_id       INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan           VARCHAR(20) DEFAULT 'starter' NOT NULL,
  statut         VARCHAR(20) DEFAULT 'actif'   NOT NULL,
  started_at     TIMESTAMP DEFAULT NOW(),
  expires_at     TIMESTAMP,
  payment_method VARCHAR(50),
  payment_phone  VARCHAR(30),
  montant        FLOAT DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner ON subscriptions(owner_id);

-- Refresh tokens (session persistante)
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;

-- Logo station
ALTER TABLE stations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

-- QR code anti-vol transport
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS qr_code VARCHAR(10);
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS qr_expires_at TIMESTAMP;
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS photo_depart_url VARCHAR(500);
ALTER TABLE trajets ADD COLUMN IF NOT EXISTS photo_arrivee_url VARCHAR(500);

-- Performances et primes employés
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
CREATE INDEX IF NOT EXISTS idx_primes_user ON primes(user_id);

-- Index performances critiques
CREATE INDEX IF NOT EXISTS idx_ventes_station       ON ventes(station_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_ventes_station_date  ON ventes(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_station      ON alertes(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_lu           ON alertes(station_id, lu);
CREATE INDEX IF NOT EXISTS idx_services_station     ON services(station_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stocks_logs_station  ON stocks_logs(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_station_users_user   ON station_users(user_id);
`

async function migrate() {
  try {
    console.log('🔄 Connexion à la base de données...')
    await pool.query(SQL)
    console.log('✅ Toutes les tables créées avec succès !')
    process.exit(0)
  } catch (err) {
    console.error('❌ Erreur migration:', err.message)
    process.exit(1)
  }
}

migrate()