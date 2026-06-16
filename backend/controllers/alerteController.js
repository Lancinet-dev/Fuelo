
const pool = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

// ── Voir toutes les alertes ───────────────
const getAlertes = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT * FROM alertes
      WHERE station_id = $1
      ORDER BY created_at DESC`,
      [station_id]
    )

    const nonLues = result.rows.filter(a => !a.lu).length

    res.json({
      alertes: result.rows,
      non_lues: nonLues
    })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Marquer alerte comme lue ──────────────
const marquerLue = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { id } = req.params

    await pool.query(
      `UPDATE alertes SET lu = true
      WHERE id = $1 AND station_id = $2`,
      [id, station_id]
    )

    res.json({ message: 'Alerte marquée comme lue' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Marquer toutes les alertes lues ──────
const marquerToutesLues = async (req, res) => {
  try {
    const station_id = req.user.station_id

    await pool.query(
      'UPDATE alertes SET lu = true WHERE station_id = $1',
      [station_id]
    )

    res.json({ message: 'Toutes les alertes marquées comme lues' })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Alertes transport uniquement (logisticien) ───
// VOL_TRANSPORT = nouveau libellé. FRAUDE_CITERNE conservé pour les alertes
// déjà enregistrées avant la migration du vocabulaire (rétrocompatibilité).
const TYPES_TRANSPORT = ['VOL_TRANSPORT', 'FRAUDE_CITERNE', 'ARRET_SUSPECT']

const getAlertesTransport = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query(
      `SELECT * FROM alertes
       WHERE station_id = $1 AND type = ANY($2::text[])
       ORDER BY created_at DESC`,
      [station_id, TYPES_TRANSPORT]
    )
    res.json({ alertes: result.rows, non_lues: result.rows.filter(a => !a.lu).length })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { getAlertes, marquerLue, marquerToutesLues, getAlertesTransport }