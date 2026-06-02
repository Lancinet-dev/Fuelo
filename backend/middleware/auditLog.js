// ================================================
// FUELO V2.1 — Middleware Audit Logs
// Enregistre automatiquement les actions importantes
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')

// ── auditLog ─────────────────────────────────────────
// Usage dans un controller :
// await auditLog(req, 'CREATE', 'ventes', vente.id, { litres, montant_gnf })
const auditLog = async (req, action, tableName, recordId = null, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user?.id || null,
        action,
        tableName,
        recordId,
        JSON.stringify(details),
        req.ip || req.headers['x-forwarded-for'] || null,
      ]
    )
  } catch (err) {
    // Ne jamais bloquer l'action principale à cause d'un log
    logger.error('Erreur audit log', err)
  }
}

// ── Middleware automatique pour certaines routes ──────
// Actions loguées automatiquement : CREATE, UPDATE, DELETE
const autoAudit = (action, tableName) => async (req, res, next) => {
  // On surcharge res.json pour capturer la réponse
  const originalJson = res.json.bind(res)
  res.json = async (data) => {
    if (res.statusCode < 400) {
      const recordId = data?.id || data?.vente?.id || data?.employe?.id || null
      await auditLog(req, action, tableName, recordId, {
        method: req.method,
        path:   req.path,
      })
    }
    return originalJson(data)
  }
  next()
}

module.exports = { auditLog, autoAudit }