// ================================================
// FUELO — Interface Chauffeur GPS (premium mobile)
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth }        from '../../context/AuthContext'
import { useTheme }       from '../../context/ThemeContext'
import { useTrajet }      from '../../hooks/useTrajet'
import { useCiternes }    from '../../hooks/useTrajets'
import { useParametres }  from '../../hooks/useParametres'
import theme from '../../config/theme'

const GREEN  = '#10B981'
const BLUE   = '#2563EB'
const ORANGE = '#F59E0B'

// ── Durée depuis started_at ───────────────────────
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`)
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [startedAt])
  return elapsed
}

// ── Carte GPS live (Leaflet) ──────────────────────
function LiveMap({ lastPos, isDark }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const leafletRef   = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !containerRef.current || mapRef.current) return

      leafletRef.current = L
      const center = lastPos ? [lastPos.lat, lastPos.lng] : [9.537, -13.677]
      const map = L.map(containerRef.current, {
        zoomControl: true, attributionControl: false,
      }).setView(center, 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

      if (lastPos) {
        const icon = L.divIcon({
          html: `<div style="width:22px;height:22px;background:${BLUE};border:3px solid #fff;border-radius:50%;box-shadow:0 0 14px rgba(37,99,235,0.65)"></div>`,
          className: '', iconAnchor: [11, 11],
        })
        markerRef.current = L.marker([lastPos.lat, lastPos.lng], { icon }).addTo(map)
      }

      mapRef.current = map
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !leafletRef.current || !lastPos) return
    const L = leafletRef.current

    if (markerRef.current) {
      markerRef.current.setLatLng([lastPos.lat, lastPos.lng])
      mapRef.current.panTo([lastPos.lat, lastPos.lng], { animate: true, duration: 1 })
    } else {
      const icon = L.divIcon({
        html: `<div style="width:22px;height:22px;background:${BLUE};border:3px solid #fff;border-radius:50%;box-shadow:0 0 14px rgba(37,99,235,0.65)"></div>`,
        className: '', iconAnchor: [11, 11],
      })
      markerRef.current = L.marker([lastPos.lat, lastPos.lng], { icon }).addTo(mapRef.current)
      mapRef.current.setView([lastPos.lat, lastPos.lng], 15)
    }
  }, [lastPos])

  useEffect(() => () => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={{
        height: 240, borderRadius: 18, overflow: 'hidden',
        border: `2px solid ${isDark ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.22)'}`,
        boxShadow: '0 8px 32px rgba(37,99,235,0.15)',
      }} />
      {!lastPos && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: isDark ? 'rgba(13,27,42,0.75)' : 'rgba(240,244,255,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(37,99,235,0.3)', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>Acquisition GPS...</span>
        </div>
      )}
    </div>
  )
}

