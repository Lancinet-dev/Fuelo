const pool = require('../config/database')

// ── Voir stock actuel ─────────────────────
const getStock = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      'SELECT type, quantite, updated_at FROM stocks WHERE station_id = $1',
      [station_id]
    )

    const stocks = {}
      result.rows.forEach(row => {
      stocks[row.type] = {
        quantite: row.quantite,
        updated_at: row.updated_at
      }
    })

    res.json({ stock: stocks })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
// ── Ajouter une livraison ─────────────────
const ajouterLivraison = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { type, quantite } = req.body

    // Vérifier type valide
    if (!['essence', 'gasoil'].includes(type)) {
      return res.status(400).json({ error: 'Type doit être essence ou gasoil' })
    }

    // Ajouter au stock existant
    const result = await pool.query(
      `UPDATE stocks
      SET quantite = quantite + $1, updated_at = NOW()
      WHERE station_id = $2 AND type = $3
      RETURNING quantite`,
         [quantite, station_id, type]
    )

    res.json({
      message: `Livraison de ${quantite}L de ${type} ajoutée`,
      nouveau_stock: result.rows[0].quantite
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
module.exports = { getStock, ajouterLivraison }