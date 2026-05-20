// ================================================
// FUELO V2 — Stations
// Fichier : frontend/src/features/stations/Stations.jsx
// Vue multi-stations — propriétaire uniquement
// ================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStations } from '../../hooks/useStations'
import EmptyState      from '../../ui/EmptyState'
import { SkeletonStatCard, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

// ── Icônes ───────────────────────────────────────────
const ICONS = {
  plus:     'M12 5v14M5 12h14',
  station:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  switch:   'M8 7h12m0 0l-4-4m4 4l-4 4m0 9H4m0 0l4 4m-4-4l4-4',
  stock:    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  ventes:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10',
  alertes:  'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  check:    'M20 6L9 17l-5-5',
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
}

// ── Modal créer station ───────────────────────────────
function CreateModal({ onConfirm, onCancel, loading }) {
  const [form, setForm] = useState({
    nom:           '',
    adresse:       '',
    ville:         'Conakry',
    pays:          'Guinée',
    seuil_essence: 300,
    seuil_gasoil:  300,
  })
  const [errors, setErrors] = useState({})

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Le nom est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    onConfirm({
      ...form,
      seuil_essence: parseFloat(form.seuil_essence) || 300,
      seuil_gasoil:  parseFloat(form.seuil_gasoil)  || 300,
    })
  }

  const inputStyle = (hasError) => ({
    width:        '100%',
    height:       46,
    background:   '#F9FAFB',
    border:       `1.5px solid ${hasError ? theme.colors.danger : theme.colors.cardBorder}`,
    borderRadius: theme.radius.md,
    padding:      '0 14px',
    fontSize:     theme.font.size.base,
    color:        theme.colors.text,
    fontFamily:   theme.font.family,
    outline:      'none',
    transition:   theme.transition.fast,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 24 }}>
      <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.xl, padding: '28px 32px', maxWidth: 520, width: '100%', boxShadow: theme.shadow.lg }}>
        <h2 style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', marginBottom: 4 }}>
          Nouvelle station
        </h2>
        <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, marginBottom: 24 }}>
          Le stock sera initialisé à 0 litre automatiquement
        </p>

        <form onSubmit={handleSubmit}>

          {/* Nom */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Nom de la station *
            </div>
            <input
              type="text"
              placeholder="Ex: Station Almamya"
              value={form.nom}
              onChange={e => set('nom')(e.target.value)}
              onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
              onBlur={e  => { e.target.style.borderColor = errors.nom ? theme.colors.danger : theme.colors.cardBorder }}
              style={inputStyle(errors.nom)}
            />
            {errors.nom && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.nom}</div>}
          </div>

          {/* Adresse */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Adresse (optionnel)
            </div>
            <input
              type="text"
              placeholder="Ex: Rue KA-020, Kaloum"
              value={form.adresse}
              onChange={e => set('adresse')(e.target.value)}
              onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
              onBlur={e  => { e.target.style.borderColor = theme.colors.cardBorder }}
              style={inputStyle(false)}
            />
          </div>

          {/* Ville + Pays */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Ville</div>
              <input type="text" placeholder="Conakry" value={form.ville} onChange={e => set('ville')(e.target.value)} onFocus={e => { e.target.style.borderColor = theme.colors.primary }} onBlur={e => { e.target.style.borderColor = theme.colors.cardBorder }} style={inputStyle(false)} />
            </div>
            <div>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pays</div>
              <input type="text" placeholder="Guinée" value={form.pays} onChange={e => set('pays')(e.target.value)} onFocus={e => { e.target.style.borderColor = theme.colors.primary }} onBlur={e => { e.target.style.borderColor = theme.colors.cardBorder }} style={inputStyle(false)} />
            </div>
          </div>

          {/* Seuils alertes */}
          <div style={{ background: '#F9FAFB', border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '14px 16px', marginBottom: 22 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Seuils d'alerte (litres)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, marginBottom: 6 }}>⛽ Essence</div>
                <input type="number" min="50" step="50" value={form.seuil_essence} onChange={e => set('seuil_essence')(e.target.value)} onFocus={e => { e.target.style.borderColor = theme.colors.primary }} onBlur={e => { e.target.style.borderColor = theme.colors.cardBorder }} style={{ ...inputStyle(false), height: 40, fontFamily: theme.font.mono, fontWeight: theme.font.weight.bold }} />
              </div>
              <div>
                <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, marginBottom: 6 }}>🛢️ Gasoil</div>
                <input type="number" min="50" step="50" value={form.seuil_gasoil} onChange={e => set('seuil_gasoil')(e.target.value)} onFocus={e => { e.target.style.borderColor = theme.colors.primary }} onBlur={e => { e.target.style.borderColor = theme.colors.cardBorder }} style={{ ...inputStyle(false), height: 40, fontFamily: theme.font.mono, fontWeight: theme.font.weight.bold }} />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" onClick={onCancel}
              style={{ height: 48, background: 'transparent', border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.md, color: theme.colors.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: theme.font.size.md }}>
              Annuler
            </button>
            <button type="submit" disabled={loading}
              style={{ height: 48, background: loading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.md, color: '#0F172A', fontWeight: theme.font.weight.bold, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, fontSize: theme.font.size.md, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: theme.shadow.primary }}>
              {loading && <div style={{ width: 16, height: 16, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
              {loading ? 'Création...' : 'Créer la station'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Carte station ─────────────────────────────────────
function StationCard({ station, onSwitch, switching }) {
  const stEssence = getStockStatus(parseFloat(station.stock_essence), 300)
  const stGasoil  = getStockStatus(parseFloat(station.stock_gasoil),  300)
  const alertes   = parseInt(station.alertes_nb ?? 0)

  return (
    <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm, transition: theme.transition.fast }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = theme.shadow.md}
      onMouseLeave={e => e.currentTarget.style.boxShadow = theme.shadow.sm}
    >
      {/* Header carte */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${theme.colors.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: theme.radius.md, background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            ⛽
          </div>
          <div>
            <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: 4 }}>
              {station.nom}
            </div>
            {(station.ville || station.adresse) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: theme.font.size.xs, color: theme.colors.textSub }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.location} /></svg>
                {[station.adresse, station.ville, station.pays].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>

        {alertes > 0 && (
          <span style={{ background: theme.colors.dangerLight, color: theme.colors.danger, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, padding: '3px 10px', borderRadius: theme.radius.full, border: `1px solid ${theme.colors.danger}25`, whiteSpace: 'nowrap' }}>
            {alertes} alerte{alertes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Stocks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {[
          { label: 'Essence ⛽', qty: station.stock_essence, status: stEssence },
          { label: 'Gasoil 🛢️',  qty: station.stock_gasoil,  status: stGasoil  },
        ].map(({ label, qty, status }, i) => (
          <div key={label} style={{ padding: '14px 18px', borderRight: i === 0 ? `1px solid ${theme.colors.cardBorder}` : 'none', borderBottom: `1px solid ${theme.colors.cardBorder}` }}>
            <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: theme.font.weight.black, color: theme.colors.text, fontFamily: theme.font.mono, letterSpacing: '-0.5px', marginBottom: 4 }}>
              {parseFloat(qty).toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontWeight: 400, color: theme.colors.textMuted }}>L</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: theme.font.weight.bold, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: theme.radius.full, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {status.label}
            </span>
          </div>
        ))}
      </div>

      {/* Ventes jour */}
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${theme.colors.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub }}>Ventes aujourd'hui</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, fontFamily: theme.font.mono }}>
            {parseInt(station.nb_ventes ?? 0)} vente{parseInt(station.nb_ventes) > 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>
            {formatGNF(station.ventes_jour)}
          </span>
        </div>
      </div>

      {/* Bouton changer */}
      <div style={{ padding: '12px 18px' }}>
        <button
          onClick={() => onSwitch(station.id)}
          disabled={switching}
          style={{ width: '100%', height: 40, background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}30`, borderRadius: theme.radius.md, color: theme.colors.primary, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, cursor: switching ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: theme.transition.fast }}
          onMouseEnter={e => { if (!switching) { e.currentTarget.style.background = theme.colors.primary; e.currentTarget.style.color = '#0F172A' }}}
          onMouseLeave={e => { e.currentTarget.style.background = theme.colors.primaryLight; e.currentTarget.style.color = theme.colors.primary }}
        >
          {switching ? (
            <div style={{ width: 14, height: 14, border: `2px solid ${theme.colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.switch} /></svg>
          )}
          {switching ? 'Changement...' : 'Basculer sur cette station'}
        </button>
      </div>
    </div>
  )
}

// ── Stations ──────────────────────────────────────────
export default function Stations() {
  const navigate = useNavigate()
  const { stations, consolide, loading, createLoading, creerStation, switchStation } = useStations()

  const [showModal,    setShowModal]    = useState(false)
  const [switchingId,  setSwitchingId]  = useState(null)

  const handleCreate = async (data) => {
    await creerStation(data)
    setShowModal(false)
  }

  const handleSwitch = async (stationId) => {
    setSwitchingId(stationId)
    try {
      await switchStation(stationId)
      navigate('/dashboard')
    } finally {
      setSwitchingId(null)
    }
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }} className="fuelo-stations">

      {showModal && (
        <CreateModal
          onConfirm={handleCreate}
          onCancel={() => setShowModal(false)}
          loading={createLoading}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
            Mes stations
          </h1>
          <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, margin: 0 }}>
            {stations.length} station{stations.length > 1 ? 's' : ''} · vue propriétaire
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', cursor: 'pointer', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.plus} /></svg>
          Nouvelle station
        </button>
      </div>

      {/* Vue consolidée */}
      {!loading && stations.length > 1 && (
        <div style={{ background: `linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03))`, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: theme.radius.lg, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            📊 Vue consolidée — toutes stations
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }} className="fuelo-grid-3">
            {[
              { label: 'Stations actives', value: String(consolide.nb_stations ?? stations.length), color: theme.colors.primary },
              { label: 'Ventes du jour', value: formatGNF(consolide.ventes_jour_total), color: theme.colors.success },
              { label: 'Alertes totales', value: String(consolide.alertes_total ?? 0), color: parseInt(consolide.alertes_total) > 0 ? theme.colors.danger : theme.colors.success },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ textAlign: 'center', padding: '0 16px', borderRight: i < 2 ? `1px solid rgba(245,158,11,0.15)` : 'none' }}>
                <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: theme.font.weight.black, color, fontFamily: theme.font.mono, letterSpacing: '-1px' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grille stations */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="fuelo-grid-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: 20 }}>
                <SkeletonStatCard />
              </div>
            ))}
          </div>
        </>
      ) : stations.length === 0 ? (
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg }}>
          <EmptyState
            type="stations"
            actionLabel="Créer ma première station"
            onAction={() => setShowModal(true)}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="fuelo-grid-2">
          {stations.map(station => (
            <StationCard
              key={station.id}
              station={station}
              onSwitch={handleSwitch}
              switching={switchingId === station.id}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .fuelo-stations { padding: 20px 16px !important; }
          .fuelo-grid-2   { grid-template-columns: 1fr !important; }
          .fuelo-grid-3   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}