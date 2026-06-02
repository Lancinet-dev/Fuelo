// ================================================
// FUELO — Interface logisticien
// ================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth }    from '../../context/AuthContext'
import { useTheme }   from '../../context/ThemeContext'
import { useTrajets, useGpsPoints, useCiternes } from '../../hooks/useTrajets'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api            from '../../services/api'
import toast          from 'react-hot-toast'
import { formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const ORANGE = '#F59E0B'
const TABS   = [
  { key: 'trajets',  label: 'Trajets',  icon: '🗺️' },
  { key: 'citernes', label: 'Citernes', icon: '🚛' },
  { key: 'alertes',  label: 'Alertes',  icon: '🚨' },
  { key: 'rapports', label: 'Rapports', icon: '📊' },
]

const STATUT_CFG = {
  en_cours: { label: 'En cours',      color: theme.colors.success, bg: theme.colors.successLight },
  alerte:   { label: 'Fraude',        color: theme.colors.danger,  bg: theme.colors.dangerLight  },
  arrive:   { label: 'Arrivé',        color: theme.colors.info,    bg: theme.colors.infoLight    },
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
      L.polyline(latlngs, { color: theme.colors.primary, weight: 4, opacity: 0.8 }).addTo(map)
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
      <span style={{ fontSize: 24 }}>📡</span>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>Pas de données GPS</span>
    </div>
  )
  return <div ref={mapRef} style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}` }} />
}

// ── Onglet Trajets ────────────────────────────────
function TabTrajets({ palette, isDark }) {
  const [selected, setSelected]   = useState(null)
  const [filtre,   setFiltre]     = useState(null)
  const { trajets, loading, stats } = useTrajets({ statut: filtre })

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Total',    v: stats.total,   color: palette.text },
          { l: 'En route', v: stats.enCours, color: theme.colors.success },
          { l: 'Alertes',  v: stats.alertes, color: stats.alertes > 0 ? theme.colors.danger : theme.colors.success },
        ].map(({ l, v, color }) => (
          <div key={l} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, padding: '12px', textAlign: 'center', boxShadow: theme.shadow.sm }}>
            <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: theme.font.mono }}>{v}</div>
            <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {[{ k: null, l: 'Tous' }, { k: 'en_cours', l: 'En cours' }, { k: 'alerte', l: 'Alertes' }, { k: 'arrive', l: 'Arrivés' }].map(({ k, l }) => (
          <button key={String(k)} onClick={() => setFiltre(k)}
            style={{ padding: '5px 14px', borderRadius: 99, border: `1px solid ${filtre === k ? 'transparent' : palette.cardBorder}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: filtre === k ? (k === 'alerte' ? theme.colors.danger : theme.colors.primary) : palette.card, color: filtre === k ? '#fff' : palette.textSub, transition: 'all 0.15s' }}>
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
              <div key={t.id} style={{ background: palette.card, border: `1px solid ${t.statut === 'alerte' ? theme.colors.danger + '40' : palette.cardBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
                <div onClick={() => setSelected(isOpen ? null : t.id)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{t.statut === 'en_cours' ? '🚚' : t.statut === 'alerte' ? '🚨' : '✅'}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: palette.text }}>{t.chauffeur_nom} · {t.citerne_code}</div>
                      <div style={{ fontSize: 11, color: palette.textSub }}>{formatRelative(t.started_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>{sc.label}</span>
                    {t.ecart != null && <span style={{ fontSize: 11, fontWeight: 700, color: t.ecart > (t.seuil_fraude ?? 50) ? theme.colors.danger : theme.colors.success, fontFamily: theme.font.mono }}>{t.ecart > 0 ? '+' : ''}{parseFloat(t.ecart).toFixed(1)}L</span>}
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
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

  const inputSt = (err) => ({ width: '100%', height: 44, background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', border: `1.5px solid ${err ? theme.colors.danger : palette.cardBorder}`, borderRadius: 10, padding: '0 12px', fontSize: 14, color: palette.text, fontFamily: theme.font.family, outline: 'none' })

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
                <span style={{ fontSize: 22 }}>🚛</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: palette.textSub }}>{c.capacite.toLocaleString('fr-FR')} L · {c.chauffeur_nom ?? 'Aucun chauffeur'}</div>
                </div>
              </div>
              <button onClick={() => supprimer(c.id)}
                style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textMuted, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = theme.colors.dangerLight; e.currentTarget.style.color = theme.colors.danger }}
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
              {errors.code && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 3 }}>{errors.code}</div>}
            </div>
            <div>
              <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5 }}>Capacité (L)</div>
              <input type="number" value={form.capacite} onChange={e => { setForm(p => ({ ...p, capacite: e.target.value })); setErrors(p => ({ ...p, capacite: '' })) }} placeholder="ex: 15000" style={inputSt(errors.capacite)} />
              {errors.capacite && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 3 }}>{errors.capacite}</div>}
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
            style={{ width: '100%', height: 44, borderRadius: 10, border: 'none', background: ajoutLoading ? theme.colors.primaryDark : theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
    FRAUDE_CITERNE: { icon: '🚛', label: 'Fraude citerne', color: theme.colors.danger },
    ARRET_SUSPECT:  { icon: '⏸️', label: 'Arrêt suspect',  color: '#D97706' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: palette.textSub }}>
          {alertes.length} alerte{alertes.length > 1 ? 's' : ''}{nonLues > 0 ? ` · ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : ''}
        </span>
        {nonLues > 0 && (
          <button onClick={async () => { await api.put('/alertes/toutes/lire'); queryClient.invalidateQueries({ queryKey: ['alertes-transport'] }) }}
            style={{ fontSize: 11, color: theme.colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
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
            const cfg = CFG[a.type] ?? { icon: '⚠️', label: a.type, color: theme.colors.warning }
            return (
              <div key={a.id} style={{ background: a.lu ? palette.card : `${cfg.color}10`, border: `1px solid ${a.lu ? palette.cardBorder : cfg.color + '30'}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{cfg.icon}</span>
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

// ── Onglet Rapports ───────────────────────────────
function TabRapports({ palette}) {
  const { trajets, loading, stats } = useTrajets({})
  const [exporting, setExporting]   = useState(false)

  const termines = trajets.filter(t => t.statut !== 'en_cours')
  const totalEcart = termines.reduce((s, t) => s + (parseFloat(t.ecart) || 0), 0)
  const nbFraudes  = trajets.filter(t => t.statut === 'alerte').length

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem('fuelo_token')
      const base  = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'
      const res   = await fetch(`${base}/trajets/export/csv`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Erreur export')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'trajets_fuelo.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Export CSV téléchargé')
    } catch { toast.error('Erreur lors de l\'export') }
    finally { setExporting(false) }
  }

  return (
    <div>
      {/* Stats résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Total trajets',   v: String(stats.total),           color: palette.text },
          { l: 'Trajets terminés',v: String(termines.length),       color: theme.colors.info },
          { l: 'Alertes fraude',  v: String(nbFraudes),             color: nbFraudes > 0 ? theme.colors.danger : theme.colors.success },
          { l: 'Écart total',     v: `${totalEcart > 0 ? '+' : ''}${totalEcart.toFixed(1)} L`, color: totalEcart > 0 ? theme.colors.danger : theme.colors.success },
        ].map(({ l, v, color }) => (
          <div key={l} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', boxShadow: theme.shadow.sm }}>
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
        <button onClick={handleExportCSV} disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: exporting ? theme.colors.primaryDark : theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {exporting
            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <span>📥</span>
          }
          {exporting ? 'Export...' : 'Exporter en CSV (Excel)'}
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
                      <td style={{ padding: '9px 12px', fontWeight: 700, fontFamily: theme.font.mono, color: t.ecart > (t.seuil_fraude ?? 50) ? theme.colors.danger : theme.colors.success }}>
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

// ── Page principale ────────────────────────────────
export default function LogistiquePage() {
  const { user, logout }            = useAuth()
  const { isDark, toggle, palette } = useTheme()
  const [onglet, setOnglet]         = useState('trajets')

  const { data: alertesData } = useQuery({
    queryKey: ['alertes-transport'],
    queryFn:  () => api.get('/alertes/transport').then(r => r.data),
    staleTime: 30_000, refetchInterval: 60_000,
  })
  const nbAlertes = alertesData?.non_lues ?? 0

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.25)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16 }}>🚛</span>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>fuel<span style={{ color: ORANGE }}>o</span></span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>Logistique</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
            </svg>
          </button>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{user?.nom}</span>
          <button onClick={logout} style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Quitter</button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{ background: isDark ? '#0F1E30' : '#fff', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setOnglet(tab.key)}
            style={{ flex: 1, minWidth: 80, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'relative', transition: 'all 0.15s', borderBottom: `2px solid ${onglet === tab.key ? theme.colors.primary : 'transparent'}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.key === 'alertes' && nbAlertes > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -8, background: theme.colors.danger, color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 99, padding: '1px 4px', minWidth: 14, textAlign: 'center' }}>{nbAlertes}</span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: onglet === tab.key ? 700 : 400, color: onglet === tab.key ? theme.colors.primary : palette.textMuted, whiteSpace: 'nowrap' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', maxWidth: 600, margin: '0 auto', width: '100%' }}>
        {onglet === 'trajets'  && <TabTrajets  palette={palette} isDark={isDark} />}
        {onglet === 'citernes' && <TabCiternes palette={palette} isDark={isDark} />}
        {onglet === 'alertes'  && <TabAlertes  palette={palette} />}
        {onglet === 'rapports' && <TabRapports palette={palette} isDark={isDark} />}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        select { appearance: none; }
      `}</style>
    </div>
  )
}
