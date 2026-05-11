// ================================================
// FUELO V2 — Gestion des employés
// ================================================

const pool   = require('../config/database')
const bcrypt = require('bcryptjs')

// ── Créer un employé (pompiste) ──────────────────────
const creerEmploye = async (req, res) => {
  try {
    const { nom, email, password } = req.body
    const station_id  = req.user.station_id
    const created_by  = req.user.id

    if (!nom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' })
    }

    // Vérifier si email existe déjà
    const existe = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (nom, email, password, role, created_by)
       VALUES ($1, $2, $3, 'pompiste', $4)
       RETURNING id, nom, email, role, actif, created_at`,
      [nom, email, hash, created_by]
    )

    // Lier l'employé à la station
    await pool.query(
      `INSERT INTO station_users (station_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [station_id, result.rows[0].id]
    )

    res.status(201).json({
      message: 'Employé créé avec succès',
      employe: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Liste des employés de la station ────────────────
const getEmployes = async (req, res) => {
  try {
    const station_id = req.user.station_id

    const result = await pool.query(
      `SELECT u.id, u.nom, u.email, u.role, u.actif, u.created_at,
        COUNT(v.id) as nb_ventes,
        COALESCE(SUM(v.montant_gnf), 0) as total_ventes
       FROM users u
       LEFT JOIN station_users su ON su.user_id = u.id
       LEFT JOIN ventes v ON v.user_id = u.id
         AND DATE(v.created_at) = CURRENT_DATE
       WHERE su.station_id = $1
         AND u.role = 'pompiste'
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [station_id]
    )

    res.json({ employes: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Activer / Désactiver un employé ─────────────────
const toggleEmploye = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { id } = req.params

    // Vérifier que l'employé appartient à cette station
    const check = await pool.query(
      `SELECT u.id, u.actif FROM users u
       JOIN station_users su ON su.user_id = u.id
       WHERE su.station_id = $1 AND u.id = $2`,
      [station_id, id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' })
    }

    const newStatus = !check.rows[0].actif

    await pool.query(
      'UPDATE users SET actif = $1 WHERE id = $2',
      [newStatus, id]
    )

    res.json({
      message: newStatus ? 'Employé activé' : 'Employé désactivé',
      actif: newStatus
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Ventes d'un employé ──────────────────────────────
const getVentesEmploye = async (req, res) => {
  try {
    const station_id = req.user.station_id
    const { id } = req.params

    const result = await pool.query(
      `SELECT v.*, u.nom as employe_nom
       FROM ventes v
       JOIN users u ON u.id = v.user_id
       WHERE v.station_id = $1 AND v.user_id = $2
       ORDER BY v.created_at DESC
       LIMIT 50`,
      [station_id, id]
    )

    res.json({ ventes: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { creerEmploye, getEmployes, toggleEmploye, getVentesEmploye }