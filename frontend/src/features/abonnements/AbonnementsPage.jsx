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
  { key: 'ventes',     label: 'Ventes & caisse',          starter: true,  pro: true,  enterprise: true },
  { key: 'stock',      label: 'Gestion du stock',          starter: true,  pro: true,  enterprise: true },
  { key: 'alertes',    label: 'Alertes stock',             starter: true,  pro: true,  enterprise: true },
  { key: 'services',   label: 'Anti-fraude pompistes',     starter: false, pro: true,  enterprise: true },
  { key: 'trajets',    label: 'GPS citernes',              starter: false, pro: true,  enterprise: true },
  { key: 'citernes',   label: 'Gestion citernes',          starter: false, pro: true,  enterprise: true },
  { key: 'logistique', label: 'Interface logisticien',     starter: false, pro: false, enterprise: true },
]

// ── Modal paiement ───────────────────────────────
function ModalPaiement({ planKey, planLabel, prix, onClose, onConfirm, loading, palette }) {
  const [method, setMethod] = useState('')
  const [phone,  setPhone]  = useState('')
  const canSubmit = method && phone.length >= 8

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: palette.card,
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: theme.radius.xl,
        padding: '28px 24px',
        width: '100%', maxWidth: 440,
        boxShadow: theme.shadow.lg,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: palette.text, marginBottom: 4 }}>
          Passer au plan {planLabel}
        </div>
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 24 }}>
          ${prix}/mois · Votre demande sera validée sous 24h
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Méthode de paiement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {METHODS.map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)}
                style={{
                  padding: '10px 12px', borderRadius: theme.radius.md,
                  border: `1.5px solid ${method === m.key ? m.color : palette.cardBorder}`,
                  background: method === m.key ? m.color + '15' : palette.inputBg,
                  cursor: 'pointer', fontFamily: theme.font.family,
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: theme.transition.fast,
                }}>
                <span style={{ fontSize: 18 }}>{m.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: method === m.key ? m.color : palette.text }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Numéro de téléphone
          </div>
          <input type="tel" placeholder="Ex: 620 00 00 00" value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '100%', height: 50,
              background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`,
              borderRadius: theme.radius.md, padding: '0 16px',
              fontSize: 20, fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none', letterSpacing: '0.08em',
            }}
          />
        </div>

        <div style={{
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: theme.radius.md, padding: '10px 14px',
          fontSize: 12, color: '#F59E0B', marginBottom: 20, lineHeight: 1.5,
        }}>
          ⚠️ Plan activé après confirmation du paiement sous 24h.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose}
            style={{ height: 44, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 14 }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(method, phone)} disabled={!canSubmit || loading}
            style={{
              height: 44, borderRadius: theme.radius.md, border: 'none',
              background: canSubmit && !loading ? theme.colors.primary : palette.hover,
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: theme.font.family, fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading && <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {loading ? 'Envoi...' : 'Confirmer →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Check / Cross ────────────────────────────────
function Check({ ok, palette }) {
  if (ok) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  return <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 6, height: 1.5, background: palette.cardBorder, borderRadius: 1 }} />
  </div>
}

// ── Page principale ──────────────────────────────
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

  const PLAN_META = {
    starter:    { color: '#6B7280', highlight: false },
    pro:        { color: '#2563EB', highlight: true  },
    enterprise: { color: '#F59E0B', highlight: false },
  }

  return (
    <div style={{ padding: '40px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-abonnements">
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix}
          onClose={() => setModal(null)}
          onConfirm={(m, p) => souscrire({ plan: modal.key, payment_method: m, payment_phone: p })}
          loading={loadingSub} palette={palette}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 6 }}>
          Abonnement
        </h1>
        <p style={{ fontSize: 14, color: palette.textSub, margin: 0 }}>
          Choisissez le plan adapté à votre station.{' '}
          <span style={{ fontSize: 13, color: planColors.border, fontWeight: 600 }}>
            Plan actuel : {planColors.label}
          </span>
          {planStatut === 'en_attente' && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
              ⏳ En attente
            </span>
          )}
        </p>
      </div>

      {/* Bannière paiement en attente */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: theme.radius.lg, padding: '14px 18px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⏳</span>
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
          {[1,2,3].map(i => <div key={i} style={{ height: 420, background: palette.card, borderRadius: theme.radius.xl, border: `1px solid ${palette.cardBorder}`, opacity: 0.5 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
          {plans.map(plan => {
            const meta    = PLAN_META[plan.key] ?? PLAN_META.starter
            const planC   = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter
            const isActuel = plan.actuel

            return (
              <div key={plan.key} style={{
                background:   palette.card,
                border:       `1.5px solid ${isActuel ? planC.border : meta.highlight ? planC.border + '60' : palette.cardBorder}`,
                borderRadius: theme.radius.xl,
                padding:      '24px',
                position:     'relative',
                boxShadow:    isActuel ? `0 0 0 3px ${planC.border}18` : meta.highlight ? theme.shadow.md : theme.shadow.sm,
                display:      'flex',
                flexDirection:'column',
                gap:          0,
              }}>

                {/* Badge "Populaire" sur Pro */}
                {meta.highlight && !isActuel && (
                  <div style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    background: planC.border, color: '#fff',
                    fontSize: 10, fontWeight: 700, padding: '3px 14px',
                    borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: '0.06em',
                  }}>
                    POPULAIRE
                  </div>
                )}

                {/* Nom du plan + badge actuel */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: planC.border, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {plan.label}
                  </span>
                  {isActuel && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 9px', borderRadius: 99 }}>
                      Actuel
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: palette.text, letterSpacing: '-1px' }}>${plan.prix}</span>
                    <span style={{ fontSize: 13, color: palette.textSub }}>/mois</span>
                  </div>
                  <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>
                    Jusqu'à {plan.max_stations} station{plan.max_stations > 1 ? 's' : ''} · {plan.max_employes} employés/station
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
                  {FEATURES.map(f => {
                    const ok = f[plan.key] === true
                    return (
                      <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Check ok={ok} palette={palette} />
                        <span style={{ fontSize: 13, color: ok ? palette.text : palette.textMuted, opacity: ok ? 1 : 0.5 }}>
                          {f.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Bouton */}
                <button
                  disabled={isActuel}
                  onClick={() => setModal({ key: plan.key, label: plan.label, prix: plan.prix })}
                  style={{
                    width: '100%', height: 44,
                    borderRadius: theme.radius.md, border: isActuel ? `1px solid ${palette.cardBorder}` : 'none',
                    background: isActuel ? 'transparent' : planC.border,
                    color: isActuel ? palette.textMuted : '#fff',
                    fontSize: 14, fontWeight: 700,
                    cursor: isActuel ? 'default' : 'pointer',
                    fontFamily: theme.font.family,
                    transition: theme.transition.normal,
                    boxShadow: isActuel ? 'none' : `0 3px 12px ${planC.border}44`,
                  }}
                  onMouseEnter={e => { if (!isActuel) e.currentTarget.style.opacity = '0.9' }}
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
      <div style={{ fontSize: 12, color: palette.textMuted, textAlign: 'center', lineHeight: 1.8 }}>
        Paiement via Orange Money · MTN MoMo · PayCard · Kulu<br />
        Facturation mensuelle · Sans engagement
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .fuelo-abonnements { padding: 24px 16px !important; } }
      `}</style>
    </div>
  )
}
