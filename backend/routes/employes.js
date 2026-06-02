// ================================================
// FUELO V2.1 — Routes employés
// ================================================

const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager, isOwner }     = require('../middleware/checkRole')
const { validate, employeSchema } = require('../utils/zodSchemas')
const {
  creerEmploye,
  getEmployes,
  toggleEmploye,
  supprimerEmploye,
  getVentesEmploye,
} = require('../controllers/employeController')

router.post('/',           verifyToken, isOwner,   validate(employeSchema), creerEmploye)
router.get('/',            verifyToken, isManager, getEmployes)
router.put('/:id/toggle',  verifyToken, isOwner,   toggleEmploye)
router.delete('/:id',      verifyToken, isOwner,   supprimerEmploye)
router.get('/:id/ventes',  verifyToken, isManager, getVentesEmploye)

module.exports = router