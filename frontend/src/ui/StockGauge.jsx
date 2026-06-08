// ================================================
// FUELO V2 — StockGauge premium
// Fichier : frontend/src/ui/StockGauge.jsx
// ================================================

import { memo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { getStockStatus, formatLitres } from '../utils/format'
import theme from '../config/theme'

const StockGauge = memo(function StockGauge({
  label,
  quantite  = 0,
  seuil     = 300,
  onAction,
  actionLabel = 'Commander',
  derniereMaj,
}) {
  const { palette, isDark } = useTheme()
  const qty    = parseFloat(quantite) || 0
  const max    = Math.max(qty * 1.5, seuil * 2, 1000)
  const pct    = max > 0 ? Math.min((qty / max) * 100, 100) : 0
  const status = getStockStatus(qty, seuil)
  const critique = qty > 0 && qty <= seuil

  return (
    <div style={{
      background:   isDark ? palette.glass : palette.card,
      backdropFilter: isDark ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
      border:       `1px solid ${palette.cardBorder}`,
      borderRadius: theme.radius.card,
      padding:      '22px 24px',
      boxShadow:    isDark ? theme.shadow.premium : theme.shadow.sm,
      transition:   theme.transition.hover,
      position:     'relative', overflow: 'hidden',
    }}>
      {/* Lueur de fond colorée selon le niveau */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: status.color, opacity: isDark ? 0.08 : 0.05, filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, position: 'relative' }}>
        <div>
          <div style={{
            fontSize:      theme.font.size.xs,
            fontWeight:    theme.font.weight.semi,
            color:         palette.textSub,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom:  6,
          }}>
            {label}
          </div>
          <div style={{
            fontSize:     theme.font.size['3xl'],
            fontWeight:   theme.font.weight.black,
            color:        palette.text,
            letterSpacing:'-1px',
            fontFamily:   theme.font.mono,
            lineHeight:   1,
          }}>
            {qty.toLocaleString('fr-FR')}
            <span style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.normal, color: palette.textSub, marginLeft: 6 }}>
              litres
            </span>
          </div>
          {derniereMaj && (
            <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 6 }}>
              Dernière mise à jour : {derniereMaj}
            </div>
          )}
        </div>

        {/* Badge statut */}
        <div style={{
          background:   `${status.color}18`,
          border:       `1px solid ${status.color}35`,
          borderRadius: theme.radius.full,
          padding:      '4px 12px',
          boxShadow:    critique ? `0 0 0 1px ${status.color}30, 0 4px 16px ${status.color}25` : 'none',
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

      {/* Barre de niveau animée */}
      <div style={{
        background:   palette.hover,
        borderRadius: theme.radius.full,
        height:       12,
        overflow:     'hidden',
        marginBottom: 10,
        position:     'relative',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{
            height:       '100%',
            background:   `linear-gradient(90deg, ${status.color}80, ${status.color})`,
            borderRadius: theme.radius.full,
            boxShadow:    `0 0 12px ${status.color}60`,
          }}
        />
      </div>

      {/* Légende */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        fontSize:       theme.font.size.xs,
        color:          palette.textMuted,
        marginBottom:   critique ? 14 : 0,
      }}>
        <span>0 L</span>
        <span style={{ color: palette.textSub }}>Seuil : {formatLitres(seuil)}</span>
        <span>{formatLitres(max)}</span>
      </div>

      {/* Alerte critique */}
      {critique && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          gap:          12,
          marginTop:    14,
          background:   `${theme.colors.danger}12`,
          border:       `1px solid ${theme.colors.danger}28`,
          borderRadius: theme.radius.md,
          padding:      '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.danger, flexShrink: 0, boxShadow: `0 0 8px ${theme.colors.danger}`, animation: 'pulse 1.5s infinite' }} />
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
                transition:   theme.transition.hover,
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
          background:   palette.hover,
          border:       `1px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.md,
          padding:      '10px 14px',
          fontSize:     theme.font.size.xs,
          color:        palette.textSub,
          textAlign:    'center',
        }}>
          Aucun stock enregistré
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.5; transform: scale(1.4); } }`}</style>
    </div>
  )
})

export default StockGauge
