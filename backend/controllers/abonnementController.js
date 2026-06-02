// ================================================
// FUELO — Controller : Abonnements
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { PLANS, getPlanOwner } = require('../middleware/checkPlan')

const PRIX = { starter: 50, pro: 150, enterprise: 300 }

// ── GET /abonnements/mon-plan ────────────────────
const getMonPlan = async (req, res) => {
  try {
    const ownerId = req.user.id

    const sub = await pool.query(
      `SELECT * FROM subscriptions WHERE owner_id = $1`,
      [ownerId]
    )

    const plan = await getPlanOwner(req.user)

    res.json({
      plan,
      planDef:      PLANS[plan],
      abonnement:   sub.rows[0] ?? null,
      tous_les_plans: Object.entries(PLANS).map(([key, def]) => ({
        key,
        ...def,
        prix: PRIX[key],
        actuel: key === plan,
        max_stations: def.max_stations === Infinity ? 'Illimité' : def.max_stations,
        max_employes: def.max_employes === Infinity ? 'Illimité' : def.max_employes,
      })),
    })
  } catch (err) {
    logger.error('getMonPlan', err)
    res.status(500).json({ error: err.message })
  }
}

// ── POST /abonnements/souscrire ──────────────────
// Crée ou met à jour l'abonnement en statut "en_attente"
const souscrire = async (req, res) => {
  try {
    const ownerId        = req.user.id
    const { plan, payment_method, payment_phone } = req.body

    if (!['starter', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide' })
    }
    if (!payment_method || !payment_phone) {
      return res.status(400).json({ error: 'Méthode de paiement et numéro requis' })
    }

    const montant = PRIX[plan]

    // Upsert abonnement
    const result = await pool.query(
      `INSERT INTO subscriptions (owner_id, plan, statut, payment_method, payment_phone, montant, started_at, updated_at)
       VALUES ($1, $2, 'en_attente', $3, $4, $5, NOW(), NOW())
       ON CONFLICT (owner_id) DO UPDATE SET
         plan           = EXCLUDED.plan,
         statut         = 'en_attente',
         payment_method = EXCLUDED.payment_method,
         payment_phone  = EXCLUDED.payment_phone,
         montant        = EXCLUDED.montant,
         updated_at     = NOW()
       RETURNING *`,
      [ownerId, plan, payment_method, payment_phone, montant]
    )

    logger.info(`Abonnement en attente — Owner ${ownerId} — Plan ${plan} — ${payment_method} ${payment_phone}`)

    res.json({
      message: `Demande d'abonnement ${PLANS[plan].label} reçue. Statut : En attente de validation. Vous serez notifié par SMS.`,
      abonnement: result.rows[0],
    })
  } catch (err) {
    logger.error('souscrire', err)
    res.status(500).json({ error: err.message })
  }
}

// ── GET /abonnements/tous (superadmin) ───────────
const getTousAbonnements = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.nom AS owner_nom, u.email AS owner_email,
              (SELECT COUNT(*) FROM stations st WHERE st.owner_id = s.owner_id) AS nb_stations
       FROM subscriptions s
       JOIN users u ON u.id = s.owner_id
       ORDER BY s.updated_at DESC`
    )
    res.json({ abonnements: result.rows })
  } catch (err) {
    logger.error('getTousAbonnements', err)
    res.status(500).json({ error: err.message })
  }
}

// ── PUT /abonnements/:id/valider (superadmin) ────
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
    logger.error('validerAbonnement', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getMonPlan, souscrire, getTousAbonnements, validerAbonnement }
