import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'

const BG    = '#050A15'
const BLUE  = '#2563EB'
const SOFT  = '#60A5FA'
const DARK  = '#1D4ED8'
const GREEN = '#10B981'
const RED   = '#EF4444'
const TEXT  = '#F1F5F9'
const SUB   = 'rgba(255,255,255,0.35)'
const MUT   = 'rgba(255,255,255,0.2)'

const DOTS = Array.from({ length: 14 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  color: i % 3 === 0 ? SOFT : BLUE,
  dur: 12 + Math.random() * 18, delay: Math.random() * 8,
}))

function getStrength(pwd) {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const STRENGTH_COLOR = ['', RED, '#F59E0B', GREEN]
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

const BG_LAYOUT = { minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '20px' }

export default function ResetPassword() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [errors,   setErrors]   = useState({})

  const strength = getStrength(password)

  const validate = () => {
    const e = {}
    if (password.length < 6)   e.password = 'Minimum 6 caractères'
    if (password !== confirm)   e.confirm  = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    if (!token) { toast.error('Lien invalide'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      toast.success('Mot de passe modifié avec succès !')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  const BgDecorations = () => (
    <>
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DOTS.map((d, i) => <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, borderRadius: '50%', background: d.color, opacity: 0.25, animation: `floatPt ${d.dur}s ${d.delay}s ease-in-out infinite alternate` }} />)}
      </div>
    </>
  )

  if (!token) {
    return (
      <div style={BG_LAYOUT}>
        <BgDecorations />
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, background: 'rgba(8,13,26,0.78)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}
        >
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Lien invalide</h2>
          <p style={{ fontSize: 13, color: SUB, marginBottom: 24, lineHeight: 1.65 }}>Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, background: `linear-gradient(135deg, ${BLUE}, ${DARK})`, borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            Demander un nouveau lien
          </Link>
        </motion.div>
        <style>{`@keyframes floatPt { from{transform:translateY(0) scale(1)}to{transform:translateY(-25px) scale(1.2)} } * { box-sizing:border-box }`}</style>
      </div>
    )
  }

  return (
    <div style={BG_LAYOUT}>
      <BgDecorations />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, background: 'rgba(8,13,26,0.78)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <FueloLogo size={72} forceTextColor="#fff" />
        </div>

        {!success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 14 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nouveau mot de passe</span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 4 }}>Réinitialiser</h1>
            <p style={{ fontSize: 13, color: SUB, marginBottom: 24 }}>Choisissez un mot de passe sécurisé d'au moins 6 caractères.</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                    placeholder="Minimum 6 caractères"
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                    onBlur={e  => { e.target.style.borderColor = errors.password ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${errors.password ? RED : 'rgba(96,165,250,0.14)'}`, borderRadius: 12, padding: '0 44px 0 16px', fontSize: 15, color: TEXT, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', alignItems: 'center', padding: 4 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{errors.password}</div>}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />)}
                    </div>
                    <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 700 }}>{STRENGTH_LABEL[strength]}</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(er => ({ ...er, confirm: '' })) }}
                  placeholder="••••••••"
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                  onBlur={e  => { e.target.style.borderColor = errors.confirm ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
                  style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${errors.confirm ? RED : 'rgba(96,165,250,0.14)'}`, borderRadius: 12, padding: '0 16px', fontSize: 15, color: TEXT, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                />
                {errors.confirm && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{errors.confirm}</div>}
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', height: 52, background: `linear-gradient(135deg, ${BLUE}, ${DARK})`, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.4)', opacity: loading ? 0.75 : 1, transition: 'all 0.2s' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.55)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.4)' }}
              >
                {loading && <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {loading ? 'Modification...' : 'Modifier mon mot de passe'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.1 }}
              style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </motion.div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: '-0.3px' }}>Mot de passe modifié !</h2>
            <p style={{ fontSize: 13, color: SUB, marginBottom: 16 }}>Redirection vers la connexion dans 3 secondes...</p>
            <Link to="/login" style={{ fontSize: 13, color: SOFT, fontWeight: 600, textDecoration: 'none' }}>
              Aller maintenant →
            </Link>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        @keyframes floatPt { from { transform: translateY(0) scale(1); } to { transform: translateY(-25px) scale(1.2); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}