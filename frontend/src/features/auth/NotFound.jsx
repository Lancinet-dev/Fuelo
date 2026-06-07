// ================================================
// FUELO — Page 404
// ================================================

import { useNavigate } from 'react-router-dom'
import { useTheme }    from '../../context/ThemeContext'
import { useAuth }     from '../../context/AuthContext'
import FueloLogo       from '../../components/FueloLogo'
import theme           from '../../config/theme'

export default function NotFound() {
  const { palette, isDark } = useTheme()
  const { isAuthenticated, role } = useAuth()
  const navigate = useNavigate()

  const goHome = () => {
    if (!isAuthenticated) { navigate('/'); return }
    const r = String(role ?? '').toLowerCase()
    if (r === 'pompiste')    return navigate('/pompiste')
    if (r === 'chauffeur')   return navigate('/chauffeur')
    if (r === 'logisticien') return navigate('/logistique')
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#0D1B2A' : '#F0F4FF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: theme.font.family,
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 40 }}>
        <FueloLogo size={56} />
      </div>

      {/* Illustration 404 */}
      <div style={{
        width: 120, height: 120,
        borderRadius: '50%',
        background: theme.colors.primaryLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        boxShadow: `0 0 0 16px ${isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.06)'}`,
      }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="12" />
          <line x1="11" y1="16" x2="11.01" y2="16" />
        </svg>
      </div>

      {/* Texte */}
      <div style={{
        fontSize: 80,
        fontWeight: 900,
        color: theme.colors.primary,
        letterSpacing: '-4px',
        lineHeight: 1,
        marginBottom: 12,
        fontFamily: theme.font.family,
      }}>
        4<span style={{ color: '#F59E0B' }}>0</span>4
      </div>

      <div style={{
        fontSize: theme.font.size['2xl'],
        fontWeight: theme.font.weight.black,
        color: palette.text,
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: '-0.5px',
      }}>
        Page introuvable
      </div>

      <div style={{
        fontSize: theme.font.size.md,
        color: palette.textSub,
        marginBottom: 36,
        textAlign: 'center',
        maxWidth: 340,
        lineHeight: 1.6,
      }}>
        Cette page n'existe pas ou a été déplacée. Retournez à votre tableau de bord.
      </div>

      {/* Bouton */}
      <button onClick={goHome}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 28px',
          borderRadius: theme.radius.md,
          border: 'none',
          background: theme.colors.primary,
          color: '#fff',
          fontSize: theme.font.size.base,
          fontWeight: theme.font.weight.bold,
          fontFamily: theme.font.family,
          cursor: 'pointer',
          boxShadow: theme.shadow.primary,
          transition: theme.transition.normal,
        }}
        onMouseEnter={e => e.currentTarget.style.background = theme.colors.primaryDark}
        onMouseLeave={e => e.currentTarget.style.background = theme.colors.primary}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Retour à l'accueil
      </button>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 24,
        fontSize: 11, color: palette.textMuted,
      }}>
        fuel<span style={{ color: '#F59E0B' }}>o</span> — Gestion de stations-service
      </div>
    </div>
  )
}
