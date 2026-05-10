import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

// ── Logo ─────────────────────────────────────────────
const FueloLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 38, height: 38, background: '#F59E0B', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
      </svg>
    </div>
    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
      <span style={{ color: '#fff' }}>fuel</span>
      <span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

// ── Field — DEHORS du composant Register ─────────────
// C'était l'erreur : Field était défini DANS Register()
// Il doit être défini EN DEHORS pour éviter le re-render
const Field = ({ label, type = 'text', value, onChange, placeholder, suffix, borderColor, inputBg, textColor, textSub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', height: 48, background: inputBg, border: `1.5px solid ${borderColor}`, borderRadius: 11, padding: suffix ? '0 48px 0 16px' : '0 16px', fontSize: 14, color: textColor, fontFamily: 'inherit', outline: 'none', transition: 'all 0.25s' }}
        onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
        onBlur={e => { e.target.style.borderColor = borderColor; e.target.style.boxShadow = 'none' }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  </div>
)

// ── Calcul force mot de passe ─────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return 0
  if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 3
  if (pwd.length >= 8) return 2
  if (pwd.length >= 4) return 1
  return 0
}
const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981']
const strengthLabels = ['', 'Faible', 'Moyen', 'Fort']
const STEPS = ['Votre compte', 'Votre station', 'Confirmation']

const AVANTAGES = [
  { icon: '⚡', title: 'Démarrage en 2 minutes', desc: 'Inscription simple, pas de carte bancaire requise' },
  { icon: '📊', title: 'Dashboard en temps réel', desc: 'Stock, ventes et alertes accessibles partout' },
  { icon: '🔒', title: 'Données sécurisées', desc: 'Chiffrement SSL, vos données vous appartiennent' },
  { icon: '🌍', title: "Fait pour l'Afrique", desc: 'Conçu pour les stations africaines, évolutif mondialement' },
]

// ══════════════════════════════════════════════════════
export default function Register() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    nom: '', email: '', password: '',
    nom_station: '', adresse: '', ville: 'Conakry', pays: 'Guinée',
  })

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const strength = getStrength(form.password)
  const emailValid = form.email.includes('@') && form.email.includes('.')

  const t = {
    bg:        isDark ? '#0A0F1E' : '#F0F4F8',
    left:      isDark ? 'linear-gradient(135deg,#0D1528 0%,#0F172A 50%,#0A1020 100%)' : 'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',
    right:     isDark ? '#0F172A' : '#FFFFFF',
    border:    isDark ? '#1E2D42' : '#E2E8F0',
    text:      isDark ? '#F1F5F9' : '#0F172A',
    textSub:   isDark ? '#64748B' : '#64748B',
    textMuted: isDark ? '#334155' : '#CBD5E1',
    card:      isDark ? '#141D2E' : '#F8FAFC',
    inputBg:   isDark ? '#0A0F1E' : '#F8FAFC',
  }

  const validateStep1 = () => {
    if (!form.nom.trim()) { toast.error('Le nom est obligatoire'); return false }
    if (!emailValid) { toast.error('Email invalide'); return false }
    if (form.password.length < 6) { toast.error('Mot de passe minimum 6 caractères'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.nom_station.trim()) { toast.error('Le nom de la station est obligatoire'); return false }
    return true
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        nom: form.nom,
        email: form.email,
        password: form.password,
        nom_station: form.nom_station,
      })
      localStorage.setItem('fuelo_token', res.data.token)
      localStorage.setItem('fuelo_user', JSON.stringify(res.data.user))
      localStorage.setItem('fuelo_station', res.data.station_id)
      toast.success(`Bienvenue sur Fuelo, ${res.data.user.nom} ! ⛽`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur création du compte')
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  // Props communes pour Field
  const fp = { borderColor: t.border, inputBg: t.inputBg, textColor: t.text, textSub: t.textSub }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── GAUCHE ─────────────────────────────── */}
      <div style={{ background: t.left, padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', top: -80, left: -80, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 70%)', bottom: 0, right: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.025) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <FueloLogo />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            {AVANTAGES.map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '0.5px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 10, letterSpacing: '-0.8px' }}>
            Rejoignez les<br />
            <span style={{ color: '#F59E0B' }}>200+ stations</span><br />
            qui utilisent Fuelo
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
            14 jours gratuits. Sans engagement. Sans carte bancaire.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 2 }}>
          {[['200+', 'Stations'], ['14j', 'Gratuit'], ['0', 'Engagement']].map(([n, l]) => (
            <div key={l} style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F59E0B', letterSpacing: '-0.5px', fontFamily: 'monospace' }}>{n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DROITE ─────────────────────────────── */}
      <div style={{ background: t.right, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 36px', position: 'relative', borderLeft: `0.5px solid ${t.border}`, transition: 'background 0.3s' }}>

        {/* Toggle thème */}
        <button
          onClick={() => setIsDark(!isDark)}
          style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: 10, background: t.card, border: `0.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textSub }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isDark
              ? <circle cx="12" cy="12" r="5" />
              : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            }
          </svg>
        </button>

        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
            {STEPS.map((s, i) => {
              const num = i + 1
              const done = step > num
              const active = step === num
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? '#10B981' : active ? '#F59E0B' : t.card, border: `1.5px solid ${done ? '#10B981' : active ? '#F59E0B' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: done || active ? '#0F172A' : t.textMuted, transition: 'all 0.3s' }}>
                      {done ? '✓' : num}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? t.text : t.textMuted, whiteSpace: 'nowrap' }}>{s}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 1, background: step > num ? '#10B981' : t.border, margin: '0 8px', marginBottom: 16, transition: 'background 0.3s' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Étape 1 sur 3</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>Créez votre compte</div>
              <div style={{ fontSize: 13, color: t.textSub, marginBottom: 24 }}>14 jours gratuits — sans carte bancaire</div>

              <Field
                label="Votre nom complet"
                value={form.nom}
                onChange={v => setField('nom', v)}
                placeholder="Mamadou Diallo"
                {...fp}
              />

              <Field
                label="Adresse email"
                type="email"
                value={form.email}
                onChange={v => setField('email', v)}
                placeholder="vous@mastation.com"
                suffix={emailValid && form.email
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  : null
                }
                {...fp}
              />

              {/* Mot de passe — géré manuellement car bouton œil */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setField('password', e.target.value)}
                    placeholder="Minimum 6 caractères"
                    style={{ width: '100%', height: 48, background: t.inputBg, border: `1.5px solid ${t.border}`, borderRadius: 11, padding: '0 44px 0 16px', fontSize: 14, color: t.text, fontFamily: 'inherit', outline: 'none', transition: 'all 0.25s' }}
                    onFocus={e => { e.target.style.borderColor = '#F59E0B'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = t.border; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, display: 'flex', alignItems: 'center' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : t.border, transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: strengthColors[strength], fontWeight: 600 }}>
                      {strengthLabels[strength]}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={nextStep}
                style={{ width: '100%', height: 50, background: '#F59E0B', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(245,158,11,0.25)', marginBottom: 18 }}
              >
                Continuer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: t.textSub }}>
                Déjà un compte ?{' '}
                <span onClick={() => navigate('/login')} style={{ color: '#F59E0B', fontWeight: 600, cursor: 'pointer' }}>
                  Se connecter
                </span>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Étape 2 sur 3</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>Votre station</div>
              <div style={{ fontSize: 13, color: t.textSub, marginBottom: 24 }}>Ces infos peuvent être modifiées plus tard</div>

              <Field label="Nom de la station"    value={form.nom_station} onChange={v => setField('nom_station', v)} placeholder="Ex: Station Almamya"        {...fp} />
              <Field label="Adresse (optionnel)"  value={form.adresse}     onChange={v => setField('adresse', v)}     placeholder="Ex: Rue KA-020, Kaloum"     {...fp} />
              <Field label="Ville"                value={form.ville}       onChange={v => setField('ville', v)}       placeholder="Conakry"                     {...fp} />
              <Field label="Pays"                 value={form.pays}        onChange={v => setField('pays', v)}        placeholder="Guinée"                      {...fp} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ height: 50, background: 'transparent', border: `1.5px solid ${t.border}`, borderRadius: 11, fontSize: 14, fontWeight: 500, color: t.textSub, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Retour
                </button>
                <button
                  onClick={nextStep}
                  style={{ height: 50, background: '#F59E0B', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                >
                  Continuer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Étape 3 sur 3</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: '-0.5px', marginBottom: 4 }}>Tout est prêt !</div>
              <div style={{ fontSize: 13, color: t.textSub, marginBottom: 24 }}>Vérifiez vos informations avant de créer le compte</div>

              {/* Résumé compte */}
              <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Votre compte</div>
                {[['Nom', form.nom], ['Email', form.email], ['Mot de passe', '••••••••']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid ${t.border}` }}>
                    <span style={{ fontSize: 12, color: t.textSub }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Résumé station */}
              <div style={{ background: t.card, border: `0.5px solid ${t.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Votre station</div>
                {[['Nom', form.nom_station], ['Ville', form.ville], ['Pays', form.pays]].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid ${t.border}` }}>
                    <span style={{ fontSize: 12, color: t.textSub }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{val || '—'}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ height: 50, background: 'transparent', border: `1.5px solid ${t.border}`, borderRadius: 11, fontSize: 14, fontWeight: 500, color: t.textSub, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Modifier
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ height: 50, background: loading ? '#D97706' : '#F59E0B', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, color: '#0F172A', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                >
                  {loading
                    ? <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  }
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>

              <div style={{ marginTop: 20, fontSize: 11, color: t.textMuted, textAlign: 'center', lineHeight: 1.6 }}>
                En créant un compte vous acceptez nos{' '}
                <span style={{ color: '#F59E0B' }}>Conditions d'utilisation</span>
                {' '}et notre{' '}
                <span style={{ color: '#F59E0B' }}>Politique de confidentialité</span>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}