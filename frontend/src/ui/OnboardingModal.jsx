// ================================================
// FUELO — Onboarding première connexion owner
// ================================================

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api   from '../services/api'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import FueloLogo    from '../components/FueloLogo'
import theme        from '../config/theme'

const TOTAL_STEPS = 5

// ── Barre de progression ─────────────────────────
function ProgressBar({ step }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 99,
          background: i < step
            ? theme.colors.primary
            : i === step
            ? theme.colors.primaryLight
            : 'rgba(37,99,235,0.12)',
          transition: 'background 0.3s ease',
        }} />
      ))}
    </div>
  )
}

// ── Boutons nav ──────────────────────────────────
function NavBtns({ step, totalSteps, onPrev, onNext, onSkip, nextLabel, nextDisabled, loading, palette }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
      {step > 0 && (
        <button onClick={onPrev} style={{
          height: 48, padding: '0 20px',
          borderRadius: theme.radius.md,
          border: `1px solid ${palette.cardBorder}`,
          background: 'transparent', color: palette.textSub,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
        }}>
          ← Retour
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled || loading}
        style={{
          flex: 1, height: 48,
          borderRadius: theme.radius.md, border: 'none',
          background: nextDisabled || loading ? palette.hover : theme.colors.primary,
          color: nextDisabled || loading ? palette.textMuted : '#fff',
          cursor: nextDisabled || loading ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: nextDisabled ? 'none' : theme.shadow.primary,
          transition: theme.transition.normal,
        }}>
        {loading && (
          <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        )}
        {loading ? 'Sauvegarde...' : nextLabel ?? 'Continuer →'}
      </button>
      {step < totalSteps - 1 && (
        <button onClick={onSkip} style={{
          height: 48, padding: '0 16px',
          borderRadius: theme.radius.md,
          border: `1px solid ${palette.cardBorder}`,
          background: 'transparent', color: palette.textMuted,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
        }}>
          Passer
        </button>
      )}
    </div>
  )
}

// ── En-tête d'étape réutilisable ─────────────────
function StepHeader({ icon, title, subtitle, palette }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: theme.colors.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: palette.textSub, marginTop: 3 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// ÉTAPES
// ══════════════════════════════════════════════

// Étape 0 — Bienvenue
function StepBienvenue({ nom, palette }) {
  const steps = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/>
          <path d="M3 11h12"/>
          <path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/>
          <path d="M6 7h4"/>
        </svg>
      ),
      label: 'Informations de votre station',
      num: '01',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
      label: 'Prix des carburants',
      num: '02',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      label: 'Votre premier employé (optionnel)',
      num: '03',
    },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 20 }}>
        <FueloLogo size={64} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: palette.text, marginBottom: 10, letterSpacing: '-0.5px' }}>
        Bienvenue, {nom?.split(' ')[0]}
      </div>
      <div style={{ fontSize: 15, color: palette.textSub, lineHeight: 1.7, marginBottom: 28 }}>
        Fuelo va vous aider à gérer vos stations-service depuis votre téléphone.
        Configurons ensemble votre première station en{' '}
        <strong style={{ color: palette.text }}>3 minutes</strong>.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
        {steps.map(({ icon, label, num }) => (
          <div key={num} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 16px',
            background: theme.colors.primaryLight,
            borderRadius: theme.radius.md,
          }}>
            <div style={{ flexShrink: 0 }}>{icon}</div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: theme.colors.primary }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(37,99,235,0.35)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{num}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Étape 1 — Infos station
