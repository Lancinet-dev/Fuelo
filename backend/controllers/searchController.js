// ================================================
// FUELO — Recherche globale
// ================================================

const pool = require('../config/database')

const search = async (req, res, next) => {
  try {
    const q = (req.query.q ?? '').trim()
    if (q.length < 2) return res.json({ employes: [], ventes: [], alertes: [] })

    const stationId = req.user.station_id
    const like = `%${q}%`

    const [empRes, venteRes, alerteRes] = await Promise.all([
      pool.query(
        `SELECT u.id, u.nom, u.email, u.role
         FROM users u
         JOIN station_users su ON su.user_id = u.id
         WHERE su.station_id = $1
           AND u.deleted_at IS NULL
           AND u.actif = TRUE
           AND (u.nom ILIKE $2 OR u.email ILIKE $2)
         ORDER BY u.nom
         LIMIT 5`,
        [stationId, like]
      ),
      pool.query(
        `SELECT id, type, litres, montant_gnf, created_at
         FROM ventes
         WHERE station_id = $1
           AND deleted_at IS NULL
           AND (type ILIKE $2 OR CAST(montant_gnf AS TEXT) LIKE $2 OR CAST(litres AS TEXT) LIKE $2)
         ORDER BY created_at DESC
         LIMIT 5`,
        [stationId, like]
      ),
      pool.query(
        `SELECT id, type, message, lu, created_at
         FROM alertes
         WHERE station_id = $1
           AND (type ILIKE $2 OR message ILIKE $2)
         ORDER BY created_at DESC
         LIMIT 5`,
        [stationId, like]
      ),
    ])

    res.json({
      employes: empRes.rows,
      ventes:   venteRes.rows,
      alertes:  alerteRes.rows,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { search }
