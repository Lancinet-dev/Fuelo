// ================================================
// FUELO — Superadmin Dashboard — Enterprise Grade
// ================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAuth }        from '../../context/AuthContext'
import { useAdminStats, useAdminClients, exportClientsCSV } from '../../hooks/useAdminStats'

// ── Palette fixe fond sombre (ignorer ThemeContext) ──
const P = {
  bg:         '#020817',
  bgPanel:    '#0a1628',
  sidebar:    '#050e1a',
  card:       'rgba(255,255,255,0.035)',
  cardBorder: 'rgba(255,255,255,0.07)',
  glass:      'rgba(255,255,255,0.06)',
  glassBorder:'rgba(255,255,255,0.12)',
  text:       '#f1f5f9',
  textSub:    '#94a3b8',
  textMuted:  '#475569',
  primary:    '#2563eb',
  violet:     '#8b5cf6',
  cyan:       '#06b6d4',
  green:      '#10b981',
  orange:     '#f59e0b',
  red:        '#ef4444',
  hover:      'rgba(255,255,255,0.04)',
}

const PLAN_CFG = {
  STARTER:    { color: '#94a3b8', label: 'Starter',    price: 50  },
  PRO:        { color: '#2563eb', label: 'Pro',         price: 150 },
  ENTERPRISE: { color: '#8b5cf6', label: 'Enterprise',  price: 300 },
}
const SUB_CFG = {
  actif:      { color: P.green,  label: 'Actif'       },
  en_attente: { color: P.orange, label: 'En attente'  },
  suspendu:   { color: P.red,    label: 'Suspendu'    },
  expire:     { color: P.textMuted, label: 'Expiré'   },
}

const fmt$ = (n) => {
  if (!n && n !== 0) return '$—'
  const v = Math.round(parseFloat(n))
  return '$' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
const fmtN = (n) => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const moisCourt = (yyyy_mm) => {
  if (!yyyy_mm) return ''
  const [, m] = yyyy_mm.split('-')
  return ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][parseInt(m)-1]
}

// ── Icônes SVG inline ──────────────────────────────────
const Ic = {
  dashboard:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  clients:    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',
  revenue:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  subs:       'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  alertes:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  settings:   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  profile:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  logout:     'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  refresh:    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  check:      'M5 13l4 4L19 7',
  pause:      'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
  eye:        'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  mail:       'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  export:     'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  close:      'M6 18L18 6M6 6l12 12',
  up:         'M7 11l5-5m0 0l5 5m-5-5v12',
  down:       'M17 13l-5 5m0 0l-5-5m5 5V6',
  search:     'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  filter:     'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  station:    'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  warning:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  chart:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

function I({ d, size = 16, color = P.textSub }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((p, i) => <path key={i} d={i === 0 ? p : 'M' + p} />)}
    </svg>
  )
}

const NAV = [
  { id: 'dashboard', label: 'Vue globale',     ic: Ic.dashboard },
  { id: 'clients',   label: 'Clients',          ic: Ic.clients   },
  { id: 'revenus',   label: 'Revenus',           ic: Ic.revenue   },
  { id: 'abonnements',label:'Abonnements',      ic: Ic.subs      },
  { id: 'alertes',   label: 'Alertes système',   ic: Ic.alertes   },
]

