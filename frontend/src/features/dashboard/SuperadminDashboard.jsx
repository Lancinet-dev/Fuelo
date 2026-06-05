// ================================================
// FUELO — Dashboard Superadmin
// ================================================

import { useState } from 'react'
import { useTheme }         from '../../context/ThemeContext'
import { useAdminStats, useAdminClients } from '../../hooks/useAdminStats'
import theme from '../../config/theme'

const ICONS = {
  clients:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',
  stations: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  revenue:  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  pending:  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  refresh:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  check:    'M5 13l4 4L19 7',
  pause:    'M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z',
  chevron:  'M9 18l6-6-6-6',
}

const STATUT = {
  actif:      { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Actif'       },
  en_attente: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'En attente'  },
  suspendu:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Suspendu'    },
  expire:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)',label: 'Expiré'      },
}

const PLAN = {
  STARTER:    { color: '#94A3B8', label: 'Starter'    },
  PRO:        { color: '#2563EB', label: 'Pro'        },
  ENTERPRISE: { color: '#8B5CF6', label: 'Enterprise' },
}

function Icon({ d, size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function StatCard({ label, value, sub, iconD, color, pulse }) {
  const { palette } = useTheme()
  return (
    <div style={{
      background: palette.card, border: `1px solid ${palette.cardBorder}`,
      borderRadius: 16, padding: '18px 20px', boxShadow: theme.shadow.sm,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pulse && <div style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: color, top: 14, right: 14, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.5s infinite' }} />}
          <Icon d={iconD} size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: palette.textSub }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

const COLS = '2fr 1.6fr 95px 105px 60px 110px 100px 130px'

export default function SuperadminDashboard() {
  const { palette, isDark } = useTheme()
  const { stats, loading: statsLoading, refetch: refetchStats }               = useAdminStats()
  const { clients, loading: clientsLoading, refetch: refetchClients, valider, suspendre } = useAdminClients()

  const [actionLoading, setActionLoading] = useState(null)
  const [search, setSearch]               = useState('')

  const refetch = () => { refetchStats(); refetchClients() }

  const handleValider = async (subId) => {
    setActionLoading({ id: subId, type: 'valider' })
    try { await valider(subId) } finally { setActionLoading(null) }
  }

  const handleSuspendre = async (subId) => {
    setActionLoading({ id: subId, type: 'suspendre' })
    try { await suspendre(subId) } finally { setActionLoading(null) }
  }

  const filtered = clients.filter(c =>
    !search ||
    c.nom?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const subs      = stats.abonnements ?? {}
  const enAttente = subs.en_attente  ?? 0

  if (statsLoading) return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 110, background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16 }} />
        ))}
      </div>
      <div style={{ height: 400, background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16 }} />
    </div>
  )

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1300, margin: '0 auto' }} className="fuelo-dashboard">

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 99, padding: '3px 12px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', letterSpacing: '0.04em' }}>Super Admin</span>
            </div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: palette.text, letterSpacing: '-0.6px', margin: 0, marginBottom: 5, lineHeight: 1.1 }}>
            Vue globale
          </h1>
          <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={refetch}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: palette.textSub, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', boxShadow: theme.shadow.sm, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = palette.cardBorder; e.currentTarget.style.color = palette.textSub }}>
          <Icon d={ICONS.refresh} size={13} />
          Actualiser
        </button>
      </div>

      {/* ── Bannière en attente ─────────────────────── */}
      {enAttente > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)', borderRadius: 14, padding: '13px 18px', marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'alertPulse 1.5s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, flex: 1 }}>
            {enAttente} abonnement{enAttente > 1 ? 's' : ''} en attente de validation — voir ci-dessous
          </span>
          <Icon d={ICONS.chevron} size={14} color="#F59E0B" />
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="fuelo-grid-4">
        <StatCard
          label="Clients enregistrés"
          value={String(stats.nb_clients ?? 0)}
          iconD={ICONS.clients}
          color={theme.colors.primary}
        />
        <StatCard
          label="Stations suivies"
          value={String(stats.nb_stations ?? 0)}
          iconD={ICONS.stations}
          color={theme.colors.success}
        />
        <StatCard
          label="Revenus actifs (MRR)"
          value={`$${Math.round(stats.revenue_actif ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`}
          sub={`${subs.actif ?? 0} abonnement${(subs.actif ?? 0) !== 1 ? 's' : ''} actif${(subs.actif ?? 0) !== 1 ? 's' : ''}`}
          iconD={ICONS.revenue}
          color="#8B5CF6"
        />
        <StatCard
          label="En attente de validation"
          value={String(enAttente)}
          sub={`${subs.suspendu ?? 0} suspendu · ${subs.expire ?? 0} expiré`}
          iconD={ICONS.pending}
          color={enAttente > 0 ? theme.colors.warning : theme.colors.textMuted}
          pulse={enAttente > 0}
        />
      </div>

      {/* ── Tableau clients ─────────────────────────── */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 16, boxShadow: theme.shadow.sm, overflow: 'hidden' }}>

        {/* Header tableau */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${palette.cardBorder}`, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Tous les clients</div>
            <div style={{ fontSize: 11, color: palette.textSub, marginTop: 2 }}>
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{
              padding: '8px 14px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`,
              background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
              color: palette.text, fontSize: 13, outline: 'none', width: 200,
              fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#8B5CF6' }}
            onBlur={e  => { e.currentTarget.style.borderColor = palette.cardBorder }}
          />
        </div>

        {/* Desktop : en-tête + lignes scrollables */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 860 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: COLS,
              padding: '8px 20px', gap: 10,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderBottom: `1px solid ${palette.cardBorder}`,
            }} className="admin-header">
              {['Client', 'Email', 'Plan', 'Statut', 'Sites', 'Paiement', 'Expire', 'Actions'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
              ))}
            </div>

            {clientsLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Chargement...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Aucun client trouvé</div>
            ) : filtered.map((client, i) => {
              const s = STATUT[client.sub_statut] ?? STATUT.expire
              const p = PLAN[client.sub_plan]     ?? { color: '#94A3B8', label: client.sub_plan ?? '—' }
              const isLast      = i === filtered.length - 1
              const isActioning = actionLoading?.id === client.sub_id
              const expireDate  = client.expires_at
                ? new Date(client.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
                : '—'
              return (
                <div key={client.id} className="admin-row"
                  style={{ display: 'grid', gridTemplateColumns: COLS, padding: '12px 20px', gap: 10, alignItems: 'center', borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: theme.colors.primary }}>
                      {(client.nom ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.nom ?? '—'}</span>
                  </div>
                  <span style={{ fontSize: 12, color: palette.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: p.color + '18', borderRadius: 99, padding: '3px 10px', display: 'inline-block', whiteSpace: 'nowrap' }}>{p.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 99, padding: '3px 10px', display: 'inline-block', whiteSpace: 'nowrap' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{client.nb_stations ?? 0}</span>
                  <span style={{ fontSize: 11, color: palette.textSub, textTransform: 'capitalize' }}>{client.payment_method ?? '—'}</span>
                  <span style={{ fontSize: 11, color: palette.textSub, fontFamily: theme.font.mono }}>{expireDate}</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {client.sub_id && client.sub_statut === 'en_attente' && (
                      <button disabled={isActioning} onClick={() => handleValider(client.sub_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700, cursor: isActioning ? 'default' : 'pointer', fontFamily: 'inherit', opacity: isActioning ? 0.6 : 1 }}>
                        <Icon d={ICONS.check} size={11} color="#10B981" /> Valider
                      </button>
                    )}
                    {client.sub_id && client.sub_statut === 'actif' && (
                      <button disabled={isActioning} onClick={() => handleSuspendre(client.sub_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: isActioning ? 'default' : 'pointer', fontFamily: 'inherit', opacity: isActioning ? 0.6 : 1 }}>
                        <Icon d={ICONS.pause} size={11} color="#EF4444" /> Suspendre
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile : cards */}
        <div className="admin-mobile-list">
          {!clientsLoading && filtered.map((client, i) => {
            const s = STATUT[client.sub_statut] ?? STATUT.expire
            const p = PLAN[client.sub_plan]     ?? { color: '#94A3B8', label: client.sub_plan ?? '—' }
            const isLast      = i === filtered.length - 1
            const isActioning = actionLoading?.id === client.sub_id
            return (
              <div key={client.id} style={{ padding: '14px 16px', borderBottom: isLast ? 'none' : `1px solid ${palette.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: theme.colors.primary, flexShrink: 0 }}>
                      {(client.nom ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>{client.nom ?? '—'}</div>
                      <div style={{ fontSize: 11, color: palette.textSub, marginTop: 1 }}>{client.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {client.sub_id && client.sub_statut === 'en_attente' && (
                      <button disabled={isActioning} onClick={() => handleValider(client.sub_id)}
                        style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Valider
                      </button>
                    )}
                    {client.sub_id && client.sub_statut === 'actif' && (
                      <button disabled={isActioning} onClick={() => handleSuspendre(client.sub_id)}
                        style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Suspendre
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color, background: p.color + '18', borderRadius: 99, padding: '2px 9px' }}>{p.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 99, padding: '2px 9px' }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: palette.textMuted }}>{client.nb_stations ?? 0} site{(client.nb_stations ?? 0) > 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
          {!clientsLoading && filtered.length === 0 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Aucun client trouvé</div>
          )}
          {clientsLoading && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Chargement...</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes alertPulse { 0%,100%{opacity:1;box-shadow:0 0 6px rgba(245,158,11,0.6)} 50%{opacity:0.5;box-shadow:0 0 12px rgba(245,158,11,0.9)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .admin-mobile-list { display: none; }
        @media (max-width: 1200px) {
          .fuelo-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .fuelo-dashboard   { padding: 16px 14px !important; }
          .fuelo-grid-4      { grid-template-columns: 1fr 1fr !important; }
          .admin-header      { display: none !important; }
          .admin-row         { display: none !important; }
          .admin-mobile-list { display: block !important; }
        }
        @media (max-width: 480px) {
          .fuelo-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
