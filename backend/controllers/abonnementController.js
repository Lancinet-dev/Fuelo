// ================================================
// FUELO — Controller : Abonnements (Orange Money)
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { PLANS, getPlanOwner } = require('../middleware/checkPlan')
const OM = require('../services/orangeMoneyService')

const PRIX = { starter: 50, pro: 150, enterprise: 300 }

// Conversion USD → GNF (modifiable via env)
const getTauxGNF = () => parseInt(process.env.USD_TO_GNF) || 8600

// ── GET /abonnements ─────────────────────────────
const getMonPlan = async (req, res) => {
  try {
    const ownerId = req.user.id
    const sub     = await pool.query(`SELECT * FROM subscriptions WHERE owner_id = $1`, [ownerId])
    const plan    = await getPlanOwner(req.user)

    res.json({
      plan,
      planDef:    PLANS[plan],
      abonnement: sub.rows[0] ?? null,
      tous_les_plans: Object.entries(PLANS).map(([key, def]) => ({
        key,
        ...def,
        prix:         PRIX[key],
        prix_gnf:     Math.round(PRIX[key] * getTauxGNF()),
        actuel:       key === plan,
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
const souscrire = async (req, res) => {
  try {
    const ownerId = req.user.id
    const { plan, payment_phone } = req.body

    if (!['starter', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide' })
    }
    const phone = (payment_phone ?? '').replace(/\D/g, '')
    if (phone.length < 8) {
      return res.status(400).json({ error: 'Numéro Orange Money invalide (min 8 chiffres)' })
    }

    const montantUSD = PRIX[plan]
    const montantGNF = Math.round(montantUSD * getTauxGNF())
    const orderId    = `FUELO-${ownerId}-${Date.now()}`

    let payment_url = null
    let pay_token   = orderId

    // Initiation Orange Money (API live si credentials configurés)
    const omReady = process.env.ORANGE_MONEY_CLIENT_ID && process.env.ORANGE_MONEY_MERCHANT_KEY
    if (omReady) {
      try {
        const omData = await OM.initiatePayment({
          montant:     montantGNF,
          orderId,
          description: `Abonnement Fuelo ${PLANS[plan].label}`,
        })
        payment_url = omData.payment_url
        pay_token   = omData.pay_token ?? orderId
      } catch (omErr) {
        // Fallback manuel si l'API OM est indisponible
        logger.warn(`Orange Money API indisponible — fallback manuel: ${omErr.message}`)
      }
    }

    const result = await pool.query(
      `INSERT INTO subscriptions
         (owner_id, plan, statut, payment_method, payment_phone, montant, transaction_id, started_at, updated_at)
       VALUES ($1, $2, 'en_attente', 'orange_money', $3, $4, $5, NOW(), NOW())
       ON CONFLICT (owner_id) DO UPDATE SET
         plan           = EXCLUDED.plan,
         statut         = 'en_attente',
         payment_method = 'orange_money',
         payment_phone  = EXCLUDED.payment_phone,
         montant        = EXCLUDED.montant,
         transaction_id = EXCLUDED.transaction_id,
         updated_at     = NOW()
       RETURNING *`,
      [ownerId, plan, phone, montantUSD, pay_token]
    )

    logger.info(`Abonnement Orange Money — Owner ${ownerId} — Plan ${plan} — ${phone}`)

    res.json({
      message: payment_url
        ? 'Redirection vers Orange Money pour finaliser le paiement.'
        : `Demande reçue. Votre plan ${PLANS[plan].label} sera activé sous 24h après vérification.`,
      abonnement: result.rows[0],
      payment_url,
    })
  } catch (err) {
    logger.error('souscrire', err)
    res.status(500).json({ error: err.message })
  }
}

// ── POST /abonnements/callback (webhook Orange Money) ──
// Route publique — Orange Money appelle cette URL après paiement
const handleCallback = async (req, res) => {
  try {
    const { status, txnid, order_id } = req.body
    const ref = txnid || order_id

    logger.info(`Orange Money callback — status: ${status} — ref: ${ref}`)

    if (status === 'SUCCESS' && ref) {
      const upd = await pool.query(
        `UPDATE subscriptions
         SET statut     = 'actif',
             started_at = NOW(),
             expires_at = NOW() + INTERVAL '30 days',
             updated_at = NOW()
         WHERE transaction_id = $1
         RETURNING owner_id, plan`,
        [ref]
      )
      if (upd.rows[0]) {
        logger.info(`Abonnement activé — owner ${upd.rows[0].owner_id} — plan ${upd.rows[0].plan}`)
      } else {
        logger.warn(`Callback OM sans abonnement correspondant — ref: ${ref}`)
      }
    } else {
      logger.warn(`Callback Orange Money — statut: ${status}`)
    }

    res.json({ status: 'received' })
  } catch (err) {
    logger.error('handleCallback', err)
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

    logger.info(`Abonnement validé manuellement — ID ${id}`)
    res.json({ message: 'Abonnement activé', abonnement: result.rows[0] })
  } catch (err) {
    logger.error('validerAbonnement', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getMonPlan, souscrire, handleCallback, getTousAbonnements, validerAbonnement }
