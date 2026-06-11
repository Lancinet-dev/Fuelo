import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NetworkStatus() {
  const [online,        setOnline]        = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [justRestored,  setJustRestored]  = useState(false)

  useEffect(() => {
    let timer
    const handleOffline = () => {
      setOnline(false)
      setJustRestored(false)
      clearTimeout(timer)
    }
    const handleOnline = () => {
      setOnline(true)
      setJustRestored(true)
      timer = setTimeout(() => setJustRestored(false), 3000)
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
      clearTimeout(timer)
    }
  }, [])

  const visible = !online || justRestored
  const isOnline = online && justRestored

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={isOnline ? 'online' : 'offline'}
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -56, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          style={{
            position:   'fixed',
            top:        0,
            left:       0,
            right:      0,
            zIndex:     9999,
            height:     44,
            background: isOnline ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.96)',
            backdropFilter: 'blur(10px)',
            color:      '#fff',
            display:    'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:        8,
            fontSize:   13,
            fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            letterSpacing: '0.01em',
          }}
        >
          {isOnline ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 8.5a13 13 0 0121 0"/><path d="M5 12a9 9 0 0114 0"/>
                <path d="M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
              </svg>
              Connexion rétablie
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/>
                <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
                <path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
                <path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
              </svg>
              Connexion perdue — vérifiez votre internet
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
