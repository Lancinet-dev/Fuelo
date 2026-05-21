// ================================================
// FUELO V2 — Dashboard avec Dark/Light support
// Fichier : frontend/src/features/dashboard/Dashboard.jsx
// ================================================

import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth }      from '../../context/AuthContext'
import { useTheme }     from '../../context/ThemeContext'
import { useDashboard } from '../../hooks/useDashboard'
import { useVentes }    from '../../hooks/useVentes'
import StatCard         from '../../ui/StatCard'
import StockGauge       from '../../ui/StockGauge'
import EmptyState       from '../../ui/EmptyState'
import { SkeletonDashboard, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const ICONS = {
  ventes:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  alertes:  'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  trend:    'M23 6l-9.5 9.5-5-5L1 18',
  plus:     'M12 5v14M5 12h14',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  stock:    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  employes: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z',
}

// ── Tooltip graphique ─────────────────────────────────
function CustomTooltip({ active, payload, label, palette }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.md, padding: '10px 14px', boxShadow: theme.shadow.md }}>
      <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: theme.font.size.base, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.font.mono }}>
        {formatGNF(payload[0]?.value * 1_000_000)}
      </div>
    </div>
  )
}

// ── Ligne vente récente ───────────────────────────────
function VenteRow({ vente, isLast, palette }) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 110px 90px', alignItems: 'center', padding: '12px 20px', borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}`, transition: theme.transition.fast, gap: 8 }}
      onMouseEnter={e => e.currentTarget.style.background = palette.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 32, height: 32, borderRadius: theme.radius.md, background: vente.type === 'essence' ? theme.colors.warningLight : theme.colors.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
        {vente.type === 'essence' ? '⛽' : '🛢️'}
      </div>
      <div>
        <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: palette.text, textTransform: 'capitalize' }}>{vente.type}</div>
        <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>{vente.employe_nom ?? 'Pompiste'}</div>
      </div>
      <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.success, fontFamily: theme.font.mono }}>
        {formatLitres(vente.litres)}
      </div>
      <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>
        {formatGNF(vente.montant_gnf)}
      </div>
      <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>
        {formatRelative(vente.created_at)}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────
