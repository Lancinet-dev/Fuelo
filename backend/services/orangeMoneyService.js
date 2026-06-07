// ================================================
// FUELO — Orange Money Web Payment API (Guinée)
// Sandbox : ORANGE_MONEY_SANDBOX=true → simulation locale
// Prod    : renseigner CLIENT_ID / CLIENT_SECRET / MERCHANT_KEY
// ================================================

const logger = require('../utils/logger')

const OM_BASE  = 'https://api.orange.com'
const COUNTRY  = process.env.ORANGE_MONEY_COUNTRY  || 'GIN'
const CURRENCY = process.env.ORANGE_MONEY_CURRENCY || 'GNF'

// ── Cache du token OAuth (valide 3600s) ───────────
let _tokenCache = { token: null, expiresAt: 0 }

async function getToken() {
  const now = Date.now()
  if (_tokenCache.token && _tokenCache.expiresAt > now + 30_000) {
    return _tokenCache.token
  }

  const creds = Buffer.from(
    `${process.env.ORANGE_MONEY_CLIENT_ID}:${process.env.ORANGE_MONEY_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${OM_BASE}/oauth/v3/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept:         'application/json',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Orange Money auth échoué (${res.status}): ${txt}`)
  }

  const data = await res.json()
  _tokenCache = {
    token:     data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }
  logger.info('Orange Money — token OAuth renouvelé')
  return _tokenCache.token
}

// ── Sandbox : URL de simulation locale ───────────
function buildSandboxPaymentUrl({ orderId, montant }) {
  const params = new URLSearchParams({
    order_id:   orderId,
    amount:     String(montant),
    currency:   CURRENCY,
    return_url: `${process.env.FRONTEND_URL}/abonnements?status=success`,
    cancel_url: `${process.env.FRONTEND_URL}/abonnements?status=cancel`,
  })
  return `${process.env.BACKEND_URL}/api/abonnements/sandbox/simulate?${params}`
}

// ── Initie un paiement ────────────────────────────
// Retourne { payment_url, pay_token }
async function initiatePayment({ montant, orderId, description }) {

  // Mode sandbox : simulation sans appel Orange
  const isSandbox = ['true', '1', 'yes'].includes(
    (process.env.ORANGE_MONEY_SANDBOX ?? '').toLowerCase().trim()
  )
  if (isSandbox) {
    logger.info(`[SANDBOX] Orange Money — ${orderId} — ${montant} ${CURRENCY}`)
    return {
      payment_url: buildSandboxPaymentUrl({ orderId, montant }),
      pay_token:   `SANDBOX-${orderId}`,
      status:      'PENDING',
    }
  }

  // Mode production
  const token = await getToken()

  const body = {
    merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
    currency:     CURRENCY,
    order_id:     orderId,
    amount:       String(montant),
    return_url:   `${process.env.FRONTEND_URL}/abonnements?status=success`,
    cancel_url:   `${process.env.FRONTEND_URL}/abonnements?status=cancel`,
    notif_url:    `${process.env.BACKEND_URL}/api/abonnements/callback`,
    lang:         'fr',
    reference:    description,
  }

  logger.info(`Orange Money — initiation ${orderId} (${montant} ${CURRENCY})`)

  const res = await fetch(`${OM_BASE}/orange-money-webpay/${COUNTRY}/v1/webpayment`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Orange Money paiement échoué (${res.status}): ${txt}`)
  }

  return res.json()
}

// ── Vérifie le statut d'un paiement ──────────────
async function getPaymentStatus(payToken) {
  if (payToken?.startsWith('SANDBOX-')) {
    return { status: 'PENDING', pay_token: payToken, sandbox: true }
  }

  const token = await getToken()

  const res = await fetch(
    `${OM_BASE}/orange-money-webpay/${COUNTRY}/v1/webpayment/${payToken}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  )

  if (!res.ok) throw new Error(`Orange Money statut échoué (${res.status})`)
  return res.json()
}

module.exports = { initiatePayment, getPaymentStatus }
