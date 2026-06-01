// ================================================
// FUELO V2 - Sidebar avec couleur bleue
// Fichier : frontend/src/ui/Sidebar.jsx
// ================================================

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import FueloLogo from '../components/FueloLogo'


const BLUE = '#2563EB'


const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

const getRoleLabel = (role) => {
  const normalizedRole = normalizeRole(role)
  if (normalizedRole === 'owner')        return 'Proprietaire'
  if (normalizedRole === 'gerant')       return 'Gerant'
  if (normalizedRole === 'superadmin')   return 'Super Admin'
  if (normalizedRole === 'chauffeur')    return 'Chauffeur'
  if (normalizedRole === 'logisticien')  return 'Logisticien'
  return 'Pompiste'
}



const ALL_NAV = [
  { path: '/dashboard', label: 'Dashboard', roles: ['owner', 'gerant', 'superadmin'], d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { path: '/stock', label: 'Stock', roles: ['owner', 'gerant'], d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/ventes', label: 'Ventes', roles: ['owner', 'gerant'], d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/alertes',  label: 'Alertes',  roles: ['owner', 'gerant'], d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  { path: '/services', label: 'Services',  roles: ['owner', 'gerant'], d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { path: '/trajets',  label: 'GPS Citernes', roles: ['owner', 'gerant'], d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10m-3 0a3 3 0 106 0 3 3 0 00-6 0' },
  { path: '/employes', label: 'Employes', roles: ['owner', 'gerant'], d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z' },
  { path: '/stations', label: 'Mes stations', roles: ['owner'], d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
  { path: '/profile', label: 'Mon profil', roles: ['owner', 'gerant', 'pompiste'], d: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  { path: '/parametres', label: 'Parametres', roles: ['owner', 'gerant'], d: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
]

function Content({ alertesNb, navItems, location, navigate, setMobileOpen, logout, user, role, isDark, toggle }) {
return (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

    {/* Logo */}
    <div style={{ padding: '24px 14px 16px' }}>
      <FueloLogo size={34} forceTextColor="#fff" />
    </div>

    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, paddingLeft: 12 }}>
      Navigation
    </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path
          const isAlerte = item.path === '/alertes'

          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? 'rgba(37,99,235,0.15)' : 'transparent', color: active ? BLUE : 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400, width: '100%', textAlign: 'left', transition: 'all 0.15s', position: 'relative' }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                }
              }}
            >
              {active && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: BLUE, borderRadius: '0 2px 2px 0' }} />
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.d} />
              </svg>
              {item.label}
              {isAlerte && alertesNb > 0 && (
                <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 7px' }}>
                  {alertesNb}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: BLUE, flexShrink: 0 }}>
            {(user?.nom || 'G').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nom || 'Gerant'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>
              {getRoleLabel(role)}
            </div>
          </div>
        </div>

        <button
          onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark
                ? <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></>
                : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              }
            </svg>
            {isDark ? 'Mode jour' : 'Mode nuit'}
          </div>
          <div style={{ width: 36, height: 20, borderRadius: 20, background: isDark ? BLUE : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: isDark ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </div>
        </button>

        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(239,68,68,0.7)', fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#EF4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Deconnexion
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ alertesNb = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, logout: authLogout } = useAuth()
  const { isDark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userRole = normalizeRole(role)
  const navItems = ALL_NAV.filter((item) => item.roles.includes(userRole || 'gerant'))

  const logout = () => {
    authLogout()
    navigate('/login')
  }

  const contentProps = { alertesNb, navItems, location, navigate, setMobileOpen, logout, user, role: userRole, isDark, toggle }

  return (
    <>
      <div
        className="fuelo-sidebar-desktop"
        style={{ width: 220, background: '#0F172A', borderRight: '0.5px solid rgba(255,255,255,0.06)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, display: 'flex', flexDirection: 'column' }}
      >
        <Content {...contentProps} />
      </div>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fuelo-hamburger"
        style={{ display: 'none', position: 'fixed', top: 14, left: 14, zIndex: 200, width: 40, height: 40, borderRadius: 10, background: '#0F172A', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {mobileOpen
            ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
          }
        </svg>
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 98, backdropFilter: 'blur(4px)' }} />
      )}

      <div
        className="fuelo-sidebar-mobile"
        style={{ position: 'fixed', top: 0, left: mobileOpen ? 0 : -260, bottom: 0, width: 240, background: '#0F172A', borderRight: '0.5px solid rgba(255,255,255,0.06)', zIndex: 99, transition: 'left 0.3s ease', display: 'none', flexDirection: 'column' }}
      >
        <Content {...contentProps} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .fuelo-sidebar-desktop { display: none !important; }
          .fuelo-hamburger        { display: flex !important; }
          .fuelo-sidebar-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  )
}
