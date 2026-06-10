// ================================================
// FUELO — Controller : Superadmin
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

// ── GET /api/admin/stats ─────────────────────────
const getStats = async (req, res) => {
  try {
    const [owners, subsRows, stations, revenue,
           nouveauxParMois, mrrParMois, repartitionPlans,
          expirables, nouveauxCeMois, sansSub] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role='owner' AND deleted_at IS NULL`),
      pool.query(`SELECT statut, COUNT(*) AS nb FROM subscriptions GROUP BY statut`),
      pool.query(`SELECT COUNT(*) FROM stations`),
      pool.query(`SELECT COALESCE(SUM(montant),0) AS total FROM subscriptions WHERE statut='actif'`),
      pool.query(`SELECT TO_CHAR(DATE_TRUNC('month',created_at),'YYYY-MM') AS mois, COUNT(*) AS nb
                  FROM users WHERE role='owner' AND deleted_at IS NULL
                    AND created_at >= NOW()-INTERVAL '12 months'
                  GROUP BY 1 ORDER BY 1`),
      pool.query(`SELECT TO_CHAR(DATE_TRUNC('month',updated_at),'YYYY-MM') AS mois,
                         COALESCE(SUM(montant),0) AS mrr
                  FROM subscriptions WHERE statut='actif'
                    AND updated_at >= NOW()-INTERVAL '12 months'
                  GROUP BY 1 ORDER BY 1`),
      pool.query(`SELECT plan, COUNT(*) AS nb FROM subscriptions WHERE statut='actif' GROUP BY plan`),
      pool.query(`SELECT u.id, u.nom, u.email, s.expires_at, s.plan
                  FROM subscriptions s JOIN users u ON u.id=s.owner_id
                  WHERE s.statut='actif' AND s.expires_at IS NOT NULL
                    AND s.expires_at BETWEEN NOW() AND NOW()+INTERVAL '7 days'
                  ORDER BY s.expires_at ASC`),
      pool.query(`SELECT COUNT(*) FROM users
                  WHERE role='owner' AND deleted_at IS NULL
                    AND DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())`),
      pool.query(`SELECT COUNT(*) FROM users u WHERE u.role='owner' AND u.deleted_at IS NULL
                    AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.owner_id=u.id)`),
    ])

    const subsByStatut = { actif: 0, en_attente: 0, suspendu: 0, expire: 0 }
    for (const row of subsRows.rows) subsByStatut[row.statut] = parseInt(row.nb)

    // Génère un tableau 12 mois (YYYY-MM) même si certains mois sont vides
    const months12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (11 - i))
      return d.toISOString().slice(0, 7)
    })
    const mrrMap = Object.fromEntries(mrrParMois.rows.map(r => [r.mois, parseFloat(r.mrr)]))
    const newMap = Object.fromEntries(nouveauxParMois.rows.map(r => [r.mois, parseInt(r.nb)]))
    const mrr12  = months12.map(m => ({ mois: m, mrr: mrrMap[m] ?? 0 }))
    const new12  = months12.map(m => ({ mois: m, nb:  newMap[m] ?? 0 }))

    res.json({
      nb_clients:       parseInt(owners.rows[0].count),
      nb_stations:      parseInt(stations.rows[0].count),
      revenue_actif:    parseFloat(revenue.rows[0].total),
      abonnements:      subsByStatut,
      nouveaux_ce_mois: parseInt(nouveauxCeMois.rows[0].count),
      sans_abonnement:  parseInt(sansSub.rows[0].count),
      mrr_12mois:       mrr12,
      nouveaux_12mois:  new12,
      repartition_plans: repartitionPlans.rows.map(r => ({ plan: r.plan, nb: parseInt(r.nb) })),
      expirables:       expirables.rows,
    })
  } catch (err) {
    logger.error('admin.getStats', err)
    res.status(500).json({ error: erreurServeur(err) })
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
    res.status(500).json({ error: erreurServeur(err) })
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
    res.status(500).json({ error: erreurServeur(err) })
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
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { getStats, getClients, validerAbonnement, suspendreAbonnement }
