// ================================================
// FUELO V2.2 — Routes employés (hiérarchie RBAC)
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager, canManageEmployes } = require('../middleware/checkRole')
const { checkMaxEmployes }             = require('../middleware/checkPlan')
const { validate, employeSchema }      = require('../utils/zodSchemas')
const {
  creerEmploye,
  getEmployes,
  toggleEmploye,
  supprimerEmploye,
  getVentesEmploye,
} = require('../controllers/employeController')

// owner → gérant/logisticien | gérant → pompiste | logisticien → chauffeur
router.post('/',           verifyToken, canManageEmployes, checkMaxEmployes, validate(employeSchema), creerEmploye)
router.get('/',            verifyToken, canManageEmployes, getEmployes)
router.put('/:id/toggle',  verifyToken, canManageEmployes, toggleEmploye)
router.delete('/:id',      verifyToken, canManageEmployes, supprimerEmploye)

// Ventes d'un employé — owner + gérant uniquement
router.get('/:id/ventes',  verifyToken, isManager, getVentesEmploye)

module.exports = router
