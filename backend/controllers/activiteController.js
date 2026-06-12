// ================================================
// FUELO — Activite Controller : journal unifié
// ================================================

const pool = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

const safeQuery = async (fn) => {
  try { return (await fn()).rows }
  catch { return [] }
}

// ── Journal d'activité (ventes + services + alertes + audits) ──
const getActivite = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { debut, fin, type: typeFiltre } = req.query
    const limite     = Math.min(parseInt(req.query.limite) || 80, 200)
    const employe_id = req.query.employe_id ? parseInt(req.query.employe_id) : null

    const now       = new Date()
    const dateDebut = debut ? new Date(debut) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateFin   = fin   ? new Date(fin)   : now

    const base = [station_id, dateDebut.toISOString(), dateFin.toISOString(), employe_id]

    const [ventes, services, alertes, audits] = await Promise.all([

      // Ventes
      (!typeFiltre || typeFiltre === 'vente') ? safeQuery(() =>
        pool.query(
          `SELECT 'vente' as type, v.id, v.created_at as date,
              u.nom as acteur, u.id as acteur_id,
              v.litres::float as litres, v.montant_gnf::float as montant,
              v.type_carburant as sous_type, NULL::text as message
           FROM ventes v
           LEFT JOIN users u ON u.id = v.user_id
           WHERE v.station_id = $1 AND v.deleted_at IS NULL
             AND v.created_at BETWEEN $2 AND $3
             AND ($4::int IS NULL OR v.user_id = $4::int)
           ORDER BY v.created_at DESC LIMIT 100`,
          base
        )
      ) : [],

      // Services début + fin
      (!typeFiltre || typeFiltre === 'service') ? safeQuery(() =>
        pool.query(
          `(SELECT 'service_debut' as type, s.id, s.started_at as date,
               u.nom as acteur, s.user_id as acteur_id,
               COALESCE(s.litres_debut, 0)::float as litres,
               NULL::float as montant, 'debut' as sous_type, NULL::text as message
             FROM services s
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.station_id = $1 AND s.started_at IS NOT NULL
               AND s.started_at BETWEEN $2 AND $3
               AND ($4::int IS NULL OR s.user_id = $4::int))
           UNION ALL
           (SELECT 'service_fin' as type, s.id, s.ended_at as date,
               u.nom as acteur, s.user_id as acteur_id,
               COALESCE(s.litres_fin, 0)::float as litres,
               NULL::float as montant, 'fin' as sous_type,
               COALESCE(s.litres_theorique::text, '') as message
             FROM services s
             LEFT JOIN users u ON u.id = s.user_id
             WHERE s.station_id = $1 AND s.ended_at IS NOT NULL
               AND s.ended_at BETWEEN $2 AND $3
               AND ($4::int IS NULL OR s.user_id = $4::int))
           ORDER BY date DESC LIMIT 80`,
          base
        )
      ) : [],

      // Alertes
      (!typeFiltre || typeFiltre === 'alerte') ? safeQuery(() =>
        pool.query(
          `SELECT 'alerte' as type, a.id, a.created_at as date,
              NULL::text as acteur, NULL::int as acteur_id,
              NULL::float as litres, NULL::float as montant,
              a.type as sous_type, a.message
           FROM alertes a
           WHERE a.station_id = $1 AND a.created_at BETWEEN $2 AND $3
           ORDER BY a.created_at DESC LIMIT 50`,
          [station_id, dateDebut.toISOString(), dateFin.toISOString()]
        )
      ) : [],

      // Audit logs
      safeQuery(() =>
        pool.query(
          `SELECT al.action as type, al.id, al.created_at as date,
              u.nom as acteur, al.user_id as acteur_id,
              NULL::float as litres, NULL::float as montant,
              al.table_name as sous_type, NULL::text as message
           FROM audit_logs al
           LEFT JOIN users u ON u.id = al.user_id
           WHERE al.user_id IN (
             SELECT id FROM users WHERE station_id = $1 AND deleted_at IS NULL
           )
           AND al.created_at BETWEEN $2 AND $3
           AND ($4::int IS NULL OR al.user_id = $4::int)
           ORDER BY al.created_at DESC LIMIT 50`,
          base
        )
      ),
    ])

    const all = [...ventes, ...services, ...alertes, ...audits].filter(e => e.date)
    all.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({ activite: all.slice(0, limite) })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Liste employés de la station (filtre dropdown) ──
const getEmployesFiltres = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query(
      `SELECT id, nom, role FROM users
       WHERE station_id = $1 AND deleted_at IS NULL
       ORDER BY nom`,
      [station_id]
    )
    res.json({ employes: result.rows })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { getActivite, getEmployesFiltres }