// ═══════════════════════════════════════════════════════════
export default function SuperadminDashboard() {
  const { user, logout }      = useAuth()
  const navigate              = useNavigate()
  const [section, setSection] = useState('dashboard')
  const [now, setNow]         = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats()
  const { clients, loading: clientsLoading, refetch: refetchClients, valider, suspendre } = useAdminClients()
  const refetch = () => { refetchStats(); refetchClients() }

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', height: '100vh', background: P.bg, fontFamily: '"DM Sans", system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0, background: P.sidebar, height: '100vh',
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${P.cardBorder}`,
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px', borderBottom: `1px solid ${P.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2563eb,#8b5cf6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: P.text, lineHeight: 1.2 }}>Fuelo</div>
              <div style={{ fontSize: 10, color: P.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Administration</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'linear-gradient(90deg,rgba(239,68,68,0.15),rgba(245,158,11,0.15))', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 99, padding: '3px 10px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', letterSpacing: 0.8 }}>SUPERADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              marginBottom: 2, textAlign: 'left', fontFamily: 'inherit',
              background: section === item.id ? 'rgba(139,92,246,0.12)' : 'transparent',
              color: section === item.id ? '#a78bfa' : P.textSub,
              fontWeight: section === item.id ? 600 : 400, fontSize: 13,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (section !== item.id) e.currentTarget.style.background = P.hover }}
              onMouseLeave={e => { if (section !== item.id) e.currentTarget.style.background = 'transparent' }}
            >
              <I d={item.ic} size={15} color={section === item.id ? '#a78bfa' : P.textMuted} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${P.cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {user?.nom?.[0]?.toUpperCase() || 'S'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: P.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nom || 'Superadmin'}</div>
              <div style={{ fontSize: 10, color: P.textMuted }}>superadmin</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'inherit' }}>
            <I d={Ic.logout} size={13} color="#ef4444" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,14,26,0.7)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${P.cardBorder}`, flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: P.text }}>
              {{ dashboard:'Vue globale', clients:'Clients', revenus:'Revenus', abonnements:'Abonnements', alertes:'Alertes système' }[section]}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, color: P.textMuted, fontVariantNumeric: 'tabular-nums' }}>
              {now.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })} · {now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 8, color: P.textSub, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              <I d={Ic.refresh} size={12} /> Actualiser
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {section === 'dashboard'    && <SectionDashboard stats={stats} loading={statsLoading} clients={clients} setSection={setSection} />}
              {section === 'clients'      && <SectionClients clients={clients} loading={clientsLoading} valider={valider} suspendre={suspendre} />}
              {section === 'revenus'      && <SectionRevenus stats={stats} />}
              {section === 'abonnements'  && <SectionAbonnements clients={clients} stats={stats} valider={valider} suspendre={suspendre} />}
              {section === 'alertes'      && <SectionAlertes stats={stats} clients={clients} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <GlobalStyles />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION DASHBOARD GLOBAL
// ═══════════════════════════════════════════════════════════
function SectionDashboard({ stats, loading, clients, setSection }) {
  const subs = stats.abonnements ?? {}
  const mrr  = stats.mrr_12mois  ?? []
  const new12= stats.nouveaux_12mois ?? []
  const plans= stats.repartition_plans ?? []
  const enAttente = clients.filter(c => c.sub_statut === 'en_attente').length

  const CARDS = [
    { label: 'Clients actifs',          value: fmtN(stats.nb_clients),        sub: `+${fmtN(stats.nouveaux_ce_mois)} ce mois`, color: P.cyan,   icon: Ic.clients,  trend: stats.nouveaux_ce_mois > 0 ? 'up' : null },
    { label: 'MRR (USD)',                value: fmt$(stats.revenue_actif),      sub: `ARR : ${fmt$(stats.revenue_actif * 12)}`, color: P.green,  icon: Ic.revenue,  trend: 'up' },
    { label: 'Stations gérées',          value: fmtN(stats.nb_stations),        sub: `${(stats.nb_stations / Math.max(stats.nb_clients,1)).toFixed(1)} / client`, color: P.primary, icon: Ic.station, trend: null },
    { label: 'En attente validation',    value: fmtN(enAttente),                sub: 'à traiter maintenant', color: enAttente > 0 ? P.orange : P.textMuted, icon: Ic.subs, trend: null, pulse: enAttente > 0 },
    { label: 'Expirés / Suspendus',      value: fmtN((subs.expire ?? 0) + (subs.suspendu ?? 0)), sub: `${subs.expire ?? 0} expirés · ${subs.suspendu ?? 0} suspendus`, color: P.red, icon: Ic.warning, trend: null },
    { label: 'Nouveaux ce mois',         value: fmtN(stats.nouveaux_ce_mois),   sub: `${fmtN(stats.sans_abonnement)} sans abonnement`, color: P.violet, icon: Ic.clients, trend: stats.nouveaux_ce_mois > 0 ? 'up' : null },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div>
      {/* Alerte en attente */}
      {enAttente > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '12px 18px', marginBottom: 22, cursor: 'pointer' }}
          onClick={() => setSection('abonnements')}
        >
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontSize: 13, color: P.orange, fontWeight: 600, flex: 1 }}>
            {enAttente} abonnement{enAttente > 1 ? 's' : ''} en attente de validation — cliquer pour traiter
          </span>
          <I d={Ic.subs} size={14} color={P.orange} />
        </motion.div>
      )}

      {/* 6 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {CARDS.map((c, i) => <KpiCard key={i} {...c} index={i} />)}
      </div>

      {/* Graphiques ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
        <GlassCard title="MRR — 12 derniers mois" sub="Monthly Recurring Revenue (USD)">
          {mrr.length > 0 && mrr.some(m => m.mrr > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={mrr} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mois" tickFormatter={moisCourt} tick={{ fontSize: 10, fill: P.textMuted }} />
                <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: P.textMuted }} />
                <Tooltip formatter={v => [fmt$(v), 'MRR']} contentStyle={{ background: P.bgPanel, border: `1px solid ${P.glassBorder}`, borderRadius: 8, fontSize: 12, color: P.text }} />
                <Area type="monotone" dataKey="mrr" stroke="#2563eb" strokeWidth={2} fill="url(#gMRR)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Données MRR indisponibles" />}
        </GlassCard>

        <GlassCard title="Répartition des plans" sub="Abonnements actifs">
          {plans.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={plans} cx="50%" cy="46%" outerRadius={70} innerRadius={36} dataKey="nb" nameKey="plan" paddingAngle={3}
                  label={({ plan, percent }) => `${(PLAN_CFG[plan] ?? { label: plan }).label} ${(percent*100).toFixed(0)}%`}
                  labelLine={false} style={{ fontSize: 10 }}>
                  {plans.map((p, i) => <Cell key={i} fill={(PLAN_CFG[p.plan] ?? { color: '#666' }).color} />)}
                </Pie>
                <Tooltip formatter={(v, _, props) => [v + ' clients', (PLAN_CFG[props.payload.plan] ?? { label: props.payload.plan }).label]} contentStyle={{ background: P.bgPanel, border: `1px solid ${P.glassBorder}`, borderRadius: 8, fontSize: 12, color: P.text }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Aucun abonnement actif" />}
        </GlassCard>
      </div>

      {/* Graphiques ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16, marginBottom: 20 }}>
        {/* Carte Afrique de l'Ouest */}
        <GlassCard title="Présence Afrique de l'Ouest" sub="Distribution géographique clients">
          <WestAfricaMap clients={clients} />
        </GlassCard>

        <GlassCard title="Nouveaux clients — 12 mois" sub="Acquisitions mensuelles">
          {new12.length > 0 && new12.some(m => m.nb > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={new12} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mois" tickFormatter={moisCourt} tick={{ fontSize: 10, fill: P.textMuted }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: P.textMuted }} />
                <Tooltip formatter={v => [v, 'Nouveaux clients']} contentStyle={{ background: P.bgPanel, border: `1px solid ${P.glassBorder}`, borderRadius: 8, fontSize: 12, color: P.text }} />
                <Bar dataKey="nb" fill="url(#gNew)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart label="Aucune acquisition ce trimestre" />}
        </GlassCard>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION CLIENTS
// ═══════════════════════════════════════════════════════════
function SectionClients({ clients, loading, valider, suspendre }) {
  const [search,      setSearch]      = useState('')
  const [filterPlan,  setFilterPlan]  = useState('')
  const [filterStatut,setFilterStatut]= useState('')
  const [page,        setPage]        = useState(1)
  const [modal,       setModal]       = useState(null)
  const [actionLoad,  setActionLoad]  = useState(null)
  const PAGE_SIZE = 10

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch  = !q || c.nom?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    const matchPlan    = !filterPlan   || c.sub_plan   === filterPlan
    const matchStatut  = !filterStatut || c.sub_statut === filterStatut
    return matchSearch && matchPlan && matchStatut
  })
  const pages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const handleValider = async (id)   => { setActionLoad(id); try { await valider(id)   } finally { setActionLoad(null) } }
  const handleSuspendre = async (id) => { setActionLoad(id); try { await suspendre(id) } finally { setActionLoad(null) } }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <I d={Ic.search} size={14} color={P.textMuted} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Rechercher par nom ou email..." style={{ ...inputSt, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <I d={Ic.search} size={14} color={P.textMuted} />
          </span>
        </div>
        <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1) }} style={selectSt}>
          <option value="">Tous les plans</option>
          {Object.entries(PLAN_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1) }} style={selectSt}>
          <option value="">Tous statuts</option>
          {Object.entries(SUB_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => exportClientsCSV(filtered)} style={{ ...btnSt, background: 'rgba(16,185,129,0.1)', color: P.green, border: `1px solid rgba(16,185,129,0.2)` }}>
          <I d={Ic.export} size={13} color={P.green} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: 12, color: P.textMuted }}>Page {page}/{pages}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Client','Email','Plan','Statut','Stations','MRR/mois','Inscription','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, borderBottom: `1px solid ${P.cardBorder}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: P.textMuted }}>Chargement...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: P.textMuted }}>Aucun résultat</td></tr>
              ) : visible.map((c, i) => {
                const isAct = actionLoad === c.sub_id
                return (
                  <tr key={c.id} style={{ borderBottom: i < visible.length-1 ? `1px solid ${P.cardBorder}` : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = P.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar nom={c.nom} size={30} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{c.nom ?? '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: P.textSub }}>{c.email}</td>
                    <td style={{ padding: '11px 14px' }}><PlanBadge plan={c.sub_plan} /></td>
                    <td style={{ padding: '11px 14px' }}><StatutBadge statut={c.sub_statut} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: P.text, textAlign: 'center' }}>{c.nb_stations ?? 0}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: P.green, fontVariantNumeric: 'tabular-nums' }}>{fmt$(c.sub_montant)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: P.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <button onClick={() => setModal(c)} style={{ ...btnSmall, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <I d={Ic.eye} size={11} color="#a78bfa" /> Voir
                        </button>
                        {c.sub_id && c.sub_statut === 'en_attente' && (
                          <button disabled={isAct} onClick={() => handleValider(c.sub_id)} style={{ ...btnSmall, background: 'rgba(16,185,129,0.1)', color: P.green, border: `1px solid rgba(16,185,129,0.2)`, opacity: isAct ? 0.5 : 1 }}>
                            <I d={Ic.check} size={11} color={P.green} /> Valider
                          </button>
                        )}
                        {c.sub_id && c.sub_statut === 'actif' && (
                          <button disabled={isAct} onClick={() => handleSuspendre(c.sub_id)} style={{ ...btnSmall, background: 'rgba(239,68,68,0.08)', color: P.red, border: `1px solid rgba(239,68,68,0.2)`, opacity: isAct ? 0.5 : 1 }}>
                            <I d={Ic.pause} size={11} color={P.red} /> Suspendre
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${P.cardBorder}`, display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ ...paginBtn, opacity: page === 1 ? 0.3 : 1 }}>←</button>
            {Array.from({ length: pages }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ ...paginBtn, background: page === p ? P.violet : 'transparent', color: page === p ? '#fff' : P.textSub, border: page === p ? `1px solid ${P.violet}` : `1px solid ${P.cardBorder}` }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} style={{ ...paginBtn, opacity: page === pages ? 0.3 : 1 }}>→</button>
          </div>
        )}
      </div>

      {/* Modal client */}
      <AnimatePresence>
        {modal && <ClientModal client={modal} onClose={() => setModal(null)} onValider={handleValider} onSuspendre={handleSuspendre} actionLoad={actionLoad} />}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION REVENUS
// ═══════════════════════════════════════════════════════════
function SectionRevenus({ stats }) {
  const mrr    = stats.revenue_actif ?? 0
  const arr    = mrr * 12
  const subs   = stats.abonnements ?? {}
  const plans  = stats.repartition_plans ?? []
  const mois   = new Date().getMonth()
  const projFin= mrr * (12 - mois)

  const planRevenue = plans.map(p => {
    const cfg = PLAN_CFG[p.plan] ?? { label: p.plan, price: 0 }
    return { ...cfg, nb: p.nb, total: cfg.price * p.nb }
  })

  return (
    <div>
      {/* Top KPIs revenus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'MRR actuel',        value: fmt$(mrr),     sub: 'Monthly Recurring Revenue',  color: P.green  },
          { label: 'ARR',               value: fmt$(arr),     sub: 'Annual Recurring Revenue',   color: P.cyan   },
          { label: 'Abonnés actifs',    value: fmtN(subs.actif ?? 0), sub: `${subs.en_attente ?? 0} en attente`, color: P.primary },
          { label: "Projection fin d'année", value: fmt$(projFin), sub: `${12-mois} mois restants`, color: P.violet },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
            style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${k.color},transparent)` }} />
            <div style={{ fontSize: 11, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: k.color, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: P.textMuted, marginTop: 4 }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenu par plan */}
      <GlassCard title="Revenu par plan" sub="Contribution de chaque plan au MRR">
        {planRevenue.length === 0 ? <EmptyChart label="Aucun abonnement actif" /> : (
          <div style={{ padding: '4px 0' }}>
            {planRevenue.map((p, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < planRevenue.length-1 ? `1px solid ${P.cardBorder}` : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{p.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.green, fontVariantNumeric: 'tabular-nums' }}>{fmt$(p.total)}/mois</span>
                  </div>
                  <div style={{ height: 5, background: P.cardBorder, borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${mrr > 0 ? (p.total/mrr*100) : 0}%` }} transition={{ delay: i*0.08+0.2, duration: 0.8 }}
                      style={{ height: '100%', background: p.color, borderRadius: 99 }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: P.textMuted, minWidth: 80, textAlign: 'right' }}>
                  {p.nb} client{p.nb !== 1 ? 's' : ''} · {mrr > 0 ? (p.total/mrr*100).toFixed(0) : 0}%
                </div>
              </motion.div>
            ))}
            {planRevenue.length === 0 && <div style={{ padding: '30px 0', textAlign: 'center', color: P.textMuted }}>Aucune donnée</div>}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION ABONNEMENTS
// ═══════════════════════════════════════════════════════════
function SectionAbonnements({ clients, stats, valider, suspendre }) {
  const [actionLoad, setActionLoad] = useState(null)
  const subs   = stats.abonnements ?? {}
  const pending = clients.filter(c => c.sub_statut === 'en_attente')
  const actifs  = clients.filter(c => c.sub_statut === 'actif')
  const autres  = clients.filter(c => c.sub_statut !== 'en_attente' && c.sub_statut !== 'actif')

  const handleValider   = async (id) => { setActionLoad(id); try { await valider(id)   } finally { setActionLoad(null) } }
  const handleSuspendre = async (id) => { setActionLoad(id); try { await suspendre(id) } finally { setActionLoad(null) } }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Actifs',      value: subs.actif      ?? 0, color: P.green  },
          { label: 'En attente',  value: subs.en_attente ?? 0, color: P.orange },
          { label: 'Suspendus',   value: subs.suspendu   ?? 0, color: P.red    },
          { label: 'Expirés',     value: subs.expire     ?? 0, color: P.textMuted },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
            style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* En attente */}
      {pending.length > 0 && (
        <GlassCard title={`⚡ En attente de validation (${pending.length})`} sub="À traiter en priorité" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.3)' }}>
          {pending.map((c, i) => <ClientRow key={c.id} c={c} i={i} last={i===pending.length-1} onValider={handleValider} onSuspendre={handleSuspendre} actionLoad={actionLoad} />)}
        </GlassCard>
      )}

      {/* Actifs */}
      <GlassCard title={`Abonnements actifs (${actifs.length})`} sub="Clients en cours">
        {actifs.length === 0 ? <EmptyChart label="Aucun abonnement actif" /> :
          actifs.map((c, i) => <ClientRow key={c.id} c={c} i={i} last={i===actifs.length-1} onValider={handleValider} onSuspendre={handleSuspendre} actionLoad={actionLoad} />)
        }
      </GlassCard>

      {/* Autres */}
      {autres.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <GlassCard title={`Suspendus / Expirés (${autres.length})`} sub="Clients inactifs">
            {autres.map((c, i) => <ClientRow key={c.id} c={c} i={i} last={i===autres.length-1} onValider={handleValider} onSuspendre={handleSuspendre} actionLoad={actionLoad} />)}
          </GlassCard>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECTION ALERTES
// ═══════════════════════════════════════════════════════════
function SectionAlertes({ stats, clients }) {
  const expirables  = stats.expirables ?? []
  const nonValides  = clients.filter(c => !c.sub_id || c.sub_statut === 'en_attente')
  const sansSub     = clients.filter(c => !c.sub_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Expirations imminentes */}
      <GlassCard title={`⏰ Abonnements expirant dans 7 jours (${expirables.length})`} sub="Action recommandée : contacter le client" style={{ borderColor: expirables.length > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
        {expirables.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: P.green, fontSize: 13 }}>✅ Aucune expiration imminente</div>
        ) : expirables.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < expirables.length-1 ? `1px solid ${P.cardBorder}` : 'none' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.red, flexShrink: 0, boxShadow: `0 0 6px ${P.red}` }} />
            <Avatar nom={c.nom} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{c.nom}</div>
              <div style={{ fontSize: 11, color: P.textMuted }}>{c.email}</div>
            </div>
            <PlanBadge plan={c.plan} />
            <span style={{ fontSize: 11, color: P.red, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        ))}
      </GlassCard>

      {/* Nouveaux inscrits sans abonnement */}
      <GlassCard title={`👤 Inscrits sans abonnement (${sansSub.length})`} sub="Opportunités de conversion">
        {sansSub.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: P.green, fontSize: 13 }}>✅ Tous les clients ont un abonnement</div>
        ) : sansSub.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < sansSub.length-1 ? `1px solid ${P.cardBorder}` : 'none' }}>
            <Avatar nom={c.nom} size={28} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{c.nom}</div>
              <div style={{ fontSize: 11, color: P.textMuted }}>{c.email}</div>
            </div>
            <span style={{ fontSize: 11, color: P.textMuted }}>
              Inscrit le {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>
        ))}
      </GlassCard>

      {/* En attente validation */}
      {nonValides.filter(c => c.sub_statut === 'en_attente').length > 0 && (
        <GlassCard title={`⚡ En attente de validation (${nonValides.filter(c => c.sub_statut === 'en_attente').length})`} sub="Paiements reçus — à confirmer" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          {nonValides.filter(c => c.sub_statut === 'en_attente').map((c, i, arr) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < arr.length-1 ? `1px solid ${P.cardBorder}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: P.orange, boxShadow: `0 0 6px ${P.orange}`, flexShrink: 0 }} />
              <Avatar nom={c.nom} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{c.nom}</div>
                <div style={{ fontSize: 11, color: P.textMuted }}>{c.email} · {c.payment_method || '—'}</div>
              </div>
              <PlanBadge plan={c.sub_plan} />
              <span style={{ fontSize: 12, fontWeight: 700, color: P.green }}>{fmt$(c.sub_montant)}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MODAL CLIENT
// ═══════════════════════════════════════════════════════════
function ClientModal({ client: c, onClose, onValider, onSuspendre, actionLoad }) {
  const isAct = actionLoad === c.sub_id
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        style={{ background: '#0a1628', border: `1px solid ${P.glassBorder}`, borderRadius: 18, padding: 28, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar nom={c.nom} size={48} fontSize={18} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: P.text, marginBottom: 4 }}>{c.nom}</div>
              <div style={{ fontSize: 13, color: P.textSub }}>{c.email}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <PlanBadge plan={c.sub_plan} />
                <StatutBadge statut={c.sub_statut} />
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: P.textMuted, cursor: 'pointer', padding: 4 }}>
            <I d={Ic.close} size={18} color={P.textMuted} />
          </button>
        </div>

        {/* Grid infos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Stations',    value: fmtN(c.nb_stations ?? 0)  },
            { label: 'MRR',         value: fmt$(c.sub_montant)        },
            { label: 'Paiement',    value: c.payment_method || '—'    },
            { label: 'Téléphone',   value: c.payment_phone  || '—'    },
            { label: 'Inscrit le',  value: c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—' },
            { label: 'Expire le',   value: c.expires_at  ? new Date(c.expires_at).toLocaleDateString('fr-FR')  : '—' },
          ].map((f, i) => (
            <div key={i} style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: P.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.text }}>{f.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {c.sub_id && c.sub_statut === 'en_attente' && (
            <button disabled={isAct} onClick={() => { onValider(c.sub_id); onClose() }}
              style={{ flex: 1, padding: '10px 16px', background: 'rgba(16,185,129,0.12)', border: `1px solid rgba(16,185,129,0.3)`, borderRadius: 10, color: P.green, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <I d={Ic.check} size={14} color={P.green} /> Valider l'abonnement
            </button>
          )}
          {c.sub_id && c.sub_statut === 'actif' && (
            <button disabled={isAct} onClick={() => { onSuspendre(c.sub_id); onClose() }}
              style={{ flex: 1, padding: '10px 16px', background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 10, color: P.red, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <I d={Ic.pause} size={14} color={P.red} /> Suspendre
            </button>
          )}
          <a href={`mailto:${c.email}`}
            style={{ flex: 1, padding: '10px 16px', background: 'rgba(139,92,246,0.1)', border: `1px solid rgba(139,92,246,0.2)`, borderRadius: 10, color: '#a78bfa', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <I d={Ic.mail} size={14} color="#a78bfa" /> Contacter
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// CARTE AFRIQUE DE L'OUEST (SVG simplifié)
// ═══════════════════════════════════════════════════════════
function WestAfricaMap({ clients }) {
  const total = clients.length
  // Pays principaux Afrique de l'Ouest avec coordonnées relatives (viewBox 0 0 200 150)
  const COUNTRIES = [
    { name: 'Guinée',        x: 52,  y: 72,  r: 14, primary: true  },
    { name: 'Sénégal',       x: 38,  y: 50,  r: 11, primary: false },
    { name: 'Mali',          x: 80,  y: 45,  r: 16, primary: false },
    { name: 'Côte d\'Ivoire',x: 72,  y: 88,  r: 13, primary: false },
    { name: 'Ghana',         x: 96,  y: 92,  r: 11, primary: false },
    { name: 'Burkina Faso',  x: 95,  y: 65,  r: 11, primary: false },
    { name: 'Niger',         x: 118, y: 42,  r: 14, primary: false },
    { name: 'Nigeria',       x: 128, y: 78,  r: 16, primary: false },
    { name: 'Bénin',         x: 112, y: 85,  r: 8,  primary: false },
    { name: 'Togo',          x: 104, y: 87,  r: 7,  primary: false },
    { name: 'Guinée-Bissau', x: 38,  y: 66,  r: 7,  primary: false },
    { name: 'Sierra Leone',  x: 46,  y: 82,  r: 8,  primary: false },
    { name: 'Liberia',       x: 57,  y: 90,  r: 9,  primary: false },
    { name: 'Mauritanie',    x: 52,  y: 25,  r: 14, primary: false },
    { name: 'Gambie',        x: 36,  y: 57,  r: 5,  primary: false },
  ]
  return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
      <svg viewBox="0 0 200 130" width="100%" height={160} style={{ maxWidth: 320 }}>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#020817" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="200" height="130" fill="#020817" rx="8" />
        <ellipse cx="90" cy="65" rx="75" ry="55" fill="url(#mapGlow)" />
        {/* Pays */}
        {COUNTRIES.map(c => (
          <g key={c.name}>
            <circle cx={c.x} cy={c.y} r={c.r} fill={c.primary ? 'rgba(37,99,235,0.3)' : 'rgba(148,163,184,0.08)'} stroke={c.primary ? '#2563eb' : 'rgba(148,163,184,0.2)'} strokeWidth="0.8" />
            {c.primary && <circle cx={c.x} cy={c.y} r={3} fill="#2563eb" />}
            {c.primary && (
              <>
                <circle cx={c.x} cy={c.y} r={6} fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2,2" opacity="0.6">
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${c.x} ${c.y}`} to={`360 ${c.x} ${c.y}`} dur="8s" repeatCount="indefinite" />
                </circle>
                <text x={c.x + c.r + 2} y={c.y + 3} fill="#60a5fa" fontSize="5" fontWeight="600">{c.name}</text>
              </>
            )}
          </g>
        ))}
        {/* Points clients fictifs autour de la Guinée */}
        {total > 0 && [
          [48, 68], [56, 74], [50, 76], [58, 69], [52, 80],
          [45, 72], [62, 71], [54, 65], [49, 84], [60, 78],
        ].slice(0, Math.min(total, 10)).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.8} fill="#10b981" opacity={0.8}>
            <animate attributeName="r" values="1.8;2.5;1.8" dur={`${1.5 + i*0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Légende */}
        <circle cx={10} cy={118} r={3} fill="#2563eb" />
        <text x={15} y={121} fill={P.textMuted} fontSize="5">Marché principal (Guinée)</text>
        <circle cx={10} cy={126} r={2} fill="#10b981" />
        <text x={15} y={129} fill={P.textMuted} fontSize="5">{total} client{total !== 1 ? 's' : ''} actif{total !== 1 ? 's' : ''}</text>
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPOSANTS UI PARTAGÉS
// ═══════════════════════════════════════════════════════════
function KpiCard({ label, value, sub, index, color, icon, trend, pulse }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)` }} />
      {pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'pulseDot 1.5s infinite' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I d={icon} size={16} color={color} />
        </div>
        {trend && <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: trend === 'up' ? P.green : P.red }}>
          <I d={trend === 'up' ? Ic.up : Ic.down} size={11} color={trend === 'up' ? P.green : P.red} />
        </div>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: P.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: P.textMuted, marginTop: 3 }}>{sub}</div>}
    </motion.div>
  )
}

function GlassCard({ title, sub, children, style: extraStyle }) {
  return (
    <div style={{ background: P.card, border: `1px solid ${P.cardBorder}`, borderRadius: 14, padding: '18px 20px', ...extraStyle }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function EmptyChart({ label }) {
  return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.textMuted, fontSize: 13 }}>{label}</div>
}

function Avatar({ nom, size = 32, fontSize = 13 }) {
  const initials = (nom ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors   = ['#2563eb','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444']
  const color    = colors[(nom ?? '').charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color + '22', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 800, color, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function PlanBadge({ plan }) {
  const cfg = PLAN_CFG[plan] ?? { color: P.textMuted, label: plan ?? '—' }
  return <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, background: cfg.color + '18', borderRadius: 99, padding: '2px 9px', letterSpacing: 0.3 }}>{cfg.label}</span>
}

function StatutBadge({ statut }) {
  const cfg = SUB_CFG[statut] ?? { color: P.textMuted, label: statut ?? '—' }
  return <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.color + '15', borderRadius: 99, padding: '2px 9px' }}>{cfg.label}</span>
}

function ClientRow({ c, last, onValider, onSuspendre, actionLoad }) {
  const isAct = actionLoad === c.sub_id
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${P.cardBorder}` }}>
      <Avatar nom={c.nom} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: P.text }}>{c.nom}</div>
        <div style={{ fontSize: 11, color: P.textMuted }}>{c.email} · {c.nb_stations ?? 0} station{(c.nb_stations ?? 0) > 1 ? 's' : ''}</div>
      </div>
      <PlanBadge plan={c.sub_plan} />
      <span style={{ fontSize: 12, fontWeight: 700, color: P.green, fontVariantNumeric: 'tabular-nums' }}>{fmt$(c.sub_montant)}</span>
      {c.sub_id && c.sub_statut === 'en_attente' && (
        <button disabled={isAct} onClick={() => onValider(c.sub_id)} style={{ ...btnSmall, background: 'rgba(16,185,129,0.1)', color: P.green, border: `1px solid rgba(16,185,129,0.2)`, opacity: isAct ? 0.5 : 1 }}>
          <I d={Ic.check} size={11} color={P.green} /> Valider
        </button>
      )}
      {c.sub_id && c.sub_statut === 'actif' && (
        <button disabled={isAct} onClick={() => onSuspendre(c.sub_id)} style={{ ...btnSmall, background: 'rgba(239,68,68,0.08)', color: P.red, border: `1px solid rgba(239,68,68,0.2)`, opacity: isAct ? 0.5 : 1 }}>
          <I d={Ic.pause} size={11} color={P.red} /> Suspendre
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {Array.from({length:6}).map((_,i) => (
          <div key={i} style={{ height: 110, background: P.card, borderRadius: 14, border: `1px solid ${P.cardBorder}` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <div style={{ height: 250, background: P.card, borderRadius: 14, border: `1px solid ${P.cardBorder}` }} />
        <div style={{ height: 250, background: P.card, borderRadius: 14, border: `1px solid ${P.cardBorder}` }} />
      </div>
    </div>
  )
}

// ── Styles partagés ───────────────────────────────────────
const inputSt  = { padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.cardBorder}`, borderRadius: 8, color: P.text, fontSize: 13, outline: 'none', fontFamily: '"DM Sans",sans-serif' }
const selectSt = { ...inputSt, cursor: 'pointer' }
const btnSt    = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans",sans-serif' }
const btnSmall = { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: '"DM Sans",sans-serif' }
const paginBtn = { width: 30, height: 30, borderRadius: 6, border: `1px solid ${P.cardBorder}`, background: 'transparent', color: P.textSub, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans",sans-serif' }

function GlobalStyles() {
  return (
    <style>{`
      @keyframes pulseDot {
        0%,100%{opacity:1;box-shadow:0 0 6px currentColor}
        50%{opacity:0.4;box-shadow:0 0 14px currentColor}
      }
      * { scrollbar-width: thin; scrollbar-color: rgba(139,92,246,0.3) transparent; }
      *::-webkit-scrollbar { width: 5px; height: 5px; }
      *::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }
    `}</style>
  )
}
