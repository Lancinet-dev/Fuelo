import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'

const BG    = '#050A15'
const BLUE  = '#2563EB'
const SOFT  = '#60A5FA'
const DARK  = '#1D4ED8'
const GREEN = '#10B981'
const TEXT  = '#F1F5F9'
const SUB   = 'rgba(255,255,255,0.35)'
const MUT   = 'rgba(255,255,255,0.2)'

const DOTS = Array.from({ length: 14 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  color: i % 3 === 0 ? SOFT : BLUE,
  dur: 12 + Math.random() * 18, delay: Math.random() * 8,
}))
export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) { toast.error('Email invalide'); return }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '20px' }}>

      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DOTS.map((d, i) => <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, borderRadius: '50%', background: d.color, opacity: 0.25, animation: `floatPt ${d.dur}s ${d.delay}s ease-in-out infinite alternate` }} />)}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420, background: 'rgba(8,13,26,0.78)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <FueloLogo size={72} forceTextColor="#fff" />
        </div>

        {!sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 14 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={SOFT} strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Récupération</span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 4 }}>Mot de passe oublié ?</h1>
            <p style={{ fontSize: 13, color: SUB, marginBottom: 24, lineHeight: 1.65 }}>
              Entrez votre email — nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gerant@mastation.com"
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
                  style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(96,165,250,0.14)', borderRadius: 12, padding: '0 16px', fontSize: 15, color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', height: 52, background: `linear-gradient(135deg, ${BLUE}, ${DARK})`, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.4)', opacity: loading ? 0.75 : 1, transition: 'all 0.2s', marginBottom: 16 }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.55)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.4)' }}
              >
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                }
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: 13, color: SOFT, fontWeight: 600, textDecoration: 'none' }}>
                  ← Retour à la connexion
                </Link>
              </div>
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

            <h2 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: '-0.3px' }}>Email envoyé !</h2>
            <p style={{ fontSize: 13, color: SUB, lineHeight: 1.7, marginBottom: 20 }}>
              Si <strong style={{ color: TEXT }}>{email}</strong> correspond à un compte Fuelo,
              vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>

            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Le lien expire dans 15 minutes
            </div>

            <Link to="/login"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, background: `linear-gradient(135deg, ${BLUE}, ${DARK})`, borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
            >
              Retour à la connexion
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
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