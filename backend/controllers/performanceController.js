// ================================================
// FUELO — Controller : Performances & Primes
// ================================================

const {
  getPerformances,
  getPerformanceEmploye,
  validerPrime,
  countPrimesEnAttente,
  getAnneesDisponibles,
} = require('../services/performanceService')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

const now = () => {
  const d = new Date()
  return { mois: d.getMonth() + 1, annee: d.getFullYear() }
}

const listePerformances = async (req, res) => {
  try {
    const { mois, annee } = { ...now(), ...req.query }
    const data = await getPerformances(req.user, parseInt(mois), parseInt(annee))
    res.json({ performances: data })
  } catch (err) {
    logger.error('listePerformances', err)
    if (err.message === 'Accès refusé') return res.status(403).json({ error: 'Accès refusé' })
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const performanceEmploye = async (req, res) => {
  try {
    const data = await getPerformanceEmploye(parseInt(req.params.userId), req.user)
    res.json({ historique: data })
  } catch (err) {
    logger.error('performanceEmploye', err)
    if (err.message === 'Accès refusé')     return res.status(403).json({ error: 'Accès refusé' })
    if (err.message === 'Employé introuvable') return res.status(404).json({ error: 'Employé introuvable' })
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const validerPrimeHandler = async (req, res) => {
  try {
    const { mois, annee, action } = req.body
    if (!mois || !annee || !action) return res.status(400).json({ error: 'mois, annee et action requis' })
    const perf = await validerPrime(parseInt(req.params.userId), parseInt(mois), parseInt(annee), req.user, action)
    res.json({
      message: action === 'valider' ? 'Prime validée' : 'Prime refusée',
      performance: perf,
    })
  } catch (err) {
    logger.error('validerPrime', err)
    if (err.message === 'Accès refusé')   return res.status(403).json({ error: 'Accès refusé' })
    if (err.message === 'Action invalide') return res.status(400).json({ error: 'Action invalide' })
    if (err.message.includes('introuvable')) return res.status(404).json({ error: err.message })
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const badgeCount = async (req, res) => {
  try {
    const count = await countPrimesEnAttente(req.user)
    res.json({ count })
  } catch (err) {
    logger.error('badgeCount', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

const anneesDisponiblesHandler = async (req, res) => {
  try {
    const annees = await getAnneesDisponibles(req.user)
    res.json({ annees })
  } catch (err) {
    logger.error('anneesDisponibles', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = { listePerformances, performanceEmploye, validerPrimeHandler, badgeCount, anneesDisponiblesHandler }
