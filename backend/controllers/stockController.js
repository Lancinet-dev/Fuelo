const pool = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

// ── Voir stock actuel ─────────────────────
const getStock = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const [result, consommation] = await Promise.all([
      pool.query(
        'SELECT type, quantite, updated_at FROM stocks WHERE station_id = $1',
        [station_id]
      ),
      pool.query(
        `SELECT type_carburant as type, COALESCE(SUM(litres), 0) / 7.0 as litres_par_jour
         FROM ventes
         WHERE station_id = $1
           AND created_at >= NOW() - INTERVAL '7 days'
           AND deleted_at IS NULL
         GROUP BY type_carburant`,
        [station_id]
      ),
    ])

    const consoMap = {}
    for (const c of consommation.rows) consoMap[c.type] = parseFloat(c.litres_par_jour)

    const stocks = {}
    for (const row of result.rows) {
      const cj = consoMap[row.type] || 0
      stocks[row.type] = {
        quantite:          row.quantite,
        updated_at:        row.updated_at,
        conso_journaliere: Math.round(cj * 10) / 10,
        jours_restants:    cj > 0 ? Math.floor(parseFloat(row.quantite) / cj) : null,
      }
    }

    res.json({ stock: stocks })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
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

    // Garde-fou : si la station n'a pas encore de ligne stock pour ce type
    // (station créée avant l'init automatique essence/gasoil), on la crée.
    if (!result.rows[0]) {
      const inserted = await pool.query(
        `INSERT INTO stocks (station_id, type, quantite)
         VALUES ($1, $2, $3)
         ON CONFLICT (station_id, type) DO UPDATE SET quantite = stocks.quantite + EXCLUDED.quantite, updated_at = NOW()
         RETURNING quantite`,
        [station_id, type, quantite]
      )
      return res.json({
        message: `Livraison de ${quantite}L de ${type} ajoutée`,
        nouveau_stock: inserted.rows[0].quantite,
      })
    }

    res.json({
      message: `Livraison de ${quantite}L de ${type} ajoutée`,
      nouveau_stock: result.rows[0].quantite
    })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}
module.exports = { getStock, ajouterLivraison }