// ================================================
// FUELO — Service Layer : GPS Citernes
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { notifyAlerte, notifyGps } = require('../utils/socketNotify')

// Distance Haversine entre deux points GPS (en mètres)
function distanceM(lat1, lng1, lat2, lng2) {
  const R  = 6371000
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lng2 - lng1) * Math.PI / 180
  const a  = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Générer un code QR unique 6 chiffres ─────────
const genQrCode = () => String(Math.floor(100000 + Math.random() * 900000))

// ── Démarrer un trajet ───────────────────────────
const demarrerTrajet = async (user, { citerne_id, qty_depart, station_destination_id }, photoUrl) => {
  const { id: chauffeur_id, station_id } = user
  const destId = station_destination_id || station_id

  if (!destId) throw new Error('Station de destination introuvable.')
  if (!photoUrl) throw new Error('Photo obligatoire pour démarrer le trajet.')

  const existant = await pool.query(
    `SELECT id FROM trajets WHERE chauffeur_id = $1 AND statut IN ('en_cours','arrive_attente')`,
    [chauffeur_id]
  )
  if (existant.rows.length > 0) throw new Error('Vous avez déjà un trajet en cours.')

  const stationResult = await pool.query(
    `SELECT seuil_fraude_citerne FROM stations WHERE id = $1`,
    [destId]
  )
  const seuil = stationResult.rows[0]?.seuil_fraude_citerne ?? 50

  // QR code valide 24h
  const qr_code      = genQrCode()
  const qr_expires_at = new Date(Date.now() + 24 * 3600 * 1000)

  const result = await pool.query(
    `INSERT INTO trajets
       (citerne_id, chauffeur_id, station_destination_id, qty_depart, seuil_fraude,
        photo_depart_url, qr_code, qr_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [citerne_id, chauffeur_id, destId, qty_depart, seuil, photoUrl, qr_code, qr_expires_at]
  )

  logger.info(`Trajet démarré — Chauffeur ${chauffeur_id} — Citerne ${citerne_id} — QR ${qr_code}`)
  return result.rows[0]
}

// ── Enregistrer une position GPS ─────────────────
const ajouterPosition = async (trajet_id, chauffeur_id, { lat, lng, vitesse }, app) => {
  const trajetResult = await pool.query(
    `SELECT t.*, s.id as station_id FROM trajets t
     JOIN stations s ON s.id = t.station_destination_id
     WHERE t.id = $1 AND t.chauffeur_id = $2 AND t.statut = 'en_cours'`,
    [trajet_id, chauffeur_id]
  )
  const trajet = trajetResult.rows[0]
  if (!trajet) throw new Error('Trajet introuvable ou déjà terminé')

  await pool.query(
    `INSERT INTO gps_points (trajet_id, lat, lng, vitesse) VALUES ($1, $2, $3, $4)`,
    [trajet_id, lat, lng, vitesse ?? 0]
  )

  // Émettre la position en temps réel
  if (app) notifyGps(app, trajet.station_id, { trajet_id, lat, lng, vitesse })

  // Détecter arrêt suspect (pas de mouvement > 300m sur 10 min)
  const pointsResult = await pool.query(
    `SELECT lat, lng, created_at FROM gps_points
     WHERE trajet_id = $1 AND created_at > NOW() - INTERVAL '15 minutes'
     ORDER BY created_at ASC`,
    [trajet_id]
  )
  const points = pointsResult.rows

  if (points.length >= 3) {
    const oldest  = points[0]
    const newest  = points[points.length - 1]
    const spanMin = (new Date(newest.created_at) - new Date(oldest.created_at)) / 60000
    const dist    = distanceM(oldest.lat, oldest.lng, newest.lat, newest.lng)

    if (dist < 300 && spanMin > 10) {
      // Éviter les alertes répétées — une seule alerte par arrêt (30 min de cooldown)
      const dejaAlerteResult = await pool.query(
        `SELECT id FROM trajets WHERE id = $1 AND alerte_arret_at > NOW() - INTERVAL '30 minutes'`,
        [trajet_id]
      )
      if (dejaAlerteResult.rows.length === 0) {
        const chauffeurResult = await pool.query(`SELECT nom FROM users WHERE id = $1`, [trajet.chauffeur_id])
        const nom = chauffeurResult.rows[0]?.nom ?? `Chauffeur #${trajet.chauffeur_id}`
        const msg = `Arrêt suspect — ${nom} — Immobile depuis ${Math.round(spanMin)} min (${dist.toFixed(0)}m en ${Math.round(spanMin)} min)`

        await pool.query(
          `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'ARRET_SUSPECT', $2)`,
          [trajet.station_id, msg]
        )
        await pool.query(`UPDATE trajets SET alerte_arret_at = NOW() WHERE id = $1`, [trajet_id])

        if (app) notifyAlerte(app, trajet.station_id, { type: 'ARRET_SUSPECT', message: msg })
        logger.warn(`Arrêt suspect — Trajet ${trajet_id}: ${msg}`)
      }
    }
  }
}

