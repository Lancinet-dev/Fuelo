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

const formatGNF = (n) => {
  const num = parseFloat(n || 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M GNF`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K GNF`
  return `${num} GNF`
}

const formatTime = (d) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Ventes() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('fuelo_theme') !== 'light')
  const [ventes, setVentes] = useState([])
  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'essence', litres: '', montant_gnf: '' })
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
    inputBg: isDark ? '#0A0F1E' : '#F8FAFC',
    row: isDark ? '#1E293B' : '#fff',
    rowHover: isDark ? '#263548' : '#F8FAFC',
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ventesRes, todayRes] = await Promise.all([
        api.get('/ventes'),
        api.get('/ventes/aujourdhui')
      ])
      setVentes(ventesRes.data.ventes || [])
      setToday(todayRes.data.aujourdhui)
    } catch { toast.error('Erreur chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchData()
    }

    loadData()
  }, [])

  const handleVente = async (e) => {
    e.preventDefault()
    if (!form.litres || !form.montant_gnf) { toast.error('Remplis tous les champs'); return }
    setSubmitting(true)
    try {
      await api.post('/ventes', {
        type: form.type,
        litres: parseFloat(form.litres),
        montant_gnf: parseInt(form.montant_gnf)
      })
      toast.success('✅ Vente enregistrée')
      setForm({ type: 'essence', litres: '', montant_gnf: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally { setSubmitting(false) }
  }

  const logout = () => { localStorage.clear(); navigate('/login') }
  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('fuelo_theme', next ? 'dark' : 'light')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: t.sidebar, borderRight: `0.5px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ marginBottom: 32 }}><FueloLogo /></div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const isActive = window.location.pathname === item.path
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(245,158,11,0.12)' : 'transparent', color: isActive ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 13, fontWeight: isActive ? 600 : 400, width: '100%', textAlign: 'left' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={item.d}/></svg>
                {item.label}
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
            <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>Ventes</div>
            <div style={{ fontSize: 13, color: t.textSub }}>Historique et enregistrement</div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#0F172A', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Nouvelle vente
          </button>
        </div>

        {/* Stats du jour */}
        {today && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: "Transactions aujourd'hui", val: today.nb || '0', color: '#F59E0B' },
              { label: 'Litres vendus', val: `${parseFloat(today.litres || 0).toLocaleString('fr-FR')} L`, color: '#10B981' },
              { label: 'Montant encaissé', val: formatGNF(today.montant), color: '#60A5FA' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'DM Mono, monospace', letterSpacing: '-0.8px' }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire nouvelle vente */}
        {showForm && (
          <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, padding: '24px 26px', marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 20 }}>Enregistrer une vente</div>
            <form onSubmit={handleVente}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['essence', 'gasoil'].map(type => (
                      <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))}
                        style={{ flex: 1, padding: '11px 8px', borderRadius: 10, border: `1.5px solid ${form.type === type ? '#F59E0B' : t.border}`, background: form.type === type ? 'rgba(245,158,11,0.08)' : t.inputBg, color: form.type === type ? '#F59E0B' : t.textSub, fontFamily: 'inherit', fontSize: 12, fontWeight: form.type === type ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                        {type === 'essence' ? '⛽' : '🛢️'} {type}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Litres */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Litres vendus</label>
                  <input type="number" min="0.1" step="0.1" placeholder="Ex: 50" value={form.litres}
                    onChange={e => setForm(f => ({ ...f, litres: e.target.value }))}
                    style={{ width: '100%', height: 46, background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: '0 14px', fontSize: 15, fontWeight: 600, color: t.text, fontFamily: 'DM Mono, monospace', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = t.border}
                  />
                </div>
                {/* Montant */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Montant (GNF)</label>
                  <input type="number" min="1" placeholder="Ex: 500000" value={form.montant_gnf}
                    onChange={e => setForm(f => ({ ...f, montant_gnf: e.target.value }))}
                    style={{ width: '100%', height: 46, background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: '0 14px', fontSize: 15, fontWeight: 600, color: t.text, fontFamily: 'DM Mono, monospace', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#F59E0B'}
                    onBlur={e => e.target.style.borderColor = t.border}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={submitting}
                  style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#0F172A', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {submitting ? <div style={{ width: 14, height: 14, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/> : null}
                  {submitting ? 'Enregistrement...' : 'Confirmer la vente'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '11px 20px', borderRadius: 10, border: `0.5px solid ${t.border}`, background: 'transparent', color: t.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau historique */}
        <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `0.5px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Historique des ventes</div>
            <div style={{ fontSize: 12, color: t.textSub }}>{ventes.length} transaction{ventes.length > 1 ? 's' : ''}</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: t.textSub }}>
              <div style={{ width: 32, height: 32, border: '3px solid #1E293B', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}/>
            </div>
          ) : ventes.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: t.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.textSub, marginBottom: 4 }}>Aucune vente enregistrée</div>
              <div style={{ fontSize: 13 }}>Cliquez sur "Nouvelle vente" pour commencer</div>
            </div>
          ) : (
            <div>
              {/* En-tête tableau */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 140px', padding: '10px 22px', background: isDark ? '#141D2E' : '#F8FAFC', borderBottom: `0.5px solid ${t.border}` }}>
                {['#', 'Type', 'Litres', 'Montant', 'Date'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>
              {/* Lignes */}
              {ventes.map((v, i) => (
                <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 140px', padding: '13px 22px', borderBottom: i < ventes.length - 1 ? `0.5px solid ${t.border}` : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: 12, color: t.textMuted, fontFamily: 'DM Mono, monospace' }}>#{v.id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{v.type === 'essence' ? '⛽' : '🛢️'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.text, textTransform: 'capitalize' }}>{v.type}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#10B981', fontFamily: 'DM Mono, monospace' }}>{parseFloat(v.litres).toLocaleString('fr-FR')} L</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', fontFamily: 'DM Mono, monospace' }}>{formatGNF(v.montant_gnf)}</div>
                  <div style={{ fontSize: 11, color: t.textSub }}>{formatTime(v.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0;}`}</style>
    </div>
  )
}