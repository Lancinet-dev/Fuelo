import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV_ITEMS = [
  { label: 'Dashboard',        path: '/comptable',              exact: true, icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Achats',           path: '/comptable?tab=achats',   icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Bons de livraison',path: '/comptable?tab=bl',       icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { label: 'Dépenses',         path: '/comptable?tab=depenses', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: 'Transport',        path: '/comptable?tab=transport',icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { label: 'Paie',             path: '/comptable?tab=paie',     icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Rapports',         path: '/comptable?tab=rapports', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
]

export default function ComptableLayout({ children }) {
  const { user, logout } = useAuth()
  const { palette } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: palette.bg, color: palette.text, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      {/* Sidebar — toujours sombre (palette.sidebar = #0F172A en light, rgba(2,8,23,0.85) en dark) */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          height: '100vh', position: 'sticky', top: 0, flexShrink: 0,
          background: palette.sidebar,
          borderRight: `1px solid ${palette.sidebarBorder}`,
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 0' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${palette.sidebarBorder}`, minHeight: 64 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#2563EB,#06b6d4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Fuelo</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' }}>Finance</div>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => <SidebarItem key={item.path} item={item} collapsed={collapsed} />)}
        </nav>

        {/* Utilisateur + déconnexion */}
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${palette.sidebarBorder}` }}>
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user?.nom?.[0]?.toUpperCase() || 'C'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nom || 'Comptable'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Comptable</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ width: '100%', padding: collapsed ? '10px 0' : '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, fontSize: 13 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Bouton collapse */}
        <button onClick={() => setCollapsed(!collapsed)} style={{ position: 'absolute', top: '50%', right: -12, width: 24, height: 24, borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(148,163,184,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', transform: 'translateY(-50%)', zIndex: 10 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
        </button>
      </motion.aside>

      {/* Contenu principal */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh', background: palette.bg }}>
        {children}
      </main>
    </div>
  )
}

function SidebarItem({ item, collapsed }) {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab') || 'dashboard'
  const itemTab = item.path.includes('tab=')
    ? new URLSearchParams(item.path.split('?')[1]).get('tab')
    : 'dashboard'
  const isActive = currentTab === itemTab

  return (
    <NavLink
      to={item.path}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: 8, textDecoration: 'none', marginBottom: 2,
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: 'all 0.15s',
        color: isActive ? '#38bdf8' : 'rgba(255,255,255,0.45)',
        background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        fontSize: 13,
      }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
    </NavLink>
  )
}
