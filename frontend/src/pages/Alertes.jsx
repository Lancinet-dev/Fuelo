import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const FueloLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 32, height: 32, background: '#F59E0B', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.3)' }}>
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A"/>
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6"/>
      </svg>
    </div>
    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>
      <span style={{ color: '#fff' }}>fuel</span><span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

const navItems = [
  { path: '/dashboard', label: 'Dashboard', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { path: '/stock', label: 'Stock', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/ventes', label: 'Ventes', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/alertes', label: 'Alertes', d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
]

const formatTime = (d) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Alertes() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('fuelo_theme') !== 'light')
  const [alertes, setAlertes] = useState([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('fuelo_user') || '{}')

  const t = {
    bg: isDark ? '#0A0F1E' : '#F0F4F8',
    sidebar: isDark ? '#0F172A' : '#fff',
    sidebarBorder: isDark ? '#1E2D42' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSub: isDark ? '#475569' : '#94A3B8',
    textMuted: isDark ? '#334155' : '#CBD5E1',
    card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#263548' : '#E2E8F0',
  }

  useEffect(() => {
    const loadAlertes = async () => {
      try {
        setLoading(true)
        const res = await api.get('/alertes')
        setAlertes(res.data.alertes || [])
      } catch {
        toast.error('Erreur chargement alertes')
      } finally {
        setLoading(false)
      }
    }

    loadAlertes()
  }, [])

  const marquerLue = async (id) => {
    try {
      await api.put(`/alertes/${id}/lire`)
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, lu: true } : a))
      toast.success('Alerte marquée comme lue')
    } catch { toast.error('Erreur') }
  }

  const marquerToutesLues = async () => {
    try {
      await api.put('/alertes/toutes/lire')
      setAlertes(prev => prev.map(a => ({ ...a, lu: true })))
      toast.success('Toutes les alertes marquées comme lues')
    } catch { toast.error('Erreur') }
  }

  const nonLues = alertes.filter(a => !a.lu).length
  const logout = () => { localStorage.clear(); navigate('/login') }
  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('fuelo_theme', next ? 'dark' : 'light')
  }

  const typeConfig = {
    STOCK_FAIBLE: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: '⚠️', label: 'Stock faible' },
    ANOMALIE: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: '🔍', label: 'Anomalie' },
    DEFAULT: { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', icon: 'ℹ️', label: 'Info' },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: t.sidebar, borderRight: `0.5px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ marginBottom: 32 }}><FueloLogo /></div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = window.location.pathname === item.path
            const isAlerte = item.path === '/alertes'
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent', color: isActive ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 600 : 400, width: '100%', textAlign: 'left', position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={item.d}/></svg>
                {item.label}
                {isAlerte && nonLues > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 6px' }}>{nonLues}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div style={{ borderTop: `0.5px solid ${t.sidebarBorder}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
              {user.nom?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{user.nom || 'Gérant'}</div>
              <div style={{ fontSize: 10, color: t.textMuted }}>Admin</div>
            </div>
          </div>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: t.textSub, fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d={isDark ? 'M12 7a5 5 0 100 10A5 5 0 0012 7z' : 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'}/>
            </svg>
            {isDark ? 'Mode jour' : 'Mode nuit'}
          </button>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#EF4444', fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ marginLeft: 220, flex: 1, padding: '32px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
              Alertes
              {nonLues > 0 && (
                <span style={{ marginLeft: 12, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}>{nonLues}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: t.textSub }}>{alertes.length} alerte{alertes.length > 1 ? 's' : ''} au total</div>
          </div>
          {nonLues > 0 && (
            <button onClick={marquerToutesLues}
              style={{ padding: '10px 18px', borderRadius: 10, border: `0.5px solid ${t.border}`, background: t.card, color: t.textSub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Résumé */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total alertes', val: alertes.length, color: t.text },
            { label: 'Non lues', val: nonLues, color: '#EF4444' },
            { label: 'Lues', val: alertes.length - nonLues, color: '#10B981' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'DM Mono, monospace' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Liste alertes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #1E293B', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
            </div>
          ) : alertes.length === 0 ? (
            <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>Aucune alerte</div>
              <div style={{ fontSize: 13, color: t.textSub }}>Tout fonctionne normalement. Votre stock est en bon état.</div>
            </div>
          ) : (
            alertes.map(alerte => {
              const cfg = typeConfig[alerte.type] || typeConfig.DEFAULT
              return (
                <div key={alerte.id} style={{ background: alerte.lu ? t.card : cfg.bg, border: `0.5px solid ${alerte.lu ? t.border : cfg.border}`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.2s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: alerte.lu ? (isDark ? '#1E293B' : '#F1F5F9') : cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: alerte.lu ? t.textSub : cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
                      {!alerte.lu && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, animation: 'pulse 1.5s infinite', display: 'inline-block' }}/>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: alerte.lu ? 400 : 600, color: alerte.lu ? t.textSub : t.text, marginBottom: 4 }}>{alerte.message}</div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{formatTime(alerte.created_at)}</div>
                  </div>
                  {!alerte.lu && (
                    <button onClick={() => marquerLue(alerte.id)}
                      style={{ padding: '8px 16px', borderRadius: 8, border: `0.5px solid ${cfg.border}`, background: 'transparent', color: cfg.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                      Marquer lue
                    </button>
                  )}
                  {alerte.lu && (
                    <div style={{ fontSize: 11, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Lu
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}*{box-sizing:border-box;margin:0;padding:0;}`}</style>
    </div>
  )
}