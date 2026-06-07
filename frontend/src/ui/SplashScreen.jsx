// ================================================
// FUELO — Splash Screen Premium (Framer Motion)
// Fichier : frontend/src/ui/SplashScreen.jsx
// ================================================

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LOGO_URL } from '../components/FueloLogo'

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true)
  const reduced = useReducedMotion()

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2500)
    const done = setTimeout(() => onDone?.(), 3000)
    return () => { clearTimeout(hide); clearTimeout(done) }
  }, [onDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#020817',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Grille de fond */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }} />

          {/* Orbes lumineux bleu et orange */}
          <motion.div
            animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: '38%', left: '38%', width: 420, height: 420,
              transform: 'translate(-50%, -50%)', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)',
              filter: 'blur(40px)', pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={reduced ? undefined : { scale: [1, 1.2, 1], opacity: [0.14, 0.26, 0.14] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            style={{
              position: 'absolute', top: '62%', left: '64%', width: 380, height: 380,
              transform: 'translate(-50%, -50%)', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
              filter: 'blur(40px)', pointerEvents: 'none',
            }}
          />

          {/* Logo — fond transparent (e_background_removal) */}
          <motion.img
            src={LOGO_URL}
            alt="Fuelo"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15, mass: 0.7 }}
            style={{
              position: 'relative',
              width: 160, height: 160,
              objectFit: 'contain',
              marginBottom: 36,
              filter: 'drop-shadow(0 0 50px rgba(37,99,235,0.45)) drop-shadow(0 0 80px rgba(245,158,11,0.18))',
            }}
          />

          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{
              fontSize: 14, fontWeight: 500, letterSpacing: '0.5px',
              color: 'rgba(241,245,249,0.55)', marginBottom: 44, textAlign: 'center',
            }}
          >
            Votre station, sous contrôle
          </motion.div>

          {/* Barre de chargement bleu → orange */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            style={{ width: 180, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}
          >
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: 1, ease: 'easeInOut' }}
              style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #2563EB, #F59E0B)',
                boxShadow: '0 0 12px rgba(37,99,235,0.5)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
