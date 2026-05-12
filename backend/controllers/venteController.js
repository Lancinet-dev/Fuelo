// ================================================
// FUELO V2 — Ventes Controller complet
// ================================================

const pool = require('../config/database')

// ── Enregistrer une vente ────────────────────────────
const enregistrerVente = async (req, res) => {
  const client = await pool.connect()
  try {
    const station_id = req.user.station_id
    const user_id    = req.user.id
    const { type, litres, montant_gnf } = req.body

    if (!['essence', 'gasoil'].includes(type)) {
      return res.status(400).json({ error: 'Type doit être essence ou gasoil' })
    }

    await client.query('BEGIN')

    // Vérifier stock suffisant
    const stockResult = await client.query(
      'SELECT quantite FROM stocks WHERE station_id = $1 AND type = $2',
      [station_id, type]
    )

    if (!stockResult.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Stock introuvable' })
    }

    const stockActuel = parseFloat(stockResult.rows[0].quantite)

    if (stockActuel < litres) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Stock insuffisant. Disponible: ${stockActuel}L`
      })
    }

    // Déduire du stock
    const nouveauStock = await client.query(
      `UPDATE stocks
       SET quantite = quantite - $1, updated_at = NOW()
       WHERE station_id = $2 AND type = $3
       RETURNING quantite`,
      [litres, station_id, type]
    )

    // Enregistrer la vente
    const vente = await client.query(
      `INSERT INTO ventes (station_id, user_id, type, litres, montant_gnf)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [station_id, user_id, type, litres, montant_gnf]
    )

    // Vérifier seuil alerte
    const stockRestant = parseFloat(nouveauStock.rows[0].quantite)
    const seuilCol = type === 'essence' ? 'seuil_essence' : 'seuil_gasoil'

    const seuil = await client.query(
      `SELECT ${seuilCol} FROM stations WHERE id = $1`,
      [station_id]
    )

    const seuilMin = parseFloat(seuil.rows[0][seuilCol])

    if (stockRestant <= seuilMin) {
      await client.query(
        `INSERT INTO alertes (station_id, type, message)
         VALUES ($1, 'STOCK_FAIBLE', $2)`,
        [station_id, `Stock ${type} faible: ${stockRestant}L restants`]
      )
    }

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Vente enregistrée',
      vente:        vente.rows[0],
      stock_restant: stockRestant,
      alerte:       stockRestant <= seuilMin
    })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// ── Historique des ventes ────────────────────────────
const getVentes = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { type, limit = 50, offset = 0 } = req.query

    let query = `
      SELECT v.*, u.nom as employe_nom
      FROM ventes v
      LEFT JOIN users u ON u.id = v.user_id
      WHERE v.station_id = $1
    `
    const params = [station_id]

    if (type && ['essence', 'gasoil'].includes(type)) {
      params.push(type)
      query += ` AND v.type = $${params.length}`
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(query, params)
    res.json({ ventes: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── 5 dernières ventes (pour dashboard) ─────────────
const getVentesRecentes = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT v.id, v.type, v.litres, v.montant_gnf, v.created_at, u.nom as employe_nom
       FROM ventes v
       LEFT JOIN users u ON u.id = v.user_id
       WHERE v.station_id = $1
       ORDER BY v.created_at DESC
       LIMIT 5`,
      [station_id]
    )

    res.json({ ventes: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Ventes du jour ────────────────────────────────────
const getVentesAujourdhui = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT COUNT(*) as nb,
       COALESCE(SUM(litres), 0) as total_litres,
       COALESCE(SUM(montant_gnf), 0) as total_gnf
       FROM ventes
       WHERE station_id = $1
       AND DATE(created_at) = CURRENT_DATE`,
      [station_id]
    )

    res.json({ aujourdhui: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  enregistrerVente,
  getVentes,
  getVentesRecentes,
  getVentesAujourdhui
}