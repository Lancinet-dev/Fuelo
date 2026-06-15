// ================================================
// FUELO — Helper pour émettre des events Socket.IO
// Fichier : backend/utils/socketNotify.js
// ================================================

// Émettre une alerte stock critique
const notifyAlerte = (app, station_id, data) => {
  try {
    const io = app.get('io')
    if (io) {
      io.to(`station_${station_id}`).emit('alerte_stock', {
        station_id,
        type:    data.type,
        message: data.message,
        at:      new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Socket notify error:', err.message)
  }
}

// Émettre une nouvelle vente
const notifyVente = (app, station_id, vente) => {
  try {
    const io = app.get('io')
    if (io) {
      io.to(`station_${station_id}`).emit('nouvelle_vente', {
        station_id,
        type:        vente.type,
        litres:      vente.litres,
        montant_gnf: vente.montant_gnf,
        employe:     vente.employe_nom,
        at:          new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Socket notify error:', err.message)
  }
}

// Émettre une mise à jour de stock
const notifyStock = (app, station_id, stock) => {
  try {
    const io = app.get('io')
    if (io) {
      io.to(`station_${station_id}`).emit('stock_update', {
        station_id,
        type:     stock.type,
        quantite: stock.quantite,
        at:       new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Socket notify error:', err.message)
  }
}

// Émettre une position GPS chauffeur
const notifyGps = (app, station_id, data) => {
  try {
    const io = app.get('io')
    if (io) {
      io.to(`station_${station_id}`).emit('gps_update', {
        station_id,
        trajet_id: data.trajet_id,
        lat:       data.lat,
        lng:       data.lng,
        vitesse:   data.vitesse,
        at:        new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('Socket notify error:', err.message)
  }
}

// ── Messagerie — émet un event vers les rooms privées des destinataires ──
// (chaque membre d'une conversation a sa room `user_${id}` assignée au login).
// Garantit que seuls les membres reçoivent le message en temps réel.
const emitToUsers = (app, userIds, event, data) => {
  try {
    const io = app.get('io')
    if (!io || !Array.isArray(userIds)) return
    userIds.forEach(uid => io.to(`user_${uid}`).emit(event, data))
  } catch (err) {
    console.error('Socket emitToUsers error:', err.message)
  }
}

module.exports = { notifyAlerte, notifyVente, notifyStock, notifyGps, emitToUsers }