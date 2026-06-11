import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * Bouton premium réutilisable avec micro-interactions Framer Motion.
 * Utilise ce composant à la place des <button> natifs pour les CTAs principaux.
 *
 * Props :
 *   variant  = 'primary' | 'secondary' | 'danger' | 'ghost'
 *   size     = 'sm' | 'md' | 'lg'
 *   loading  = bool
 *   icon     = ReactNode (SVG inline)
 *   iconEnd  = ReactNode (icône à droite)
 *   disabled = bool
 *   style    = object (override)
 */

const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
    hoverShadow: '0 8px 28px rgba(37,99,235,0.55)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.75)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    boxShadow: 'none',
    hoverShadow: 'none',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
    border: '1px solid rgba(239,68,68,0.25)',
    boxShadow: 'none',
    hoverShadow: '0 4px 16px rgba(239,68,68,0.25)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    border: 'none',
    boxShadow: 'none',
    hoverShadow: 'none',
  },
}

const SIZES = {
  sm: { height: 34, padding: '0 14px', fontSize: 12, gap: 6 },
  md: { height: 42, padding: '0 18px', fontSize: 13, gap: 8 },
  lg: { height: 52, padding: '0 28px', fontSize: 15, gap: 10 },
}

const Spinner = () => (
  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
)

const MotionButton = memo(function MotionButton({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  iconEnd,
  disabled,
  style = {},
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md
  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      whileHover={isDisabled ? {} : { scale: 1.02, boxShadow: v.hoverShadow || v.boxShadow }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            s.gap,
        height:         s.height,
        padding:        s.padding,
        fontSize:       s.fontSize,
        fontWeight:     600,
        fontFamily:     "'DM Sans', system-ui, sans-serif",
        borderRadius:   10,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        opacity:        isDisabled ? 0.6 : 1,
        background:     v.background,
        color:          v.color,
        border:         v.border,
        boxShadow:      v.boxShadow,
        transition:     'opacity 0.2s',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <span style={{ display:'flex',flexShrink:0 }}>{icon}</span>}
      {children}
      {!loading && iconEnd && <span style={{ display:'flex',flexShrink:0 }}>{iconEnd}</span>}
    </motion.button>
  )
})

export default MotionButton
