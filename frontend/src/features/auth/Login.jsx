import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'
import WhatsAppButton from '../../ui/WhatsAppButton'

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
const GOOGLE_URL = `${BACKEND}/api/auth/google`

const BLUE  = '#2563EB'
const SOFT  = '#60A5FA'
const DARK  = '#1D4ED8'
const ORANGE = '#F59E0B'
const GREEN  = '#10B981'
const RED    = '#EF4444'
const BG     = '#050A15'
const TEXT   = '#F1F5F9'

const normalizeRole = (v = '') => { const r = String(v).trim().toLowerCase(); return r === 'manager' ? 'gerant' : r }
const getHomePath   = (role) => {
  const r = normalizeRole(role)
  if (r === 'pompiste')    return '/pompiste'
  if (r === 'chauffeur')   return '/chauffeur'
  if (r === 'logisticien') return '/logistique'
  return '/dashboard'
}

function getStrength(pwd) {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const STRENGTH_COLOR = ['', RED, ORANGE, GREEN]
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

// ── Particules background ─────────────────────────────
const DOTS = Array.from({ length: 20 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  color: i % 5 === 0 ? ORANGE : i % 3 === 0 ? SOFT : BLUE,
  dur: 12 + Math.random() * 18, delay: Math.random() * 8,
}))

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
    if (!email.trim()) e.email = 'Email obligatoire'
    else if (!emailValid) e.email = 'Email invalide'
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
      toast.success(`Bienvenue ${user.nom}`)
      sessionStorage.setItem('fuelo_just_logged_in', '1')
      navigate(getHomePath(user.role))
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Email ou mot de passe incorrect'
      toast.error(msg)
      setErrors({ global: msg })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', height: 50,
    background: 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${hasError ? RED : 'rgba(96,165,250,0.14)'}`,
    borderRadius: 12, padding: '0 16px',
    fontSize: 15, color: TEXT,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Fond atmosphérique ─────────────────────── */}
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '70vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />

      {/* Particules */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DOTS.map((d, i) => (
          <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, borderRadius: '50%', background: d.color, opacity: 0.3, animation: `floatPt ${d.dur}s ${d.delay}s ease-in-out infinite alternate` }} />
        ))}
      </div>

      {/* ── Card glassmorphism ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440, margin: '20px', background: 'rgba(8,13,26,0.75)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 24, padding: '40px 36px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.05), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <FueloLogo size={36} forceTextColor="#fff" />
        </div>

        {/* Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '5px 14px', width: 'fit-content', margin: '0 auto 20px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}`, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connexion sécurisée</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: TEXT, letterSpacing: '-0.8px', marginBottom: 6, textAlign: 'center' }}>Bon retour</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 28, textAlign: 'center' }}>Connectez-vous à votre espace Fuelo.</p>

        {errors.global && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: RED }}>
            {errors.global}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Adresse email</label>
            <div style={{ position: 'relative' }}>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setErrors(r => ({ ...r, email: '' })) }}
                placeholder="gerant@mastation.com"
                style={{ ...inputStyle(errors.email), paddingRight: emailValid && email ? 44 : 16 }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                onBlur={e  => { e.target.style.borderColor = errors.email ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
              />
              {emailValid && email && (
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>
            {errors.email && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{errors.email}</div>}
          </div>

          {/* Mot de passe */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: SOFT, textDecoration: 'none', fontWeight: 500 }}>Oublié ?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPwd ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setErrors(r => ({ ...r, password: '' })) }}
                placeholder="••••••••"
                style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                onBlur={e  => { e.target.style.borderColor = errors.password ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', padding: 4 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPwd
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
            {errors.password && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{errors.password}</div>}
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 700 }}>{STRENGTH_LABEL[strength]}</div>
              </div>
            )}
          </div>

          {/* Submit */}
          <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.01 }} whileTap={{ scale: 0.98 }}
            style={{ width: '100%', height: 52, background: loading ? DARK : `linear-gradient(135deg, ${BLUE}, ${DARK})`, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.4)', marginTop: 20, marginBottom: 16 }}>
            {loading
              ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>}
            {loading ? 'Connexion...' : 'Se connecter'}
          </motion.button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
          </div>

          {/* Google */}
          <a href={GOOGLE_URL}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 48, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(96,165,250,0.12)', borderRadius: 12, color: TEXT, fontSize: 14, fontFamily: 'inherit', textDecoration: 'none', marginBottom: 20, transition: 'all 0.2s', fontWeight: 500 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.background = 'rgba(37,99,235,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </a>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            Pas de compte ?{' '}
            <Link to="/register" style={{ color: SOFT, fontWeight: 700, textDecoration: 'none' }}>14 jours gratuits →</Link>
          </div>
        </form>

        {/* Trust badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 20, marginTop: 20, borderTop: '0.5px solid rgba(96,165,250,0.07)', flexWrap: 'wrap' }}>
          {['Sans carte', '14j gratuits', 'Sans engagement'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{t}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <WhatsAppButton />

      <style>{`
        @keyframes floatPt { from { transform: translateY(0) scale(1); } to { transform: translateY(-25px) scale(1.2); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin    { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
