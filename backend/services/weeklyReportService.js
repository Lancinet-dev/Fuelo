// ================================================
// FUELO — Rapport hebdomadaire automatique
// Envoyé chaque lundi à 8h UTC via Resend
// ================================================

const pool         = require('../config/database')
const { envoyerEmail } = require('../utils/mailer')
const logger       = require('../utils/logger')

const MOIS_FR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.']

function formatDateFR(date) {
  return `${date.getUTCDate()} ${MOIS_FR[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function formatMontant(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function fleche(actuel, precedent) {
  if (!precedent || precedent === 0) return ''
  const pct = ((actuel - precedent) / precedent * 100).toFixed(1)
  const n   = parseFloat(pct)
  if (n > 0)  return `<span style="color:#22c55e">▲ +${pct}%</span>`
  if (n < 0)  return `<span style="color:#ef4444">▼ ${pct}%</span>`
  return `<span style="color:#94a3b8">= 0%</span>`
}

const genererRapportHebdo = async () => {
  logger.info('[rapportHebdo] Démarrage génération des rapports hebdomadaires…')

  // Calcul de la semaine à rapporter (semaine passée, lundi→dimanche UTC)
  const now        = new Date()
  const ceMonday   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  // Si le cron tourne un lundi, on recule au lundi précédent
  const jourSem    = ceMonday.getUTCDay() // 1 = lundi
  const offsetLundi = jourSem === 1 ? 7 : jourSem === 0 ? 6 : jourSem - 1
  const debutSemPrec  = new Date(ceMonday.getTime() - offsetLundi * 86400000)
  const debutSemAvPrec = new Date(debutSemPrec.getTime() - 7 * 86400000)
  const finSemPrec    = new Date(debutSemPrec.getTime() + 7 * 86400000) // = ce lundi 00:00

  // Récupérer toutes les stations avec leurs owners
  const { rows: stationOwners } = await pool.query(`
    SELECT su.station_id, s.nom AS station_nom,
           u.id AS owner_id, u.nom AS owner_nom, u.email AS owner_email
    FROM station_users su
    JOIN stations s ON s.id = su.station_id
    JOIN users u    ON u.id = su.user_id
    WHERE u.role IN ('owner', 'gerant')
      AND u.deleted_at IS NULL
      AND s.deleted_at IS NULL
      AND u.email IS NOT NULL
  `)

  // Grouper par station
  const parStation = {}
  for (const row of stationOwners) {
    if (!parStation[row.station_id]) {
      parStation[row.station_id] = { id: row.station_id, nom: row.station_nom, destinataires: [] }
    }
    const existe = parStation[row.station_id].destinataires.some(d => d.id === row.owner_id)
    if (!existe) {
      parStation[row.station_id].destinataires.push({ id: row.owner_id, nom: row.owner_nom, email: row.owner_email })
    }
  }

  for (const station of Object.values(parStation)) {
    try {
      // Ventes semaine précédente
      const { rows: [sv] } = await pool.query(`
        SELECT COUNT(*)::int AS nb_ventes,
               COALESCE(SUM(litres), 0)::float      AS litres,
               COALESCE(SUM(montant_gnf), 0)::float AS ca
        FROM ventes
        WHERE station_id = $1
          AND created_at >= $2 AND created_at < $3
          AND deleted_at IS NULL
      `, [station.id, debutSemPrec, finSemPrec])

      // Ventes semaine d'avant (comparaison)
      const { rows: [sp] } = await pool.query(`
        SELECT COUNT(*)::int AS nb_ventes,
               COALESCE(SUM(litres), 0)::float      AS litres,
               COALESCE(SUM(montant_gnf), 0)::float AS ca
        FROM ventes
        WHERE station_id = $1
          AND created_at >= $2 AND created_at < $3
          AND deleted_at IS NULL
      `, [station.id, debutSemAvPrec, debutSemPrec])

      // Top pompiste
      const { rows: topRows } = await pool.query(`
        SELECT u.nom, COUNT(v.id)::int AS nb_ventes,
               COALESCE(SUM(v.litres), 0)::float AS litres
        FROM ventes v
        JOIN users u ON u.id = v.user_id
        WHERE v.station_id = $1
          AND v.created_at >= $2 AND v.created_at < $3
          AND v.deleted_at IS NULL
        GROUP BY u.id, u.nom
        ORDER BY litres DESC
        LIMIT 1
      `, [station.id, debutSemPrec, finSemPrec])

      // Alertes non lues créées pendant la semaine
      const { rows: [alerteRow] } = await pool.query(`
        SELECT COUNT(*)::int AS nb
        FROM alertes
        WHERE station_id = $1
          AND created_at >= $2 AND created_at < $3
      `, [station.id, debutSemPrec, finSemPrec])

      // Niveaux de stock actuels
      const { rows: stocks } = await pool.query(`
        SELECT type, quantite::float, capacite_max::float
        FROM stocks
        WHERE station_id = $1
      `, [station.id])

      // Consommation journalière sur 7 jours précédents
      const { rows: conso } = await pool.query(`
        SELECT type_carburant AS type,
               COALESCE(SUM(litres), 0)::float / 7 AS litres_par_jour
        FROM ventes
        WHERE station_id = $1
          AND created_at >= $2 AND created_at < $3
          AND deleted_at IS NULL
        GROUP BY type_carburant
      `, [station.id, debutSemPrec, finSemPrec])

      const consoMap = {}
      for (const c of conso) consoMap[c.type] = parseFloat(c.litres_par_jour) || 0

      const lignesStock = stocks.map(s => {
        const cj = consoMap[s.type] || 0
        const jours = cj > 0 ? Math.floor(s.quantite / cj) : null
        const pct   = s.capacite_max > 0 ? Math.round(s.quantite / s.capacite_max * 100) : 0
        return { type: s.type, quantite: s.quantite, pct, jours }
      })

      const html = genererHTML({ station, debutSemPrec, finSemPrec, sv, sp, topPompiste: topRows[0] || null, nbAlertes: alerteRow.nb, lignesStock })

      const semaineLabel = `${formatDateFR(debutSemPrec)} – ${formatDateFR(new Date(finSemPrec.getTime() - 86400000))}`

      for (const dest of station.destinataires) {
        await envoyerEmail({
          to: dest.email,
          subject: `Rapport hebdo Fuelo — ${station.nom} — ${semaineLabel}`,
          html,
        })
        logger.info(`[rapportHebdo] Email envoyé → ${dest.email} (station: ${station.nom})`)
      }
    } catch (err) {
      logger.error(`[rapportHebdo] Erreur station ${station.id} (${station.nom}): ${err.message}`)
    }
  }

  logger.info('[rapportHebdo] Terminé.')
}

function genererHTML({ station, debutSemPrec, finSemPrec, sv, sp, topPompiste, nbAlertes, lignesStock }) {
  const finLabel = new Date(finSemPrec.getTime() - 86400000) // dimanche

  const stockRows = lignesStock.map(s => {
    const couleur  = s.pct < 20 ? '#ef4444' : s.pct < 40 ? '#f59e0b' : '#22c55e'
    const joursStr = s.jours !== null ? `~${s.jours} j` : 'N/A'
    const barWidth = Math.min(s.pct, 100)
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;text-transform:capitalize">${s.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0">${formatMontant(s.quantite)} L</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b">
          <table cellpadding="0" cellspacing="0" style="display:inline-table;background:#1e293b;border-radius:4px;height:8px;width:100px">
            <tr><td style="background:${couleur};border-radius:4px;height:8px;width:${barWidth}px"></td></tr>
          </table>
          <span style="color:${couleur};margin-left:6px;font-size:12px">${s.pct}%</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#94a3b8">${joursStr}</td>
      </tr>`
  }).join('')

  const alerteBg     = nbAlertes > 0 ? '#450a0a' : '#1e293b'
  const alerteBorder = nbAlertes > 0 ? '1px solid #ef4444' : 'none'
  const alerteColor  = nbAlertes > 0 ? '#ef4444' : '#94a3b8'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rapport hebdo Fuelo</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:16px;padding:28px 24px;margin-bottom:20px;text-align:center">
    <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">⛽ FUELO</div>
    <div style="color:#93c5fd;font-size:13px;margin-top:4px">Rapport hebdomadaire automatique</div>
    <div style="color:#fff;font-size:17px;font-weight:600;margin-top:10px">${station.nom}</div>
    <div style="color:#bfdbfe;font-size:13px;margin-top:4px">${formatDateFR(debutSemPrec)} – ${formatDateFR(finLabel)}</div>
  </div>

  <!-- KPIs (table layout for email clients) -->
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
    <tr>
      <td width="33%" style="padding:0 6px 0 0">
        <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Chiffre d'affaires</div>
          <div style="color:#fff;font-size:18px;font-weight:700;margin:6px 0">${formatMontant(sv.ca)} GNF</div>
          <div style="font-size:12px">${fleche(sv.ca, sp.ca)}</div>
        </div>
      </td>
      <td width="33%" style="padding:0 3px">
        <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Litres vendus</div>
          <div style="color:#fff;font-size:18px;font-weight:700;margin:6px 0">${formatMontant(sv.litres)} L</div>
          <div style="font-size:12px">${fleche(sv.litres, sp.litres)}</div>
        </div>
      </td>
      <td width="33%" style="padding:0 0 0 6px">
        <div style="background:#1e293b;border-radius:12px;padding:16px;text-align:center">
          <div style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">Nb ventes</div>
          <div style="color:#fff;font-size:18px;font-weight:700;margin:6px 0">${sv.nb_ventes}</div>
          <div style="font-size:12px;color:#94a3b8">vs ${sp.nb_ventes} sem. préc.</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Stock -->
  <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px">
    <div style="color:#fff;font-weight:600;margin-bottom:12px;font-size:14px">📦 Niveaux de stock actuels</div>
    ${lignesStock.length > 0 ? `
    <table cellpadding="0" cellspacing="0" width="100%">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase">Type</th>
          <th style="text-align:left;padding:6px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase">Quantité</th>
          <th style="text-align:left;padding:6px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase">Niveau</th>
          <th style="text-align:left;padding:6px 12px;color:#94a3b8;font-size:11px;text-transform:uppercase">Autonomie</th>
        </tr>
      </thead>
      <tbody>${stockRows}</tbody>
    </table>` : '<div style="color:#94a3b8;font-size:13px;padding:8px 12px">Aucun stock configuré</div>'}
  </div>

  <!-- Top pompiste + Alertes -->
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px">
    <tr>
      <td width="50%" style="padding:0 6px 0 0;vertical-align:top">
        <div style="background:#1e293b;border-radius:12px;padding:16px;height:100%">
          <div style="color:#f59e0b;font-weight:600;margin-bottom:8px;font-size:14px">🏆 Top pompiste</div>
          ${topPompiste
            ? `<div style="color:#fff;font-weight:600">${topPompiste.nom}</div>
               <div style="color:#94a3b8;font-size:13px;margin-top:4px">${topPompiste.nb_ventes} ventes &bull; ${formatMontant(topPompiste.litres)} L</div>`
            : '<div style="color:#94a3b8;font-size:13px">Aucune vente cette semaine</div>'
          }
        </div>
      </td>
      <td width="50%" style="padding:0 0 0 6px;vertical-align:top">
        <div style="background:${alerteBg};border-radius:12px;padding:16px;border:${alerteBorder}">
          <div style="color:${alerteColor};font-weight:600;margin-bottom:8px;font-size:14px">🚨 Alertes</div>
          <div style="color:#fff;font-size:24px;font-weight:700">${nbAlertes}</div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">cette semaine</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:20px">
    <a href="https://fuelo-kappa.vercel.app"
       style="background:#2563eb;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
      Voir le dashboard →
    </a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;color:#475569;font-size:11px;border-top:1px solid #1e293b;padding-top:16px;line-height:1.7">
    <p style="margin:0">Rapport automatique Fuelo — généré le ${formatDateFR(new Date())}</p>
    <p style="margin:4px 0">⛽ Fuelo · Gestion de stations-service · Afrique de l'Ouest</p>
  </div>

</div>
</body>
</html>`
}

module.exports = { genererRapportHebdo }
