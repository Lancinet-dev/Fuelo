const express = require('express')
const router  = express.Router()
const verifyToken = require('../middleware/auth')
const { canAccessComptable } = require('../middleware/checkRole')
const ctrl = require('../controllers/comptableController')

const auth = [verifyToken, canAccessComptable]

// Dashboard financier
router.get('/dashboard', ...auth, ctrl.getDashboard)

// Achats carburant
router.get('/achats',          ...auth, ctrl.getAchats)
router.post('/achats',         ...auth, ctrl.createAchat)
router.put('/achats/:id',      ...auth, ctrl.updateAchat)
router.delete('/achats/:id',   ...auth, ctrl.deleteAchat)

// Bons de livraison
router.get('/bl',              ...auth, ctrl.getBL)
router.post('/bl',             ...auth, ctrl.createBL)
router.post('/bl/:id/signer',  ...auth, ctrl.signerBL)

// Dépenses
router.get('/depenses',        ...auth, ctrl.getDepenses)
router.post('/depenses',       ...auth, ctrl.createDepense)
router.delete('/depenses/:id', ...auth, ctrl.deleteDepense)

// Coûts transport
router.get('/transport',       ...auth, ctrl.getCoutsTransport)
router.post('/transport',      ...auth, ctrl.createCoutTransport)

// Fiches de paie
router.get('/paie',            ...auth, ctrl.getFichesPaie)
router.post('/paie',           ...auth, ctrl.createFichePaie)
router.post('/paie/:id/payer', ...auth, ctrl.payerFichePaie)

module.exports = router
