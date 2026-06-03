// ================================================
// FUELO — Page Abonnements (design Notion/Linear)
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
  pro:        { desc: 'Pour aller plus loin avec toutes les fonctionnalités', highlight: true  },
  enterprise: { desc: 'Pour les flottes et opérations complexes', highlight: false },
}

// ── Modal paiement ────────────────────────────────
function ModalPaiement({ planKey, planLabel, prix, onClose, onConfirm, loading, palette }) {
  const [method, setMethod] = useState('')
  const [phone,  setPhone]  = useState('')
  const canSubmit = method && phone.length >= 8

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: palette.card, border: `1px solid ${palette.cardBorder}`,
        borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>
            Passer au plan {planLabel}
          </div>
          <div style={{ fontSize: 13, color: palette.textSub, marginTop: 4 }}>
            ${prix}/mois · Activation sous 24h après validation
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Méthode de paiement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {METHODS.map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)} style={{
                padding: '10px 12px', borderRadius: 12,
                border: `1.5px solid ${method === m.key ? m.color : palette.cardBorder}`,
                background: method === m.key ? m.color + '12' : palette.inputBg,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 16 }}>{m.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: method === m.key ? m.color : palette.text }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Numéro de téléphone
          </div>
          <input type="tel" placeholder="Ex: 620 00 00 00" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '100%', height: 50, boxSizing: 'border-box',
              background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`,
              borderRadius: 12, padding: '0 16px',
              fontSize: 18, fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none', letterSpacing: '0.06em',
            }}
          />
        </div>

        <div style={{
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: 12, color: '#F59E0B', marginBottom: 24, lineHeight: 1.6,
        }}>
          ⚠️ Plan activé après confirmation du paiement sous 24h.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose} style={{
            height: 44, borderRadius: 12, border: `1px solid ${palette.cardBorder}`,
            background: 'transparent', color: palette.textSub, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
          }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(method, phone)} disabled={!canSubmit || loading} style={{
            height: 44, borderRadius: 12, border: 'none',
            background: canSubmit && !loading ? '#2563EB' : palette.hover,
            color: canSubmit && !loading ? '#fff' : palette.textMuted,
            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}>
            {loading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {loading ? 'Envoi...' : 'Confirmer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Icône check ───────────────────────────────────
function Check({ ok }) {
  if (ok) return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  return <div style={{ width: 13, height: 1.5, background: 'currentColor', opacity: 0.15, borderRadius: 1 }} />
}

// ── Page principale ───────────────────────────────
export default function AbonnementsPage() {
  const { palette } = useTheme()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)

  const { plan: planActuel, colors: planColors, statut: planStatut } = usePlan()

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
    <div style={{ padding: '52px 28px 64px', maxWidth: 940, margin: '0 auto' }} className="fuelo-abonnements">
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix}
          onClose={() => setModal(null)}
          onConfirm={(m, p) => souscrire({ plan: modal.key, payment_method: m, payment_phone: p })}
          loading={loadingSub} palette={palette}
        />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: palette.text, letterSpacing: '-0.8px', margin: 0, marginBottom: 12 }}>
          Choisissez votre plan
        </h1>
        <p style={{ fontSize: 15, color: palette.textSub, margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          Commencez avec Starter. Passez à Pro ou Enterprise quand vous êtes prêt.
        </p>
        {planStatut === 'en_attente' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 99, padding: '6px 16px', fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
            <span>⏳</span> Paiement en attente de validation — activation sous 24h
          </div>
        )}
      </div>

      {/* Bannière en attente */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: 13, marginBottom: 2 }}>Paiement en attente de validation</div>
            <div style={{ fontSize: 12, color: palette.textSub }}>
              Plan {abonnement.plan?.toUpperCase()} · {abonnement.payment_method?.replace(/_/g, ' ')} · {abonnement.payment_phone} · Validation sous 24h
            </div>
          </div>
        </div>
      )}

      {/* Grille plans */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 460, background: palette.card, borderRadius: 20, border: `1px solid ${palette.cardBorder}`, opacity: 0.4 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16, alignItems: 'start' }}>
          {plans.map(plan => {
            const planC    = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
            const info     = PLANS_INFO[plan.key]  ?? PLANS_INFO.starter
            const isActuel = plan.actuel
            const isHigh   = info.highlight

            return (
              <div key={plan.key} style={{
                background:    isHigh ? (palette.bg === '#F8FAFC' ? '#fff' : '#0F1F38') : palette.card,
                border:        `1.5px solid ${isActuel ? planC.border : isHigh ? planC.border + '50' : palette.cardBorder}`,
                borderRadius:  20,
                padding:       '28px 24px 24px',
                position:      'relative',
                boxShadow:     isActuel
                  ? `0 0 0 3px ${planC.border}22, 0 12px 40px ${planC.border}18`
                  : isHigh ? '0 12px 40px rgba(37,99,235,0.12)' : theme.shadow.sm,
                display:       'flex',
                flexDirection: 'column',
              }}>

                {/* Badge Populaire */}
                {isHigh && !isActuel && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#2563EB', color: '#fff',
                    fontSize: 10, fontWeight: 800, padding: '4px 14px',
                    borderRadius: 99, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>
                    POPULAIRE
                  </div>
                )}

                {/* En-tête plan */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: planC.border, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {plan.label}
                    </span>
                    {isActuel && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 9px', borderRadius: 99 }}>
                        Plan actuel
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: palette.textSub, lineHeight: 1.5 }}>
                    {info.desc}
                  </div>
                </div>

                {/* Prix */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${palette.cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: palette.text, letterSpacing: '-2px', lineHeight: 1 }}>${plan.prix}</span>
                    <span style={{ fontSize: 13, color: palette.textMuted }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 6 }}>
                    {plan.max_stations} station{plan.max_stations > 1 ? 's' : ''} · {plan.max_employes} employés/station
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
                  {FEATURES.map(f => {
                    const ok = f[plan.key] === true
                    return (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, color: ok ? palette.text : palette.textMuted }}>
                        <div style={{ flexShrink: 0 }}>
                          <Check ok={ok} />
                        </div>
                        <span style={{ fontSize: 13, opacity: ok ? 1 : 0.45 }}>{f.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Bouton */}
                <button
                  disabled={isActuel}
                  onClick={() => setModal({ key: plan.key, label: plan.label, prix: plan.prix })}
                  style={{
                    width: '100%', height: 46, borderRadius: 12,
                    border: isActuel ? `1px solid ${palette.cardBorder}` : 'none',
                    background: isActuel ? 'transparent' : isHigh ? '#2563EB' : planC.border,
                    color: isActuel ? palette.textMuted : '#fff',
                    fontSize: 14, fontWeight: 700, cursor: isActuel ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    boxShadow: isActuel ? 'none' : isHigh ? '0 4px 16px rgba(37,99,235,0.3)' : `0 3px 12px ${planC.border}33`,
                  }}
                  onMouseEnter={e => { if (!isActuel) e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                  {isActuel ? 'Plan actuel' : `Choisir ${plan.label} →`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 2 }}>
          Paiement via Orange Money · MTN MoMo · PayCard · Kulu<br />
          Facturation mensuelle · Sans engagement · Activation sous 24h
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .fuelo-abonnements { padding: 32px 16px 48px !important; } }
      `}</style>
    </div>
  )
}
