// ================================================
// FUELO — Service Rapport PDF + Email
// Fichier : backend/services/reportService.js
// ================================================

const PDFDocument = require('pdfkit')
const nodemailer  = require('nodemailer')
const pool        = require('../config/database')
const logger      = require('../utils/logger')

// ── Transporter email ─────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// ── Formater nombre sans toLocaleString ──────────
const numFmt = (v) => {
  const n = Math.round(Number(v) || 0)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ── Générer PDF en buffer ─────────────────────────
const generatePDF = (station, ventes, stocks, mois) => {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks = []

    doc.on('data',  chunk => chunks.push(chunk))
    doc.on('end',   ()    => resolve(Buffer.concat(chunks)))
    doc.on('error', err   => reject(err))

    // ── Header ──────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill('#0D1B2A')
    doc.rect(0, 0, 6, 80).fill('#F59E0B')

    doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold')
    doc.text('FUELO', 50, 25)
    doc.fontSize(10).font('Helvetica').fillColor('#94A3B8')
    doc.text('Rapport mensuel automatique', 50, 52)
    doc.text(`Station : ${station.nom}`, 50, 64)

    doc.fillColor('#FFFFFF').fontSize(10)
    doc.text(`Periode : ${mois}`, 400, 40, { align: 'right', width: 145 })
    doc.fillColor('#94A3B8')
    doc.text(`Genere le : ${new Date().toLocaleDateString('fr-FR')}`, 400, 55, { align: 'right', width: 145 })

    // ── Stats principales ───────────────────────────
    doc.moveDown(4)
    const totalLitres  = ventes.reduce((s, v) => s + parseFloat(v.litres || 0), 0)
    const totalMontant = ventes.reduce((s, v) => s + parseFloat(v.montant_gnf || 0), 0)
    const nbVentes     = ventes.length
    const avgTicket    = nbVentes > 0 ? totalMontant / nbVentes : 0

    const cards = [
      { label: 'Transactions', value: String(nbVentes),           color: '#2563EB' },
      { label: 'Litres vendus', value: `${numFmt(totalLitres)} L`, color: '#10B981' },
      { label: 'Montant total', value: `${numFmt(totalMontant)} GNF`, color: '#F59E0B' },
      { label: 'Ticket moyen', value: `${numFmt(avgTicket)} GNF`,  color: '#EF4444' },
    ]

    let cx = 50
    cards.forEach(card => {
      doc.rect(cx, 100, 115, 55).fillAndStroke('#F8FAFC', '#E2E8F0')
      doc.rect(cx, 100, 4, 55).fill(card.color)
      doc.fillColor('#64748B').fontSize(7).font('Helvetica')
      doc.text(card.label.toUpperCase(), cx + 10, 110)
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold')
      doc.text(card.value, cx + 10, 125, { width: 100 })
      cx += 125
    })

    // ── Repartition par carburant ───────────────────
    doc.moveDown(6)
    doc.fillColor('#1E293B').fontSize(13).font('Helvetica-Bold')
    doc.text('Repartition par carburant', 50, 175)

    const essence = ventes.filter(v => v.type === 'essence')
    const gasoil  = ventes.filter(v => v.type === 'gasoil')

    const typeData = [
      { label: 'Essence', data: essence, color: '#2563EB' },
      { label: 'Gasoil',  data: gasoil,  color: '#10B981' },
    ]

    typeData.forEach((t, i) => {
      const x   = 50 + i * 250
      const lit = t.data.reduce((s, v) => s + parseFloat(v.litres || 0), 0)
      const mon = t.data.reduce((s, v) => s + parseFloat(v.montant_gnf || 0), 0)
      doc.rect(x, 195, 230, 60).fillAndStroke('#FFFFFF', '#E2E8F0')
      doc.circle(x + 12, 210, 5).fill(t.color)
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold')
      doc.text(t.label, x + 22, 204)
      doc.fillColor('#64748B').fontSize(9).font('Helvetica')
      doc.text(`${t.data.length} transactions`, x + 10, 222)
      doc.text(`${numFmt(lit)} L`, x + 10, 234)
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold')
      doc.text(`${numFmt(mon)} GNF`, x + 10, 245)
    })

    // ── Stock actuel ────────────────────────────────
    doc.fillColor('#1E293B').fontSize(13).font('Helvetica-Bold')
    doc.text('Stock actuel', 50, 275)

    stocks.forEach((s, i) => {
      const x   = 50 + i * 250
      const pct = Math.min(100, (s.quantite / 5000) * 100)
      doc.rect(x, 293, 230, 50).fillAndStroke('#F8FAFC', '#E2E8F0')
      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold')
      doc.text(`${s.type.charAt(0).toUpperCase() + s.type.slice(1)}`, x + 10, 300)
      doc.fillColor('#2563EB').fontSize(13)
      doc.text(`${numFmt(s.quantite)} L`, x + 10, 314)
      // Barre progression
      doc.rect(x + 10, 332, 200, 5).fill('#E2E8F0')
      doc.rect(x + 10, 332, pct * 2, 5).fill(s.quantite < 300 ? '#EF4444' : '#10B981')
    })

    // ── Tableau ventes ──────────────────────────────
    doc.fillColor('#1E293B').fontSize(13).font('Helvetica-Bold')
    doc.text('Detail des ventes', 50, 360)

    // Header tableau
    doc.rect(50, 375, 495, 22).fill('#0D1B2A')
    const cols = ['#', 'Type', 'Employe', 'Litres', 'Montant GNF', 'Date']
    const widths = [30, 60, 140, 60, 110, 95]
    let colX = 55
    cols.forEach((col, i) => {
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
      doc.text(col, colX, 381, { width: widths[i] })
      colX += widths[i]
    })

    // Lignes
    const maxRows = Math.min(ventes.length, 20)
    ventes.slice(0, maxRows).forEach((v, idx) => {
      const y  = 397 + idx * 18
      const bg = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF'
      doc.rect(50, y, 495, 18).fill(bg)
      colX = 55
      const row = [
        String(v.id),
        v.type,
        String(v.employe_nom || 'Pompiste').slice(0, 18),
        `${numFmt(v.litres)} L`,
        `${numFmt(v.montant_gnf)} GNF`,
        new Date(v.created_at).toLocaleDateString('fr-FR'),
      ]
      row.forEach((cell, i) => {
        doc.fillColor('#1E293B').fontSize(8).font('Helvetica')
        doc.text(cell, colX, y + 5, { width: widths[i] })
        colX += widths[i]
      })
    })

    if (ventes.length > 20) {
      const y = 397 + 20 * 18
      doc.fillColor('#64748B').fontSize(8).font('Helvetica')
      doc.text(`... et ${ventes.length - 20} autres transactions`, 55, y + 5)
    }

    // ── Footer ──────────────────────────────────────
    doc.rect(50, 780, 495, 1).fill('#E2E8F0')
    doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
    doc.text('Fuelo - Gestion intelligente de stations-service', 50, 788)
    doc.text('fuelo-kappa.vercel.app', 400, 788, { align: 'right', width: 145 })

    doc.end()
  })
}

