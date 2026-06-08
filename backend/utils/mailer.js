// ================================================
// FUELO — Envoi d'emails via Resend (API HTTP)
//
// Remplace Nodemailer/SMTP : Render bloque (ou ne peut pas
// établir de façon fiable) les connexions SMTP sortantes
// (ports 465/587 vers smtp.gmail.com) — la requête restait
// bloquée ~60s puis la connexion était coupée. L'API Resend
// passe en HTTPS (port 443), jamais bloqué.
// ================================================

const logger = require('./logger')

const RESEND_API_URL = 'https://api.resend.com/emails'

// Sans domaine vérifié sur Resend, seul l'expéditeur sandbox
// "onboarding@resend.dev" est accepté — surchargeable via
// RESEND_FROM_EMAIL une fois un domaine (ex: fuelo.africa) vérifié
const FROM_DEFAUT = process.env.RESEND_FROM_EMAIL || 'Fuelo <onboarding@resend.dev>'

const envoyerEmail = async ({ to, subject, html, from = FROM_DEFAUT }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY manquante — impossible d'envoyer l'email")
  }

  const reponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '')
    throw new Error(`Resend a répondu ${reponse.status} — ${detail}`)
  }

  const resultat = await reponse.json()
  logger.info(`[email] ✅ Envoyé via Resend — id=${resultat.id} destinataire=${to}`)
  return resultat
}

module.exports = { envoyerEmail }
