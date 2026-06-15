// ================================================
// FUELO — ChauffeurPage PREMIUM (dark orange identity)
// ================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }       from '../../context/AuthContext'
import { useTrajet }     from '../../hooks/useTrajet'
import { useCiternes }   from '../../hooks/useTrajets'
import { useParametres } from '../../hooks/useParametres'
import { compressImage } from '../../utils/compressImage'
import MessagesButton from '../../ui/MessagesButton'
import NotifCenter    from '../../ui/NotifCenter'

// ── Palette dark fixe — identité chauffeur ────────
const C = {
  bg:     '#080B14',
  card:   '#0F1622',
  card2:  '#162032',
  border: 'rgba(255,255,255,0.08)',
  text:   '#F1F5F9',
  sub:    '#94A3B8',
  muted:  '#64748B',
  orange: '#F59E0B',
  green:  '#10B981',
  red:    '#EF4444',
  blue:   '#38BDF8',
}

const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// ── Timer ─────────────────────────────────────────
function useElapsed(startedAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!startedAt) { setSecs(0); return }
    const tick = () => setSecs(Math.floor((Date.now() - new Date(startedAt)) / 1000))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return {
    secs,
    label: h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
    pct: Math.min(1, secs / (10 * 3600)),
  }
}

// ── Ring Timer ────────────────────────────────────
function RingTimer({ pct, label }) {
  const R   = 52
  const cir = 2 * Math.PI * R
  const off = cir * (1 - pct)
  return (
    <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
      <svg width="128" height="128" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(245,158,11,0.1)" strokeWidth="6" />
        <circle cx="64" cy="64" r={R} fill="none" stroke={C.orange} strokeWidth="6"
          strokeDasharray={cir} strokeDashoffset={off} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${C.orange}80)`, transition: 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>{label}</div>
        <div style={{ fontSize: 9, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>En route</div>
      </div>
    </div>
  )
}

// ── Carte GPS live — CartoDB Dark Matter ──────────
function LiveMap({ lastPos }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const leafletRef   = useRef(null)

  const makeTruckIcon = (L, cap) => {
    const rot = cap != null ? cap : 0
    const html = `
      <div style="position:relative;width:40px;height:40px">
        <div style="
          position:absolute;inset:0;
          background:${C.orange};
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 0 18px ${C.orange}80;
          display:flex;align-items:center;justify-content:center;
          transform:rotate(${rot}deg);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0B14" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L8 8h8L12 2z"/>
            <circle cx="12" cy="14" r="3" fill="#0A0B14" stroke="none"/>
          </svg>
        </div>
        <div style="
          position:absolute;top:-8px;left:50%;transform:translateX(-50%);
          width:0;height:0;
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-bottom:8px solid ${C.orange};
          filter:drop-shadow(0 0 4px ${C.orange}80);
          transform:translateX(-50%) rotate(${rot}deg);transform-origin:50% 200%;
        "></div>
      </div>`
    return L.divIcon({ html, className: '', iconAnchor: [20, 20] })
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current || mapRef.current) return

      leafletRef.current = L
      const center = lastPos ? [lastPos.lat, lastPos.lng] : [9.537, -13.677]
      const map = L.map(containerRef.current, {
        zoomControl: false, attributionControl: false,
      }).setView(center, 15)

      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
        subdomains: 'abcd', maxZoom: 20,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      if (lastPos) {
        markerRef.current = L.marker([lastPos.lat, lastPos.lng], {
          icon: makeTruckIcon(L, lastPos.cap),
        }).addTo(map)
      }

      mapRef.current = map
    })()
    return () => { cancelled = true }
    // Init carte une seule fois au montage ; lastPos sert juste de centre initial
    // (les mises à jour de position sont gérées par l'effet [lastPos] dédié).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || !lastPos) return
    const L = leafletRef.current
    const icon = makeTruckIcon(L, lastPos.cap)
    if (markerRef.current) {
      markerRef.current.setLatLng([lastPos.lat, lastPos.lng])
      markerRef.current.setIcon(icon)
      mapRef.current.panTo([lastPos.lat, lastPos.lng], { animate: true, duration: 1 })
    } else {
      markerRef.current = L.marker([lastPos.lat, lastPos.lng], { icon }).addTo(mapRef.current)
      mapRef.current.setView([lastPos.lat, lastPos.lng], 15)
    }
  }, [lastPos])

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null }
  }, [])

  return (
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', border: `2px solid ${C.orange}30`, boxShadow: `0 8px 40px rgba(245,158,11,0.12)` }}>
      <div ref={containerRef} className="chauffeur-map-container" style={{ height: 200 }} />
      {!lastPos && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,11,20,0.8)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, border: `3px solid ${C.orange}30`, borderTopColor: C.orange, borderRadius: '50%' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>Acquisition GPS...</span>
        </div>
      )}
    </div>
  )
}

// ── Photo Input ──────────────────────────────────
function PhotoInput({ label, btnLabel, photoFile, onChange }) {
  const inputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const preview  = useMemo(() => photoFile ? URL.createObjectURL(photoFile) : null, [photoFile])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const openPicker = () => {
    if (processing) return
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() }
  }

  // Compresse la photo (caméra téléphone = 5-12 Mo) avant de la remonter —
  // évite l'échec "trop volumineuse" (>8 Mo) et accélère l'upload mobile
  const handleFile = async (file) => {
    if (!file) { onChange(null); return }
    setProcessing(true)
    try { onChange(await compressImage(file)) }
    finally { setProcessing(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
        {label} <span style={{ color: C.red }}>*</span>
      </div>
      <div onClick={openPicker} style={{
        height: preview ? 'auto' : 96, borderRadius: 16, overflow: 'hidden',
        border: `2px dashed ${photoFile ? C.green : C.orange + '50'}`,
        background: photoFile ? `${C.green}08` : `${C.orange}06`,
        cursor: processing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, transition: 'all 0.15s',
      }}>
        {preview
          ? <img src={preview} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
          : processing
            ? <>
                <div style={{ width: 28, height: 28, border: `3px solid ${C.orange}40`, borderTopColor: C.orange, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>Traitement de la photo…</span>
              </>
            : <>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.orange}12`, border: `1.5px solid ${C.orange}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="1.8" strokeLinecap="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{btnLabel || 'Prendre une photo'}</span>
                <span style={{ fontSize: 11, color: C.muted }}>Appuyez pour ouvrir la caméra</span>
              </>
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      {preview && (
        <button onClick={e => {
          e.stopPropagation()
          onChange(null)
          if (inputRef.current) inputRef.current.value = ''
        }}
          style={{ marginTop: 6, fontSize: 11, color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
          Supprimer la photo
        </button>
      )}
    </div>
  )
}

// ── Modal Démarrer ────────────────────────────────
function ModalDemarrer({ citernes, onClose, onConfirm, loading }) {
  const [citerneId, setCiterneId] = useState('')
  const [qty,       setQty]       = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const ok = citerneId && qty && parseFloat(qty) > 0 && photoFile

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 25 }}
        style={{ background: C.card, borderRadius: '28px 28px 0 0', padding: '12px 22px 52px', width: '100%', maxWidth: 520, boxShadow: '0 -16px 64px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${C.border}`, borderBottom: 'none' }}>

        <div style={{ width: 44, height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 99, margin: '0 auto 24px' }} />

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: `${C.orange}15`, border: `2px solid ${C.orange}40`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round">
              <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Démarrer un trajet</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Photo du compteur jauge obligatoire</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 22 }}>
          {/* Citerne */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Citerne</div>
            <select value={citerneId} onChange={e => setCiterneId(e.target.value)}
              style={{ width: '100%', height: 54, background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${citerneId ? C.orange : C.border}`, borderRadius: 14, padding: '0 16px', fontSize: 15, color: C.text, outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s', appearance: 'none', fontFamily: 'inherit' }}>
              <option value="" style={{ background: C.card }}>Sélectionner une citerne</option>
              {citernes.map(c => <option key={c.id} value={c.id} style={{ background: C.card }}>{c.code} — {fmt(c.capacite)} L</option>)}
            </select>
          </div>

          {/* Quantité */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Quantité chargée (litres)</div>
            <input type="number" min="0" step="100" placeholder="15 000" value={qty}
              onChange={e => setQty(e.target.value)}
              onFocus={e => { e.target.style.borderColor = C.orange; e.target.style.boxShadow = `0 0 0 3px ${C.orange}20` }}
              onBlur={e  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
              style={{ width: '100%', height: 76, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '0 16px', fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: C.text, outline: 'none', textAlign: 'center', transition: 'all 0.15s' }} />
          </div>

          <PhotoInput label="Photo jauge au départ" btnLabel="Prendre photo jauge" photoFile={photoFile} onChange={setPhotoFile} />
        </div>

        <button onClick={() => onConfirm(citerneId, qty, photoFile)} disabled={!ok || loading}
          style={{ width: '100%', height: 60, borderRadius: 18, border: 'none', fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
            background: ok && !loading ? `linear-gradient(135deg, ${C.green}, #059669)` : 'rgba(255,255,255,0.06)',
            color: ok && !loading ? '#fff' : C.muted,
            cursor: ok && !loading ? 'pointer' : 'not-allowed',
            boxShadow: ok && !loading ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
          }}>
          {loading
            ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
          {loading ? 'Démarrage...' : 'Démarrer et activer le GPS'}
        </button>
        <button onClick={onClose}
          style={{ display: 'block', width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Formulaire Arriver (inline — remplace la carte GPS) ──
function FormulaireArriver({ trajetActif, onClose, onConfirm, loading }) {
  const [qty,       setQty]       = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const depart   = trajetActif?.qty_depart ?? 0
  const arrivee  = parseFloat(qty) || 0
  const ecart    = depart - arrivee
  const seuil    = trajetActif?.seuil_fraude ?? 50
  const isFraude = ecart > seuil
  const ok       = qty && arrivee > 0 && photoFile

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
      style={{ width: '100%', background: C.card, border: `1.5px solid ${C.blue}30`, borderRadius: 24, padding: '24px 20px', boxShadow: `0 8px 40px rgba(0,0,0,0.4)` }}>

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${C.blue}12`, border: `2px solid ${C.blue}35`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Arrivée à destination</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 5 }}>
          Chargement départ : <strong style={{ color: C.orange }}>{fmt(depart)} L</strong>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Quantité livrée (litres)</div>
        <input type="number" min="0" step="100" placeholder="14 800" value={qty}
          onChange={e => setQty(e.target.value)}
          onFocus={e => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = `0 0 0 3px ${C.blue}20` }}
          onBlur={e  => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
          style={{ width: '100%', height: 76, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '0 16px', fontSize: 40, fontWeight: 800, fontFamily: 'monospace', color: C.text, outline: 'none', textAlign: 'center', transition: 'all 0.15s' }} />
      </div>

      <AnimatePresence>
        {qty && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ borderRadius: 14, padding: '12px 16px', marginBottom: 14, textAlign: 'center', background: isFraude ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1.5px solid ${isFraude ? C.red + '40' : C.green + '40'}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isFraude ? C.red : C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Écart constaté {isFraude ? '⚠' : '✓'}</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', color: isFraude ? C.red : C.green }}>{ecart > 0 ? '+' : ''}{ecart.toFixed(1)} L</div>
            {isFraude && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>Alerte fraude automatique ({seuil}L seuil)</div>}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 20 }}>
        <PhotoInput label="Photo jauge à l'arrivée" btnLabel="Prendre photo jauge arrivée" photoFile={photoFile} onChange={setPhotoFile} />
      </div>

      <button onClick={() => onConfirm(qty, photoFile)} disabled={!ok || loading}
        style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
          background: ok && !loading ? `linear-gradient(135deg, ${C.blue}, #0284C7)` : 'rgba(255,255,255,0.06)',
          color: ok && !loading ? '#fff' : C.muted,
          cursor: ok && !loading ? 'pointer' : 'not-allowed',
          boxShadow: ok && !loading ? `0 8px 24px ${C.blue}40` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s',
        }}>
        {loading
          ? <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        }
        {loading ? 'Enregistrement...' : "Confirmer l'arrivée"}
      </button>
      <button onClick={onClose}
        style={{ display: 'block', width: '100%', marginTop: 10, padding: '11px 0', background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
        Annuler
      </button>
    </motion.div>
  )
}

// ── Écran Attente validation QR ───────────────────
function EcranAttenteQR({ trajetActif }) {
  const qr = trajetActif?.qr_code ?? '------'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(qr.toString()).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    }).catch(() => {})
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ width: '100%', background: `linear-gradient(135deg, ${C.orange}12, ${C.orange}06)`, border: `2px solid ${C.orange}40`, borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: `0 8px 40px ${C.orange}15` }}>

        <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: `${C.green}15`, border: `2px solid ${C.green}40`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${C.green}20` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </motion.div>

        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>Arrivée déclarée</div>
        <div style={{ fontSize: 14, color: C.sub, marginBottom: 28, lineHeight: 1.7 }}>
          Montrez ce code au logisticien<br/>pour valider la livraison
        </div>

        {/* QR Code display */}
        <div style={{ background: '#020409', border: `3px solid ${C.orange}`, borderRadius: 24, padding: '24px 28px 20px', display: 'inline-block', boxShadow: `0 0 50px ${C.orange}30` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 14 }}>Code de validation</div>
          <div style={{ fontSize: 58, fontWeight: 900, fontFamily: 'monospace', color: C.orange, letterSpacing: '0.22em', textShadow: `0 0 28px ${C.orange}60`, lineHeight: 1 }}>
            {qr.toString().split('').join(' ')}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={handleCopy}
            style={{ height: 48, borderRadius: 14, border: `1.5px solid ${copied ? C.green + '60' : C.orange + '50'}`, background: copied ? `${C.green}12` : `${C.orange}10`, color: copied ? C.green : C.orange, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
            {copied
              ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Copié !</>
              : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copier le code</>
            }
          </button>
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginTop: 14 }}>Valide 24 heures</div>
      </motion.div>

      {/* Infos trajet */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Chargement',  value: `${fmt(trajetActif.qty_depart ?? 0)} L` },
          { label: 'Livraison',   value: trajetActif.qty_arrivee ? `${fmt(parseFloat(trajetActif.qty_arrivee))} L` : '—' },
          { label: 'Citerne',     value: trajetActif.citerne_code ?? '—' },
          { label: 'Destination', value: trajetActif.station_nom ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────
export default function ChauffeurPage() {
  const { user, logout }            = useAuth()
  const { trajetActif, loading, demarrer, demarrerLoading, envoyerPosition, arriver, arriverLoading } = useTrajet()
  const { data: citernesData }      = useCiternes()
  const { parametres }              = useParametres()
  const citernes  = citernesData?.citernes ?? []

  const [modal,           setModal]           = useState(null)
  const [showArriverForm, setShowArriverForm] = useState(false)
  const [gpsStatus,       setGpsStatus]       = useState('inactif')
  const [lastPos,         setLastPos]         = useState(null)
  const watchRef = useRef(null)
  const timer    = useElapsed(trajetActif?.started_at)

  const isAttenteQR = trajetActif?.statut === 'arrive_attente'

  useEffect(() => {
    if (!trajetActif || isAttenteQR) {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
        setGpsStatus('inactif')
        setLastPos(null)
      }
      return
    }
    if (!navigator.geolocation) { setGpsStatus('erreur'); return }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed, heading } = pos.coords
        const vitesse = speed ? Math.round(speed * 3.6) : 0
        const cap     = (heading != null && !isNaN(heading)) ? Math.round(heading) : null
        setLastPos({ lat, lng, vitesse, cap })
        setGpsStatus('actif')
        envoyerPosition({ id: trajetActif.id, lat, lng, vitesse, cap })
      },
      () => setGpsStatus('erreur'),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    )
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
    // On (re)démarre le watch GPS uniquement quand le trajet change (id) ou
    // qu'il passe en attente QR — PAS à chaque nouvelle position ni quand
    // envoyerPosition change, sinon on re-souscrit la géoloc en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trajetActif?.id, isAttenteQR])

  const handleDemarrer = async (citerneId, qty, photoFile) => {
    try {
      await demarrer({ citerne_id: parseInt(citerneId), qty_depart: parseFloat(qty), photoFile })
      setModal(null)
    } catch { /* toast affiché par onError — modal reste ouverte pour réessayer */ }
  }

  const handleArriver = async (qty, photoFile) => {
    if (!trajetActif) return
    try {
      await arriver({ id: trajetActif.id, qty_arrivee: parseFloat(qty), photoFile })
      setShowArriverForm(false)
    } catch { /* toast affiché par onError — formulaire reste ouvert pour réessayer */ }
  }

  const GPS_COLOR = { actif: C.green, erreur: C.red, inactif: C.muted }[gpsStatus]
  const GPS_LABEL = { actif: 'GPS actif', erreur: 'GPS indisponible', inactif: 'Acquisition GPS...' }[gpsStatus]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #090D1A, #111827)', borderBottom: `1px solid ${C.orange}20`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parametres?.logo_url
            ? <img src={parametres.logo_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.orange}40` }} />
            : <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.orange}, #D97706)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${C.orange}40` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#090D1A" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
              </div>
          }
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{parametres?.nom ?? 'Fuelo'}</div>
            <div style={{ fontSize: 10, color: C.orange, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Chauffeur</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {trajetActif && !isAttenteQR && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: `${GPS_COLOR}12`, border: `1px solid ${GPS_COLOR}30`, borderRadius: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: GPS_COLOR, boxShadow: gpsStatus === 'actif' ? `0 0 6px ${GPS_COLOR}` : 'none', animation: gpsStatus === 'actif' ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: 11, color: GPS_COLOR, fontWeight: 700 }}>{GPS_LABEL}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${C.orange}20`, border: `1px solid ${C.orange}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.orange }}>
              {(user?.nom || 'C').charAt(0).toUpperCase()}
            </div>
            <span className="chauffeur-user-name" style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{user?.nom}</span>
          </div>
          <NotifCenter size={32} color={C.sub} bg="rgba(255,255,255,0.06)" border={C.border} />
          <MessagesButton color={C.sub} bg="rgba(255,255,255,0.06)" border={C.border} />
          <button onClick={logout}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(239,68,68,0.8)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 40px', gap: 14, maxWidth: 520, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 40, height: 40, border: `3px solid ${C.orange}25`, borderTopColor: C.orange, borderRadius: '50%' }} />
            <span style={{ fontSize: 13, color: C.sub }}>Chargement...</span>
          </div>

        ) : isAttenteQR ? (
          <EcranAttenteQR trajetActif={trajetActif} />

        ) : trajetActif ? (
          <AnimatePresence mode="wait">
            {showArriverForm ? (
              <FormulaireArriver key="arriver" trajetActif={trajetActif} onClose={() => setShowArriverForm(false)} onConfirm={handleArriver} loading={arriverLoading} />
            ) : (
              <motion.div key="actif" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* ─ Service actif + stats ─ */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                  style={{ width: '100%', background: `linear-gradient(135deg, ${C.orange}12, ${C.orange}06)`, border: `1.5px solid ${C.orange}35`, borderRadius: 24, padding: '20px', boxShadow: `0 8px 32px ${C.orange}15` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <RingTimer pct={timer.pct} label={timer.label} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Trajet actif</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                        {[
                          { l: 'Vitesse', v: lastPos ? `${lastPos.vitesse}` : '—', u: 'km/h', c: lastPos?.vitesse > 90 ? C.red : C.text },
                          { l: 'Charge',  v: fmt(trajetActif.qty_depart ?? 0), u: 'L',    c: C.orange },
                        ].map(({ l, v, u, c }) => (
                          <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: c, fontFamily: 'monospace', lineHeight: 1 }}>{v}<span style={{ fontSize: 11, color: C.muted, marginLeft: 2 }}>{u}</span></div>
                            <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setShowArriverForm(true)}
                        style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.blue}, #0284C7)`, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 16px ${C.blue}35` }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Arriver à destination
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* ─ Carte GPS live ─ */}
                <div style={{ width: '100%' }}>
                  <LiveMap lastPos={lastPos} />
                </div>

                {/* ─ Infos trajet ─ */}
                <div className="chauffeur-infos-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Citerne',     value: trajetActif.citerne_code ?? '—' },
                    { label: 'Destination', value: trajetActif.station_nom ?? '—' },
                    { label: 'Cap',         value: lastPos?.cap != null ? `${lastPos.cap}°` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {gpsStatus === 'erreur' && (
                  <div style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: `1px solid ${C.red}40`, borderRadius: 14, padding: '14px 16px', textAlign: 'center', fontSize: 13, color: C.red, fontWeight: 600 }}>
                    Activez la localisation dans les paramètres de votre téléphone
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        ) : (
          /* ─ Aucun trajet ─ */
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 32 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 28, padding: '48px 24px 40px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>

              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 88, height: 88, borderRadius: '50%', background: `${C.orange}12`, border: `2px solid ${C.orange}30`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${C.orange}15` }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="1.8" strokeLinecap="round">
                  <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                </svg>
              </motion.div>

              <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 10, letterSpacing: '-0.3px' }}>Aucun trajet en cours</div>
              <div style={{ fontSize: 14, color: C.sub, marginBottom: 36, lineHeight: 1.7, maxWidth: 300, margin: '0 auto 36px' }}>
                Démarrez un trajet pour activer le suivi GPS en temps réel et transmettre votre position.
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('demarrer')}
                style={{ width: '100%', height: 64, borderRadius: 20, border: 'none', background: `linear-gradient(135deg, ${C.orange}, #D97706)`, color: '#070B14', fontSize: 17, fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 28px ${C.orange}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Démarrer un trajet
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────── */}
      <AnimatePresence>
        {modal === 'demarrer' && <ModalDemarrer citernes={citernes} onClose={() => setModal(null)} onConfirm={handleDemarrer} loading={demarrerLoading} />}
      </AnimatePresence>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(245,158,11,0.7)} 50%{opacity:0.6;box-shadow:0 0 16px rgba(245,158,11,1)} }
        select { appearance: none; -webkit-appearance: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .chauffeur-map-container { height: 200px; }
        @media (min-height: 700px) { .chauffeur-map-container { height: 240px; } }
        @media (min-height: 800px) { .chauffeur-map-container { height: 280px; } }
        @media (max-width: 400px) {
          .chauffeur-user-name { display: none !important; }
          .chauffeur-infos-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
