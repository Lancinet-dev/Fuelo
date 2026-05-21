// ================================================
// FUELO V2 — ResetPassword
// Fichier : frontend/src/features/auth/ResetPassword.jsx
// ================================================

import { useState }              from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api   from '../../services/api'
import toast from 'react-hot-toast'
import theme from '../../config/theme'

function getStrength(pwd) {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const STRENGTH_COLOR = ['', '#EF4444', '#F59E0B', '#10B981']
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

export default function ResetPassword() {
  const navigate                = useNavigate()
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [errors,    setErrors]    = useState({})

  const strength = getStrength(password)

  const validate = () => {
    const e = {}
    if (password.length < 6)       e.password = 'Minimum 6 caractères'
    if (password !== confirm)       e.confirm  = 'Les mots de passe ne correspondent pas'
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

  // Token manquant
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: theme.font.family }}>
        <div style={{ background: '#0F172A', border: '0.5px solid #1E2D42', borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Lien invalide</h2>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password" style={{ display: 'block', padding: '12px', borderRadius: theme.radius.md, background: theme.colors.primary, color: '#0F172A', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: theme.font.family }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: theme.colors.primary, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: theme.shadow.primary }}>
            <svg width="24" height="24" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
            fuel<span style={{ color: theme.colors.primary }}>o</span>
          </span>
        </div>

        <div style={{ background: '#0F172A', border: '0.5px solid #1E2D42', borderRadius: 16, padding: '32px 28px' }}>

          {!success ? (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 4, letterSpacing: '-0.5px' }}>
                Nouveau mot de passe
              </h1>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>
                Choisissez un mot de passe sécurisé d'au moins 6 caractères.
              </p>

              <form onSubmit={handleSubmit}>

                {/* Mot de passe */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                    Nouveau mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                      placeholder="Minimum 6 caractères"
                      onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                      onBlur={e  => { e.target.style.borderColor = errors.password ? theme.colors.danger : '#1E2D42'; e.target.style.boxShadow = 'none' }}
                      style={{ width: '100%', height: 48, background: '#0A0F1E', border: `1.5px solid ${errors.password ? theme.colors.danger : '#1E2D42'}`, borderRadius: theme.radius.md, padding: '0 44px 0 16px', fontSize: 14, color: '#F1F5F9', fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
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
                      <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 600 }}>{STRENGTH_LABEL[strength]}</div>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setErrors(er => ({ ...er, confirm: '' })) }}
                    placeholder="••••••••"
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                    onBlur={e  => { e.target.style.borderColor = errors.confirm ? theme.colors.danger : '#1E2D42'; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 48, background: '#0A0F1E', border: `1.5px solid ${errors.confirm ? theme.colors.danger : '#1E2D42'}`, borderRadius: theme.radius.md, padding: '0 16px', fontSize: 14, color: '#F1F5F9', fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
                  />
                  {errors.confirm && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.confirm}</div>}
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', height: 50, background: loading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.md, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}>
                  {loading && <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Modification...' : 'Modifier mon mot de passe'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>Mot de passe modifié !</h2>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Redirection vers la connexion dans 3 secondes...</p>
              <Link to="/login" style={{ fontSize: 13, color: theme.colors.primary, textDecoration: 'none', fontWeight: 500 }}>
                Aller maintenant →
              </Link>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}