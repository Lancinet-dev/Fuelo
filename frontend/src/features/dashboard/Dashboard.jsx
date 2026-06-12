// ================================================
// FUELO V2.3 — Dashboard (owner premium + gérant)
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth }      from '../../context/AuthContext'
import { useTheme }     from '../../context/ThemeContext'
import { useDashboard, useGraphique, calcTrend } from '../../hooks/useDashboard'
import { useVentes }    from '../../hooks/useVentes'
import { useEmployes }  from '../../hooks/useEmployes'
import { useNotifications } from '../../hooks/useNotifications'
import { usePlan } from '../../hooks/usePlan'
import EmptyState       from '../../ui/EmptyState'
import { SkeletonDashboard, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatRelative, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

const ICONS = {
  ventes:        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  trend:         'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  alertes:       'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  stock:         'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  employes:      'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z',
  equipe:        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  refresh:       'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  eye:           'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6',
  chevron:       'M9 18l6-6-6-6',
  abonnements:   'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  stations:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  essence:       'M5 3h14a2 2 0 012 2v6h-4V5H7v6H3V5a2 2 0 012-2zM3 11h18v2a2 2 0 01-2 2h-1v4a1 1 0 01-1 1H7a1 1 0 01-1-1v-4H5a2 2 0 01-2-2v-2z',
  crown:         'M5 20l3-9 4 6 4-6 3 9M3 20h18',
}

function Icon({ d, size = 14, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

// ── Compteur animé (count-up à l'affichage) ───────
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0)
  const targetRef = useRef(0)
  useEffect(() => {
    targetRef.current = Number(target) || 0
    const start = performance.now()
    let raf
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(targetRef.current * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ── Horloge temps réel ────────────────────────────
function LiveClock({ palette }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: theme.font.mono, fontSize: 12, fontWeight: 700, color: palette.textSub, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}>
      {now.toLocaleTimeString('fr-FR')}
    </span>
  )
}

// ── Avatar (initiales) ────────────────────────────
function Avatar({ nom, color = theme.colors.primary, size = 38 }) {
  const initial = nom?.trim()?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '20', border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 800, color,
    }}>
      {initial}
    </div>
  )
}

