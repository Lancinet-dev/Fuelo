// ================================================
// FUELO — GPS Flotte Premium (niveau Samsara/Fleet Complete)
// ================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useFlotte, useFlotteStats, useGpsPoints, useGeofencing } from '../../hooks/useTrajets'
import { useSocket } from '../../hooks/useSocket'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ── Palette dark fixe (page autonome) ────────────
const P = {
  bg:       '#0A0E1A',
  bgCard:   '#111827',
  bgCard2:  '#1A2235',
  border:   'rgba(255,255,255,0.07)',
  text:     '#F1F5F9',
  sub:      '#94A3B8',
  blue:     '#2563EB',
  green:    '#10B981',
  orange:   '#F59E0B',
  red:      '#EF4444',
  purple:   '#8B5CF6',
}

const TABS_GPS = [
  { key: 'flotte',      label: 'Carte Flotte',  icon: '🗺️' },
  { key: 'replay',      label: 'Replay Trajet',  icon: '▶️' },
  { key: 'geofencing',  label: 'Géofencing',     icon: '📍' },
  { key: 'historique',  label: 'Historique GPS',  icon: '📊' },
]

// ── Inject CSS animations once ────────────────────
const CSS_ANIM = `
@keyframes pulse-red { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.7} }
@keyframes pulse-green { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
@keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes fade-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`

// ── Calcul distance Haversine (km) ────────────────
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371, p1 = lat1*Math.PI/180, p2 = lat2*Math.PI/180
  const dp = (lat2-lat1)*Math.PI/180, dl = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dp/2)**2 + Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Icône camion SVG selon statut ─────────────────
function TruckSvg({ statut, size = 28 }) {
  const color = statut === 'alerte' ? P.red : statut === 'arrive_attente' ? P.orange : P.green
  const anim  = statut === 'alerte' ? { animation: 'pulse-red 1s infinite' }
              : statut === 'en_cours' ? { animation: 'pulse-green 2s infinite' } : {}
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...anim }}>
      <svg viewBox="0 0 32 20" width={size} height={size*0.625} fill="none">
        <rect x="1" y="5" width="20" height="12" rx="2" fill={color} opacity=".9"/>
        <path d="M21 8h7l3 5v4h-10V8z" fill={color} opacity=".7"/>
        <circle cx="7"  cy="18" r="2.5" fill="#1E293B" stroke={color} strokeWidth="1.5"/>
        <circle cx="25" cy="18" r="2.5" fill="#1E293B" stroke={color} strokeWidth="1.5"/>
      </svg>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────
