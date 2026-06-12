// ================================================
// FUELO — Panneau notifications in-app
// ================================================

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../context/ThemeContext'

const TYPE_ICONS = {
  alerte:  { icon: '⚠️', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  vente:   { icon: '💰', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  info:    { icon: '📢', color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  rapport: { icon: '📊', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  default: { icon: '🔔', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
}

function tempsRelatif(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(min / 60)
  const j    = Math.floor(h / 24)
  if (j > 0)  return `il y a ${j}j`
  if (h > 0)  return `il y a ${h}h`
  if (min > 0) return `il y a ${min}min`
  return 'à l\'instant'
}

function NotifItem({ notif, onMarquerLu, palette }) {
  const meta  = TYPE_ICONS[notif.type] ?? TYPE_ICONS.default
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={() => !notif.lu && onMarquerLu(notif.id)}
      style={{
        display: 'flex', gap: 12, padding: '12px 14px',
        borderRadius: 10, cursor: notif.lu ? 'default' : 'pointer',
        background: notif.lu ? 'transparent' : 'rgba(37,99,235,0.06)',
        border: notif.lu ? `1px solid transparent` : `1px solid rgba(37,99,235,0.14)`,
        transition: 'background 0.2s',
        marginBottom: 4,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: meta.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 14,
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: notif.lu ? 400 : 600, color: palette.text, lineHeight: 1.4 }}>
            {notif.titre}
          </span>
          {!notif.lu && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0, marginTop: 4 }} />
          )}
        </div>
        {notif.corps && (
          <div style={{ fontSize: 12, color: palette.textSub, marginTop: 2, lineHeight: 1.5 }}>
            {notif.corps}
          </div>
        )}
        <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>
          {tempsRelatif(notif.created_at)}
        </div>
      </div>
    </motion.div>
  )
}

export function NotifBell({ onClick, count, palette }) {
  return (
    <button
      onClick={onClick}
      title="Notifications"
      style={{
        position: 'relative', width: 32, height: 32, borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${palette.sidebarBorder}`,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: palette.textSub, flexShrink: 0, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = palette.text }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = palette.textSub }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: '#fff',
              fontSize: 9, fontWeight: 700,
              borderRadius: 10, padding: '1px 4px',
              minWidth: 14, textAlign: 'center',
              lineHeight: '14px',
              boxShadow: '0 0 0 2px var(--sidebar-bg, #0f172a)',
            }}
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export default function NotificationsPanel({ open, onClose }) {
  const { palette } = useTheme()
  const { notifications, nonLues, isLoading, marquerLu, marquerToutLu } = useNotifications()
  const panelRef = useRef(null)

  // Fermer sur clic extérieur
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  const handleToutLu = async () => {
    await marquerToutLu()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', top: 0, left: 220, width: 320, height: '100vh',
            background: palette.card,
            borderRight: `1px solid ${palette.cardBorder}`,
            boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
            zIndex: 60,
            display: 'flex', flexDirection: 'column',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 14px 12px',
            borderBottom: `1px solid ${palette.cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>
                Notifications
                {nonLues > 0 && (
                  <span style={{ marginLeft: 8, background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 7px' }}>
                    {nonLues}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>
                {notifications.length === 0 ? 'Aucune notification' : `${notifications.length} notifications`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {nonLues > 0 && (
                <button
                  onClick={handleToutLu}
                  style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  Tout lire
                </button>
              )}
              <button
                onClick={onClose}
                style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: `1px solid ${palette.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textMuted, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = palette.text }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = palette.textMuted }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 20px' }}>
            {isLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>
                Chargement…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                <div style={{ fontSize: 13, color: palette.textSub, fontWeight: 500 }}>Tout est calme</div>
                <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>Aucune notification pour le moment</div>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map(n => (
                  <NotifItem key={n.id} notif={n} onMarquerLu={marquerLu} palette={palette} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
