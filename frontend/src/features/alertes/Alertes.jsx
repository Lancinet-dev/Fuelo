// ================================================
// FUELO V2 — Alertes premium (glassmorphism)
// Fichier : frontend/src/features/alertes/Alertes.jsx
// ================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAlertes }   from '../../hooks/useAlertes'
import { useTheme }     from '../../context/ThemeContext'
import StatCard         from '../../ui/StatCard'
import EmptyState       from '../../ui/EmptyState'
import { SkeletonStatCard, SkeletonStyle } from '../../ui/Skeleton'
import { formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const TYPE_CONFIG = {
  STOCK_FAIBLE:   { color: theme.colors.danger,   bg: theme.colors.dangerLight,   label: 'Stock faible'     },
  FRAUDE:         { color: '#DC2626',              bg: 'rgba(220,38,38,0.10)',     label: 'Fraude pompiste'  },
  FRAUDE_CITERNE: { color: '#DC2626',              bg: 'rgba(220,38,38,0.10)',     label: 'Fraude citerne'   },
  ARRET_SUSPECT:  { color: '#D97706',              bg: 'rgba(217,119,6,0.10)',     label: 'Arrêt suspect'    },
  ANOMALIE:       { color: theme.colors.warning,   bg: theme.colors.warningLight,  label: 'Anomalie'         },
  DEFAULT:        { color: theme.colors.info,      bg: theme.colors.infoLight,     label: 'Information'      },
}

function AlertIcon({ type, color, size = 20 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'STOCK_FAIBLE') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
  if (type === 'FRAUDE') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  )
  if (type === 'FRAUDE_CITERNE') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
  if (type === 'ARRET_SUSPECT') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/>
    </svg>
  )
  if (type === 'ANOMALIE') return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}

const ICONS = {
  alertes: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  check:   'M20 6L9 17l-5-5',
}

const FILTERS = [
  { val: 'toutes', label: 'Toutes' },
  { val: 'non_lues', label: 'Non lues' },
  { val: 'lues', label: 'Lues' },
]

