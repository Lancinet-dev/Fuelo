// ================================================
// FUELO — Migration base de données Render
// Lance : node migrate.js
// ================================================

require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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