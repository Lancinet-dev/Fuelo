import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Logo ─────────────────────────────────────────────
const FueloLogo = () => (
  <div className="flex items-center gap-2.5">
    <div style={{ width: 32, height: 32, background: '#F59E0B', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.3)' }}>
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A"/>
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6"/>
      </svg>
    </div>
    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>
      <span style={{ color: '#FF500B' }}>fuel</span>
      <span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

// ── Icônes ───────────────────────────────────────────
const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  stock: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  ventes: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  alertes: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun: 'M12 7a5 5 0 100 10A5 5 0 0012 7z',
  trend_up: 'M23 6l-9.5 9.5-5-5L1 18',
  plus: 'M12 5v14M5 12h14',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
}

const formatGNF = (n) => {
  if (!n) return '0 GNF'
  const num = parseFloat(n)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M GNF`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K GNF`
  return `${num} GNF`
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Jauge de stock ───────────────────────────────────
const StockGauge = ({ label, quantite, seuil = 300, isDark }) => {
  const max = Math.max(quantite * 1.5, seuil * 2, 1000)
  const pct = Math.min((quantite / max) * 100, 100)
  const status = quantite <= 0 ? 'empty' : quantite <= seuil ? 'danger' : quantite <= seuil * 2 ? 'warn' : 'ok'
  const colors = { ok: '#10B981', warn: '#F59E0B', danger: '#EF4444', empty: '#334155' }
  const color = colors[status]
  const labels = { ok: 'Normal', warn: 'Attention', danger: 'Critique', empty: 'Vide' }

  return (
    <div style={{ background: isDark ? '#1E293B' : '#fff', border: `0.5px solid ${isDark ? '#263548' : '#E2E8F0'}`, borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '-1px', fontFamily: 'DM Mono, monospace' }}>
            {quantite.toLocaleString('fr-FR')} <span style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#475569' : '#94A3B8' }}>litres</span>
          </div>
        </div>
        <div style={{ background: `${color}18`, border: `0.5px solid ${color}40`, borderRadius: 8, padding: '4px 10px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{labels[status]}</span>
        </div>
      </div>

      {/* Barre de niveau */}
      <div style={{ background: isDark ? '#0F172A' : '#F1F5F9', borderRadius: 8, height: 10, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}99, ${color})`, borderRadius: 8, transition: 'width 1s ease' }}/>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: isDark ? '#334155' : '#CBD5E1' }}>
        <span>0 L</span>
        <span style={{ color: isDark ? '#475569' : '#94A3B8' }}>Seuil: {seuil} L</span>
        <span>{max.toLocaleString('fr-FR')} L</span>
      </div>
    </div>
  )
}

// ── Stat Card ────────────────────────────────────────
const StatCard = ({ label, value, sub, color = '#F59E0B', icon, isDark }) => (
  <div style={{ background: isDark ? '#1E293B' : '#fff', border: `0.5px solid ${isDark ? '#263548' : '#E2E8F0'}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d={icon}/></svg>
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '-0.8px', fontFamily: 'DM Mono, monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: isDark ? '#334155' : '#CBD5E1' }}>{sub}</div>}
  </div>
)

// ══════════════════════════════════════════════════════
export default function Dashboard() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('fuelo_theme') !== 'light')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem('fuelo_user') || '{}')

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: icons.dashboard },
    { path: '/stock', label: 'Stock', icon: icons.stock },
    { path: '/ventes', label: 'Ventes', icon: icons.ventes },
    { path: '/alertes', label: 'Alertes', icon: icons.alertes },
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/stats/resume')
      setData(res.data)
    } catch {
      toast.error('Erreur chargement données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchData()
    }
    loadData()
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('fuelo_theme', next ? 'dark' : 'light')
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const t = {
    bg: isDark ? '#0A0F1E' : '#F0F4F8',
    sidebar: isDark ? '#0F172A' : '#fff',
    sidebarBorder: isDark ? '#1E2D42' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textSub: isDark ? '#475569' : '#94A3B8',
    textMuted: isDark ? '#334155' : '#CBD5E1',
    card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#263548' : '#E2E8F0',
    tooltip: isDark ? '#1E293B' : '#fff',
  }

  // Données graphique
  const chartData = data?.graphique_7j?.map(d => ({
    jour: formatDate(d.jour),
    montant: parseFloat(d.montant) / 1000000,
    litres: parseFloat(d.litres),
  })) || []

  const stocks = {}
  data?.stocks?.forEach(s => { stocks[s.type] = parseFloat(s.quantite) })

  const essence = stocks.essence ?? 0
  const gasoil = stocks.gasoil ?? 0
  const ventesJour = data?.aujourd_hui
  const ventesMois = data?.ce_mois
  const alertes = parseInt(data?.alertes_non_lues || 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif", transition: 'all 0.3s' }}>

      {/* ── SIDEBAR ─────────────────────────────── */}
      <div style={{ width: 220, background: t.sidebar, borderRight: `0.5px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'all 0.3s' }}>

        <div style={{ marginBottom: 32 }}>
          <FueloLogo />
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = window.location.pathname === item.path
            const isAlerte = item.path === '/alertes'
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent', color: isActive ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.2s', width: '100%', textAlign: 'left', position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={item.icon}/></svg>
                {item.label}
                {isAlerte && alertes > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{alertes}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User + actions */}
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={isDark ? icons.sun : icons.moon}/></svg>
            {isDark ? 'Mode jour' : 'Mode nuit'}
          </button>

          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#EF4444', fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d={icons.logout}/></svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ───────────────────── */}
      <div style={{ marginLeft: 220, flex: 1, padding: '32px 28px', maxWidth: 'calc(100vw - 220px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px' }}>
              Bonjour, {user.nom?.split(' ')[0] || 'Gérant'} 
            </div>
            <div style={{ fontSize: 13, color: t.textSub, marginTop: 3 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `0.5px solid ${t.border}`, background: t.card, color: t.textSub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={icons.refresh}/></svg>
              Actualiser
            </button>
            <button onClick={() => navigate('/ventes/new')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#0F172A', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={icons.plus}/></svg>
              Nouvelle vente
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: t.textSub }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #1E293B', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}/>
              <div style={{ fontSize: 13 }}>Chargement des données...</div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Alertes banner ──────────────────── */}
            {alertes > 0 && (
              <div onClick={() => navigate('/alertes')} style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}/>
                <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                  {alertes} alerte{alertes > 1 ? 's' : ''} active{alertes > 1 ? 's' : ''} — Cliquez pour voir
                </span>
                <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )}

            {/* ── Stocks ──────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <StockGauge label="Essence" quantite={essence} isDark={isDark} />
              <StockGauge label="Gasoil" quantite={gasoil} isDark={isDark} />
            </div>

            {/* ── Stat Cards ──────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              <StatCard
                label="Ventes aujourd'hui"
                value={formatGNF(ventesJour?.montant)}
                sub={`${ventesJour?.nb || 0} transactions · ${parseFloat(ventesJour?.litres || 0).toLocaleString('fr-FR')} L`}
                color="#F59E0B"
                icon={icons.ventes}
                isDark={isDark}
              />
              <StatCard
                label="Ventes ce mois"
                value={formatGNF(ventesMois?.montant)}
                sub={`${ventesMois?.nb || 0} transactions · ${parseFloat(ventesMois?.litres || 0).toLocaleString('fr-FR')} L`}
                color="#10B981"
                icon={icons.trend_up}
                isDark={isDark}
              />
              <StatCard
                label="Alertes actives"
                value={alertes.toString()}
                sub={alertes === 0 ? 'Tout est normal ✓' : 'Action requise'}
                color={alertes > 0 ? '#EF4444' : '#10B981'}
                icon={icons.alertes}
                isDark={isDark}
              />
            </div>

            {/* ── Graphique ───────────────────────── */}
            <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 3 }}>Ventes des 7 derniers jours</div>
                  <div style={{ fontSize: 12, color: t.textSub }}>En millions GNF</div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: '#F59E0B' }}/>
                    <span style={{ fontSize: 11, color: t.textSub }}>Montant</span>
                  </div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#F1F5F9'} vertical={false}/>
                    <XAxis dataKey="jour" tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <Tooltip
                      contentStyle={{ background: t.tooltip, border: `0.5px solid ${t.border}`, borderRadius: 10, color: t.text, fontSize: 12 }}
                      formatter={(v) => [`${v.toFixed(2)}M GNF`, 'Montant']}
                    />
                    <Area type="monotone" dataKey="montant" stroke="#F59E0B" strokeWidth={2.5} fill="url(#amberGrad)" dot={{ fill: '#F59E0B', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#F59E0B' }}/>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 13 }}>
                  Pas encore de données de ventes
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}