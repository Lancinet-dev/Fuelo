// ================================================
// FUELO V2 — AppLayout
// Fichier : frontend/src/ui/AppLayout.jsx
// ================================================

import { memo, useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAlertes }       from '../hooks/useAlertes'
import { useTheme }         from '../context/ThemeContext'
import { useAuth }          from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import SplashScreen         from './SplashScreen'
import OnboardingModal      from './OnboardingModal'
import SearchModal          from './SearchModal'
import AssistantFuelo       from './AssistantFuelo'

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

  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch  = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {!showSplash && showOnboarding && (
        <OnboardingModal user={user} onDone={() => setShowOnboarding(false)} />
      )}
      {searchOpen && <SearchModal onClose={closeSearch} />}
      <AssistantFuelo />

      <div style={{
        display:    'flex',
        minHeight:  '100vh',
        background: palette.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.3s ease',
      }}>
        <Sidebar alertesNb={nonLues} onSearch={openSearch} />

        <main className="fuelo-main" style={{
          marginLeft: '220px',
          flex:       1,
          minHeight:  '100vh',
          overflowX:  'hidden',
          transition: 'background 0.3s ease',
        }}>
          <Outlet />
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