// ── Récupérer données du mois précédent ───────────
const getMonthData = async (station_id, year, month) => {
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 1)

  const [ventesRes, stocksRes, stationRes] = await Promise.all([
    pool.query(
      `SELECT v.*, u.nom as employe_nom
       FROM ventes v
       LEFT JOIN users u ON u.id = v.user_id
       WHERE v.station_id = $1
         AND v.created_at >= $2 AND v.created_at < $3
         AND v.deleted_at IS NULL
       ORDER BY v.created_at DESC`,
      [station_id, start, end]
    ),
    pool.query(
      'SELECT type, quantite FROM stocks WHERE station_id = $1',
      [station_id]
    ),
    pool.query(
      'SELECT nom, email, ville, pays FROM stations WHERE id = $1',
      [station_id]
    ),
  ])

  return {
    ventes:  ventesRes.rows,
    stocks:  stocksRes.rows,
    station: stationRes.rows[0],
  }
}

// ── Envoyer rapport par email ─────────────────────
const sendRapportEmail = async (email, nom, pdfBuffer, mois, stationNom) => {
  await transporter.sendMail({
    from:    `"Fuelo" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `📊 Rapport mensuel Fuelo — ${mois} — ${stationNom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0D1B2A; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">fuel<span style="color: #F59E0B;">o</span></h1>
          <p style="color: #94A3B8; margin: 8px 0 0;">Rapport mensuel automatique</p>
        </div>
        <div style="background: #F8FAFC; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #E2E8F0;">
          <p style="color: #1E293B; font-size: 16px;">Bonjour <strong>${nom}</strong>,</p>
          <p style="color: #475569;">Voici votre rapport mensuel automatique pour <strong>${stationNom}</strong> — période : <strong>${mois}</strong>.</p>
          <p style="color: #475569;">Le rapport PDF est joint à cet email.</p>
          <div style="margin: 24px 0;">
            <a href="https://fuelo-kappa.vercel.app" style="background: #2563EB; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Voir le dashboard →
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
          <p style="color: #94A3B8; font-size: 12px;">Fuelo — Gestion intelligente de stations-service en Afrique</p>
        </div>
      </div>
    `,
    attachments: [{
      filename:    `Fuelo_Rapport_${stationNom}_${mois}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }],
  })
}

// ── Générer et envoyer rapport pour une station ───
const envoyerRapportStation = async (station_id, year, month) => {
  try {
    const moisLabels = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    const mois = `${moisLabels[month - 1]} ${year}`

    const { ventes, stocks, station } = await getMonthData(station_id, year, month)

    logger.info(`Génération rapport ${mois} — Station ${station_id} — ${ventes.length} ventes`)

    const pdfBuffer = await generatePDF(station, ventes, stocks, mois)

    // Trouver le owner de la station
    const ownerRes = await pool.query(
      `SELECT u.email, u.nom FROM users u
       JOIN station_users su ON su.user_id = u.id
       WHERE su.station_id = $1 AND u.role = 'owner' AND u.actif = true
       LIMIT 1`,
      [station_id]
    )

    if (ownerRes.rows.length > 0) {
      const owner = ownerRes.rows[0]
      await sendRapportEmail(owner.email, owner.nom, pdfBuffer, mois, station.nom)
      logger.info(`Rapport envoyé à ${owner.email} pour station ${station_id}`)
    }

    return { success: true, ventes: ventes.length }
  } catch (err) {
    logger.error(`Erreur rapport station ${station_id}: ${err.message}`)
    return { success: false, error: err.message }
  }
}

// ── Envoyer rapports pour toutes les stations ─────
const envoyerTousLesRapports = async (year, month) => {
  const stations = await pool.query('SELECT id FROM stations')
  const results  = []

  for (const s of stations.rows) {
    const result = await envoyerRapportStation(s.id, year, month)
    results.push({ station_id: s.id, ...result })
  }

  logger.info(`Rapports mensuels envoyés: ${results.filter(r => r.success).length}/${results.length}`)
  return results
}

module.exports = { envoyerRapportStation, envoyerTousLesRapports, generatePDF, sendRapportEmail }