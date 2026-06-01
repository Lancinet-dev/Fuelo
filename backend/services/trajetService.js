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

// ── Démarrer un trajet ───────────────────────────
const demarrerTrajet = async (user, { citerne_id, qty_depart, station_destination_id }) => {
  const { id: chauffeur_id } = user

  const existant = await pool.query(
    `SELECT id FROM trajets WHERE chauffeur_id = $1 AND statut = 'en_cours'`,
    [chauffeur_id]
  )
  if (existant.rows.length > 0) throw new Error('Vous avez déjà un trajet en cours.')

  // Récupérer le seuil de la station destination
  const stationResult = await pool.query(
    `SELECT seuil_fraude_citerne FROM stations WHERE id = $1`,
    [station_destination_id]
  )
  const seuil = stationResult.rows[0]?.seuil_fraude_citerne ?? 50

  const result = await pool.query(
    `INSERT INTO trajets (citerne_id, chauffeur_id, station_destination_id, qty_depart, seuil_fraude)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [citerne_id, chauffeur_id, station_destination_id, qty_depart, seuil]
  )

  logger.info(`Trajet démarré — Chauffeur ${chauffeur_id} — Citerne ${citerne_id}`)
  return result.rows[0]
}

// ── Enregistrer une position GPS ─────────────────
const ajouterPosition = async (trajet_id, { lat, lng, vitesse }, app) => {
  const trajetResult = await pool.query(
    `SELECT t.*, s.id as station_id FROM trajets t
     JOIN stations s ON s.id = t.station_destination_id
     WHERE t.id = $1 AND t.statut = 'en_cours'`,
    [trajet_id]
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

// ── Terminer un trajet ───────────────────────────
const arriverDestination = async (user, trajet_id, { qty_arrivee }, app) => {
  const { id: chauffeur_id } = user

  const trajetResult = await pool.query(
    `SELECT t.*, s.id as station_id FROM trajets t
     JOIN stations s ON s.id = t.station_destination_id
     WHERE t.id = $1 AND t.chauffeur_id = $2 AND t.statut = 'en_cours'`,
    [trajet_id, chauffeur_id]
  )
  const trajet = trajetResult.rows[0]
  if (!trajet) throw new Error('Trajet introuvable ou déjà terminé')

  const ecart    = parseFloat(trajet.qty_depart) - parseFloat(qty_arrivee)
  const aFraude  = ecart > parseFloat(trajet.seuil_fraude)
  const statut   = aFraude ? 'alerte' : 'arrive'

  const updated = await pool.query(
    `UPDATE trajets SET ended_at = NOW(), qty_arrivee = $1, ecart = $2, statut = $3
     WHERE id = $4 RETURNING *`,
    [qty_arrivee, ecart, statut, trajet_id]
  )

  if (aFraude) {
    const chauffeurResult = await pool.query(`SELECT nom FROM users WHERE id = $1`, [chauffeur_id])
    const nom = chauffeurResult.rows[0]?.nom ?? `Chauffeur #${chauffeur_id}`
    const msg = `Fraude citerne — ${nom} — Départ: ${trajet.qty_depart}L · Arrivée: ${qty_arrivee}L · Écart: ${ecart.toFixed(1)}L`

    await pool.query(
      `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'FRAUDE_CITERNE', $2)`,
      [trajet.station_id, msg]
    )
    if (app) notifyAlerte(app, trajet.station_id, { type: 'FRAUDE_CITERNE', message: msg })
    logger.warn(`Fraude citerne — Trajet ${trajet_id}: ${msg}`)
  }

  logger.info(`Trajet terminé — ${trajet_id} — Écart: ${ecart.toFixed(1)}L`)
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
     WHERE t.chauffeur_id = $1 AND t.statut = 'en_cours'
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

module.exports = { demarrerTrajet, ajouterPosition, arriverDestination, getTrajetActif, getTrajets, getGpsPoints }
