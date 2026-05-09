const pool = require('../config/database')

// ── Voir infos station ────────────────────
const getStation = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const result = await pool.query(
      'SELECT * FROM stations WHERE id = $1',
      [station_id]
    )
    res.json({ station: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Modifier infos station ────────────────
const updateStation = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { nom, adresse, ville, pays, seuil_essence, seuil_gasoil } = req.body

    const result = await pool.query(
      `UPDATE stations SET
      nom = COALESCE($1, nom),
      adresse = COALESCE($2, adresse),
      ville = COALESCE($3, ville),
      pays = COALESCE($4, pays),
      seuil_essence = COALESCE($5, seuil_essence),
      seuil_gasoil = COALESCE($6, seuil_gasoil)
      WHERE id = $7 RETURNING *`,
      [nom, adresse, ville, pays, seuil_essence, seuil_gasoil, station_id]
    )
    res.json({
      message: 'Station mise à jour',
      station: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getStation, updateStation }