function KpiCard({ label, value, color, icon, sub }) {
  return (
    <div style={{ background: P.bgCard, border: `1px solid ${P.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 18px', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 11, color: P.sub, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: P.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────
// TAB 1 : CARTE FLOTTE
// ─────────────────────────────────────────────────
function TabFlotte({ flotte, stats, loading }) {
  const mapRef    = useRef(null)
  const leafRef   = useRef(null)
  const markersRef = useRef({})
  const qc        = useQueryClient()
  const { socket } = useSocket()
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  const filtered = useMemo(() =>
    flotte.filter(c => c.chauffeur_nom?.toLowerCase().includes(search.toLowerCase()) || c.citerne_code?.toLowerCase().includes(search.toLowerCase())),
    [flotte, search]
  )

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current) return
    let map
    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (leafRef.current) return

      map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
        .setView([11.3, -13.5], 7)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB', maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      leafRef.current = map
    }
    initMap()
    return () => {
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null }
      markersRef.current = {}
    }
  }, [])

  // Mettre à jour les marqueurs camions
  useEffect(() => {
    if (!leafRef.current || flotte.length === 0) return
    const L = window.L
    if (!L) return

    const map = leafRef.current
    const existing = new Set(Object.keys(markersRef.current))

    flotte.forEach(c => {
      if (!c.lat || !c.lng) return
      const id   = String(c.id)
      const icon = createTruckIcon(L, c.statut, c.vitesse_actuelle ?? 0)
      const tip  = `<b>${c.chauffeur_nom}</b><br/>${Math.round(c.vitesse_actuelle ?? 0)} km/h<br/>${c.statut === 'en_cours' ? 'En route' : c.statut === 'arrive_attente' ? 'Arrivée — Attente QR' : 'Alerte'}`

      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng([c.lat, c.lng])
        markersRef.current[id].setIcon(icon)
        markersRef.current[id].setTooltipContent(tip)
      } else {
        const m = L.marker([c.lat, c.lng], { icon })
          .addTo(map)
          .bindTooltip(tip, { permanent: false, direction: 'top', offset: [0, -10] })
          .on('click', () => setSelected(c))
        markersRef.current[id] = m
      }
      existing.delete(id)
    })
    existing.forEach(id => {
      markersRef.current[id]?.remove()
      delete markersRef.current[id]
    })
  }, [flotte])

  // Mise à jour temps réel via Socket.IO
  useEffect(() => {
    if (!socket) return
    const handler = (data) => {
      qc.setQueryData(['flotte'], (old) => {
        if (!old) return old
        return old.map(c =>
          c.id === data.trajet_id
            ? { ...c, lat: data.lat, lng: data.lng, vitesse_actuelle: data.vitesse, cap: data.cap, derniere_pos_at: new Date().toISOString() }
            : c
        )
      })
    }
    socket.on('gps_update', handler)
    return () => socket.off('gps_update', handler)
  }, [socket, qc])

  const centrer = useCallback((camion) => {
    if (!leafRef.current || !camion.lat) return
    leafRef.current.setView([camion.lat, camion.lng], 14, { animate: true })
    setSelected(camion)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Sidebar flotte */}
      <div style={{ width: 300, background: P.bgCard, borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${P.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 10 }}>
            Flotte Active <span style={{ color: P.blue }}>({flotte.length})</span>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher chauffeur..."
            style={{ width: '100%', background: P.bg, border: `1px solid ${P.border}`, borderRadius: 8, padding: '8px 12px', color: P.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ padding: 20, color: P.sub, fontSize: 13, textAlign: 'center' }}>Chargement...</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: P.sub, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
              Aucun camion actif
            </div>
          )}
          {filtered.map(c => (
            <CamionCard key={c.id} camion={c} selected={selected?.id === c.id} onClick={() => centrer(c)} />
          ))}
        </div>
      </div>

      {/* Carte principale */}
      <div style={{ flex: 1, position: 'relative', background: '#0D1117' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Overlay infos camion sélectionné */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              style={{ position:'absolute', top:16, right:16, width:260, background:'rgba(17,24,39,0.95)', border:`1px solid ${P.border}`, borderRadius:14, padding:16, backdropFilter:'blur(10px)', zIndex:1000 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontWeight:700, color:P.text, fontSize:14 }}>{selected.chauffeur_nom}</div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:P.sub, cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  ['Vitesse', `${Math.round(selected.vitesse_actuelle ?? 0)} km/h`, selected.vitesse_actuelle > 90 ? P.red : P.green],
                  ['Citerne',  selected.citerne_code ?? '—', P.sub],
                  ['Statut',   selected.statut === 'en_cours' ? 'En route' : 'Attente QR', selected.statut === 'alerte' ? P.red : P.orange],
                  ['Départ',   selected.qty_depart ? `${selected.qty_depart}L` : '—', P.sub],
                ].map(([k,v,c]) => (
                  <div key={k} style={{ background:P.bg, borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:P.sub }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
              {selected.derniere_pos_at && (
                <div style={{ marginTop:10, fontSize:11, color:P.sub }}>
                  Dernière position : {new Date(selected.derniere_pos_at).toLocaleTimeString('fr-FR')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge nb camions */}
        <div style={{ position:'absolute', top:16, left:16, background:'rgba(17,24,39,0.9)', border:`1px solid ${P.border}`, borderRadius:10, padding:'8px 14px', zIndex:500, backdropFilter:'blur(8px)' }}>
          <span style={{ fontSize:12, color:P.sub }}>🚚 </span>
          <span style={{ fontSize:13, fontWeight:600, color:P.text }}>{flotte.filter(c => c.statut==='en_cours').length} en route</span>
          {flotte.some(c => c.vitesse_actuelle > 90) && (
            <span style={{ marginLeft:10, fontSize:11, color:P.red, fontWeight:600 }}>⚠ Vitesse excessive</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CamionCard({ camion: c, selected, onClick }) {
  const color = c.statut === 'alerte' ? P.red : c.statut === 'arrive_attente' ? P.orange : P.green
  const label = c.statut === 'en_cours' ? 'En route' : c.statut === 'arrive_attente' ? 'Attente QR' : 'Alerte'
  const vit   = Math.round(c.vitesse_actuelle ?? 0)
  const mins  = c.started_at ? Math.round((Date.now() - new Date(c.started_at)) / 60000) : 0

  return (
    <div onClick={onClick} style={{ padding:'12px 14px', borderBottom:`1px solid ${P.border}`, cursor:'pointer', background: selected ? 'rgba(37,99,235,0.12)' : 'transparent', borderLeft: selected ? `3px solid ${P.blue}` : '3px solid transparent', transition:'all 0.15s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:P.bg, border:`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16 }}>
          {c.chauffeur_avatar ? <img src={c.chauffeur_avatar} style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} alt="" /> : '👤'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:P.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.chauffeur_nom}</div>
          <div style={{ fontSize:11, color:P.sub }}>{c.citerne_code ?? 'Citerne'} · {mins}min</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color: vit > 90 ? P.red : P.text }}>{vit} <span style={{ fontSize:10, color:P.sub }}>km/h</span></div>
          <div style={{ fontSize:10, color, fontWeight:600 }}>{label}</div>
        </div>
      </div>
      {c.statut !== 'alerte' && (
        <div style={{ marginTop:8, height:3, background:P.border, borderRadius:2 }}>
          <div style={{ height:'100%', background:color, borderRadius:2, width:`${Math.min(100, mins/120*100)}%`, transition:'width 0.3s' }} />
        </div>
      )}
    </div>
  )
}

