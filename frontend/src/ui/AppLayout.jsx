// ================================================
// FUELO V2 — AppLayout
// Fichier : frontend/src/ui/AppLayout.jsx
// ================================================

import { memo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAlertes } from '../hooks/useAlertes'
import { useTheme }   from '../context/ThemeContext'
import SplashScreen   from './SplashScreen'

const AppLayout = memo(function AppLayout() {
  const { nonLues } = useAlertes()
  const { palette }  = useTheme()

  const [showSplash, setShowSplash] = useState(() => {
    // Affiche uniquement si on vient de se connecter via Login
    const fromLogin = sessionStorage.getItem('fuelo_just_logged_in')
    if (fromLogin) {
      sessionStorage.removeItem('fuelo_just_logged_in')
      return true
    }
    return false
  })

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <div style={{
        display:    'flex',
        minHeight:  '100vh',
        background: palette.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'background 0.3s ease',
      }}>
        <Sidebar alertesNb={nonLues} />

        <main
          className="fuelo-main"
          style={{
            marginLeft: '220px',
            flex:       1,
            minHeight:  '100vh',
            overflowX:  'hidden',
            transition: 'background 0.3s ease',
          }}
        >
          <Outlet />
        </main>

        <style>{`
          @media (max-width: 768px) {
            .fuelo-main { margin-left: 0 !important; padding-top: 64px; }
          }
        `}</style>
      </div>
    </>
  )
})

export default AppLayout