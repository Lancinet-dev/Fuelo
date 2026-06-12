// ================================================
// FUELO — Journal d'activité
// ================================================

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useActivite, useActiviteEmployes } from '../../hooks/useActivite'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonStyle } from '../../ui/Skeleton'
import theme from '../../config/theme'

// ── Helpers ───────────────────────────────────────────────────────

function padZero(n) { return String(n).padStart(2, '0') }

function formatHeure(dateStr) {
  const d = new Date(dateStr)
  return `${padZero(d.getHours())}h${padZero(d.getMinutes())}`
}

function formatJour(dateStr) {
  const d   = new Date(dateStr)
  const now = new Date()
  const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  const base = `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`
  if (d.toDateString() === now.toDateString())              return `Aujourd\'hui, ${base}`
  const hier = new Date(now); hier.setDate(now.getDate() - 1)
  if (d.toDateString() === hier.toDateString())             return `Hier, ${base}`
  return base
}

function formatNombre(n) {
  return Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ── Config événements ─────────────────────────────────────────────

const EVENT_CONFIG = {
  vente: {
    color:   '#2563EB',
    bgLight: 'rgba(37,99,235,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    label: (e) => {
      const l = e.litres ? `${formatNombre(Math.round(e.litres))} L` : ''
      const m = e.montant ? `${formatNombre(Math.round(e.montant))} GNF` : ''
      const parts = [e.acteur, l && `${l} de ${e.sous_type ?? 'carburant'}`, m].filter(Boolean)
      return parts.join(' — ')
    },
  },
  service_debut: {
    color:   '#10B981',
    bgLight: 'rgba(16,185,129,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    label: (e) => {
      const parts = [`${e.acteur ?? 'Pompiste'} a démarré son service`]
      if (e.litres) parts.push(`compteur : ${formatNombre(Math.round(e.litres))}`)
      return parts.join(' — ')
    },
  },
  service_fin: {
    color:   '#6366F1',
    bgLight: 'rgba(99,102,241,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    label: (e) => {
      const parts = [`${e.acteur ?? 'Pompiste'} a terminé son service`]
      if (e.litres) parts.push(`${formatNombre(Math.round(e.litres))} L enregistrés`)
      if (e.message) parts.push(`théo. : ${formatNombre(Math.round(e.message))} L`)
      return parts.join(' — ')
    },
  },
  alerte: {
    color:   '#F59E0B',
    bgLight: 'rgba(245,158,11,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
      </svg>
    ),
    label: (e) => e.message ?? e.sous_type ?? 'Alerte déclenchée',
  },
  default: {
    color:   '#6B7280',
    bgLight: 'rgba(107,114,128,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: (e) => {
      if (e.acteur) return `${e.acteur} — ${e.type?.replace(/_/g, ' ').toLowerCase()}`
      return e.type?.replace(/_/g, ' ').toLowerCase() ?? 'Action'
    },
  },
}

function getConfig(type) {
  if (!type) return EVENT_CONFIG.default
  const t = type.toLowerCase()
  if (t === 'vente')          return EVENT_CONFIG.vente
  if (t === 'service_debut')  return EVENT_CONFIG.service_debut
  if (t === 'service_fin')    return EVENT_CONFIG.service_fin
  if (t === 'alerte')         return EVENT_CONFIG.alerte
  return EVENT_CONFIG.default
}

// ── Composant ligne événement ─────────────────────────────────────

function EventRow({ event, palette, isDark }) {
  const cfg = getConfig(event.type)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: isDark ? `${cfg.color}12` : cfg.bgLight, border: `1px solid ${cfg.color}22`, marginBottom: 6 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: palette.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cfg.label(event)}
        </div>
        {event.sous_type && event.type !== 'alerte' && (
          <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2, textTransform: 'capitalize' }}>
            {event.sous_type}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500, flexShrink: 0 }}>
        {formatHeure(event.date)}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────

export default function ActivitePage() {
  const { palette, isDark } = useTheme()

  const today   = new Date()
  const il30j   = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fmt     = (d) => d.toISOString().slice(0, 10)

  const [employe, setEmploye] = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [debut, setDebut]     = useState(fmt(il30j))
  const [fin, setFin]         = useState(fmt(today))

  const { activite, loading, refetch } = useActivite({
    debut, fin,
    employe_id: employe || undefined,
    type:       typeFiltre || undefined,
    limite:     100,
  })

  const { employes } = useActiviteEmployes()

  // Grouper par jour
  const grouped = useMemo(() => {
    const map = {}
    for (const e of activite) {
      const key = new Date(e.date).toDateString()
      if (!map[key]) map[key] = { label: formatJour(e.date), events: [] }
      map[key].events.push(e)
    }
    return Object.values(map)
  }, [activite])

  const inputStyle = {
    height: 36, padding: '0 10px', borderRadius: 8,
    border: `1px solid ${palette.cardBorder}`,
    background: palette.card,
    color: palette.text, fontSize: 13,
    fontFamily: 'inherit', outline: 'none',
  }

  const selectStyle = { ...inputStyle, paddingRight: 4, cursor: 'pointer' }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Journal d'activité
        </h1>
        <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
          Toutes les actions de votre équipe — ventes, services, alertes
        </p>
      </div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, padding: '16px 18px', background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, boxShadow: theme.shadow.sm, alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>Du</span>
          <input type="date" value={debut} onChange={e => setDebut(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500 }}>au</span>
          <input type="date" value={fin} onChange={e => setFin(e.target.value)} style={inputStyle} />
        </div>
        <select value={employe} onChange={e => setEmploye(e.target.value)} style={selectStyle}>
          <option value="">Tous les employés</option>
          {employes.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nom} ({emp.role})</option>
          ))}
        </select>
        <select value={typeFiltre} onChange={e => setTypeFiltre(e.target.value)} style={selectStyle}>
          <option value="">Tous les types</option>
          <option value="vente">Ventes</option>
          <option value="service">Services</option>
          <option value="alerte">Alertes</option>
        </select>
        <button
          onClick={refetch}
          style={{ height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Actualiser
        </button>
      </motion.div>

      {/* Timeline */}
      {loading ? (
        <>
          <SkeletonStyle />
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 52, borderRadius: 10, background: palette.card, border: `1px solid ${palette.cardBorder}`, marginBottom: 8, opacity: 1 - i * 0.12 }} />
          ))}
        </>
      ) : grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: palette.textMuted }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16, opacity: 0.4 }}>
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: palette.textSub, marginBottom: 6 }}>Aucune activité</div>
          <div style={{ fontSize: 13 }}>Modifiez les filtres pour voir les événements</div>
        </div>
      ) : (
        grouped.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04, duration: 0.28 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, paddingLeft: 4 }}>
              {group.label}
              <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 11, opacity: 0.7 }}>
                {group.events.length} événement{group.events.length > 1 ? 's' : ''}
              </span>
            </div>
            {group.events.map(event => (
              <EventRow key={`${event.type}-${event.id}-${event.date}`} event={event} palette={palette} isDark={isDark} />
            ))}
          </motion.div>
        ))
      )}
    </div>
  )
}
