// ================================================
// FUELO — Page Abonnements
// ================================================

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api   from '../../services/api'
import toast from 'react-hot-toast'
import { useTheme }            from '../../context/ThemeContext'
import { usePlan, PLAN_COLORS } from '../../hooks/usePlan'
import theme from '../../config/theme'

const METHODS = [
  { key: 'orange_money', label: 'Orange Money', emoji: '🟠', color: '#FF6B00' },
  { key: 'mtn_money',    label: 'MTN MoMo',     emoji: '🟡', color: '#FFCB00' },
  { key: 'paycard',      label: 'PayCard',       emoji: '💳', color: '#1E40AF' },
  { key: 'kulu',         label: 'Kulu',          emoji: '🔵', color: '#0EA5E9' },
]

const FEATURES = [
  { label: 'Ventes & caisse',         starter: true,  pro: true,  enterprise: true  },
  { label: 'Gestion du stock',         starter: true,  pro: true,  enterprise: true  },
  { label: 'Alertes stock',            starter: true,  pro: true,  enterprise: true  },
  { label: 'Exports PDF & Excel',      starter: false, pro: true,  enterprise: true  },
  { label: 'Anti-fraude pompistes',    starter: false, pro: true,  enterprise: true  },
  { label: 'GPS citernes',             starter: false, pro: true,  enterprise: true  },
  { label: 'Gestion citernes',         starter: false, pro: true,  enterprise: true  },
  { label: 'Interface logisticien',    starter: false, pro: false, enterprise: true  },
  { label: 'Dashboard superadmin',     starter: false, pro: false, enterprise: true  },
  { label: 'Support prioritaire',      starter: false, pro: true,  enterprise: true  },
]