function StepStation({ data, onChange, palette }) {
  const field = (label, key, placeholder, hint) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <input
        value={data[key] ?? ''}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', height: 46,
          background: palette.inputBg,
          border: `1.5px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.md,
          padding: '0 14px', fontSize: 14,
          color: palette.text, fontFamily: 'inherit', outline: 'none',
        }}
      />
      {hint && <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 3 }}>{hint}</div>}
    </div>
  )

  return (
    <div>
      <StepHeader
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
            <path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/>
            <path d="M3 11h12"/>
            <path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/>
            <path d="M6 7h4"/>
          </svg>
        }
        title="Votre station"
        subtitle="Ces informations apparaîtront sur vos rapports"
        palette={palette}
      />
      {field('Nom de la station *', 'nom', 'Ex: Station Total Almamya')}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>{field('Ville', 'ville', 'Conakry')}</div>
        <div>{field('Pays', 'pays', 'Guinée')}</div>
      </div>
      {field('Adresse', 'adresse', 'Ex: Rue KA-020, Kaloum', 'Optionnel')}
    </div>
  )
}

// Étape 2 — Prix carburants
function StepPrix({ data, onChange, palette }) {
  const previewEss = (parseInt(data.prix_essence) || 0) * 50
  const previewGas = (parseInt(data.prix_gasoil)  || 0) * 50
  const numFmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const fuelInputs = [
    {
      key: 'prix_essence',
      label: 'Essence (GNF / litre)',
      placeholder: '10000',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/>
          <path d="M3 11h12"/>
        </svg>
      ),
    },
    {
      key: 'prix_gasoil',
      label: 'Gasoil (GNF / litre)',
      placeholder: '9000',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <ellipse cx="12" cy="12" rx="10" ry="7"/>
          <line x1="12" y1="5" x2="12" y2="19"/>
        </svg>
      ),
    },
  ]

  return (
    <div>
      <StepHeader
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        }
        title="Prix des carburants"
        subtitle="Le pompiste utilisera ces prix pour calculer automatiquement"
        palette={palette}
      />

      {fuelInputs.map(({ key, label, placeholder, icon }) => (
        <div key={key} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            <span style={{ color: palette.textMuted }}>{icon}</span>
            {label}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="number" value={data[key] ?? ''}
              onChange={e => onChange(key, e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', height: 50,
                background: palette.inputBg,
                border: `1.5px solid ${palette.cardBorder}`,
                borderRadius: theme.radius.md,
                padding: '0 70px 0 14px',
                fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                color: palette.text, outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: palette.textMuted, pointerEvents: 'none' }}>GNF/L</span>
          </div>
        </div>
      ))}

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        background: palette.hover, borderRadius: theme.radius.md, padding: 14, marginTop: 4,
      }}>
        {[
          { label: '50 L essence =', val: previewEss },
          { label: '50 L gasoil =',  val: previewGas  },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.primary, fontFamily: 'monospace' }}>
              {numFmt(val)} GNF
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Étape 3 — Premier employé (optionnel)
function StepEmploye({ data, onChange, palette }) {
  const roles = [
    {
      val: 'gerant',
      label: 'Gérant',
      desc: 'Gère les ventes et le stock',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        </svg>
      ),
    },
    {
      val: 'pompiste',
      label: 'Pompiste',
      desc: 'Enregistre les ventes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/>
          <path d="M3 11h12"/>
          <path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/>
        </svg>
      ),
    },
  ]

  return (
    <div>
      <StepHeader
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        }
        title="Premier employé"
        subtitle="Créez un compte pour votre gérant ou pompiste — optionnel"
        palette={palette}
      />

      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)',
        borderRadius: theme.radius.md, padding: '10px 14px',
        marginBottom: 18, lineHeight: 1.5,
      }}>
        <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ fontSize: 12, color: '#B45309' }}>
          L'employé recevra ses identifiants et pourra se connecter immédiatement.
        </span>
      </div>

      {[
        { key: 'nom',      label: 'Nom complet',  type: 'text',     placeholder: 'Mamadou Diallo' },
        { key: 'email',    label: 'Email',         type: 'email',    placeholder: 'mamadou@station.com' },
        { key: 'password', label: 'Mot de passe',  type: 'password', placeholder: 'Minimum 6 caractères' },
      ].map(({ key, label, type, placeholder }) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
          <input
            type={type}
            value={data[key] ?? ''}
            onChange={e => onChange(key, e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%', height: 46,
              background: palette.inputBg,
              border: `1.5px solid ${palette.cardBorder}`,
              borderRadius: theme.radius.md,
              padding: '0 14px', fontSize: 14,
              color: palette.text, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
      ))}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rôle</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {roles.map(({ val, label, desc, icon }) => {
            const selected = data.role === val
            return (
              <button key={val} type="button" onClick={() => onChange('role', val)}
                style={{
                  padding: '12px 14px', textAlign: 'left',
                  borderRadius: theme.radius.md,
                  border: `2px solid ${selected ? theme.colors.primary : palette.cardBorder}`,
                  background: selected ? theme.colors.primaryLight : palette.inputBg,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: theme.transition.fast,
                }}>
                <div style={{ color: selected ? theme.colors.primary : palette.textSub, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? theme.colors.primary : palette.text }}>{label}</div>
                <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>{desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Étape 4 — Terminé
function StepDone({ palette }) {
  const items = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      label: 'Voir le dashboard',
      desc: 'Ventes du jour, stock, alertes en temps réel',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
      label: 'Ajouter des employés',
      desc: 'Gérants et pompistes depuis la page Employés',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="2" width="14" height="20" rx="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      ),
      label: "Partager l'accès pompiste",
      desc: 'Envoyez le lien /pompiste à vos équipes',
    },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%',
        background: theme.colors.successLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: `0 0 0 16px rgba(16,185,129,0.08)`,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2" strokeLinecap="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: palette.text, marginBottom: 10, letterSpacing: '-0.5px' }}>
        Votre station est prête
      </div>
      <div style={{ fontSize: 14, color: palette.textSub, lineHeight: 1.7, marginBottom: 24 }}>
        Fuelo est configuré. Voici ce que vous pouvez faire maintenant :
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        {items.map(({ icon, label, desc }) => (
          <div key={label} style={{
            display: 'flex', gap: 14, padding: '14px 16px',
            background: theme.colors.primaryLight,
            borderRadius: theme.radius.md,
            alignItems: 'flex-start',
          }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.primary }}>{label}</div>
              <div style={{ fontSize: 12, color: palette.textSub, marginTop: 3 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════
export default function OnboardingModal({ user, onDone }) {
  const { palette, isDark } = useTheme()
  const [step, setStep] = useState(0)

  const [station, setStation] = useState({ nom: '', ville: 'Conakry', pays: 'Guinée', adresse: '' })
  const [prix,    setPrix]    = useState({ prix_essence: '', prix_gasoil: '' })
  const [employe, setEmploye] = useState({ nom: '', email: '', password: '', role: 'gerant' })

  const { mutateAsync: saveStation, isPending: savingStation } = useMutation({
    mutationFn: (data) => api.put('/station', data).then(r => r.data),
    onError: () => toast.error('Erreur sauvegarde station'),
  })

  const { mutateAsync: creerEmploye, isPending: creatingEmploye } = useMutation({
    mutationFn: (data) => api.post('/employes', data).then(r => r.data),
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur création employé'),
  })

  const loading = savingStation || creatingEmploye

  const handleNext = async () => {
    if (step === 1) {
      if (!station.nom.trim()) return toast.error('Le nom de la station est obligatoire')
      try { await saveStation({ ...station }) } catch { return }
    }

    if (step === 2) {
      const ess = parseInt(prix.prix_essence)
      const gas = parseInt(prix.prix_gasoil)
      if (ess > 0 && gas > 0) {
        try { await saveStation({ prix_essence: ess, prix_gasoil: gas }) } catch { return }
      }
    }

    if (step === 3) {
      const { nom, email, password, role } = employe
      if (nom.trim() && email.trim() && password.length >= 6) {
        try {
          await creerEmploye({ nom: nom.trim(), email: email.trim().toLowerCase(), password, role })
          toast.success(`${nom} ajouté avec succès`)
        } catch { /* erreur déjà gérée par onError */ }
      }
    }

    if (step === TOTAL_STEPS - 1) {
      localStorage.setItem(`fuelo_onboarding_${user.id}`, 'done')
      onDone()
      return
    }

    setStep(s => s + 1)
  }

  const handleSkip = () => {
    if (step === TOTAL_STEPS - 1) {
      localStorage.setItem(`fuelo_onboarding_${user.id}`, 'done')
      onDone()
    } else {
      setStep(s => s + 1)
    }
  }

  const nextDisabled = step === 1 && !station.nom.trim()

  const nextLabel = step === TOTAL_STEPS - 1
    ? 'Accéder à mon dashboard →'
    : step === 3 && !employe.nom.trim()
    ? 'Passer cette étape →'
    : 'Continuer →'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      fontFamily: theme.font.family,
    }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: theme.radius.xl,
        padding: '32px 28px',
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: theme.shadow.lg,
        animation: 'slideUp 0.3s ease',
      }}>
        <ProgressBar step={step} />

        {step === 0 && <StepBienvenue nom={user?.nom} palette={palette} />}
        {step === 1 && <StepStation  data={station} onChange={(k, v) => setStation(p => ({ ...p, [k]: v }))} palette={palette} />}
        {step === 2 && <StepPrix     data={prix}    onChange={(k, v) => setPrix(p => ({ ...p, [k]: v }))}    palette={palette} />}
        {step === 3 && <StepEmploye  data={employe} onChange={(k, v) => setEmploye(p => ({ ...p, [k]: v }))} palette={palette} />}
        {step === 4 && <StepDone palette={palette} />}

        <NavBtns
          step={step} totalSteps={TOTAL_STEPS}
          onPrev={() => setStep(s => s - 1)}
          onNext={handleNext}
          onSkip={handleSkip}
          nextLabel={nextLabel}
          nextDisabled={nextDisabled}
          loading={loading}
          palette={palette}
        />

        {step < TOTAL_STEPS - 1 && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button onClick={() => {
              localStorage.setItem(`fuelo_onboarding_${user.id}`, 'done')
              onDone()
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: palette.textMuted, fontFamily: 'inherit' }}>
              Ignorer et configurer plus tard
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}