export default function Alertes() {
  const { palette, isDark } = useTheme()
  const { alertes, nonLues, loading, marquerLue, marquerToutesLues } = useAlertes()
  const [filter, setFilter] = useState('toutes')

  const lues = alertes.length - nonLues
  const cfg  = (type) => TYPE_CONFIG[type] ?? TYPE_CONFIG.DEFAULT

  const filtered = alertes.filter(a => {
    if (filter === 'non_lues') return !a.lu
    if (filter === 'lues')     return a.lu
    return true
  })

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-alertes">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            Alertes
            {nonLues > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, background: theme.colors.danger, color: '#fff', borderRadius: theme.radius.full, padding: '2px 10px', boxShadow: '0 0 0 1px rgba(239,68,68,0.3), 0 4px 14px rgba(239,68,68,0.4)' }}>
                {nonLues}
              </motion.span>
            )}
          </h1>
          <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
            {alertes.length} alerte{alertes.length > 1 ? 's' : ''} au total
          </p>
        </div>

        {nonLues > 0 && (
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => marquerToutesLues()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: theme.radius.button, border: `1px solid ${theme.colors.success}30`, background: `${theme.colors.success}10`, color: theme.colors.success, cursor: 'pointer', fontSize: theme.font.size.md, fontFamily: theme.font.family, fontWeight: theme.font.weight.semi, transition: theme.transition.hover }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 0 1px ${theme.colors.success}30, 0 8px 22px ${theme.colors.success}22`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.check} /></svg>
            Tout marquer comme lu
          </motion.button>
        )}
      </div>

      {/* Stats */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
          <StatCard label="Total alertes" value={String(alertes.length)} icon={ICONS.alertes} color={palette.textSub} />
          <StatCard label="Non lues"      value={String(nonLues)}        icon={ICONS.alertes} color={nonLues > 0 ? theme.colors.danger : theme.colors.success} />
          <StatCard label="Lues"          value={String(lues)}           icon={ICONS.check}   color={theme.colors.success} />
        </div>
      )}

      {/* Filtres */}
      {!loading && alertes.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(({ val, label }) => {
            const active = filter === val
            const count  = val === 'toutes' ? alertes.length : val === 'non_lues' ? nonLues : lues
            return (
              <motion.button key={val} whileTap={{ scale: 0.95 }} onClick={() => setFilter(val)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: theme.radius.full, border: `1px solid ${active ? theme.colors.primary : palette.cardBorder}`, background: active ? theme.colors.primaryLight : palette.card, color: active ? theme.colors.primary : palette.textSub, fontSize: theme.font.size.sm, fontWeight: active ? theme.font.weight.semi : theme.font.weight.normal, cursor: 'pointer', fontFamily: theme.font.family, transition: theme.transition.hover, boxShadow: active ? '0 0 0 1px rgba(37,99,235,0.2), 0 4px 14px rgba(37,99,235,0.18)' : 'none' }}>
                {label}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: active ? 'rgba(37,99,235,0.18)' : palette.hover, color: active ? theme.colors.primary : palette.textMuted }}>
                  {count}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Liste alertes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: '18px 22px', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: theme.radius.md, background: palette.hover, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ width: 80,   height: 11, background: palette.hover, borderRadius: 4 }} />
                <div style={{ width: '70%', height: 14, background: palette.hover, borderRadius: 4 }} />
                <div style={{ width: 100,  height: 10, background: palette.hover, borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : alertes.length === 0 ? (
          <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, boxShadow: theme.shadow.sm }}>
            <EmptyState type="alertes" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: '40px 24px', textAlign: 'center', fontSize: theme.font.size.md, color: palette.textSub }}>
            Aucune alerte dans cette catégorie.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((alerte, i) => {
              const c = cfg(alerte.type)
              const unread = !alerte.lu
              return (
                <motion.div
                  key={alerte.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.25 }}
                  style={{
                    background: unread ? (isDark ? `${c.color}0F` : c.bg) : (isDark ? palette.glass : palette.card),
                    backdropFilter: isDark ? 'blur(20px)' : 'none',
                    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
                    border: `1px solid ${unread ? c.color + '35' : palette.cardBorder}`,
                    borderRadius: theme.radius.card, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: theme.transition.hover,
                    boxShadow: unread ? `0 0 0 1px ${c.color}20, 0 8px 26px ${c.color}1A` : (isDark ? theme.shadow.premium : theme.shadow.sm),
                  }}>

                  <div style={{ width: 44, height: 44, borderRadius: theme.radius.md, background: unread ? `${c.color}18` : palette.hover, border: `1px solid ${unread ? c.color + '35' : palette.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                    {unread && <div style={{ position: 'absolute', inset: -1, borderRadius: theme.radius.md, border: `1.5px solid ${c.color}`, opacity: 0.5, animation: 'ringPulse 2s infinite' }} />}
                    <AlertIcon type={alerte.type} color={unread ? c.color : palette.textMuted} size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color: unread ? c.color : palette.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {c.label}
                      </span>
                      {unread && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block', boxShadow: `0 0 6px ${c.color}`, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: theme.font.size.md, fontWeight: unread ? theme.font.weight.semi : theme.font.weight.normal, color: unread ? palette.text : palette.textSub, marginBottom: 4 }}>
                      {alerte.message}
                    </div>
                    <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>
                      {formatRelative(alerte.created_at)}
                    </div>
                  </div>

                  {unread ? (
                    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => marquerLue(alerte.id)}
                      style={{ padding: '7px 14px', borderRadius: theme.radius.button, border: `1px solid ${c.color}40`, background: 'transparent', color: c.color, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, cursor: 'pointer', fontFamily: theme.font.family, whiteSpace: 'nowrap', transition: theme.transition.hover, flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${c.color}12` }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                      Marquer lue
                    </motion.button>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.check} /></svg>
                      <span style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>Lu</span>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.5 } 70% { transform: scale(1.12); opacity: 0 } 100% { transform: scale(1.12); opacity: 0 } }
        @media (max-width: 768px) {
          .fuelo-alertes { padding: 20px 16px !important; }
          .fuelo-grid-3  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .fuelo-grid-3  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
