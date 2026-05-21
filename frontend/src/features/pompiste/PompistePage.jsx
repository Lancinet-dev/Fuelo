// ================================================
// FUELO V2 — PompistePage
// Fichier : frontend/src/features/pompiste/PompistePage.jsx
// Interface ultra-simple pour les pompistes
// ================================================

import { useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import { useStock }  from '../../hooks/useStock'
import { useVentes } from '../../hooks/useVentes'
import { formatGNF, formatLitres, formatRelative, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

export default function PompistePage() {
  const { user, logout } = useAuth()
  const { essence, gasoil } = useStock()
  const { enregistrerVente, venteLoading, aujourdhui } = useVentes()

  const [type,       setType]       = useState('essence')
  const [litres,     setLitres]     = useState('')
  const [montant,    setMontant]    = useState('')
  const [lastVente,  setLastVente]  = useState(null)
  const [errors,     setErrors]     = useState({})

  const stock = type === 'essence' ? essence : gasoil

  const validate = () => {
    const e = {}
    const l = parseFloat(litres)
    const m = parseFloat(montant)
    if (!l || l <= 0)        e.litres  = 'Quantité invalide'
    if (l > stock)           e.litres  = `Stock insuffisant (${formatLitres(stock)} dispo)`
    if (!m || m <= 0)        e.montant = 'Montant invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleVente = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const result = await enregistrerVente({
      type,
      litres:      parseFloat(litres),
      montant_gnf: parseInt(montant),
    })

    if (result) {
      setLastVente({ type, litres: parseFloat(litres), montant_gnf: parseInt(montant), created_at: new Date() })
      setLitres('')
      setMontant('')
      setErrors({})
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: theme.font.family, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header compact ───────────────────────── */}
      <div style={{ background: theme.colors.sidebar, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: theme.colors.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
            fuel<span style={{ color: theme.colors.primary }}>o</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: theme.font.size.sm, color: 'rgba(255,255,255,0.5)' }}>
            {user?.nom}
          </div>
          <button
            onClick={logout}
            style={{ fontSize: theme.font.size.xs, color: 'rgba(239, 68, 68, 1)', boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: theme.font.family }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Contenu ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 16 }}>

        {/* Stock actuel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 480 }}>
          {[{ label: 'Essence', qty: essence }, { label: 'Gasoil', qty: gasoil }].map(({ label, qty }) => {
            const st = getStockStatus(qty)
            return (
              <div key={label} style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '14px 16px', boxShadow: theme.shadow.sm }}>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 4 }}>
                  {qty.toLocaleString('fr-FR')} <span style={{ fontSize: 12, fontWeight: 400, color: theme.colors.textSub }}>L</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: theme.radius.full, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats du jour */}
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '14px 20px', width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-around', boxShadow: theme.shadow.sm }}>
          {[
            { label: 'Mes ventes', val: String(aujourdhui.nb ?? 0) },
            { label: 'Litres vendus', val: formatLitres(aujourdhui.total_litres) },
            { label: 'Montant', val: formatGNF(aujourdhui.total_gnf) },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono }}>{val}</div>
            </div>
          ))}
        </div>

        {/* ── Formulaire vente ─────────────────── */}
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.xl, padding: '24px 22px', width: '100%', maxWidth: 480, boxShadow: theme.shadow.md }}>
          <div style={{ fontSize: 15, fontWeight: theme.font.weight.black, color: theme.colors.text, marginBottom: 20, textAlign: 'center' }}>
            ⛽ Enregistrer une vente
          </div>

          <form onSubmit={handleVente}>

            {/* Type carburant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[{ val: 'essence', emoji: '⛽', label: 'Essence' }, { val: 'gasoil', emoji: '🛢️', label: 'Gasoil' }].map(({ val, emoji, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  style={{
                    padding:      '16px 12px',
                    borderRadius: theme.radius.lg,
                    border:       `2px solid ${type === val ? theme.colors.primary : theme.colors.cardBorder}`,
                    background:   type === val ? theme.colors.primaryLight : '#F9FAFB',
                    color:        type === val ? theme.colors.primary : theme.colors.textSub,
                    fontFamily:   theme.font.family,
                    fontSize:     theme.font.size.base,
                    fontWeight:   type === val ? theme.font.weight.black : theme.font.weight.normal,
                    cursor:       'pointer',
                    transition:   theme.transition.fast,
                    display:      'flex',
                    flexDirection:'column',
                    alignItems:   'center',
                    gap:          6,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  {label}
                  <span style={{ fontSize: 11, color: type === val ? theme.colors.primary : theme.colors.textMuted }}>
                    {val === 'essence' ? formatLitres(essence) : formatLitres(gasoil)} dispo
                  </span>
                </button>
              ))}
            </div>

            {/* Litres */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quantité (litres)
              </div>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Ex: 30"
                value={litres}
                onChange={e => setLitres(e.target.value)}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e =>  { e.target.style.borderColor = errors.litres ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 56, background: '#F9FAFB', border: `1.5px solid ${errors.litres ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '0 16px', fontSize: 22, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, outline: 'none', transition: theme.transition.fast }}
              />
              {errors.litres && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.litres}</div>}
            </div>

            {/* Montant */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Montant encaissé (GNF)
              </div>
              <input
                type="number"
                min="1"
                placeholder="Ex: 300000"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e =>  { e.target.style.borderColor = errors.montant ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 56, background: '#F9FAFB', border: `1.5px solid ${errors.montant ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '0 16px', fontSize: 22, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, outline: 'none', transition: theme.transition.fast }}
              />
              {errors.montant && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.montant}</div>}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={venteLoading}
              style={{ width: '100%', height: 56, background: venteLoading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.lg, fontSize: 16, fontWeight: theme.font.weight.black, color: '#0F172A', cursor: venteLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.fast }}
            >
              {venteLoading
                ? <div style={{ width: 20, height: 20, border: '3px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              }
              {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
            </button>
          </form>
        </div>

        {/* Dernière vente enregistrée */}
        {lastVente && (
          <div style={{ background: theme.colors.successLight, border: `1px solid ${theme.colors.success}30`, borderRadius: theme.radius.lg, padding: '14px 20px', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.success }}>Vente enregistrée</div>
              <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub }}>
                {formatLitres(lastVente.litres)} {lastVente.type} · {formatGNF(lastVente.montant_gnf)} · {formatRelative(lastVente.created_at)}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}