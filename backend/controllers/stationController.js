// ================================================
// FUELO V2 — Station Controller (multi-stations)
// ================================================

const pool = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

// ── Voir infos station actuelle ──────────────────────
const getStation = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query('SELECT * FROM stations WHERE id = $1', [station_id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Station non trouvée' })
    res.json({ station: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Voir TOUTES les stations du propriétaire ─────────
const getMesStations = async (req, res) => {
  try {
    const user_id = req.user.id
    const result = await pool.query(
      `SELECT
         s.*,
         COALESCE((SELECT quantite FROM stocks WHERE station_id = s.id AND type = 'essence'), 0) as stock_essence,
         COALESCE((SELECT quantite FROM stocks WHERE station_id = s.id AND type = 'gasoil'), 0) as stock_gasoil,
         COALESCE((SELECT SUM(montant_gnf) FROM ventes WHERE station_id = s.id AND DATE(created_at) = CURRENT_DATE), 0) as ventes_jour,
         (SELECT COUNT(*) FROM alertes WHERE station_id = s.id AND lu = false) as alertes_nb
       FROM stations s
       WHERE s.owner_id = $1
       ORDER BY s.created_at ASC`,
      [user_id]
    )
    res.json({ stations: result.rows })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Créer une nouvelle station ───────────────────────
const creerStation = async (req, res) => {
  try {
    const user_id = req.user.id
    const { nom, adresse, ville, pays, seuil_essence, seuil_gasoil, prix_essence, prix_gasoil } = req.body

    if (!nom || !nom.trim()) return res.status(400).json({ error: 'Le nom de la station est obligatoire' })

    const station = await pool.query(
      `INSERT INTO stations (owner_id, nom, adresse, ville, pays, seuil_essence, seuil_gasoil, prix_essence, prix_gasoil)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, nom, adresse || null, ville || 'Conakry', pays || 'Guinée',
       seuil_essence || 300, seuil_gasoil || 300,
       prix_essence || 10000, prix_gasoil || 9000]
    )

    const station_id = station.rows[0].id

    await pool.query(
      `INSERT INTO station_users (station_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [station_id, user_id]
    )

    await pool.query(
      `INSERT INTO stocks (station_id, type, quantite) VALUES ($1, 'essence', 0), ($1, 'gasoil', 0)`,
      [station_id]
    )

    res.status(201).json({ message: 'Station créée avec succès', station: station.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Modifier infos station (avec prix) ───────────────
const updateStation = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { nom, adresse, ville, pays, seuil_essence, seuil_gasoil, prix_essence, prix_gasoil } = req.body

    const result = await pool.query(
      `UPDATE stations SET
         nom           = COALESCE($1, nom),
         adresse       = COALESCE($2, adresse),
         ville         = COALESCE($3, ville),
         pays          = COALESCE($4, pays),
         seuil_essence = COALESCE($5, seuil_essence),
         seuil_gasoil  = COALESCE($6, seuil_gasoil),
         prix_essence  = COALESCE($7, prix_essence),
         prix_gasoil   = COALESCE($8, prix_gasoil)
       WHERE id = $9
       RETURNING *`,
      [nom, adresse, ville, pays, seuil_essence, seuil_gasoil, prix_essence, prix_gasoil, station_id]
    )

    res.json({ message: 'Station mise à jour', station: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Changer de station active ────────────────────────
const changerStation = async (req, res) => {
  try {
    const user_id = req.user.id
    const { station_id } = req.body

    const check = await pool.query(
      'SELECT id FROM stations WHERE id = $1 AND owner_id = $2',
      [station_id, user_id]
    )
    if (check.rows.length === 0) return res.status(403).json({ error: 'Cette station ne vous appartient pas' })

    const jwt = require('jsonwebtoken')
    const userResult = await pool.query('SELECT id, nom, email, role FROM users WHERE id = $1', [user_id])

    const token = jwt.sign(
      { id: user_id, station_id: parseInt(station_id), role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.json({ message: 'Station changée', token, station_id: parseInt(station_id), user: userResult.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Vue consolidée ───────────────────────────────────
const getConsolide = async (req, res) => {
  try {
    const user_id = req.user.id

    const total = await pool.query(
      `SELECT
         COUNT(DISTINCT s.id) as nb_stations,
         COALESCE(SUM(v.montant_gnf), 0) as ventes_jour_total,
         COALESCE(SUM(CASE WHEN a.lu = false THEN 1 ELSE 0 END), 0) as alertes_total
       FROM stations s
       LEFT JOIN ventes v ON v.station_id = s.id AND DATE(v.created_at) = CURRENT_DATE
       LEFT JOIN alertes a ON a.station_id = s.id
       WHERE s.owner_id = $1`,
      [user_id]
    )

    const stations = await pool.query(
      `SELECT
         s.id, s.nom, s.ville,
         COALESCE((SELECT quantite FROM stocks WHERE station_id = s.id AND type = 'essence'), 0) as stock_essence,
         COALESCE((SELECT quantite FROM stocks WHERE station_id = s.id AND type = 'gasoil'), 0) as stock_gasoil,
         COALESCE((SELECT SUM(montant_gnf) FROM ventes WHERE station_id = s.id AND DATE(created_at) = CURRENT_DATE), 0) as ventes_jour,
         COALESCE((SELECT COUNT(*) FROM ventes WHERE station_id = s.id AND DATE(created_at) = CURRENT_DATE), 0) as nb_ventes,
         (SELECT COUNT(*) FROM alertes WHERE station_id = s.id AND lu = false) as alertes_nb
       FROM stations s
       WHERE s.owner_id = $1
       ORDER BY s.created_at ASC`,
      [user_id]
    )

    res.json({ consolide: total.rows[0], stations: stations.rows })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { getStation, getMesStations, creerStation, updateStation, changerStation, getConsolide }