// Crée une icône Leaflet camion (appelé côté effet où L est global)
function createTruckIcon(L, statut, vitesse) {
  const color = statut === 'alerte' ? '#EF4444' : statut === 'arrive_attente' ? '#F59E0B' : '#10B981'
  const anim  = statut === 'alerte' ? 'pulse-red 1s infinite' : statut === 'en_cours' ? 'pulse-green 2s infinite' : 'none'
  const html  = `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;animation:${anim};">
    <div style="width:32px;height:32px;background:${color};border-radius:50%;border:3px solid #1E293B;display:flex;align-items:center;justify-content:center;box-shadow:0 0 ${statut==='alerte'?'12px':statut==='en_cours'?'8px':'4px'} ${color}80;">
      <svg viewBox="0 0 20 14" width="18" height="12.6" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" fill="white" opacity=".9"/><path d="M13 4h4.5l2 3v3.5H13V4z" fill="white" opacity=".7"/><circle cx="4.5" cy="12" r="1.8" fill="#1E293B" stroke="white" strokeWidth="1"/><circle cx="16" cy="12" r="1.8" fill="#1E293B" stroke="white" strokeWidth="1"/></svg>
    </div>
  </div>`
  return L.divIcon({ html, className: '', iconSize: [36,36], iconAnchor: [18,18] })
}

