import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { countPendingVentes, QUEUE_EVENT } from '../utils/offlineQueue'
import { flushVentesQueue } from '../utils/syncQueue'

// Bannière de statut réseau + synchronisation automatique de la file offline.
export default function NetworkStatus() {
  const queryClient = useQueryClient()
  const [online,       setOnline]       = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending,      setPending]      = useState(0)
  const [syncing,      setSyncing]      = useState(false)
  const [justRestored, setJustRestored] = useState(false)

  const refreshPending = useCallback(async () => {
    setPending(await countPendingVentes())
  }, [])

  const doSync = useCallback(async () => {
    const n = await countPendingVentes()
    setPending(n)
    if (n === 0) return
    setSyncing(true)
    try {
      const { synced } = await flushVentesQueue()
      if (synced > 0) {
        const keys = ['ventes', 'ventes-recentes', 'ventes-today', 'stock', 'dashboard', 'alertes']
        keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }))
      }
    } finally {
      await refreshPending()
      setSyncing(false)
    }
  }, [queryClient, refreshPending])

  useEffect(() => {
    refreshPending()
    // Au démarrage : si en ligne avec des ventes en attente, on synchronise
    if (typeof navigator !== 'undefined' && navigator.onLine) doSync()

    const onOffline = () => { setOnline(false); setJustRestored(false) }
    const onOnline  = () => {
      setOnline(true)
      setJustRestored(true)
      doSync()
      setTimeout(() => setJustRestored(false), 4000)
    }
    const onQueue = () => refreshPending()

    window.addEventListener('offline', onOffline)
    window.addEventListener('online',  onOnline)
    window.addEventListener(QUEUE_EVENT, onQueue)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener(QUEUE_EVENT, onQueue)
    }
  }, [doSync, refreshPending])

  // Priorité d'affichage : offline > sync en cours > en attente > rétabli
  let mode = null
  if (!online)            mode = 'offline'
  else if (syncing)       mode = 'syncing'
  else if (pending > 0)   mode = 'pending'
  else if (justRestored)  mode = 'restored'

  const CFG = {
    offline:  { bg: 'rgba(239,68,68,0.96)',  text: 'Mode hors ligne — certaines fonctions limitées' },
    syncing:  { bg: 'rgba(16,185,129,0.96)', text: 'Connexion rétablie — synchronisation en cours…' },
    pending:  { bg: 'rgba(245,158,11,0.97)', text: `${pending} vente${pending > 1 ? 's' : ''} en attente de synchronisation` },
    restored: { bg: 'rgba(16,185,129,0.95)', text: 'Connexion rétablie' },
  }
  const cfg = mode ? CFG[mode] : null

  return (
    <AnimatePresence>
      {cfg && (
        <motion.div
          key={mode}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            minHeight: 44, padding: '0 14px',
            background: cfg.bg, backdropFilter: 'blur(10px)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: '0.01em', textAlign: 'center',
          }}
        >
          {/* Icône selon l'état */}
          {mode === 'offline' && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          )}
          {mode === 'syncing' && (
            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'fuelo-ns-spin 0.7s linear infinite' }} />
          )}
          {(mode === 'restored') && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1.5 8.5a13 13 0 0121 0"/><path d="M5 12a9 9 0 0114 0"/><path d="M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          )}
          {mode === 'pending' && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>
            </svg>
          )}

          <span>{cfg.text}</span>

          {/* Badge "X en attente" affiché aussi quand on est hors ligne */}
          {mode === 'offline' && pending > 0 && (
            <span style={{ marginLeft: 4, background: 'rgba(0,0,0,0.25)', borderRadius: 99, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
              {pending} en attente
            </span>
          )}

          {/* Bouton réessayer si en ligne mais sync incomplète */}
          {mode === 'pending' && (
            <button onClick={doSync}
              style={{ marginLeft: 4, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 8, padding: '3px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Réessayer
            </button>
          )}

          <style>{`@keyframes fuelo-ns-spin { to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
