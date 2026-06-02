// ================================================
// FUELO — Page Abonnements (owner uniquement)
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

const FEATURES_LABELS = {
  ventes:     '⛽ Ventes & caisse',
  stock:      '📦 Gestion du stock',
  alertes:    '🔔 Alertes stock',
  services:   '📸 Anti-fraude pompistes',
  trajets:    '🚚 GPS citernes',
  citernes:   '🛢️ Gestion citernes',
  logistique: '📦 Interface logisticien',
}

const TOUT = ['ventes', 'stock', 'alertes', 'services', 'trajets', 'citernes', 'logistique']

// ── Carte plan ───────────────────────────────────
function PlanCard({ plan, colors, onChoisir, palette }) {
  const isActuel     = plan.actuel
  const isEnterprise = plan.key === 'enterprise'
  const planC        = PLAN_COLORS[plan.key] ?? PLAN_COLORS.starter

  return (
    <div style={{
      background:    palette.card,
      border:        `2px solid ${isActuel ? planC.border : isEnterprise ? '#F59E0B' : palette.cardBorder}`,
      borderRadius:  theme.radius.xl,
      padding:       '24px 20px',
      position:      'relative',
      boxShadow:     isActuel ? `0 0 0 4px ${planC.border}22` : theme.shadow.sm,
      display:       'flex',
      flexDirection: 'column',
      gap:           14,
    }}>
      {/* Badges */}
      {(isActuel || isEnterprise) && !isActuel && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: '#F59E0B', color: '#0D1B2A',
          fontSize: 10, fontWeight: 800, padding: '3px 12px',
          borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: '0.06em',
        }}>
          ⭐ LE PLUS COMPLET
        </div>
      )}

      {/* Badge plan coloré */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: 99,
          background: planC.border + '22',
          color: planC.text,
          border: `1px solid ${planC.border}55`,
        }}>
          {planC.emoji} {plan.label}
        </span>
        {isActuel && (
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.success, background: theme.colors.successLight, padding: '3px 10px', borderRadius: 99 }}>
            ✓ Actuel
          </span>
        )}
      </div>

      {/* Prix */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 900, color: planC.border ?? theme.colors.primary }}>${plan.prix}</span>
        <span style={{ fontSize: 13, color: palette.textSub }}>/mois</span>
      </div>

      {/* Limites */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { l: 'Stations',      v: plan.max_stations },
          { l: 'Employés/stat', v: plan.max_employes },
        ].map(({ l, v }) => (
          <div key={l} style={{
            flex: 1, background: planC.border + '15',
            borderRadius: theme.radius.md, padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: planC.border }}>{v}</div>
            <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {TOUT.map(f => {
          const ok = plan.features.includes(f)
          return (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: ok ? theme.colors.success : palette.textMuted, flexShrink: 0, fontWeight: 700 }}>
                {ok ? '✓' : '✗'}
              </span>
              <span style={{
                fontSize: 12, color: ok ? palette.text : palette.textMuted,
                textDecoration: ok ? 'none' : 'line-through', opacity: ok ? 1 : 0.45,
              }}>
                {FEATURES_LABELS[f]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bouton */}
      <button disabled={isActuel} onClick={() => onChoisir(plan.key)}
        style={{
          width: '100%', height: 46, marginTop: 'auto',
          borderRadius: theme.radius.md, border: 'none',
          background: isActuel ? palette.hover : planC.border ?? theme.colors.primary,
          color: isActuel ? palette.textMuted : '#fff',
          fontSize: 14, fontWeight: 700, cursor: isActuel ? 'default' : 'pointer',
          fontFamily: theme.font.family, transition: theme.transition.normal,
          boxShadow: isActuel ? 'none' : `0 4px 14px ${planC.border ?? theme.colors.primary}44`,
        }}>
        {isActuel ? '✓ Plan actuel' : `Passer au ${plan.label} →`}
      </button>
    </div>
  )
}

// ── Modal paiement ───────────────────────────────
function ModalPaiement({ planKey, planLabel, prix, onClose, onConfirm, loading, palette }) {
  const [method, setMethod] = useState('')
  const [phone,  setPhone]  = useState('')
  const canSubmit = method && phone.length >= 8

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
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
          Souscrire au plan {planLabel}
        </div>
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 22 }}>
          ${prix}/mois · Paiement Mobile Money
        </div>

        {/* Méthode */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Méthode de paiement
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {METHODS.map(m => (
              <button key={m.key} onClick={() => setMethod(m.key)}
                style={{
                  padding: '10px 12px', borderRadius: theme.radius.md,
                  border: `2px solid ${method === m.key ? m.color : palette.cardBorder}`,
                  background: method === m.key ? m.color + '18' : palette.inputBg,
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

        {/* Numéro */}
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
              color: palette.text, outline: 'none', letterSpacing: '0.1em',
            }}
          />
          <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>
            Vous recevrez une confirmation par SMS après validation.
          </div>
        </div>

        {/* Avertissement */}
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: theme.radius.md, padding: '10px 14px',
          fontSize: 12, color: '#F59E0B', marginBottom: 20, lineHeight: 1.5,
        }}>
          ⚠️ Votre demande sera traitée sous 24h. Plan activé après confirmation du paiement.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onClose}
            style={{ height: 46, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 14 }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(method, phone)} disabled={!canSubmit || loading}
            style={{
              height: 46, borderRadius: theme.radius.md, border: 'none',
              background: canSubmit && !loading ? theme.colors.primary : palette.hover,
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: theme.font.family, fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
            {loading ? 'Envoi...' : '📲 Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
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

  return (
    <div style={{ padding: '32px 28px', maxWidth: 960, margin: '0 auto' }} className="fuelo-abonnements">
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix}
          onClose={() => setModal(null)} onConfirm={(m, p) => souscrire({ plan: modal.key, payment_method: m, payment_phone: p })}
          loading={loadingSub} palette={palette}
        />
      )}

      {/* Header avec badge plan actuel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 10 }}>
            Abonnement
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: palette.textSub }}>Plan actuel :</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
              padding: '5px 14px', borderRadius: 99,
              background: planColors.border + '22',
              color: planColors.text,
              border: `1.5px solid ${planColors.border}66`,
            }}>
              {planColors.emoji} {planColors.label}
            </span>
            {planStatut === 'en_attente' && (
              <span style={{ fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>
                ⏳ Paiement en attente
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bannière en attente */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: theme.radius.lg, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 2 }}>Paiement en attente de validation</div>
            <div style={{ fontSize: 13, color: palette.textSub }}>
              Plan {abonnement.plan?.toUpperCase()} · {abonnement.payment_method?.replace(/_/g, ' ')} · {abonnement.payment_phone} · Validation sous 24h
            </div>
          </div>
        </div>
      )}

      {/* Grille des plans */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 420, background: palette.card, borderRadius: theme.radius.xl, border: `1px solid ${palette.cardBorder}`, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
          {plans.map(plan => (
            <PlanCard
              key={plan.key}
              plan={plan}
              colors={PLAN_COLORS[plan.key]}
              onChoisir={(key) => setModal({ key, label: plan.label, prix: plan.prix })}
              palette={palette}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 28, fontSize: 12, color: palette.textMuted, textAlign: 'center', lineHeight: 1.6 }}>
        💳 Orange Money · MTN MoMo · PayCard · Kulu — Facturation mensuelle · Sans engagement
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @media (max-width: 768px) { .fuelo-abonnements { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}
