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

const FEATURES = [
  { label: 'Ventes & caisse',               starter: true,  pro: true,  enterprise: true  },
  { label: 'Gestion du stock',               starter: true,  pro: true,  enterprise: true  },
  { label: 'Alertes stock faible',           starter: true,  pro: true,  enterprise: true  },
  { label: 'Dashboard & statistiques',       starter: true,  pro: true,  enterprise: true  },
  { label: 'Exports PDF & Excel',            starter: false, pro: true,  enterprise: true  },
  { label: 'Anti-fraude pompistes (photos)', starter: false, pro: true,  enterprise: true  },
  { label: 'GPS citernes (trajet temps réel)',starter: false, pro: true,  enterprise: true  },
  { label: 'Gestion des citernes',           starter: false, pro: true,  enterprise: true  },
  { label: 'Rapports auto mensuels',         starter: false, pro: true,  enterprise: true  },
  { label: 'Support prioritaire',            starter: false, pro: true,  enterprise: true  },
  { label: 'Logisticien & chauffeur GPS',    starter: false, pro: false, enterprise: true  },
  { label: 'Multi-stations illimitées',      starter: false, pro: false, enterprise: true  },
  { label: 'Dashboard superadmin',           starter: false, pro: false, enterprise: true  },
  { label: 'Support dédié 24/7',             starter: false, pro: false, enterprise: true  },
]

const PLANS_INFO = {
  starter:    { desc: 'Pour démarrer et gérer l\'essentiel de votre station', highlight: false },
  pro:        { desc: 'Toutes les fonctionnalités pour maximiser vos ventes',  highlight: true  },
  enterprise: { desc: 'Flottes, multi-stations et opérations complexes',       highlight: false },
}

// ── Icône check / croix ───────────────────────────
function Check({ ok }) {
  if (ok) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="rgba(16,185,129,0.12)" />
      <polyline points="7 12 10.5 15.5 17 9" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill="rgba(148,163,184,0.10)" />
      <line x1="9" y1="9" x2="15" y2="15" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15" y1="9" x2="9" y2="15" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.25)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

// ── Icône Orange Money ────────────────────────────
function OrangeMoneyLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#FF6B00" />
      <circle cx="20" cy="20" r="13" fill="#fff" />
      <circle cx="20" cy="20" r="8"  fill="#FF6B00" />
    </svg>
  )
}

