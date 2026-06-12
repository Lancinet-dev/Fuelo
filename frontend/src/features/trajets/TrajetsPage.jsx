// ================================================
// FUELO — Trajets GPS (owner + gérant)
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useTrajets, useGpsPoints }   from '../../hooks/useTrajets'
import { useTheme }    from '../../context/ThemeContext'
import StatCard        from '../../ui/StatCard'
import EmptyState      from '../../ui/EmptyState'
import { formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const TABS = [
  { key: null,       label: 'Tous'       },
  { key: 'en_cours', label: 'En cours'   },
  { key: 'alerte',   label: 'Alertes'    },
  { key: 'arrive',   label: 'Arrivés'    },
]

const STATUT_CFG = {
  en_cours: { label: 'En cours',     color: theme.colors.success, bg: theme.colors.successLight },
  alerte:   { label: 'Alerte fraude',color: theme.colors.danger,  bg: theme.colors.dangerLight  },
  arrive:   { label: 'Arrivé',       color: theme.colors.info,    bg: theme.colors.infoLight    },
}

// ── Carte Leaflet ─────────────────────────────────
function TrajetMap({ trajetId, isDark }) {
  const mapRef  = useRef(null)
  const leafRef = useRef(null)
  const { data } = useGpsPoints(trajetId)
  const points   = data?.points ?? []

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return

    const initMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Réinitialiser si déjà initialisé
      if (leafRef.current) {
        leafRef.current.remove()
        leafRef.current = null
      }

      const center = [points[points.length - 1].lat, points[points.length - 1].lng]
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(center, 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      // Tracé du trajet
      const latlngs = points.map(p => [p.lat, p.lng])
      L.polyline(latlngs, { color: theme.colors.primary, weight: 4, opacity: 0.8 }).addTo(map)

      // Marqueur départ (vert)
      const startIcon = L.divIcon({ html: '<div style="width:12px;height:12px;background:#10B981;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>', className: '', iconAnchor: [6,6] })
      L.marker([points[0].lat, points[0].lng], { icon: startIcon }).addTo(map).bindPopup('Départ')

      // Marqueur position actuelle (bleu)
      const lastIcon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#2563EB;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(37,99,235,0.5)"></div>', className: '', iconAnchor: [7,7] })
      L.marker(center, { icon: lastIcon }).addTo(map).bindPopup('Position actuelle')

      map.fitBounds(latlngs.length > 1 ? L.latLngBounds(latlngs) : [[center[0]-0.01,center[1]-0.01],[center[0]+0.01,center[1]+0.01]])
      leafRef.current = map
    }

    initMap()
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null } }
    // On ne réinitialise la carte que si le nombre de points ou le trajet change
    // (pas à chaque nouveau tableau `points`), pour éviter de recréer la carte
    // Leaflet en boucle. points.length + trajetId suffisent comme déclencheurs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, trajetId])

  if (points.length === 0) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderRadius: 14, border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`, flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 24 }}>📡</span>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>Aucune position GPS enregistrée</span>
      </div>
    )
  }

  return (
    <div ref={mapRef} style={{ height: 280, borderRadius: 14, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}` }} />
  )
}

