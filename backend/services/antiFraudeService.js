// ================================================
// FUELO — Service : Centre Anti-Fraude
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MOIS  = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// Montant estimé perdu sur un service pompiste en alerte (écarts essence + gasoil au prix station)
const montantServiceFraude = (s, station) =>
  Math.abs(num(s.ecart_essence)) * num(station.prix_essence) +
  Math.abs(num(s.ecart_gasoil))  * num(station.prix_gasoil)

// Montant estimé perdu sur un trajet citerne en alerte (écart litres au prix essence — référence transport)
const montantTrajetFraude = (t, station) =>
  Math.abs(num(t.ecart)) * num(station.prix_essence)

const scoreBadge = (score) => {
  if (score >= 80) return { badge: 'Fiable',    couleur: 'green'  }
  if (score >= 50) return { badge: 'Surveillé', couleur: 'orange' }
  return            { badge: 'Dangereux', couleur: 'red'    }
}

// ── Tableau de bord complet (stats + graphes + listes) ─
const getDashboard = async (user) => {
  if (!['owner', 'gerant', 'superadmin'].includes(user.role)) throw new Error('Accès refusé')
  const stationId = user.station_id
  if (!stationId) throw new Error('Station introuvable')

  const stationRes = await pool.query(
    `SELECT nom, logo_url, prix_essence, prix_gasoil FROM stations WHERE id = $1`,
    [stationId]
  )
  const station = stationRes.rows[0] || { nom: 'Station', logo_url: null, prix_essence: 10000, prix_gasoil: 9000 }

  const servicesRes = await pool.query(
    `SELECT s.id, s.user_id, s.started_at, s.ended_at, s.statut,
            s.photo_debut_url, s.photo_fin_url,
            s.compteur_essence_debut, s.compteur_essence_fin,
            s.compteur_gasoil_debut, s.compteur_gasoil_fin,
            s.ecart_essence, s.ecart_gasoil, s.resolu, s.resolu_par, s.resolu_at,
            u.id AS pompiste_id, u.nom AS pompiste_nom, u.email AS pompiste_email, u.actif AS pompiste_actif
     FROM services s
     JOIN users u ON u.id = s.user_id
     WHERE s.station_id = $1 AND s.ended_at IS NOT NULL
     ORDER BY s.started_at DESC`,
    [stationId]
  )
  const services = servicesRes.rows

  const trajetsRes = await pool.query(
    `SELECT t.id, t.chauffeur_id, t.citerne_id, t.qty_depart, t.qty_arrivee, t.ecart,
            t.statut, t.started_at, t.ended_at,
            t.photo_depart_url, t.photo_arrivee_url, t.qr_code, t.qr_expires_at,
            t.resolu, t.resolu_par, t.resolu_at,
            c.code AS citerne_code,
            ch.id AS chauffeur_id_u, ch.nom AS chauffeur_nom, ch.email AS chauffeur_email, ch.actif AS chauffeur_actif
     FROM trajets t
     LEFT JOIN citernes c ON c.id = t.citerne_id
     LEFT JOIN users ch    ON ch.id = t.chauffeur_id
     WHERE t.station_destination_id = $1 AND t.ended_at IS NOT NULL
     ORDER BY t.started_at DESC`,
    [stationId]
  )
  const trajets = trajetsRes.rows

  const fraudesServices = services.filter(s => s.statut === 'alerte')
  const fraudesTrajets  = trajets.filter(t => t.statut === 'alerte')

  // ── Stats globales (header) ──────────────────────
  const totalCas     = services.length + trajets.length
  const totalFraudes = fraudesServices.length + fraudesTrajets.length
  const montantTotal =
    fraudesServices.reduce((sum, s) => sum + montantServiceFraude(s, station), 0) +
    fraudesTrajets.reduce((sum, t) => sum + montantTrajetFraude(t, station), 0)
  const pompistesSurveilles = new Set(services.map(s => s.pompiste_id)).size

  const stats = {
    totalFraudes,
    montantRecupere:     Math.round(montantTotal),
    pompistesSurveilles,
    tauxFraude:          totalCas > 0 ? Math.round((totalFraudes / totalCas) * 1000) / 10 : 0,
  }

  // ── Fraudes par mois (12 derniers mois) ──────────
  const now = new Date()
  const moisMap = new Map()
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    moisMap.set(key, { mois: `${MOIS[d.getMonth()]} ${d.getFullYear()}`, pompistes: 0, chauffeurs: 0, total: 0 })
  }
  const bumpMois = (date, champ) => {
    const d   = new Date(date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const e   = moisMap.get(key)
    if (e) { e[champ]++; e.total++ }
  }
  fraudesServices.forEach(s => bumpMois(s.started_at, 'pompistes'))
  fraudesTrajets.forEach(t  => bumpMois(t.started_at, 'chauffeurs'))
  const fraudesParMois = Array.from(moisMap.values())

  // ── Agrégation par pompiste (fraudes + classement) ─
  const parPompisteMap = new Map()
  services.forEach(s => {
    const key = s.pompiste_id
    const cur = parPompisteMap.get(key) ?? {
      id: s.pompiste_id, nom: s.pompiste_nom, email: s.pompiste_email, actif: s.pompiste_actif,
      totalServices: 0, fraudes: 0, montantFraude: 0,
    }
    cur.totalServices++
    if (s.statut === 'alerte') {
      cur.fraudes++
      cur.montantFraude += montantServiceFraude(s, station)
    }
    parPompisteMap.set(key, cur)
  })
  const pompistesAgreges = Array.from(parPompisteMap.values())

  const fraudesParPompiste = pompistesAgreges
    .filter(p => p.fraudes > 0)
    .sort((a, b) => b.fraudes - a.fraudes)
    .map(p => ({ id: p.id, nom: p.nom, fraudes: p.fraudes, montant: Math.round(p.montantFraude) }))

  // ── Heatmap jours / heures ────────────────────────
  const heatCounts = new Map()
  const bumpHeat = (date) => {
    const d   = new Date(date)
    const key = `${d.getDay()}-${d.getHours()}`
    heatCounts.set(key, (heatCounts.get(key) ?? 0) + 1)
  }
  fraudesServices.forEach(s => bumpHeat(s.started_at))
  fraudesTrajets.forEach(t  => bumpHeat(t.started_at))
  const heatmap = []
  for (let j = 0; j < 7; j++) {
    for (let h = 0; h < 24; h++) {
      heatmap.push({ jour: j, jourLabel: JOURS[j], heure: h, count: heatCounts.get(`${j}-${h}`) ?? 0 })
    }
  }
  const heatmapMax = heatmap.reduce((m, c) => Math.max(m, c.count), 0)

  // ── Classement fiabilité pompistes ────────────────
  const classementPompistes = pompistesAgreges
    .map(p => {
      const tauxFraudePompiste = p.totalServices > 0 ? (p.fraudes / p.totalServices) * 100 : 0
      const score = Math.max(0, Math.min(100, Math.round(100 - tauxFraudePompiste * 3 - p.fraudes * 8)))
      const { badge, couleur } = scoreBadge(score)
      return {
        id: p.id, nom: p.nom, email: p.email, actif: p.actif,
        totalServices: p.totalServices,
        fraudes: p.fraudes,
        montantFraude: Math.round(p.montantFraude),
        score, badge, couleur,
      }
    })
    .sort((a, b) => a.score - b.score || b.fraudes - a.fraudes)

  // ── Liste alertes fraude pompistes (preuves) ──────
  const alertesFraude = fraudesServices.map(s => ({
    id: s.id,
    type: 'FRAUDE',
    pompisteId:   s.pompiste_id,
    pompisteNom:  s.pompiste_nom,
    pompisteActif: s.pompiste_actif,
    ecartEssence: num(s.ecart_essence),
    ecartGasoil:  num(s.ecart_gasoil),
    montantPerdu: Math.round(montantServiceFraude(s, station)),
    photoDebut:   s.photo_debut_url,
    photoFin:     s.photo_fin_url,
    compteurEssenceDebut: s.compteur_essence_debut,
    compteurEssenceFin:   s.compteur_essence_fin,
    compteurGasoilDebut:  s.compteur_gasoil_debut,
    compteurGasoilFin:    s.compteur_gasoil_fin,
    statut:    s.resolu ? 'resolu' : 'en_cours',
    resoluPar: s.resolu_par,
    resoluAt:  s.resolu_at,
    date:      s.started_at,
    dateFin:   s.ended_at,
  }))

  // ── Liste alertes transport (VOL_TRANSPORT) ──────
  const alertesTransport = fraudesTrajets.map(t => ({
    id: t.id,
    type: 'VOL_TRANSPORT',
    chauffeurId:   t.chauffeur_id,
    chauffeurNom:  t.chauffeur_nom ?? 'Chauffeur',
    chauffeurActif: t.chauffeur_actif,
    citerneCode:  t.citerne_code ?? '-',
    qtyDepart:    num(t.qty_depart),
    qtyArrivee:   t.qty_arrivee != null ? num(t.qty_arrivee) : null,
    ecart:        num(t.ecart),
    montantPerdu: Math.round(montantTrajetFraude(t, station)),
    photoDepart:  t.photo_depart_url,
    photoArrivee: t.photo_arrivee_url,
    qrCode:       t.qr_code,
    qrExpiresAt:  t.qr_expires_at,
    statut:    t.resolu ? 'resolu' : 'en_cours',
    resoluPar: t.resolu_par,
    resoluAt:  t.resolu_at,
    date:      t.started_at,
    dateFin:   t.ended_at,
  }))

  return {
    station: { nom: station.nom, logoUrl: station.logo_url, prixEssence: num(station.prix_essence), prixGasoil: num(station.prix_gasoil) },
    stats,
    fraudesParMois,
    fraudesParPompiste,
    heatmap,
    heatmapMax,
    classementPompistes,
    alertesFraude,
    alertesTransport,
  }
}

