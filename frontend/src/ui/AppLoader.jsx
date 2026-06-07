// ================================================
// FUELO — App Loader Premium (Framer Motion)
// Fichier : frontend/src/ui/AppLoader.jsx
// Loader plein écran : connexion + chargement des pages (Suspense)
// ================================================

import { motion, useReducedMotion } from 'framer-motion'

const LOGO_URL = 'https://res.cloudinary.com/de0xeqpj9/image/upload/e_background_removal/v1780821117/Capture_vh0qaw.png'

export default function AppLoader() {
  const reduced = useReducedMotion()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020817',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Orbes lumineux bleu et orange — déplacement lent */}
      <motion.div
        animate={reduced ? undefined : { x: [0, 50, 0], y: [0, 35, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '36%', left: '36%', width: 420, height: 420,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={reduced ? undefined : { x: [0, -40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', top: '64%', left: '66%', width: 380, height: 380,
          transform: 'translate(-50%, -50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />

      {/* Logo qui pulse en boucle */}
      <motion.img
        src={LOGO_URL}
        alt="Fuelo"
        animate={reduced ? undefined : { scale: [0.8, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'relative',
          width: 90, height: 90, objectFit: 'contain',
          marginBottom: 22,
          filter: 'drop-shadow(0 0 30px rgba(37,99,235,0.4))',
        }}
      />

      {/* Texte */}
      <div style={{
        position: 'relative',
        fontSize: 13, fontWeight: 500, letterSpacing: '0.5px',
        color: '#94A3B8', marginBottom: 28,
      }}>
        Chargement...
      </div>

      {/* Barre de progression — se remplit de gauche à droite en boucle */}
      <div style={{
        position: 'relative',
        width: 160, height: 3,
        background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: ['0%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            height: '100%', borderRadius: 3,
            background: '#2563EB',
            boxShadow: '0 0 10px rgba(37,99,235,0.6)',
          }}
        />
      </div>
    </div>
  )
}
