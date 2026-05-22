// ================================================
// FUELO — Logo Component Premium
// Usage : <FueloLogo size={36} />
// ================================================

import { useTheme } from '../context/ThemeContext'

export default function FueloLogo({ size = 36, showText = true, forceTextColor }) {
  const { palette } = useTheme()
  const textColor   = forceTextColor ?? palette.text
  const fontSize    = size * 0.75

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28 }}>
      {/* Icon — toujours fond sombre quelle que soit le mode */}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fl-drop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA"/>
            <stop offset="100%" stopColor="#1D4ED8"/>
          </linearGradient>
          <linearGradient id="fl-bolt" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D"/>
            <stop offset="100%" stopColor="#F59E0B"/>
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#0D1B2A"/>
        <path d="M24 7C24 7 11 20 11 28C11 35.7 17 42 24 42C31 42 37 35.7 37 28C37 20 24 7 24 7Z" fill="url(#fl-drop)"/>
        <path d="M26.5 15L21.5 27H25L22 41L30 25H26L29 15Z" fill="url(#fl-bolt)"/>
      </svg>

      {/* Wordmark — s'adapte au thème automatiquement */}
      {showText && (
        <span style={{ fontSize, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
          <span style={{ color: textColor }}>fuel</span>
          <span style={{ color: '#F59E0B' }}>o</span>
        </span>
      )}
    </div>
  )
}