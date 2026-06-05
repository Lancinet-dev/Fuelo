// ================================================
// FUELO V2.3 — Dashboard (owner premium + gérant)
// ================================================

import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth }      from '../../context/AuthContext'
import { useTheme }     from '../../context/ThemeContext'
import { useDashboard } from '../../hooks/useDashboard'
import { useVentes }    from '../../hooks/useVentes'
import { useEmployes }  from '../../hooks/useEmployes'
import { usePlan, PLAN_COLORS } from '../../hooks/usePlan'
import StockGauge       from '../../ui/StockGauge'
import EmptyState       from '../../ui/EmptyState'
import { SkeletonDashboard, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatRelative } from '../../utils/format'
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
function StatCard({ label, value, sub, iconD, color, onClick, pulse }) {
  const { palette } = useTheme()
  return (
    <div onClick={onClick} style={{
      background: palette.card, border: `1px solid ${palette.cardBorder}`,
      borderRadius: 16, padding: '18px 20px',
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: theme.shadow.sm, transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.borderColor = color + '60' }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = theme.shadow.sm; e.currentTarget.style.borderColor = palette.cardBorder }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {pulse && <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: color, top: 14, right: 14, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.5s infinite' }} />}
          <Icon d={iconD} size={18} color={color} />
        </div>
        {onClick && <Icon d={ICONS.chevron} size={13} color={palette.textMuted} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: palette.textSub, lineHeight: 1.4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ── Ligne vente (desktop) ─────────────────────────
function VenteRow({ vente, isLast, palette }) {
  return (
    <div className="vente-row"
      style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 110px 85px', alignItems: 'center', padding: '11px 20px', borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}`, gap: 10, transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = palette.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: vente.type === 'essence' ? theme.colors.warningLight : theme.colors.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {vente.type === 'essence'
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.info} strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/></svg>
        }
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, textTransform: 'capitalize' }}>{vente.type}</div>
        <div style={{ fontSize: 11, color: palette.textMuted }}>{vente.employe_nom ?? 'Pompiste'}</div>
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

  const { stocks, aujourdhui, cemois, graphique7j, alertesNonLues, loading, refetch } = useDashboard()
  const { recentes } = useVentes()
  const { employes }  = useEmployes()
  const { plan, colors: planColors, loading: planLoading } = usePlan()

  const stockEssence = parseFloat(stocks.find(s => s.type === 'essence')?.quantite ?? 0)
  const stockGasoil  = parseFloat(stocks.find(s => s.type === 'gasoil')?.quantite  ?? 0)

  const chartData = graphique7j.map(d => ({
    jour:    new Date(d.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    montant: parseFloat(d.montant) / 1_000_000,
  }))

  // Dérive données owner
  const membresEquipe = isOwner ? employes.filter(e => e.role === 'gerant' || e.role === 'logisticien') : []
  const membresActifs  = membresEquipe.filter(e => e.actif !== false).length

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
          <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={refetch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: palette.textSub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: theme.shadow.sm, transition: 'all 0.15s' }}
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
        </div>
      </div>

      {/* ── Bannière alertes ─────────────────────── */}
      {alertesNonLues > 0 && (
        <div onClick={() => navigate('/alertes')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: theme.colors.dangerLight, border: `1px solid ${theme.colors.danger}35`, borderRadius: 14, padding: '13px 18px', marginBottom: 24, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.colors.dangerLight }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.danger, animation: 'alertPulse 1.5s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: theme.colors.danger, fontWeight: 600, flex: 1 }}>
            {alertesNonLues} alerte{alertesNonLues > 1 ? 's' : ''} active{alertesNonLues > 1 ? 's' : ''} — Cliquez pour voir
          </span>
          <Icon d={ICONS.chevron} size={14} color={theme.colors.danger} />
        </div>
      )}

      {/* ── Stocks ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="fuelo-grid-2">
        <StockGauge label="Essence" quantite={stockEssence} onAction={() => navigate('/stock')} actionLabel={isGerant ? 'Commander' : 'Voir'} />
        <StockGauge label="Gasoil"  quantite={stockGasoil}  onAction={() => navigate('/stock')} actionLabel={isGerant ? 'Commander' : 'Voir'} />
      </div>

      {/* ── Stat cards ────────────────────────────── */}
      {/* Owner : 4 cartes | Gérant : 3 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: isOwner ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className={isOwner ? 'fuelo-grid-4' : 'fuelo-grid-3'}>
        <StatCard
          label="Ventes aujourd'hui"
          value={formatGNF(aujourdhui.montant)}
          sub={`${aujourdhui.nb} transaction${aujourdhui.nb > 1 ? 's' : ''} · ${formatLitres(aujourdhui.litres)}`}
          iconD={ICONS.ventes} color={theme.colors.primary}
          onClick={() => navigate('/ventes')}
        />
        <StatCard
          label="Ventes ce mois"
          value={formatGNF(cemois.montant)}
          sub={`${cemois.nb} transaction${cemois.nb > 1 ? 's' : ''} · ${formatLitres(cemois.litres)}`}
          iconD={ICONS.trend} color={theme.colors.success}
          onClick={() => navigate('/ventes')}
        />
        <StatCard
          label="Alertes actives"
          value={String(alertesNonLues)}
          sub={alertesNonLues === 0 ? 'Tout est normal ✓' : 'Action requise'}
          iconD={ICONS.alertes}
          color={alertesNonLues > 0 ? theme.colors.danger : theme.colors.success}
          onClick={() => navigate('/alertes')}
          pulse={alertesNonLues > 0}
        />
        {isOwner && (
          <StatCard
            label="Mon équipe"
            value={String(membresActifs)}
            sub={`${membresEquipe.length} membre${membresEquipe.length > 1 ? 's' : ''} · ${membresEquipe.filter(e => e.role === 'gerant').length} gérant${membresEquipe.filter(e => e.role === 'gerant').length > 1 ? 's' : ''}`}
            iconD={ICONS.equipe}
            color={theme.colors.info}
            onClick={() => navigate('/employes')}
          />
        )}
      </div>

      {/* ── Graphique + Ventes récentes ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 20 }} className="fuelo-grid-chart">

        {/* Graphique 7j */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, padding: '22px 24px', boxShadow: theme.shadow.sm }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 3 }}>Ventes — 7 derniers jours</div>
            <div style={{ fontSize: 11, color: palette.textSub }}>En millions GNF</div>
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

          <div className="vente-header" style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 110px 85px', padding: '8px 20px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderBottom: `1px solid ${palette.cardBorder}`, gap: 10, flexShrink: 0 }}>
            {['', 'Type', 'Litres', 'Montant', 'Quand'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {recentes.length > 0
              ? recentes.map((v, i) => <VenteRow key={v.id} vente={v} isLast={i === recentes.length - 1} palette={palette} />)
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

      {/* ── Actions rapides ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actions.length}, 1fr)`, gap: 14 }} className={`fuelo-actions fuelo-grid-${actions.length}`}>
        {actions.map(({ label, sub, icon, path, color }) => (
          <button key={path} onClick={() => navigate(path)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: `1px solid ${palette.cardBorder}`, background: palette.card, cursor: 'pointer', fontFamily: 'inherit', boxShadow: theme.shadow.sm, transition: 'all 0.2s', textAlign: 'left', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.boxShadow = theme.shadow.md; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.boxShadow = theme.shadow.sm; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={icon} size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: palette.textMuted }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes alertPulse { 0%,100%{opacity:1;box-shadow:0 0 6px rgba(239,68,68,0.6)} 50%{opacity:0.5;box-shadow:0 0 12px rgba(239,68,68,0.9)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1100px) {
          .fuelo-grid-4   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 1024px) {
          .fuelo-grid-chart { grid-template-columns: 1fr !important; }
          .fuelo-grid-owner { grid-template-columns: 1fr !important; }
          .fuelo-grid-2     { grid-template-columns: 1fr 1fr !important; }
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
