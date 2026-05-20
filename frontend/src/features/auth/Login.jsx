// ================================================
// FUELO V2 — Login
// Fichier : frontend/src/features/auth/Login.jsx
// ================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import theme from '../../config/theme'
import toast from 'react-hot-toast'

// ── Logo ─────────────────────────────────────────────
function FueloLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 36, height: 36, background: theme.colors.primary, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.primary }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
          <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
        </svg>
      </div>
      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
        <span style={{ color: '#fff' }}>fuel</span>
        <span style={{ color: theme.colors.primary }}>o</span>
      </span>
    </div>
  )
}

// ── Calcul force mot de passe ─────────────────────────
function getStrength(pwd) {
  if (!pwd)                                                            return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))   return 3
  if (pwd.length >= 8)                                                 return 2
  if (pwd.length >= 4)                                                 return 1
  return 0
}

const STRENGTH_COLOR = ['', '#EF4444', '#F59E0B', '#10B981']
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

// ── Preview cards côté gauche ─────────────────────────
const PREVIEW_CARDS = [
  { icon: '📊', label: 'Stock essence', value: '1 847 L', status: 'Normal', color: '#10B981' },
  { icon: '💰', label: 'Ventes du jour', value: '6,4M GNF', status: '↑ 12%',  color: '#F59E0B' },
  { icon: '⚠️', label: 'Alerte gasoil',  value: '280 L',   status: 'Critique', color: '#EF4444' },
]

// ── Avantages côté gauche ─────────────────────────────
const AVANTAGES = [
  { icon: '✓', text: 'Sans carte bancaire' },
  { icon: '✓', text: '14 jours gratuits'   },
  { icon: '✓', text: 'Sans engagement'     },
]

// ── Login ─────────────────────────────────────────────
export default function Login() {
  const navigate     = useNavigate()
  const { login }    = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const emailValid = email.includes('@') && email.includes('.')
  const strength   = getStrength(password)

  const validate = () => {
    const e = {}
    if (!email.trim())     e.email    = 'Email obligatoire'
    if (!emailValid)       e.email    = 'Email invalide'
    if (!password.trim())  e.password = 'Mot de passe obligatoire'
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
      // Redirection selon rôle
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

  // ── Styles communs ────────────────────────────────
  const inputBase = (hasError) => ({
    width:        '100%',
    height:       48,
    background:   '#0A0F1E',
    border:       `1.5px solid ${hasError ? theme.colors.danger : '#1E2D42'}`,
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

      {/* ── GAUCHE — sombre ─────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0D1528 0%, #0F172A 50%, #0A1020 100%)', padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>

        {/* Décorations */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', top: -100, left: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <FueloLogo />
        </div>

        {/* Centre */}
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Preview cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {PREVIEW_CARDS.map(card => (
              <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: theme.radius.lg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, backdropFilter: 'blur(10px)' }}>
                <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {card.icon}
                </div>
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
            <span style={{ color: theme.colors.primary }}>Depuis n'importe où.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, maxWidth: 300 }}>
            Stock, ventes, alertes — tout en temps réel. Le logiciel que les stations africaines attendaient.
          </p>
        </div>

        {/* Stats bas */}
        <div style={{ display: 'flex', gap: 28, position: 'relative', zIndex: 2 }}>
          {[['200+', 'Stations'], ['14j', 'Gratuit'], ['99%', 'Satisfaction']].map(([n, l]) => (
            <div key={l} style={{ borderTop: `1px solid rgba(245,158,11,0.2)`, paddingTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: theme.colors.primary, fontFamily: theme.font.mono }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE — clair ──────────────────────── */}
      <div style={{ background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px', borderLeft: '0.5px solid #1E2D42' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          {/* Titre */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Connexion sécurisée
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 4 }}>
            Bon retour 👋
          </h1>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 28 }}>
            Connectez-vous à votre espace Fuelo.
          </p>

          {/* Erreur globale */}
          {errors.global && (
            <div style={{ background: theme.colors.dangerLight, border: `1px solid ${theme.colors.danger}30`, borderRadius: theme.radius.md, padding: '10px 14px', marginBottom: 16, fontSize: theme.font.size.sm, color: theme.colors.danger }}>
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                  placeholder="gerant@mastation.com"
                  style={{ ...inputBase(errors.email), paddingRight: emailValid && email ? 44 : 16 }}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                  onBlur={e  => { e.target.style.borderColor = errors.email ? theme.colors.danger : '#1E2D42'; e.target.style.boxShadow = 'none' }}
                />
                {emailValid && email && (
                  <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                )}
              </div>
              {errors.email && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.email}</div>}
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Mot de passe
                </label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: theme.colors.primary, textDecoration: 'none', fontWeight: 500 }}>
                  Oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                  placeholder="••••••••"
                  style={{ ...inputBase(errors.password), paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                  onBlur={e  => { e.target.style.borderColor = errors.password ? theme.colors.danger : '#1E2D42'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPwd
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.password}</div>}

              {/* Barre de force */}
              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : '#1E2D42', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 600 }}>
                    {STRENGTH_LABEL[strength]}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.md, fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: '#0F172A', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.fast, marginTop: 20, marginBottom: 18 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
              )}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            {/* Lien inscription */}
            <div style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>
              Pas de compte ?{' '}
              <Link to="/register" style={{ color: theme.colors.primary, fontWeight: 600, textDecoration: 'none' }}>
                14 jours gratuits →
              </Link>
            </div>
          </form>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 20, marginTop: 20, borderTop: '0.5px solid #1E2D42' }}>
            {AVANTAGES.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>{icon}</span>
                <span style={{ fontSize: 11, color: '#334155' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          [style*="grid-template-columns: 1.1fr 0.9fr"] {
            grid-template-columns: 1fr !important;
          }
          [style*="padding: 44px"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
