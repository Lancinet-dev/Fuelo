// ================================================
// FUELO — Service Backup automatique DB Neon
// Fichier : backend/services/backupService.js
// ================================================

const zlib      = require('zlib')
const { promisify } = require('util')
const gzip      = promisify(zlib.gzip)
const pool      = require('../config/database')
const cloudinary = require('../config/cloudinary')
const logger    = require('../utils/logger')
const { envoyerEmail } = require('../utils/mailer')

const numFmt = (n) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// ── Exporter toutes les tables en JSON ───────────
const exporterTables = async () => {
  const { rows } = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  )
  const tables = rows.map(r => r.tablename)
  const data   = { version: '1.0', created_at: new Date().toISOString(), tables: {} }
  let totalRows = 0

  for (const table of tables) {
    const res = await pool.query(`SELECT * FROM "${table}"`)
    data.tables[table] = res.rows
    totalRows += res.rows.length
  }

  return { data, tables, totalRows }
}

// ── Backup principal ──────────────────────────────
const effectuerBackup = async () => {
  const debut = Date.now()
  logger.info('🗄️  Backup: Démarrage export DB...')

  const { data, tables, totalRows } = await exporterTables()

  const json       = JSON.stringify(data)
  const compressed = await gzip(Buffer.from(json))
  const tailleKo   = Math.round(compressed.length / 1024)

  const dateStr  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `backup_${dateStr}`

  // Upload sur Cloudinary (resource_type raw = tout type de fichier)
  const dataUri  = `data:application/gzip;base64,${compressed.toString('base64')}`
  const upload   = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'raw',
    folder:        'fuelo-backups',
    public_id:     filename,
    overwrite:     false,
  })

  const duree = Math.round((Date.now() - debut) / 1000)
  logger.info(`✅ Backup OK — ${tables.length} tables, ${numFmt(totalRows)} lignes, ${tailleKo} Ko, ${duree}s`)

  return { url: upload.secure_url, tables: tables.length, totalRows, tailleKo, duree, filename }
}

// ── Notification email ────────────────────────────
const envoyerEmailBackup = async (result, erreur = null) => {
  const dest    = process.env.ADMIN_EMAIL || process.env.EMAIL_USER
  const dateStr = new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Conakry' })

  if (erreur) {
    await envoyerEmail({
      to:      dest,
      subject: `❌ Fuelo — Backup DB ÉCHOUÉ (${dateStr})`,
      html:    `<h2>❌ Backup automatique échoué</h2><p><strong>Erreur :</strong> ${erreur}</p><p>Vérifiez les logs Render.</p>`,
    })
    return
  }

  await envoyerEmail({
    to:      dest,
    subject: `✅ Fuelo — Backup DB réussi (${dateStr})`,
    html: `
      <div style="font-family:sans-serif;max-width:500px">
        <h2 style="color:#2563EB">✅ Backup automatique Fuelo</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 0;color:#64748b">Date</td><td><strong>${dateStr}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Tables</td><td><strong>${result.tables}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Lignes</td><td><strong>${numFmt(result.totalRows)}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Taille (compressée)</td><td><strong>${result.tailleKo} Ko</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Durée</td><td><strong>${result.duree}s</strong></td></tr>
        </table>
        <p style="margin-top:16px">
          <a href="${result.url}" style="color:#2563EB">📦 Télécharger le backup (${result.filename}.gz)</a>
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Fuelo — Backup automatique quotidien</p>
      </div>
    `,
  })
}

// ── Point d'entrée appelé par le cron ────────────
const lancerBackup = async () => {
  try {
    const result = await effectuerBackup()
    await envoyerEmailBackup(result)
  } catch (err) {
    logger.error('❌ Backup échoué:', err.message)
    try {
      await envoyerEmailBackup(null, err.message)
    } catch (emailErr) {
      logger.error('Email backup failure notification échoué:', emailErr.message)
    }
  }
}

module.exports = { lancerBackup, effectuerBackup }
