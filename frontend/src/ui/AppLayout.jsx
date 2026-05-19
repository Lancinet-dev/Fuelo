// ================================================
// FUELO V2 — AppLayout
// Fichier : frontend/src/ui/AppLayout.jsx
// ================================================

import { memo } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAlertes } from '../hooks/useAlertes'
import theme from '../config/theme'

const AppLayout = memo(function AppLayout() {
  const { nonLues } = useAlertes()

  return (
    <div style={{
      display:    'flex',
      minHeight:  '100vh',
      background: theme.colors.bg,
      fontFamily: theme.font.family,
    }}>
      <Sidebar alertesNb={nonLues} />

      <main
        className="fuelo-main"
        style={{
          marginLeft: theme.sidebarWidth,
          flex:       1,
          minHeight:  '100vh',
          overflowX:  'hidden',
        }}
      >
        <Outlet />
      </main>

      <style>{`
        @media (max-width: ${theme.breakpoints.mobile}) {
          .fuelo-main {
            margin-left: 0 !important;
            padding-top: 64px;
          }
        }
      `}</style>
    </div>
  )
})

export default AppLayout