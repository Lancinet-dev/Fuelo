// ================================================
// FUELO V2 — AppLayout avec notifications temps réel
// Fichier : frontend/src/ui/AppLayout.jsx
// ================================================

import { memo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAlertes }       from '../hooks/useAlertes'
import { useTheme }         from '../context/ThemeContext'
import { useAuth }          from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import SplashScreen         from './SplashScreen'
import OnboardingModal      from './OnboardingModal'
import { usePlan }          from '../hooks/usePlan'

function UpgradeFAB() {
  const navigate = useNavigate()
  const location = useLocation()
  const { plan, colors, isOwner } = usePlan()

  // Cacher sur la page abonnements ou si déjà Enterprise
  if (!isOwner || plan === 'enterprise' || location.pathname === '/abonnements') return null

  return (
    <button
      onClick={() => navigate('/abonnements')}
      title={`Passer au plan supérieur (${plan === 'starter' ? 'Pro' : 'Enterprise'})`}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 90,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 20px',
        borderRadius: 99,
        border: 'none',
        background: `linear-gradient(135deg, ${colors.border}, ${colors.border}cc)`,
        color: '#fff',
        fontSize: 13, fontWeight: 800,
        cursor: 'pointer',
        boxShadow: `0 4px 20px ${colors.border}66`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'transform 0.2s, box-shadow 0.2s',
        animation: 'fabPulse 3s ease-in-out infinite',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 6px 28px ${colors.border}88` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 20px ${colors.border}66` }}
    >
      {colors.emoji} Upgrader
    </button>
  )
}

const AppLayout = memo(function AppLayout() {
  const { nonLues } = useAlertes()
  const { palette }  = useTheme()
  const { user }     = useAuth()
  useNotifications()

  const [showSplash, setShowSplash] = useState(() => {
    const fromLogin = sessionStorage.getItem('fuelo_just_logged_in')
    if (fromLogin) { sessionStorage.removeItem('fuelo_just_logged_in'); return true }
    return false
  })

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!user || user.role !== 'owner') return false
    return !localStorage.getItem(`fuelo_onboarding_${user.id}`)
  })

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && showOnboarding && (
        <OnboardingModal user={user} onDone={() => setShowOnboarding(false)} />
      )}

      <div style={{
        display:    'flex',
        minHeight:  '100vh',
        background: palette.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.3s ease',
      }}>
        <Sidebar alertesNb={nonLues} />

        <main className="fuelo-main" style={{
          marginLeft: '220px',
          flex:       1,
          minHeight:  '100vh',
          overflowX:  'hidden',
          transition: 'background 0.3s ease',
        }}>
          <Outlet />
        </main>

        <UpgradeFAB />

        <style>{`
          @media (max-width: 768px) {
            .fuelo-main { margin-left: 0 !important; padding-top: 64px; }
          }
          @keyframes fabPulse {
            0%, 100% { box-shadow: 0 4px 20px var(--fab-color, #2563eb66); }
            50%       { box-shadow: 0 6px 28px var(--fab-color, #2563eb99); }
          }
        `}</style>
      </div>
    </>
  )
})

export default AppLayout