// ================================================
// FUELO V2 — Service Layer : Ventes
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { notifyVente, notifyAlerte, notifyStock } = require('../utils/socketNotify')

// ── Créer une vente (logique ACID complète) ──────────
const createVente = async (user, data, app) => {
  const { station_id, id: user_id } = user
  const { type, litres, montant_gnf } = data

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // 1. Vérifier stock suffisant
    const stockResult = await client.query(
      'SELECT quantite FROM stocks WHERE station_id = $1 AND type = $2 FOR UPDATE',
      [station_id, type]
    )

    if (!stockResult.rows[0]) throw new Error('Stock introuvable pour ce type de carburant')

    const stockActuel = parseFloat(stockResult.rows[0].quantite)
    if (stockActuel < litres) {
      throw new Error(`Stock insuffisant. Disponible: ${stockActuel}L — Demandé: ${litres}L`)
    }

    // 2. Déduire du stock
    const nouveauStockResult = await client.query(
      `UPDATE stocks SET quantite = quantite - $1, updated_at = NOW()
       WHERE station_id = $2 AND type = $3 RETURNING quantite`,
      [litres, station_id, type]
    )
    const stockRestant = parseFloat(nouveauStockResult.rows[0].quantite)

    // 3. Enregistrer la vente
    const venteResult = await client.query(
      `INSERT INTO ventes (station_id, user_id, type, litres, montant_gnf)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [station_id, user_id, type, litres, montant_gnf]
    )
    const vente = venteResult.rows[0]

    // 4. Vérifier seuil alerte
    const seuilCol   = type === 'essence' ? 'seuil_essence' : 'seuil_gasoil'
    const seuilResult = await client.query(
      `SELECT ${seuilCol}, nom FROM stations WHERE id = $1`, [station_id]
    )
    const seuilMin  = parseFloat(seuilResult.rows[0][seuilCol])
    let alertCreee  = false

    if (stockRestant <= seuilMin) {
      const msg = `Stock ${type} faible: ${stockRestant.toFixed(1)}L restants (seuil: ${seuilMin}L)`
      await client.query(
        `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'STOCK_FAIBLE', $2)`,
        [station_id, msg]
      )
      alertCreee = true

      // 🔔 Notifier alerte stock en temps réel
      if (app) notifyAlerte(app, station_id, { type, message: msg })
    }

    await client.query('COMMIT')

    // 🔔 Notifier nouvelle vente en temps réel
    if (app) {
      notifyVente(app, station_id, { ...vente, employe_nom: user.nom })
      notifyStock(app, station_id, { type, quantite: stockRestant })
    }

    logger.info(`Vente enregistrée — Station ${station_id} — ${litres}L ${type} — ${montant_gnf} GNF`)

    return {
      message:       'Vente enregistrée avec succès',
      vente,
      stock_restant: stockRestant,
      alerte:        alertCreee,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    logger.error(`Erreur vente — Station ${station_id}: ${err.message}`)
    throw err
  } finally {
    client.release()
  }
}

// ── Récupérer les ventes paginées ────────────────────
const getVentesPaginated = async (station_id, filters = {}, pagination) => {
  const { type, search } = filters
  const { limit, offset } = pagination

  let whereClause = 'WHERE v.station_id = $1 AND v.deleted_at IS NULL'
  const params    = [station_id]

  if (type && ['essence', 'gasoil'].includes(type)) {
    params.push(type)
    whereClause += ` AND v.type = $${params.length}`
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`)
    whereClause += ` AND u.nom ILIKE $${params.length}`
  }

  const dataQuery = `
    SELECT v.*, u.nom as employe_nom
    FROM ventes v
    LEFT JOIN users u ON u.id = v.user_id
    ${whereClause}
    ORDER BY v.created_at DESC
  `
  const countQuery = `
    SELECT COUNT(*)
    FROM ventes v
    LEFT JOIN users u ON u.id = v.user_id
    ${whereClause}
  `
  const dataParams = [...params, limit, offset]
  const dataFull   = `${dataQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

  const [data, count] = await Promise.all([
    pool.query(dataFull, dataParams),
    pool.query(countQuery, params),
  ])

  return { ventes: data.rows, total: parseInt(count.rows[0].count) }
}

// ── 5 dernières ventes (dashboard) ──────────────────
const getVentesRecentes = async (station_id) => {
  const result = await pool.query(
    `SELECT v.id, v.type, v.litres, v.montant_gnf, v.created_at, u.nom as employe_nom
     FROM ventes v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.station_id = $1 AND v.deleted_at IS NULL
     ORDER BY v.created_at DESC LIMIT 5`,
    [station_id]
  )
  return result.rows
}

module.exports = { createVente, getVentesPaginated, getVentesRecentes }