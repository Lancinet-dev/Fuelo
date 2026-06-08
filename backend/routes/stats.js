const express     = require('express')
const router      = express.Router()
const verifyToken = require('../middleware/auth')
const { isManager } = require('../middleware/checkRole')
const {
  getResume,
  getGraphique,
  getStatsSemaine,
  getStatsMois,
  getActivite,
  getStatsEmploye
} = require('../controllers/statsController')

router.get('/resume',      verifyToken, isManager, getResume)
router.get('/graphique',   verifyToken, isManager, getGraphique)
router.get('/semaine',     verifyToken, isManager, getStatsSemaine)
router.get('/mois',        verifyToken, isManager, getStatsMois)
router.get('/activite',    verifyToken, isManager, getActivite)
router.get('/employe/:id', verifyToken, isManager, getStatsEmploye)

module.exports = router