// ================================================
// FUELO — Centre de notifications (cloche + dropdown)
// Réutilisable dans toutes les barres (tous les rôles)
// ================================================

import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../context/ThemeContext'

const TYPE_META = {
  alerte:  { icon: '⚠️', color: '#EF4444', bg: 'rgba(239,68,68,0.14)' },
  vente:   { icon: '💰', color: '#22C55E', bg: 'rgba(34,197,94,0.14)' },
  info:    { icon: '📢', color: '#2563EB', bg: 'rgba(37,99,235,0.14)' },
  rapport: { icon: '📊', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  default: { icon: '🔔', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
}

function tempsRelatif(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000), h = Math.floor(min / 60), j = Math.floor(h / 24)
  if (j > 0)   return `il y a ${j} j`
  if (h > 0)   return `il y a ${h} h`
  if (min > 0) return `il y a ${min} min`
  return 'à l\'instant'
}

export default function NotifCenter({ size = 36, color, bg, border }) {
  const navigate = useNavigate()
  const { palette } = useTheme()
  const { notifications, nonLues, isLoading, marquerLu, marquerToutLu } = useNotifications()
  const [open, setOpen]     = useState(false)
  const [filtre, setFiltre] = useState('toutes') // 'toutes' | 'non_lues'
  const [coords, setCoords] = useState(null)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Le panneau est `position: fixed` et positionné à partir de la cloche, puis
  // borné dans le viewport — sinon, ancré dans la sidebar étroite (220px) avec
  // une largeur de 360px, il débordait hors de l'écran à gauche (non responsive).
  useLayoutEffect(() => {
    if (!open) { setCoords(null); return }
    const compute = () => {
      const el = btnRef.current
      if (!el) return
      const r      = el.getBoundingClientRect()
      const margin = 12
      const width  = Math.min(360, window.innerWidth - margin * 2)
      // On aligne le bord droit du panneau sur la cloche, puis on borne à l'écran
      let left = r.right - width
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
      setCoords({ top: r.bottom + 8, left, width })
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('scroll', compute, true)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('scroll', compute, true)
    }
  }, [open])

  const liste = filtre === 'non_lues' ? notifications.filter(n => !n.lu) : notifications

  const openNotif = (n) => {
    if (!n.lu) marquerLu(n.id)
    if (n.lien_url) { setOpen(false); navigate(n.lien_url) }
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Cloche */}
      <button ref={btnRef} onClick={() => setOpen(o => !o)} title="Notifications"
        style={{ position: 'relative', width: size, height: size, borderRadius: 8, background: bg ?? 'rgba(255,255,255,0.06)', border: `1px solid ${border ?? palette.cardBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: color ?? palette.textSub }}>
        <svg width={Math.round(size * 0.46)} height={Math.round(size * 0.46)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {nonLues > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 99, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {nonLues > 99 ? '99+' : nonLues}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && coords && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed', top: coords.top, left: coords.left, zIndex: 1000,
              width: coords.width, maxHeight: 'min(440px, calc(100vh - 80px))',
              background: palette.card, border: `1px solid ${palette.cardBorder}`,
              borderRadius: 16, boxShadow: '0 16px 50px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${palette.cardBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: palette.text }}>
                  Notifications {nonLues > 0 && <span style={{ marginLeft: 6, background: '#2563EB', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '2px 7px' }}>{nonLues}</span>}
                </div>
                {nonLues > 0 && (
                  <button onClick={() => marquerToutLu()} style={{ fontSize: 11, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    Tout lire
                  </button>
                )}
              </div>
              {/* Filtres */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {[['toutes', 'Toutes'], ['non_lues', `Non lues${nonLues ? ` (${nonLues})` : ''}`]].map(([k, l]) => (
                  <button key={k} onClick={() => setFiltre(k)}
                    style={{ padding: '4px 12px', borderRadius: 99, border: `1px solid ${filtre === k ? '#2563EB' : palette.cardBorder}`, background: filtre === k ? 'rgba(37,99,235,0.12)' : 'transparent', color: filtre === k ? '#2563EB' : palette.textSub, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {isLoading ? (
                <div style={{ padding: 30, textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Chargement…</div>
              ) : liste.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>🔔</div>
                  <div style={{ fontSize: 13, color: palette.textSub, fontWeight: 600 }}>Tout est calme</div>
                  <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 3 }}>{filtre === 'non_lues' ? 'Aucune notification non lue' : 'Aucune notification'}</div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {liste.map(n => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.default
                    return (
                      <motion.div key={n.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        onClick={() => openNotif(n)}
                        style={{ display: 'flex', gap: 11, padding: '11px 12px', borderRadius: 10, marginBottom: 3, cursor: (n.lien_url || !n.lu) ? 'pointer' : 'default', background: n.lu ? 'transparent' : 'rgba(37,99,235,0.07)', border: `1px solid ${n.lu ? 'transparent' : 'rgba(37,99,235,0.16)'}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{meta.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: n.lu ? 500 : 700, color: palette.text }}>{n.titre}</span>
                            {!n.lu && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 4 }} />}
                          </div>
                          {n.corps && <div style={{ fontSize: 12, color: palette.textSub, marginTop: 2, lineHeight: 1.45 }}>{n.corps}</div>}
                          <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 4 }}>{tempsRelatif(n.created_at)}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