// ── Bouton notifications + badge rouge ────────────
function NotifBell({ count, onClick, palette }) {
  return (
    <button onClick={onClick} title="Notifications" style={{
      position: 'relative', width: 38, height: 38, borderRadius: 12, flexShrink: 0,
      border: `1px solid ${palette.cardBorder}`, background: palette.card,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: theme.transition.hover, boxShadow: theme.shadow.sm,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary + '60'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.transform = 'translateY(0)' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={palette.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 99,
          background: theme.colors.danger, color: '#fff', fontSize: 9, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          boxShadow: `0 0 0 2px ${palette.bg}, 0 0 8px ${theme.colors.danger}80`,
          animation: 'pulse 1.8s infinite',
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

// ── Badge de tendance (↑/↓ pourcentage) ───────────
function TrendBadge({ trend }) {
  if (!trend) return null
  const color = trend.up ? theme.colors.success : theme.colors.danger
  const bg    = trend.up ? theme.colors.successLight : theme.colors.dangerLight
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 800, color, background: bg,
      padding: '2px 8px', borderRadius: 99, fontFamily: theme.font.mono,
    }}>
      {trend.up ? '↑' : '↓'} {trend.pct}%
    </span>
  )
}

// ── Toggle période graphique (7j / 30j / 3 mois) ──
function PeriodToggle({ value, onChange, palette, isDark }) {
  const options = [{ key: '7j', label: '7 jours' }, { key: '30j', label: '30 jours' }, { key: '3m', label: '3 mois' }]
  return (
    <div style={{ display: 'inline-flex', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)} style={{
          padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: theme.transition.hover,
          background: value === opt.key ? theme.colors.primary : 'transparent',
          color: value === opt.key ? '#fff' : palette.textSub,
          boxShadow: value === opt.key ? theme.shadow.primary : 'none',
        }}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Jauge circulaire animée (stock) ───────────────
function CircularGauge({ label, quantite, seuil = 300, onAction, actionLabel, palette, isDark }) {
  const qty    = parseFloat(quantite) || 0
  const max    = Math.max(qty * 1.5, seuil * 2, 1000)
  const pct    = max > 0 ? Math.min((qty / max) * 100, 100) : 0
  const status = getStockStatus(qty, seuil)
  const animatedPct = useCountUp(pct, 1400)

  const size = 116, stroke = 11
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(animatedPct, 100) / 100) * circumference

  return (
    <div style={{
      background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16,
      padding: '20px 22px', boxShadow: theme.shadow.sm,
      display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={status.color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke 0.4s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px' }}>{Math.round(animatedPct)}%</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: status.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{status.label}</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 10 }}>
          {formatLitres(qty)}
        </div>
        {onAction && (
          <button onClick={onAction} style={{
            fontSize: 11, fontWeight: 700, color: theme.colors.primary, background: theme.colors.primaryLight,
            border: `1px solid ${theme.colors.primary}30`, borderRadius: 99, padding: '5px 14px',
            cursor: 'pointer', fontFamily: 'inherit', transition: theme.transition.hover,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = theme.colors.primary; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.colors.primaryLight; e.currentTarget.style.color = theme.colors.primary }}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Tooltip graphique ─────────────────────────────
function ChartTooltip({ active, payload, label, palette }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: theme.shadow.md }}>
      <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.font.mono }}>
        {formatGNF(payload[0]?.value * 1_000_000)}
      </div>
    </div>
  )
}

// ── Carte KPI ─────────────────────────────────────
function StatCard({ label, value, numericValue, formatFn, sub, iconD, color, onClick, pulse, trend }) {
  const { palette } = useTheme()
  const animated = useCountUp(numericValue ?? 0)
  const display  = (numericValue != null && formatFn) ? formatFn(animated) : value
  return (
    <div onClick={onClick} style={{
      background: palette.card, border: `1px solid ${palette.cardBorder}`,
      borderRadius: 16, padding: '18px 20px',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: theme.shadow.sm, transition: theme.transition.hover,
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = `${theme.shadow.md}, 0 0 0 1px ${color}35, 0 0 26px ${color}26`; e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = theme.shadow.sm; e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, position: 'relative', background: color + '15', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {pulse && <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: color, top: -3, right: -3, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.5s infinite' }} />}
          <Icon d={iconD} size={18} color={color} />
        </div>
        {trend ? <TrendBadge trend={trend} /> : (onClick && <Icon d={ICONS.chevron} size={13} color={palette.textMuted} />)}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
        {display}
      </div>
      <div style={{ fontSize: 11, color: palette.textSub, lineHeight: 1.4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ── Ligne vente (desktop) ─────────────────────────
function VenteRow({ vente, isLast, palette }) {
  const isEssence = vente.type === 'essence'
  const color     = isEssence ? theme.colors.warning : theme.colors.info
  const initial   = vente.employe_nom?.trim()?.charAt(0)?.toUpperCase() ?? 'P'
  return (
    <div className="vente-row"
      style={{ display: 'grid', gridTemplateColumns: '34px 1fr 80px 110px 85px', alignItems: 'center', padding: '11px 20px', borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}`, gap: 10, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = palette.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar pompiste (initiale, coloré selon le type de carburant) */}
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color }}>
        {initial}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vente.employe_nom ?? 'Pompiste'}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color, background: color + '15', borderRadius: 99, padding: '1px 7px', marginTop: 3, textTransform: 'capitalize' }}>
          {isEssence
            ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
            : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/></svg>
          }
          {vente.type}
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.success, fontFamily: theme.font.mono }}>{formatLitres(vente.litres)}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(vente.montant_gnf)}</div>
      <div style={{ fontSize: 11, color: palette.textSub }}>{formatRelative(vente.created_at)}</div>
    </div>
  )
}

// ── Section performances pompistes (gérant) ───────
function PompistePerf({ palette, isDark }) {
  const navigate = useNavigate()
  const { employes, loading } = useEmployes()

  if (loading) return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, padding: '18px 20px', boxShadow: theme.shadow.sm }}>
      <div style={{ height: 18, background: palette.hover, borderRadius: 6, width: '40%', marginBottom: 16 }} />
      {[1,2,3].map(i => <div key={i} style={{ height: 52, background: palette.hover, borderRadius: 10, marginBottom: 8 }} />)}
    </div>
  )

  const pompistes = employes.filter(e => e.role === 'pompiste')
  if (pompistes.length === 0) return null

  const maxTotal  = Math.max(...pompistes.map(e => Number(e.total_ventes_jour ?? 0)), 1)
  const totalJour = pompistes.reduce((s, e) => s + Number(e.total_ventes_jour ?? 0), 0)

  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}` }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Performance pompistes — aujourd'hui</div>
          <div style={{ fontSize: 11, color: palette.textSub, marginTop: 2 }}>
            Total : <strong style={{ color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(totalJour)}</strong>
          </div>
        </div>
        <button onClick={() => navigate('/employes')} style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          Gérer <Icon d={ICONS.chevron} size={12} color={theme.colors.primary} />
        </button>
      </div>

      <div className="perf-header" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', padding: '8px 20px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', gap: 10 }}>
        {['Pompiste', 'Ventes', 'Montant', 'Activité'].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
        ))}
      </div>

      {pompistes.map((emp, i) => {
        const pct      = maxTotal > 0 ? Math.round((Number(emp.total_ventes_jour ?? 0) / maxTotal) * 100) : 0
        const initial  = emp.nom?.charAt(0)?.toUpperCase() ?? '?'
        const isLast   = i === pompistes.length - 1
        const hasVentes = Number(emp.nb_ventes_jour ?? 0) > 0

        return (
          <div key={emp.id} className="perf-row" style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px',
            padding: '12px 20px', gap: 10, alignItems: 'center',
            borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}`,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = palette.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: hasVentes ? 'rgba(16,185,129,0.12)' : theme.colors.primaryLight,
                border: `1px solid ${hasVentes ? 'rgba(16,185,129,0.25)' : theme.colors.primary + '30'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                color: hasVentes ? theme.colors.success : theme.colors.primary,
              }}>
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nom}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: emp.actif !== false ? theme.colors.success : '#94A3B8', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: palette.textMuted }}>{emp.actif !== false ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: hasVentes ? palette.text : palette.textMuted, fontFamily: theme.font.mono }}>
              {emp.nb_ventes_jour ?? 0}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: hasVentes ? theme.colors.primary : palette.textMuted, fontFamily: theme.font.mono }}>
              {hasVentes ? formatGNF(emp.total_ventes_jour) : '—'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: pct === 100
                    ? `linear-gradient(90deg, ${theme.colors.primary}, #1D4ED8)`
                    : theme.colors.primary,
                  borderRadius: 99, transition: 'width 0.6s ease',
                  opacity: hasVentes ? 1 : 0,
                }} />
              </div>
              <span style={{ fontSize: 10, color: palette.textMuted, minWidth: 28, textAlign: 'right', fontFamily: theme.font.mono }}>
                {hasVentes ? `${pct}%` : '—'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Aperçu équipe (owner uniquement) ─────────────
const MEMBRE_ROLE_COLORS = {
  gerant:      { color: theme.colors.info,    bg: theme.colors.infoLight,    label: 'Gérant'       },
  logisticien: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.10)',   label: 'Logisticien'  },
}

function EquipeApercu({ palette, isDark }) {
  const navigate = useNavigate()
  const { employes, loading } = useEmployes()

  if (loading) return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, padding: '18px 20px', boxShadow: theme.shadow.sm }}>
      <div style={{ height: 18, background: palette.hover, borderRadius: 6, width: '40%', marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, background: palette.hover, borderRadius: 12 }} />)}
      </div>
    </div>
  )

  const membres = employes.filter(e => e.role === 'gerant' || e.role === 'logisticien')
  if (membres.length === 0) return null

  const actifs = membres.filter(e => e.actif !== false).length

  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}` }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Aperçu de l'équipe</div>
          <div style={{ fontSize: 11, color: palette.textSub, marginTop: 2 }}>
            <strong style={{ color: theme.colors.success }}>{actifs}</strong> membre{actifs > 1 ? 's' : ''} actif{actifs > 1 ? 's' : ''} sur {membres.length}
          </div>
        </div>
        <button onClick={() => navigate('/employes')}
          style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          Gérer <Icon d={ICONS.chevron} size={12} color={theme.colors.primary} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, padding: '16px 20px' }}>
        {membres.map(emp => {
          const rc      = MEMBRE_ROLE_COLORS[emp.role] ?? MEMBRE_ROLE_COLORS.gerant
          const initial = emp.nom?.charAt(0)?.toUpperCase() ?? '?'
          const isActif = emp.actif !== false

          return (
            <div key={emp.id} style={{
              border: `1px solid ${isActif ? rc.color + '30' : palette.cardBorder}`,
              borderRadius: 12, padding: '14px',
              background: isActif ? rc.bg : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = theme.shadow.sm }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: isActif ? rc.color + '20' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                  border: `1px solid ${isActif ? rc.color + '40' : palette.cardBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: isActif ? rc.color : palette.textMuted,
                }}>
                  {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.nom}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.color + '15', padding: '2px 8px', borderRadius: 99 }}>
                  {rc.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActif ? theme.colors.success : '#94A3B8' }} />
                  <span style={{ fontSize: 10, color: palette.textMuted }}>{isActif ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Répartition carburant (owner uniquement) ──────
function RepartitionCarburant({ recentes, palette, isDark }) {
  const essenceMontant = recentes.filter(v => v.type === 'essence').reduce((s, v) => s + Number(v.montant_gnf ?? 0), 0)
  const gasoilMontant  = recentes.filter(v => v.type === 'gasoil').reduce((s, v) => s + Number(v.montant_gnf ?? 0), 0)
  const total = essenceMontant + gasoilMontant
  if (total === 0) return null

  const pctEssence = Math.round((essenceMontant / total) * 100)
  const pctGasoil  = 100 - pctEssence

  const barBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, padding: '18px 20px', boxShadow: theme.shadow.sm }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 3 }}>Répartition carburant</div>
        <div style={{ fontSize: 11, color: palette.textSub }}>Basée sur les ventes récentes</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: theme.colors.warningLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>Essence</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.colors.warning, fontFamily: theme.font.mono }}>{pctEssence}%</span>
            <span style={{ fontSize: 10, color: palette.textMuted, marginLeft: 6, fontFamily: theme.font.mono }}>{formatGNF(essenceMontant)}</span>
          </div>
        </div>
        <div style={{ height: 8, background: barBg, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctEssence}%`, background: `linear-gradient(90deg, ${theme.colors.warning}, #FBBF24)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: theme.colors.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.colors.info} strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>Gasoil</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.colors.info, fontFamily: theme.font.mono }}>{pctGasoil}%</span>
            <span style={{ fontSize: 10, color: palette.textMuted, marginLeft: 6, fontFamily: theme.font.mono }}>{formatGNF(gasoilMontant)}</span>
          </div>
        </div>
        <div style={{ height: 8, background: barBg, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctGasoil}%`, background: `linear-gradient(90deg, ${theme.colors.info}, #60A5FA)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      </div>

      {/* Combiné */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: palette.textSub }}>{recentes.length} vente{recentes.length > 1 ? 's' : ''} récente{recentes.length > 1 ? 's' : ''}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono }}>{formatGNF(total)}</span>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────
export default function Dashboard() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const { palette, isDark } = useTheme()

  const userRole = String(user?.role ?? '').toLowerCase()
  const isGerant = userRole === 'gerant' || userRole === 'manager'
  const isOwner  = userRole === 'owner'

  const { stocks, aujourdhui, veille, cemois, alertesNonLues, loading, refetch } = useDashboard()
  const { recentes } = useVentes()
  const { plan, colors: planColors, loading: planLoading } = usePlan()
  const { nonLues: notifsNonLues } = useNotifications()

  const [periode, setPeriode] = useState('7j')
  const { donnees: graphiqueData } = useGraphique(periode)

  const stockEssence = parseFloat(stocks.find(s => s.type === 'essence')?.quantite ?? 0)
  const stockGasoil  = parseFloat(stocks.find(s => s.type === 'gasoil')?.quantite  ?? 0)

  const chartData = graphiqueData.map(d => ({
    jour:    d.label,
    montant: parseFloat(d.montant) / 1_000_000,
  }))

  const periodeLabel = { '7j': '7 derniers jours', '30j': '30 derniers jours', '3m': '3 derniers mois' }[periode]
  const trendVentesJour = calcTrend(aujourdhui.montant, veille.montant)

  if (loading) return (<><SkeletonStyle /><SkeletonDashboard /></>)

  const prenom = user?.nom?.split(' ')[0] ?? (isGerant ? 'Gérant' : 'Propriétaire')

  // Badge plan (owner seulement)
  const planBadge = isOwner && !planLoading ? (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: planColors.bg, border: `1px solid ${planColors.border}`, borderRadius: 99, padding: '3px 12px' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill={planColors.text} stroke="none"><circle cx="12" cy="12" r="10"/></svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: planColors.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Plan {planColors.label ?? plan}
      </span>
    </div>
  ) : null

  // Actions rapides selon rôle
  const actions = isOwner ? [
    { label: 'Gérer les stocks',  sub: 'Niveaux essence & gasoil',   icon: ICONS.stock,       path: '/stock',        color: theme.colors.success },
    { label: 'Voir les alertes',  sub: `${alertesNonLues} non lue${alertesNonLues > 1 ? 's' : ''}`, icon: ICONS.alertes, path: '/alertes', color: alertesNonLues > 0 ? theme.colors.danger : theme.colors.info },
    { label: 'Gérer l\'équipe',   sub: 'Gérants & logisticiens',      icon: ICONS.employes,    path: '/employes',     color: theme.colors.info },
    { label: 'Abonnements',       sub: 'Plans & facturation',         icon: ICONS.abonnements, path: '/abonnements',  color: '#8B5CF6' },
  ] : [
    { label: 'Ajouter livraison', sub: 'Enregistrer réception stock', icon: ICONS.stock,    path: '/stock',    color: theme.colors.success },
    { label: 'Voir les alertes',  sub: `${alertesNonLues} non lue${alertesNonLues > 1 ? 's' : ''}`, icon: ICONS.alertes, path: '/alertes', color: alertesNonLues > 0 ? theme.colors.danger : theme.colors.info },
    { label: 'Mes pompistes',     sub: 'Gérer et créer des comptes',  icon: ICONS.employes, path: '/employes', color: theme.colors.info },
  ]

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }} className="fuelo-dashboard">

      {/* ── Header ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.07)', border: `1px solid ${isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.15)'}`, borderRadius: 99, padding: '3px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.success, boxShadow: `0 0 6px ${theme.colors.success}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.primary, letterSpacing: '0.04em' }}>En ligne</span>
            </div>
            {planBadge}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: palette.text, letterSpacing: '-0.6px', margin: 0, marginBottom: 5, lineHeight: 1.1 }}>
            Bonjour, {prenom} 👋
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: palette.textSub, margin: 0, textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: palette.textMuted }} />
            <LiveClock palette={palette} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={refetch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: palette.textSub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: theme.shadow.sm, transition: theme.transition.hover }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary + '60'; e.currentTarget.style.color = theme.colors.primary }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.color = palette.textSub }}>
            <Icon d={ICONS.refresh} size={13} />
            Actualiser
          </button>
          <button onClick={() => navigate('/ventes')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: theme.colors.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', boxShadow: theme.shadow.primary }}>
            <Icon d={ICONS.eye} size={13} color="#fff" />
            Voir les ventes
          </button>
          <NotifBell count={notifsNonLues || alertesNonLues} onClick={() => navigate('/alertes')} palette={palette} />
          <Avatar nom={user?.nom} color={theme.colors.primary} />
        </div>
      </div>

      {/* ── Bannière alertes (glassmorphism) ──────── */}
      {alertesNonLues > 0 && (
        <div onClick={() => navigate('/alertes')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, cursor: 'pointer',
            background: isDark ? 'rgba(239,68,68,0.08)' : theme.colors.dangerLight,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${theme.colors.danger}35`, borderRadius: 16, padding: '13px 18px',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px rgba(239,68,68,0.12)',
            transition: theme.transition.hover,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.16)' }}
          onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : theme.colors.dangerLight }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.danger, animation: 'alertPulse 1.5s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: theme.colors.danger, fontWeight: 600, flex: 1 }}>
            {alertesNonLues} alerte{alertesNonLues > 1 ? 's' : ''} active{alertesNonLues > 1 ? 's' : ''} — Cliquez pour voir
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: theme.colors.danger, background: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.12)', borderRadius: 99, padding: '5px 14px' }}>
            Voir toutes les alertes <Icon d={ICONS.chevron} size={12} color={theme.colors.danger} />
          </span>
        </div>
      )}

      {/* ── Stocks (jauges circulaires animées) ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="fuelo-grid-2">
        <CircularGauge label="Essence" quantite={stockEssence} onAction={() => navigate('/stock')} actionLabel={isGerant ? 'Commander' : 'Voir'} palette={palette} isDark={isDark} />
        <CircularGauge label="Gasoil"  quantite={stockGasoil}  onAction={() => navigate('/stock')} actionLabel={isGerant ? 'Commander' : 'Voir'} palette={palette} isDark={isDark} />
      </div>

      {/* ── Stat cards (compteur animé + tendance) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-4">
        <StatCard
          label="Ventes aujourd'hui"
          numericValue={Number(aujourdhui.montant) || 0}
          formatFn={formatGNF}
          sub={`${aujourdhui.nb} transaction${aujourdhui.nb > 1 ? 's' : ''} · ${formatLitres(aujourdhui.litres)}`}
          iconD={ICONS.ventes} color={theme.colors.primary}
          onClick={() => navigate('/ventes')}
          trend={trendVentesJour}
        />
        <StatCard
          label="Litres vendus aujourd'hui"
          numericValue={Number(aujourdhui.litres) || 0}
          formatFn={formatLitres}
          sub={`${aujourdhui.nb} transaction${aujourdhui.nb > 1 ? 's' : ''} · Ce mois : ${formatLitres(cemois.litres)}`}
          iconD={ICONS.trend} color={theme.colors.success}
          onClick={() => navigate('/ventes')}
          trend={calcTrend(aujourdhui.litres, veille.litres)}
        />
        <StatCard
          label="Stock essence"
          numericValue={stockEssence}
          formatFn={formatLitres}
          sub={getStockStatus(stockEssence).label === 'Critique' || getStockStatus(stockEssence).label === 'Vide' ? 'Niveau critique — à commander' : 'Niveau correct'}
          iconD={ICONS.essence}
          color={getStockStatus(stockEssence).color}
          onClick={() => navigate('/stock')}
          pulse={stockEssence > 0 && stockEssence <= 300}
        />
        <StatCard
          label="Stock gasoil"
          numericValue={stockGasoil}
          formatFn={formatLitres}
          sub={getStockStatus(stockGasoil).label === 'Critique' || getStockStatus(stockGasoil).label === 'Vide' ? 'Niveau critique — à commander' : 'Niveau correct'}
          iconD={ICONS.stock}
          color={getStockStatus(stockGasoil).color}
          onClick={() => navigate('/stock')}
          pulse={stockGasoil > 0 && stockGasoil <= 300}
        />
      </div>

      {/* ── Graphique + Ventes récentes ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 20 }} className="fuelo-grid-chart">

        {/* Graphique avec toggle de période */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, padding: '22px 24px', boxShadow: theme.shadow.sm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 3 }}>Ventes — {periodeLabel}</div>
              <div style={{ fontSize: 11, color: palette.textSub }}>En millions GNF</div>
            </div>
            <PeriodToggle value={periode} onChange={setPeriode} palette={palette} isDark={isDark} />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={theme.colors.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.cardBorder} vertical={false} />
                <XAxis dataKey="jour" tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip palette={palette} />} />
                <Area type="monotone" dataKey="montant" stroke={theme.colors.primary} strokeWidth={2.5} fill="url(#gradBlue)" dot={{ fill: theme.colors.primary, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: theme.colors.primary }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState type="ventes" message="Pas encore de données de ventes" />
          )}
        </div>

        {/* Ventes récentes */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, boxShadow: theme.shadow.sm, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}`, flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Ventes récentes</div>
            <button onClick={() => navigate('/ventes')} style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}>
              Voir tout <Icon d={ICONS.chevron} size={11} color={theme.colors.primary} />
            </button>
          </div>

          <div className="vente-header" style={{ display: 'grid', gridTemplateColumns: '34px 1fr 80px 110px 85px', padding: '8px 20px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${palette.cardBorder}`, gap: 10, flexShrink: 0 }}>
            {['', 'Type', 'Litres', 'Montant', 'Quand'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {recentes.length > 0
              ? recentes.map((v, i) => (
                  <motion.div key={v.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}>
                    <VenteRow vente={v} isLast={i === recentes.length - 1} palette={palette} />
                  </motion.div>
                ))
              : <EmptyState type="ventes" message="Aucune vente aujourd'hui" />
            }
          </div>
        </div>
      </div>

      {/* ── Sections owner uniquement ─────────────── */}
      {isOwner && (
        <>
          {/* Séparateur section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Vue propriétaire</div>
            <div style={{ flex: 1, height: 1, background: palette.cardBorder }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 20 }} className="fuelo-grid-owner">
            <EquipeApercu palette={palette} isDark={isDark} />
            <RepartitionCarburant recentes={recentes} palette={palette} isDark={isDark} />
          </div>
        </>
      )}

      {/* ── Performance pompistes (gérant uniquement) ── */}
      {isGerant && (
        <div style={{ marginBottom: 20 }}>
          <PompistePerf palette={palette} isDark={isDark} />
        </div>
      )}

      {/* ── Actions rapides (hover glow + scale) ──── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions rapides</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actions.length}, 1fr)`, gap: 14 }} className={`fuelo-actions fuelo-grid-${actions.length}`}>
        {actions.map(({ label, sub, icon, path, color }) => (
          <motion.button key={path} onClick={() => navigate(path)}
            whileHover={{ scale: 1.025, y: -3 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: `1px solid ${palette.cardBorder}`, background: palette.card, cursor: 'pointer', fontFamily: 'inherit', boxShadow: theme.shadow.sm, textAlign: 'left', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.boxShadow = `${theme.shadow.md}, 0 0 28px ${color}30` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.boxShadow = theme.shadow.sm }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '15', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={icon} size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: palette.textMuted }}>{sub}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <style>{`
        @keyframes alertPulse { 0%,100%{opacity:1;box-shadow:0 0 6px rgba(239,68,68,0.6)} 50%{opacity:0.5;box-shadow:0 0 12px rgba(239,68,68,0.9)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1300px) {
          .fuelo-grid-chart { grid-template-columns: 1fr !important; }
          .fuelo-grid-owner { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 1100px) {
          .fuelo-grid-4   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .fuelo-dashboard { padding: 16px 14px !important; }
          .fuelo-grid-2    { grid-template-columns: 1fr !important; }
          .fuelo-grid-3    { grid-template-columns: 1fr 1fr !important; }
          .fuelo-grid-4    { grid-template-columns: 1fr 1fr !important; }
          .fuelo-actions   { grid-template-columns: 1fr 1fr !important; }
          .vente-header    { display: none !important; }
          .vente-row       { grid-template-columns: 32px 1fr auto !important; gap: 6px !important; }
          .vente-row > *:nth-child(3) { display: none !important; }
          .vente-row > *:nth-child(5) { display: none !important; }
          .perf-header     { display: none !important; }
          .perf-row        { grid-template-columns: 1fr auto !important; }
          .perf-row > *:nth-child(2) { display: none !important; }
          .perf-row > *:nth-child(4) { display: none !important; }
        }
        @media (max-width: 480px) {
          .fuelo-grid-3    { grid-template-columns: 1fr !important; }
          .fuelo-grid-4    { grid-template-columns: 1fr 1fr !important; }
          .fuelo-actions   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
