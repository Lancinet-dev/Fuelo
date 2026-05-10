import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const FueloLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 32, height: 32, background: '#F59E0B', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.3)' }}>
      <svg width="16" height="16" viewBox="0 0 48 48">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
      </svg>
    </div>
    <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px' }}>
      <span style={{ color: '#fff' }}>fuel</span>
      <span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

const NAV = [
  { path: '/dashboard', label: 'Dashboard', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { path: '/stock',     label: 'Stock',     d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { path: '/ventes',   label: 'Ventes',    d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/alertes',  label: 'Alertes',   d: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
]

function Sidebar({ isDark, t, user, toggleTheme, logout }) {
  const navigate = useNavigate()
  return (
    <div style={{ width: 220, background: t.sidebar, borderRight: `0.5px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
      <div style={{ marginBottom: 32 }}>
        <FueloLogo />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const active = window.location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? 'rgba(245,158,11,0.12)' : 'transparent', color: active ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400, width: '100%', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d={item.d} />
              </svg>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div style={{ borderTop: `0.5px solid ${t.sidebarBorder}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
            {(user.nom || 'G').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{user.nom || 'Gérant'}</div>
            <div style={{ fontSize: 10, color: t.textMuted }}>Admin</div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: t.textSub, fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isDark
              ? <circle cx="12" cy="12" r="5" />
              : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            }
          </svg>
          {isDark ? 'Mode jour' : 'Mode nuit'}
        </button>

        <button
          onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#EF4444', fontFamily: 'inherit', fontSize: 13, width: '100%', textAlign: 'left' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Déconnexion
        </button>
      </div>
    </div>
  )
}

function StockCard({ label, quantite, seuil, t, isDark }) {
  const qty = parseFloat(quantite) || 0
  const max = Math.max(qty * 1.5, seuil * 2, 1000)
  const pct = max > 0 ? Math.min((qty / max) * 100, 100) : 0
  const status = qty <= 0 ? 'empty' : qty <= seuil ? 'danger' : qty <= seuil * 2 ? 'warn' : 'ok'
  const colorMap = { ok: '#10B981', warn: '#F59E0B', danger: '#EF4444', empty: '#334155' }
  const labelMap = { ok: 'Normal', warn: 'Attention', danger: 'Critique', empty: 'Vide' }
  const color = colorMap[status]

  return (
    <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, padding: '24px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: t.text, letterSpacing: '-1.5px', fontFamily: 'monospace' }}>
            {qty.toLocaleString('fr-FR')}
            <span style={{ fontSize: 16, fontWeight: 500, color: t.textSub, marginLeft: 8 }}>litres</span>
          </div>
        </div>
        <div style={{ background: `${color}20`, border: `0.5px solid ${color}50`, borderRadius: 10, padding: '6px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {labelMap[status]}
          </span>
        </div>
      </div>

      <div style={{ background: isDark ? '#0F172A' : '#F1F5F9', borderRadius: 10, height: 14, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: 10, transition: 'width 1.2s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textMuted }}>
        <span>0 L</span>
        <span style={{ color: t.textSub }}>Seuil alerte : {seuil} L</span>
        <span>{max.toLocaleString('fr-FR')} L</span>
      </div>

      {qty > 0 && qty <= seuil && (
        <div style={{ marginTop: 14, background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
          Stock critique — commandez une livraison maintenant
        </div>
      )}
    </div>
  )
}

export default function Stock() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('fuelo_theme') !== 'light')
  const [stocks, setStocks] = useState({ essence: 0, gasoil: 0 })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState('essence')
  const [quantite, setQuantite] = useState('')

  const user = JSON.parse(localStorage.getItem('fuelo_user') || '{}')

  const t = {
    bg:            isDark ? '#0A0F1E' : '#F0F4F8',
    sidebar:       isDark ? '#0F172A' : '#fff',
    sidebarBorder: isDark ? '#1E2D42' : '#E2E8F0',
    text:          isDark ? '#F1F5F9' : '#0F172A',
    textSub:       isDark ? '#475569' : '#94A3B8',
    textMuted:     isDark ? '#334155' : '#CBD5E1',
    card:          isDark ? '#1E293B' : '#fff',
    border:        isDark ? '#263548' : '#E2E8F0',
    inputBg:       isDark ? '#0A0F1E' : '#F8FAFC',
  }
const fetchStock = async () => {
  try {
    setLoading(true)

    const res = await api.get('/stock/current')

    const s = {}

    Object.entries(res.data.stock).forEach(([k, v]) => {
      s[k] = parseFloat(v.quantite) || 0
    })

    setStocks(s)

  } catch (error) {
    console.log(error)
    toast.error('Erreur chargement stock')
  } finally {
    setLoading(false)
  }
}
useEffect(() => {
  fetchStock()
}, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const qty = parseFloat(quantite)
    if (!qty || qty <= 0) {
      toast.error('Quantité invalide')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/stock/livraison', { type, quantite: qty })
      toast.success(`${qty} L de ${type} ajoutés avec succès`)
      setQuantite('')
      setType('essence')
      fetchStock()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('fuelo_theme', next ? 'dark' : 'light')
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const preview = (stocks[type] || 0) + (parseFloat(quantite) || 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: 'system-ui, sans-serif' }}>

      <Sidebar isDark={isDark} t={t} user={user} toggleTheme={toggleTheme} logout={logout} />

      <div style={{ marginLeft: 220, flex: 1, padding: '32px 28px' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
            Gestion du stock
          </div>
          <div style={{ fontSize: 13, color: t.textSub }}>
            Niveaux en temps réel — enregistrez vos livraisons ici
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #1E293B', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
              <StockCard label="Essence" quantite={stocks.essence ?? 0} seuil={300} t={t} isDark={isDark} />
              <StockCard label="Gasoil"  quantite={stocks.gasoil  ?? 0} seuil={300} t={t} isDark={isDark} />
            </div>

            <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, padding: '26px 28px', maxWidth: 500 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                Enregistrer une livraison
              </div>
              <div style={{ fontSize: 13, color: t.textSub, marginBottom: 22 }}>
                Le stock sera mis à jour automatiquement
              </div>

              <form onSubmit={handleSubmit}>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Type de carburant
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[{ val: 'essence', emoji: '⛽' }, { val: 'gasoil', emoji: '🛢️' }].map(({ val, emoji }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setType(val)}
                        style={{ padding: 12, borderRadius: 10, border: `1.5px solid ${type === val ? '#F59E0B' : t.border}`, background: type === val ? 'rgba(245,158,11,0.08)' : t.inputBg, color: type === val ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 13, fontWeight: type === val ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}
                      >
                        {emoji} {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Quantité reçue (litres)
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      placeholder="Ex: 2000"
                      value={quantite}
                      onChange={e => setQuantite(e.target.value)}
                      onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = t.border; e.target.style.boxShadow = 'none' }}
                      style={{ width: '100%', height: 50, background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 11, padding: '0 70px 0 16px', fontSize: 18, fontWeight: 700, color: t.text, fontFamily: 'monospace', outline: 'none', transition: 'all 0.2s' }}
                    />
                    <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: t.textMuted, pointerEvents: 'none' }}>
                      Litres
                    </span>
                  </div>

                  {quantite && parseFloat(quantite) > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', fontWeight: 500 }}>
                      Stock {type} après livraison : <strong>{preview.toLocaleString('fr-FR')} L</strong>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ width: '100%', height: 50, background: submitting ? '#D97706' : '#F59E0B', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(245,158,11,0.25)', transition: 'all 0.2s' }}
                >
                  {submitting
                    ? <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  }
                  {submitting ? 'Enregistrement...' : 'Confirmer la livraison'}
                </button>

              </form>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  )
}