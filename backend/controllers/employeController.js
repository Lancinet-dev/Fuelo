// ================================================
// FUELO V2.1 — Employé Controller
// ================================================

const pool              = require('../config/database')
const bcrypt            = require('bcryptjs')
const { AppError, asyncHandler } = require('../utils/appError')
const { auditLog }      = require('../middleware/auditLog')
const logger            = require('../utils/logger')

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

// ── Créer un employé ─────────────────────────────────
const creerEmploye = asyncHandler(async (req, res) => {
  const nom        = req.body.nom?.trim()
  const email      = req.body.email?.trim().toLowerCase()
  const password   = req.body.password || ''
  const role       = normalizeRole(req.body.role || 'pompiste')
  const station_id = req.user.station_id
  const created_by = req.user.id

  if (!['pompiste', 'gerant', 'chauffeur', 'logisticien'].includes(role)) {
    throw new AppError('Rôle invalide. Choisissez pompiste, gerant, chauffeur ou logisticien.', 400)
  }

  const existe = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL',
    [email]
  )
  if (existe.rows.length > 0) throw new AppError('Cet email est déjà utilisé', 400)

  const hash   = await bcrypt.hash(password, 10)
  const result = await pool.query(
    `INSERT INTO users (nom, email, password, role, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, nom, email, role, actif, created_at`,
    [nom, email, hash, role, created_by]
  )

  const employe = { ...result.rows[0], role: normalizeRole(result.rows[0].role) }

  await pool.query(
    `INSERT INTO station_users (station_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [station_id, employe.id]
  )

  await auditLog(req, 'CREATE', 'users', employe.id, { nom, email, role })
  logger.info(`Employé créé — Station ${station_id} — ${nom} (${role})`)

  res.status(201).json({ message: 'Employé créé avec succès', employe })
})

// ── Liste des employés — N'affiche PAS les owners ────
const getEmployes = asyncHandler(async (req, res) => {
  const station_id = req.user.station_id

  const result = await pool.query(
    `SELECT
       u.id, u.nom, u.email,
       CASE WHEN LOWER(u.role) = 'manager' THEN 'gerant' ELSE LOWER(u.role) END AS role,
       u.actif, u.created_at,
       COUNT(v.id)                     AS nb_ventes_jour,
       COALESCE(SUM(v.montant_gnf), 0) AS total_ventes_jour
     FROM users u
     LEFT JOIN station_users su ON su.user_id = u.id
     LEFT JOIN ventes v
       ON v.user_id = u.id
       AND DATE(v.created_at) = CURRENT_DATE
       AND v.deleted_at IS NULL
     WHERE su.station_id = $1
       AND LOWER(u.role) IN ('pompiste', 'gerant', 'manager', 'chauffeur', 'logisticien')
       AND u.deleted_at IS NULL
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [station_id]
  )

  res.json({
    employes: result.rows.map(row => ({ ...row, role: normalizeRole(row.role) })),
  })
})

// ── Activer / Désactiver ─────────────────────────────
const toggleEmploye = asyncHandler(async (req, res) => {
  const station_id = req.user.station_id
  const { id }     = req.params

  // Bloquer toggle de soi-même
  if (parseInt(id) === req.user.id) {
    throw new AppError('Vous ne pouvez pas désactiver votre propre compte', 400)
  }

  const check = await pool.query(
    `SELECT u.id, u.actif, u.nom, u.role FROM users u
     JOIN station_users su ON su.user_id = u.id
     WHERE su.station_id = $1 AND u.id = $2 AND u.deleted_at IS NULL`,
    [station_id, id]
  )

  if (check.rows.length === 0) throw new AppError('Employé non trouvé', 404)

  // Bloquer toggle d'un owner
  if (['owner', 'superadmin'].includes(check.rows[0].role)) {
    throw new AppError('Impossible de modifier un propriétaire', 403)
  }

  const newStatus = !check.rows[0].actif
  await pool.query('UPDATE users SET actif = $1 WHERE id = $2', [newStatus, id])

  await auditLog(req, newStatus ? 'ACTIVATE' : 'DEACTIVATE', 'users', parseInt(id), {
    nom: check.rows[0].nom,
  })

  res.json({ message: newStatus ? 'Employé activé' : 'Employé désactivé', actif: newStatus })
})

// ── Supprimer un employé (soft delete) ───────────────
const supprimerEmploye = asyncHandler(async (req, res) => {
  const station_id = req.user.station_id
  const { id }     = req.params

  // Bloquer suppression de soi-même
  if (parseInt(id) === req.user.id) {
    throw new AppError('Vous ne pouvez pas supprimer votre propre compte', 400)
  }

  const check = await pool.query(
    `SELECT u.id, u.nom, u.role FROM users u
     JOIN station_users su ON su.user_id = u.id
     WHERE su.station_id = $1 AND u.id = $2 AND u.deleted_at IS NULL`,
    [station_id, id]
  )

  if (check.rows.length === 0) throw new AppError('Employé non trouvé', 404)

  // Bloquer suppression d'un owner
  if (['owner', 'superadmin'].includes(check.rows[0].role)) {
    throw new AppError('Impossible de supprimer un propriétaire', 403)
  }

  await pool.query(
    'UPDATE users SET deleted_at = NOW(), actif = false WHERE id = $1', [id]
  )

  await auditLog(req, 'DELETE', 'users', parseInt(id), { nom: check.rows[0].nom })
  logger.info(`Employé supprimé (soft) — ${check.rows[0].nom}`)

  res.json({ message: 'Employé supprimé avec succès' })
})

// ── Ventes d'un employé ──────────────────────────────
const getVentesEmploye = asyncHandler(async (req, res) => {
  const station_id = req.user.station_id
  const { id }     = req.params

  const result = await pool.query(
    `SELECT v.*, u.nom AS employe_nom
     FROM ventes v
     JOIN users u ON u.id = v.user_id
     WHERE v.station_id = $1
       AND v.user_id = $2
       AND v.deleted_at IS NULL
     ORDER BY v.created_at DESC
     LIMIT 50`,
    [station_id, id]
  )

  res.json({ ventes: result.rows })
})

module.exports = {
  creerEmploye,
  getEmployes,
  toggleEmploye,
  supprimerEmploye,
  getVentesEmploye,
}