// ── Modal paiement Orange Money ───────────────────
function ModalPaiement({ planKey, planLabel, prix, prixGnf, onClose, onConfirm, loading, palette, isDark }) {
  const [phone, setPhone] = useState('')
  const canSubmit = phone.replace(/\D/g, '').length >= 8

  const handleKey = e => { if (e.key === 'Escape') onClose() }
  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: 24,
        padding: '36px 32px 32px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.30)',
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <OrangeMoneyLogo size={44} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>
              Passer au plan {planLabel}
            </div>
            <div style={{ fontSize: 13, color: palette.textSub, marginTop: 3 }}>
              <span style={{ fontWeight: 700, color: '#FF6B00' }}>${prix}/mois</span>
              {prixGnf ? <span style={{ color: palette.textMuted }}> · {prixGnf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF</span> : null}
            </div>
          </div>
        </div>

        {/* Orange Money sélectionné */}
        <div style={{
          background: 'rgba(255,107,0,0.08)',
          border: '1.5px solid rgba(255,107,0,0.30)',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 22,
        }}>
          <OrangeMoneyLogo size={26} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B00' }}>Orange Money</div>
            <div style={{ fontSize: 12, color: palette.textMuted }}>Paiement mobile sécurisé</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#FF6B00" />
              <polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Numéro */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
            Numéro Orange Money
          </div>
          <input
            type="tel"
            placeholder="Ex : 620 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
            autoFocus
            style={{
              width: '100%', height: 52, boxSizing: 'border-box',
              background: palette.inputBg,
              border: `1.5px solid ${phone.replace(/\D/g, '').length >= 8 ? '#FF6B00' : (palette.inputBorder ?? palette.cardBorder)}`,
              borderRadius: 14, padding: '0 18px',
              fontSize: 20, fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none', letterSpacing: '0.06em',
              transition: 'border-color 0.15s',
            }}
          />
          <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 7 }}>
            Vous recevrez une invite USSD pour confirmer le paiement
          </div>
        </div>

        {/* Avertissement */}
        <div style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.20)',
          borderRadius: 12, padding: '11px 14px',
          fontSize: 12, color: '#D97706', marginBottom: 26, lineHeight: 1.6,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Le plan sera activé automatiquement après confirmation du paiement Orange Money.</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={onClose} style={{
            height: 48, borderRadius: 14,
            border: `1.5px solid ${palette.cardBorder}`,
            background: 'transparent',
            color: palette.textSub,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(phone)}
            disabled={!canSubmit || loading}
            style={{
              height: 48, borderRadius: 14, border: 'none',
              background: canSubmit && !loading ? '#FF6B00' : (isDark ? '#2A1A0A' : '#F3F4F6'),
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canSubmit && !loading ? '0 4px 16px rgba(255,107,0,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {loading && <Spinner />}
            {loading ? 'Envoi...' : 'Payer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCards({ palette }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 580, background: palette.card,
          borderRadius: 24, border: `1px solid ${palette.cardBorder}`,
          opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite',
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

  // Gestion retour Orange Money (return_url / cancel_url)
  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      toast.success('Paiement Orange Money confirmé. Votre plan est en cours d\'activation.', { duration: 8000 })
      queryClient.invalidateQueries({ queryKey: ['abonnement'] })
      setSearchParams({})
    } else if (status === 'cancel') {
      toast.error('Paiement annulé.', { duration: 4000 })
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
      api.post('/abonnements/souscrire', { plan, payment_method: 'orange_money', payment_phone }).then(r => r.data),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['abonnement'] })
      if (d.payment_url) {
        toast.loading('Redirection vers Orange Money...', { duration: 2000 })
        setTimeout(() => { window.location.href = d.payment_url }, 1200)
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
    <div style={{ padding: '48px 28px 72px', maxWidth: 1020, margin: '0 auto' }} className="fuelo-abonnements">

      {/* Modal */}
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix} prixGnf={modal.prix_gnf}
          onClose={() => setModal(null)}
          onConfirm={(phone) => souscrire({ plan: modal.key, payment_phone: phone })}
          loading={loadingSub} palette={palette} isDark={isDark}
        />
      )}

      {/* ── En-tête ─────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: isDark ? 'rgba(255,107,0,0.12)' : 'rgba(255,107,0,0.08)',
          border: `1px solid ${isDark ? 'rgba(255,107,0,0.30)' : 'rgba(255,107,0,0.20)'}`,
          borderRadius: 99, padding: '5px 14px 5px 10px',
          fontSize: 12, fontWeight: 700, color: '#FF6B00',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 18,
        }}>
          <OrangeMoneyLogo size={18} />
          Paiement Orange Money
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: palette.text,
          letterSpacing: '-0.8px', margin: '0 0 14px', lineHeight: 1.15,
        }}>
          Choisissez votre plan
        </h1>
        <p style={{
          fontSize: 16, color: palette.textSub, margin: 0,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7,
        }}>
          Commencez avec Starter. Passez à Pro ou Enterprise quand vous êtes prêt.
        </p>

        {abonnement?.statut === 'en_attente' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20,
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 99, padding: '8px 20px',
            fontSize: 13, color: '#D97706', fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Paiement en attente · activation automatique
          </div>
        )}

        {abonnement?.statut === 'actif' && abonnement?.expires_at && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20,
            background: 'rgba(16,185,129,0.10)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 99, padding: '8px 20px',
            fontSize: 13, color: '#059669', fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Plan actif · expire le {new Date(abonnement.expires_at).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>

      {/* ── Bannière en attente ──────────────────── */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(245,158,11,0.05)',
          border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: 16, padding: '16px 22px', marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
              Plan {abonnement.plan?.toUpperCase()} · {abonnement.payment_phone} · Activation automatique après confirmation
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}>
          {plans.map(plan => {
            const planC   = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
            const info    = PLANS_INFO[plan.key]  ?? PLANS_INFO.starter
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
                borderRadius:  24,
                padding:       '28px 26px 26px',
                position:      'relative',
                boxShadow:     isHigh
                  ? (isDark ? '0 16px 48px rgba(37,99,235,0.20)' : '0 16px 48px rgba(37,99,235,0.12)')
                  : (isDark ? 'none' : theme.shadow.sm),
                display:       'flex',
                flexDirection: 'column',
                transition:    'transform 0.2s, box-shadow 0.2s',
              }}>

                {/* Badge Populaire */}
                {isHigh && !isActuel && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99,
                    letterSpacing: '0.10em', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  }}>
                    POPULAIRE
                  </div>
                )}

                {/* Badge Plan actuel */}
                {isActuel && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99,
                    letterSpacing: '0.10em', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  }}>
                    PLAN ACTUEL
                  </div>
                )}

                {/* En-tête */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{
                    display: 'inline-block',
                    fontSize: 11, fontWeight: 800, color: planC.border,
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                    background: planC.border + '15',
                    padding: '3px 10px', borderRadius: 6, marginBottom: 10,
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
                    <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>
                      ≈ {plan.prix_gnf.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} GNF
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: palette.textSub, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="12" y1="9" x2="12" y2="15" />
                    </svg>
                    {plan.max_stations} station{plan.max_stations > 1 ? 's' : ''}
                    <span style={{ opacity: 0.35 }}>·</span>
                    {plan.max_employes} employés/station
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28, flex: 1 }}>
                  {FEATURES.map(f => {
                    const ok = f[plan.key] === true
                    return (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Check ok={ok} />
                        <span style={{
                          fontSize: 13, fontWeight: ok ? 500 : 400,
                          color: ok ? palette.text : (isDark ? '#4A6480' : '#B0BAC7'),
                          lineHeight: 1.4,
                        }}>
                          {f.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Bouton */}
                <button
                  disabled={isActuel}
                  onClick={() => !isActuel && setModal({ key: plan.key, label: plan.label, prix: plan.prix, prix_gnf: plan.prix_gnf })}
                  style={{
                    width: '100%', height: 50, borderRadius: 14,
                    border: isActuel ? `1.5px solid ${isDark ? '#1E3148' : '#E5E7EB'}` : 'none',
                    background: isActuel
                      ? 'transparent'
                      : isHigh
                        ? 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                        : planC.border,
                    color: isActuel ? palette.textMuted : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: isActuel ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: isActuel ? 'none' : isHigh
                      ? '0 6px 20px rgba(37,99,235,0.35)'
                      : `0 4px 14px ${planC.border}40`,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (!isActuel) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isActuel ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Plan actuel
                    </>
                  ) : (
                    <>
                      <OrangeMoneyLogo size={18} />
                      Choisir {plan.label}
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Table comparatif ────────────────────── */}
      {!isLoading && plans.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px', marginBottom: 20, textAlign: 'center' }}>
            Comparatif détaillé
          </h2>
          <div style={{ overflowX: 'auto', borderRadius: 20, border: `1px solid ${palette.cardBorder}` }}>
            <div style={{ background: palette.card, borderRadius: 20, overflow: 'hidden', minWidth: 480 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr repeat(3, 120px)',
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
                      <div style={{ fontSize: 12, fontWeight: 800, color: planC.border, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {plan.label}
                      </div>
                    </div>
                  )
                })}
              </div>
              {FEATURES.map((f, idx) => (
                <div key={f.label} style={{
                  display: 'grid', gridTemplateColumns: '1fr repeat(3, 120px)',
                  padding: '13px 24px',
                  borderBottom: idx < FEATURES.length - 1 ? `1px solid ${palette.cardBorder}` : 'none',
                  background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)'),
                }}>
                  <div style={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>{f.label}</div>
                  {plans.map(plan => (
                    <div key={plan.key} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Check ok={f[plan.key] === true} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <OrangeMoneyLogo size={22} />
          <span style={{ fontSize: 14, fontWeight: 700, color: palette.textSub }}>Orange Money Guinée</span>
        </div>
        <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.8 }}>
          Facturation mensuelle · Sans engagement · Activation automatique · Sécurisé par Orange Money
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.3; } }
        @media (max-width: 768px) {
          .fuelo-abonnements { padding: 24px 14px 48px !important; }
          .fuelo-abonnements h1 { font-size: 26px !important; }
        }
      `}</style>
    </div>
  )
}
