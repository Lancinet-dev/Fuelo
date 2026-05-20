// ================================================
// FUELO V2 — Stock
// Fichier : frontend/src/features/stock/Stock.jsx
// ================================================

import { useState } from 'react'
import { useStock }    from '../../hooks/useStock'
import StockGauge      from '../../ui/StockGauge'
import { SkeletonStockGauge, SkeletonStyle } from '../../ui/Skeleton'
import { formatLitres } from '../../utils/format'
import theme from '../../config/theme'

export default function Stock() {
  const { essence, gasoil, loading, livraisonLoading, ajouterLivraison } = useStock()

  const [type,     setType]     = useState('essence')
  const [quantite, setQuantite] = useState('')

  const preview = (type === 'essence' ? essence : gasoil) + (parseFloat(quantite) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const qty = parseFloat(quantite)
    if (!qty || qty <= 0) return
    await ajouterLivraison({ type, quantite: qty })
    setQuantite('')
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-stock">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Gestion du stock
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, margin: 0 }}>
          Niveaux en temps réel — enregistrez vos livraisons ici
        </p>
      </div>

      {/* Jauges */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="fuelo-grid-2">
            <SkeletonStockGauge />
            <SkeletonStockGauge />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="fuelo-grid-2">
          <StockGauge label="Essence" quantite={essence} />
          <StockGauge label="Gasoil"  quantite={gasoil}  />
        </div>
      )}

      {/* Formulaire livraison */}
      <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '26px 28px', maxWidth: 520, boxShadow: theme.shadow.sm }}>
        <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: 4 }}>
          Enregistrer une livraison
        </div>
        <div style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, marginBottom: 24 }}>
          Le stock sera mis à jour automatiquement
        </div>

        <form onSubmit={handleSubmit}>

          {/* Choix type */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Type de carburant
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[{ val: 'essence', emoji: '⛽' }, { val: 'gasoil', emoji: '🛢️' }].map(({ val, emoji }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  style={{
                    padding:      '12px',
                    borderRadius: theme.radius.md,
                    border:       `1.5px solid ${type === val ? theme.colors.primary : theme.colors.cardBorder}`,
                    background:   type === val ? theme.colors.primaryLight : '#F9FAFB',
                    color:        type === val ? theme.colors.primary : theme.colors.textSub,
                    fontFamily:   theme.font.family,
                    fontSize:     theme.font.size.md,
                    fontWeight:   type === val ? theme.font.weight.bold : theme.font.weight.normal,
                    cursor:       'pointer',
                    textTransform:'capitalize',
                    transition:   theme.transition.fast,
                  }}
                >
                  {emoji} {val}
                </button>
              ))}
            </div>
          </div>

          {/* Quantité */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Quantité reçue (litres)
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="Ex: 2000"
                value={quantite}
                onChange={e => setQuantite(e.target.value)}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e =>  { e.target.style.borderColor = theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{
                  width:        '100%',
                  height:       52,
                  background:   '#F9FAFB',
                  border:       `1.5px solid ${theme.colors.cardBorder}`,
                  borderRadius: theme.radius.md,
                  padding:      '0 70px 0 16px',
                  fontSize:     18,
                  fontWeight:   theme.font.weight.bold,
                  color:        theme.colors.text,
                  fontFamily:   theme.font.mono,
                  outline:      'none',
                  transition:   theme.transition.fast,
                }}
              />
              <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.textMuted, pointerEvents: 'none' }}>
                Litres
              </span>
            </div>

            {/* Aperçu stock après livraison */}
            {quantite && parseFloat(quantite) > 0 && (
              <div style={{ marginTop: 8, fontSize: theme.font.size.sm, color: theme.colors.success, fontWeight: theme.font.weight.semi }}>
                Stock {type} après livraison : <strong>{formatLitres(preview)}</strong>
              </div>
            )}
          </div>

          {/* Bouton soumettre */}
          <button
            type="submit"
            disabled={livraisonLoading || !quantite || parseFloat(quantite) <= 0}
            style={{
              width:          '100%',
              height:         50,
              background:     livraisonLoading ? theme.colors.primaryDark : theme.colors.primary,
              border:         'none',
              borderRadius:   theme.radius.md,
              fontSize:       theme.font.size.base,
              fontWeight:     theme.font.weight.bold,
              color:          '#0F172A',
              cursor:         livraisonLoading || !quantite ? 'not-allowed' : 'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            8,
              fontFamily:     theme.font.family,
              boxShadow:      theme.shadow.primary,
              transition:     theme.transition.fast,
              opacity:        !quantite || parseFloat(quantite) <= 0 ? 0.6 : 1,
            }}
          >
            {livraisonLoading ? (
              <div style={{ width: 18, height: 18, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            )}
            {livraisonLoading ? 'Enregistrement...' : 'Confirmer la livraison'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .fuelo-stock  { padding: 20px 16px !important; }
          .fuelo-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}