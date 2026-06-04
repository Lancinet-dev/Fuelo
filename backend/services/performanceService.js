// ================================================
// FUELO — Service : Performances & Primes
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

const NIVEAUX = [
  { min: 95, label: 'exemplaire', montant: 500000 },
  { min: 80, label: 'excellent',  montant: 200000 },
  { min: 60, label: 'tres_bien',  montant: 100000 },
  { min: 40, label: 'bon',        montant: 50000  },
  { min: 0,  label: 'debutant',   montant: 0       },
]

const getNiveau = (score) => NIVEAUX.find(n => score >= n.min) ?? NIVEAUX[NIVEAUX.length - 1]

// ── Calcul automatique — appelé par le cron ───────
const calculerPerformances = async (mois, annee) => {
  const usersResult = await pool.query(
    `SELECT id, role, station_id FROM users
     WHERE role IN ('pompiste', 'chauffeur') AND deleted_at IS NULL AND actif = true`
  )

  // Moyenne mensuelle ventes par station (pour comparaison pompistes)
  const moyResult = await pool.query(
    `SELECT ms.station_id, AVG(ms.total) AS moyenne
     FROM (
       SELECT v.user_id, v.station_id, SUM(v.montant_gnf) AS total
       FROM ventes v
       JOIN users u ON u.id = v.user_id AND u.role = 'pompiste'
       WHERE EXTRACT(MONTH FROM v.created_at) = $1
         AND EXTRACT(YEAR  FROM v.created_at) = $2
         AND v.deleted_at IS NULL
       GROUP BY v.user_id, v.station_id
     ) ms
     GROUP BY ms.station_id`,
    [mois, annee]
  )
  const moyenneByStation = {}
  moyResult.rows.forEach(r => { moyenneByStation[r.station_id] = parseFloat(r.moyenne || 0) })

  let nb = 0
  for (const u of usersResult.rows) {
    try {
      if (u.role === 'pompiste') {
        const serv = await pool.query(
          `SELECT COUNT(DISTINCT DATE(started_at)) AS nb_jours,
                  COUNT(CASE WHEN statut = 'alerte' THEN 1 END) AS nb_fraudes
           FROM services
           WHERE user_id = $1
             AND EXTRACT(MONTH FROM started_at) = $2
             AND EXTRACT(YEAR  FROM started_at) = $3`,
          [u.id, mois, annee]
        )
        const ventes = await pool.query(
          `SELECT COUNT(*) AS nb_ventes, COALESCE(SUM(montant_gnf), 0) AS montant
           FROM ventes
           WHERE user_id = $1
             AND EXTRACT(MONTH FROM created_at) = $2
             AND EXTRACT(YEAR  FROM created_at) = $3
             AND deleted_at IS NULL`,
          [u.id, mois, annee]
        )

        const nb_jours    = parseInt(serv.rows[0].nb_jours    || 0)
        const nb_fraudes  = parseInt(serv.rows[0].nb_fraudes  || 0)
        const nb_ventes   = parseInt(ventes.rows[0].nb_ventes || 0)
        const montant     = parseInt(ventes.rows[0].montant   || 0)
        const moyenne     = moyenneByStation[u.station_id] || 0

        const score = Math.min(100, Math.round(
          (nb_jours / 26) * 30 +
          (nb_fraudes === 0 ? 40 : 0) +
          (montant > moyenne && moyenne > 0 ? 30 : 0)
        ))
        const { montant: prime_montant } = getNiveau(score)

        await pool.query(
          `INSERT INTO performances
             (user_id, mois, annee, score, nb_jours_travailles, nb_ventes, nb_fraudes, montant_vendu, prime_proposee, prime_montant)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (user_id, mois, annee) DO UPDATE SET
             score = EXCLUDED.score, nb_jours_travailles = EXCLUDED.nb_jours_travailles,
             nb_ventes = EXCLUDED.nb_ventes, nb_fraudes = EXCLUDED.nb_fraudes,
             montant_vendu = EXCLUDED.montant_vendu,
             prime_proposee = EXCLUDED.prime_proposee, prime_montant = EXCLUDED.prime_montant`,
          [u.id, mois, annee, score, nb_jours, nb_ventes, nb_fraudes, montant, prime_montant > 0, prime_montant]
        )

      } else if (u.role === 'chauffeur') {
        const trajets = await pool.query(
          `SELECT COUNT(*) AS nb_trajets,
                  COUNT(CASE WHEN statut = 'alerte'       THEN 1 END) AS nb_fraudes,
                  COUNT(CASE WHEN alerte_arret_at IS NOT NULL THEN 1 END) AS nb_arrets
           FROM trajets
           WHERE chauffeur_id = $1
             AND EXTRACT(MONTH FROM started_at) = $2
             AND EXTRACT(YEAR  FROM started_at) = $3`,
          [u.id, mois, annee]
        )

        const nb_trajets = parseInt(trajets.rows[0].nb_trajets || 0)
        const nb_fraudes = parseInt(trajets.rows[0].nb_fraudes || 0)
        const nb_alertes = parseInt(trajets.rows[0].nb_arrets  || 0)

        const score = Math.min(100, Math.round(
          (nb_trajets > 0 ? 30 : 0) +
          (nb_fraudes === 0 ? 40 : 0) +
          (nb_alertes === 0 ? 30 : 0)
        ))
        const { montant: prime_montant } = getNiveau(score)

        await pool.query(
          `INSERT INTO performances
             (user_id, mois, annee, score, nb_trajets, nb_fraudes, nb_alertes, prime_proposee, prime_montant)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (user_id, mois, annee) DO UPDATE SET
             score = EXCLUDED.score, nb_trajets = EXCLUDED.nb_trajets,
             nb_fraudes = EXCLUDED.nb_fraudes, nb_alertes = EXCLUDED.nb_alertes,
             prime_proposee = EXCLUDED.prime_proposee, prime_montant = EXCLUDED.prime_montant`,
          [u.id, mois, annee, score, nb_trajets, nb_fraudes, nb_alertes, prime_montant > 0, prime_montant]
        )
      }
      nb++
    } catch (err) {
      logger.error(`Performance user ${u.id}:`, err.message)
    }
  }
  logger.info(`Performances calculées — ${nb}/${usersResult.rows.length} — ${mois}/${annee}`)
}