// ── Sélecteur photo (caméra) ──────────────────────
function PhotoInput({ label, photoFile, onChange, palette, isDark }) {
  const inputRef = useRef(null)
  const preview  = photoFile ? URL.createObjectURL(photoFile) : null

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
        {label} <span style={{ color: theme.colors.danger }}>*</span>
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          height: preview ? 'auto' : 80, borderRadius: 14, overflow: 'hidden',
          border: `2px dashed ${photoFile ? GREEN : palette.cardBorder}`,
          background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6, transition: 'all 0.15s',
        }}
      >
        {preview ? (
          <img src={preview} alt="aperçu" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="1.5" strokeLinecap="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{ fontSize: 12, color: palette.textMuted, fontWeight: 500 }}>Prendre une photo</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />
      {preview && (
        <button
          onClick={e => { e.stopPropagation(); onChange(null) }}
          style={{ marginTop: 6, fontSize: 11, color: theme.colors.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Supprimer la photo
        </button>
      )}
    </div>
  )
}

// ── Modal Démarrer un trajet ──────────────────────
function ModalDemarrer({ citernes, onClose, onConfirm, loading, palette, isDark }) {
  const [citerneId, setCiterneId] = useState('')
  const [qty,       setQty]       = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const canSubmit = citerneId && qty && parseFloat(qty) > 0 && photoFile

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 24px 48px',
        width: '100%', maxWidth: 520,
        animation: 'slideUp 0.3s ease',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ width: 44, height: 5, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 24px', opacity: 0.5 }} />

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🚚</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>Démarrer un trajet</div>
          <div style={{ fontSize: 13, color: palette.textSub, marginTop: 4 }}>Photo du compteur obligatoire</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {/* Citerne */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Citerne</div>
            <select value={citerneId} onChange={e => setCiterneId(e.target.value)} style={{
              width: '100%', height: 52, background: palette.inputBg,
              border: `1.5px solid ${citerneId ? BLUE : palette.cardBorder}`,
              borderRadius: 14, padding: '0 16px',
              fontSize: 15, color: palette.text,
              fontFamily: theme.font.family, outline: 'none', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}>
              <option value="">Sélectionner une citerne</option>
              {citernes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.capacite.toLocaleString('fr-FR')} L</option>)}
            </select>
          </div>

          {/* Quantité */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
              Quantité chargée (litres)
            </div>
            <input type="number" min="0" step="100" placeholder="15 000" value={qty}
              onChange={e => setQty(e.target.value)}
              onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
              onBlur={e  => { e.target.style.borderColor = qty ? BLUE : palette.cardBorder; e.target.style.boxShadow = 'none' }}
              style={{
                width: '100%', height: 72, boxSizing: 'border-box',
                background: palette.inputBg, border: `1.5px solid ${qty ? BLUE : palette.cardBorder}`,
                borderRadius: 14, padding: '0 16px',
                fontSize: 36, fontWeight: 800, fontFamily: theme.font.mono,
                color: palette.text, outline: 'none',
                textAlign: 'center', transition: 'all 0.15s',
              }} />
          </div>

          {/* Photo départ */}
          <PhotoInput
            label="Photo compteur au départ"
            photoFile={photoFile}
            onChange={setPhotoFile}
            palette={palette}
            isDark={isDark}
          />
        </div>

        <button onClick={() => onConfirm(citerneId, qty, photoFile)} disabled={!canSubmit || loading}
          style={{
            width: '100%', height: 58, borderRadius: 16, border: 'none',
            background: canSubmit && !loading
              ? `linear-gradient(135deg, ${GREEN}, #059669)`
              : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
            color: canSubmit && !loading ? '#fff' : palette.textMuted,
            fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit && !loading ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s',
          }}>
          {loading
            ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>
          }
          {loading ? 'Démarrage...' : 'Démarrer et activer le GPS'}
        </button>
        <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Modal Arriver à destination ───────────────────
function ModalArriver({ trajetActif, onClose, onConfirm, loading, palette, isDark }) {
  const [qty,       setQty]       = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const depart     = trajetActif?.qty_depart ?? 0
  const arrivee    = parseFloat(qty) || 0
  const ecart      = depart - arrivee
  const seuil      = trajetActif?.seuil_fraude ?? 50
  const isFraude   = ecart > seuil
  const canSubmit  = qty && arrivee > 0 && photoFile

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 24px 48px',
        width: '100%', maxWidth: 520,
        animation: 'slideUp 0.3s ease',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ width: 44, height: 5, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 24px', opacity: 0.5 }} />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>Arrivée à destination</div>
          <div style={{ fontSize: 13, color: palette.textSub, marginTop: 4 }}>
            Chargement départ : <strong style={{ color: BLUE }}>{depart.toLocaleString('fr-FR')} L</strong>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>
            Quantité livrée (litres)
          </div>
          <input type="number" min="0" step="100" placeholder="14 800" value={qty}
            onChange={e => setQty(e.target.value)}
            onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
            onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }}
            style={{
              width: '100%', height: 80, boxSizing: 'border-box',
              background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`,
              borderRadius: 14, padding: '0 16px',
              fontSize: 40, fontWeight: 800, fontFamily: theme.font.mono,
              color: palette.text, outline: 'none',
              textAlign: 'center', transition: 'all 0.15s',
            }} />
        </div>

        {qty && (
          <div style={{
            borderRadius: 14, padding: '14px 18px', marginBottom: 16, textAlign: 'center',
            background: isFraude ? theme.colors.dangerLight : theme.colors.successLight,
            border: `1.5px solid ${isFraude ? theme.colors.danger + '40' : theme.colors.success + '40'}`,
            transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isFraude ? theme.colors.danger : GREEN, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Écart constaté
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: theme.font.mono, color: isFraude ? theme.colors.danger : GREEN }}>
              {ecart > 0 ? '+' : ''}{ecart.toFixed(1)} L
            </div>
          </div>
        )}

        {/* Photo arrivée */}
        <div style={{ marginBottom: 20 }}>
          <PhotoInput
            label="Photo compteur à l'arrivée"
            photoFile={photoFile}
            onChange={setPhotoFile}
            palette={palette}
            isDark={isDark}
          />
        </div>

        <button onClick={() => onConfirm(qty, photoFile)} disabled={!canSubmit || loading}
          style={{
            width: '100%', height: 58, borderRadius: 16, border: 'none',
            background: canSubmit && !loading
              ? `linear-gradient(135deg, ${BLUE}, #1D4ED8)`
              : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
            color: canSubmit && !loading ? '#fff' : palette.textMuted,
            fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit && !loading ? '0 8px 24px rgba(37,99,235,0.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s',
          }}>
          {loading
            ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          }
          {loading ? 'Enregistrement...' : "Confirmer l'arrivée"}
        </button>
        <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 12, padding: '12px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Écran Attente validation QR ───────────────────
function EcranAttenteQR({ trajetActif, palette, isDark }) {
  const qr = trajetActif?.qr_code ?? '------'

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Carte principale */}
      <div style={{
        width: '100%',
        background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)',
        border: `2px solid ${BLUE}40`,
        borderRadius: 24, padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(37,99,235,0.12)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: palette.text, marginBottom: 6 }}>
          Arrivée déclarée
        </div>
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 28, lineHeight: 1.6 }}>
          Montrez ce code à votre logisticien<br/>pour valider la livraison
        </div>

        {/* Code QR */}
        <div style={{
          background: isDark ? '#0D1B2A' : '#fff',
          border: `3px solid ${BLUE}`,
          borderRadius: 20, padding: '20px 32px',
          display: 'inline-block',
          boxShadow: `0 0 32px ${BLUE}30`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
            Code de validation
          </div>
          <div style={{
            fontSize: 48, fontWeight: 900, fontFamily: theme.font.mono,
            color: BLUE, letterSpacing: '0.18em',
            textShadow: `0 0 24px ${BLUE}50`,
          }}>
            {qr.toString().split('').join(' ')}
          </div>
        </div>

        <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 16 }}>
          Valide 24 heures
        </div>
      </div>

      {/* Infos trajet */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Chargement',  value: `${(trajetActif.qty_depart ?? 0).toLocaleString('fr-FR')} L` },
          { label: 'Livraison',   value: trajetActif.qty_arrivee ? `${parseFloat(trajetActif.qty_arrivee).toLocaleString('fr-FR')} L` : '—' },
          { label: 'Citerne',     value: trajetActif.citerne_code ?? '—' },
          { label: 'Destination', value: trajetActif.station_nom ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: palette.card, border: `1px solid ${palette.cardBorder}`,
            borderRadius: 14, padding: '12px 10px', textAlign: 'center',
            boxShadow: theme.shadow.sm,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
            <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────
export default function ChauffeurPage() {
  const { user, logout }            = useAuth()
  const { isDark, toggle, palette } = useTheme()
  const { trajetActif, loading, demarrer, demarrerLoading, envoyerPosition, arriver, arriverLoading } = useTrajet()
  const { data: citernesData }      = useCiternes()
  const { parametres }              = useParametres()
  const citernes = citernesData?.citernes ?? []

  const [modal,     setModal]     = useState(null) // 'demarrer' | 'arriver'
  const [gpsStatus, setGpsStatus] = useState('inactif')
  const [lastPos,   setLastPos]   = useState(null)
  const watchRef = useRef(null)
  const elapsed  = useElapsed(trajetActif?.started_at)

  const isAttenteQR = trajetActif?.statut === 'arrive_attente'

  // Watchposition GPS quand trajet en cours (pas en attente QR)
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
        const { latitude: lat, longitude: lng, speed } = pos.coords
        const vitesse = speed ? Math.round(speed * 3.6) : 0
        setLastPos({ lat, lng, vitesse })
        setGpsStatus('actif')
        envoyerPosition({ id: trajetActif.id, lat, lng, vitesse })
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
  }, [trajetActif?.id, isAttenteQR])

  const handleDemarrer = async (citerneId, qty, photoFile) => {
    await demarrer({ citerne_id: parseInt(citerneId), qty_depart: parseFloat(qty), photoFile })
    setModal(null)
  }

  const handleArriver = async (qty, photoFile) => {
    if (!trajetActif) return
    await arriver({ id: trajetActif.id, qty_arrivee: parseFloat(qty), photoFile })
    setModal(null)
  }

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'

  const GPS_ICON_COLOR = { actif: GREEN, erreur: theme.colors.danger, inactif: '#94A3B8' }[gpsStatus]
  const GPS_LABEL      = { actif: 'GPS actif', erreur: 'GPS indisponible', inactif: 'Acquisition GPS...' }[gpsStatus]

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 24px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parametres?.logo_url ? (
            <img src={parametres.logo_url} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }} />
          ) : (
            <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {parametres?.nom ?? <span>fuel<span style={{ color: ORANGE }}>o</span></span>}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>Chauffeur</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: ORANGE }}>
              {(user?.nom || 'C').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{user?.nom}</span>
          </div>
          <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'rgba(255,255,255,0.35)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
            </svg>
          </button>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(239,68,68,0.85)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 11px' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'rgba(239,68,68,0.85)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 32px', gap: 16, maxWidth: 520, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${palette.cardBorder}`, borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: palette.textSub }}>Chargement...</span>
          </div>
        ) : isAttenteQR ? (
          /* ─ Attente validation QR ─ */
          <EcranAttenteQR trajetActif={trajetActif} palette={palette} isDark={isDark} />
        ) : trajetActif ? (
          <>
            {/* ─ Barre statut GPS + vitesse ─ */}
            <div style={{
              width: '100%',
              background: palette.card,
              border: `1px solid ${palette.cardBorder}`,
              borderRadius: 18,
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              boxShadow: theme.shadow.sm,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: GPS_ICON_COLOR, boxShadow: gpsStatus === 'actif' ? `0 0 8px ${GPS_ICON_COLOR}80` : 'none', animation: gpsStatus === 'actif' ? 'pulse 2s infinite' : 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: GPS_ICON_COLOR }}>{GPS_LABEL}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {lastPos && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, lineHeight: 1 }}>{lastPos.vitesse}</div>
                    <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>km/h</div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono, lineHeight: 1 }}>{elapsed}</div>
                  <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>en route</div>
                </div>
              </div>
            </div>

            {/* ─ Carte GPS live ─ */}
            <div style={{ width: '100%' }}>
              <LiveMap lastPos={lastPos} isDark={isDark} />
            </div>

            {/* ─ Infos trajet ─ */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Citerne',     value: trajetActif.citerne_code ?? '—' },
                { label: 'Destination', value: trajetActif.station_nom ?? '—' },
                { label: 'Chargement',  value: `${(trajetActif.qty_depart ?? 0).toLocaleString('fr-FR')} L` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: palette.card, border: `1px solid ${palette.cardBorder}`,
                  borderRadius: 14, padding: '12px 10px', textAlign: 'center',
                  boxShadow: theme.shadow.sm,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                  <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>

            {gpsStatus === 'erreur' && (
              <div style={{ width: '100%', background: theme.colors.dangerLight, border: `1px solid ${theme.colors.danger}40`, borderRadius: 14, padding: '12px 16px', textAlign: 'center', fontSize: 13, color: theme.colors.danger, fontWeight: 600 }}>
                📍 Activez la localisation dans les paramètres de votre téléphone
              </div>
            )}

            {/* ─ Bouton arriver ─ */}
            <button onClick={() => setModal('arriver')} style={{
              width: '100%', height: 64, borderRadius: 18, border: 'none',
              background: `linear-gradient(135deg, ${BLUE}, #1D4ED8)`,
              color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(37,99,235,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(37,99,235,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.4)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Arriver à destination
            </button>
          </>
        ) : (
          /* ─ Aucun trajet ─ */
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, paddingTop: 40 }}>
            <div style={{
              width: '100%',
              background: palette.card, border: `1px solid ${palette.cardBorder}`,
              borderRadius: 24, padding: '48px 24px 36px',
              textAlign: 'center', boxShadow: theme.shadow.md,
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
                background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)',
                border: `2px solid rgba(245,158,11,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36,
              }}>
                🚚
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, marginBottom: 8, letterSpacing: '-0.3px' }}>
                Aucun trajet en cours
              </div>
              <div style={{ fontSize: 14, color: palette.textSub, marginBottom: 32, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 32px' }}>
                Démarrez un trajet pour activer le suivi GPS en temps réel.
              </div>
              <button onClick={() => setModal('demarrer')} style={{
                width: '100%', height: 62, borderRadius: 18, border: 'none',
                background: `linear-gradient(135deg, ${GREEN}, #059669)`,
                color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 8px 28px rgba(16,185,129,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(16,185,129,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.4)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Démarrer un trajet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────── */}
      {modal === 'demarrer' && (
        <ModalDemarrer
          citernes={citernes}
          onClose={() => setModal(null)}
          onConfirm={handleDemarrer}
          loading={demarrerLoading}
          palette={palette} isDark={isDark}
        />
      )}
      {modal === 'arriver' && (
        <ModalArriver
          trajetActif={trajetActif}
          onClose={() => setModal(null)}
          onConfirm={handleArriver}
          loading={arriverLoading}
          palette={palette} isDark={isDark}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
        select { appearance: none; -webkit-appearance: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}
