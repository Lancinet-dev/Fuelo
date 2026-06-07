// ================================================
// FUELO — Page Abonnements (Orange Money)
// ================================================

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api   from '../../services/api'
import toast from 'react-hot-toast'
import { useTheme }            from '../../context/ThemeContext'
import { usePlan, PLAN_COLORS } from '../../hooks/usePlan'
import theme from '../../config/theme'

// ── Features alignées sur checkPlan.js ───────────
// starter  : ventes, stock, alertes
// pro      : + services (pompiste anti-fraude), exports, rapports
// enterprise : + trajets, citernes, logistique (logisticien + chauffeur)
const FEATURES = [
  // ─── Disponible sur tous les plans ───
  { label: 'Ventes & caisse',                 starter: true,  pro: true,  enterprise: true,  section: 'base' },
  { label: 'Gestion du stock',                starter: true,  pro: true,  enterprise: true,  section: 'base' },
  { label: 'Alertes stock faible',            starter: true,  pro: true,  enterprise: true,  section: 'base' },
  { label: 'Dashboard & statistiques',        starter: true,  pro: true,  enterprise: true,  section: 'base' },
  // ─── Pro et plus ───
  { label: 'Interface pompiste dédiée',       starter: false, pro: true,  enterprise: true,  section: 'pro'  },
  { label: 'Anti-fraude pompistes (photos)',  starter: false, pro: true,  enterprise: true,  section: 'pro'  },
  { label: 'Exports PDF & Excel',             starter: false, pro: true,  enterprise: true,  section: 'pro'  },
  { label: 'Rapports automatiques mensuels',  starter: false, pro: true,  enterprise: true,  section: 'pro'  },
  { label: 'Support prioritaire',             starter: false, pro: true,  enterprise: true,  section: 'pro'  },
  // ─── Enterprise uniquement (transport + logistique) ───
  { label: 'Rôle logisticien & chauffeur GPS',starter: false, pro: false, enterprise: true,  section: 'ent'  },
  { label: 'GPS citernes — trajets temps réel',starter: false,pro: false, enterprise: true,  section: 'ent'  },
  { label: 'Gestion des citernes',            starter: false, pro: false, enterprise: true,  section: 'ent'  },
  { label: 'Alertes transport (fraude, arrêt)',starter: false,pro: false, enterprise: true,  section: 'ent'  },
  { label: 'QR code anti-vol citernes',       starter: false, pro: false, enterprise: true,  section: 'ent'  },
  { label: 'Export rapports trajets Excel',   starter: false, pro: false, enterprise: true,  section: 'ent'  },
  { label: 'Multi-stations illimitées',       starter: false, pro: false, enterprise: true,  section: 'ent'  },
  { label: 'Support dédié 24/7',              starter: false, pro: false, enterprise: true,  section: 'ent'  },
]

const PLANS_INFO = {
  starter:    { desc: 'Gérez l\'essentiel de votre station',              highlight: false },
  pro:        { desc: 'Toutes les opérations, anti-fraude inclus',         highlight: true  },
  enterprise: { desc: 'Flottes, citernes, logistique complète',            highlight: false },
}

// ── Icônes ────────────────────────────────────────
function Check({ ok }) {
  if (ok) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="rgba(16,185,129,0.12)" />
      <polyline points="7 12 10.5 15.5 17 9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="rgba(148,163,184,0.08)" />
      <line x1="9" y1="9" x2="15" y2="15" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="9" x2="9" y2="15" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function OmLogo({ size = 24 }) {
  const r1 = size / 2, r2 = size * 0.325, r3 = size * 0.2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={r1} cy={r1} r={r1} fill="#FF6B00" />
      <circle cx={r1} cy={r1} r={r2} fill="#fff" />
      <circle cx={r1} cy={r1} r={r3} fill="#FF6B00" />
    </svg>
  )
}