const PLANS_INFO = {
  starter:    { desc: 'Pour démarrer et gérer l\'essentiel', highlight: false },
  pro:        { desc: 'Toutes les fonctionnalités pour votre station', highlight: true },
  enterprise: { desc: 'Pour les flottes et opérations complexes', highlight: false },
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

// ── Spinner ───────────────────────────────────────
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

// ── Modal paiement ────────────────────────────────
function ModalPaiement({ planKey, planLabel, prix, onClose, onConfirm, loading, palette, isDark }) {
  const [method, setMethod] = useState('')
  const [phone,  setPhone]  = useState('')
  const canSubmit = method && phone.length >= 8

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: 24,
        padding: '36px 32px 32px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.30)',
      }}>
        {/* Titre */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: palette.text, letterSpacing: '-0.4px', marginBottom: 6 }}>
            Passer au plan {planLabel}
          </div>
          <div style={{ fontSize: 14, color: palette.textSub }}>
            <span style={{ fontWeight: 700, color: '#2563EB' }}>${prix}/mois</span>
            {' '}· Activation sous 24h après validation
          </div>
        </div>

        {/* Méthode */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>
            Méthode de paiement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {METHODS.map(m => {
              const selected = method === m.key
              return (
                <button key={m.key} onClick={() => setMethod(m.key)} style={{
                  padding: '12px 14px', borderRadius: 14,
                  border: `1.5px solid ${selected ? m.color : palette.cardBorder}`,
                  background: selected ? m.color + '15' : palette.inputBg,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selected ? m.color : palette.text }}>
                    {m.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
            Numéro de téléphone
          </div>
          <input
            type="tel"
            placeholder="Ex : 620 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '100%', height: 52, boxSizing: 'border-box',
              background: palette.inputBg,
              border: `1.5px solid ${palette.inputBorder ?? palette.cardBorder}`,
              borderRadius: 14, padding: '0 18px',
              fontSize: 20, fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none', letterSpacing: '0.06em',
            }}
          />
        </div>

        {/* Avertissement */}
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.22)',
          borderRadius: 12, padding: '12px 16px',
          fontSize: 13, color: '#D97706', marginBottom: 28, lineHeight: 1.6,
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span>Plan activé après confirmation du paiement sous 24h par notre équipe.</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={onClose} style={{
            height: 48, borderRadius: 14,
            border: `1.5px solid ${palette.cardBorder}`,
            background: 'transparent',
            color: palette.textSub,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            transition: 'all 0.15s',
          }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(method, phone)}
            disabled={!canSubmit || loading}
            style={{
              height: 48, borderRadius: 14, border: 'none',
              background: canSubmit && !loading ? '#2563EB' : (isDark ? '#1E3148' : '#E5E7EB'),
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              boxShadow: canSubmit && !loading ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            {loading && <Spinner />}
            {loading ? 'Envoi...' : 'Confirmer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton de chargement ────────────────────────
function SkeletonCards({ palette }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 520, background: palette.card,
          borderRadius: 24, border: `1px solid ${palette.cardBorder}`,
          opacity: 0.5,
          animation: 'pulse 1.5s ease-in-out infinite',
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

  const { plan: planActuel } = usePlan()

  const { data, isLoading } = useQuery({
    queryKey: ['abonnement'],
    queryFn:  () => api.get('/abonnements').then(r => r.data),
    staleTime: 60_000,
  })

  const { mutateAsync: souscrire, isPending: loadingSub } = useMutation({
    mutationFn: ({ plan, payment_method, payment_phone }) =>
      api.post('/abonnements/souscrire', { plan, payment_method, payment_phone }).then(r => r.data),
    onSuccess: (d) => {
      toast.success(d.message, { duration: 6000 })
      queryClient.invalidateQueries({ queryKey: ['abonnement'] })
      setModal(null)
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur lors de la souscription'),
  })

  const abonnement = data?.abonnement
  const plans      = data?.tous_les_plans ?? []

  return (
    <div style={{ padding: '48px 28px 72px', maxWidth: 980, margin: '0 auto' }} className="fuelo-abonnements">

      {/* Modal */}
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix}
          onClose={() => setModal(null)}
          onConfirm={(m, p) => souscrire({ plan: modal.key, payment_method: m, payment_phone: p })}
          loading={loadingSub} palette={palette} isDark={isDark}
        />
      )}

      {/* ── En-tête ─────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{
          display: 'inline-block',
          background: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
          border: `1px solid ${isDark ? 'rgba(59,130,246,0.30)' : 'rgba(37,99,235,0.18)'}`,
          borderRadius: 99, padding: '5px 16px',
          fontSize: 12, fontWeight: 700, color: '#2563EB',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 18,
        }}>
          Abonnements Fuelo
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: palette.text,
          letterSpacing: '-0.8px', margin: '0 0 14px',
          lineHeight: 1.15,
        }}>
          Choisissez votre plan
        </h1>
        <p style={{
          fontSize: 16, color: palette.textSub, margin: 0,
          maxWidth: 440, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7,
        }}>
          Commencez avec Starter. Passez à Pro ou Enterprise quand vous êtes prêt.
        </p>

        {abonnement?.statut === 'en_attente' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginTop: 20,
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 99, padding: '8px 20px',
            fontSize: 13, color: '#D97706', fontWeight: 600,
          }}>
            <span>⏳</span>
            Paiement en attente · activation sous 24h
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            ⏳
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#D97706', fontSize: 14, marginBottom: 3 }}>
              Paiement en attente de validation
            </div>
            <div style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.5 }}>
              Plan {abonnement.plan?.toUpperCase()} · {abonnement.payment_method?.replace(/_/g, ' ')} · {abonnement.payment_phone} · Validation sous 24h
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'stretch',
        }}>
          {plans.map(plan => {
            const planC  = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
            const info   = PLANS_INFO[plan.key]  ?? PLANS_INFO.starter
            const isActuel = plan.actuel
            const isHigh   = info.highlight

            // Fond spécial pour la carte "Populaire"
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
                  ? (isDark
                      ? '0 16px 48px rgba(37,99,235,0.20)'
                      : '0 16px 48px rgba(37,99,235,0.12)')
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
                    color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99,
                    letterSpacing: '0.10em', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  }}>
                    ⭐ POPULAIRE
                  </div>
                )}

                {/* Badge Plan actuel */}
                {isActuel && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff',
                    fontSize: 10, fontWeight: 800,
                    padding: '4px 16px', borderRadius: 99,
                    letterSpacing: '0.10em', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  }}>
                    ✓ PLAN ACTUEL
                  </div>
                )}

                {/* ─ En-tête ─ */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{
                    display: 'inline-block',
                    fontSize: 11, fontWeight: 800,
                    color: planC.border,
                    textTransform: 'uppercase', letterSpacing: '0.10em',
                    background: planC.border + '15',
                    padding: '3px 10px', borderRadius: 6,
                    marginBottom: 10,
                  }}>
                    {plan.label}
                  </div>
                  <div style={{ fontSize: 14, color: palette.textSub, lineHeight: 1.55 }}>
                    {info.desc}
                  </div>
                </div>

                {/* ─ Prix ─ */}
                <div style={{
                  marginBottom: 26, paddingBottom: 22,
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{
                      fontSize: 46, fontWeight: 900,
                      color: palette.text,
                      letterSpacing: '-2px', lineHeight: 1,
                    }}>
                      ${plan.prix}
                    </span>
                    <span style={{
                      fontSize: 15, fontWeight: 500,
                      color: palette.textMuted,
                      paddingBottom: 6,
                    }}>
                      /mois
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: palette.textSub, marginTop: 8,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
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

                {/* ─ Fonctionnalités ─ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 28, flex: 1 }}>
                  {FEATURES.map(f => {
                    const ok = f[plan.key] === true
                    return (
                      <div key={f.label} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
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

                {/* ─ Bouton ─ */}
                <button
                  disabled={isActuel}
                  onClick={() => !isActuel && setModal({ key: plan.key, label: plan.label, prix: plan.prix })}
                  style={{
                    width: '100%', height: 50, borderRadius: 14,
                    border: isActuel
                      ? `1.5px solid ${isDark ? '#1E3148' : '#E5E7EB'}`
                      : 'none',
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
                  {isActuel ? '✓ Plan actuel' : `Choisir ${plan.label} →`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Table comparatif ────────────────────── */}
      {!isLoading && plans.length > 0 && (
        <div style={{ marginTop: 56 }}>
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: palette.text,
            letterSpacing: '-0.3px', marginBottom: 20, textAlign: 'center',
          }}>
            Comparatif détaillé
          </h2>
          <div style={{
            background: palette.card,
            border: `1px solid ${palette.cardBorder}`,
            borderRadius: 20,
            overflow: 'hidden',
          }}>
            {/* En-tête du tableau */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(3, 120px)',
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

            {/* Lignes */}
            {FEATURES.map((f, idx) => (
              <div key={f.label} style={{
                display: 'grid',
                gridTemplateColumns: '1fr repeat(3, 120px)',
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
      )}

      {/* ── Footer ──────────────────────────────── */}
      <div style={{ textAlign: 'center', marginTop: 52 }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 20px',
          fontSize: 13, color: palette.textMuted, lineHeight: 2,
        }}>
          {['Orange Money', 'MTN MoMo', 'PayCard', 'Kulu'].map(m => (
            <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: palette.textMuted, display: 'inline-block' }} />
              {m}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 6, lineHeight: 1.8 }}>
          Facturation mensuelle · Sans engagement · Activation sous 24h
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.3; } }
        @media (max-width: 768px) {
          .fuelo-abonnements { padding: 32px 16px 56px !important; }
          .fuelo-abonnements h1 { font-size: 28px !important; }
        }
        @media (max-width: 640px) {
          .fuelo-abonnements > div > div[style*="repeat(3"] {
            grid-template-columns: 1fr 80px 80px 80px !important;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}
