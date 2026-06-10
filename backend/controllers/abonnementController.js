// ================================================
// FUELO — Controller : Abonnements (CinetPay)
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')
const { PLANS, getPlanOwner } = require('../middleware/checkPlan')
const CP = require('../services/cinetpayService')

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
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── POST /abonnements/souscrire ──────────────────
const souscrire = async (req, res) => {
  try {
    const ownerId = req.user.id
    const { plan } = req.body

    if (!['starter', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide' })
    }

    const montantUSD = PRIX[plan]
    const montantGNF = Math.round(montantUSD * getTauxGNF())

    let payment_url    = null
    let transaction_id = `MANUAL-${ownerId}-${Date.now()}`

    try {
      const cpData = await CP.initiatePayment({
        montant:       montantGNF,
        ownerId,
        description:   `Abonnement Fuelo ${PLANS[plan].label}`,
        customerEmail: req.user.email,
        customerName:  req.user.nom ?? 'Client',
      })
      payment_url    = cpData.payment_url
      transaction_id = cpData.transaction_id
    } catch (cpErr) {
      logger.warn(`CinetPay API indisponible — fallback manuel: ${cpErr.message}`)
    }

    const result = await pool.query(
      `INSERT INTO subscriptions
         (owner_id, plan, statut, payment_method, montant, transaction_id, started_at, updated_at)
       VALUES ($1, $2, 'en_attente', 'cinetpay', $3, $4, NOW(), NOW())
       ON CONFLICT (owner_id) DO UPDATE SET
         plan           = EXCLUDED.plan,
         statut         = 'en_attente',
         payment_method = 'cinetpay',
         montant        = EXCLUDED.montant,
         transaction_id = EXCLUDED.transaction_id,
         updated_at     = NOW()
       RETURNING *`,
      [ownerId, plan, montantUSD, transaction_id]
    )

    logger.info(`Abonnement CinetPay — Owner ${ownerId} — Plan ${plan}`)

    res.json({
      message:    payment_url
        ? 'Redirection vers CinetPay pour finaliser le paiement.'
        : `Demande reçue. Votre plan ${PLANS[plan].label} sera activé sous 24h après vérification.`,
      abonnement: result.rows[0],
      payment_url,
    })
  } catch (err) {
    logger.error('souscrire', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── POST /abonnements/callback (webhook CinetPay) ──
// Route publique — CinetPay POST cette URL après paiement
const handleCallback = async (req, res) => {
  try {
    const { cpm_trans_id, cpm_trans_status } = req.body

    // Compatibilité sandbox (envoie transaction_id au lieu de cpm_trans_id)
    const transactionId = cpm_trans_id || req.body.transaction_id
    const status        = cpm_trans_status || req.body.status

    logger.info(`CinetPay callback — status: ${status} — ref: ${transactionId}`)

    if (!transactionId) {
      return res.status(400).json({ error: 'transaction_id manquant' })
    }

    // Sandbox : activation directe sans vérification API
    const isSandbox = String(transactionId).startsWith('SANDBOX-')

    let accepted = false

    if (isSandbox) {
      accepted = true
    } else if (status === 'ACCEPTED') {
      // Vérification serveur pour éviter les faux callbacks
      try {
        const check = await CP.checkPayment(transactionId)
        accepted = check.status === 'ACCEPTED'
      } catch (checkErr) {
        logger.warn(`CinetPay check échoué: ${checkErr.message}`)
      }
    }

    if (accepted) {
      const upd = await pool.query(
        `UPDATE subscriptions
         SET statut     = 'actif',
             started_at = NOW(),
             expires_at = NOW() + INTERVAL '30 days',
             updated_at = NOW()
         WHERE transaction_id = $1
         RETURNING owner_id, plan`,
        [transactionId]
      )
      if (upd.rows[0]) {
        logger.info(`Abonnement activé — owner ${upd.rows[0].owner_id} — plan ${upd.rows[0].plan}`)
      } else {
        logger.warn(`Callback CinetPay sans abonnement correspondant — ref: ${transactionId}`)
      }
    } else {
      logger.warn(`Callback CinetPay — statut non-ACCEPTED: ${status}`)
    }

    res.json({ status: 'received' })
  } catch (err) {
    logger.error('handleCallback', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── GET /abonnements/sandbox/simulate ────────────
// Page HTML de simulation paiement CinetPay (sandbox uniquement)
const sandboxSimulate = (req, res) => {
  const isSandbox = ['true', '1', 'yes'].includes(
    (process.env.CINETPAY_SANDBOX ?? '').toLowerCase().trim()
  )
  if (!isSandbox) {
    return res.status(404).json({ error: 'Non disponible en production' })
  }

  const { transaction_id, amount, currency, return_url, cancel_url } = req.query

  const echapperHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))

  const txAffiche       = echapperHTML(transaction_id)
  const currencyAffiche = echapperHTML(currency)

  const jsTransactionId = JSON.stringify(transaction_id  || '')
  const jsReturnUrl     = JSON.stringify(return_url       || '/')
  const jsCancelUrl     = JSON.stringify(cancel_url       || '/')
  const jsCallbackUrl   = JSON.stringify(`${process.env.BACKEND_URL}/api/abonnements/callback`)

  const montantFormate = amount
    ? Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : '—'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CinetPay — Simulation Sandbox</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F0F4FF;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 20px;
    }
    .card {
      background: #fff; border-radius: 24px;
      padding: 40px 32px 36px;
      max-width: 420px; width: 100%;
      box-shadow: 0 12px 48px rgba(0,0,0,0.12);
      text-align: center;
    }
    .cp-logo {
      display: inline-flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
    }
    .cp-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #1A5CFF, #0040CC);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(26,92,255,0.30);
    }
    .cp-icon svg { width: 28px; height: 28px; }
    .cp-name { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.3px; }
    .sub  { font-size: 14px; color: #888; margin-bottom: 10px; }
    .badge-sandbox {
      display: inline-block;
      background: #EEF2FF; color: #4338CA;
      font-size: 10px; font-weight: 800;
      padding: 3px 12px; border-radius: 20px;
      letter-spacing: 0.08em; margin-bottom: 28px;
    }
    .info-box {
      background: #f9f9f9; border-radius: 14px;
      padding: 16px 18px; margin-bottom: 20px;
      text-align: left;
    }
    .info-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-size: 12px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
    .info-value { font-size: 14px; color: #111; font-weight: 700; }
    .info-value.ref { font-size: 11px; color: #555; font-family: monospace; }
    .montant { font-size: 28px; font-weight: 900; color: #1A5CFF; margin: 16px 0 24px; }
    .montant span { font-size: 14px; font-weight: 500; color: #aaa; }
    .methods {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-bottom: 28px; flex-wrap: wrap;
    }
    .method-badge {
      padding: 4px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 700;
    }
    .btn {
      width: 100%; height: 54px; border-radius: 14px; border: none;
      font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; margin-bottom: 12px;
      transition: all 0.15s; display: flex; align-items: center;
      justify-content: center; gap: 8px;
    }
    .btn:hover:not(:disabled) { transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-confirm { background: linear-gradient(135deg, #1A5CFF, #0040CC); color: #fff; box-shadow: 0 4px 16px rgba(26,92,255,0.30); }
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
    <div class="cp-logo">
      <div class="cp-icon">
        <svg viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="11" stroke="#fff" stroke-width="2.5"/>
          <path d="M9 14h10M14 9v10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="cp-name">CinetPay</span>
    </div>
    <div class="sub">Paiement mobile sécurisé — Afrique de l'Ouest</div>
    <div class="badge-sandbox">SANDBOX — TEST UNIQUEMENT</div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Référence</span>
        <span class="info-value ref">${txAffiche || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Devise</span>
        <span class="info-value">${currencyAffiche || 'GNF'}</span>
      </div>
    </div>

    <div class="montant">${montantFormate} <span>${currencyAffiche || 'GNF'}</span></div>

    <div class="methods">
      <span class="method-badge" style="background:#FFF3E0;color:#E65100">Orange Money</span>
      <span class="method-badge" style="background:#FFFDE7;color:#F57F17">MTN MoMo</span>
      <span class="method-badge" style="background:#E3F2FD;color:#1565C0">Wave</span>
      <span class="method-badge" style="background:#E8F5E9;color:#2E7D32">Moov Money</span>
    </div>

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
        const callbackUrl   = ${jsCallbackUrl}
        const transactionId = ${jsTransactionId}
        await fetch(callbackUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpm_trans_id:     'SANDBOX-' + transactionId,
            cpm_trans_status: 'ACCEPTED',
            cpm_site_id:      'SANDBOX',
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
    res.status(500).json({ error: erreurServeur(err) })
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
    res.status(500).json({ error: erreurServeur(err) })
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
