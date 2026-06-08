// ================================================
// FUELO V2 — Forgot Password Controller
// Fichier : backend/controllers/forgotPasswordController.js
// ================================================

const pool       = require('../config/database')
const bcrypt     = require('bcryptjs')
const crypto     = require('crypto')
const nodemailer = require('nodemailer')
const logger     = require('../utils/logger')

// ── Transporteur email ────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Diagnostic au démarrage — confirme que les variables sont bien lues
// SANS jamais loguer leur valeur (uniquement présence/longueur)
logger.info(
  `[email] Config transporter — service=${process.env.EMAIL_SERVICE || 'gmail (défaut)'} ` +
  `EMAIL_USER=${process.env.EMAIL_USER ? `défini (${process.env.EMAIL_USER})` : '❌ MANQUANT'} ` +
  `EMAIL_PASS=${process.env.EMAIL_PASS ? `défini (${process.env.EMAIL_PASS.length} caractères)` : '❌ MANQUANT'}`
)

// Vérifie la connexion/authentification SMTP dès le démarrage du serveur —
// permet de voir l'échec dans les logs Render sans attendre qu'un utilisateur
// déclenche /forgot-password
transporter.verify((err) => {
  if (err) {
    logger.error(
      `[email] Échec vérification SMTP au démarrage — code=${err.code ?? '?'} ` +
      `responseCode=${err.responseCode ?? '?'} command=${err.command ?? '?'} message=${err.message}`
    )
  } else {
    logger.info('[email] Connexion SMTP vérifiée avec succès — transporter prêt')
  }
})

// ── POST /auth/forgot-password ───────────────────────
const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ error: 'Email obligatoire' })
    }

    const result = await pool.query(
      'SELECT id, nom, email FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
      [email]
    )

    // Toujours répondre OK — sécurité (évite l'enumération d'emails)
    if (result.rows.length === 0) {
      return res.json({ message: 'Si cet email existe, un lien a été envoyé.' })
    }

    const user      = result.rows[0]
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    // Sauvegarder token
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expiresAt, user.id]
    )

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    logger.info(`[email] Envoi du lien de réinitialisation à ${user.email} via ${process.env.EMAIL_SERVICE || 'gmail'}...`)

    // Envoyer email
    await transporter.sendMail({
      from:    `"Fuelo ⛽" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'Réinitialisation de votre mot de passe Fuelo',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#F5F7FA;padding:32px;">
          <div style="background:#111827;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="font-size:22px;font-weight:800;color:#fff;margin:0;">
              fuel<span style="color:#F59E0B;">o</span>
            </p>
          </div>
          <div style="background:#fff;border-radius:14px;padding:28px;border:1px solid #E5E7EB;">
            <h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px;">
              Bonjour ${user.nom} 👋
            </h2>
            <p style="color:#6B7280;font-size:14px;line-height:1.6;margin-bottom:24px;">
              Vous avez demandé à réinitialiser votre mot de passe Fuelo.
              Cliquez sur le bouton ci-dessous — ce lien expire dans 15 minutes.
            </p>
            <a href="${resetUrl}"
               style="display:block;background:#F59E0B;color:#0F172A;text-decoration:none;
                      padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;
                      text-align:center;margin-bottom:20px;">
              Réinitialiser mon mot de passe →
            </a>
            <p style="color:#9CA3AF;font-size:12px;margin:0;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>
          <p style="text-align:center;color:#9CA3AF;font-size:12px;margin-top:20px;">
            © 2025 Fuelo
          </p>
        </div>
      `,
    })

    logger.info(`[email] ✅ Reset password envoyé à ${user.email}`)
    res.json({ message: 'Si cet email existe, un lien a été envoyé.' })
  } catch (err) {
    // Détail complet de l'erreur SMTP côté logs serveur (jamais renvoyé au client —
    // pourrait exposer des infos internes, cf. audit sécurité CWE-209)
    logger.error(
      `[email] ❌ Échec envoi forgotPassword — code=${err.code ?? '?'} ` +
      `responseCode=${err.responseCode ?? '?'} command=${err.command ?? '?'} ` +
      `response=${err.response ?? '?'} message=${err.message}`
    )
    res.status(500).json({ error: 'Erreur lors de l\'envoi' })
  }
}

// ── POST /auth/reset-password ────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe obligatoires' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' })
    }

    const result = await pool.query(
      `SELECT id, nom, email FROM users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()
         AND deleted_at IS NULL`,
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Lien invalide ou expiré. Demandez un nouveau lien.'
      })
    }

    const hash = await bcrypt.hash(password, 10)

    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, result.rows[0].id]
    )

    logger.info(`Mot de passe réinitialisé — ${result.rows[0].email}`)
    res.json({ message: 'Mot de passe modifié. Vous pouvez vous connecter.' })
  } catch (err) {
    logger.error('resetPassword', err)
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' })
  }
}

module.exports = { forgotPassword, resetPassword }