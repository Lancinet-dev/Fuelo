// ================================================
// FUELO V2 — PompistePage
// Fichier : frontend/src/features/pompiste/PompistePage.jsx
// Le pompiste entre les litres → montant calculé auto
// ================================================

import { useState } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { useStock }      from '../../hooks/useStock'
import { useVentes }     from '../../hooks/useVentes'
import { useParametres } from '../../hooks/useParametres'
import { formatGNF, formatLitres, formatRelative, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

export default function PompistePage() {
  const { user, logout }                           = useAuth()
  const { essence, gasoil }                        = useStock()
  const { enregistrerVente, venteLoading, aujourdhui } = useVentes()
  const { parametres }                             = useParametres()

  const [type,      setType]      = useState('essence')
  const [litres,    setLitres]    = useState('')
  const [lastVente, setLastVente] = useState(null)
  const [errors,    setErrors]    = useState({})

  const stock = type === 'essence' ? essence : gasoil

  // Prix depuis les paramètres de la station
  const prixEssence = parseInt(parametres?.prix_essence) || 10000
  const prixGasoil  = parseInt(parametres?.prix_gasoil)  || 9000
  const prixLitre   = type === 'essence' ? prixEssence : prixGasoil

  // Calcul automatique
  const litresNum   = parseFloat(litres) || 0
  const montantAuto = Math.round(litresNum * prixLitre)

  const validate = () => {
    const e = {}
    const l = parseFloat(litres)
    if (!l || l <= 0) e.litres = 'Entrez une quantité valide'
    if (l > stock)    e.litres = `Stock insuffisant (${formatLitres(stock)} dispo)`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleVente = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const result = await enregistrerVente({
      type,
      litres:      litresNum,
      montant_gnf: montantAuto,
    })

    if (result) {
      setLastVente({ type, litres: litresNum, montant_gnf: montantAuto, created_at: new Date() })
      setLitres('')
      setErrors({})
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: theme.font.family, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
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
          <div style={{ fontSize: theme.font.size.sm, color: 'rgba(255,255,255,0.5)' }}>{user?.nom}</div>
          <button onClick={logout} style={{ fontSize: theme.font.size.xs, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: theme.font.family }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 16 }}>

        {/* Stock actuel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 480 }}>
          {[
            { label: 'Essence', qty: essence, prix: prixEssence },
            { label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
          ].map(({ label, qty, prix }) => {
            const st = getStockStatus(qty)
            return (
              <div key={label} style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '14px 16px', boxShadow: theme.shadow.sm }}>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, marginBottom: 4 }}>
                  {qty.toLocaleString('fr-FR')} <span style={{ fontSize: 12, fontWeight: 400, color: theme.colors.textSub }}>L</span>
                </div>
                <div style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 600, marginBottom: 4 }}>
                  {formatGNF(prix)} / L
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: theme.radius.full }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats du jour */}
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '14px 20px', width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-around', boxShadow: theme.shadow.sm }}>
          {[
            { label: 'Mes ventes',    val: String(aujourdhui.nb ?? 0) },
            { label: 'Litres vendus', val: formatLitres(aujourdhui.total_litres) },
            { label: 'Montant',       val: formatGNF(aujourdhui.total_gnf) },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Formulaire vente */}
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.xl, padding: '24px 22px', width: '100%', maxWidth: 480, boxShadow: theme.shadow.md }}>
          <div style={{ fontSize: 15, fontWeight: theme.font.weight.black, color: theme.colors.text, marginBottom: 20, textAlign: 'center' }}>
            ⛽ Enregistrer une vente
          </div>

          <form onSubmit={handleVente}>

            {/* Choix carburant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { val: 'essence', emoji: '⛽', label: 'Essence', qty: essence, prix: prixEssence },
                { val: 'gasoil',  emoji: '🛢️', label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
              ].map(({ val, emoji, label, qty, prix }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setType(val); setLitres(''); setErrors({}) }}
                  style={{ padding: '16px 12px', borderRadius: theme.radius.lg, border: `2px solid ${type === val ? theme.colors.primary : theme.colors.cardBorder}`, background: type === val ? theme.colors.primaryLight : '#F9FAFB', color: type === val ? theme.colors.primary : theme.colors.textSub, fontFamily: theme.font.family, fontSize: theme.font.size.base, fontWeight: type === val ? theme.font.weight.black : theme.font.weight.normal, cursor: 'pointer', transition: theme.transition.fast, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                >
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <span>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: type === val ? theme.colors.primary : theme.colors.textMuted }}>
                    {formatGNF(prix)} / L
                  </span>
                  <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    {formatLitres(qty)} dispo
                  </span>
                </button>
              ))}
            </div>

            {/* Quantité */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quantité (litres)
              </div>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Ex: 30"
                value={litres}
                onChange={e => { setLitres(e.target.value); setErrors({}) }}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e  => { e.target.style.borderColor = errors.litres ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 64, background: '#F9FAFB', border: `1.5px solid ${errors.litres ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '0 16px', fontSize: 28, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, outline: 'none', transition: theme.transition.fast, textAlign: 'center' }}
              />
              {errors.litres && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.litres}</div>}
            </div>

            {/* Montant calculé automatiquement */}
            <div style={{ background: litresNum > 0 ? theme.colors.primaryLight : '#F9FAFB', border: `1.5px solid ${litresNum > 0 ? theme.colors.primary : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '16px', marginBottom: 22, textAlign: 'center', transition: 'all 0.3s' }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Montant à encaisser
              </div>
              <div style={{ fontSize: 32, fontWeight: theme.font.weight.black, color: litresNum > 0 ? theme.colors.primary : theme.colors.textMuted, fontFamily: theme.font.mono, letterSpacing: '-1px' }}>
                {litresNum > 0 ? formatGNF(montantAuto) : '— GNF'}
              </div>
              {litresNum > 0 && (
                <div style={{ fontSize: 12, color: theme.colors.textSub, marginTop: 6 }}>
                  {litresNum} L × {formatGNF(prixLitre)} = {formatGNF(montantAuto)}
                </div>
              )}
            </div>

            {/* Bouton confirmer */}
            <button
              type="submit"
              disabled={venteLoading || !litresNum}
              style={{ width: '100%', height: 60, background: venteLoading || !litresNum ? '#D1D5DB' : theme.colors.primary, border: 'none', borderRadius: theme.radius.lg, fontSize: 18, fontWeight: theme.font.weight.black, color: '#0F172A', cursor: venteLoading || !litresNum ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: theme.font.family, boxShadow: !litresNum ? 'none' : theme.shadow.primary, transition: theme.transition.fast }}
            >
              {venteLoading
                ? <div style={{ width: 22, height: 22, border: '3px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              }
              {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
            </button>
          </form>
        </div>

        {/* Confirmation */}
        {lastVente && (
          <div style={{ background: theme.colors.successLight, border: `1px solid ${theme.colors.success}30`, borderRadius: theme.radius.lg, padding: '16px 20px', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.success }}>✅ Vente enregistrée !</div>
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