export default function Dashboard() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { palette }  = useTheme()

  const { stocks, aujourdhui, cemois, graphique7j, alertesNonLues, loading, refetch } = useDashboard()
  const { recentes } = useVentes()

  const stockEssence = parseFloat(stocks.find(s => s.type === 'essence')?.quantite ?? 0)
  const stockGasoil  = parseFloat(stocks.find(s => s.type === 'gasoil')?.quantite  ?? 0)

  const chartData = graphique7j.map(d => ({
    jour:    new Date(d.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    montant: parseFloat(d.montant) / 1_000_000,
  }))

  if (loading) {
    return (
      <>
        <SkeletonStyle />
        <SkeletonDashboard />
      </>
    )
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }} className="fuelo-dashboard">

      {/* ── Header ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
            Bonjour, {user?.nom?.split(' ')[0] ?? 'Gérant'} 👋
          </h1>
          <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={refetch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: palette.textSub, cursor: 'pointer', fontSize: theme.font.size.md, fontFamily: theme.font.family, boxShadow: theme.shadow.sm }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.refresh} /></svg>
            Actualiser
          </button>
          <button
            onClick={() => navigate('/ventes')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', cursor: 'pointer', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.plus} /></svg>
            Nouvelle vente
          </button>
        </div>
      </div>

      {/* ── Bannière alertes ─────────────────────── */}
      {alertesNonLues > 0 && (
        <div
          onClick={() => navigate('/alertes')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: theme.colors.dangerLight, border: `1px solid ${theme.colors.danger}30`, borderRadius: theme.radius.md, padding: '12px 18px', marginBottom: 24, cursor: 'pointer' }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.danger, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: theme.font.size.md, color: theme.colors.danger, fontWeight: theme.font.weight.semi, flex: 1 }}>
            {alertesNonLues} alerte{alertesNonLues > 1 ? 's' : ''} active{alertesNonLues > 1 ? 's' : ''} — Cliquez pour voir
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.danger} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        </div>
      )}

      {/* ── Stocks ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="fuelo-grid-2">
        <StockGauge label="Essence" quantite={stockEssence} onAction={() => navigate('/stock')} actionLabel="Commander" />
        <StockGauge label="Gasoil"  quantite={stockGasoil}  onAction={() => navigate('/stock')} actionLabel="Commander" />
      </div>

      {/* ── Stat Cards ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
        <StatCard label="Ventes aujourd'hui" value={formatGNF(aujourdhui.montant)} sub={`${aujourdhui.nb} transactions · ${formatLitres(aujourdhui.litres)}`} icon={ICONS.ventes} color={theme.colors.primary} onClick={() => navigate('/ventes')} />
        <StatCard label="Ventes ce mois"     value={formatGNF(cemois.montant)}     sub={`${cemois.nb} transactions · ${formatLitres(cemois.litres)}`}     icon={ICONS.trend}   color={theme.colors.success} onClick={() => navigate('/ventes')} />
        <StatCard label="Alertes actives"    value={String(alertesNonLues)}        sub={alertesNonLues === 0 ? 'Tout est normal ✓' : 'Action requise'}     icon={ICONS.alertes} color={alertesNonLues > 0 ? theme.colors.danger : theme.colors.success} onClick={() => navigate('/alertes')} />
      </div>

      {/* ── Graphique + Ventes récentes ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }} className="fuelo-grid-2">

        {/* Graphique */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '22px 24px', boxShadow: theme.shadow.sm }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text, marginBottom: 3 }}>Ventes — 7 derniers jours</div>
            <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>En millions GNF</div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAmbre" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={theme.colors.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={theme.colors.primary} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.cardBorder} vertical={false} />
                <XAxis dataKey="jour" tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip palette={palette} />} />
                <Area type="monotone" dataKey="montant" stroke={theme.colors.primary} strokeWidth={2.5} fill="url(#gradAmbre)" dot={{ fill: theme.colors.primary, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: theme.colors.primary }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState type="ventes" message="Pas encore de données de ventes" />
          )}
        </div>

        {/* Ventes récentes */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, boxShadow: theme.shadow.sm, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${palette.cardBorder}` }}>
            <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text }}>Ventes récentes</div>
            <button onClick={() => navigate('/ventes')} style={{ fontSize: theme.font.size.xs, color: theme.colors.primary, fontWeight: theme.font.weight.semi, background: 'none', border: 'none', cursor: 'pointer', fontFamily: theme.font.family }}>
              Voir tout →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px 110px 90px', padding: '8px 20px', background: palette.hover, borderBottom: `1px solid ${palette.cardBorder}`, gap: 8 }}>
            {['', 'Type', 'Litres', 'Montant', 'Quand'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
            ))}
          </div>
          {recentes.length > 0
            ? recentes.map((v, i) => <VenteRow key={v.id} vente={v} isLast={i === recentes.length - 1} palette={palette} />)
            : <EmptyState type="ventes" message="Aucune vente aujourd'hui" />
          }
        </div>
      </div>

      {/* ── Actions rapides ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="fuelo-grid-3">
        {[
          { label: 'Ajouter livraison', icon: ICONS.stock,    path: '/stock',    color: theme.colors.success },
          { label: 'Voir les alertes',  icon: ICONS.alertes,  path: '/alertes',  color: theme.colors.danger  },
          { label: 'Gérer employés',    icon: ICONS.employes, path: '/employes', color: theme.colors.info    },
        ].map(({ label, icon, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: theme.radius.lg, border: `1px solid ${palette.cardBorder}`, background: palette.card, cursor: 'pointer', fontFamily: theme.font.family, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: palette.text, boxShadow: theme.shadow.sm, transition: theme.transition.fast, textAlign: 'left', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = theme.shadow.md }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.boxShadow = theme.shadow.sm }}
          >
            <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d={icon} /></svg>
            </div>
            {label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1024px) { .fuelo-grid-2 { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px)  { .fuelo-dashboard { padding: 20px 16px !important; } .fuelo-grid-3 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}