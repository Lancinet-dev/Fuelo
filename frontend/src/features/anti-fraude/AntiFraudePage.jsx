// ================================================
// FUELO V2 — Centre Anti-Fraude (glassmorphism premium)
// Fichier : frontend/src/features/anti-fraude/AntiFraudePage.jsx
// ================================================

import { useState, useMemo, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../hooks/useTranslation'
import { useAntiFraude, useMarquerResolu } from '../../hooks/useAntiFraude'
import EmptyState from '../../ui/EmptyState'
import Shimmer, { SkeletonStatCard, SkeletonStyle } from '../../ui/Skeleton'
import theme from '../../config/theme'
import { formatGNF, formatDateTime } from '../../utils/format'
// export.js (jsPDF + ExcelJS ≈ 1,4 Mo) chargé dynamiquement au clic — voir handlers

// ── Icônes (chemins simples validés) ──────────────
const ICONS = {
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  shieldChk: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  alert:     'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  cash:      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  users:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z',
  percent:   'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  pdf:       'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  excel:     'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  search:    'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z',
  close:     'M18 6L6 18M6 6l12 12',
  check:     'M20 6L9 17l-5-5',
  clock:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  eye:       'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6',
  camera:    'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  download:  'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  truck:     'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  qr:        'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z',
  calendar:  'M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18',
}

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const fmt = (n) => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const formatEcart = (a) => {
  if (a.type === 'FRAUDE') {
    const parts = []
    if (Math.abs(a.ecartEssence) >= 0.05) parts.push(`Essence ${a.ecartEssence > 0 ? '+' : ''}${a.ecartEssence.toFixed(1)} L`)
    if (Math.abs(a.ecartGasoil)  >= 0.05) parts.push(`Gasoil ${a.ecartGasoil > 0 ? '+' : ''}${a.ecartGasoil.toFixed(1)} L`)
    return parts.length ? parts.join(' · ') : '—'
  }
  return `${a.ecart > 0 ? '+' : ''}${(a.ecart ?? 0).toFixed(1)} L`
}

const downloadImage = async (url, filename) => {
  if (!url) return
  try {
    const resp   = await fetch(url)
    const blob   = await resp.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl; a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(objUrl)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

// ── Petits composants partagés ─────────────────────
function GlassCard({ children, palette, isDark, style = {} }) {
  return (
    <div style={{
      background: isDark ? palette.glass : palette.card,
      backdropFilter: isDark ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
      border: `1px solid ${palette.cardBorder}`,
      borderRadius: theme.radius.card,
      boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title, subtitle, color, palette }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <span style={{ width: 36, height: 36, borderRadius: 11, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
      </span>
      <div>
        <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: palette.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color, background: bg ?? `${color}15`, padding: '3px 10px', borderRadius: theme.radius.full, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function Avatar({ label, color, icon }) {
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
      boxShadow: `0 4px 16px ${color}45`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: '#fff',
    }}>
      {label || (icon && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>)}
    </div>
  )
}

function ScoreBar({ score, color, palette }) {
  const s = score ?? 0
  return (
    <div style={{ width: '100%', height: 6, background: palette.hover, borderRadius: theme.radius.full, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${s}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: theme.radius.full, background: color }}
      />
    </div>
  )
}

function PillButton({ children, onClick, color, variant = 'soft', disabled, icon }) {
  const soft   = variant === 'soft'
  return (
    <motion.button
      whileHover={{ y: disabled ? 0 : -1 }} whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: theme.radius.button,
        border: soft ? `1px solid ${color}30` : 'none',
        background: soft ? `${color}12` : color,
        color: soft ? color : '#fff',
        fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: theme.font.family,
        whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1, transition: theme.transition.hover,
      }}>
      {icon && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>}
      {children}
    </motion.button>
  )
}

const SELECT_STYLE = (palette) => ({
  height: 36, padding: '0 12px', background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`,
  borderRadius: theme.radius.button, color: palette.text, fontSize: theme.font.size.sm, fontFamily: theme.font.family,
  outline: 'none', cursor: 'pointer', transition: theme.transition.hover, minWidth: 130,
})

// ── Tooltip graphiques ─────────────────────────────
function ChartTooltip({ active, payload, label, palette }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: '10px 14px', boxShadow: theme.shadow.md }}>
      <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 6 }}>{label}</div>
      {payload.filter(p => p.value > 0 || payload.length === 1).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: p.color, fontFamily: theme.font.mono }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          {p.name} : {p.value}
        </div>
      ))}
    </div>
  )
}

// ── Heatmap jours / heures ─────────────────────────
function Heatmap({ data, max, palette, isDark }) {
  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0))
    data.forEach(c => { g[c.jour][c.heure] = c.count })
    return g
  }, [data])

  const colorFor = (count) => {
    if (count === 0) return isDark ? 'rgba(255,255,255,0.04)' : palette.hover
    const intensity = max > 0 ? count / max : 0
    return `rgba(239,68,68,${(0.18 + intensity * 0.72).toFixed(2)})`
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '38px repeat(24, minmax(20px, 1fr))', gap: 3, minWidth: 640 }}>
        <div />
        {[...Array(24)].map((_, h) => (
          <div key={h} style={{ fontSize: 9, color: palette.textMuted, textAlign: 'center' }}>{h % 2 === 0 ? h : ''}</div>
        ))}
        {JOURS.map((jour, j) => (
          <Fragment key={j}>
            <div style={{ fontSize: 10, fontWeight: theme.font.weight.semi, color: palette.textSub, display: 'flex', alignItems: 'center' }}>{jour}</div>
            {grid[j].map((count, h) => (
              <motion.div key={h}
                whileHover={{ scale: 1.2, zIndex: 2 }}
                title={`${jour} ${h}h — ${count} cas de fraude`}
                style={{ aspectRatio: '1', borderRadius: 4, background: colorFor(count), border: `1px solid ${palette.cardBorder}`, cursor: 'default' }}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: theme.font.size.xs, color: palette.textMuted }}>
        <span>Calme</span>
        {[0, 0.25, 0.5, 0.75, 1].map(i => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: 4, background: i === 0 ? (isDark ? 'rgba(255,255,255,0.04)' : palette.hover) : `rgba(239,68,68,${(0.18 + i * 0.72).toFixed(2)})`, border: `1px solid ${palette.cardBorder}` }} />
        ))}
        <span>Critique</span>
      </div>
    </div>
  )
}

// ── Carte photo (preuve) ───────────────────────────
function PhotoCard({ label, url, palette }) {
  return (
    <div style={{ borderRadius: theme.radius.lg, overflow: 'hidden', border: `1px solid ${palette.cardBorder}`, background: palette.hover }}>
      <div style={{ padding: '10px 14px', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, borderBottom: `1px solid ${palette.cardBorder}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {url ? (
        <img src={url} alt={label} style={{ width: '100%', height: 230, objectFit: 'cover', display: 'block' }} loading="lazy" />
      ) : (
        <div style={{ height: 230, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: palette.textMuted }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.camera} /></svg>
          <span style={{ fontSize: theme.font.size.xs }}>Photo non disponible</span>
        </div>
      )}
    </div>
  )
}

// ── Modal preuves photo ────────────────────────────
function ModalPreuves({ alerte, onClose, palette, isDark }) {
  const [downloading, setDownloading] = useState(false)
  const isPompiste  = alerte.type === 'FRAUDE'
  const photoAvant  = isPompiste ? alerte.photoDebut : alerte.photoDepart
  const photoApres  = isPompiste ? alerte.photoFin   : alerte.photoArrivee
  const labelAvant  = isPompiste ? 'Compteur — début de service' : 'Jauge — départ citerne'
  const labelApres  = isPompiste ? 'Compteur — fin de service'   : 'Jauge — arrivée citerne'
  const qrValide    = alerte.qrExpiresAt ? new Date(alerte.qrExpiresAt) > new Date() : null

  const handleTelecharger = async () => {
    setDownloading(true)
    try {
      await Promise.all([
        downloadImage(photoAvant, `Fuelo_Preuve_${alerte.type}_${alerte.id}_avant.jpg`),
        downloadImage(photoApres, `Fuelo_Preuve_${alerte.type}_${alerte.id}_apres.jpg`),
      ])
    } finally { setDownloading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? '#0D1B2A' : palette.card,
          borderRadius: theme.radius.card, border: `1px solid ${palette.cardBorder}`,
          width: '100%', maxWidth: 720, maxHeight: '88vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', boxShadow: isDark ? theme.shadow.premium : theme.shadow.lg,
        }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar label={alerte.personNom?.charAt(0)?.toUpperCase()} color={theme.colors.danger} />
            <div>
              <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: palette.text }}>{alerte.personNom}</div>
              <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginTop: 2 }}>
                Preuves — {isPompiste ? 'Anti-fraude pompiste' : 'Anti-fraude transport'} · {formatDateTime(alerte.date)}
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ background: palette.hover, border: 'none', borderRadius: theme.radius.md, cursor: 'pointer', color: palette.textMuted, padding: 8, display: 'flex', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.close} /></svg>
          </motion.button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
          <div className="fuelo-af-photos" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <PhotoCard label={labelAvant} url={photoAvant} palette={palette} />
            <PhotoCard label={labelApres} url={photoApres} palette={palette} />
          </div>

          {/* Comparaison & écart */}
          <div style={{ borderRadius: theme.radius.lg, border: `1px solid ${theme.colors.danger}30`, background: `${theme.colors.danger}0a`, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color: theme.colors.danger, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Écart calculé automatiquement
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
              <div>
                <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginBottom: 2 }}>Écart détecté</div>
                <div style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.black, color: palette.text, fontFamily: theme.font.mono }}>{formatEcart(alerte)}</div>
              </div>
              <div>
                <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginBottom: 2 }}>Montant perdu estimé</div>
                <div style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.black, color: theme.colors.danger, fontFamily: theme.font.mono }}>{formatGNF(alerte.montantPerdu)}</div>
              </div>
              {!isPompiste && (
                <div>
                  <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginBottom: 2 }}>Quantités (L)</div>
                  <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: palette.text, fontFamily: theme.font.mono }}>
                    {fmt(alerte.qtyDepart)} → {alerte.qtyArrivee != null ? fmt(alerte.qtyArrivee) : '—'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Détail compteurs / jauges */}
          {isPompiste ? (
            <div className="fuelo-af-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
              <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '12px 14px' }}>
                <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Essence (L)</div>
                <div style={{ fontSize: theme.font.size.sm, color: palette.text, fontFamily: theme.font.mono }}>
                  {fmt(alerte.compteurEssenceDebut)} → {fmt(alerte.compteurEssenceFin)}
                </div>
              </div>
              <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '12px 14px' }}>
                <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasoil (L)</div>
                <div style={{ fontSize: theme.font.size.sm, color: palette.text, fontFamily: theme.font.mono }}>
                  {fmt(alerte.compteurGasoilDebut)} → {fmt(alerte.compteurGasoilFin)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: palette.hover, borderRadius: theme.radius.md, padding: '12px 14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={qrValide ? theme.colors.success : theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.qr} /></svg>
              <span style={{ fontSize: theme.font.size.sm, color: palette.text }}>
                QR code : <strong style={{ fontFamily: theme.font.mono }}>{alerte.qrCode ?? '—'}</strong>
              </span>
              {qrValide != null && (
                <Badge label={qrValide ? 'Validé' : 'Expiré'} color={qrValide ? theme.colors.success : theme.colors.textMuted} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'flex-end' }}>
          <PillButton onClick={handleTelecharger} color={theme.colors.primary} variant="solid" disabled={downloading || (!photoAvant && !photoApres)} icon={ICONS.download}>
            {downloading ? 'Téléchargement…' : 'Télécharger les preuves'}
          </PillButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Carte alerte fraude (pompiste ou transport) ────
function AlerteCard({ alerte, index, palette, isDark, onPreuves, onResoudre, isResolving }) {
  const isPompiste = alerte.type === 'FRAUDE'
  const resolu     = alerte.statut === 'resolu'
  const accent     = resolu ? theme.colors.success : theme.colors.danger

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ delay: Math.min(index, 10) * 0.04, duration: 0.3 }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: isDark ? palette.glass : palette.card,
        backdropFilter: isDark ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
        border: `1px solid ${palette.cardBorder}`,
        borderRadius: theme.radius.card, padding: '20px 22px',
        boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
        transition: theme.transition.hover,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}30, 0 14px 38px ${accent}1f` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? theme.shadow.premium : theme.shadow.sm }}
    >
      <div style={{ position: 'absolute', top: -36, right: -36, width: 120, height: 120, borderRadius: '50%', background: accent, opacity: isDark ? 0.10 : 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar label={alerte.personNom?.charAt(0)?.toUpperCase() ?? '?'} color={accent} />
          <div>
            <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: palette.text, marginBottom: 2 }}>{alerte.personNom}</div>
            <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={isPompiste ? ICONS.users : ICONS.truck} /></svg>
              {isPompiste ? 'Pompiste' : 'Chauffeur'} · {formatDateTime(alerte.date)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <Badge label={isPompiste ? 'Fraude pompiste' : 'Fraude citerne'} color={theme.colors.danger} />
          <Badge label={resolu ? 'Résolu' : 'En cours'} color={resolu ? theme.colors.success : theme.colors.warning} />
        </div>
      </div>

      <div className="fuelo-af-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16, position: 'relative' }}>
        <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Écart détecté</div>
          <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.danger, fontFamily: theme.font.mono }}>{formatEcart(alerte)}</div>
        </div>
        <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Montant perdu estimé</div>
          <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: palette.text, fontFamily: theme.font.mono }}>{formatGNF(alerte.montantPerdu)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
        <PillButton onClick={() => onPreuves(alerte)} color={theme.colors.primary} icon={ICONS.eye}>Voir les preuves</PillButton>
        {!resolu && (
          <PillButton onClick={() => onResoudre(isPompiste ? 'service' : 'trajet', alerte.id)} color={theme.colors.success} icon={ICONS.check} disabled={isResolving}>
            Marquer comme résolu
          </PillButton>
        )}
      </div>
    </motion.div>
  )
}

// ── Ligne classement pompiste ──────────────────────
function ClassementRow({ p, index, palette }) {
  const color = p.couleur === 'green' ? theme.colors.success : p.couleur === 'orange' ? theme.colors.warning : theme.colors.danger
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03 }}
      style={{ borderBottom: `1px solid ${palette.cardBorder}` }}
    >
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar label={p.nom?.charAt(0)?.toUpperCase() ?? '?'} color={color} />
          <div>
            <div style={{ fontWeight: theme.font.weight.semi, color: palette.text, fontSize: theme.font.size.sm }}>{p.nom}</div>
            <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>{p.totalServices} service(s)</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', minWidth: 140 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}><ScoreBar score={p.score} color={color} palette={palette} /></div>
          <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.black, color, fontFamily: theme.font.mono, minWidth: 34, textAlign: 'right' }}>{p.score}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: p.fraudes > 0 ? theme.colors.danger : palette.text, fontFamily: theme.font.mono }}>{p.fraudes}</span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <span style={{ fontSize: theme.font.size.sm, color: palette.text, fontFamily: theme.font.mono }}>{p.montantFraude > 0 ? formatGNF(p.montantFraude) : '—'}</span>
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
        <Badge label={p.badge} color={color} />
      </td>
    </motion.tr>
  )
}

// ── Page principale ────────────────────────────────
export default function AntiFraudePage() {
  const { isDark, palette } = useTheme()
  const { t }    = useTranslation()

  const { data, isLoading } = useAntiFraude()
  const { mutateAsync: resoudre, isPending: isResolving } = useMarquerResolu()

  const [filtres, setFiltres]     = useState({ type: 'tous', statut: 'tous', pompiste: 'tous', date: '' })
  const [preuve, setPreuve]       = useState(null)
  const [exporting, setExporting] = useState('')

  const station            = data?.station ?? {}
  const stats              = data?.stats ?? {}
  const fraudesParMois     = data?.fraudesParMois ?? []
  const fraudesParPompiste = data?.fraudesParPompiste ?? []
  const heatmap            = data?.heatmap ?? []
  const heatmapMax         = data?.heatmapMax ?? 0
  const classement         = data?.classementPompistes ?? []
  const alertesFraude      = useMemo(() => data?.alertesFraude ?? [],    [data])
  const alertesTransport   = useMemo(() => data?.alertesTransport ?? [], [data])

  const pompistesUniques = useMemo(() => {
    const map = new Map()
    alertesFraude.forEach(a => { if (!map.has(a.pompisteId)) map.set(a.pompisteId, a.pompisteNom) })
    return Array.from(map.entries()).map(([id, nom]) => ({ id, nom }))
  }, [alertesFraude])

  const toutesAlertes = useMemo(() => {
    const a = alertesFraude.map(x => ({ ...x, personNom: x.pompisteNom, personId: x.pompisteId }))
    const b = alertesTransport.map(x => ({ ...x, personNom: x.chauffeurNom, personId: x.chauffeurId }))
    return [...a, ...b].sort((x, y) => new Date(y.date) - new Date(x.date))
  }, [alertesFraude, alertesTransport])

  const alertesFiltrees = useMemo(() => toutesAlertes.filter(a => {
    if (filtres.type   !== 'tous' && a.type   !== filtres.type)   return false
    if (filtres.statut !== 'tous' && a.statut !== filtres.statut) return false
    if (filtres.pompiste !== 'tous') {
      if (a.type !== 'FRAUDE' || String(a.personId) !== filtres.pompiste) return false
    }
    if (filtres.date && new Date(a.date) < new Date(filtres.date)) return false
    return true
  }), [toutesAlertes, filtres])

  const handleResoudre = async (type, id) => {
    try { await resoudre({ type, id }) } catch { /* toast géré dans le hook */ }
  }

  const handleExportPDF = async () => {
    setExporting('pdf')
    try { const { exportAntiFraudePDF } = await import('../../utils/export'); await exportAntiFraudePDF(data, station.nom, station.logoUrl) } finally { setExporting('') }
  }
  const handleExportExcel = async () => {
    setExporting('excel')
    try { const { exportAntiFraudeExcel } = await import('../../utils/export'); await exportAntiFraudeExcel(data, station.nom) } finally { setExporting('') }
  }

  const hasData = !isLoading && data

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1280, margin: '0 auto' }} className="fuelo-af">

      {/* ── HEADER ─────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: `${theme.colors.danger}15`, border: `1px solid ${theme.colors.danger}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={theme.colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.shieldChk} /></svg>
          </span>
          {t('antifraude.title')}
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          {t('antifraude.subtitle')} — {station.nom || t('antifraude.votreStation')}
        </p>
      </div>

      {/* ── 1. STATS GLOBALES ──────────────────────── */}
      {isLoading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="fuelo-grid-4">
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="fuelo-grid-4">
          {[
            { label: t('antifraude.statTotal'),      value: String(stats.totalFraudes ?? 0),        icon: ICONS.alert,   color: theme.colors.danger,  sub: t('antifraude.statTotalSub') },
            { label: t('antifraude.statMontant'),    value: formatGNF(stats.montantRecupere ?? 0),  icon: ICONS.cash,    color: theme.colors.warning, sub: t('antifraude.statMontantSub') },
            { label: t('antifraude.statSurveilles'), value: String(stats.pompistesSurveilles ?? 0), icon: ICONS.users,   color: theme.colors.primary, sub: t('antifraude.statSurveillesSub') },
            { label: t('antifraude.statTaux'),       value: `${stats.tauxFraude ?? 0}%`,            icon: ICONS.percent, color: theme.colors.info ?? theme.colors.primary, sub: t('antifraude.statTauxSub') },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard palette={palette} isDark={isDark} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
                  <div style={{ width: 34, height: 34, borderRadius: theme.radius.md, background: `${s.color}18`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  </div>
                </div>
                <div style={{ fontSize: theme.font.size['3xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-1px', fontFamily: theme.font.mono, lineHeight: 1 }}>{s.value}</div>
                <span style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>{s.sub}</span>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── 2. TABLEAU DE BORD FRAUDE ──────────────── */}
      {hasData && (
        <div style={{ marginBottom: 32 }}>
          <div className="fuelo-af-grid2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}>
            <GlassCard palette={palette} isDark={isDark}>
              <SectionTitle icon={ICONS.calendar} title={t('antifraude.fraudesParMois')} subtitle="12 derniers mois — pompistes vs transport" color={theme.colors.danger} palette={palette} />
              {fraudesParMois.every(m => m.total === 0) ? (
                <EmptyState type="alertes" title="Aucune fraude sur la période" message="Aucun cas suspect détecté ces 12 derniers mois." />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fraudesParMois} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.cardBorder} vertical={false} />
                    <XAxis dataKey="mois" tick={{ fill: palette.textSub, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip palette={palette} />} cursor={{ fill: palette.hover }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: palette.textSub }} />
                    <Bar dataKey="pompistes"  name="Pompistes"  stackId="a" fill={theme.colors.danger} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="chauffeurs" name="Chauffeurs" stackId="a" fill={theme.colors.warning} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            <GlassCard palette={palette} isDark={isDark}>
              <SectionTitle icon={ICONS.users} title="Fraudes par pompiste" subtitle="Classement par nombre de cas" color={theme.colors.warning} palette={palette} />
              {fraudesParPompiste.length === 0 ? (
                <EmptyState type="alertes" title="Aucun pompiste suspect" message="Aucune fraude détectée pour vos pompistes." />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, fraudesParPompiste.length * 42)}>
                  <BarChart data={fraudesParPompiste} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.cardBorder} horizontal={false} />
                    <XAxis type="number" tick={{ fill: palette.textSub, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nom" width={100} tick={{ fill: palette.textSub, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip palette={palette} />} cursor={{ fill: palette.hover }} />
                    <Bar dataKey="fraudes" name="Cas de fraude" radius={[0, 6, 6, 0]} fill={theme.colors.danger} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </GlassCard>
          </div>

          <GlassCard palette={palette} isDark={isDark}>
            <SectionTitle icon={ICONS.clock} title="Heatmap jours / heures" subtitle="Moments où la fraude est la plus fréquente" color={theme.colors.danger} palette={palette} />
            {heatmapMax === 0 ? (
              <EmptyState type="alertes" title="Aucune donnée temporelle" message="Pas encore assez de cas pour établir une tendance horaire." />
            ) : (
              <Heatmap data={heatmap} max={heatmapMax} palette={palette} isDark={isDark} />
            )}
          </GlassCard>
        </div>
      )}

      {/* ── 3. LISTE DES ALERTES FRAUDE ────────────── */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle icon={ICONS.alert} title="Alertes fraude" subtitle="Pompistes (FRAUDE) et transport (FRAUDE_CITERNE)" color={theme.colors.danger} palette={palette} />

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <select value={filtres.type} onChange={e => setFiltres(f => ({ ...f, type: e.target.value }))} style={SELECT_STYLE(palette)}>
            <option value="tous">Tous les types</option>
            <option value="FRAUDE">Fraude pompiste</option>
            <option value="FRAUDE_CITERNE">Fraude citerne</option>
          </select>
          <select value={filtres.statut} onChange={e => setFiltres(f => ({ ...f, statut: e.target.value }))} style={SELECT_STYLE(palette)}>
            <option value="tous">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
          </select>
          <select value={filtres.pompiste} onChange={e => setFiltres(f => ({ ...f, pompiste: e.target.value }))} style={SELECT_STYLE(palette)} disabled={pompistesUniques.length === 0}>
            <option value="tous">Tous les pompistes</option>
            {pompistesUniques.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
          </select>
          <input type="date" value={filtres.date} onChange={e => setFiltres(f => ({ ...f, date: e.target.value }))}
            style={{ ...SELECT_STYLE(palette), minWidth: 150, cursor: 'text' }} />
          {(filtres.type !== 'tous' || filtres.statut !== 'tous' || filtres.pompiste !== 'tous' || filtres.date) && (
            <PillButton onClick={() => setFiltres({ type: 'tous', statut: 'tous', pompiste: 'tous', date: '' })} color={palette.textSub} icon={ICONS.close}>
              Réinitialiser
            </PillButton>
          )}
        </div>

        {isLoading ? (
          <div className="fuelo-af-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: isDark ? palette.glass : palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Shimmer width={42} height={42} radius="50%" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <Shimmer width="60%" height={13} />
                    <Shimmer width="40%" height={11} />
                  </div>
                </div>
                <Shimmer width="100%" height={60} radius={theme.radius.md} />
                <Shimmer width="100%" height={34} radius={theme.radius.button} />
              </div>
            ))}
          </div>
        ) : alertesFiltrees.length === 0 ? (
          <GlassCard palette={palette} isDark={isDark} style={{ border: `1px dashed ${palette.cardBorder}` }}>
            <EmptyState type="alertes" title="Aucune alerte fraude" message={toutesAlertes.length === 0 ? 'Aucun cas de fraude détecté pour le moment — tout est sous contrôle.' : 'Aucune alerte ne correspond aux filtres sélectionnés.'} />
          </GlassCard>
        ) : (
          <div className="fuelo-af-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {alertesFiltrees.map((a, i) => (
                <AlerteCard
                  key={`${a.type}-${a.id}`}
                  alerte={a}
                  index={i}
                  palette={palette}
                  isDark={isDark}
                  onPreuves={setPreuve}
                  onResoudre={handleResoudre}
                  isResolving={isResolving}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── 5. CLASSEMENT POMPISTES ────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle icon={ICONS.shield} title="Classement fiabilité pompistes" subtitle="Score, fraudes détectées et badge de confiance" color={theme.colors.primary} palette={palette} />
        <GlassCard palette={palette} isDark={isDark} style={{ padding: 0, overflow: 'hidden' }}>
          {classement.length === 0 ? (
            <div style={{ padding: 24 }}>
              <EmptyState type="default" title="Aucun pompiste à classer" message="Le classement apparaît dès qu'un pompiste a terminé au moins un service." />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.font.size.sm, minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                    {['Pompiste', 'Score de fiabilité', 'Fraudes', 'Montant fraudé estimé', 'Statut'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: i >= 2 ? (i === 2 ? 'center' : 'right') : 'left', color: palette.textMuted, fontWeight: theme.font.weight.semi, fontSize: theme.font.size.xs, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classement.map((p, i) => <ClassementRow key={p.id} p={p} index={i} palette={palette} />)}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── 6. ALERTES TRANSPORT (FRAUDE_CITERNE) ──── */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle icon={ICONS.truck} title="Alertes transport — fraude citerne" subtitle="Écarts jauge départ / arrivée et validation QR" color={theme.colors.warning} palette={palette} />
        {alertesTransport.length === 0 ? (
          <GlassCard palette={palette} isDark={isDark} style={{ border: `1px dashed ${palette.cardBorder}` }}>
            <EmptyState type="alertes" title="Aucune fraude citerne détectée" message="Tous les trajets de livraison sont conformes aux quantités déclarées." />
          </GlassCard>
        ) : (
          <div className="fuelo-af-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {alertesTransport.map((t, i) => (
                <AlerteCard
                  key={`trajet-${t.id}`}
                  alerte={{ ...t, personNom: t.chauffeurNom, personId: t.chauffeurId }}
                  index={i}
                  palette={palette}
                  isDark={isDark}
                  onPreuves={setPreuve}
                  onResoudre={handleResoudre}
                  isResolving={isResolving}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── 7. EXPORT ──────────────────────────────── */}
      <GlassCard palette={palette} isDark={isDark} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: palette.text, marginBottom: 4 }}>Rapport anti-fraude complet</div>
          <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>Statistiques, classement, alertes pompistes et transport — prêt à partager.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleExportExcel} disabled={!hasData || exporting === 'excel'}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: theme.radius.button, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.08)', color: '#10B981', cursor: !hasData ? 'not-allowed' : 'pointer', fontSize: theme.font.size.sm, fontFamily: theme.font.family, fontWeight: theme.font.weight.semi, opacity: !hasData ? 0.5 : 1, transition: theme.transition.hover }}
            onMouseEnter={e => { if (hasData) e.currentTarget.style.boxShadow = '0 0 0 1px rgba(16,185,129,0.3), 0 8px 22px rgba(16,185,129,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
            {exporting === 'excel' ? <div style={{ width: 14, height: 14, border: '2px solid #10B981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.excel} /></svg>}
            Excel
          </motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={handleExportPDF} disabled={!hasData || exporting === 'pdf'}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: theme.radius.button, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', cursor: !hasData ? 'not-allowed' : 'pointer', fontSize: theme.font.size.sm, fontFamily: theme.font.family, fontWeight: theme.font.weight.semi, opacity: !hasData ? 0.5 : 1, transition: theme.transition.hover }}
            onMouseEnter={e => { if (hasData) e.currentTarget.style.boxShadow = '0 0 0 1px rgba(239,68,68,0.3), 0 8px 22px rgba(239,68,68,0.22)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
            {exporting === 'pdf' ? <div style={{ width: 14, height: 14, border: '2px solid #EF4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.pdf} /></svg>}
            PDF
          </motion.button>
        </div>
      </GlassCard>

      {/* Modal preuves */}
      <AnimatePresence>
        {preuve && (
          <ModalPreuves alerte={preuve} onClose={() => setPreuve(null)} palette={palette} isDark={isDark} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .fuelo-af-grid2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .fuelo-af        { padding: 20px 16px !important; }
          .fuelo-grid-4    { grid-template-columns: repeat(2, 1fr) !important; }
          .fuelo-af-list   { grid-template-columns: 1fr !important; }
          .fuelo-af-metrics{ grid-template-columns: 1fr !important; }
          .fuelo-af-photos { grid-template-columns: 1fr !important; }
          .fuelo-af-grid2  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .fuelo-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