// ── GET toutes les performances (filtrées par rôle) ─
const getPerformances = async (user, mois, annee) => {
  const role = user.role
  let whereUser, params

  if (role === 'owner' || role === 'superadmin') {
    whereUser = `u.station_id = $3 AND u.role IN ('pompiste','chauffeur')`
    params = [mois, annee, user.station_id]
  } else if (role === 'gerant') {
    whereUser = `u.created_by = $3 AND u.role = 'pompiste'`
    params = [mois, annee, user.id]
  } else if (role === 'logisticien') {
    whereUser = `u.created_by = $3 AND u.role = 'chauffeur'`
    params = [mois, annee, user.id]
  } else {
    throw new Error('Accès refusé')
  }

  const result = await pool.query(
    `SELECT u.id, u.nom, u.email, u.role AS user_role,
            p.score, p.nb_jours_travailles, p.nb_ventes, p.nb_trajets,
            p.nb_fraudes, p.nb_alertes, p.montant_vendu,
            p.prime_proposee, p.prime_validee, p.prime_montant,
            p.mois, p.annee, p.validee_par,
            vp.nom AS valideur_nom
     FROM users u
     LEFT JOIN performances p ON p.user_id = u.id AND p.mois = $1 AND p.annee = $2
     LEFT JOIN users vp ON vp.id = p.validee_par
     WHERE ${whereUser} AND u.deleted_at IS NULL
     ORDER BY COALESCE(p.score, -1) DESC`,
    params
  )
  return result.rows
}

