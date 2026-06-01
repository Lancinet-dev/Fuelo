// ================================================
// FUELO — Controller : GPS Citernes
// ================================================

const trajetService = require('../services/trajetService')
const logger        = require('../utils/logger')

const demarrerTrajet = async (req, res) => {
  try {
    const trajet = await trajetService.demarrerTrajet(req.user, req.body)
    res.status(201).json({ message: 'Trajet démarré', trajet })
  } catch (err) {
    logger.error('demarrerTrajet', err)
    res.status(400).json({ error: err.message })
  }
}

const ajouterPosition = async (req, res) => {
  try {
    await trajetService.ajouterPosition(parseInt(req.params.id), req.user.id, req.body, req.app)
    res.json({ ok: true })
  } catch (err) {
    logger.error('ajouterPosition', err)
    res.status(400).json({ error: err.message })
  }
}

const arriverDestination = async (req, res) => {
  try {
    const result = await trajetService.arriverDestination(req.user, parseInt(req.params.id), req.body, req.app)
    res.json({
      message: result.alerte_fraude ? 'Arrivée enregistrée — Alerte fraude générée' : 'Arrivée enregistrée avec succès',
      ...result,
    })
  } catch (err) {
    logger.error('arriverDestination', err)
    res.status(400).json({ error: err.message })
  }
}

const getTrajetActif = async (req, res) => {
  try {
    const trajet = await trajetService.getTrajetActif(req.user.id)
    res.json({ trajet })
  } catch (err) {
    logger.error('getTrajetActif', err)
    res.status(500).json({ error: err.message })
  }
}

const getTrajets = async (req, res) => {
  try {
    const trajets = await trajetService.getTrajets(req.user.station_id, req.query)
    res.json({ trajets })
  } catch (err) {
    logger.error('getTrajets', err)
    res.status(500).json({ error: err.message })
  }
}

const getGpsPoints = async (req, res) => {
  try {
    const points = await trajetService.getGpsPoints(parseInt(req.params.id), req.user.station_id)
    res.json({ points })
  } catch (err) {
    logger.error('getGpsPoints', err)
    res.status(400).json({ error: err.message })
  }
}

const exportCSV = async (req, res) => {
  try {
    const trajets = await trajetService.getTrajets(req.user.station_id, {})
    const lignes = [
      ['ID','Chauffeur','Citerne','Départ (L)','Arrivée (L)','Écart (L)','Statut','Date début','Date fin'],
      ...trajets.map(t => [
        t.id, t.chauffeur_nom ?? '', t.citerne_code ?? '',
        t.qty_depart ?? '', t.qty_arrivee ?? '', t.ecart ?? '',
        t.statut,
        t.started_at ? new Date(t.started_at).toLocaleString('fr-FR') : '',
        t.ended_at   ? new Date(t.ended_at).toLocaleString('fr-FR')   : '',
      ])
    ]
    const csv = lignes.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="trajets_fuelo.csv"')
    res.send('﻿' + csv) // BOM UTF-8 pour Excel
  } catch (err) {
    logger.error('exportCSV', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { demarrerTrajet, ajouterPosition, arriverDestination, getTrajetActif, getTrajets, getGpsPoints, exportCSV }
