// ================================================
// FUELO — Service Layer : Anti-fraude pompistes
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { notifyAlerte } = require('../utils/socketNotify')

const SEUIL_FRAUDE_LITRES = 10 // écart > 10L déclenche une alerte fraude

// ── Démarrer un service ──────────────────────────
const demarrerService = async (user, data, photoUrl) => {
  const { station_id, id: user_id } = user
  const { compteur_essence_debut, compteur_gasoil_debut } = data

  // Un seul service actif à la fois par pompiste
  const existant = await pool.query(
    `SELECT id FROM services WHERE user_id = $1 AND station_id = $2 AND statut = 'en_cours'`,
    [user_id, station_id]
  )
  if (existant.rows.length > 0) {
    throw new Error('Vous avez déjà un service en cours. Terminez-le avant d\'en démarrer un nouveau.')
  }

  const result = await pool.query(
    `INSERT INTO services (station_id, user_id, photo_debut_url, compteur_essence_debut, compteur_gasoil_debut)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      station_id,
      user_id,
      photoUrl || null,
      compteur_essence_debut ? parseFloat(compteur_essence_debut) : null,
      compteur_gasoil_debut  ? parseFloat(compteur_gasoil_debut)  : null,
    ]
  )

  logger.info(`Service démarré — Station ${station_id} — Pompiste ${user_id}`)
  return result.rows[0]
}

// ── Terminer un service + calcul écart ──────────
const terminerService = async (user, serviceId, data, photoUrl, app) => {
  const { station_id, id: user_id } = user
  const { compteur_essence_fin, compteur_gasoil_fin } = data

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Récupérer le service en cours
    const serviceResult = await client.query(
      `SELECT * FROM services
       WHERE id = $1 AND user_id = $2 AND station_id = $3 AND statut = 'en_cours'
       FOR UPDATE`,
      [serviceId, user_id, station_id]
    )
    if (!serviceResult.rows[0]) throw new Error('Service introuvable ou déjà terminé')
    const service = serviceResult.rows[0]

    // Somme des ventes enregistrées pendant ce service
    const ventesResult = await client.query(
      `SELECT type, COALESCE(SUM(litres), 0) AS total_litres
       FROM ventes
       WHERE station_id = $1 AND user_id = $2 AND deleted_at IS NULL
         AND created_at >= $3
       GROUP BY type`,
      [station_id, user_id, service.started_at]
    )
    const ventesByType = { essence: 0, gasoil: 0 }
    ventesResult.rows.forEach(r => { ventesByType[r.type] = parseFloat(r.total_litres) })

    // Calcul des écarts (consommation réelle - ventes enregistrées)
    let ecart_essence = null
    let ecart_gasoil  = null

    if (service.compteur_essence_debut != null && compteur_essence_fin != null) {
      const finNum = parseFloat(compteur_essence_fin)
      if (isNaN(finNum)) throw new Error('Compteur essence invalide (doit être un nombre)')
      const conso_reelle = finNum - parseFloat(service.compteur_essence_debut)
      ecart_essence = conso_reelle - ventesByType.essence
    }
    if (service.compteur_gasoil_debut != null && compteur_gasoil_fin != null) {
      const finNum = parseFloat(compteur_gasoil_fin)
      if (isNaN(finNum)) throw new Error('Compteur gasoil invalide (doit être un nombre)')
      const conso_reelle = finNum - parseFloat(service.compteur_gasoil_debut)
      ecart_gasoil = conso_reelle - ventesByType.gasoil
    }

    const aFraude =
      (ecart_essence != null && Math.abs(ecart_essence) > SEUIL_FRAUDE_LITRES) ||
      (ecart_gasoil  != null && Math.abs(ecart_gasoil)  > SEUIL_FRAUDE_LITRES)

    const statut = aFraude ? 'alerte' : 'termine'

    // Mettre à jour le service
    const updated = await client.query(
      `UPDATE services SET
         ended_at             = NOW(),
         photo_fin_url        = $1,
         compteur_essence_fin = $2,
         compteur_gasoil_fin  = $3,
         ecart_essence        = $4,
         ecart_gasoil         = $5,
         statut               = $6
       WHERE id = $7 RETURNING *`,
      [
        photoUrl || null,
        compteur_essence_fin ? parseFloat(compteur_essence_fin) : null,
        compteur_gasoil_fin  ? parseFloat(compteur_gasoil_fin)  : null,
        ecart_essence,
        ecart_gasoil,
        statut,
        serviceId,
      ]
    )

    // Créer alerte fraude si écart détecté
    if (aFraude) {
      const pompiste = await client.query(`SELECT nom FROM users WHERE id = $1`, [user_id])
      const nomPompiste = pompiste.rows[0]?.nom || `Pompiste #${user_id}`

      const parties = []
      if (ecart_essence != null && Math.abs(ecart_essence) > SEUIL_FRAUDE_LITRES) {
        parties.push(`Essence: écart ${ecart_essence > 0 ? '+' : ''}${ecart_essence.toFixed(1)}L`)
      }
      if (ecart_gasoil != null && Math.abs(ecart_gasoil) > SEUIL_FRAUDE_LITRES) {
        parties.push(`Gasoil: écart ${ecart_gasoil > 0 ? '+' : ''}${ecart_gasoil.toFixed(1)}L`)
      }

      const message = `Fraude potentielle — ${nomPompiste} — ${parties.join(' | ')}`

      await client.query(
        `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'FRAUDE', $2)`,
        [station_id, message]
      )

      if (app) notifyAlerte(app, station_id, { type: 'FRAUDE', message })
      logger.warn(`Alerte fraude — Station ${station_id} — ${nomPompiste}: ${parties.join(', ')}`)
    }

    await client.query('COMMIT')

    return { service: updated.rows[0], ventes: ventesByType, alerte_fraude: aFraude }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Service actif du pompiste connecté ───────────
const getServiceActif = async (user) => {
  const result = await pool.query(
    `SELECT s.*, u.nom AS pompiste_nom
     FROM services s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1 AND s.station_id = $2 AND s.statut = 'en_cours'
     ORDER BY s.started_at DESC LIMIT 1`,
    [user.id, user.station_id]
  )
  return result.rows[0] || null
}

// ── Liste des services (owner/gérant) ────────────
const getServices = async (station_id, filters = {}) => {
  const { statut, user_id } = filters
  const params = [station_id]
  let where = 'WHERE s.station_id = $1'

  if (statut) {
    params.push(statut)
    where += ` AND s.statut = $${params.length}`
  }
  if (user_id) {
    params.push(parseInt(user_id))
    where += ` AND s.user_id = $${params.length}`
  }

  const result = await pool.query(
    `SELECT s.*, u.nom AS pompiste_nom
     FROM services s
     LEFT JOIN users u ON u.id = s.user_id
     ${where}
     ORDER BY s.started_at DESC
     LIMIT 100`,
    params
  )
  return result.rows
}

module.exports = { demarrerService, terminerService, getServiceActif, getServices }
