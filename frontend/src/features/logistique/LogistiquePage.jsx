// ================================================
// FUELO — Interface logisticien
// ================================================

import { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react'
import { useAuth }    from '../../context/AuthContext'
import { PlanGatePage } from '../../ui/PlanGate'
import { useTrajets, useGpsPoints, useCiternes } from '../../hooks/useTrajets'
import { usePerformances, useValiderPrime } from '../../hooks/usePerformances'
import { useParametres } from '../../hooks/useParametres'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api            from '../../services/api'
import toast          from 'react-hot-toast'
import { formatRelative } from '../../utils/format'
import { exportTrajetsExcel } from '../../utils/export'
import theme from '../../config/theme'

const GpsFlottePage = lazy(() => import('./GpsFlottePage'))

const ORANGE = '#F59E0B'

// Palette dark fixe — identité Fleet Ops, indépendante du ThemeContext
const LOG_PALETTE = {
  bg:          '#0C0F1A',
  card:        '#111827',
  card2:       '#1A2235',
  cardBorder:  'rgba(255,255,255,0.08)',
  text:        '#F1F5F9',
  textSub:     '#94A3B8',
  textMuted:   '#64748B',
  inputBg:     'rgba(255,255,255,0.06)',
  hover:       'rgba(255,255,255,0.05)',
  successLight:'rgba(16,185,129,0.15)',
  dangerLight: 'rgba(239,68,68,0.15)',
  infoLight:   'rgba(245,158,11,0.15)',
  warningLight:'rgba(245,158,11,0.12)',
}
const TABS   = [
  { key: 'gps',          label: 'GPS Flotte' },
  { key: 'trajets',      label: 'Trajets'    },
  { key: 'citernes',     label: 'Citernes'   },
  { key: 'chauffeurs',   label: 'Chauffeurs' },
  { key: 'alertes',      label: 'Alertes'    },
  { key: 'performances', label: 'Primes'     },
  { key: 'rapports',     label: 'Rapports'   },
]

function TabIcon({ tabKey, size = 15, color = 'currentColor' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (tabKey === 'gps')          return <svg {...p}><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 6.9 8 11.7z"/></svg>
  if (tabKey === 'trajets')      return <svg {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
  if (tabKey === 'citernes')     return <svg {...p}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  if (tabKey === 'chauffeurs')   return <svg {...p}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  if (tabKey === 'alertes')      return <svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
  if (tabKey === 'performances') return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  if (tabKey === 'rapports')     return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
  return null
}

const STATUT_CFG = {
  en_cours:       { label: 'En cours',    color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  arrive_attente: { label: 'Attente QR',  color: '#D97706',            bg: '#FEF3C7'                 },
  alerte:         { label: 'Fraude',      color: '#EF4444',  bg: 'rgba(239,68,68,0.15)'  },
  arrive:         { label: 'Arrivé',      color: '#38BDF8',    bg: 'rgba(56,189,248,0.15)'    },
}

// ── Carte Leaflet ─────────────────────────────────
function MiniMap({ trajetId, isDark }) {
  const mapRef  = useRef(null)
  const leafRef = useRef(null)
  const { data } = useGpsPoints(trajetId)
  const points = useMemo(() => data?.points ?? [], [data?.points])

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return
    const init = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (leafRef.current) { leafRef.current.remove(); leafRef.current = null }
      const last   = points[points.length - 1]
      const center = [last.lat, last.lng]
      const map    = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView(center, 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      const latlngs = points.map(p => [p.lat, p.lng])
      L.polyline(latlngs, { color: ORANGE, weight: 4, opacity: 0.8 }).addTo(map)
      const startIcon = L.divIcon({ html: '<div style="width:10px;height:10px;background:#10B981;border:2px solid #fff;border-radius:50%"></div>', className: '', iconAnchor: [5,5] })
      const lastIcon  = L.divIcon({ html: '<div style="width:12px;height:12px;background:#2563EB;border:2px solid #fff;border-radius:50%"></div>', className: '', iconAnchor: [6,6] })
      L.marker([points[0].lat, points[0].lng], { icon: startIcon }).addTo(map)
      L.marker(center, { icon: lastIcon }).addTo(map)
      if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs))
      leafRef.current = map
    }
    init()
    return () => { if (leafRef.current) { leafRef.current.remove(); leafRef.current = null } }
  }, [points, trajetId])

  if (points.length === 0) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderRadius: 12, border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`, flexDirection: 'column', gap: 6 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round"><path d="M5.07 4.93a10 10 0 000 14.14M19.07 4.93a10 10 0 010 14.14"/><path d="M7.9 7.9a6 6 0 000 8.2M16.1 7.9a6 6 0 010 8.2"/><circle cx="12" cy="12" r="2"/></svg>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>Pas de données GPS</span>
    </div>
  )
  return <div ref={mapRef} style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}` }} />
}

