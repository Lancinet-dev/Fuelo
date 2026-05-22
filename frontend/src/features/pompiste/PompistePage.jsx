// ================================================
// FUELO V2 — PompistePage
// Fichier : frontend/src/features/pompiste/PompistePage.jsx
// ================================================

import { useState, useEffect } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { useStock }      from '../../hooks/useStock'
import { useVentes }     from '../../hooks/useVentes'
import { useParametres } from '../../hooks/useParametres'
import { useTheme }      from '../../context/ThemeContext'
import { formatGNF, formatLitres, formatRelative, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

const ORANGE = '#F59E0B'

export default function PompistePage() {
  const { user, logout }                               = useAuth()
  const { essence, gasoil }                            = useStock()
  const { enregistrerVente, venteLoading, aujourdhui } = useVentes()
  const { parametres }                                 = useParametres()
  const { isDark, toggle, palette }                    = useTheme()

  const [type,      setType]      = useState('essence')
  const [litres,    setLitres]    = useState('')
  const [lastVente, setLastVente] = useState(null)
  const [errors,    setErrors]    = useState({})
  const [success,   setSuccess]   = useState(false)

  const stock       = type === 'essence' ? essence : gasoil
  const prixEssence = parseInt(parametres?.prix_essence) || 10000
  const prixGasoil  = parseInt(parametres?.prix_gasoil)  || 9000
  const prixLitre   = type === 'essence' ? prixEssence : prixGasoil
  const litresNum   = parseFloat(litres) || 0
  const montantAuto = Math.round(litresNum * prixLitre)

  // Effacer le message succès après 4s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 4000)
      return () => clearTimeout(t)
    }
  }, [success])

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
    const result = await enregistrerVente({ type, litres: litresNum, montant_gnf: montantAuto })
    if (result) {
      setLastVente({ type, litres: litresNum, montant_gnf: montantAuto, created_at: new Date() })
      setLitres('')
      setErrors({})
      setSuccess(true)
    }
  }

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>

      {/* Header */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill={ORANGE} opacity="0.6" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            fuel<span style={{ color: ORANGE }}>o</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Nom utilisateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ORANGE }}>
              {(user?.nom || 'P').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{user?.nom}</span>
          </div>

          {/* Toggle dark/light */}
          <button onClick={toggle}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark
                ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>
                : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              }
            </svg>
            {isDark ? 'Jour' : 'Nuit'}
          </button>

          <button onClick={logout} style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 14 }}>

        {/* Stocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 480 }}>
          {[
            { label: 'Essence', qty: essence, prix: prixEssence },
            { label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
          ].map(({ label, qty, prix }) => {
            const st = getStockStatus(qty)
            return (
              <div key={label} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '12px 14px', boxShadow: theme.shadow.sm, transition: 'background 0.3s' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono, marginBottom: 3 }}>
                  {qty.toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontWeight: 400, color: palette.textMuted }}>L</span>
                </div>
                <div style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 600, marginBottom: 4 }}>{formatGNF(prix)} / L</div>
                <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', borderRadius: theme.radius.full, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats du jour */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '12px 20px', width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-around', boxShadow: theme.shadow.sm, transition: 'background 0.3s' }}>
          {[
            { label: 'Ventes', val: String(aujourdhui.nb ?? 0), emoji: '🛒' },
            { label: 'Litres',  val: formatLitres(aujourdhui.total_litres), emoji: '⛽' },
            { label: 'Montant', val: formatGNF(aujourdhui.total_gnf), emoji: '💰' },
          ].map(({ label, val, emoji }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono }}>{val}</div>
              <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Formulaire vente */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 20, padding: '22px 20px', width: '100%', maxWidth: 480, boxShadow: theme.shadow.md, transition: 'background 0.3s' }}>

          {/* Titre */}
          <div style={{ fontSize: 14, fontWeight: 800, color: palette.text, marginBottom: 18, textAlign: 'center', letterSpacing: '-0.3px' }}>
            ⛽ Enregistrer une vente
          </div>

          <form onSubmit={handleVente}>

            {/* Choix carburant — GROS boutons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { val: 'essence', emoji: '⛽', label: 'Essence', qty: essence, prix: prixEssence },
                { val: 'gasoil',  emoji: '🛢️', label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
              ].map(({ val, emoji, label, qty, prix }) => (
                <button key={val} type="button"
                  onClick={() => { setType(val); setLitres(''); setErrors({}) }}
                  style={{
                    padding: '14px 10px',
                    borderRadius: 14,
                    border: `2.5px solid ${type === val ? theme.colors.primary : palette.cardBorder}`,
                    background: type === val
                      ? isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)'
                      : palette.inputBg,
                    cursor: 'pointer',
                    fontFamily: theme.font.family,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.2s',
                    transform: type === val ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: type === val ? `0 4px 16px rgba(37,99,235,0.2)` : 'none',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: type === val ? 800 : 500, color: type === val ? theme.colors.primary : palette.text }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: type === val ? theme.colors.primary : palette.textMuted }}>{formatGNF(prix)} / L</span>
                  <span style={{ fontSize: 10, color: palette.textMuted }}>{formatLitres(qty)} dispo</span>
                </button>
              ))}
            </div>

            {/* Input litres — TRÈS GRAND */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quantité en litres
              </div>
              <input
                type="number" min="0.1" step="0.1" placeholder="0"
                value={litres}
                onChange={e => { setLitres(e.target.value); setErrors({}) }}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
                onBlur={e  => { e.target.style.borderColor = errors.litres ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 70, background: palette.inputBg, border: `2px solid ${errors.litres ? theme.colors.danger : palette.cardBorder}`, borderRadius: 14, padding: '0 16px', fontSize: 36, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono, outline: 'none', transition: 'all 0.2s', textAlign: 'center', letterSpacing: '-1px' }}
              />
              {errors.litres && <div style={{ fontSize: 11, color: theme.colors.danger, marginTop: 4, textAlign: 'center' }}>{errors.litres}</div>}
            </div>

            {/* Montant auto — carte animée */}
            <div style={{
              background: litresNum > 0
                ? isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)'
                : palette.inputBg,
              border: `2px solid ${litresNum > 0 ? theme.colors.primary : palette.cardBorder}`,
              borderRadius: 14, padding: '14px', marginBottom: 18, textAlign: 'center',
              transition: 'all 0.3s',
              transform: litresNum > 0 ? 'scale(1.01)' : 'scale(1)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Montant à encaisser
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: litresNum > 0 ? theme.colors.primary : palette.textMuted, fontFamily: theme.font.mono, letterSpacing: '-1px', transition: 'all 0.3s' }}>
                {litresNum > 0 ? formatGNF(montantAuto) : '— GNF'}
              </div>
              {litresNum > 0 && (
                <div style={{ fontSize: 11, color: palette.textSub, marginTop: 5 }}>
                  {litresNum} L × {formatGNF(prixLitre)}
                </div>
              )}
            </div>

            {/* Bouton confirmer */}
            <button type="submit" disabled={venteLoading || !litresNum}
              style={{
                width: '100%', height: 56,
                background: venteLoading || !litresNum
                  ? isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
                  : `linear-gradient(135deg, ${theme.colors.primary}, #1D4ED8)`,
                border: 'none', borderRadius: 14,
                fontSize: 16, fontWeight: 800,
                color: venteLoading || !litresNum ? palette.textMuted : '#fff',
                cursor: venteLoading || !litresNum ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: theme.font.family,
                boxShadow: !litresNum ? 'none' : '0 6px 24px rgba(37,99,235,0.4)',
                transition: 'all 0.3s',
                transform: litresNum > 0 && !venteLoading ? 'scale(1)' : 'scale(0.99)',
              }}
              onMouseEnter={e => { if (litresNum && !venteLoading) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.5)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = litresNum ? '0 6px 24px rgba(37,99,235,0.4)' : 'none' }}
            >
              {venteLoading
                ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              }
              {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
            </button>
          </form>
        </div>

        {/* Confirmation animée */}
        {success && lastVente && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '14px 18px', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, animation: 'slideUp 0.4s ease' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>✅ Vente enregistrée !</div>
              <div style={{ fontSize: 11, color: palette.textSub }}>
                {formatLitres(lastVente.litres)} {lastVente.type} · <strong style={{ color: theme.colors.primary }}>{formatGNF(lastVente.montant_gnf)}</strong> · {formatRelative(lastVente.created_at)}
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}