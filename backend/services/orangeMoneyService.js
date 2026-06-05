// ================================================
// FUELO — Orange Money Web Payment API (Guinée)
// Doc : https://developer.orange.com/apis/orange-money-webpay-gin
// ================================================

const logger = require('../utils/logger')

const OM_BASE  = 'https://api.orange.com'
const COUNTRY  = process.env.ORANGE_MONEY_COUNTRY  || 'GIN'
const CURRENCY = process.env.ORANGE_MONEY_CURRENCY || 'GNF'

// ── Récupère le token OAuth 2.0 ──────────────────
async function getToken() {
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

  const { access_token } = await res.json()
  return access_token
}

// ── Initie un paiement — retourne { payment_url, pay_token } ──
async function initiatePayment({ montant, orderId, description }) {
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

  logger.info(`Orange Money — initiation paiement ${orderId} (${montant} ${CURRENCY})`)

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
  const token = await getToken()

  const res = await fetch(
    `${OM_BASE}/orange-money-webpay/${COUNTRY}/v1/webpayment/${payToken}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  )

  if (!res.ok) throw new Error(`Orange Money statut échoué (${res.status})`)
  return res.json()
}

module.exports = { initiatePayment, getPaymentStatus }
