import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Logo Fuelo ───────────────────────────────────────
const FueloLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
      style={{ background: '#F59E0B', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-label="Logo Fuelo">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A"/>
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6"/>
      </svg>
    </div>
    <span className="text-xl font-black tracking-tight">
      <span className="text-white">fuel</span>
      <span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

// ── Icônes SVG ──────────────────────────────────────
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
const IconEye = ({ show }) => show ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconLogin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)
const IconCheck = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const IconShield = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconCheckCircle = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Calcul force mot de passe ────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}

const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981']
const strengthLabels = ['', 'Faible', 'Moyen', 'Fort']

// ── Preview cards (côté gauche) ─────────────────────
const previewCards = [
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, bg: 'rgba(16,185,129,0.12)', label: 'Stock essence', sub: 'Station Almamya · Conakry', val: '1 847 L', color: '#10B981' },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, bg: 'rgba(245,158,11,0.12)', label: 'Ventes du jour', sub: '↑ 12% vs hier', val: '6,4M GNF', color: '#F59E0B' },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, bg: 'rgba(239,68,68,0.1)', label: 'Alerte gasoil', sub: 'Commander maintenant', val: '280 L', color: '#EF4444' },
]

// ══════════════════════════════════════════════════════
export default function Login() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)
  const emailValid = email.includes('@') && email.includes('.')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Remplis tous les champs')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('fuelo_token', res.data.token)
      localStorage.setItem('fuelo_user', JSON.stringify(res.data.user))
      localStorage.setItem('fuelo_station', res.data.station_id)
      toast.success(`Bienvenue ${res.data.user.nom} ⛽`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  // ── Thème ────────────────────────────────────────
  const t = isDark ? {
    bg: '#0A0F1E',
    left: 'linear-gradient(135deg,#0D1528 0%,#0F172A 50%,#0A1020 100%)',
    right: '#0F172A',
    border: '#1E2D42',
    borderHover: '#2A3F5C',
    text: '#F1F5F9',
    textSub: '#64748B',
    textMuted: '#334155',
    inputBg: '#0A0F1E',
    card: '#141D2E',
    cardBorder: 'rgba(255,255,255,0.06)',
    googleBg: '#141D2E',
    googleText: '#94A3B8',
  } : {
    bg: '#F0F4F8',
    left: 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',
    right: '#FFFFFF',
    border: '#E2E8F0',
    borderHover: '#CBD5E1',
    text: '#0F172A',
    textSub: '#64748B',
    textMuted: '#CBD5E1',
    inputBg: '#F8FAFC',
    card: '#F8FAFC',
    cardBorder: 'rgba(0,0,0,0.06)',
    googleBg: '#F8FAFC',
    googleText: '#475569',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── GAUCHE ─────────────────────────────── */}
      <div style={{ background: t.left, padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>

        {/* Décorations */}
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', top: -80, left: -80, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 70%)', bottom: 0, right: -40, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <FueloLogo />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Preview cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {previewCards.map((card, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{card.sub}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: card.color, fontFamily: 'DM Mono, monospace' }}>{card.val}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.8px' }}>
            Gérez votre station.<br/>
            <span style={{ color: '#F59E0B' }}>Depuis n'importe où.</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 280 }}>
            Stock, ventes, alertes — tout en temps réel. Le logiciel que les stations africaines attendaient.
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 2 }}>
          {[['200+', 'Stations actives'], ['14j', 'Essai gratuit'], ['99%', 'Satisfaction']].map(([n, l]) => (
            <div key={l} style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', letterSpacing: '-0.5px', fontFamily: 'DM Mono, monospace' }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE ─────────────────────────────── */}
      <div style={{ background: t.right, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px', position: 'relative', borderLeft: `0.5px solid ${t.border}`, transition: 'background 0.3s' }}>

        {/* Toggle thème */}
        <button onClick={() => setIsDark(!isDark)}
          style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 10, background: t.card, border: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub, transition: 'all 0.2s' }}>
          {isDark ? <IconMoon /> : <IconSun />}
        </button>

        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Connexion sécurisée
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4, transition: 'color 0.3s' }}>
            Bon retour 👋
          </div>
          <div style={{ fontSize: 13, color: t.textSub, marginBottom: 28, lineHeight: 1.5 }}>
            Connectez-vous à votre espace Fuelo.
          </div>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, borderRight: `0.5px solid ${t.border}` }}>
                  <IconMail />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gerant@mastation.com"
                  style={{ width: '100%', height: 48, background: t.inputBg, border: `1.5px solid ${emailValid && email ? '#10B981' : t.border}`, borderRadius: 11, padding: '0 14px 0 52px', fontSize: 14, color: t.text, fontFamily: 'inherit', outline: 'none', transition: 'all 0.25s' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                {emailValid && email && (
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#10B981' }}>
                    <IconCheckCircle />
                  </div>
                )}
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, borderRight: `0.5px solid ${t.border}` }}>
                  <IconLock />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', height: 48, background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 11, padding: '0 44px 0 52px', fontSize: 14, color: t.text, fontFamily: 'inherit', outline: 'none', transition: 'all 0.25s' }}
                  onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)'}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <IconEye show={showPwd} />
                </button>
              </div>

              {/* Barre de force */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : t.border, transition: 'background 0.3s' }}/>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: strengthColors[strength], fontWeight: 600 }}>
                    {strengthLabels[strength]}
                  </div>
                </div>
              )}
            </div>

            {/* Options */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, marginTop: 14 }}>
              <div onClick={() => setRemember(!remember)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${remember ? '#F59E0B' : t.border}`, background: remember ? '#F59E0B' : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#0F172A' }}>
                  {remember && <IconCheck />}
                </div>
                <span style={{ fontSize: 12, color: t.textSub }}>Se souvenir de moi</span>
              </div>
              <a href="#" style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500, textDecoration: 'none' }}>
                Mot de passe oublié ?
              </a>
            </div>

            {/* Bouton submit */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? '#D97706' : '#F59E0B', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', letterSpacing: '-0.2px', marginBottom: 20, transition: 'all 0.25s', boxShadow: '0 4px 15px rgba(245,158,11,0.2)' }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 25px rgba(245,158,11,0.35)' }}}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(245,158,11,0.2)' }}>
              {loading ? (
                <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              ) : <IconLogin />}
              {loading ? 'Connexion...' : 'Se connecter à Fuelo'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: '0.5px', background: t.border }}/>
            <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 500 }}>ou continuer avec</span>
            <div style={{ flex: 1, height: '0.5px', background: t.border }}/>
          </div>

          {/* Google */}
          <button style={{ width: '100%', height: 46, background: t.googleBg, border: `1.5px solid ${t.border}`, borderRadius: 11, fontSize: 13, fontWeight: 500, color: t.googleText, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit', marginBottom: 22, transition: 'all 0.2s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Signup */}
          <div style={{ textAlign: 'center', fontSize: 13, color: t.textSub, marginBottom: 20 }}>
            Pas de compte ?{' '}
            <a href="/register" style={{ color: '#F59E0B', fontWeight: 600, textDecoration: 'none' }}>
              14 jours gratuits →
            </a>
          </div>

          {/* Trust */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 18, borderTop: `0.5px solid ${t.border}` }}>
            {[
              [<IconShield />, 'SSL 256-bit'],
              [<IconClock />, 'Uptime 99.9%'],
              [<IconCheckCircle />, 'Sans engagement'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {icon}
                <span style={{ fontSize: 11, color: t.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: ${t.textMuted}; }
      `}</style>
    </div>
  )
}