// ── Chauffeur déclare l'arrivée (étape 1/2) ──────
// Sauvegarde photo + qty, passe en 'arrive_attente' (logisticien doit valider QR)
const arriverDestination = async (user, trajet_id, { qty_arrivee }, photoUrl) => {
  const { id: chauffeur_id } = user

  if (!photoUrl) throw new Error('Photo obligatoire pour déclarer l\'arrivée.')

  const trajetResult = await pool.query(
    `SELECT id FROM trajets
     WHERE id = $1 AND chauffeur_id = $2 AND statut = 'en_cours'`,
    [trajet_id, chauffeur_id]
  )
  if (!trajetResult.rows[0]) throw new Error('Trajet introuvable ou déjà terminé')

  const qtyNum = parseFloat(qty_arrivee)
  if (isNaN(qtyNum) || qtyNum < 0) throw new Error('Quantité arrivée invalide')

  const updated = await pool.query(
    `UPDATE trajets
     SET qty_arrivee = $1, photo_arrivee_url = $2, statut = 'arrive_attente', ended_at = NOW()
     WHERE id = $3 RETURNING *`,
    [qtyNum, photoUrl, trajet_id]
  )

  logger.info(`Arrivée déclarée — Trajet ${trajet_id} — Attente validation QR`)
  return { trajet: updated.rows[0] }
}

// ── Logisticien valide le QR (étape 2/2) ─────────
// Calcule l'écart et finalise le statut
const validerQrArrivee = async (user, { qr_code }, app) => {
  if (!qr_code?.toString().trim()) throw new Error('Code QR obligatoire')

  const trajetResult = await pool.query(
    `SELECT t.*, s.id as station_id FROM trajets t
     JOIN stations s ON s.id = t.station_destination_id
     WHERE t.qr_code = $1 AND t.statut = 'arrive_attente'
     ORDER BY t.ended_at DESC LIMIT 1`,
    [qr_code.toString().trim()]
  )
  const trajet = trajetResult.rows[0]
  if (!trajet) throw new Error('Code invalide ou trajet introuvable. Vérifiez que le chauffeur a bien déclaré son arrivée.')

  // Vérifier l'expiration
  if (new Date() > new Date(trajet.qr_expires_at)) {
    throw new Error('QR expiré (validité 24h). Contactez le chauffeur pour en générer un nouveau.')
  }

  if (trajet.qty_arrivee == null) throw new Error('Le chauffeur n\'a pas encore déclaré la quantité arrivée.')

  const qtyArrivee = parseFloat(trajet.qty_arrivee)
  const ecart      = parseFloat(trajet.qty_depart) - qtyArrivee
  const aFraude    = Math.abs(ecart) > parseFloat(trajet.seuil_fraude)
  const statut     = aFraude ? 'alerte' : 'arrive'

  const updated = await pool.query(
    `UPDATE trajets SET ecart = $1, statut = $2 WHERE id = $3 RETURNING *`,
    [ecart, statut, trajet.id]
  )

  if (aFraude) {
    const chauffeurResult = await pool.query(`SELECT nom FROM users WHERE id = $1`, [trajet.chauffeur_id])
    const nom = chauffeurResult.rows[0]?.nom ?? `Chauffeur #${trajet.chauffeur_id}`
    const msg = `Fraude citerne — ${nom} — Départ: ${trajet.qty_depart}L · Arrivée: ${qtyArrivee}L · Écart: ${ecart.toFixed(1)}L`

    await pool.query(
      `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'FRAUDE_CITERNE', $2)`,
      [trajet.station_id, msg]
    )
    if (app) notifyAlerte(app, trajet.station_id, { type: 'FRAUDE_CITERNE', message: msg })
    logger.warn(`Fraude citerne — Trajet ${trajet.id}: ${msg}`)
  }

  logger.info(`QR validé — Trajet ${trajet.id} — Écart: ${ecart.toFixed(1)}L — Statut: ${statut}`)
  return { trajet: updated.rows[0], ecart, alerte_fraude: aFraude }
}

// ── Trajet actif du chauffeur ────────────────────
const getTrajetActif = async (chauffeur_id) => {
  const result = await pool.query(
    `SELECT t.*, c.code as citerne_code, c.capacite,
            s.nom as station_nom, u.nom as chauffeur_nom
     FROM trajets t
     LEFT JOIN citernes c  ON c.id = t.citerne_id
     LEFT JOIN stations s  ON s.id = t.station_destination_id
     LEFT JOIN users u     ON u.id = t.chauffeur_id
     WHERE t.chauffeur_id = $1 AND t.statut IN ('en_cours', 'arrive_attente')
     ORDER BY t.started_at DESC LIMIT 1`,
    [chauffeur_id]
  )
  return result.rows[0] ?? null
}

// ── Liste des trajets (owner/gérant) ─────────────
const getTrajets = async (station_id, filters = {}) => {
  const { statut } = filters
  const params = [station_id]
  let where = 'WHERE t.station_destination_id = $1'

  if (statut) {
    params.push(statut)
    where += ` AND t.statut = $${params.length}`
  }

  const result = await pool.query(
    `SELECT t.*, c.code as citerne_code, c.capacite,
            u.nom as chauffeur_nom
     FROM trajets t
     LEFT JOIN citernes c ON c.id = t.citerne_id
     LEFT JOIN users u    ON u.id = t.chauffeur_id
     ${where}
     ORDER BY t.started_at DESC LIMIT 100`,
    params
  )
  return result.rows
}

// ── Points GPS d'un trajet ────────────────────────
const getGpsPoints = async (trajet_id, station_id) => {
  // Vérifie que le trajet appartient à la station
  const check = await pool.query(
    `SELECT id FROM trajets WHERE id = $1 AND station_destination_id = $2`,
    [trajet_id, station_id]
  )
  if (!check.rows[0]) throw new Error('Trajet introuvable')

  const result = await pool.query(
    `SELECT lat, lng, vitesse, created_at FROM gps_points
     WHERE trajet_id = $1 ORDER BY created_at ASC`,
    [trajet_id]
  )
  return result.rows
}

module.exports = { demarrerTrajet, ajouterPosition, arriverDestination, validerQrArrivee, getTrajetActif, getTrajets, getGpsPoints }
