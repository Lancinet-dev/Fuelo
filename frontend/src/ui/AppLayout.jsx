// ================================================
// FUELO V2 — AppLayout
// Fichier : frontend/src/ui/AppLayout.jsx
// ================================================

import { memo, useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { useAlertes }       from '../hooks/useAlertes'
import { useTheme }         from '../context/ThemeContext'
import { useAuth }          from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { useTrialStatus }   from '../hooks/useTrialStatus'
import SplashScreen         from './SplashScreen'
import OnboardingModal      from './OnboardingModal'
import SearchModal          from './SearchModal'
import AssistantFuelo       from './AssistantFuelo'
import TrialBanner          from './TrialBanner'
import TrialExpiredOverlay  from './TrialExpiredOverlay'

const PAGE_TRANSITION = {
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
}

const AppLayout = memo(function AppLayout() {
  const { nonLues } = useAlertes()
  const { palette }  = useTheme()
  const { user }     = useAuth()
  const location     = useLocation()
  const { isExpired } = useTrialStatus()
  useNotifications()

  // Overlay de blocage sauf sur les pages encore accessibles (payer / profil)
  const allowedWhenExpired = ['/abonnements', '/profile']
  const showExpiredOverlay = isExpired && !allowedWhenExpired.some(p => location.pathname.startsWith(p))

  const [showSplash, setShowSplash] = useState(() => {
    const fromLogin = sessionStorage.getItem('fuelo_just_logged_in')
    if (fromLogin) { sessionStorage.removeItem('fuelo_just_logged_in'); return true }
    return false
  })

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!user || user.role !== 'owner') return false
    return !localStorage.getItem(`fuelo_onboarding_${user.id}`)
  })

  const navigate    = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch  = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
      // Ctrl+N → ventes (Nouveau : voir les ventes)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        navigate('/ventes')
      }
      // Ctrl+D → dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        navigate('/dashboard')
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && showOnboarding && (
        <OnboardingModal user={user} onDone={() => setShowOnboarding(false)} />
      )}
      {searchOpen && <SearchModal onClose={closeSearch} />}
      {!isExpired && <AssistantFuelo />}

      <AnimatePresence>
        {showExpiredOverlay && <TrialExpiredOverlay />}
      </AnimatePresence>

      <div style={{
        display:    'flex',
        minHeight:  '100vh',
        background: palette.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.3s ease',
      }}>
        <Sidebar alertesNb={nonLues} onSearch={openSearch} trialExpired={isExpired} />

        <main className="fuelo-main" style={{
          marginLeft: '220px',
          flex:       1,
          minHeight:  '100vh',
          overflowX:  'hidden',
          transition: 'background 0.3s ease',
        }}>
          <TrialBanner />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              {...PAGE_TRANSITION}
              style={{ minHeight: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fuelo-main { margin-left: 0 !important; padding-top: 64px; }
        }
      `}</style>
    </>
  )
})

export default AppLayout
