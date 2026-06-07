import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import FueloLogo from '../../components/FueloLogo'

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
const SUB    = 'rgba(255,255,255,0.35)'
const MUT    = 'rgba(255,255,255,0.2)'

const DOTS = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  color: i % 5 === 0 ? ORANGE : i % 3 === 0 ? SOFT : BLUE,
  dur: 12 + Math.random() * 18, delay: Math.random() * 8,
}))

function getStrength(pwd) {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const STRENGTH_COLOR = ['', RED, ORANGE, GREEN]
const STRENGTH_LABEL = ['', 'Faible', 'Moyen', 'Fort']

const STEPS = ['Votre compte', 'Votre station', 'Confirmation']

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25 } }),
}

function Field({ label, type = 'text', value, onChange, placeholder, error, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={e => { setFocused(true); e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
          onBlur={e  => { setFocused(false); e.target.style.borderColor = error ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
          style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${error ? RED : 'rgba(96,165,250,0.14)'}`, borderRadius: 12, padding: suffix ? '0 44px 0 16px' : '0 16px', fontSize: 15, color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
        />
        {suffix && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>{suffix}</div>}
      </div>
      {error && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export default function Register() {
  const navigate     = useNavigate()
  const { register } = useAuth()

  const [step,      setStep]    = useState(1)
  const [direction, setDir]     = useState(1)
  const [loading,   setLoading] = useState(false)
  const [showPwd,   setShowPwd] = useState(false)
  const [errors,    setErrors]  = useState({})
  const [form, setForm] = useState({ nom: '', email: '', password: '', nom_station: '', ville: 'Conakry', pays: 'Guinée' })

  const set = (key) => (val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })) }
  const emailValid = form.email.includes('@') && form.email.includes('.')
  const strength   = getStrength(form.password)

  const goTo = (n) => { setDir(n > step ? 1 : -1); setStep(n) }

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

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    goTo(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const user = await register({ nom: form.nom, email: form.email, password: form.password, nom_station: form.nom_station })
      toast.success(`Bienvenue sur Fuelo, ${user.nom} !`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur lors de la création du compte')
      goTo(1)
    } finally {
      setLoading(false)
    }
  }

  const btnPrimary = { height: 52, background: `linear-gradient(135deg, ${BLUE}, ${DARK})`, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 24px rgba(37,99,235,0.4)', transition: 'all 0.2s' }
  const btnSecondary = { height: 52, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(96,165,250,0.14)', borderRadius: 12, fontSize: 14, color: SUB, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '20px' }}>

      {/* Fond */}
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '70vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DOTS.map((d, i) => <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, borderRadius: '50%', background: d.color, opacity: 0.28, animation: `floatPt ${d.dur}s ${d.delay}s ease-in-out infinite alternate` }} />)}
      </div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 460, background: 'rgba(8,13,26,0.78)', border: '1px solid rgba(37,99,235,0.18)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', overflow: 'hidden' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <FueloLogo size={80} forceTextColor="#fff" />
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 4 }}>
          {STEPS.map((label, i) => {
            const num = i + 1; const done = step > num; const active = step === num
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <motion.div animate={{ background: done ? GREEN : active ? BLUE : 'transparent', borderColor: done ? GREEN : active ? BLUE : 'rgba(96,165,250,0.2)' }} transition={{ duration: 0.3 }}
                    style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: done || active ? '#fff' : MUT }}>
                    {done
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : num}
                  </motion.div>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? TEXT : MUT, whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <motion.div animate={{ background: step > num ? GREEN : 'rgba(96,165,250,0.12)' }} transition={{ duration: 0.4 }}
                    style={{ flex: 1, height: 2, borderRadius: 1, margin: '0 6px', marginBottom: 16 }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Contenu par étape avec animation */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={step} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">

              {/* ÉTAPE 1 */}
              {step === 1 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: SOFT, animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape 1 / 3</span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 4 }}>Créez votre compte</h1>
                  <p style={{ fontSize: 13, color: SUB, marginBottom: 20 }}>14 jours gratuits — sans carte bancaire</p>

                  <Field label="Votre nom complet" value={form.nom} onChange={set('nom')} placeholder="Mamadou Diallo" error={errors.nom} />
                  <Field label="Adresse email" type="email" value={form.email} onChange={set('email')} placeholder="vous@mastation.com" error={errors.email}
                    suffix={emailValid && form.email ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : null}
                  />

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: MUT, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Mot de passe</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password')(e.target.value)} placeholder="Minimum 6 caractères"
                        onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                        onBlur={e  => { e.target.style.borderColor = errors.password ? RED : 'rgba(96,165,250,0.14)'; e.target.style.boxShadow = 'none' }}
                        style={{ width: '100%', height: 50, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${errors.password ? RED : 'rgba(96,165,250,0.14)'}`, borderRadius: 12, padding: '0 44px 0 16px', fontSize: 15, color: TEXT, fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: MUT, display: 'flex', alignItems: 'center', padding: 4 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPwd ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                        </svg>
                      </button>
                    </div>
                    {errors.password && <div style={{ fontSize: 12, color: RED, marginTop: 4 }}>{errors.password}</div>}
                    {form.password && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />)}
                        </div>
                        <div style={{ fontSize: 10, color: STRENGTH_COLOR[strength], fontWeight: 700 }}>{STRENGTH_LABEL[strength]}</div>
                      </div>
                    )}
                  </div>

                  <button onClick={next} style={{ ...btnPrimary, width: '100%', marginBottom: 14 }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.55)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.4)' }}>
                    Continuer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
                    <span style={{ fontSize: 11, color: MUT }}>ou</span>
                    <div style={{ flex: 1, height: '0.5px', background: 'rgba(96,165,250,0.1)' }} />
                  </div>

                  <a href={GOOGLE_URL}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 48, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(96,165,250,0.12)', borderRadius: 12, color: TEXT, fontSize: 14, fontFamily: 'inherit', textDecoration: 'none', marginBottom: 16, transition: 'all 0.2s', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.background = 'rgba(37,99,235,0.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continuer avec Google
                  </a>

                  <div style={{ textAlign: 'center', fontSize: 13, color: MUT }}>
                    Déjà un compte ?{' '}
                    <Link to="/login" style={{ color: SOFT, fontWeight: 700, textDecoration: 'none' }}>Se connecter</Link>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Étape 2 / 3</span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 4 }}>Votre station</h1>
                  <p style={{ fontSize: 13, color: SUB, marginBottom: 20 }}>Ces informations peuvent être modifiées plus tard</p>

                  <Field label="Nom de la station" value={form.nom_station} onChange={set('nom_station')} placeholder="Ex: Station Almamya" error={errors.nom_station} />
                  <Field label="Ville" value={form.ville} onChange={set('ville')} placeholder="Conakry" />
                  <Field label="Pays"  value={form.pays}  onChange={set('pays')}  placeholder="Guinée" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                    <button onClick={() => goTo(1)} style={{ ...btnSecondary }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.color = TEXT }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.14)'; e.currentTarget.style.color = SUB }}>
                      Retour
                    </button>
                    <button onClick={next} style={{ ...btnPrimary }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.55)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.4)' }}>
                      Continuer
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 */}
              {step === 3 && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, padding: '4px 14px', marginBottom: 14 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tout est prêt</span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 4 }}>Vérifiez avant de créer</h1>
                  <p style={{ fontSize: 13, color: SUB, marginBottom: 18 }}>Relisez vos informations puis confirmez.</p>

                  {[
                    { title: 'Votre compte', rows: [['Nom', form.nom], ['Email', form.email], ['Mot de passe', '••••••••']] },
                    { title: 'Votre station', rows: [['Station', form.nom_station], ['Ville', form.ville], ['Pays', form.pays]] },
                  ].map(({ title, rows }) => (
                    <div key={title} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(96,165,250,0.1)', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: SOFT, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{title}</div>
                      {rows.map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(96,165,250,0.07)' }}>
                          <span style={{ fontSize: 13, color: MUT }}>{label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10, marginTop: 16 }}>
                    <button onClick={() => goTo(2)} style={{ ...btnSecondary }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)'; e.currentTarget.style.color = TEXT }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.14)'; e.currentTarget.style.color = SUB }}>
                      Modifier
                    </button>
                    <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1 }}>
                      {loading
                        ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      {loading ? 'Création...' : 'Créer mon compte'}
                    </button>
                  </div>

                  <p style={{ marginTop: 14, fontSize: 11, color: MUT, textAlign: 'center', lineHeight: 1.6 }}>
                    En créant un compte vous acceptez nos{' '}
                    <span style={{ color: SOFT, cursor: 'pointer' }}>Conditions d'utilisation</span>
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        @keyframes floatPt { from { transform: translateY(0) scale(1); } to { transform: translateY(-25px) scale(1.2); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin    { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
