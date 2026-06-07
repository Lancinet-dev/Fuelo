// ================================================
// FUELO V2 — ForgotPassword
// Fichier : frontend/src/features/auth/ForgotPassword.jsx
// ================================================

import { useState } from 'react'
import { Link }     from 'react-router-dom'
import api          from '../../services/api'
import toast        from 'react-hot-toast'
import theme        from '../../config/theme'
import FueloLogo from '../../components/FueloLogo'
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
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: theme.font.family }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <FueloLogo size={80} forceTextColor="#fff" />

      

        <div style={{ background: '#0F172A', border: '0.5px solid #1E2D42', borderRadius: 16, padding: '32px 28px' }}>

          {!sent ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 8, letterSpacing: '-0.5px' }}>
                Mot de passe oublié ?
              </h1>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 24, lineHeight: 1.6 }}>
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="gerant@mastation.com"
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                    onBlur={e  => { e.target.style.borderColor = '#1E2D42'; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 48, background: '#0A0F1E', border: '1.5px solid #1E2D42', borderRadius: theme.radius.md, padding: '0 16px', fontSize: 14, color: '#F1F5F9', fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', height: 50, background: loading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.md, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: theme.font.family, boxShadow: theme.shadow.primary, marginBottom: 16 }}
                >
                  {loading
                    ? <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  }
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>

                <div style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>
                  <Link to="/login" style={{ color: theme.colors.primary, textDecoration: 'none', fontWeight: 500 }}>
                    ← Retour à la connexion
                  </Link>
                </div>
              </form>
            </>
          ) : (
            /* État succès */
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Email envoyé !</h2>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
                Si <strong style={{ color: '#F1F5F9' }}>{email}</strong> correspond à un compte Fuelo,
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#F59E0B' }}>
                ⏱️ Le lien expire dans 15 minutes
              </div>
              <Link to="/login" style={{ display: 'block', padding: '12px', borderRadius: theme.radius.md, background: theme.colors.primary, color: '#0F172A', fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}>
                Retour à la connexion →
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}