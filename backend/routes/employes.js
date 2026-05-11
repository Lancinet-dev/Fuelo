// ================================================
// FUELO V2 — Routes employés
// ================================================

const express = require('express')
const router  = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const {
  creerEmploye,
  getEmployes,
  toggleEmploye,
  getVentesEmploye
} = require('../controllers/employeController')

// Toutes ces routes nécessitent d'être manager ou owner
router.post('/',              verifyToken, isManager, creerEmploye)
router.get('/',               verifyToken, isManager, getEmployes)
router.put('/:id/toggle',     verifyToken, isManager, toggleEmploye)
router.get('/:id/ventes',     verifyToken, isManager, getVentesEmploye)

module.exports = router