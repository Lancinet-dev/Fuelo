// ================================================
// FUELO V2 — StatCard
// Fichier : frontend/src/ui/StatCard.jsx
// ================================================

import { memo } from 'react'
import theme from '../config/theme'

const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  icon,
  color = theme.colors.primary,
  trend,      // '+12%' ou '-5%'
  trendUp,    // true = vert, false = rouge
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background:    theme.colors.card,
        border:        `1px solid ${theme.colors.cardBorder}`,
        borderRadius:  theme.radius.lg,
        padding:       '20px 22px',
        display:       'flex',
        flexDirection: 'column',
        gap:           12,
        boxShadow:     theme.shadow.sm,
        cursor:        onClick ? 'pointer' : 'default',
        transition:    theme.transition.fast,
      }}
      onMouseEnter={e => {
        if (onClick) e.currentTarget.style.boxShadow = theme.shadow.md
      }}
      onMouseLeave={e => {
        if (onClick) e.currentTarget.style.boxShadow = theme.shadow.sm
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize:      theme.font.size.xs,
          fontWeight:    theme.font.weight.semi,
          color:         theme.colors.textSub,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {label}
        </span>

        {icon && (
          <div style={{
            width:          34,
            height:         34,
            borderRadius:   theme.radius.md,
            background:     `${color}18`,
            border:         `1px solid ${color}25`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          </div>
        )}
      </div>

      {/* Valeur */}
      <div style={{
        fontSize:    theme.font.size['3xl'],
        fontWeight:  theme.font.weight.black,
        color:       theme.colors.text,
        letterSpacing: '-1px',
        fontFamily:  theme.font.mono,
        lineHeight:  1,
      }}>
        {value}
      </div>

      {/* Footer */}
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sub && (
            <span style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
              {sub}
            </span>
          )}
          {trend && (
            <span style={{
              fontSize:     theme.font.size.xs,
              fontWeight:   theme.font.weight.semi,
              color:        trendUp ? theme.colors.success : theme.colors.danger,
              background:   trendUp ? theme.colors.successLight : theme.colors.dangerLight,
              padding:      '2px 8px',
              borderRadius: theme.radius.full,
            }}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

export default StatCard