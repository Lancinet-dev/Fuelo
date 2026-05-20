// ================================================
// FUELO V2 — StockGauge
// Fichier : frontend/src/ui/StockGauge.jsx
// ================================================

import { memo } from 'react'
import { getStockStatus, formatLitres } from '../utils/format'
import theme from '../config/theme'

const StockGauge = memo(function StockGauge({
  label,
  quantite  = 0,
  seuil     = 300,
  onAction,
  actionLabel = 'Commander',
}) {
  const qty    = parseFloat(quantite) || 0
  const max    = Math.max(qty * 1.5, seuil * 2, 1000)
  const pct    = max > 0 ? Math.min((qty / max) * 100, 100) : 0
  const status = getStockStatus(qty, seuil)

  return (
    <div style={{
      background:   theme.colors.card,
      border:       `1px solid ${theme.colors.cardBorder}`,
      borderRadius: theme.radius.lg,
      padding:      '22px 24px',
      boxShadow:    theme.shadow.sm,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{
            fontSize:      theme.font.size.xs,
            fontWeight:    theme.font.weight.semi,
            color:         theme.colors.textSub,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom:  6,
          }}>
            {label}
          </div>
          <div style={{
            fontSize:     theme.font.size['3xl'],
            fontWeight:   theme.font.weight.black,
            color:        theme.colors.text,
            letterSpacing:'-1px',
            fontFamily:   theme.font.mono,
            lineHeight:   1,
          }}>
            {qty.toLocaleString('fr-FR')}
            <span style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.normal, color: theme.colors.textSub, marginLeft: 6 }}>
              litres
            </span>
          </div>
        </div>

        {/* Badge statut */}
        <div style={{
          background:   status.bg,
          border:       `1px solid ${status.color}30`,
          borderRadius: theme.radius.full,
          padding:      '4px 12px',
        }}>
          <span style={{
            fontSize:      theme.font.size.xs,
            fontWeight:    theme.font.weight.bold,
            color:         status.color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Barre de niveau */}
      <div style={{
        background:   '#F3F4F6',
        borderRadius: theme.radius.full,
        height:       12,
        overflow:     'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          width:        `${pct}%`,
          height:       '100%',
          background:   `linear-gradient(90deg, ${status.color}80, ${status.color})`,
          borderRadius: theme.radius.full,
          transition:   'width 1.2s ease',
        }} />
      </div>

      {/* Légende */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        fontSize:       theme.font.size.xs,
        color:          theme.colors.textMuted,
        marginBottom:   qty <= seuil && qty > 0 ? 14 : 0,
      }}>
        <span>0 L</span>
        <span style={{ color: theme.colors.textSub }}>Seuil : {formatLitres(seuil)}</span>
        <span>{formatLitres(max)}</span>
      </div>

      {/* Alerte critique */}
      {qty > 0 && qty <= seuil && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          gap:          12,
          marginTop:    14,
          background:   theme.colors.dangerLight,
          border:       `1px solid ${theme.colors.danger}25`,
          borderRadius: theme.radius.md,
          padding:      '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.danger, flexShrink: 0 }} />
            <span style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, fontWeight: theme.font.weight.semi }}>
              Stock critique — commandez maintenant
            </span>
          </div>
          {onAction && (
            <button
              onClick={onAction}
              style={{
                padding:      '5px 12px',
                borderRadius: theme.radius.md,
                border:       `1px solid ${theme.colors.danger}40`,
                background:   'transparent',
                color:        theme.colors.danger,
                fontSize:     theme.font.size.xs,
                fontWeight:   theme.font.weight.semi,
                cursor:       'pointer',
                fontFamily:   theme.font.family,
                whiteSpace:   'nowrap',
                transition:   theme.transition.fast,
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}

      {/* Stock vide */}
      {qty <= 0 && (
        <div style={{
          marginTop:    14,
          background:   '#F9FAFB',
          border:       `1px solid ${theme.colors.cardBorder}`,
          borderRadius: theme.radius.md,
          padding:      '10px 14px',
          fontSize:     theme.font.size.xs,
          color:        theme.colors.textSub,
          textAlign:    'center',
        }}>
          Aucun stock enregistré
        </div>
      )}
    </div>
  )
})

export default StockGauge