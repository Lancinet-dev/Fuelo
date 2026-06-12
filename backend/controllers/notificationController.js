// ================================================
// FUELO — Contrôleur notifications in-app
// ================================================

const pool         = require('../config/database')
const erreurServeur = require('../utils/erreurServeur')

const listerNotifications = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, titre, corps, type, lien_url, lu, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    )
    const nbNonLues = rows.filter(n => !n.lu).length
    res.json({ notifications: rows, nbNonLues })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const marquerToutLu = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET lu = true WHERE user_id = $1 AND lu = false`,
      [req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const marquerLu = async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      `UPDATE notifications SET lu = true WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { listerNotifications, marquerLu, marquerToutLu }
