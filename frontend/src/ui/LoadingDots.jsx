// ================================================
// FUELO — Loading Dots (Framer Motion)
// Fichier : frontend/src/ui/LoadingDots.jsx
// 3 points qui rebondissent — utilisé par AppLoader et PageLoader
// ================================================

import { motion, useReducedMotion } from 'framer-motion'

export default function LoadingDots({ color = '#2563EB', size = 10, gap = 8 }) {
  const reduced = useReducedMotion()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={reduced ? undefined : { y: [0, -size, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.75, repeat: Infinity, ease: 'easeInOut', delay: i * 0.16 }}
          style={{
            width: size, height: size, borderRadius: '50%',
            background: color, display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
