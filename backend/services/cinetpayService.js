// ================================================
// FUELO — CinetPay v1 Aurore
// Auth : POST /v1/oauth/login → Bearer token (caché)
// Sandbox : CINETPAY_SANDBOX=true → simulation locale
// ================================================

const crypto = require('crypto')
const logger  = require('../utils/logger')

const CP_BASE  = 'https://api.cinetpay.net/v1'
const CURRENCY = process.env.CINETPAY_CURRENCY || 'GNF'

// ── Cache du token OAuth ──────────────────────────
let _tokenCache = { token: null, expiresAt: 0 }

async function getAccessToken() {
  const now = Date.now()
  if (_tokenCache.token && _tokenCache.expiresAt > now + 30_000) {
    return _tokenCache.token
  }

  const params = new URLSearchParams({
    api_key:      process.env.CINETPAY_API_KEY,
    api_password: process.env.CINETPAY_API_PASSWORD,
  })
  const res = await fetch(`${CP_BASE}/oauth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`CinetPay auth échoué (${res.status}): ${txt}`)
  }

  const data = await res.json()

  if (!data.access_token) {
    throw new Error(`CinetPay auth — token absent: ${JSON.stringify(data)}`)
  }

  _tokenCache = {
    token:     data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }
  logger.info('CinetPay — token OAuth renouvelé')
  return _tokenCache.token
}

// ── Helpers ───────────────────────────────────────
// CinetPay v1 : transaction_id alphanumérique, max 20 chars
function genTransactionId(ownerId) {
  const rand  = crypto.randomBytes(4).toString('hex') // 8 chars
  const owner = String(ownerId).slice(0, 8)           // up to 8 chars
  return `${owner}${rand}`.slice(0, 20)
}

function buildSandboxPaymentUrl({ transactionId, montant }) {
  const params = new URLSearchParams({
    transaction_id: transactionId,
    amount:         String(montant),
    currency:       CURRENCY,
    return_url:     `${process.env.FRONTEND_URL}/abonnements?status=success`,
    cancel_url:     `${process.env.FRONTEND_URL}/abonnements?status=cancel`,
  })
  return `${process.env.BACKEND_URL}/api/abonnements/sandbox/simulate?${params}`
}

// ── Initie un paiement ────────────────────────────
// Retourne { payment_url, transaction_id }
async function initiatePayment({ montant, ownerId, description, customerEmail, customerName }) {
  const isSandbox = ['true', '1', 'yes'].includes(
    (process.env.CINETPAY_SANDBOX ?? '').toLowerCase().trim()
  )
  const transactionId = genTransactionId(ownerId)

  if (isSandbox) {
    logger.info(`[SANDBOX] CinetPay — ${transactionId} — ${montant} ${CURRENCY}`)
    return {
      payment_url:    buildSandboxPaymentUrl({ transactionId, montant }),
      transaction_id: `SANDBOX-${transactionId}`,
    }
  }

  const token = await getAccessToken()

  const body = {
    transaction_id:  transactionId,
    amount:          montant,
    currency:        CURRENCY,
    description,
    return_url:      `${process.env.FRONTEND_URL}/abonnements?status=success`,
    notify_url:      `${process.env.BACKEND_URL}/api/abonnements/callback`,
    channels:        'ALL',
    lang:            'fr',
    customer_email:  customerEmail || 'client@fuelo.africa',
    customer_name:   customerName  || 'Client',
    customer_surname: 'Fuelo',
  }

  logger.info(`CinetPay — initiation ${transactionId} (${montant} ${CURRENCY})`)

  const res  = await fetch(`${CP_BASE}/payment`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()

  if (!res.ok || (data.code && String(data.code) !== '201' && String(data.code) !== '200')) {
    throw new Error(`CinetPay paiement échoué (${data.code ?? res.status}): ${data.message ?? ''} — ${data.description ?? ''}`)
  }

  return {
    payment_url:    data.data?.payment_url ?? data.payment_url,
    transaction_id: transactionId,
  }
}

// ── Vérifie le statut d'un paiement ──────────────
async function checkPayment(transactionId) {
  if (transactionId?.startsWith('SANDBOX-')) {
    return { status: 'ACCEPTED', sandbox: true }
  }

  const token = await getAccessToken()

  const res  = await fetch(`${CP_BASE}/payment/check`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ transaction_id: transactionId }),
  })
  const data = await res.json()

  if (!res.ok || (data.code && String(data.code) !== '00')) {
    throw new Error(`CinetPay check échoué (${data.code ?? res.status}): ${data.message ?? ''}`)
  }

  return data.data ?? data
}

module.exports = { initiatePayment, checkPayment }