// ── Modal détail trajet ───────────────────────────
function TrajetModal({ trajet, onClose, isDark, palette }) {
  const sc = STATUT_CFG[trajet.statut] ?? STATUT_CFG.arrive

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: isDark ? '#0D1B2A' : '#fff', borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'slideUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: palette.text, marginBottom: 4 }}>
              Trajet #{trajet.id} — {trajet.citerne_code}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase' }}>{sc.label}</span>
              <span style={{ fontSize: 12, color: palette.textSub }}>{trajet.chauffeur_nom}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Carte */}
        <div style={{ marginBottom: 16 }}>
          <TrajetMap trajetId={trajet.id} isDark={isDark} />
        </div>

        {/* Stats quantités */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 4 }}>
          {[
            { l: 'Chargement', v: `${trajet.qty_depart} L`, color: palette.text },
            { l: 'Livraison',  v: trajet.qty_arrivee ? `${trajet.qty_arrivee} L` : '—', color: palette.text },
            {
              l: 'Écart',
              v: trajet.ecart != null ? `${trajet.ecart > 0 ? '+' : ''}${parseFloat(trajet.ecart).toFixed(1)} L` : '—',
              color: trajet.ecart != null && trajet.ecart > (trajet.seuil_fraude ?? 50) ? theme.colors.danger : theme.colors.success,
            },
          ].map(({ l, v, color }) => (
            <div key={l} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: theme.font.mono }}>{v}</div>
              <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: palette.textMuted, textAlign: 'center', marginTop: 8 }}>
          Départ {formatRelative(trajet.started_at)}{trajet.ended_at ? ` · Arrivée ${formatRelative(trajet.ended_at)}` : ' · En cours'}
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────
export default function TrajetsPage() {
  const { palette, isDark } = useTheme()
  const [tabStatut, setTabStatut] = useState(null)
  const [selected,  setSelected]  = useState(null)

  const { trajets, loading, stats } = useTrajets({ statut: tabStatut })

  const ICON_MAP    = 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10m-3 0a3 3 0 106 0 3 3 0 00-6 0'
  const ICON_ALERTE = 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'
  const ICON_TRUCK  = 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-trajets">

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          GPS Citernes
          {stats.enCours > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, background: theme.colors.success, color: '#fff', borderRadius: 99, padding: '2px 10px' }}>
              {stats.enCours} en route
            </span>
          )}
          {stats.alertes > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, background: theme.colors.danger, color: '#fff', borderRadius: 99, padding: '2px 10px' }}>
              {stats.alertes} alerte{stats.alertes > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          Suivi des trajets en temps réel · Cliquer sur un trajet pour voir la carte GPS
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
          <StatCard label="Total trajets"  value={String(stats.total)}   icon={ICON_TRUCK}  color={palette.textSub} />
          <StatCard label="En route"       value={String(stats.enCours)} icon={ICON_MAP}    color={theme.colors.success} />
          <StatCard label="Alertes fraude" value={String(stats.alertes)} icon={ICON_ALERTE} color={stats.alertes > 0 ? theme.colors.danger : theme.colors.success} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={String(tab.key)} onClick={() => setTabStatut(tab.key)}
            style={{ padding: '7px 16px', borderRadius: 99, border: `1px solid ${tabStatut === tab.key ? 'transparent' : palette.cardBorder}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s', background: tabStatut === tab.key ? (tab.key === 'alerte' ? theme.colors.danger : theme.colors.primary) : palette.card, color: tabStatut === tab.key ? '#fff' : palette.textSub, boxShadow: tabStatut === tab.key ? theme.shadow.primary : theme.shadow.sm }}>
            {tab.key === 'en_cours' && stats.enCours > 0 ? `🟢 En cours (${stats.enCours})` :
             tab.key === 'alerte'   && stats.alertes > 0 ? `🚨 Alertes (${stats.alertes})` : tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '16px 18px', height: 80 }} />
          ))}
        </div>
      ) : trajets.length === 0 ? (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg }}>
          <EmptyState type="alertes" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trajets.map(t => {
            const sc = STATUT_CFG[t.statut] ?? STATUT_CFG.arrive
            const aFraude = t.statut === 'alerte'
            return (
              <div key={t.id} onClick={() => setSelected(t)}
                style={{ background: aFraude ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)') : palette.card, border: `1px solid ${aFraude ? theme.colors.danger + '35' : palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '14px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: theme.shadow.sm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = theme.shadow.md }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.statut === 'en_cours'
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      : t.statut === 'alerte'
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sc.color} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{t.chauffeur_nom} · {t.citerne_code}</div>
                    <div style={{ fontSize: 11, color: palette.textSub }}>{formatRelative(t.started_at)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{sc.label}</span>
                  {t.ecart != null && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.ecart > (t.seuil_fraude ?? 50) ? theme.colors.danger : theme.colors.success, fontFamily: theme.font.mono }}>
                      Écart: {t.ecart > 0 ? '+' : ''}{parseFloat(t.ecart).toFixed(1)}L
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <TrajetModal trajet={selected} onClose={() => setSelected(null)} isDark={isDark} palette={palette} />
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @media (max-width: 768px) {
          .fuelo-trajets { padding: 20px 16px !important; }
          .fuelo-grid-3  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
