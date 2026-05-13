// ================================================
// FUELO V2 — Pagination standard SaaS
// ================================================

const pool   = require('../config/database')
const logger = require('./logger')

// ── getPagination ────────────────────────────────────
// Extrait page + limit depuis req.query
// Usage : const { page, limit, offset } = getPagination(req)
const getPagination = (req, defaultLimit = 20, maxLimit = 100) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit) || defaultLimit))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

// ── paginatedQuery ───────────────────────────────────
// Exécute une requête paginée et retourne la réponse standard
// Usage :
//   const result = await paginatedQuery(
//     'SELECT * FROM ventes WHERE station_id = $1',
//     'SELECT COUNT(*) FROM ventes WHERE station_id = $1',
//     [station_id],
//     { page, limit, offset }
//   )
const paginatedQuery = async (dataQuery, countQuery, params, pagination) => {
  const { page, limit, offset } = pagination

  // Ajouter limit et offset à la query data
  const dataParams  = [...params, limit, offset]
  const dataQueryFull = `${dataQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQueryFull, dataParams),
    pool.query(countQuery, params),
  ])

  const total = parseInt(countResult.rows[0].count)
  const pages = Math.ceil(total / limit)

  return {
    data:    dataResult.rows,
    page,
    limit,
    total,
    pages,
    has_next: page < pages,
    has_prev: page > 1,
  }
}

// ── formatPaginatedResponse ──────────────────────────
// Format standard pour toutes les réponses paginées
const formatPaginatedResponse = (key, result) => ({
  [key]:    result.data,
  meta: {
    page:     result.page,
    limit:    result.limit,
    total:    result.total,
    pages:    result.pages,
    has_next: result.has_next,
    has_prev: result.has_prev,
  }
})

module.exports = { getPagination, paginatedQuery, formatPaginatedResponse }