function Spinner({ color = '#fff' }) {
  return (
    <div style={{
      width: 16, height: 16, flexShrink: 0,
      border: `2px solid ${color}40`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

// ── Modal paiement Orange Money ───────────────────
function ModalPaiement({ planKey, planLabel, prix, prixGnf, onClose, onConfirm, loading, palette, isDark }) {
  const [phone, setPhone] = useState('')
  const digits    = phone.replace(/\D/g, '')
  const canSubmit = digits.length >= 8

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: 24, padding: '36px 32px 32px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.32)',
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <OmLogo size={48} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>
              Passer au plan {planLabel}
            </div>
            <div style={{ fontSize: 13, color: palette.textSub, marginTop: 3 }}>
              <span style={{ fontWeight: 700, color: '#FF6B00' }}>${prix}/mois</span>
              {prixGnf && (
                <span style={{ color: palette.textMuted }}>
                  {' '}· {prixGnf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Méthode sélectionnée */}
        <div style={{
          background: 'rgba(255,107,0,0.08)',
          border: '1.5px solid rgba(255,107,0,0.28)',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
        }}>
          <OmLogo size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>Orange Money</div>
            <div style={{ fontSize: 12, color: palette.textMuted }}>Paiement mobile — Guinée</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FF6B00" />
            <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Numéro */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: palette.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10,
          }}>
            Numéro Orange Money
          </div>
          <input
            type="tel" placeholder="Ex : 620 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            autoFocus
            style={{
              width: '100%', height: 54, boxSizing: 'border-box',
              background: palette.inputBg,
              border: `1.5px solid ${canSubmit ? '#FF6B00' : (palette.inputBorder ?? palette.cardBorder)}`,
              borderRadius: 14, padding: '0 18px',
              fontSize: 22, fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none', letterSpacing: '0.06em',
              transition: 'border-color 0.15s',
            }}
          />
          <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 7, lineHeight: 1.5 }}>
            Vous recevrez une invite USSD pour confirmer le paiement sur votre téléphone.
          </div>
        </div>

        {/* Notice */}
        <div style={{
          background: isDark ? 'rgba(255,107,0,0.06)' : 'rgba(255,107,0,0.04)',
          border: '1px solid rgba(255,107,0,0.18)',
          borderRadius: 12, padding: '11px 14px',
          fontSize: 12, color: isDark ? '#FFA050' : '#CC4400',
          marginBottom: 26, lineHeight: 1.6,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Votre plan est activé automatiquement après confirmation Orange Money.
        </div>

        {/* Boutons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 12 }}>
          <button onClick={onClose} style={{
            height: 50, borderRadius: 14,
            border: `1.5px solid ${palette.cardBorder}`,
            background: 'transparent', color: palette.textSub,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(phone)}
            disabled={!canSubmit || loading}
            style={{
              height: 50, borderRadius: 14, border: 'none',
              background: canSubmit && !loading ? '#FF6B00' : (isDark ? '#2A1505' : '#F3F4F6'),
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canSubmit && !loading ? '0 4px 18px rgba(255,107,0,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {loading && <Spinner />}
            {loading ? 'Envoi...' : 'Payer avec Orange Money →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────
function SkeletonCards({ palette }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 640, background: palette.card,
          borderRadius: 24, border: `1px solid ${palette.cardBorder}`,
          opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

// ── Page principale ───────────────────────────────
export default function AbonnementsPage() {
  const { palette, isDark } = useTheme()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const { plan: planActuel } = usePlan()

  // Retour depuis Orange Money (return_url / cancel_url)
  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      toast.success('Paiement Orange Money confirmé. Activation en cours...', { duration: 8000 })
      queryClient.invalidateQueries({ queryKey: ['abonnement'] })
      setSearchParams({})
    } else if (status === 'cancel') {
      toast('Paiement annulé.', { icon: '↩', duration: 4000 })
      setSearchParams({})
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['abonnement'],
    queryFn:  () => api.get('/abonnements').then(r => r.data),
    staleTime: 60_000,
  })

  const { mutateAsync: souscrire, isPending: loadingSub } = useMutation({
    mutationFn: ({ plan, payment_phone }) =>
      api.post('/abonnements/souscrire', { plan, payment_phone }).then(r => r.data),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['abonnement'] })
      if (d.payment_url) {
        toast.loading('Redirection vers Orange Money...', { duration: 2000 })
        setTimeout(() => { window.location.href = d.payment_url }, 1000)
      } else {
        toast.success(d.message, { duration: 7000 })
        setModal(null)
      }
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur lors de la souscription'),
  })

  const abonnement = data?.abonnement
  const plans      = data?.tous_les_plans ?? []

  return (
    <div style={{ padding: '48px 28px 80px', maxWidth: 1060, margin: '0 auto' }} className="fuelo-abonnements">

      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label}
          prix={modal.prix}   prixGnf={modal.prix_gnf}
          onClose={() => setModal(null)}
          onConfirm={phone => souscrire({ plan: modal.key, payment_phone: phone })}
          loading={loadingSub} palette={palette} isDark={isDark}
        />
      )}

      {/* ── En-tête ─────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isDark ? 'rgba(255,107,0,0.12)' : 'rgba(255,107,0,0.07)',
          border: `1px solid ${isDark ? 'rgba(255,107,0,0.28)' : 'rgba(255,107,0,0.18)'}`,
          borderRadius: 99, padding: '5px 14px 5px 10px',
          fontSize: 12, fontWeight: 700, color: '#FF6B00',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 18,
        }}>
          <OmLogo size={18} />
          Paiement Orange Money — Guinée
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: palette.text,
          letterSpacing: '-0.8px', margin: '0 0 14px', lineHeight: 1.15,
        }}>
          Choisissez votre plan
        </h1>
        <p style={{
          fontSize: 16, color: palette.textSub, margin: '0 auto',
          maxWidth: 480, lineHeight: 1.7,
        }}>
          Commencez avec Starter. Passez à Pro ou Enterprise quand vous êtes prêt.
        </p>

        {/* Badge statut abonnement */}
        {abonnement?.statut === 'en_attente' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20,
            background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 99, padding: '8px 20px', fontSize: 13, color: '#D97706', fontWeight: 600,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            En attente de validation Orange Money
          </div>
        )}
        {abonnement?.statut === 'actif' && abonnement?.expires_at && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20,
            background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 99, padding: '8px 20px', fontSize: 13, color: '#059669', fontWeight: 600,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Plan actif · expire le {new Date(abonnement.expires_at).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      {/* ── Bannière en attente ──────────────────── */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.04)',
          border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: 16, padding: '16px 22px', marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#D97706', fontSize: 14, marginBottom: 3 }}>
              Paiement Orange Money en attente
            </div>
            <div style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.5 }}>
              Plan <strong>{abonnement.plan?.toUpperCase()}</strong> · {abonnement.payment_phone} · Activation automatique après confirmation
            </div>
          </div>
        </div>
      )}

      {/* ── Grille des plans ─────────────────────── */}
      {isLoading ? (
        <SkeletonCards palette={palette} />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(295px, 1fr))',
          gap: 20, alignItems: 'stretch',
        }}>
          {plans.map(plan => {
            const planC    = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
            const info     = PLANS_INFO[plan.key]  ?? PLANS_INFO.starter
            const isActuel = plan.actuel
            const isHigh   = info.highlight

            const cardBg = isHigh
              ? (isDark ? '#0E2042' : '#F0F6FF')
              : palette.card

            const cardBorder = isActuel
              ? planC.border
              : isHigh
                ? (isDark ? 'rgba(59,130,246,0.50)' : 'rgba(37,99,235,0.35)')
                : palette.cardBorder

            return (
              <div key={plan.key} style={{
                background:    cardBg,
                border:        `1.5px solid ${cardBorder}`,
                borderRadius:  24, padding: '28px 26px 26px',
                position:      'relative', display: 'flex', flexDirection: 'column',
                boxShadow:     isHigh
                  ? (isDark ? '0 16px 48px rgba(37,99,235,0.20)' : '0 16px 48px rgba(37,99,235,0.12)')
                  : (isDark ? 'none' : theme.shadow.sm),
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>

                {isHigh && !isActuel && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99, letterSpacing: '0.10em',
                    whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  }}>
                    POPULAIRE
                  </div>
                )}

                {isActuel && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99, letterSpacing: '0.10em',
                    whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  }}>
                    PLAN ACTUEL
                  </div>
                )}

                {/* En-tête plan */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{
                    display: 'inline-block', fontSize: 11, fontWeight: 800, color: planC.border,
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                    background: planC.border + '18', padding: '3px 10px', borderRadius: 6, marginBottom: 10,
                  }}>
                    {plan.label}
                  </div>
                  <div style={{ fontSize: 14, color: palette.textSub, lineHeight: 1.55 }}>
                    {info.desc}
                  </div>
                </div>

                {/* Prix */}
                <div style={{
                  marginBottom: 26, paddingBottom: 22,
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 46, fontWeight: 900, color: palette.text, letterSpacing: '-2px', lineHeight: 1 }}>
                      ${plan.prix}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: palette.textMuted, paddingBottom: 6 }}>
                      /mois
                    </span>
                  </div>
                  {plan.prix_gnf && (
                    <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 5 }}>
                      ≈ {plan.prix_gnf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: palette.textSub, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <line x1="9" y1="12" x2="15" y2="12" /><line x1="12" y1="9" x2="12" y2="15" />
                    </svg>
                    {plan.max_stations} station{plan.max_stations > 1 ? 's' : ''}
                    <span style={{ opacity: 0.3 }}>·</span>
                    {plan.max_employes} employés/station
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
                  {FEATURES.map((f, idx) => {
                    const ok = f[plan.key] === true
                    // Séparateur avant les sections pro et enterprise
                    const showDivider = idx > 0 &&
                      f.section !== FEATURES[idx - 1].section &&
                      f.section !== 'base'
                    return (
                      <div key={f.label}>
                        {showDivider && (
                          <div style={{
                            height: 1,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            margin: '6px 0',
                          }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Check ok={ok} />
                          <span style={{
                            fontSize: 13,
                            fontWeight: ok ? 500 : 400,
                            color: ok ? palette.text : (isDark ? '#3E5470' : '#C5CDD8'),
                            lineHeight: 1.4,
                          }}>
                            {f.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bouton */}
                <button
                  disabled={isActuel}
                  onClick={() => !isActuel && setModal({ key: plan.key, label: plan.label, prix: plan.prix, prix_gnf: plan.prix_gnf })}
                  style={{
                    width: '100%', height: 52, borderRadius: 14, border: 'none',
                    background: isActuel
                      ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
                      : '#FF6B00',
                    color: isActuel ? palette.textMuted : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: isActuel ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: isActuel ? 'none' : '0 4px 18px rgba(255,107,0,0.32)',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  }}
                  onMouseEnter={e => { if (!isActuel) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isActuel ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Plan actuel
                    </>
                  ) : (
                    <>
                      <OmLogo size={18} />
                      Choisir {plan.label}
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tableau comparatif ───────────────────── */}
      {!isLoading && plans.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: palette.text,
            letterSpacing: '-0.3px', marginBottom: 20, textAlign: 'center',
          }}>
            Comparatif complet
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: 20, border: `1px solid ${palette.cardBorder}` }}>
            <div style={{ background: palette.card, borderRadius: 20, overflow: 'hidden', minWidth: 500 }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)',
                padding: '14px 24px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
                borderBottom: `1px solid ${palette.cardBorder}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Fonctionnalité
                </div>
                {plans.map(plan => {
                  const planC = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
                  return (
                    <div key={plan.key} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: planC.border, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {plan.label}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Lignes */}
              {FEATURES.map((f, idx) => {
                const showGroupHeader = idx === 0 ||
                  (f.section !== FEATURES[idx - 1].section)
                const sectionLabel = f.section === 'base' ? null
                  : f.section === 'pro' ? 'PRO ET PLUS'
                  : 'ENTERPRISE UNIQUEMENT'

                return (
                  <div key={f.label}>
                    {showGroupHeader && sectionLabel && (
                      <div style={{
                        padding: '9px 24px 5px',
                        background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',
                        borderTop: `1px solid ${palette.cardBorder}`,
                        borderBottom: `1px solid ${palette.cardBorder}`,
                        fontSize: 10, fontWeight: 800, color: palette.textMuted,
                        letterSpacing: '0.10em', textTransform: 'uppercase',
                      }}>
                        {sectionLabel}
                      </div>
                    )}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr repeat(3, 110px)',
                      padding: '12px 24px',
                      borderBottom: idx < FEATURES.length - 1 ? `1px solid ${palette.cardBorder}` : 'none',
                      background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.010)'),
                    }}>
                      <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{f.label}</div>
                      {plans.map(plan => (
                        <div key={plan.key} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Check ok={f[plan.key] === true} />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <OmLogo size={22} />
          <span style={{ fontSize: 14, fontWeight: 700, color: palette.textSub }}>Orange Money Guinée</span>
        </div>
        <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 2 }}>
          Facturation mensuelle · Sans engagement · Activation automatique · Sécurisé par Orange Money
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.2; } }
        @media (max-width: 768px) {
          .fuelo-abonnements { padding: 24px 14px 56px !important; }
          .fuelo-abonnements h1 { font-size: 26px !important; }
        }
      `}</style>
    </div>
  )
}
