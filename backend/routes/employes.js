// ================================================
// FUELO V2.1 — Routes employés
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager }              = require('../middleware/checkRole')
const { validate, employeSchema } = require('../utils/zodSchemas')
const {
  creerEmploye,
  getEmployes,
  toggleEmploye,
  supprimerEmploye,
  getVentesEmploye,
} = require('../controllers/employeController')

router.post('/',           verifyToken, isManager, validate(employeSchema), creerEmploye)
router.get('/',            verifyToken, isManager, getEmployes)
router.put('/:id/toggle',  verifyToken, isManager, toggleEmploye)
router.delete('/:id',      verifyToken, isManager, supprimerEmploye)
router.get('/:id/ventes',  verifyToken, isManager, getVentesEmploye)

module.exports = router