// ── GET performance d'un employé spécifique ────────
const getPerformanceEmploye = async (userId, user) => {
  const role = user.role

  const emp = await pool.query(
    `SELECT id, role, station_id, created_by FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  )
  if (!emp.rows[0]) throw new Error('Employé introuvable')
  const e = emp.rows[0]

  if (role === 'gerant'      && e.created_by !== user.id) throw new Error('Accès refusé')
  if (role === 'logisticien' && e.created_by !== user.id) throw new Error('Accès refusé')
  if (role === 'owner'       && e.station_id !== user.station_id) throw new Error('Accès refusé')

  const result = await pool.query(
    `SELECT p.*, vp.nom AS valideur_nom
     FROM performances p
     LEFT JOIN users vp ON vp.id = p.validee_par
     WHERE p.user_id = $1
     ORDER BY p.annee DESC, p.mois DESC
     LIMIT 12`,
    [userId]
  )
  return result.rows
}

// ── Valider ou refuser une prime ───────────────────
const validerPrime = async (userId, mois, annee, user, action) => {
  if (!['valider', 'refuser'].includes(action)) throw new Error('Action invalide')

  const emp = await pool.query(
    `SELECT id, role, station_id, created_by FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  )
  if (!emp.rows[0]) throw new Error('Employé introuvable')
  const e = emp.rows[0]

  if (user.role === 'gerant'      && e.created_by !== user.id)      throw new Error('Accès refusé')
  if (user.role === 'logisticien' && e.created_by !== user.id)      throw new Error('Accès refusé')
  if (user.role === 'owner'       && e.station_id !== user.station_id) throw new Error('Accès refusé')

  const updated = await pool.query(
    `UPDATE performances
     SET prime_validee = $1, validee_par = $2
     WHERE user_id = $3 AND mois = $4 AND annee = $5
     RETURNING *`,
    [action === 'valider', user.id, userId, mois, annee]
  )
  if (!updated.rows[0]) throw new Error('Aucune performance trouvée pour ce mois')

  const perf = updated.rows[0]
  await pool.query(
    `INSERT INTO primes (user_id, validee_par, montant, mois, annee, statut)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, user.id, perf.prime_montant || 0, mois, annee, action === 'valider' ? 'validee' : 'refusee']
  )

  return perf
}

// ── Années distinctes avec données réelles ─────────
const getAnneesDisponibles = async (user) => {
  const role = user.role
  let whereUser, params

  if (role === 'owner' || role === 'superadmin') {
    whereUser = `u.station_id = $1`
    params = [user.station_id]
  } else if (role === 'gerant') {
    whereUser = `u.created_by = $1 AND u.role = 'pompiste'`
    params = [user.id]
  } else if (role === 'logisticien') {
    whereUser = `u.created_by = $1 AND u.role = 'chauffeur'`
    params = [user.id]
  } else {
    throw new Error('Accès refusé')
  }

  const result = await pool.query(
    `SELECT DISTINCT p.annee
     FROM performances p
     JOIN users u ON u.id = p.user_id
     WHERE u.deleted_at IS NULL AND ${whereUser}
     ORDER BY p.annee DESC`,
    params
  )
  return result.rows.map(r => parseInt(r.annee))
}

// ── Nombre de primes en attente (badge sidebar) ───
const countPrimesEnAttente = async (user) => {
  const role = user.role
  let whereUser, params

  if (role === 'owner' || role === 'superadmin') {
    whereUser = `u.station_id = $1`
    params = [user.station_id]
  } else if (role === 'gerant') {
    whereUser = `u.created_by = $1 AND u.role = 'pompiste'`
    params = [user.id]
  } else if (role === 'logisticien') {
    whereUser = `u.created_by = $1 AND u.role = 'chauffeur'`
    params = [user.id]
  } else {
    return 0
  }

  const result = await pool.query(
    `SELECT COUNT(*) AS nb
     FROM performances p
     JOIN users u ON u.id = p.user_id
     WHERE p.prime_proposee = true AND p.prime_validee IS NULL AND ${whereUser}`,
    params
  )
  return parseInt(result.rows[0].nb || 0)
}

module.exports = { calculerPerformances, getPerformances, getPerformanceEmploye, validerPrime, countPrimesEnAttente, getAnneesDisponibles, getNiveau, NIVEAUX }
