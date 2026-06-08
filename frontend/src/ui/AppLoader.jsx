// ================================================
// FUELO — App Loader Premium (Framer Motion)
// Fichier : frontend/src/ui/AppLoader.jsx
// Loader plein écran affiché UNE SEULE FOIS — vérification de session au démarrage
// ================================================

import { motion, useReducedMotion } from 'framer-motion'
import { LOGO_URL } from '../components/FueloLogo'
import LoadingDots from './LoadingDots'

export default function AppLoader() {
  const reduced = useReducedMotion()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020817',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32, overflow: 'hidden',
    }}>
      {/* Orbes lumineux bleu et orange — même ambiance que SplashScreen */}
      <motion.div
        animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.16, 0.3, 0.16] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '38%', left: '38%', width: 420, height: 420,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.32) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={reduced ? undefined : { scale: [1, 1.2, 1], opacity: [0.12, 0.24, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        style={{
          position: 'absolute', top: '62%', left: '64%', width: 380, height: 380,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.26) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }}
      />

      {/* Logo — fond transparent (e_background_removal), glow bleu + orange qui pulse */}
      <motion.img
        src={LOGO_URL}
        alt="Fuelo"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={reduced
          ? { scale: 1, opacity: 1 }
          : { scale: [1, 1.06, 1], opacity: 1 }}
        transition={reduced
          ? { type: 'spring', stiffness: 220, damping: 18 }
          : { scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.5 } }}
        style={{
          position: 'relative',
          width: 104, height: 104, objectFit: 'contain',
          filter: 'drop-shadow(0 0 28px rgba(37,99,235,0.5)) drop-shadow(0 0 46px rgba(245,158,11,0.22))',
        }}
      />

      <LoadingDots color="#2563EB" size={10} />
    </div>
  )
}
