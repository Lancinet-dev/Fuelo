// ================================================
// FUELO — Middleware checkPlan
// Vérifie le plan d'abonnement avant les features sensibles
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

// Définition des plans et leurs limites
const PLANS = {
  starter: {
    label:             'Starter',
    max_stations:      1,
    max_employes:      3,        // 1 gérant + 2 pompistes
    features:          ['ventes', 'stock', 'alertes'],
    exports:           ['excel_basic'],
    upgrade_vers:      'pro',
  },
  pro: {
    label:             'Pro',
    max_stations:      3,
    max_employes:      5,
    features:          ['ventes', 'stock', 'alertes', 'services'],
    exports:           ['excel', 'pdf', 'rapports_mensuels'],
    upgrade_vers:      'enterprise',
  },
  enterprise: {
    label:             'Enterprise',
    max_stations:      Infinity,
    max_employes:      Infinity,
    features:          ['ventes', 'stock', 'alertes', 'services', 'trajets', 'citernes', 'logistique'],
    exports:           ['excel', 'pdf', 'rapports_mensuels', 'csv'],
    upgrade_vers:      null,
  },
}

// Récupérer le plan d'un utilisateur (owner direct ou via sa station)
const getPlanOwner = async (user) => {
  try {
    let ownerId = null

    if (user.role === 'owner' || user.role === 'superadmin') {
      ownerId = user.id
    } else {
      // Gérant/pompiste : trouver l'owner de la station
      const res = await pool.query(
        `SELECT owner_id FROM stations WHERE id = $1`,
        [user.station_id]
      )
      ownerId = res.rows[0]?.owner_id
    }

    if (!ownerId) return 'enterprise' // fallback : accès total si owner introuvable

    const sub = await pool.query(
      `SELECT plan, statut FROM subscriptions WHERE owner_id = $1`,
      [ownerId]
    )

    // Pas d'abonnement → enterprise par défaut (legacy clients)
    if (!sub.rows[0]) return 'enterprise'

    // Abonnement en attente ou expiré → starter
    const { plan, statut } = sub.rows[0]
    if (statut === 'expire') return 'starter'
    if (statut === 'en_attente') return 'starter'

    return plan ?? 'starter'
  } catch (err) {
    logger.error('checkPlan getPlanOwner', err)
    return 'enterprise' // fail-open en cas d'erreur DB
  }
}

// Middleware principal : vérifie qu'une feature est disponible dans le plan
const checkPlan = (feature) => async (req, res, next) => {
  try {
    const plan     = await getPlanOwner(req.user)
    const planDef  = PLANS[plan] ?? PLANS.enterprise

    if (!planDef.features.includes(feature)) {
      const planReqKey = Object.keys(PLANS).find(k => PLANS[k].features.includes(feature))
      const planReq    = PLANS[planReqKey]

      return res.status(403).json({
        error:       'Fonctionnalité non disponible',
        message:     `Cette fonctionnalité nécessite le plan ${planReq?.label ?? 'supérieur'}. Votre plan actuel : ${planDef.label}.`,
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
    next() // fail-open
  }
}

// Middleware : vérifie la limite du nombre de stations
const checkMaxStations = async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (planDef.max_stations === Infinity) return next()

    const count = await pool.query(
      `SELECT COUNT(*) FROM stations WHERE owner_id = $1`,
      [req.user.id]
    )
    const nb = parseInt(count.rows[0].count)

    if (nb >= planDef.max_stations) {
      return res.status(403).json({
        error:       'Limite de stations atteinte',
        message:     `Votre plan ${planDef.label} permet ${planDef.max_stations} station(s) maximum. Passez au plan ${PLANS[planDef.upgrade_vers]?.label ?? 'supérieur'} pour en ajouter.`,
        plan_actuel: plan,
        plan_requis: planDef.upgrade_vers,
        upgrade:     true,
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

// Middleware : vérifie la limite du nombre d'employés par station
const checkMaxEmployes = async (req, res, next) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const planDef = PLANS[plan] ?? PLANS.enterprise

    if (planDef.max_employes === Infinity) return next()

    const count = await pool.query(
      `SELECT COUNT(*) FROM users u
       JOIN station_users su ON su.user_id = u.id
       WHERE su.station_id = $1 AND u.deleted_at IS NULL
         AND u.role NOT IN ('owner', 'superadmin')`,
      [req.user.station_id]
    )
    const nb = parseInt(count.rows[0].count)

    if (nb >= planDef.max_employes) {
      return res.status(403).json({
        error:       'Limite d\'employés atteinte',
        message:     `Votre plan ${planDef.label} permet ${planDef.max_employes} employé(s) par station. Passez au plan ${PLANS[planDef.upgrade_vers]?.label ?? 'supérieur'}.`,
        plan_actuel: plan,
        plan_requis: planDef.upgrade_vers,
        upgrade:     true,
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

module.exports = { checkPlan, checkMaxStations, checkMaxEmployes, getPlanOwner, PLANS }