// ── Modal validation QR ───────────────────────────
function ModalQR({ onClose, onConfirm, loading, palette, isDark }) {
  const [code, setCode] = useState('')
  const canSubmit = code.replace(/\s/g, '').length === 6

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: 24, padding: '32px 28px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.25s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: palette.text, marginBottom: 6 }}>Valider l'arrivée</div>
          <div style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.6 }}>
            Saisissez le code affiché sur le téléphone du chauffeur
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
          style={{
            width: '100%', height: 76, boxSizing: 'border-box',
            background: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
            border: `2px solid ${canSubmit ? ORANGE : palette.cardBorder}`,
            borderRadius: 16, padding: '0 20px',
            fontSize: 40, fontWeight: 800, fontFamily: theme.font.mono,
            color: palette.text, outline: 'none', textAlign: 'center',
            letterSpacing: '0.25em', transition: 'border-color 0.15s',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ height: 48, borderRadius: 12, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Annuler
          </button>
          <button onClick={() => onConfirm(code)} disabled={!canSubmit || loading}
            style={{
              height: 48, borderRadius: 12, border: 'none',
              background: canSubmit && !loading ? ORANGE : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
              color: canSubmit && !loading ? '#fff' : palette.textMuted,
              fontSize: 14, fontWeight: 700, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {loading
              ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : 'Valider'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Onglet Trajets ────────────────────────────────
function TabTrajets({ palette, isDark }) {
  const queryClient                = useQueryClient()
  const [selected, setSelected]   = useState(null)
  const [filtre,   setFiltre]     = useState(null)
  const [modalQR,  setModalQR]    = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const { trajets, loading, stats } = useTrajets({ statut: filtre })

  const handleValiderQR = async (code) => {
    setQrLoading(true)
    try {
      await api.post('/trajets/valider-qr', { qr_code: code })
      toast.success('Arrivée validée avec succès !')
      queryClient.invalidateQueries({ queryKey: ['trajets'] })
      setModalQR(false)
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Code invalide')
    } finally {
      setQrLoading(false)
    }
  }

  const nbAttenteQR = trajets.filter(t => t.statut === 'arrive_attente').length

  return (
    <div>
      {/* Stats + bouton QR */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'stretch' }}>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { l: 'Total',    v: stats.total,   color: palette.text },
            { l: 'En route', v: stats.enCours, color: '#10B981' },
            { l: 'Alertes',  v: stats.alertes, color: stats.alertes > 0 ? '#EF4444' : '#10B981' },
          ].map(({ l, v, color }) => (
            <div key={l} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, padding: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: theme.font.mono }}>{v}</div>
              <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setModalQR(true)} style={{
          flexShrink: 0, width: 64, borderRadius: 12, border: 'none',
          background: nbAttenteQR > 0 ? '#D97706' : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
          color: nbAttenteQR > 0 ? '#fff' : palette.textMuted,
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          boxShadow: nbAttenteQR > 0 ? '0 4px 16px rgba(217,119,6,0.35)' : 'none',
          transition: 'all 0.2s', position: 'relative',
        }}>
          {nbAttenteQR > 0 && (
            <span style={{ position: 'absolute', top: 6, right: 6, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 5px', minWidth: 14, textAlign: 'center' }}>{nbAttenteQR}</span>
          )}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M18 14h.01M14 18h.01M18 18h.01M14 14v4h4v-4h-4z"/>
          </svg>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>QR</span>
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {[{ k: null, l: 'Tous' }, { k: 'en_cours', l: 'En cours' }, { k: 'arrive_attente', l: 'Attente QR' }, { k: 'alerte', l: 'Alertes' }, { k: 'arrive', l: 'Arrivés' }].map(({ k, l }) => (
          <button key={String(k)} onClick={() => setFiltre(k)}
            style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${filtre === k ? 'transparent' : palette.cardBorder}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: filtre === k ? (k === 'alerte' ? '#EF4444' : ORANGE) : palette.card, color: filtre === k ? '#fff' : palette.textSub, transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 72, background: palette.card, borderRadius: 12, border: `1px solid ${palette.cardBorder}` }} />)}
        </div>
      ) : trajets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: palette.textMuted, fontSize: 13 }}>Aucun trajet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trajets.map(t => {
            const sc = STATUT_CFG[t.statut] ?? STATUT_CFG.arrive
            const isOpen = selected === t.id
            return (
              <div key={t.id} style={{ background: palette.card, border: `1px solid ${t.statut === 'alerte' ? '#EF4444' + '40' : palette.cardBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                <div onClick={() => setSelected(isOpen ? null : t.id)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: t.statut === 'alerte' ? 'rgba(239,68,68,0.15)' : t.statut === 'en_cours' ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {t.statut === 'en_cours'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'#10B981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        : t.statut === 'alerte'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'#EF4444'} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={'#38BDF8'} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{t.chauffeur_nom} · {t.citerne_code}</div>
                      <div style={{ fontSize: 11, color: palette.textSub }}>{formatRelative(t.started_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{sc.label}</span>
                    {t.ecart != null && <span style={{ fontSize: 11, fontWeight: 700, color: t.ecart > (t.seuil_fraude ?? 50) ? '#EF4444' : '#10B981', fontFamily: theme.font.mono }}>{t.ecart > 0 ? '+' : ''}{parseFloat(t.ecart).toFixed(1)}L</span>}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${palette.cardBorder}`, padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                      {[
                        { l: 'Chargement', v: `${t.qty_depart} L` },
                        { l: 'Livraison',  v: t.qty_arrivee ? `${t.qty_arrivee} L` : '—' },
                        { l: 'Écart',      v: t.ecart != null ? `${t.ecart > 0 ? '+' : ''}${parseFloat(t.ecart).toFixed(1)} L` : '—' },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: 8, padding: '8px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{v}</div>
                          <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <MiniMap trajetId={t.id} isDark={isDark} />
                    {/* Bouton valider QR si en attente */}
                    {t.statut === 'arrive_attente' && (
                      <button onClick={() => setModalQR(true)}
                        style={{
                          marginTop: 10, width: '100%', height: 42, borderRadius: 10, border: 'none',
                          background: '#D97706', color: '#fff', fontSize: 13, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        Saisir le code de validation
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal QR */}
      {modalQR && (
        <ModalQR
          onClose={() => setModalQR(false)}
          onConfirm={handleValiderQR}
          loading={qrLoading}
          palette={palette} isDark={isDark}
        />
      )}
    </div>
  )
}

// ── Onglet Citernes ───────────────────────────────
function TabCiternes({ palette, isDark }) {
  const queryClient = useQueryClient()
  const { data: citernesData, isLoading } = useCiternes()
  const citernes   = citernesData?.citernes ?? []

  const [chauffeurs,   setChauffeurs]   = useState([])
  const [form,         setForm]         = useState({ code: '', capacite: '', chauffeur_id: '' })
  const [errors,       setErrors]       = useState({})

  useEffect(() => {
    api.get('/employes').then(r => {
      setChauffeurs((r.data.employes ?? []).filter(e => e.role === 'chauffeur' && e.actif !== false))
    }).catch(() => {})
  }, [])

  const { mutateAsync: ajouter, isPending: ajoutLoading } = useMutation({
    mutationFn: (payload) => api.post('/citernes', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Citerne ajoutée')
      setForm({ code: '', capacite: '', chauffeur_id: '' })
      queryClient.invalidateQueries({ queryKey: ['citernes'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })

  const { mutateAsync: supprimer } = useMutation({
    mutationFn: (id) => api.delete(`/citernes/${id}`).then(r => r.data),
    onSuccess: () => { toast.success('Citerne supprimée'); queryClient.invalidateQueries({ queryKey: ['citernes'] }) },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })

  const handleAjouter = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.code.trim()) errs.code = 'Obligatoire'
    if (!form.capacite || parseFloat(form.capacite) <= 0) errs.capacite = 'Invalide'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    await ajouter({ code: form.code.trim().toUpperCase(), capacite: parseFloat(form.capacite), chauffeur_id: form.chauffeur_id ? parseInt(form.chauffeur_id) : null })
  }

  const inputSt = (err) => ({ width: '100%', height: 44, background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', border: `1.5px solid ${err ? '#EF4444' : palette.cardBorder}`, borderRadius: 10, padding: '0 12px', fontSize: 14, color: palette.text, fontFamily: theme.font.family, outline: 'none' })

  return (
    <div>
      {/* Liste */}
      {isLoading ? (
        <div style={{ height: 60, background: palette.card, borderRadius: 12, marginBottom: 16 }} />
      ) : citernes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: palette.textMuted, fontSize: 13, marginBottom: 16 }}>Aucune citerne enregistrée</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {citernes.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.textSub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: palette.textSub }}>{c.capacite.toLocaleString('fr-FR')} L · {c.chauffeur_nom ?? 'Aucun chauffeur'}</div>
                </div>
              </div>
              <button onClick={() => supprimer(c.id)}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textMuted, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#EF4444' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = palette.textMuted }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: '16px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Ajouter une citerne</div>
        <form onSubmit={handleAjouter}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Code</div>
              <input value={form.code} onChange={e => { setForm(p => ({ ...p, code: e.target.value })); setErrors(p => ({ ...p, code: '' })) }} placeholder="ex: C001" style={inputSt(errors.code)} />
              {errors.code && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>{errors.code}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Capacité (L)</div>
              <input type="number" value={form.capacite} onChange={e => { setForm(p => ({ ...p, capacite: e.target.value })); setErrors(p => ({ ...p, capacite: '' })) }} placeholder="ex: 15000" style={inputSt(errors.capacite)} />
              {errors.capacite && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>{errors.capacite}</div>}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Chauffeur assigné</div>
            <select value={form.chauffeur_id} onChange={e => setForm(p => ({ ...p, chauffeur_id: e.target.value }))} style={{ ...inputSt(false), appearance: 'none', cursor: 'pointer', color: form.chauffeur_id ? palette.text : palette.textMuted }}>
              <option value="">Aucun</option>
              {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <button type="submit" disabled={ajoutLoading}
            style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', background: ajoutLoading ? '#B45309' : ORANGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {ajoutLoading ? '...' : '+ Ajouter la citerne'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Onglet Alertes transport ──────────────────────
function TabAlertes({ palette }) {
  const { data, isLoading } = useQuery({
    queryKey: ['alertes-transport'],
    queryFn:  () => api.get('/alertes/transport').then(r => r.data),
    staleTime: 30_000, refetchInterval: 60_000,
  })
  const queryClient = useQueryClient()
  const alertes  = data?.alertes  ?? []
  const nonLues  = data?.non_lues ?? 0

  const marquerLue = async (id) => {
    await api.put(`/alertes/${id}/lire`)
    queryClient.invalidateQueries({ queryKey: ['alertes-transport'] })
  }

  const CFG = {
    FRAUDE_CITERNE: { type: 'truck',  label: 'Fraude citerne', color: '#EF4444' },
    ARRET_SUSPECT:  { type: 'pause',  label: 'Arrêt suspect',  color: '#D97706' },
  }
  const renderCfgIcon = (cfgType, color) => {
    if (cfgType === 'truck') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    if (cfgType === 'pause') return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: palette.textSub }}>
          {alertes.length} alerte{alertes.length > 1 ? 's' : ''}{nonLues > 0 ? ` · ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : ''}
        </span>
        {nonLues > 0 && (
          <button onClick={async () => { await api.put('/alertes/toutes/lire'); queryClient.invalidateQueries({ queryKey: ['alertes-transport'] }) }}
            style={{ fontSize: 11, color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ height: 80, background: palette.card, borderRadius: 12 }} />
      ) : alertes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: palette.textMuted, fontSize: 13 }}>Aucune alerte transport</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alertes.map(a => {
            const cfg = CFG[a.type] ?? { type: 'warning', label: a.type, color: ORANGE }
            return (
              <div key={a.id} style={{ background: a.lu ? palette.card : `${cfg.color}10`, border: `1px solid ${a.lu ? palette.cardBorder : cfg.color + '30'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{renderCfgIcon(cfg.type, a.lu ? palette.textMuted : cfg.color)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
                    {!a.lu && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: a.lu ? palette.textSub : palette.text, fontWeight: a.lu ? 400 : 600 }}>{a.message}</div>
                  <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 3 }}>{formatRelative(a.created_at)}</div>
                </div>
                {!a.lu && (
                  <button onClick={() => marquerLue(a.id)} style={{ fontSize: 10, color: cfg.color, background: 'none', border: `1px solid ${cfg.color}40`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Lu</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Onglet Chauffeurs ─────────────────────────────
function TabChauffeurs({ palette, isDark }) {
  const [chauffeurs, setChauffeurs] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [toDelete,   setToDelete]   = useState(null)
  const [creating,   setCreating]   = useState(false)
  const [showPwd,    setShowPwd]    = useState(false)
  const [form,       setForm]       = useState({ nom: '', email: '', password: '' })
  const [errors,     setErrors]     = useState({})

  const loadChauffeurs = async () => {
    try {
      setLoading(true)
      const r = await api.get('/employes')
      setChauffeurs(r.data.employes ?? [])
    } catch { toast.error('Erreur chargement chauffeurs') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadChauffeurs() }, [])

  const validate = () => {
    const e = {}
    if (!form.nom.trim())               e.nom      = 'Obligatoire'
    if (!form.email.includes('@'))       e.email    = 'Email invalide'
    if (form.password.length < 6)        e.password = 'Minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    try {
      setCreating(true)
      await api.post('/employes', { ...form, role: 'chauffeur' })
      toast.success(`Chauffeur ${form.nom} créé`)
      setForm({ nom: '', email: '', password: '' })
      setShowForm(false)
      loadChauffeurs()
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la création')
    } finally { setCreating(false) }
  }

  const handleToggle = async (id, nomChauffeur) => {
    try {
      const r = await api.put(`/employes/${id}/toggle`)
      toast.success(r.data.message)
      loadChauffeurs()
    } catch (err) { toast.error(err.response?.data?.error ?? 'Erreur') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/employes/${id}`)
      toast.success('Chauffeur supprimé')
      setToDelete(null)
      loadChauffeurs()
    } catch (err) { toast.error(err.response?.data?.error ?? 'Erreur') }
  }

  const inputSt = (err) => ({
    width: '100%', height: 46, boxSizing: 'border-box',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
    border: `1.5px solid ${err ? '#EF4444' : palette.cardBorder}`,
    borderRadius: 12, padding: '0 14px',
    fontSize: 14, color: palette.text,
    fontFamily: theme.font.family, outline: 'none',
    transition: 'all 0.15s',
  })

  return (
    <div>
      {/* Modal suppression */}
      {toDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 20, padding: '28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={'#EF4444'} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: palette.text, textAlign: 'center', marginBottom: 8 }}>Supprimer {toDelete.nom} ?</div>
            <div style={{ fontSize: 12, color: palette.textSub, textAlign: 'center', marginBottom: 22, lineHeight: 1.6 }}>Cette action est irréversible.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => setToDelete(null)} style={{ padding: '11px', borderRadius: 12, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13 }}>Annuler</button>
              <button onClick={() => handleDelete(toDelete.id)} style={{ padding: '11px', borderRadius: 12, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13, fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>Mes chauffeurs</div>
          <div style={{ fontSize: 12, color: palette.textSub, marginTop: 2 }}>{chauffeurs.length} chauffeur{chauffeurs.length > 1 ? 's' : ''} créé{chauffeurs.length > 1 ? 's' : ''}</div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: theme.font.family }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Ajouter
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: '18px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Nouveau chauffeur</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Nom complet</div>
                <input value={form.nom} onChange={e => { setForm(p => ({ ...p, nom: e.target.value })); setErrors(p => ({ ...p, nom: '' })) }} placeholder="Mamadou Bah" style={inputSt(errors.nom)} />
                {errors.nom && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>{errors.nom}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Email</div>
                <input type="email" value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })) }} placeholder="chauffeur@mastation.com" style={inputSt(errors.email)} />
                {errors.email && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>{errors.email}</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Mot de passe</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })) }} placeholder="Minimum 6 caractères" style={{ ...inputSt(errors.password), paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 3 }}>{errors.password}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creating}
                style={{ flex: 1, height: 44, borderRadius: 10, border: 'none', background: creating ? '#B45309' : ORANGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {creating && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {creating ? 'Création...' : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => { setForm({ nom: '', email: '', password: '' }); setErrors({}); setShowForm(false) }}
                style={{ padding: '0 16px', height: 44, borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, fontSize: 12, cursor: 'pointer', fontFamily: theme.font.family }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste chauffeurs */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2].map(i => <div key={i} style={{ height: 64, background: palette.card, borderRadius: 12, border: `1px solid ${palette.cardBorder}` }} />)}
        </div>
      ) : chauffeurs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: palette.textMuted }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: palette.textSub, marginBottom: 6 }}>Aucun chauffeur</div>
          <div style={{ fontSize: 12 }}>Ajoutez des chauffeurs pour gérer vos trajets.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chauffeurs.map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: palette.card,
              border: `1px solid ${c.actif === false ? 'rgba(239,68,68,0.15)' : palette.cardBorder}`,
              borderRadius: 12, gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: ORANGE, flexShrink: 0 }}>
                  {c.nom?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nom}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.actif !== false ? '#10B981' : '#EF4444', background: c.actif !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', padding: '1px 7px', borderRadius: 99 }}>
                      {c.actif !== false ? 'Actif' : 'Désactivé'}
                    </span>
                    <span style={{ fontSize: 10, color: palette.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleToggle(c.id, c.nom)} title={c.actif !== false ? 'Désactiver' : 'Activer'}
                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.actif !== false ? ORANGE : '#10B981', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={c.actif !== false ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                  </svg>
                </button>
                <button onClick={() => setToDelete(c)} title="Supprimer"
                  style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Onglet Performances (chauffeurs) ─────────────
const NIVEAUX_LOG = [
  { min: 95, label: 'Exemplaire', color: '#7C3AED', bg: '#EDE9FE', stars: 5 },
  { min: 80, label: 'Excellent',  color: '#059669', bg: '#D1FAE5', stars: 4 },
  { min: 60, label: 'Très bien',  color: '#2563EB', bg: '#DBEAFE', stars: 3 },
  { min: 40, label: 'Bon',        color: '#D97706', bg: '#FEF3C7', stars: 2 },
  { min: 0,  label: 'Débutant',   color: '#6B7280', bg: '#F3F4F6', stars: 1 },
]
const getNiveauLog = (score) => NIVEAUX_LOG.find(n => (score ?? -1) >= n.min) ?? NIVEAUX_LOG[NIVEAUX_LOG.length - 1]
const fmtLog = (n) => (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

function TabPerformances({ palette, isDark }) {
  const now   = new Date()
  const [mois,  setMois]  = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const { data, isLoading } = usePerformances({ mois, annee })
  const { mutateAsync: valider, isPending } = useValiderPrime()
  const performances = data?.performances ?? []

  const MOIS_S = ['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

  return (
    <div>
      {/* Sélecteur mois */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, overflowX: 'auto' }}>
        {[...Array(12)].map((_, i) => {
          const m = i + 1
          return (
            <button key={m} onClick={() => setMois(m)} style={{
              padding: '4px 9px', borderRadius: 99, border: `1px solid ${mois === m ? 'transparent' : palette.cardBorder}`,
              background: mois === m ? ORANGE : palette.card,
              color: mois === m ? '#fff' : palette.textSub,
              fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{MOIS_S[m]}</button>
          )
        })}
        <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
          style={{ height: 28, padding: '0 8px', background: palette.inputBg, border: `1px solid ${palette.cardBorder}`, borderRadius: 8, color: palette.text, fontSize: 11, fontFamily: 'inherit', outline: 'none', flexShrink: 0 }}>
          {[now.getFullYear(), now.getFullYear()-1].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ height: 80, background: palette.card, borderRadius: 12 }} />
      ) : performances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: palette.textMuted, fontSize: 13 }}>
          Aucune donnée — les performances sont calculées fin de mois
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {performances.map(p => {
            const niv    = getNiveauLog(p.score)
            const enAtt  = p.prime_proposee && p.prime_validee === null
            return (
              <div key={p.id} style={{
                background: palette.card,
                border: `1px solid ${enAtt ? '#D9770650' : palette.cardBorder}`,
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: p.score != null ? 10 : 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${niv.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: niv.color, flexShrink: 0 }}>
                    {p.nom?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{p.nom}</div>
                    <div style={{ fontSize: 10, color: palette.textSub }}>Chauffeur</div>
                  </div>
                  {p.score != null && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: niv.color, background: niv.bg, padding: '3px 9px', borderRadius: 99 }}>{niv.label}</span>
                  )}
                </div>

                {p.score != null && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: palette.textSub }}>
                        {p.nb_trajets ?? 0} trajets · {p.nb_fraudes ?? 0} fraudes · {p.nb_alertes ?? 0} arrêts
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: niv.color, fontFamily: theme.font.mono }}>{p.score}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${p.score}%`, background: niv.color, borderRadius: 99 }} />
                    </div>

                    {p.prime_proposee && (
                      <div style={{
                        padding: '10px 12px', borderRadius: 10,
                        background: p.prime_validee === true ? 'rgba(16,185,129,0.15)' : p.prime_validee === false ? 'rgba(239,68,68,0.15)' : '#FEF3C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}>
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: p.prime_validee === true ? '#10B981' : p.prime_validee === false ? '#EF4444' : '#D97706', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {p.prime_validee === true ? 'Prime validée' : p.prime_validee === false ? 'Prime refusée' : 'Prime proposée'}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono }}>{fmtLog(p.prime_montant)} GNF</div>
                        </div>
                        {enAtt && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => valider({ userId: p.id, mois, annee, action: 'valider' })} disabled={isPending}
                              style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✓
                            </button>
                            <button onClick={() => valider({ userId: p.id, mois, annee, action: 'refuser' })} disabled={isPending}
                              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${'#EF4444'}`, background: 'transparent', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                              ✗
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Onglet Rapports ───────────────────────────────
function TabRapports({ palette}) {
  const { trajets, loading, stats } = useTrajets({})
  const { data: employesData } = useQuery({
    queryKey: ['employes', 'chauffeurs-export'],
    queryFn:  () => api.get('/employes').then(r => r.data),
    staleTime: 60_000,
  })
  const [exporting, setExporting]   = useState(false)

  const chauffeurs = (employesData?.employes ?? []).filter(e => e.role === 'chauffeur')
  const termines = trajets.filter(t => t.statut !== 'en_cours')
  const totalEcart = termines.reduce((s, t) => s + (parseFloat(t.ecart) || 0), 0)
  const nbFraudes  = trajets.filter(t => t.statut === 'alerte').length

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const logoUrl = await api.get('/station').then(r => r.data.station?.logo_url ?? null).catch(() => null)
      await exportTrajetsExcel(trajets, stats, { chauffeurs, logoUrl })
      toast.success('Export Excel téléchargé')
    } catch { toast.error('Erreur lors de l\'export') }
    finally { setExporting(false) }
  }

  return (
    <div>
      {/* Stats résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Total trajets',   v: String(stats.total),           color: palette.text },
          { l: 'Trajets terminés',v: String(termines.length),       color: '#38BDF8' },
          { l: 'Alertes fraude',  v: String(nbFraudes),             color: nbFraudes > 0 ? '#EF4444' : '#10B981' },
          { l: 'Écart total',     v: `${totalEcart > 0 ? '+' : ''}${totalEcart.toFixed(1)} L`, color: totalEcart > 0 ? '#EF4444' : '#10B981' },
        ].map(({ l, v, color }) => (
          <div key={l} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: theme.font.mono }}>{v}</div>
            <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Export */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 6 }}>Export des données</div>
        <div style={{ fontSize: 12, color: palette.textSub, marginBottom: 14 }}>
          Téléchargez l'historique complet des trajets au format Excel/CSV.
        </div>
        <button onClick={handleExportExcel} disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: exporting ? '#B45309' : ORANGE, color: '#fff', fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {exporting
            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <span>📊</span>
          }
          {exporting ? 'Export...' : 'Exporter en Excel'}
        </button>
      </div>

      {/* Tableau récapitulatif */}
      {loading ? null : termines.length > 0 && (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${palette.cardBorder}`, fontSize: 12, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Derniers trajets terminés
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                  {['Chauffeur','Citerne','Départ','Arrivée','Écart','Statut'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: palette.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {termines.slice(0, 10).map(t => {
                  const sc = STATUT_CFG[t.statut] ?? STATUT_CFG.arrive
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                      <td style={{ padding: '9px 12px', color: palette.text, fontWeight: 500 }}>{t.chauffeur_nom}</td>
                      <td style={{ padding: '9px 12px', color: palette.text, fontFamily: theme.font.mono }}>{t.citerne_code}</td>
                      <td style={{ padding: '9px 12px', color: palette.text, fontFamily: theme.font.mono }}>{t.qty_depart} L</td>
                      <td style={{ padding: '9px 12px', color: palette.text, fontFamily: theme.font.mono }}>{t.qty_arrivee ?? '—'}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, fontFamily: theme.font.mono, color: t.ecart > (t.seuil_fraude ?? 50) ? '#EF4444' : '#10B981' }}>
                        {t.ecart != null ? `${t.ecart > 0 ? '+' : ''}${parseFloat(t.ecart).toFixed(1)} L` : '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase' }}>{sc.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale — identité Fleet Operations Center ─
function LogistiquePageContent() {
  const { user, logout }  = useAuth()
  const { parametres }    = useParametres()
  const [onglet, setOnglet] = useState('gps')

  const [nightMode, setNightMode] = useState(() => {
    try { return localStorage.getItem('fuelo-map-mode') !== 'day' } catch { return true }
  })
  const toggleNightMode = useCallback(() => {
    setNightMode(m => {
      const next = !m
      try { localStorage.setItem('fuelo-map-mode', next ? 'night' : 'day') } catch {}
      return next
    })
  }, [])

  // Palette et mode fixés — dark always, orange primary (Fleet Ops ≠ gérant)
  const palette = LOG_PALETTE
  const isDark  = true

  const { data: alertesData } = useQuery({
    queryKey: ['alertes-transport'],
    queryFn:  () => api.get('/alertes/transport').then(r => r.data),
    staleTime: 30_000, refetchInterval: 60_000,
  })
  const { trajets } = useTrajets({})
  const nbAlertes   = alertesData?.non_lues ?? 0
  const nbEnRoute   = trajets.filter(t => t.statut === 'en_cours').length
  const nbAttente   = trajets.filter(t => t.statut === 'arrive_attente').length

  // Palette fixe dark charcoal — identité transport distincte du gérant
  const SHELL_BG      = isDark ? '#0C0F1A' : '#F4F6FB'
  const HEADER_BG     = 'linear-gradient(135deg, #0B1120 0%, #131C2E 100%)'
  const TABBAR_BG     = isDark ? '#111827' : '#FFFFFF'
  const TABBAR_BORDER = isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.2)'

  return (
    <div style={{ height: '100dvh', background: SHELL_BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header Fleet Operations ─────────────────── */}
      <div style={{ background: HEADER_BG, position: 'sticky', top: 0, zIndex: 20, borderBottom: `2px solid ${ORANGE}30`, boxShadow: `0 2px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.08)` }}>

        {/* Bande orange fine en haut */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${ORANGE}, #FCD34D, ${ORANGE})`, backgroundSize: '200% 100%', animation: 'shimmerBar 3s linear infinite' }} />

        <div style={{ padding: '10px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Logo + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {parametres?.logo_url ? (
              <img src={parametres.logo_url} alt="logo" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: `1px solid ${ORANGE}40` }} />
            ) : (
              <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${ORANGE}, #D97706)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${ORANGE}50` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {parametres?.nom ?? <span style={{ color: '#fff' }}>Fuelo</span>}
              </div>
              <div style={{ fontSize: 10, color: ORANGE, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Fleet Operations</div>
            </div>
          </div>

          {/* KPIs live inline */}
          <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
            {[
              { v: nbEnRoute,  label: 'en route', color: '#10B981', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="10" strokeOpacity=".3"/></svg> },
              { v: nbAttente,  label: 'attente QR', color: ORANGE, icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
              { v: nbAlertes,  label: 'alertes', color: '#EF4444', icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> },
            ].map(({ v, label, color, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: theme.font.mono, lineHeight: 1 }}>{v}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Actions droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={toggleNightMode} title={nightMode ? 'Mode jour' : 'Mode nuit'} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: nightMode ? ORANGE : 'rgba(255,255,255,0.5)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {nightMode ? <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/> : <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>}
              </svg>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: `1px solid ${ORANGE}25` }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${ORANGE}25`, border: `1px solid ${ORANGE}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ORANGE }}>
                {(user?.nom || 'L').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{user?.nom}</span>
            </div>

            <button onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(239,68,68,0.8)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 10px', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'rgba(239,68,68,0.8)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              <span style={{ display: 'none' }} className="log-label">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Barre de tabs — style pill orange ────────── */}
      <div style={{ background: TABBAR_BG, borderBottom: `1px solid ${TABBAR_BORDER}`, padding: '6px 12px', display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = onglet === tab.key
          return (
            <button key={tab.key} onClick={() => setOnglet(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap', position: 'relative',
                transition: 'all 0.15s',
                background: isActive
                  ? `linear-gradient(135deg, ${ORANGE}22, ${ORANGE}14)`
                  : 'transparent',
                boxShadow: isActive ? `inset 0 0 0 1px ${ORANGE}50` : 'none',
              }}>
              <span style={{ color: isActive ? ORANGE : palette.textMuted, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <TabIcon tabKey={tab.key} size={14} color={isActive ? ORANGE : palette.textMuted} />
              </span>
              <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? ORANGE : palette.textMuted }}>
                {tab.label}
              </span>
              {tab.key === 'alertes' && nbAlertes > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 5px', minWidth: 14, textAlign: 'center', lineHeight: 1.6 }}>{nbAlertes}</span>
              )}
              {tab.key === 'trajets' && nbAttente > 0 && (
                <span style={{ background: ORANGE, color: '#000', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 5px', minWidth: 14, textAlign: 'center', lineHeight: 1.6 }}>{nbAttente}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Contenu — GPS plein écran, autres en colonne ─ */}
      {onglet === 'gps' ? (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'#94A3B8' }}>
              <div style={{ width:32, height:32, border:`3px solid ${ORANGE}30`, borderTopColor:ORANGE, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
              <span style={{ fontSize:13 }}>Chargement GPS...</span>
            </div>
          }>
            <GpsFlottePage nightMode={nightMode} onToggleNight={toggleNightMode} />
          </Suspense>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', maxWidth: 640, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {onglet === 'trajets'       && <TabTrajets      palette={palette} isDark={isDark} />}
          {onglet === 'citernes'      && <TabCiternes     palette={palette} isDark={isDark} />}
          {onglet === 'chauffeurs'    && <TabChauffeurs   palette={palette} isDark={isDark} />}
          {onglet === 'alertes'       && <TabAlertes      palette={palette} />}
          {onglet === 'performances'  && <TabPerformances palette={palette} isDark={isDark} />}
          {onglet === 'rapports'      && <TabRapports     palette={palette} isDark={isDark} />}
        </div>
      )}

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes slideUp    { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmerBar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        select { appearance: none; }
      `}</style>
    </div>
  )
}

export default function LogistiquePage() {
  return (
    <PlanGatePage feature="logistique">
      <LogistiquePageContent />
    </PlanGatePage>
  )
}
