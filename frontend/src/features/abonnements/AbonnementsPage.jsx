// ================================================
// FUELO — Page Abonnements (owner uniquement)
// ================================================

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api   from '../../services/api'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import theme from '../../config/theme'

const METHODS = [
  { key: 'orange_money', label: 'Orange Money', emoji: '🟠', color: '#FF6B00' },
  { key: 'mtn_money',    label: 'MTN MoMo',     emoji: '🟡', color: '#FFCB00' },
  { key: 'paycard',      label: 'PayCard',       emoji: '💳', color: '#1E40AF' },
  { key: 'kulu',         label: 'Kulu',          emoji: '🔵', color: '#0EA5E9' },
]

const FEATURES_LABELS = {
  ventes:            '⛽ Ventes & caisse',
  stock:             '📦 Gestion du stock',
  alertes:           '🔔 Alertes stock',
  services:          '📸 Anti-fraude pompistes',
  trajets:           '🚚 GPS citernes',
  citernes:          '🛢️ Gestion citernes',
  logistique:        '📦 Interface logisticien',
}

const TOUT_FEATURES = ['ventes', 'stock', 'alertes', 'services', 'trajets', 'citernes', 'logistique']

function PlanCard({ plan, onChoisir, palette }) {
  const isActuel   = plan.actuel
  const isEnterprise = plan.key === 'enterprise'

  const cardBorder = isActuel
    ? `2px solid ${theme.colors.primary}`
    : isEnterprise
    ? `2px solid ${theme.colors.warning}`
    : `1px solid ${palette.cardBorder}`

  return (
    <div style={{
      background:   palette.card,
      border:       cardBorder,
      borderRadius: theme.radius.xl,
      padding:      '24px 20px',
      position:     'relative',
      boxShadow:    isActuel ? theme.shadow.primary : theme.shadow.sm,
      display:      'flex',
      flexDirection:'column',
      gap:          16,
    }}>
      {/* Badge actuel / populaire */}
      {(isActuel || isEnterprise) && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: isActuel ? theme.colors.primary : theme.colors.warning,
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '3px 12px', borderRadius: 99, whiteSpace: 'nowrap',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {isActuel ? '✓ Votre plan actuel' : '⭐ Le plus complet'}
        </div>
      )}

      {/* Header */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: palette.text, marginBottom: 4 }}>
          {plan.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: theme.colors.primary }}>
            ${plan.prix}
          </span>
          <span style={{ fontSize: 13, color: palette.textSub }}>/mois</span>
        </div>
      </div>

      {/* Limites */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { l: 'Stations', v: plan.max_stations },
          { l: 'Employés/station', v: plan.max_employes },
        ].map(({ l, v }) => (
          <div key={l} style={{
            background: theme.colors.primaryLight,
            borderRadius: theme.radius.md,
            padding: '6px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.primary }}>{v}</div>
            <div style={{ fontSize: 10, color: theme.colors.primary, opacity: 0.8 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TOUT_FEATURES.map(f => {
          const inclus = plan.features.includes(f)
          return (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 14,
                color: inclus ? theme.colors.success : palette.textMuted,
                flexShrink: 0,
              }}>
                {inclus ? '✓' : '✗'}
              </span>
              <span style={{
                fontSize: 13,
                color: inclus ? palette.text : palette.textMuted,
                textDecoration: inclus ? 'none' : 'line-through',
                opacity: inclus ? 1 : 0.5,
              }}>
                {FEATURES_LABELS[f]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Bouton */}
      <button
        disabled={isActuel}
        onClick={() => onChoisir(plan.key)}
        style={{
          width: '100%', height: 46,
          borderRadius: theme.radius.md,
          border: 'none',
          background: isActuel
            ? (palette.hover)
            : isEnterprise ? theme.colors.warning : theme.colors.primary,
          color: isActuel ? palette.textMuted : '#fff',
          fontSize: 14, fontWeight: 700,
          cursor: isActuel ? 'default' : 'pointer',
          fontFamily: theme.font.family,
          transition: theme.transition.normal,
          boxShadow: isActuel ? 'none' : theme.shadow.primary,
          marginTop: 'auto',
        }}
      >
        {isActuel ? 'Plan actuel' : `Passer au ${plan.label}`}
      </button>
    </div>
  )
}

function ModalPaiement({ planKey, planLabel, prix, onClose, onConfirm, loading, palette }) {
  const [method, setMethod] = useState('')
  const [phone,  setPhone]  = useState('')

  const canSubmit = method && phone.length >= 8

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
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
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 24 }}>
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
                  padding: '10px 12px',
                  borderRadius: theme.radius.md,
                  border: `2px solid ${method === m.key ? m.color : palette.cardBorder}`,
                  background: method === m.key ? `${m.color}15` : palette.inputBg,
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Numéro de téléphone
          </div>
          <input
            type="tel"
            placeholder="Ex: 620 00 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '100%', height: 50,
              background: palette.inputBg,
              border: `1.5px solid ${palette.cardBorder}`,
              borderRadius: theme.radius.md,
              padding: '0 16px', fontSize: 18,
              fontWeight: 700, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none',
              letterSpacing: '0.1em',
            }}
          />
          <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>
            Le paiement sera envoyé à ce numéro. Vous recevrez une confirmation par SMS.
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: theme.radius.md,
          padding: '10px 14px',
          fontSize: 12, color: '#F59E0B',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          ⚠️ Votre demande sera traitée sous 24h. Votre plan sera activé après confirmation du paiement par notre équipe.
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
            {loading
              ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : '📲'}
            {loading ? 'Envoi...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AbonnementsPage() {
  const { palette }     = useTheme()
  const queryClient     = useQueryClient()
  const [modal, setModal] = useState(null) // { key, label, prix }

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

  const handleConfirm = async (method, phone) => {
    await souscrire({ plan: modal.key, payment_method: method, payment_phone: phone })
  }

  const abonnement = data?.abonnement
  const plans      = data?.tous_les_plans ?? []

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-abonnements">
      {modal && (
        <ModalPaiement
          planKey={modal.key} planLabel={modal.label} prix={modal.prix}
          onClose={() => setModal(null)} onConfirm={handleConfirm}
          loading={loadingSub} palette={palette}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Abonnement
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          Gérez votre plan et accédez à toutes les fonctionnalités Fuelo
        </p>
      </div>

      {/* Statut abonnement actuel */}
      {abonnement?.statut === 'en_attente' && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: theme.radius.lg,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 2 }}>
              Paiement en attente de validation
            </div>
            <div style={{ fontSize: 13, color: palette.textSub }}>
              Plan {abonnement.plan?.toUpperCase()} · {abonnement.payment_method?.replace('_', ' ')} · {abonnement.payment_phone} · Validation sous 24h
            </div>
          </div>
        </div>
      )}

      {/* Grille des plans */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 400, background: palette.card, borderRadius: theme.radius.xl, border: `1px solid ${palette.cardBorder}` }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {plans.map(plan => (
            <PlanCard
              key={plan.key}
              plan={plan}
              onChoisir={(key) => setModal({ key, label: plan.label, prix: plan.prix })}
              palette={palette}
            />
          ))}
        </div>
      )}

      {/* Note bas de page */}
      <div style={{ marginTop: 28, fontSize: 12, color: palette.textMuted, textAlign: 'center', lineHeight: 1.6 }}>
        Paiements acceptés : Orange Money, MTN MoMo, PayCard, Kulu · Facturation mensuelle · Pas d'engagement
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .fuelo-abonnements { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}
