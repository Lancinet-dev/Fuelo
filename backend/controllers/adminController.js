// ================================================
// FUELO — Controller : Superadmin
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

// ── GET /api/admin/stats ─────────────────────────
const getStats = async (req, res) => {
  try {
    const [owners, subsRows, stations, revenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'owner' AND deleted_at IS NULL`),
      pool.query(`SELECT statut, COUNT(*) AS nb FROM subscriptions GROUP BY statut`),
      pool.query(`SELECT COUNT(*) FROM stations`),
      pool.query(`SELECT COALESCE(SUM(montant), 0) AS total FROM subscriptions WHERE statut = 'actif'`),
    ])

    const subsByStatut = { actif: 0, en_attente: 0, suspendu: 0, expire: 0 }
    for (const row of subsRows.rows) {
      subsByStatut[row.statut] = parseInt(row.nb)
    }

    res.json({
      nb_clients:    parseInt(owners.rows[0].count),
      nb_stations:   parseInt(stations.rows[0].count),
      revenue_actif: parseFloat(revenue.rows[0].total),
      abonnements:   subsByStatut,
    })
  } catch (err) {
    logger.error('admin.getStats', err)
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/clients ───────────────────────
const getClients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.nom, u.email, u.created_at, u.actif,
         s.id          AS sub_id,
         s.plan        AS sub_plan,
         s.statut      AS sub_statut,
         s.montant     AS sub_montant,
         s.payment_method,
         s.payment_phone,
         s.expires_at,
         s.updated_at  AS sub_updated_at,
         COUNT(DISTINCT st.id) AS nb_stations
       FROM users u
       LEFT JOIN subscriptions s  ON s.owner_id = u.id
       LEFT JOIN stations      st ON st.owner_id = u.id
       WHERE u.role = 'owner' AND u.deleted_at IS NULL
       GROUP BY u.id, s.id
       ORDER BY s.updated_at DESC NULLS LAST, u.created_at DESC`
    )
    res.json({ clients: result.rows })
  } catch (err) {
    logger.error('admin.getClients', err)
    res.status(500).json({ error: err.message })
  }
}

// ── PUT /api/admin/abonnements/:id/valider ───────
const validerAbonnement = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `UPDATE subscriptions
       SET statut = 'actif', started_at = NOW(),
           expires_at = NOW() + INTERVAL '30 days', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' })
    logger.info(`Abonnement validé — ID ${id}`)
    res.json({ message: 'Abonnement activé', abonnement: result.rows[0] })
  } catch (err) {
    logger.error('admin.valider', err)
    res.status(500).json({ error: err.message })
  }
}

// ── PUT /api/admin/abonnements/:id/suspendre ─────
const suspendreAbonnement = async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      `UPDATE subscriptions SET statut = 'suspendu', updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' })
    logger.info(`Abonnement suspendu — ID ${id}`)
    res.json({ message: 'Abonnement suspendu', abonnement: result.rows[0] })
  } catch (err) {
    logger.error('admin.suspendre', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getStats, getClients, validerAbonnement, suspendreAbonnement }
