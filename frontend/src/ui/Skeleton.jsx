// ================================================
// FUELO V2 — Skeleton
// Fichier : frontend/src/ui/Skeleton.jsx
// ================================================

import { memo } from 'react'
import theme from '../config/theme'

// ── Bloc shimmer de base ──────────────────────────────
const Shimmer = memo(function Shimmer({ width = '100%', height = 16, radius = theme.radius.sm, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background:   'linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%)',
      backgroundSize: '200% 100%',
      animation:    'shimmer 1.5s infinite',
      flexShrink:   0,
      ...style,
    }} />
  )
})

// ── Skeleton StatCard ─────────────────────────────────
export const SkeletonStatCard = memo(function SkeletonStatCard() {
  return (
    <div style={{
      background:   theme.colors.card,
      border:       `1px solid ${theme.colors.cardBorder}`,
      borderRadius: theme.radius.lg,
      padding:      '20px 22px',
      boxShadow:    theme.shadow.sm,
      display:      'flex',
      flexDirection:'column',
      gap:          12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Shimmer width={80} height={11} />
        <Shimmer width={34} height={34} radius={theme.radius.md} />
      </div>
      <Shimmer width={120} height={28} />
      <Shimmer width={100} height={11} />
    </div>
  )
})

// ── Skeleton StockGauge ───────────────────────────────
export const SkeletonStockGauge = memo(function SkeletonStockGauge() {
  return (
    <div style={{
      background:   theme.colors.card,
      border:       `1px solid ${theme.colors.cardBorder}`,
      borderRadius: theme.radius.lg,
      padding:      '22px 24px',
      boxShadow:    theme.shadow.sm,
      display:      'flex',
      flexDirection:'column',
      gap:          16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Shimmer width={70} height={11} />
          <Shimmer width={130} height={32} />
        </div>
        <Shimmer width={72} height={26} radius={theme.radius.full} />
      </div>
      <Shimmer width="100%" height={12} radius={theme.radius.full} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Shimmer width={28} height={10} />
        <Shimmer width={80} height={10} />
        <Shimmer width={40} height={10} />
      </div>
    </div>
  )
})

// ── Skeleton ligne de tableau ─────────────────────────
export const SkeletonRow = memo(function SkeletonRow({ cols = 5 }) {
  return (
    <div style={{
      display:     'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap:         12,
      padding:     '14px 22px',
      borderBottom:`1px solid ${theme.colors.cardBorder}`,
      alignItems:  'center',
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Shimmer key={i} width={i === 0 ? 40 : '80%'} height={12} />
      ))}
    </div>
  )
})

// ── Skeleton Dashboard complet ────────────────────────
export const SkeletonDashboard = memo(function SkeletonDashboard() {
  return (
    <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Shimmer width={200} height={22} />
          <Shimmer width={140} height={13} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Shimmer width={100} height={38} radius={theme.radius.md} />
          <Shimmer width={130} height={38} radius={theme.radius.md} />
        </div>
      </div>

      {/* Stock gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SkeletonStockGauge />
        <SkeletonStockGauge />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Graphique */}
      <div style={{
        background:   theme.colors.card,
        border:       `1px solid ${theme.colors.cardBorder}`,
        borderRadius: theme.radius.lg,
        padding:      '22px 24px',
        boxShadow:    theme.shadow.sm,
        display:      'flex',
        flexDirection:'column',
        gap:          16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Shimmer width={160} height={15} />
            <Shimmer width={100} height={11} />
          </div>
          <Shimmer width={80} height={20} radius={theme.radius.full} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
          {[55, 80, 45, 90, 65, 75, 60].map((h, i) => (
            <Shimmer key={i} style={{ flex: 1 }} height={`${h}%`} radius={`${theme.radius.sm} ${theme.radius.sm} 0 0`} />
          ))}
        </div>
      </div>
    </div>
  )
})

// ── Style global shimmer ──────────────────────────────
export const SkeletonStyle = () => (
  <style>{`
    @keyframes shimmer {
      0%   { background-position:  200% 0; }
      100% { background-position: -200% 0; }
    }
  `}</style>
)

export default Shimmer