// ================================================
// FUELO — Routes : Citernes
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isTransport } = require('../middleware/checkRole')
const pool   = require('../config/database')
const logger = require('../utils/logger')

// GET /api/citernes
router.get('/', verifyToken, isTransport, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.nom as chauffeur_nom
       FROM citernes c
       LEFT JOIN users u ON u.id = c.chauffeur_id
       WHERE c.owner_id IN (
         SELECT owner_id FROM stations WHERE id = $1
       ) AND c.actif = TRUE
       ORDER BY c.created_at DESC`,
      [req.user.station_id]
    )
    res.json({ citernes: result.rows })
  } catch (err) {
    logger.error('getCiternes', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/citernes
router.post('/', verifyToken, isTransport, async (req, res) => {
  try {
    const { code, capacite, chauffeur_id } = req.body
    if (!code || !capacite) return res.status(400).json({ error: 'code et capacite requis' })

    // Récupérer l'owner_id via la station
    const stationResult = await pool.query(`SELECT owner_id FROM stations WHERE id = $1`, [req.user.station_id])
    const owner_id = stationResult.rows[0]?.owner_id
    if (!owner_id) return res.status(400).json({ error: 'Station introuvable' })

    const result = await pool.query(
      `INSERT INTO citernes (code, capacite, owner_id, chauffeur_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [code, capacite, owner_id, chauffeur_id || null]
    )
    res.status(201).json({ message: 'Citerne créée', citerne: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: `Code "${req.body.code}" déjà utilisé` })
    logger.error('createCiterne', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/citernes/:id
router.put('/:id', verifyToken, isTransport, async (req, res) => {
  try {
    const { code, capacite, chauffeur_id } = req.body
    const result = await pool.query(
      `UPDATE citernes SET code = COALESCE($1, code), capacite = COALESCE($2, capacite),
       chauffeur_id = $3
       WHERE id = $4 AND owner_id IN (
         SELECT owner_id FROM stations WHERE id = $5
       ) RETURNING *`,
      [code, capacite, chauffeur_id || null, req.params.id, req.user.station_id]
    )
    if (!result.rows[0]) return res.status(403).json({ error: 'Citerne introuvable ou accès refusé' })
    res.json({ citerne: result.rows[0] })
  } catch (err) {
    logger.error('updateCiterne', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/citernes/:id (soft)
router.delete('/:id', verifyToken, isTransport, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE citernes SET actif = FALSE
       WHERE id = $1 AND owner_id IN (
         SELECT owner_id FROM stations WHERE id = $2
       ) RETURNING id`,
      [req.params.id, req.user.station_id]
    )
    if (!result.rows[0]) return res.status(403).json({ error: 'Citerne introuvable ou accès refusé' })
    res.json({ message: 'Citerne supprimée' })
  } catch (err) {
    logger.error('deleteCiterne', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
