const pool = require('../config/database')

// ── Enregistrer une vente ─────────────────
const enregistrerVente = async (req, res) => {
  const client = await pool.connect()
  try {
    const station_id = req.user.station_id
    const user_id = req.user.id
    const { type, litres, montant_gnf } = req.body

    // Vérifier type valide
    if (!['essence', 'gasoil'].includes(type)) {
      return res.status(400).json({ error: 'Type doit être essence ou gasoil' })
    }

    // Démarrer transaction ACID
    await client.query('BEGIN')

    // Vérifier stock suffisant
    const stockResult = await client.query(
      'SELECT quantite FROM stocks WHERE station_id = $1 AND type = $2',
      [station_id, type]
    )

    const stockActuel = stockResult.rows[0].quantite

    if (stockActuel < litres) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: `Stock insuffisant. Disponible: ${stockActuel}L`
      })
    }

    // Déduire du stock
    const nouveauStock = await client.query(
      `UPDATE stocks SET quantite = quantite - $1,
      updated_at = NOW()
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

    // Vérifier si alerte nécessaire
    const stockRestant = nouveauStock.rows[0].quantite
    const seuil = await client.query(
      `SELECT seuil_${type === 'essence' ? 'essence' : 'gasoil'}
      FROM stations WHERE id = $1`,
      [station_id]
    )

    const seuilMin = type === 'essence'
      ? seuil.rows[0].seuil_essence
      : seuil.rows[0].seuil_gasoil

    if (stockRestant <= seuilMin) {
      await client.query(
        `INSERT INTO alertes (station_id, type, message)
        VALUES ($1, $2, $3)`,
        [station_id, 'STOCK_FAIBLE',
        `Stock ${type} faible: ${stockRestant}L restants`]
      )
    }

    // Confirmer transaction
    await client.query('COMMIT')

    res.status(201).json({
      message: 'Vente enregistrée',
      vente: vente.rows[0],
      stock_restant: stockRestant,
      alerte: stockRestant <= seuilMin
    })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// ── Historique des ventes ─────────────────
const getVentes = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query(
      `SELECT * FROM ventes
      WHERE station_id = $1
      ORDER BY created_at DESC LIMIT 50`,
      [station_id]
    )
    res.json({ ventes: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Ventes du jour ────────────────────────
const getVentesAujourdhui = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query(
      `SELECT
      COUNT(*) as nb_ventes,
      SUM(litres) as total_litres,
      SUM(montant_gnf) as total_gnf
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

module.exports = { enregistrerVente, getVentes, getVentesAujourdhui }