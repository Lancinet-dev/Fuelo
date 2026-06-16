// ================================================
// FUELO — Service : Assistant IA (Claude / Anthropic)
// ================================================

const pool      = require('../config/database')
const Anthropic = require('@anthropic-ai/sdk')
const logger    = require('../utils/logger')

const MODEL      = 'claude-sonnet-4-6'   // Sonnet actuel — meilleur rapport qualité/latence/coût pour un assistant chat
const MAX_TOKENS = 1024

let client = null
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

const num   = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0 }
const fmtN  = (n) => Math.round(num(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const fmtL  = (n) => `${fmtN(n)} L`
const fmtGNF = (n) => `${fmtN(n)} GNF`

const SYSTEM_PROMPT_BASE = `Tu es l'Assistant IA de Fuelo, un SaaS de gestion de stations-service en Afrique de l'Ouest (Guinée).
Tu aides les propriétaires (owner) et gérants (gérant) de stations à comprendre et piloter leur activité : ventes, stock, alertes, fraude, employés.

Règles :
- Réponds toujours en français, de façon concise, professionnelle et chaleureuse (vouvoiement).
- Appuie-toi UNIQUEMENT sur les données ci-dessous, qui reflètent l'état réel et à jour de la station de l'utilisateur.
- Si une information n'est pas présente dans les données fournies, dis-le clairement plutôt que d'inventer un chiffre.
- Pour les montants, utilise le format "1 234 567 GNF" (espaces comme séparateurs de milliers, jamais de virgule).
- Mets en avant les points qui méritent l'attention immédiate du gérant (alertes critiques, fraude, stock bas).
- Reste bref : 2 à 6 phrases dans la majorité des cas, sauf si l'utilisateur demande un détail plus complet.`

// ── Construit le contexte temps réel de la station (injecté dans le system prompt) ─
const getContexteStation = async (user) => {
  const stationId = user.station_id
  if (!stationId) return 'Aucune station associée à cet utilisateur — informe poliment que tu ne peux pas accéder aux données.'

  const [
    stationRes, stockRes, ventesJourRes, ventesMoisRes,
    consoMoyenneRes, topPompistesRes, alertesRes, fraudesPompistesRes, fraudesTransportRes,
  ] = await Promise.all([
    pool.query(`SELECT nom, prix_essence, prix_gasoil, seuil_essence, seuil_gasoil FROM stations WHERE id = $1`, [stationId]),
    pool.query(`SELECT type, quantite FROM stocks WHERE station_id = $1`, [stationId]),
    pool.query(
      `SELECT COUNT(*) nb, COALESCE(SUM(litres),0) litres, COALESCE(SUM(montant_gnf),0) montant
       FROM ventes WHERE station_id = $1 AND deleted_at IS NULL AND DATE(created_at) = CURRENT_DATE`,
      [stationId]
    ),
    pool.query(
      `SELECT COUNT(*) nb, COALESCE(SUM(litres),0) litres, COALESCE(SUM(montant_gnf),0) montant
       FROM ventes WHERE station_id = $1 AND deleted_at IS NULL
       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
       AND EXTRACT(YEAR  FROM created_at) = EXTRACT(YEAR  FROM NOW())`,
      [stationId]
    ),
    pool.query(
      `SELECT type, COALESCE(SUM(litres), 0) / GREATEST(COUNT(DISTINCT DATE(created_at)), 1) AS moyenne_jour
       FROM ventes WHERE station_id = $1 AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY type`,
      [stationId]
    ),
    pool.query(
      `SELECT u.nom, COUNT(*) nb, COALESCE(SUM(v.litres),0) litres, COALESCE(SUM(v.montant_gnf),0) montant
       FROM ventes v JOIN users u ON u.id = v.user_id
       WHERE v.station_id = $1 AND v.deleted_at IS NULL
       AND EXTRACT(MONTH FROM v.created_at) = EXTRACT(MONTH FROM NOW())
       AND EXTRACT(YEAR  FROM v.created_at) = EXTRACT(YEAR  FROM NOW())
       GROUP BY u.id, u.nom ORDER BY montant DESC LIMIT 5`,
      [stationId]
    ),
    pool.query(
      `SELECT type, message, created_at FROM alertes
       WHERE station_id = $1 AND lu = false ORDER BY created_at DESC LIMIT 12`,
      [stationId]
    ),
    pool.query(
      `SELECT u.nom AS pompiste, s.ecart_essence, s.ecart_gasoil, s.started_at, s.resolu
       FROM services s JOIN users u ON u.id = s.user_id
       WHERE s.station_id = $1 AND s.statut = 'alerte' AND s.ended_at IS NOT NULL
       ORDER BY s.started_at DESC LIMIT 6`,
      [stationId]
    ),
    pool.query(
      `SELECT ch.nom AS chauffeur, t.ecart, t.started_at, t.resolu
       FROM trajets t LEFT JOIN users ch ON ch.id = t.chauffeur_id
       WHERE t.station_destination_id = $1 AND t.statut = 'alerte' AND t.ended_at IS NOT NULL
       ORDER BY t.started_at DESC LIMIT 6`,
      [stationId]
    ),
  ])

  const station = stationRes.rows[0] || { nom: 'Station', prix_essence: 10000, prix_gasoil: 9000, seuil_essence: 300, seuil_gasoil: 300 }
  const aujourdHui = ventesJourRes.rows[0]
  const ceMois     = ventesMoisRes.rows[0]

  const stockParType = new Map(stockRes.rows.map(s => [s.type, num(s.quantite)]))
  const consoParType = new Map(consoMoyenneRes.rows.map(c => [c.type, num(c.moyenne_jour)]))

  const ligneStock = (type, label) => {
    const quantite = stockParType.get(type) ?? 0
    const conso    = consoParType.get(type) ?? 0
    const seuil    = type === 'essence' ? num(station.seuil_essence) : num(station.seuil_gasoil)
    const jours    = conso > 0 ? (quantite / conso).toFixed(1) : null
    const statut   = quantite <= seuil ? ' — STOCK FAIBLE (sous le seuil d\'alerte)' : ''
    return `  • ${label} : ${fmtL(quantite)} en stock, consommation moyenne ≈ ${fmtL(conso)}/jour`
         + (jours ? ` → autonomie estimée ≈ ${jours} jour(s)` : ' → pas assez de ventes récentes pour estimer l\'autonomie')
         + statut
  }

  const topPompistes = topPompistesRes.rows.length
    ? topPompistesRes.rows.map((p, i) =>
        `  ${i + 1}. ${p.nom} — ${p.nb} vente(s), ${fmtL(p.litres)}, ${fmtGNF(p.montant)} de chiffre d'affaires ce mois`
      ).join('\n')
    : '  Aucune vente enregistrée ce mois-ci.'

  const alertesCritiques = alertesRes.rows.length
    ? alertesRes.rows.map(a => `  • [${a.type}] ${a.message} (${new Date(a.created_at).toLocaleString('fr-FR')})`).join('\n')
    : '  Aucune alerte non lue actuellement — tout est sous contrôle.'

  const fraudesPompistes = fraudesPompistesRes.rows.length
    ? fraudesPompistesRes.rows.map(f => {
        const ecarts = []
        if (Math.abs(num(f.ecart_essence)) >= 0.05) ecarts.push(`essence ${num(f.ecart_essence) > 0 ? '+' : ''}${num(f.ecart_essence).toFixed(1)} L`)
        if (Math.abs(num(f.ecart_gasoil))  >= 0.05) ecarts.push(`gasoil ${num(f.ecart_gasoil) > 0 ? '+' : ''}${num(f.ecart_gasoil).toFixed(1)} L`)
        return `  • ${f.pompiste} — écart ${ecarts.join(', ') || 'détecté'} le ${new Date(f.started_at).toLocaleDateString('fr-FR')} (${f.resolu ? 'résolu' : 'en cours'})`
      }).join('\n')
    : '  Aucune fraude pompiste détectée récemment.'

  const fraudesTransport = fraudesTransportRes.rows.length
    ? fraudesTransportRes.rows.map(f =>
        `  • ${f.chauffeur ?? 'Chauffeur'} — écart transport ${num(f.ecart) > 0 ? '+' : ''}${num(f.ecart).toFixed(1)} L le ${new Date(f.started_at).toLocaleDateString('fr-FR')} (${f.resolu ? 'résolu' : 'en cours'})`
      ).join('\n')
    : '  Aucun vol de carburant au cours du transport détecté récemment.'

  return `=== DONNÉES EN TEMPS RÉEL — ${station.nom} ===
(Prix actuels : essence ${fmtGNF(station.prix_essence)}/L, gasoil ${fmtGNF(station.prix_gasoil)}/L)

VENTES AUJOURD'HUI :
  • ${aujourdHui.nb} transaction(s), ${fmtL(aujourdHui.litres)} vendus, chiffre d'affaires ${fmtGNF(aujourdHui.montant)}

VENTES CE MOIS-CI :
  • ${ceMois.nb} transaction(s), ${fmtL(ceMois.litres)} vendus, chiffre d'affaires ${fmtGNF(ceMois.montant)}

CLASSEMENT POMPISTES CE MOIS (par chiffre d'affaires) :
${topPompistes}

NIVEAUX DE STOCK ET AUTONOMIE ESTIMÉE :
${ligneStock('essence', 'Essence')}
${ligneStock('gasoil', 'Gasoil')}

ALERTES NON LUES (${alertesRes.rows.length}) :
${alertesCritiques}

FRAUDES POMPISTES RÉCENTES (anti-fraude compteur) :
${fraudesPompistes}

VOLS DE CARBURANT AU COURS DU TRANSPORT — RÉCENTS (écarts départ/arrivée) :
${fraudesTransport}`
}

// ── Envoie la conversation à Claude avec le contexte station injecté ─
const repondre = async (user, messages = []) => {
  if (!['owner', 'gerant', 'superadmin'].includes(user.role)) throw new Error('Accès refusé')

  const anthropic = getClient()
  if (!anthropic) throw new Error('Assistant IA non configuré (clé API manquante)')

  const historique = (Array.isArray(messages) ? messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content.trim() }))

  if (!historique.length) throw new Error('Message vide')

  const contexte     = await getContexteStation(user)
  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n\n${contexte}`

  const response = await anthropic.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     systemPrompt,
    messages:   historique,
  })

  const bloc  = (response.content || []).find(b => b.type === 'text')
  const texte = bloc?.text?.trim()
  if (!texte) throw new Error("L'assistant n'a pas pu générer de réponse — réessayez.")

  logger.info(`Assistant IA — réponse générée pour user #${user.id} (station #${user.station_id})`)
  return texte
}

module.exports = { repondre, getContexteStation }
