// ================================================
// FUELO — Journal d'activité
// ================================================

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActivite, useActiviteEmployes } from '../../hooks/useActivite'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../hooks/useTranslation'
import EmptyState from '../../ui/EmptyState'
import { SkeletonStyle, SkeletonEvent } from '../../ui/Skeleton'
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
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  const base = `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`
  if (d.toDateString() === now.toDateString()) return `Aujourd'hui, ${base}`
  const hier = new Date(now); hier.setDate(now.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return `Hier, ${base}`
  return base
}

function formatNombre(n) {
  return Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ── Config événements (couleurs depuis theme) ─────────

const EVENT_CONFIG = {
  vente: {
    color:   theme.colors.primary,
    bgLight: theme.colors.primaryLight,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    label: (e) => {
      const l = e.litres ? `${formatNombre(Math.round(e.litres))} L` : ''
      const m = e.montant ? `${formatNombre(Math.round(e.montant))} GNF` : ''
      return [e.acteur, l && `${l} de ${e.sous_type ?? 'carburant'}`, m].filter(Boolean).join(' — ')
    },
  },
  service_debut: {
    color:   theme.colors.success,
    bgLight: theme.colors.successLight,
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
    color:   theme.colors.info,
    bgLight: theme.colors.infoLight,
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
    color:   theme.colors.warning,
    bgLight: theme.colors.warningLight,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
      </svg>
    ),
    label: (e) => e.message ?? e.sous_type ?? 'Alerte déclenchée',
  },
  default: {
    color:   theme.colors.textSub,
    bgLight: 'rgba(107,114,128,0.08)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
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
  return EVENT_CONFIG[t] ?? EVENT_CONFIG.default
}

// ── Stagger variants ──────────────────────────────────

const LIST_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const LIST_ITEM = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
}

// ── Composant ligne événement ─────────────────────────

function EventRow({ event, palette, isDark }) {
  const cfg = getConfig(event.type)
  return (
    <motion.div
      variants={LIST_ITEM}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: theme.radius.md, background: isDark ? `${cfg.color}12` : cfg.bgLight, border: `1px solid ${cfg.color}22`, marginBottom: 6 }}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
    >
      <div style={{ width: 32, height: 32, borderRadius: theme.radius.md, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>
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
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────────

export default function ActivitePage() {
  const { palette, isDark } = useTheme()
  const { t } = useTranslation()

  const today = new Date()
  const il30j = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fmt   = (d) => d.toISOString().slice(0, 10)

  const [employe,    setEmploye]    = useState('')
  const [typeFiltre, setTypeFiltre] = useState('')
  const [debut,      setDebut]      = useState(fmt(il30j))
  const [fin,        setFin]        = useState(fmt(today))

  const { activite, loading, refetch } = useActivite({
    debut, fin,
    employe_id: employe || undefined,
    type:       typeFiltre || undefined,
    limite:     100,
  })

  const { employes } = useActiviteEmployes()

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
    height: 36, padding: '0 10px', borderRadius: theme.radius.button,
    border: `1px solid ${palette.cardBorder}`,
    background: palette.card,
    color: palette.text, fontSize: 13,
    fontFamily: theme.font.family, outline: 'none',
    transition: theme.transition.fast,
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <SkeletonStyle />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          {t('activite.title')}
        </h1>
        <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
          {t('activite.subtitle')}
        </p>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.3 }}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24, padding: '16px 18px', background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, boxShadow: theme.shadow.sm, alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>{t('activite.du')}</span>
          <input type="date" value={debut} onChange={e => setDebut(e.target.value)} style={inputStyle}
            onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
            onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500 }}>{t('activite.au')}</span>
          <input type="date" value={fin} onChange={e => setFin(e.target.value)} style={inputStyle}
            onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
            onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }} />
        </div>
        <select value={employe} onChange={e => setEmploye(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">{t('activite.tousEmployes')}</option>
          {employes.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nom} ({emp.role})</option>
          ))}
        </select>
        <select value={typeFiltre} onChange={e => setTypeFiltre(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">{t('activite.tousTypes')}</option>
          <option value="vente">{t('activite.ventes')}</option>
          <option value="service">{t('activite.services')}</option>
          <option value="alerte">{t('activite.alertes')}</option>
        </select>
        <motion.button
          whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={refetch}
          style={{ height: 36, padding: '0 16px', borderRadius: theme.radius.button, border: 'none', background: theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 6, boxShadow: theme.shadow.primary }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          {t('common.refresh')}
        </motion.button>
      </motion.div>

      {/* Timeline */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(6)].map((_, i) => <SkeletonEvent key={i} />)}
          </motion.div>
        ) : grouped.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, boxShadow: theme.shadow.sm }}>
            <EmptyState type="activite" />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {grouped.map((group, gi) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, duration: 0.28 }}
                style={{ marginBottom: 24 }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, paddingLeft: 4 }}>
                  {group.label}
                  <span style={{ marginLeft: 8, fontWeight: 500, fontSize: 11, opacity: 0.7 }}>
                    {group.events.length} {t('activite.evenements')}
                  </span>
                </div>
                <motion.div variants={LIST_CONTAINER} initial="hidden" animate="show">
                  {group.events.map(event => (
                    <EventRow key={`${event.type}-${event.id}-${event.date}`} event={event} palette={palette} isDark={isDark} />
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
