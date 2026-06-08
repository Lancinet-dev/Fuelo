// ================================================
// FUELO — App Loader Premium (Framer Motion)
// Fichier : frontend/src/ui/AppLoader.jsx
// Loader plein écran affiché UNE SEULE FOIS — vérification de session au démarrage
// ================================================

import { motion, useReducedMotion } from 'framer-motion'
import LoadingDots from './LoadingDots'

const LOGO_URL = 'https://res.cloudinary.com/de0xeqpj9/image/upload/v1780821117/Capture_vh0qaw.png'

export default function AppLoader() {
  const reduced = useReducedMotion()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020817',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32,
    }}>
      <motion.img
        src={LOGO_URL}
        alt="Fuelo"
        animate={reduced ? undefined : { scale: [1, 1.07, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 96, height: 96, objectFit: 'contain',
          filter: 'drop-shadow(0 0 34px rgba(37,99,235,0.45))',
        }}
      />
      <LoadingDots color="#2563EB" size={10} />
    </div>
  )
}