// ─────────────────────────────────────────────────
// TAB 2 : REPLAY TRAJET
// ─────────────────────────────────────────────────
function TabReplay({ trajets }) {
  const [trajetId, setTrajetId] = useState(null)
  const [playing,  setPlaying]  = useState(false)
  const [speed,    setSpeed]    = useState(1)
  const [frame,    setFrame]    = useState(0)
  const mapRef  = useRef(null)
  const leafRef = useRef(null)
  const markerRef = useRef(null)
  const timerRef  = useRef(null)

  const { data } = useGpsPoints(trajetId)
  const points   = useMemo(() => data?.points ?? [], [data])

  const vitesseData = useMemo(() =>
    points.map((p, i) => ({ i, v: Math.round(parseFloat(p.vitesse) || 0), t: new Date(p.created_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }) })),
    [points]
  )

  // Init carte replay
  useEffect(() => {
    if (!mapRef.current) return
    let map
    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (leafRef.current) return
      map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([11.3,-13.5], 7)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom:19 }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)
      leafRef.current = map
    }
    init()
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null } }
  }, [])

  // Dessiner le tracé quand points chargés
  useEffect(() => {
    if (!leafRef.current || points.length === 0) return
    const L = window.L
    if (!L) return
    const map = leafRef.current
    const lls = points.map(p => [parseFloat(p.lat), parseFloat(p.lng)])
    map.eachLayer(l => { if (l.options?.isRoute) l.remove() })
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }

    L.polyline(lls, { color: P.blue, weight: 4, opacity: 0.6, dashArray: '8,4', isRoute: true }).addTo(map)
    // Marqueurs départ/arrivée
    const startIcon = L.divIcon({ html: `<div style="width:14px;height:14px;background:${P.green};border:3px solid white;border-radius:50%;"></div>`, className:'', iconAnchor:[7,7] })
    const endIcon   = L.divIcon({ html: `<div style="width:14px;height:14px;background:${P.red};border:3px solid white;border-radius:50%;"></div>`, className:'', iconAnchor:[7,7] })
    L.marker(lls[0], { icon: startIcon }).addTo(map)
    L.marker(lls[lls.length-1], { icon: endIcon }).addTo(map)

    // Marqueurs arrêts suspects
    points.forEach((p, i) => {
      if (i > 0 && parseFloat(p.vitesse||0) < 2) {
        const stopIcon = L.divIcon({ html: `<div style="width:10px;height:10px;background:${P.orange};border:2px solid white;border-radius:50%;"></div>`, className:'', iconAnchor:[5,5] })
        L.marker([parseFloat(p.lat), parseFloat(p.lng)], { icon: stopIcon }).addTo(map)
      }
    })

    const camionIcon = createTruckIcon(L, 'en_cours', 0)
    markerRef.current = L.marker(lls[0], { icon: camionIcon }).addTo(map)
    map.fitBounds(L.latLngBounds(lls), { padding: [40,40] })
    setFrame(0)
    setPlaying(false)
  }, [points])

  // Animation replay
  useEffect(() => {
    if (!playing || !leafRef.current || points.length === 0) return
    const L = window.L
    if (!L) return
    const interval = Math.max(50, 200 / speed)
    timerRef.current = setInterval(() => {
      setFrame(f => {
        const next = f + 1
        if (next >= points.length) { setPlaying(false); clearInterval(timerRef.current); return f }
        const p = points[next]
        if (markerRef.current) {
          markerRef.current.setLatLng([parseFloat(p.lat), parseFloat(p.lng)])
          leafRef.current.panTo([parseFloat(p.lat), parseFloat(p.lng)], { animate:true, duration:0.3 })
        }
        return next
      })
    }, interval)
    return () => clearInterval(timerRef.current)
  }, [playing, speed, points])

  const pct = points.length > 1 ? Math.round(frame / (points.length-1) * 100) : 0
  const curPoint = points[frame]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Sélecteur trajet */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${P.border}`, display:'flex', alignItems:'center', gap:12, background:P.bgCard }}>
        <label style={{ fontSize:12, color:P.sub, flexShrink:0 }}>Trajet :</label>
        <select value={trajetId ?? ''} onChange={e => setTrajetId(parseInt(e.target.value)||null)}
          style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'6px 12px', fontSize:13, outline:'none', flex:1, maxWidth:400 }}>
          <option value="">-- Sélectionner un trajet terminé --</option>
          {trajets.filter(t => ['arrive','alerte'].includes(t.statut)).map(t => (
            <option key={t.id} value={t.id}>
              #{t.id} — {t.chauffeur_nom} — {t.citerne_code} — {new Date(t.started_at).toLocaleDateString('fr-FR')} {t.statut === 'alerte' ? '⚠' : '✓'}
            </option>
          ))}
        </select>
        <div style={{ fontSize:12, color:P.sub }}>{points.length} points GPS</div>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Carte */}
        <div ref={mapRef} style={{ flex:1, background:'#0D1117' }} />

        {/* Graphique vitesse */}
        {vitesseData.length > 0 && (
          <div style={{ height:90, background:P.bgCard, borderTop:`1px solid ${P.border}`, padding:'6px 16px' }}>
            <div style={{ fontSize:10, color:P.sub, marginBottom:2 }}>Vitesse (km/h)</div>
            <ResponsiveContainer width="100%" height={66}>
              <AreaChart data={vitesseData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={P.blue} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={P.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill:P.sub, fontSize:9 }} axisLine={false} tickLine={false} interval={Math.floor(vitesseData.length/6)} />
                <YAxis hide domain={[0,'auto']} />
                <Tooltip contentStyle={{ background:P.bgCard2, border:`1px solid ${P.border}`, borderRadius:8, fontSize:11 }} formatter={v => [`${v} km/h`,'Vitesse']} labelStyle={{ color:P.sub }} />
                <ReferenceLine y={90} stroke={P.red} strokeDasharray="4 2" label={{ value:'90 km/h', fill:P.red, fontSize:9 }} />
                <Area dataKey="v" stroke={P.blue} fill="url(#vGrad)" strokeWidth={2} dot={false} activeDot={{ r:3 }} />
                <ReferenceLine x={vitesseData[frame]?.t} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Contrôles replay */}
        {points.length > 0 && (
          <div style={{ background:P.bgCard2, borderTop:`1px solid ${P.border}`, padding:'10px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <button onClick={() => { setFrame(0); setPlaying(false) }}
                style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>⏮</button>
              <button onClick={() => setPlaying(p => !p)}
                style={{ background:P.blue, border:'none', color:'white', borderRadius:8, padding:'6px 16px', cursor:'pointer', fontSize:14, fontWeight:600 }}>
                {playing ? '⏸ Pause' : '▶ Rejouer'}
              </button>
              <button onClick={() => { setFrame(points.length-1); setPlaying(false) }}
                style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>⏭</button>
              <div style={{ display:'flex', gap:4 }}>
                {[1,2,4].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    style={{ background: speed===s ? P.blue : P.bg, border:`1px solid ${P.border}`, color: speed===s ? 'white' : P.sub, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}>{s}×</button>
                ))}
              </div>
              <div style={{ marginLeft:'auto', fontSize:12, color:P.sub }}>
                {curPoint && <span>{new Date(curPoint.created_at).toLocaleTimeString('fr-FR')} · {Math.round(parseFloat(curPoint.vitesse||0))} km/h</span>}
              </div>
            </div>
            {/* Timeline */}
            <div style={{ height:6, background:P.bg, borderRadius:3, cursor:'pointer', position:'relative' }}
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct  = (e.clientX - rect.left) / rect.width
                const idx  = Math.round(pct * (points.length-1))
                setFrame(Math.max(0, Math.min(points.length-1, idx)))
                if (markerRef.current && leafRef.current && points[idx]) {
                  markerRef.current.setLatLng([parseFloat(points[idx].lat), parseFloat(points[idx].lng)])
                }
              }}>
              <div style={{ height:'100%', background:P.blue, borderRadius:3, width:`${pct}%`, transition:'width 0.1s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:P.sub }}>
              <span>Départ</span>
              <span>{frame+1}/{points.length} · {pct}%</span>
              <span>Arrivée</span>
            </div>
          </div>
        )}
        {!trajetId && (
          <div style={{ padding:32, textAlign:'center', color:P.sub, fontSize:13 }}>
            Sélectionnez un trajet terminé pour rejouer la route
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// TAB 3 : GÉOFENCING
// ─────────────────────────────────────────────────
function TabGeofencing() {
  const { zones, loading, creer, modifier, supprimer } = useGeofencing()
  const mapRef  = useRef(null)
  const leafRef = useRef(null)
  const zonesLayerRef = useRef({})
  const [drawing, setDrawing]   = useState(false)
  const [newZone, setNewZone]   = useState({ nom:'', rayon_km:5, couleur:'#2563EB' })
  const [clickPos, setClickPos] = useState(null)

  useEffect(() => {
    if (!mapRef.current) return
    const init = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (leafRef.current) return
      const map = L.map(mapRef.current, { zoomControl:false, attributionControl:false }).setView([11.3,-13.5], 7)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom:19 }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)
      map.on('click', e => setClickPos({ lat: e.latlng.lat, lng: e.latlng.lng }))
      leafRef.current = map
    }
    init()
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null } }
  }, [])

  // Redessiner les zones sur la carte
  useEffect(() => {
    if (!leafRef.current) return
    const L = window.L
    if (!L) return
    const map = leafRef.current
    // Supprimer anciens cercles
    Object.values(zonesLayerRef.current).forEach(l => l.remove())
    zonesLayerRef.current = {}
    zones.forEach(z => {
      if (!z.actif) return
      const circle = L.circle([parseFloat(z.centre_lat), parseFloat(z.centre_lng)], {
        radius: z.rayon_km * 1000,
        color:  z.couleur ?? P.blue,
        fillColor: z.couleur ?? P.blue,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '6,4',
      }).addTo(map).bindTooltip(z.nom, { permanent: true, direction: 'center', className: 'geo-label' })
      zonesLayerRef.current[z.id] = circle
    })
    // Prévisualisation zone en cours de dessin
    if (clickPos && drawing) {
      const prev = L.circle([clickPos.lat, clickPos.lng], { radius: newZone.rayon_km*1000, color:'#8B5CF6', fillColor:'#8B5CF6', fillOpacity:0.1, weight:2, dashArray:'4,4' }).addTo(map)
      zonesLayerRef.current['_preview'] = prev
    }
  }, [zones, clickPos, drawing, newZone.rayon_km])

  const sauvegarder = async () => {
    if (!clickPos || !newZone.nom) { toast.error('Cliquez sur la carte pour définir le centre, puis saisissez un nom.'); return }
    try {
      await creer.mutateAsync({ ...newZone, centre_lat: clickPos.lat, centre_lng: clickPos.lng })
      toast.success(`Zone "${newZone.nom}" créée`)
      setDrawing(false); setClickPos(null); setNewZone({ nom:'', rayon_km:5, couleur:'#2563EB' })
    } catch { toast.error('Erreur création zone') }
  }

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Panel zones */}
      <div style={{ width:300, background:P.bgCard, borderRight:`1px solid ${P.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${P.border}` }}>
          <div style={{ fontSize:13, fontWeight:600, color:P.text, marginBottom:10 }}>Zones de géofencing</div>
          <button onClick={() => setDrawing(d => !d)}
            style={{ width:'100%', background: drawing ? P.purple : P.blue, border:'none', color:'white', borderRadius:8, padding:'8px 0', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            {drawing ? '✕ Annuler' : '+ Nouvelle zone'}
          </button>
        </div>

        {/* Formulaire nouvelle zone */}
        <AnimatePresence>
          {drawing && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
              style={{ overflow:'hidden', borderBottom:`1px solid ${P.border}` }}>
              <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:11, color:P.sub }}>1. Cliquez sur la carte pour définir le centre</div>
                {clickPos && <div style={{ fontSize:11, color:P.green }}>✓ Centre : {clickPos.lat.toFixed(4)}, {clickPos.lng.toFixed(4)}</div>}
                <input placeholder="Nom de la zone *" value={newZone.nom} onChange={e => setNewZone(n => ({...n, nom:e.target.value}))}
                  style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'8px 10px', fontSize:12, outline:'none' }} />
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <label style={{ fontSize:11, color:P.sub, flexShrink:0 }}>Rayon (km)</label>
                  <input type="range" min={0.5} max={50} step={0.5} value={newZone.rayon_km}
                    onChange={e => setNewZone(n => ({...n, rayon_km:parseFloat(e.target.value)}))}
                    style={{ flex:1 }} />
                  <span style={{ fontSize:12, color:P.text, flexShrink:0, minWidth:30 }}>{newZone.rayon_km} km</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <label style={{ fontSize:11, color:P.sub }}>Couleur</label>
                  <input type="color" value={newZone.couleur} onChange={e => setNewZone(n => ({...n, couleur:e.target.value}))}
                    style={{ width:36, height:28, border:'none', borderRadius:6, cursor:'pointer', background:'none' }} />
                </div>
                <button onClick={sauvegarder} disabled={creer.isPending}
                  style={{ background:P.green, border:'none', color:'white', borderRadius:8, padding:'8px 0', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  {creer.isPending ? 'Sauvegarde...' : '✓ Sauvegarder'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste des zones */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && <div style={{ padding:20, color:P.sub, fontSize:13, textAlign:'center' }}>Chargement...</div>}
          {!loading && zones.length === 0 && <div style={{ padding:24, textAlign:'center', color:P.sub, fontSize:13 }}>Aucune zone définie</div>}
          {zones.map(z => (
            <div key={z.id} style={{ padding:'12px 14px', borderBottom:`1px solid ${P.border}`, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:z.couleur, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:P.text, fontWeight:500 }}>{z.nom}</div>
                <div style={{ fontSize:11, color:P.sub }}>{z.rayon_km} km</div>
              </div>
              <button onClick={() => modifier.mutate({ id:z.id, actif:!z.actif })}
                style={{ background: z.actif ? 'rgba(16,185,129,0.15)' : P.bg, border:`1px solid ${z.actif ? P.green : P.border}`, color: z.actif ? P.green : P.sub, borderRadius:6, padding:'3px 8px', cursor:'pointer', fontSize:10 }}>
                {z.actif ? 'Actif' : 'Inactif'}
              </button>
              <button onClick={() => { if (confirm(`Supprimer "${z.nom}" ?`)) supprimer.mutate(z.id) }}
                style={{ background:'none', border:'none', color:P.red, cursor:'pointer', fontSize:14 }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ padding:'10px 14px', borderTop:`1px solid ${P.border}`, fontSize:11, color:P.sub }}>
          Les zones actives déclenchent une alerte si un camion en sort.
        </div>
      </div>

      <div ref={mapRef} style={{ flex:1, background:'#0D1117', cursor: drawing ? 'crosshair' : 'grab' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────
// TAB 4 : HISTORIQUE GPS
// ─────────────────────────────────────────────────
function TabHistorique({ trajets, loading }) {
  const [search,   setSearch]   = useState('')
  const [statut,   setStatut]   = useState('')
  const [selected, setSelected] = useState(null)
  const { data: ptsData } = useGpsPoints(selected)
  const points = ptsData?.points ?? []

  const filtered = useMemo(() => {
    let t = [...trajets]
    if (statut) t = t.filter(x => x.statut === statut)
    if (search) t = t.filter(x => x.chauffeur_nom?.toLowerCase().includes(search.toLowerCase()) || String(x.id).includes(search))
    return t
  }, [trajets, statut, search])

  const dureeMin = (t) => {
    if (!t.started_at || !t.ended_at) return null
    return Math.round((new Date(t.ended_at) - new Date(t.started_at)) / 60000)
  }

  const vmoy = useMemo(() => {
    if (!points.length) return 0
    const s = points.reduce((a, p) => a + parseFloat(p.vitesse||0), 0)
    return Math.round(s / points.length)
  }, [points])

  const vmax = useMemo(() =>
    points.reduce((m, p) => Math.max(m, parseFloat(p.vitesse||0)), 0),
    [points]
  )

  const spData = useMemo(() =>
    points.map((p, i) => ({ i, v: Math.round(parseFloat(p.vitesse)||0) })),
    [points]
  )

  return (
    <div style={{ display:'flex', height:'100%' }}>
      {/* Table trajets */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Filtres */}
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${P.border}`, display:'flex', gap:10, alignItems:'center', background:P.bgCard }}>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'7px 12px', fontSize:12, outline:'none', width:200 }} />
          <select value={statut} onChange={e => setStatut(e.target.value)}
            style={{ background:P.bg, border:`1px solid ${P.border}`, color:P.text, borderRadius:8, padding:'7px 12px', fontSize:12, outline:'none' }}>
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="arrive">Arrivé</option>
            <option value="alerte">Alerte</option>
          </select>
          <div style={{ marginLeft:'auto', fontSize:12, color:P.sub }}>{filtered.length} trajet(s)</div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead style={{ position:'sticky', top:0, background:P.bgCard, zIndex:1 }}>
              <tr>
                {['#','Chauffeur','Citerne','Départ','Arrivée','Durée','Écart L','Statut'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:P.sub, fontWeight:500, borderBottom:`1px solid ${P.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding:24, color:P.sub, textAlign:'center' }}>Chargement...</td></tr>}
              {filtered.map(t => {
                const d = dureeMin(t)
                const statutCfg = { en_cours:{ c:P.green,l:'En cours' }, arrive_attente:{ c:P.orange,l:'Attente QR' }, arrive:{ c:P.blue,l:'Arrivé' }, alerte:{ c:P.red,l:'Alerte' } }
                const sc = statutCfg[t.statut] ?? { c:P.sub, l:t.statut }
                return (
                  <tr key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
                    style={{ borderBottom:`1px solid ${P.border}`, cursor:'pointer', background: selected===t.id ? 'rgba(37,99,235,0.1)' : 'transparent', transition:'background 0.1s' }}>
                    <td style={{ padding:'10px 12px', color:P.sub }}>#{t.id}</td>
                    <td style={{ padding:'10px 12px', color:P.text, fontWeight:500 }}>{t.chauffeur_nom}</td>
                    <td style={{ padding:'10px 12px', color:P.sub }}>{t.citerne_code ?? '—'}</td>
                    <td style={{ padding:'10px 12px', color:P.sub }}>{t.started_at ? new Date(t.started_at).toLocaleDateString('fr-FR') : '—'}</td>
                    <td style={{ padding:'10px 12px', color:P.sub }}>{t.ended_at ? new Date(t.ended_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                    <td style={{ padding:'10px 12px', color:P.text }}>{d != null ? `${d} min` : '—'}</td>
                    <td style={{ padding:'10px 12px', color: t.ecart > 0 ? P.red : P.text }}>{t.ecart != null ? `${parseFloat(t.ecart).toFixed(1)}L` : '—'}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ background:`${sc.c}22`, color:sc.c, borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:600 }}>{sc.l}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel détail trajet sélectionné */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ width:0, opacity:0 }} animate={{ width:280, opacity:1 }} exit={{ width:0, opacity:0 }}
            style={{ borderLeft:`1px solid ${P.border}`, background:P.bgCard, overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:16, minWidth:280 }}>
              <div style={{ fontSize:13, fontWeight:600, color:P.text, marginBottom:12 }}>Trajet #{selected}</div>
              {points.length > 0 ? (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                    {[
                      ['Points GPS', points.length, P.blue],
                      ['Vitesse moy.', `${vmoy} km/h`, P.green],
                      ['Vitesse max', `${Math.round(vmax)} km/h`, vmax > 90 ? P.red : P.text],
                      ['Arrêts', points.filter(p => parseFloat(p.vitesse||0) < 2).length, P.orange],
                    ].map(([k,v,c]) => (
                      <div key={k} style={{ background:P.bg, borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:10, color:P.sub }}>{k}</div>
                        <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:11, color:P.sub, marginBottom:6 }}>Profil de vitesse</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={spData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                      <Line dataKey="v" stroke={P.blue} strokeWidth={1.5} dot={false} />
                      <ReferenceLine y={90} stroke={P.red} strokeDasharray="3 2" />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background:P.bgCard2, border:`1px solid ${P.border}`, borderRadius:6, fontSize:10 }} formatter={v=>[`${v} km/h`]} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div style={{ color:P.sub, fontSize:12 }}>Chargement des points GPS...</div>
              )}
              <button onClick={() => setSelected(null)} style={{ marginTop:12, width:'100%', background:P.bg, border:`1px solid ${P.border}`, color:P.sub, borderRadius:8, padding:'7px 0', cursor:'pointer', fontSize:12 }}>Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────
export default function GpsFlottePage() {
  const [tab, setTab] = useState('flotte')
  const { data: flotte = [], isLoading: loadFlotte } = useFlotte()
  const { data: stats }  = useFlotteStats()
  const { trajets, loading: loadTrajets } = { trajets: [], loading: false }

  // Injecter les CSS animations une seule fois
  useEffect(() => {
    if (document.getElementById('fuelo-gps-css')) return
    const s = document.createElement('style')
    s.id = 'fuelo-gps-css'
    s.textContent = CSS_ANIM
    document.head.appendChild(s)
    return () => s.remove()
  }, [])

  // Injecter Leaflet globalement pour les fonctions helper
  useEffect(() => {
    const injectL = async () => {
      if (window.L) return
      const L = (await import('leaflet')).default
      window.L = L
    }
    injectL()
  }, [])

  const kpis = [
    { label:'Camions actifs',    value: stats?.actifs ?? flotte.length,            color:P.blue,   icon:'🚚' },
    { label:'En route',          value: stats?.en_route ?? flotte.filter(c=>c.statut==='en_cours').length,  color:P.green,  icon:'▶' },
    { label:'Alertes aujourd\'hui', value: stats?.alertes_jour ?? 0,              color:P.red,    icon:'⚠' },
    { label:'Km aujourd\'hui',   value: stats?.km_jour ? `${stats.km_jour} km` : '—', color:P.orange, icon:'📍' },
    { label:'Livrés aujourd\'hui', value: stats?.termines_jour ?? 0,              color:P.purple, icon:'✓' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:P.bg, color:P.text, fontFamily:'DM Sans, sans-serif' }}>
      {/* Header KPIs */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${P.border}`, background:P.bgCard, display:'flex', gap:10, flexWrap:'wrap', flexShrink:0 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, padding:'8px 12px', borderBottom:`1px solid ${P.border}`, background:P.bgCard, flexShrink:0 }}>
        {TABS_GPS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:500, transition:'all 0.15s',
              background: tab===t.key ? P.blue : 'transparent',
              color:      tab===t.key ? 'white' : P.sub }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {tab === 'flotte'     && <TabFlotte    flotte={flotte}   stats={stats}        loading={loadFlotte}  />}
        {tab === 'replay'     && <TabReplay    trajets={[]}  />}
        {tab === 'geofencing' && <TabGeofencing />}
        {tab === 'historique' && <TabHistorique trajets={[]} loading={false} />}
      </div>
    </div>
  )
}
