// ================================================
// FUELO — Controller : Abonnements (Orange Money)
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { PLANS, getPlanOwner } = require('../middleware/checkPlan')
const OM = require('../services/orangeMoneyService')

const PRIX = { starter: 50, pro: 150, enterprise: 300 }
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

    // Initiation Orange Money (sandbox ou production)
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
      message:     payment_url
        ? 'Redirection vers Orange Money pour finaliser le paiement.'
        : `Demande reçue. Votre plan ${PLANS[plan].label} sera activé sous 24h après vérification.`,
      abonnement:  result.rows[0],
      payment_url,
    })
  } catch (err) {
    logger.error('souscrire', err)
    res.status(500).json({ error: err.message })
  }
}

// ── POST /abonnements/callback (webhook Orange Money) ──
// Route publique — Orange Money POST cette URL après paiement
const handleCallback = async (req, res) => {
  try {
    const { status, txnid, order_id } = req.body
    const ref = txnid || order_id

    logger.info(`Orange Money callback — status: ${status} — ref: ${ref}`)

    if ((status === 'SUCCESS' || status === 'success') && ref) {
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
      logger.warn(`Callback Orange Money — statut non-SUCCESS: ${status}`)
    }

    res.json({ status: 'received' })
  } catch (err) {
    logger.error('handleCallback', err)
    res.status(500).json({ error: err.message })
  }
}

// ── GET /abonnements/sandbox/simulate ────────────
// Page HTML de simulation paiement Orange Money (sandbox uniquement)
const sandboxSimulate = (req, res) => {
  const isSandbox = ['true', '1', 'yes'].includes(
    (process.env.ORANGE_MONEY_SANDBOX ?? '').toLowerCase().trim()
  )
  if (!isSandbox) {
    return res.status(404).json({ error: 'Non disponible en production' })
  }

  const { order_id, amount, currency, return_url, cancel_url } = req.query

  // Valeurs sérialisées en JSON pour injection sécurisée dans le JS
  const jsOrderId    = JSON.stringify(order_id   || '')
  const jsReturnUrl  = JSON.stringify(return_url  || '/')
  const jsCancelUrl  = JSON.stringify(cancel_url  || '/')
  const jsCallbackUrl = JSON.stringify(`${process.env.BACKEND_URL}/api/abonnements/callback`)

  const montantFormate = amount
    ? Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : '—'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orange Money — Simulation Sandbox</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f4f4;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }
    .card {
      background: #fff; border-radius: 24px;
      padding: 40px 32px 36px;
      max-width: 400px; width: 100%;
      box-shadow: 0 12px 48px rgba(0,0,0,0.12);
      text-align: center;
    }
    /* Logo Orange Money */
    .om-logo {
      width: 72px; height: 72px; border-radius: 50%;
      background: #FF6B00;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .om-inner {
      width: 48px; height: 48px; border-radius: 50%;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .om-dot { width: 30px; height: 30px; border-radius: 50%; background: #FF6B00; }
    h1   { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 4px; }
    .sub { font-size: 14px; color: #888; margin-bottom: 10px; }
    .badge-sandbox {
      display: inline-block;
      background: #FFF3E0; color: #E65100;
      font-size: 10px; font-weight: 800;
      padding: 3px 12px; border-radius: 20px;
      letter-spacing: 0.08em; margin-bottom: 28px;
    }
    .info-box {
      background: #f9f9f9; border-radius: 14px;
      padding: 16px 18px; margin-bottom: 28px;
      text-align: left;
    }
    .info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .info-value { font-size: 14px; color: #111; font-weight: 700; }
    .info-value.ref { font-size: 12px; color: #555; font-family: monospace; }
    .montant { font-size: 28px; font-weight: 900; color: #FF6B00; margin: 16px 0 28px; }
    .montant span { font-size: 14px; font-weight: 500; color: #aaa; }
    .btn {
      width: 100%; height: 54px; border-radius: 14px; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; margin-bottom: 12px;
      transition: all 0.15s; display: flex; align-items: center;
      justify-content: center; gap: 8px;
    }
    .btn:hover:not(:disabled) { transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-confirm { background: #FF6B00; color: #fff; box-shadow: 0 4px 16px rgba(255,107,0,0.30); }
    .btn-cancel  { background: #f0f0f0; color: #555; }
    .loader {
      display: none; width: 18px; height: 18px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .notice { font-size: 12px; color: #bbb; margin-top: 8px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="om-logo"><div class="om-inner"><div class="om-dot"></div></div></div>
    <h1>Orange Money</h1>
    <div class="sub">Paiement mobile sécurisé</div>
    <div class="badge-sandbox">SANDBOX — TEST UNIQUEMENT</div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Référence</span>
        <span class="info-value ref">${order_id || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Devise</span>
        <span class="info-value">${currency || 'GNF'}</span>
      </div>
    </div>

    <div class="montant">${montantFormate} <span>${currency || 'GNF'}</span></div>

    <button class="btn btn-confirm" id="btnConfirm" onclick="confirmerPaiement()">
      <div class="loader" id="loader"></div>
      <span id="btnText">Confirmer le paiement</span>
    </button>
    <button class="btn btn-cancel" id="btnCancel" onclick="annulerPaiement()">
      Annuler
    </button>
    <div class="notice">
      Ceci est un environnement de test.<br>
      Aucun vrai paiement n'est effectué.
    </div>
  </div>

  <script>
    async function confirmerPaiement() {
      const btn    = document.getElementById('btnConfirm')
      const loader = document.getElementById('loader')
      const txt    = document.getElementById('btnText')
      btn.disabled = true
      document.getElementById('btnCancel').disabled = true
      loader.style.display = 'block'
      txt.textContent = 'Traitement...'

      try {
        const callbackUrl = ${jsCallbackUrl}
        const orderId     = ${jsOrderId}
        await fetch(callbackUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status:   'SUCCESS',
            order_id: orderId,
            txnid:    'SANDBOX-' + orderId,
          }),
        })
        window.location.href = ${jsReturnUrl}
      } catch (e) {
        alert('Erreur simulation : ' + e.message)
        btn.disabled = false
        document.getElementById('btnCancel').disabled = false
        loader.style.display = 'none'
        txt.textContent = 'Confirmer le paiement'
      }
    }

    function annulerPaiement() {
      window.location.href = ${jsCancelUrl}
    }
  </script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
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

module.exports = {
  getMonPlan,
  souscrire,
  handleCallback,
  sandboxSimulate,
  getTousAbonnements,
  validerAbonnement,
}
