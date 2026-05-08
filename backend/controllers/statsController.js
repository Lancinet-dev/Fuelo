const pool = require('../config/database')

// ── Résumé complet dashboard ──────────────
const getResume = async (req, res) => {
  try {
    const station_id = req.user.station_id

    // Stock actuel
    const stocks = await pool.query(
      'SELECT type, quantite FROM stocks WHERE station_id = $1',
      [station_id]
    )

    // Ventes aujourd'hui
    const ventesJour = await pool.query(
      `SELECT COUNT(*) as nb,
      COALESCE(SUM(litres), 0) as litres,
      COALESCE(SUM(montant_gnf), 0) as montant
      FROM ventes WHERE station_id = $1
      AND DATE(created_at) = CURRENT_DATE`,
      [station_id]
    )

    // Ventes ce mois
    const ventesMois = await pool.query(
      `SELECT COUNT(*) as nb,
      COALESCE(SUM(litres), 0) as litres,
      COALESCE(SUM(montant_gnf), 0) as montant
      FROM ventes WHERE station_id = $1
      AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
      [station_id]
    )

    // Ventes 7 derniers jours
    const ventes7j = await pool.query(
      `SELECT
      DATE(created_at) as jour,
      COALESCE(SUM(montant_gnf), 0) as montant,
      COALESCE(SUM(litres), 0) as litres
      FROM ventes WHERE station_id = $1
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY jour ASC`,
      [station_id]
    )

    // Alertes non lues
    const alertes = await pool.query(
      `SELECT COUNT(*) as nb FROM alertes
      WHERE station_id = $1 AND lu = false`,
      [station_id]
    )

    res.json({
      stocks: stocks.rows,
      aujourd_hui: ventesJour.rows[0],
      ce_mois: ventesMois.rows[0],
      graphique_7j: ventes7j.rows,
      alertes_non_lues: alertes.rows[0].nb
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getResume }