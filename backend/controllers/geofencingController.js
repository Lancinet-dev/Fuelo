// ================================================
// FUELO — Géofencing Controller
// ================================================

const pool = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

const getZones = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM zones_geofencing WHERE station_id=$1 ORDER BY created_at DESC`,
      [req.user.station_id]
    )
    res.json({ zones: result.rows })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const creerZone = async (req, res) => {
  try {
    const { nom, centre_lat, centre_lng, rayon_km, couleur, type } = req.body
    if (!nom || !centre_lat || !centre_lng) return res.status(400).json({ error: 'nom, centre_lat et centre_lng requis' })
    const result = await pool.query(
      `INSERT INTO zones_geofencing (station_id, nom, type, centre_lat, centre_lng, rayon_km, couleur, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.station_id, nom, type ?? 'cercle', centre_lat, centre_lng, rayon_km ?? 5, couleur ?? '#2563EB', req.user.id]
    )
    res.status(201).json({ zone: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const modifierZone = async (req, res) => {
  try {
    const { nom, centre_lat, centre_lng, rayon_km, couleur, actif } = req.body
    const result = await pool.query(
      `UPDATE zones_geofencing SET nom=COALESCE($1,nom), centre_lat=COALESCE($2,centre_lat),
       centre_lng=COALESCE($3,centre_lng), rayon_km=COALESCE($4,rayon_km),
       couleur=COALESCE($5,couleur), actif=COALESCE($6,actif)
       WHERE id=$7 AND station_id=$8 RETURNING *`,
      [nom, centre_lat, centre_lng, rayon_km, couleur, actif, req.params.id, req.user.station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Zone introuvable' })
    res.json({ zone: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const supprimerZone = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM zones_geofencing WHERE id=$1 AND station_id=$2 RETURNING id`,
      [req.params.id, req.user.station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Zone introuvable' })
    res.json({ message: 'Zone supprimée' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { getZones, creerZone, modifierZone, supprimerZone }
