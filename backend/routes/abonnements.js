// ================================================
// FUELO — Routes abonnements (CinetPay)
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isOwner, isAdmin } = require('../middleware/checkRole')
const {
  getMonPlan,
  souscrire,
  handleCallback,
  sandboxSimulate,
  getTousAbonnements,
  validerAbonnement,
  getStatutTrial,
} = require('../controllers/abonnementController')
const { getPlanOwner, PLANS } = require('../middleware/checkPlan')
const erreurServeur = require('../utils/erreurServeur')
const logger = require('../utils/logger')

// Plan léger — accessible à tous les rôles (gérant, pompiste, logisticien…)
router.get('/mon-plan', verifyToken, async (req, res) => {
  try {
    const plan    = await getPlanOwner(req.user)
    const def     = PLANS[plan] ?? PLANS.starter
    res.json({
      plan,
      planDef: {
        label:        def.label,
        max_stations: def.max_stations === Infinity ? null : def.max_stations,
        max_employes: def.max_employes === Infinity ? null : def.max_employes,
        features:     def.features,
        assistant_limit: def.assistant_limit === Infinity ? null : def.assistant_limit,
        upgrade_vers: def.upgrade_vers,
      },
    })
  } catch (err) {
    logger.error('monPlan', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
})

// Statut de l'essai gratuit — accessible à tous les rôles
router.get('/statut-trial', verifyToken, getStatutTrial)

router.get('/',           verifyToken, isOwner, getMonPlan)
router.post('/souscrire', verifyToken, isOwner, souscrire)

// Webhook CinetPay — public (appelé par CinetPay après paiement)
router.post('/callback', handleCallback)

// Page de simulation sandbox (actif uniquement si ORANGE_MONEY_SANDBOX=true)
router.get('/sandbox/simulate', sandboxSimulate)

// Superadmin
router.get('/tous',        verifyToken, isAdmin, getTousAbonnements)
router.put('/:id/valider', verifyToken, isAdmin, validerAbonnement)

module.exports = router
