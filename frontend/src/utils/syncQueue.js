// ================================================
// FUELO — Synchronisation de la file offline
// ================================================
// Rejoue les ventes stockées hors ligne dès que le réseau revient.

import api from '../services/api'
import { getPendingVentes, removePendingVente } from './offlineQueue'

let syncing = false

// Rejoue toutes les ventes en attente. Retourne le nombre synchronisé.
export async function flushVentesQueue() {
  if (syncing) return { synced: 0, skipped: true }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, offline: true }

  syncing = true
  let synced = 0
  try {
    const pending = await getPendingVentes()
    for (const item of pending) {
      try {
        await api.post('/ventes', item.payload)
        await removePendingVente(item.id)
        synced++
      } catch (err) {
        const status = err.response?.status
        // Requête définitivement invalide (validation / conflit) → on la retire
        // pour ne pas bloquer la file indéfiniment.
        if (status === 400 || status === 409 || status === 422) {
          await removePendingVente(item.id)
        } else {
          // Réseau coupé à nouveau, auth, ou erreur serveur → on réessaiera
          // à la prochaine reconnexion.
          break
        }
      }
    }
  } finally {
    syncing = false
  }
  return { synced }
}
