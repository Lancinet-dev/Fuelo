// ================================================
// FUELO V2 — Stats Controller complet
// ================================================

const pool = require('../config/database')

// ── Résumé dashboard ─────────────────────────────────
const getResume = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const [stocks, ventesJour, ventesMois, ventes7j, alertes] = await Promise.all([
      pool.query(
        'SELECT type, quantite FROM stocks WHERE station_id = $1',
        [station_id]
      ),
      pool.query(
        `SELECT COUNT(*) as nb,
         COALESCE(SUM(litres), 0) as litres,
         COALESCE(SUM(montant_gnf), 0) as montant
         FROM ventes WHERE station_id = $1
         AND DATE(created_at) = CURRENT_DATE`,
        [station_id]
      ),
      pool.query(
        `SELECT COUNT(*) as nb,
         COALESCE(SUM(litres), 0) as litres,
         COALESCE(SUM(montant_gnf), 0) as montant
         FROM ventes WHERE station_id = $1
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [station_id]
      ),
      pool.query(
        `SELECT DATE(created_at) as jour,
         COALESCE(SUM(montant_gnf), 0) as montant,
         COALESCE(SUM(litres), 0) as litres
         FROM ventes WHERE station_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY jour ASC`,
        [station_id]
      ),
      pool.query(
        `SELECT COUNT(*) as nb FROM alertes
         WHERE station_id = $1 AND lu = false`,
        [station_id]
      )
    ])

    res.json({
      stocks:            stocks.rows,
      aujourd_hui:       ventesJour.rows[0],
      ce_mois:           ventesMois.rows[0],
      graphique_7j:      ventes7j.rows,
      alertes_non_lues:  alertes.rows[0].nb
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Stats semaine détaillées ─────────────────────────
const getStatsSemaine = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT
         DATE(created_at) as jour,
         TO_CHAR(created_at, 'Day') as jour_nom,
         COUNT(*) as nb_ventes,
         COALESCE(SUM(litres), 0) as litres,
         COALESCE(SUM(montant_gnf), 0) as montant,
         COALESCE(SUM(CASE WHEN type='essence' THEN litres ELSE 0 END), 0) as litres_essence,
         COALESCE(SUM(CASE WHEN type='gasoil'  THEN litres ELSE 0 END), 0) as litres_gasoil
       FROM ventes
       WHERE station_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at), TO_CHAR(created_at, 'Day')
       ORDER BY jour ASC`,
      [station_id]
    )

    res.json({ semaine: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Stats mois détaillées ────────────────────────────
const getStatsMois = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT
         DATE(created_at) as jour,
         COUNT(*) as nb_ventes,
         COALESCE(SUM(litres), 0) as litres,
         COALESCE(SUM(montant_gnf), 0) as montant
       FROM ventes
       WHERE station_id = $1
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())
       GROUP BY DATE(created_at)
       ORDER BY jour ASC`,
      [station_id]
    )

    // Total du mois
    const total = await pool.query(
      `SELECT
         COUNT(*) as nb_ventes,
         COALESCE(SUM(litres), 0) as litres,
         COALESCE(SUM(montant_gnf), 0) as montant,
         COALESCE(AVG(montant_gnf), 0) as moyenne_par_vente
       FROM ventes
       WHERE station_id = $1
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())`,
      [station_id]
    )

    res.json({
      jours: result.rows,
      total: total.rows[0]
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Activité récente (feed live dashboard) ───────────
const getActivite = async (req, res) => {
  try {
    const station_id = req.user.station_id

    // Dernières ventes
    const ventes = await pool.query(
      `SELECT
         'vente' as type_event,
         v.id,
         v.type as carburant,
         v.litres,
         v.montant_gnf,
         v.created_at,
         u.nom as employe
       FROM ventes v
       LEFT JOIN users u ON u.id = v.user_id
       WHERE v.station_id = $1
       ORDER BY v.created_at DESC
       LIMIT 5`,
      [station_id]
    )

    // Dernières alertes
    const alertes = await pool.query(
      `SELECT
         'alerte' as type_event,
         id,
         type as carburant,
         message,
         lu,
         created_at
       FROM alertes
       WHERE station_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [station_id]
    )

    // Fusionner et trier par date
    const feed = [
      ...ventes.rows.map(v => ({ ...v, event: 'vente' })),
      ...alertes.rows.map(a => ({ ...a, event: 'alerte' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, 8)

    res.json({ activite: feed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Stats par employé ────────────────────────────────
const getStatsEmploye = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { id } = req.params

    const result = await pool.query(
      `SELECT
         COUNT(*) as nb_ventes,
         COALESCE(SUM(litres), 0) as total_litres,
         COALESCE(SUM(montant_gnf), 0) as total_montant,
         COALESCE(AVG(montant_gnf), 0) as moyenne_vente,
         MAX(created_at) as derniere_vente
       FROM ventes
       WHERE station_id = $1 AND user_id = $2`,
      [station_id, id]
    )

    res.json({ stats: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getResume,
  getStatsSemaine,
  getStatsMois,
  getActivite,
  getStatsEmploye
}