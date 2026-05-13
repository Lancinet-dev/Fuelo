// ================================================
// FUELO V2 — Vente Controller (léger grâce au service)
// ================================================

const venteService = require('../services/venteService')
const { getPagination, formatPaginatedResponse } = require('../utils/pagination')
const logger = require('../utils/logger')
const pool   = require('../config/database')

// ── Enregistrer une vente ────────────────────────────
const enregistrerVente = async (req, res) => {
  try {
    const result = await venteService.createVente(req.user, req.body)
    res.status(201).json(result)
  } catch (err) {
    logger.error('enregistrerVente', err)
    res.status(400).json({ error: err.message })
  }
}

// ── Historique ventes paginé ─────────────────────────
const getVentes = async (req, res) => {
  try {
    const station_id  = req.user.station_id
    const pagination  = getPagination(req)
    const filters     = { type: req.query.type }

    const { ventes, total } = await venteService.getVentesPaginated(
      station_id, filters, pagination
    )

    res.json(formatPaginatedResponse('ventes', {
      data: ventes,
      ...pagination,
      total,
      pages: Math.ceil(total / pagination.limit),
      has_next: pagination.page < Math.ceil(total / pagination.limit),
      has_prev: pagination.page > 1,
    }))
  } catch (err) {
    logger.error('getVentes', err)
    res.status(500).json({ error: err.message })
  }
}

// ── 5 dernières ventes (dashboard) ──────────────────
const getVentesRecentes = async (req, res) => {
  try {
    const ventes = await venteService.getVentesRecentes(req.user.station_id)
    res.json({ ventes })
  } catch (err) {
    logger.error('getVentesRecentes', err)
    res.status(500).json({ error: err.message })
  }
}

// ── Ventes du jour ────────────────────────────────────
const getVentesAujourdhui = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as nb,
       COALESCE(SUM(litres), 0) as total_litres,
       COALESCE(SUM(montant_gnf), 0) as total_gnf
       FROM ventes
       WHERE station_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.user.station_id]
    )
    res.json({ aujourdhui: result.rows[0] })
  } catch (err) {
    logger.error('getVentesAujourdhui', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { enregistrerVente, getVentes, getVentesRecentes, getVentesAujourdhui }