// ── Marquer un cas de fraude comme résolu ─────────
const marquerResolu = async (type, id, user) => {
  if (!['owner', 'gerant', 'superadmin'].includes(user.role)) throw new Error('Accès refusé')
  const stationId = user.station_id

  if (type === 'service') {
    const check = await pool.query(`SELECT station_id, statut, resolu FROM services WHERE id = $1`, [id])
    if (!check.rows[0]) throw new Error('Cas introuvable')
    if (check.rows[0].station_id !== stationId) throw new Error('Accès refusé')
    if (check.rows[0].statut !== 'alerte') throw new Error('Ce cas n\'est pas une fraude détectée')
    if (check.rows[0].resolu) throw new Error('Ce cas est déjà marqué comme résolu')

    const result = await pool.query(
      `UPDATE services SET resolu = TRUE, resolu_par = $1, resolu_at = NOW()
       WHERE id = $2 RETURNING id, resolu, resolu_par, resolu_at`,
      [user.id, id]
    )
    logger.info(`Anti-fraude — service #${id} marqué résolu par user #${user.id}`)
    return { type: 'service', ...result.rows[0] }
  }

  if (type === 'trajet') {
    const check = await pool.query(`SELECT station_destination_id, statut, resolu FROM trajets WHERE id = $1`, [id])
    if (!check.rows[0]) throw new Error('Cas introuvable')
    if (check.rows[0].station_destination_id !== stationId) throw new Error('Accès refusé')
    if (check.rows[0].statut !== 'alerte') throw new Error('Ce cas n\'est pas une fraude détectée')
    if (check.rows[0].resolu) throw new Error('Ce cas est déjà marqué comme résolu')

    const result = await pool.query(
      `UPDATE trajets SET resolu = TRUE, resolu_par = $1, resolu_at = NOW()
       WHERE id = $2 RETURNING id, resolu, resolu_par, resolu_at`,
      [user.id, id]
    )
    logger.info(`Anti-fraude — trajet #${id} marqué résolu par user #${user.id}`)
    return { type: 'trajet', ...result.rows[0] }
  }

  throw new Error('Type invalide')
}

module.exports = { getDashboard, marquerResolu }
