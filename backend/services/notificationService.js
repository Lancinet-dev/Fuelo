// ================================================
// FUELO — Service notifications in-app
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

/**
 * Crée une notification persistante pour un utilisateur.
 * @param {number} userId
 * @param {{ titre: string, corps?: string, type?: string, lienUrl?: string }} payload
 */
const creerNotification = async (userId, { titre, corps = null, type = 'info', lienUrl = null }) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, titre, corps, type, lien_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userId, titre, corps, type, lienUrl]
    )
    return rows[0]
  } catch (err) {
    logger.error(`[notification] Erreur création pour user ${userId}: ${err.message}`)
    return null
  }
}

/**
 * Crée une notification pour tous les owners/gérants d'une station.
 */
const notifierStation = async (stationId, payload) => {
  try {
    const { rows: users } = await pool.query(
      `SELECT u.id
       FROM station_users su
       JOIN users u ON u.id = su.user_id
       WHERE su.station_id = $1
         AND u.role IN ('owner', 'gerant')
         AND u.deleted_at IS NULL`,
      [stationId]
    )
    for (const u of users) {
      await creerNotification(u.id, payload)
    }
  } catch (err) {
    logger.error(`[notification] Erreur notifierStation ${stationId}: ${err.message}`)
  }
}

module.exports = { creerNotification, notifierStation }
