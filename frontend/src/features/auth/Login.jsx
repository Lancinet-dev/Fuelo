// ================================================
// FUELO V2 — Login
// Fichier : frontend/src/features/auth/Login.jsx
// ================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import theme from '../../config/theme'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'

const BLUE        = '#2563EB'
const BLUE_SOFT   = '#60A5FA'
const BLUE_DARK   = '#1D4ED8'
const ORANGE      = '#F59E0B'

function getStrength(pwd) {
  if (!pwd)                                                           return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))  return 3
  if (pwd.length >= 8)                                                return 2
  if (pwd.length >= 4)                                                return 1
  return 0
}
const STRENGTH_COLOR = ['', '#EF4444', ORANGE, '#10B981']
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

const PREVIEW_CARDS = [
  { icon: '📊', label: 'Stock essence',  value: '1 847 L',  status: 'Normal',   color: '#10B981' },
  { icon: '💰', label: 'Ventes du jour', value: '6,4M GNF', status: '↑ 12%',   color: BLUE_SOFT },
  { icon: '⚠️', label: 'Alerte gasoil', value: '280 L',    status: 'Critique', color: '#EF4444' },
]

const AVANTAGES = [
  { icon: '✓', text: 'Sans carte bancaire' },
  { icon: '✓', text: '14 jours gratuits'   },
  { icon: '✓', text: 'Sans engagement'     },
]

export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const emailValid = email.includes('@') && email.includes('.')
  const strength   = getStrength(password)

  const validate = () => {
    const e = {}
    if (!email.trim())    e.email    = 'Email obligatoire'
    if (!emailValid)      e.email    = 'Email invalide'
    if (!password.trim()) e.password = 'Mot de passe obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Bienvenue ${user.nom} ⛽`)
      // Déclenche le splash screen à la prochaine connexion
      sessionStorage.setItem('fuelo_just_logged_in', '1')
      if (user.role === 'pompiste') navigate('/pompiste')
      else                          navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Email ou mot de passe incorrect'
      toast.error(msg)
      setErrors({ global: msg })
    } finally {
      setLoading(false)
    }
  }

  const inputBase = (hasError) => ({
    width:        '100%',
    height:       48,
    background:   'rgba(255,255,255,0.04)',
    border:       `1.5px solid ${hasError ? '#EF4444' : 'rgba(96,165,250,0.15)'}`,
    borderRadius: theme.radius.md,
    padding:      '0 16px',
    fontSize:     theme.font.size.base,
    color:        '#F1F5F9',
    fontFamily:   theme.font.family,
    outline:      'none',
    transition:   theme.transition.normal,
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh', fontFamily: theme.font.family }}>

      {/* ── GAUCHE ──────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 60%, #0A1628 100%)', padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)', bottom: 50, right: -50, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Logo */}
        <FueloLogo size={36} forceTextColor="#fff" />

        {/* Contenu central */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {PREVIEW_CARDS.map(card => (
              <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(96,165,250,0.12)', borderRadius: theme.radius.lg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{card.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{card.status}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: card.color, fontFamily: theme.font.mono }}>{card.value}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.8px' }}>
            Gérez votre station.<br />
            <span style={{ color: BLUE_SOFT }}>Depuis n'importe où.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 300 }}>
            Stock, ventes, alertes — tout en temps réel. Le logiciel que les stations africaines attendaient.
          </p>
        </div>

        {/* Stats bas */}
        <div style={{ display: 'flex', gap: 28, position: 'relative', zIndex: 2 }}>
          {[['200+', 'Stations'], ['14j', 'Gratuit'], ['99%', 'Satisfaction']].map(([n, l]) => (
            <div key={l} style={{ borderTop: `1px solid rgba(96,165,250,0.2)`, paddingTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: BLUE_SOFT, fontFamily: theme.font.mono }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE ──────────────────────────────── */}
      <div style={{ background: '#0B1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px', borderLeft: '0.5px solid rgba(96,165,250,0.08)' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE_SOFT, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connexion sécurisée</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 4 }}>Bon retour 👋</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>Connectez-vous à votre espace Fuelo.</p>

          {errors.global && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: 16, fontSize: theme.font.size.sm, color: '#EF4444' }}>
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>Adresse email</label>
              <div style={{ position: 'relative' }}>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                  placeholder="gerant@mastation.com"
                  style={{ ...inputBase(errors.email), paddingRight: emailValid && email ? 44 : 16 }}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.email ? '#EF4444' : 'rgba(96,165,250,0.15)'; e.target.style.boxShadow = 'none' }}
                />
                {emailValid && email && (
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                )}
              </div>
              {errors.email && <div style={{ fontSize: theme.font.size.xs, color: '#EF4444', marginTop: 4 }}>{errors.email}</div>}
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mot de passe</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: BLUE_SOFT, textDecoration: 'none', fontWeight: 500 }}>Oublié ?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                  placeholder="••••••••"
                  style={{ ...inputBase(errors.password), paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.password ? '#EF4444' : 'rgba(96,165,250,0.15)'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPwd
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <div style={{ fontSize: theme.font.size.xs, color: '#EF4444', marginTop: 4 }}>{errors.password}</div>}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 600 }}>{STRENGTH_LABEL[strength]}</div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? BLUE_DARK : `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`, border: 'none', borderRadius: theme.radius.md, fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: theme.font.family, boxShadow: '0 4px 20px rgba(37,99,235,0.4)', transition: theme.transition.fast, marginTop: 20, marginBottom: 18 }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.5)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)' }}
            >
              {loading
                ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
              }
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
              <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
            </div>

            {/* Google */}
            <a href="http://localhost:5000/api/auth/google"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 46, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(96,165,250,0.12)', borderRadius: '10px', color: '#F1F5F9', fontSize: 14, fontFamily: 'inherit', textDecoration: 'none', marginBottom: 18, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.background = 'rgba(37,99,235,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuer avec Google
            </a>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              Pas de compte ?{' '}
              <Link to="/register" style={{ color: BLUE_SOFT, fontWeight: 600, textDecoration: 'none' }}>
                14 jours gratuits →
              </Link>
            </div>
          </form>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 20, marginTop: 20, borderTop: '0.5px solid rgba(96,165,250,0.08)' }}>
            {AVANTAGES.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>{icon}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          [style*="grid-template-columns: 1.1fr 0.9fr"] { grid-template-columns: 1fr !important; }
          [style*="padding: 44px"] { display: none !important; }
        }
      `}</style>
    </div>
  )
}