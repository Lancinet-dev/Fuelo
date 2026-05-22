// ================================================
// FUELO V2 — Register avec theme bleu
// Fichier : frontend/src/features/auth/Register.jsx
// ================================================

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import theme from '../../config/theme'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'
const BLUE      = '#2563EB'
const BLUE_SOFT = '#60A5FA'
const BLUE_DARK = '#1D4ED8'
const ORANGE    = '#F59E0B'



const AVANTAGES = [
  { emoji: '⚡', title: 'Démarrage en 2 minutes',  desc: 'Inscription simple, pas de carte bancaire' },
  { emoji: '📊', title: 'Dashboard en temps réel', desc: 'Stock, ventes et alertes accessibles partout' },
  { emoji: '🔒', title: 'Données sécurisées',      desc: 'Chiffrement SSL, vos données vous appartiennent' },
  { emoji: '🌍', title: "Fait pour l'Afrique",     desc: 'Conçu pour les stations africaines' },
]

const STEPS = ['Votre compte', 'Votre station', 'Confirmation']

function getStrength(pwd) {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const STRENGTH_COLOR = ['', '#EF4444', ORANGE, '#10B981']
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

function Field({ label, type = 'text', value, onChange, placeholder, error, suffix }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)' }}
          onBlur={e  => { e.target.style.borderColor = error ? '#EF4444' : 'rgba(96,165,250,0.15)'; e.target.style.boxShadow = 'none' }}
          style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${error ? '#EF4444' : 'rgba(96,165,250,0.15)'}`, borderRadius: theme.radius.md, padding: suffix ? '0 44px 0 16px' : '0 16px', fontSize: theme.font.size.base, color: '#F1F5F9', fontFamily: theme.font.family, outline: 'none', transition: theme.transition.normal }}
        />
        {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
      {error && <div style={{ fontSize: theme.font.size.xs, color: '#EF4444', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export default function Register() {
  const navigate     = useNavigate()
  const { register } = useAuth()

  const [step,    setStep]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [errors,  setErrors]  = useState({})

  const [form, setForm] = useState({ nom: '', email: '', password: '', nom_station: '', ville: 'Conakry', pays: 'Guinée' })

  const set = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })) }

  const emailValid = form.email.includes('@') && form.email.includes('.')
  const strength   = getStrength(form.password)

  const validateStep1 = () => {
    const e = {}
    if (!form.nom.trim())         e.nom      = 'Obligatoire'
    if (!emailValid)              e.email    = 'Email invalide'
    if (form.password.length < 6) e.password = 'Minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.nom_station.trim()) e.nom_station = 'Obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const user = await register({ nom: form.nom, email: form.email, password: form.password, nom_station: form.nom_station })
      toast.success(`Bienvenue sur Fuelo, ${user.nom} !`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur lors de la création du compte')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  const btnPrimary = {
    width: '100%', height: 50,
    background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
    border: 'none', borderRadius: theme.radius.md,
    fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold,
    color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: theme.font.family,
    boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
    transition: theme.transition.fast, marginTop: 4,
  }

  const btnSecondary = {
    height: 50, background: 'transparent',
    border: '1.5px solid rgba(96,165,250,0.15)',
    borderRadius: theme.radius.md,
    fontSize: theme.font.size.base, color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer', fontFamily: theme.font.family,
    transition: theme.transition.fast,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh', fontFamily: theme.font.family }}>

      {/* GAUCHE */}
      <div style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 60%, #0A1628 100%)', padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', top: -150, left: -150, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(96,165,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

  <FueloLogo size={36} forceTextColor="#fff" />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
            {AVANTAGES.map(({ emoji, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: 'rgba(37,99,235,0.12)', border: '0.5px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {emoji}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: '-0.8px' }}>
            Rejoignez les<br />
            <span style={{ color: BLUE_SOFT }}>200+ stations</span><br />
            qui utilisent Fuelo
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>14 jours gratuits. Sans engagement. Sans carte bancaire.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 2 }}>
          {[['200+', 'Stations'], ['14j', 'Gratuit'], ['0', 'Engagement']].map(([n, l]) => (
            <div key={l} style={{ borderTop: '1px solid rgba(96,165,250,0.2)', paddingTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: BLUE_SOFT, fontFamily: theme.font.mono }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DROITE */}
      <div style={{ background: '#0B1A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px', borderLeft: '0.5px solid rgba(96,165,250,0.08)' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {STEPS.map((label, i) => {
              const num = i + 1; const done = step > num; const active = step === num
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#10B981' : active ? BLUE : 'transparent', border: `1.5px solid ${done ? '#10B981' : active ? BLUE : 'rgba(96,165,250,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: done || active ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'all 0.3s' }}>
                      {done ? '✓' : num}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#F1F5F9' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{label}</div>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: step > num ? '#10B981' : 'rgba(96,165,250,0.15)', margin: '0 8px', marginBottom: 16, transition: 'background 0.3s' }} />}
                </div>
              )
            })}
          </div>

          {/* ETAPE 1 */}
          {step === 1 && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: BLUE_SOFT, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape 1 sur 3</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 4 }}>Créez votre compte</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>14 jours gratuits — sans carte bancaire</p>

              <Field label="Votre nom complet" value={form.nom} onChange={set('nom')} placeholder="Mamadou Diallo" error={errors.nom} />
              <Field label="Adresse email" type="email" value={form.email} onChange={set('email')} placeholder="vous@mastation.com" error={errors.email}
                suffix={emailValid && form.email ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> : null}
              />

              <div style={{ marginBottom: 22 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 7 }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)} placeholder="Minimum 6 caractères"
                    onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)' }}
                    onBlur={e  => { e.target.style.borderColor = errors.password ? '#EF4444' : 'rgba(96,165,250,0.15)'; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 48, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${errors.password ? '#EF4444' : 'rgba(96,165,250,0.15)'}`, borderRadius: theme.radius.md, padding: '0 44px 0 16px', fontSize: theme.font.size.base, color: '#F1F5F9', fontFamily: theme.font.family, outline: 'none', transition: theme.transition.normal }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: theme.font.size.xs, color: '#EF4444', marginTop: 4 }}>{errors.password}</div>}
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />)}
                    </div>
                    <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 600 }}>{STRENGTH_LABEL[strength]}</div>
                  </div>
                )}
              </div>

              <button onClick={nextStep} style={{ ...btnPrimary, marginBottom: 16 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)' }}
              >
                Continuer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>ou</span>
                <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
              </div>

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
                Déjà un compte ?{' '}
                <Link to="/login" style={{ color: BLUE_SOFT, fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
              </div>
            </div>
          )}

          {/* ETAPE 2 */}
          {step === 2 && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape 2 sur 3</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 4 }}>Votre station</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>Ces infos peuvent être modifiées plus tard</p>
              <Field label="Nom de la station" value={form.nom_station} onChange={set('nom_station')} placeholder="Ex: Station Almamya" error={errors.nom_station} />
              <Field label="Ville" value={form.ville} onChange={set('ville')} placeholder="Conakry" />
              <Field label="Pays"  value={form.pays}  onChange={set('pays')}  placeholder="Guinée" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <button onClick={() => setStep(1)} style={btnSecondary}>Retour</button>
                <button onClick={nextStep} style={{ ...btnPrimary, marginTop: 0 }}>
                  Continuer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* ETAPE 3 */}
          {step === 3 && (
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape 3 sur 3</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 4 }}>Tout est prêt !</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 22 }}>Vérifiez avant de créer votre compte</p>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(96,165,250,0.12)', borderRadius: theme.radius.lg, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Votre compte</div>
                {[['Nom', form.nom], ['Email', form.email], ['Mot de passe', '••••••••']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid rgba(96,165,250,0.08)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(96,165,250,0.12)', borderRadius: theme.radius.lg, padding: '16px 18px', marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BLUE_SOFT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Votre station</div>
                {[['Nom', form.nom_station], ['Ville', form.ville], ['Pays', form.pays]].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid rgba(96,165,250,0.08)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9' }}>{val || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => setStep(2)} style={btnSecondary}>Modifier</button>
                <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, marginTop: 0, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>

              <p style={{ marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6 }}>
                En créant un compte vous acceptez nos{' '}
                <span style={{ color: BLUE_SOFT, cursor: 'pointer' }}>Conditions d'utilisation</span>
              </p>
            </div>
          )}
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