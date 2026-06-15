// ================================================
// FUELO — Service notifications in-app
// ================================================
// Crée des notifications persistantes ET les pousse en temps réel vers la room
// privée user_${id} (event 'notification:new').

const pool   = require('../config/database')
const logger = require('../utils/logger')
const { emitToUsers } = require('../utils/socketNotify')

/**
 * Crée une notification persistante pour un utilisateur + push temps réel.
 * @param {number} userId
 * @param {{ titre: string, corps?: string, type?: string, lienUrl?: string }} payload
 * @param {object} [app] - app Express (pour émettre via Socket.IO)
 */
const creerNotification = async (userId, { titre, corps = null, type = 'info', lienUrl = null }, app = null) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, titre, corps, type, lien_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, titre, corps, type, lien_url, lu, created_at`,
      [userId, titre, corps, type, lienUrl]
    )
    const notif = rows[0]
    if (app && notif) emitToUsers(app, [userId], 'notification:new', notif)
    return notif
  } catch (err) {
    logger.error(`[notification] Erreur création pour user ${userId}: ${err.message}`)
    return null
  }
}

/**
 * Notifie tous les owners/gérants d'une station (alertes opérationnelles).
 * @param {number} stationId
 * @param {object} payload
 * @param {object} [app]
 * @param {{ exclure?: number[] }} [opts]
 */
const notifierStation = async (stationId, payload, app = null, { exclure = [] } = {}) => {
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
      if (exclure.includes(u.id)) continue
      await creerNotification(u.id, payload, app)
    }
  } catch (err) {
    logger.error(`[notification] Erreur notifierStation ${stationId}: ${err.message}`)
  }
}

module.exports = { creerNotification, notifierStation }
