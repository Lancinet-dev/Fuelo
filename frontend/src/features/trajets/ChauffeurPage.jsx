// ================================================
// FUELO — Interface chauffeur GPS
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth }    from '../../context/AuthContext'
import { useTheme }   from '../../context/ThemeContext'
import { useTrajet }  from '../../hooks/useTrajet'
import { useCiternes } from '../../hooks/useTrajets'
import theme from '../../config/theme'

const ORANGE = '#F59E0B'

// Durée en cours depuis started_at
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`)
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [startedAt])
  return elapsed
}

export default function ChauffeurPage() {
  const { user, logout }         = useAuth()
  const { isDark, toggle, palette } = useTheme()
  const { trajetActif, loading, demarrer, demarrerLoading, envoyerPosition, arriver, arriverLoading } = useTrajet()
  const { data: citernesData }   = useCiternes()
  const citernes = citernesData?.citernes ?? []

  const [modal,         setModal]         = useState(null) // 'demarrer' | 'arriver'
  const [citerneId,     setCiterneId]     = useState('')
  const [qtyDepart,     setQtyDepart]     = useState('')
  const [qtyArrivee,    setQtyArrivee]    = useState('')
  const [gpsStatus,     setGpsStatus]     = useState('inactif') // 'inactif' | 'actif' | 'erreur'
  const [lastPos,       setLastPos]       = useState(null)
  const watchRef = useRef(null)
  const elapsed  = useElapsed(trajetActif?.started_at)

  // Démarrer/arrêter le GPS watchPosition selon le trajet actif
  useEffect(() => {
    if (!trajetActif) {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
        setGpsStatus('inactif')
      }
      return
    }

    if (!navigator.geolocation) {
      setGpsStatus('erreur')
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, speed } = pos.coords
        const vitesse = speed ? Math.round(speed * 3.6) : 0
        setLastPos({ lat, lng, vitesse })
        setGpsStatus('actif')
        envoyerPosition({ id: trajetActif.id, lat, lng, vitesse })
      },
      (err) => {
        console.error('GPS error:', err)
        setGpsStatus('erreur')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
    )

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
  }, [trajetActif?.id])

  const handleDemarrer = async () => {
    if (!citerneId || !qtyDepart) return
    await demarrer({ citerne_id: parseInt(citerneId), qty_depart: parseFloat(qtyDepart) })
    setModal(null)
  }

  const handleArriver = async () => {
    if (!qtyArrivee || !trajetActif) return
    await arriver({ id: trajetActif.id, qty_arrivee: parseFloat(qtyArrivee) })
    setModal(null)
    setQtyArrivee('')
  }

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'
  const inputSt = { width: '100%', height: 52, background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', border: `1.5px solid ${palette.cardBorder}`, borderRadius: 12, padding: '0 14px', fontSize: 15, color: palette.text, fontFamily: theme.font.family, outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="2.5" strokeLinecap="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            fuel<span style={{ color: ORANGE }}>o</span> <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Chauffeur</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{user?.nom}</span>
          <button onClick={logout} style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Quitter</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 14 }}>

        {/* Carte trajet actif / démarrer */}
        {trajetActif ? (
          <div style={{ background: isDark ? 'rgba(16,185,129,0.08)' : '#fff', border: `2px solid rgba(16,185,129,0.3)`, borderRadius: 20, padding: '20px', width: '100%', maxWidth: 480, boxShadow: theme.shadow.md }}>

            {/* Statut GPS */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: gpsStatus === 'actif' ? theme.colors.success : gpsStatus === 'erreur' ? theme.colors.danger : '#94A3B8', animation: gpsStatus === 'actif' ? 'pulse 2s infinite' : 'none', boxShadow: gpsStatus === 'actif' ? '0 0 8px rgba(16,185,129,0.6)' : 'none' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: gpsStatus === 'actif' ? theme.colors.success : gpsStatus === 'erreur' ? theme.colors.danger : palette.textSub }}>
                  {gpsStatus === 'actif' ? 'GPS actif' : gpsStatus === 'erreur' ? 'GPS indisponible' : 'GPS en attente...'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: palette.textSub }}>Depuis {elapsed}</span>
            </div>

            {/* Infos trajet */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { l: 'Citerne', v: trajetActif.citerne_code ?? '—' },
                { l: 'Destination', v: trajetActif.station_nom ?? '—' },
                { l: 'Chargement', v: `${trajetActif.qty_depart} L` },
                { l: lastPos ? 'Vitesse' : 'Position', v: lastPos ? `${lastPos.vitesse} km/h` : 'En attente...' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{v}</div>
                  <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {gpsStatus === 'erreur' && (
              <div style={{ fontSize: 12, color: theme.colors.danger, background: theme.colors.dangerLight, borderRadius: 10, padding: '10px 14px', marginBottom: 14, textAlign: 'center' }}>
                Activez la localisation dans les paramètres de votre téléphone
              </div>
            )}

            <button onClick={() => setModal('arriver')}
              style={{ width: '100%', height: 54, borderRadius: 14, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${theme.colors.primary}, #1D4ED8)`, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Arriver à destination
            </button>
          </div>
        ) : (
          <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 20, padding: '32px 20px', width: '100%', maxWidth: 480, textAlign: 'center', boxShadow: theme.shadow.md }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 6 }}>Aucun trajet en cours</div>
            <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 24 }}>Démarrez un trajet pour activer le GPS</div>
            <button onClick={() => setModal('demarrer')}
              style={{ width: '100%', height: 54, borderRadius: 14, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${theme.colors.success}, #059669)`, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>
              Démarrer un trajet
            </button>
          </div>
        )}

      </div>

      {/* Modal démarrer */}
      {modal === 'demarrer' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: isDark ? '#0D1B2A' : '#fff', borderRadius: '24px 24px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s ease' }}>
            <div style={{ width: 40, height: 4, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 20px', opacity: 0.6 }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: palette.text, marginBottom: 20, textAlign: 'center' }}>🚚 Démarrer un trajet</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Citerne</div>
                <select value={citerneId} onChange={e => setCiterneId(e.target.value)} style={{ ...inputSt }}>
                  <option value="">Sélectionner une citerne</option>
                  {citernes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.capacite} L</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Quantité chargée (litres)</div>
                <input type="number" min="0" step="1" placeholder="ex: 15000" value={qtyDepart} onChange={e => setQtyDepart(e.target.value)} style={{ ...inputSt, fontSize: 22, fontWeight: 700, textAlign: 'center', fontFamily: theme.font.mono }} />
              </div>
            </div>

            <button onClick={handleDemarrer} disabled={demarrerLoading || !citerneId || !qtyDepart}
              style={{ width: '100%', height: 54, borderRadius: 14, border: 'none', cursor: 'pointer', background: !citerneId || !qtyDepart ? (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') : `linear-gradient(135deg, ${theme.colors.success}, #059669)`, color: !citerneId || !qtyDepart ? palette.textMuted : '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit' }}>
              {demarrerLoading ? 'Démarrage...' : 'Démarrer et activer le GPS'}
            </button>
            <button onClick={() => setModal(null)} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Modal arriver */}
      {modal === 'arriver' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: isDark ? '#0D1B2A' : '#fff', borderRadius: '24px 24px 0 0', padding: '28px 20px 40px', width: '100%', maxWidth: 480, animation: 'slideUp 0.3s ease' }}>
            <div style={{ width: 40, height: 4, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 20px', opacity: 0.6 }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: palette.text, marginBottom: 8, textAlign: 'center' }}>📍 Arrivée à destination</div>
            <div style={{ fontSize: 12, color: palette.textSub, textAlign: 'center', marginBottom: 20 }}>
              Départ : <strong style={{ color: palette.text }}>{trajetActif?.qty_depart} L</strong>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Quantité livrée (litres)</div>
              <input type="number" min="0" step="1" placeholder="ex: 14800" value={qtyArrivee} onChange={e => setQtyArrivee(e.target.value)}
                style={{ ...inputSt, fontSize: 30, fontWeight: 800, textAlign: 'center', fontFamily: theme.font.mono, height: 70 }} />
            </div>

            {qtyArrivee && trajetActif && (
              <div style={{ textAlign: 'center', marginBottom: 16, padding: '10px', background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: (trajetActif.qty_depart - qtyArrivee) > (trajetActif.seuil_fraude ?? 50) ? theme.colors.danger : theme.colors.success }}>
                  Écart : {(trajetActif.qty_depart - parseFloat(qtyArrivee || 0)).toFixed(1)} L
                  {(trajetActif.qty_depart - qtyArrivee) > (trajetActif.seuil_fraude ?? 50) ? ' ⚠️' : ' ✓'}
                </span>
              </div>
            )}

            <button onClick={handleArriver} disabled={arriverLoading || !qtyArrivee}
              style={{ width: '100%', height: 54, borderRadius: 14, border: 'none', cursor: 'pointer', background: !qtyArrivee ? (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0') : `linear-gradient(135deg, ${theme.colors.primary}, #1D4ED8)`, color: !qtyArrivee ? palette.textMuted : '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit' }}>
              {arriverLoading ? 'Enregistrement...' : 'Confirmer l\'arrivée'}
            </button>
            <button onClick={() => setModal(null)} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(16,185,129,0.6)} 50%{opacity:0.6;box-shadow:0 0 16px rgba(16,185,129,0.9)} }
        select { appearance: none; }
      `}</style>
    </div>
  )
}
