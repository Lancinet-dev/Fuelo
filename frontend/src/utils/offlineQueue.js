// ================================================
// FUELO — File d'attente offline (IndexedDB)
// ================================================
// Stocke les ventes enregistrées par le pompiste quand il n'y a pas de réseau.
// Elles sont rejouées automatiquement à la reconnexion (voir syncQueue.js).
// IndexedDB brut — aucune dépendance externe.

const DB_NAME  = 'fuelo-offline'
const DB_VER   = 1
const STORE    = 'ventes'
const EVENT    = 'fuelo-queue-changed'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponible'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
  return dbPromise
}

// Notifie l'UI (badge / sync) qu'une entrée a changé
function notifyChange() {
  try { window.dispatchEvent(new Event(EVENT)) } catch { /* SSR / pas de window */ }
}

// ── Ajouter une vente en attente ──────────────────
export async function addPendingVente(payload) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).add({ payload, created_at: new Date().toISOString() })
    tx.oncomplete = resolve
    tx.onerror    = () => reject(tx.error)
  })
  notifyChange()
}

// ── Lire toutes les ventes en attente ─────────────
export async function getPendingVentes() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror   = () => reject(req.error)
  })
}

// ── Supprimer une vente (après sync réussie) ──────
export async function removePendingVente(id) {
  const db = await openDB()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = resolve
    tx.onerror    = () => reject(tx.error)
  })
  notifyChange()
}

// ── Compter les ventes en attente ─────────────────
export async function countPendingVentes() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).count()
      req.onsuccess = () => resolve(req.result ?? 0)
      req.onerror   = () => resolve(0)
    })
  } catch {
    return 0
  }
}

export const QUEUE_EVENT = EVENT
