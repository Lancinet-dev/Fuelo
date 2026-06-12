// ================================================
// FUELO — Middleware checkPlan
// Vérifie le plan d'abonnement avant les features sensibles
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

const PLANS = {
  starter: {
    label:        'Starter',
    max_stations: 1,
    max_employes: 5,
    // Pas de logistique, exports, assistant, performances, trajets, citernes
    features:     ['ventes', 'stock', 'alertes'],
    assistant_limit: 0,
    upgrade_vers: 'pro',
  },
  pro: {
    label:        'Pro',
    max_stations: 3,
    max_employes: 20,
    features:     ['ventes', 'stock', 'alertes', 'services', 'logistique', 'trajets', 'citernes', 'exports', 'assistant', 'performances', 'antifraude'],
    assistant_limit: 50,
    upgrade_vers: 'enterprise',
  },
  enterprise: {
    label:        'Enterprise',
    max_stations: Infinity,
    max_employes: Infinity,
    features:     ['ventes', 'stock', 'alertes', 'services', 'logistique', 'trajets', 'citernes', 'exports', 'assistant', 'performances', 'antifraude', 'comptable'],
    assistant_limit: Infinity,
    upgrade_vers: null,
  },
}

// Récupérer le plan d'un utilisateur (owner direct ou via sa station)
const getPlanOwner = async (user) => {
  try {
    let ownerId = null

    if (user.role === 'owner' || user.role === 'superadmin') {
      ownerId = user.id
    } else {
      const res = await pool.query(
        `SELECT owner_id FROM stations WHERE id = $1`,
        [user.station_id]
      )
      ownerId = res.rows[0]?.owner_id
    }

    if (!ownerId) return 'enterprise'

    const sub = await pool.query(
      `SELECT plan, statut FROM subscriptions WHERE owner_id = $1`,
      [ownerId]
    )

    if (!sub.rows[0]) return 'enterprise'

    const { plan, statut } = sub.rows[0]
    if (statut === 'expire' || statut === 'en_attente') return 'starter'

    return plan ?? 'starter'
  } catch (err) {
    logger.error('checkPlan getPlanOwner', err)
    return 'enterprise'
  }
}

// Helper — owner_id depuis n'importe quel rôle
const resolveOwnerId = async (user) => {
  if (user.role === 'owner' || user.role === 'superadmin') return user.id
  const r = await pool.query(`SELECT owner_id FROM stations WHERE id = $1`, [user.station_id])
  return r.rows[0]?.owner_id ?? null
}

// Middleware principal : vérifie qu'une feature est disponible dans le plan
const checkPlan = (feature) => async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (!planDef.features.includes(feature)) {
      const planReqKey = Object.keys(PLANS).find(k => PLANS[k].features.includes(feature))
      const planReq    = PLANS[planReqKey]

      return res.status(403).json({
        error:       'Fonctionnalité non disponible',
        message:     `Cette fonctionnalité nécessite le plan ${planReq?.label ?? 'supérieur'}. Upgradez votre plan pour accéder à cette fonctionnalité.`,
        plan_actuel: plan,
        plan_requis: planReqKey,
        upgrade:     true,
      })
    }

    req.plan    = plan
    req.planDef = planDef
    next()
  } catch (err) {
    logger.error('checkPlan middleware', err)
    next()
  }
}

// Middleware : vérifie la limite du nombre de stations
const checkMaxStations = async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (planDef.max_stations === Infinity) return next()

    const count = await pool.query(
      `SELECT COUNT(*) FROM stations WHERE owner_id = $1 AND deleted_at IS NULL`,
      [req.user.id]
    )
    const nb = parseInt(count.rows[0].count)

    if (nb >= planDef.max_stations) {
      return res.status(403).json({
        error:       'Limite de stations atteinte',
        message:     `Votre plan ${planDef.label} permet ${planDef.max_stations} station(s) maximum. Upgradez votre plan pour en ajouter.`,
        plan_actuel: plan,
        plan_requis: planDef.upgrade_vers,
        upgrade:     true,
        limite:      planDef.max_stations,
        actuel:      nb,
      })
    }

    req.plan    = plan
    req.planDef = planDef
    next()
  } catch (err) {
    logger.error('checkMaxStations', err)
    next()
  }
}

// Middleware : vérifie la limite du nombre d'employés par owner
const checkMaxEmployes = async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (planDef.max_employes === Infinity) return next()

    const ownerId = await resolveOwnerId(req.user)
    if (!ownerId) return next()

    // Compte tous les employés actifs de l'owner (toutes stations confondues)
    const count = await pool.query(
      `SELECT COUNT(DISTINCT u.id) FROM users u
       JOIN station_users su ON su.user_id = u.id
       JOIN stations st ON st.id = su.station_id
       WHERE st.owner_id = $1
         AND u.deleted_at IS NULL
         AND u.role NOT IN ('owner', 'superadmin')`,
      [ownerId]
    )
    const nb = parseInt(count.rows[0].count)

    if (nb >= planDef.max_employes) {
      return res.status(403).json({
        error:       'Limite d\'employés atteinte',
        message:     `Votre plan ${planDef.label} permet ${planDef.max_employes} employé(s) maximum. Upgradez votre plan pour en ajouter.`,
        plan_actuel: plan,
        plan_requis: planDef.upgrade_vers,
        upgrade:     true,
        limite:      planDef.max_employes,
        actuel:      nb,
      })
    }

    req.plan    = plan
    req.planDef = planDef
    next()
  } catch (err) {
    logger.error('checkMaxEmployes', err)
    next()
  }
}

// Middleware : assistant IA — bloque Starter, limite Pro à 50 msg/mois
const checkAssistantLimit = async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (!planDef.features.includes('assistant')) {
      return res.status(403).json({
        error:       'Fonctionnalité non disponible',
        message:     "L'assistant IA requiert le plan Pro ou Enterprise. Upgradez votre plan pour accéder à cette fonctionnalité.",
        plan_actuel: plan,
        plan_requis: 'pro',
        upgrade:     true,
      })
    }

    // Pro : limite 50 messages/mois
    if (plan === 'pro' && planDef.assistant_limit !== Infinity) {
      const ownerId = await resolveOwnerId(req.user)
      if (ownerId) {
        const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        const r = await pool.query(
          `SELECT COUNT(*) FROM assistant_logs WHERE owner_id = $1 AND created_at >= $2`,
          [ownerId, debutMois]
        )
        const count = parseInt(r.rows[0].count)

        if (count >= planDef.assistant_limit) {
          return res.status(429).json({
            error:       'Limite mensuelle atteinte',
            message:     `Plan Pro : ${planDef.assistant_limit} messages/mois maximum. Passez en Enterprise pour un accès illimité.`,
            plan_actuel: plan,
            plan_requis: 'enterprise',
            upgrade:     true,
            count,
            limit:       planDef.assistant_limit,
          })
        }

        // Log avant traitement (comptabilisé même si l'IA échoue)
        await pool.query(
          `INSERT INTO assistant_logs (owner_id) VALUES ($1)`,
          [ownerId]
        )
      }
    }

    req.plan    = plan
    req.planDef = planDef
    next()
  } catch (err) {
    logger.error('checkAssistantLimit', err)
    next()
  }
}

module.exports = { checkPlan, checkMaxStations, checkMaxEmployes, checkAssistantLimit, getPlanOwner, PLANS }
