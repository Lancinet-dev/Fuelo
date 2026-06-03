// ================================================
// FUELO — Tâches planifiées (Cron Jobs)
// Fichier : backend/utils/cronJobs.js
// ================================================

const cron   = require('node-cron')
const logger = require('./logger')
const { envoyerTousLesRapports } = require('../services/reportService')
const { lancerBackup }           = require('../services/backupService')

const initCronJobs = () => {

  // ── Rapport mensuel — 1er du mois à 8h00 ────────
  cron.schedule('0 8 1 * *', async () => {
    logger.info('🕐 Cron: Envoi rapports mensuels...')
    const now   = new Date()
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const month = now.getMonth() === 0 ? 12 : now.getMonth()
    await envoyerTousLesRapports(year, month)
  }, { timezone: 'Africa/Conakry' })

  // ── Vérification alertes stock — toutes les heures ─
  cron.schedule('0 * * * *', async () => {
    logger.info('🕐 Cron: Vérification stocks...')
    try {
      const pool = require('../config/database')
      const result = await pool.query(`
        SELECT s.station_id, s.type, s.quantite,
               st.seuil_essence, st.seuil_gasoil
        FROM stocks s
        JOIN stations st ON st.id = s.station_id
        WHERE (s.type = 'essence' AND s.quantite <= st.seuil_essence)
           OR (s.type = 'gasoil'  AND s.quantite <= st.seuil_gasoil)
      `)

      for (const row of result.rows) {
        const seuil = row.type === 'essence' ? row.seuil_essence : row.seuil_gasoil
        const msg   = `Stock ${row.type} faible: ${row.quantite.toFixed(1)}L (seuil: ${seuil}L)`

        // Vérifier si une alerte récente existe déjà (dernière heure)
        const existing = await pool.query(
          `SELECT id FROM alertes
           WHERE station_id = $1 AND type = 'STOCK_FAIBLE'
             AND created_at > NOW() - INTERVAL '1 hour'
           LIMIT 1`,
          [row.station_id]
        )

        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO alertes (station_id, type, message) VALUES ($1, 'STOCK_FAIBLE', $2)`,
            [row.station_id, msg]
          )
          logger.info(`Alerte créée: ${msg}`)
        }
      }
    } catch (err) {
      logger.error('Cron stock check error:', err.message)
    }
  }, { timezone: 'Africa/Conakry' })

  // ── Backup quotidien DB — chaque nuit à 2h00 ────
  cron.schedule('0 2 * * *', async () => {
    logger.info('🕐 Cron: Backup quotidien DB...')
    await lancerBackup()
  }, { timezone: 'Africa/Conakry' })

  logger.info('✅ Cron jobs initialisés')
}

module.exports = { initCronJobs }