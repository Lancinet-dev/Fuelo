// ================================================
// FUELO V2 — Ventes avec theme dark/light
// Fichier : frontend/src/features/ventes/Ventes.jsx
// ================================================

import { useState } from 'react'
import { useVentes }  from '../../hooks/useVentes'
import { useTheme }   from '../../context/ThemeContext'
import StatCard       from '../../ui/StatCard'
import EmptyState     from '../../ui/EmptyState'
import { SkeletonStatCard, SkeletonRow, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatDateTime } from '../../utils/format'
import { exportVentesPDF, exportVentesExcel }      from '../../utils/export'
import theme from '../../config/theme'

const ICONS = {
  ventes:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  litres:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  cash:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  plus:    'M12 5v14M5 12h14',
  pdf:     'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  excel:   'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

export default function Ventes() {
  const { palette } = useTheme()
  const [showForm,   setShowForm]   = useState(false)
  const [filterType, setFilterType] = useState('')
  const [page,       setPage]       = useState(1)
  const [form,       setForm]       = useState({ type: 'essence', litres: '', montant_gnf: '' })
  const [exporting,  setExporting]  = useState('')

  const { ventes, meta, aujourdhui, loading, venteLoading, enregistrerVente } = useVentes({ page, limit: 20, type: filterType })

  const nomStation = JSON.parse(localStorage.getItem('fuelo_station') || 'null') ?? 'Ma Station'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.litres || !form.montant_gnf) return
    await enregistrerVente({ type: form.type, litres: parseFloat(form.litres), montant_gnf: parseInt(form.montant_gnf) })
    setForm({ type: 'essence', litres: '', montant_gnf: '' })
    setShowForm(false)
  }

  const handleExportPDF = async () => {
    setExporting('pdf')
    try { exportVentesPDF(ventes, nomStation) } finally { setExporting('') }
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try { exportVentesExcel(ventes, nomStation) } finally { setExporting('') }
  }

  const inputStyle = {
    width: '100%', height: 46,
    background:   palette.inputBg,
    border:       `1.5px solid ${palette.cardBorder}`,
    borderRadius: theme.radius.md,
    padding:      '0 14px',
    fontSize:     15,
    fontWeight:   theme.font.weight.bold,
    color:        palette.text,
    fontFamily:   theme.font.mono,
    outline:      'none',
    transition:   theme.transition.fast,
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }} className="fuelo-ventes">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Ventes</h1>
          <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>Historique et enregistrement</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExportExcel} disabled={exporting === 'excel' || ventes.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: '#10B981', cursor: ventes.length === 0 ? 'not-allowed' : 'pointer', fontSize: theme.font.size.sm, fontFamily: theme.font.family, fontWeight: theme.font.weight.semi, boxShadow: theme.shadow.sm, opacity: ventes.length === 0 ? 0.5 : 1 }}>
            {exporting === 'excel' ? <div style={{ width: 14, height: 14, border: '2px solid #10B981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.excel} /></svg>}
            Excel
          </button>

          <button onClick={handleExportPDF} disabled={exporting === 'pdf' || ventes.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: '#EF4444', cursor: ventes.length === 0 ? 'not-allowed' : 'pointer', fontSize: theme.font.size.sm, fontFamily: theme.font.family, fontWeight: theme.font.weight.semi, boxShadow: theme.shadow.sm, opacity: ventes.length === 0 ? 0.5 : 1 }}>
            {exporting === 'pdf' ? <div style={{ width: 14, height: 14, border: '2px solid #EF4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.pdf} /></svg>}
            PDF
          </button>

          <button onClick={() => setShowForm(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#fff', cursor: 'pointer', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.plus} /></svg>
            Nouvelle vente
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
          <StatCard label="Transactions aujourd'hui" value={String(aujourdhui.nb ?? 0)}            icon={ICONS.ventes} color={theme.colors.primary} />
          <StatCard label="Litres vendus"            value={formatLitres(aujourdhui.total_litres)} icon={ICONS.litres} color={theme.colors.success} />
          <StatCard label="Montant encaissé"         value={formatGNF(aujourdhui.total_gnf)}       icon={ICONS.cash}   color={theme.colors.info}    />
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '24px 26px', marginBottom: 24, boxShadow: theme.shadow.sm }}>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text, marginBottom: 20 }}>Enregistrer une vente</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }} className="fuelo-grid-3">
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Type</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ val: 'essence', emoji: '⛽' }, { val: 'gasoil', emoji: '🛢️' }].map(({ val, emoji }) => (
                    <button key={val} type="button" onClick={() => setForm(f => ({ ...f, type: val }))}
                      style={{ flex: 1, padding: '11px 8px', borderRadius: theme.radius.md, border: `1.5px solid ${form.type === val ? theme.colors.primary : palette.cardBorder}`, background: form.type === val ? theme.colors.primaryLight : palette.inputBg, color: form.type === val ? theme.colors.primary : palette.textSub, fontFamily: theme.font.family, fontSize: theme.font.size.sm, fontWeight: form.type === val ? theme.font.weight.bold : theme.font.weight.normal, cursor: 'pointer', transition: theme.transition.fast }}>
                      {emoji} {val}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Litres vendus</div>
                <input type="number" min="0.1" step="0.1" placeholder="Ex: 50" value={form.litres}
                  onChange={e => setForm(f => ({ ...f, litres: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = palette.cardBorder }}
                  style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Montant (GNF)</div>
                <input type="number" min="1" placeholder="Ex: 500000" value={form.montant_gnf}
                  onChange={e => setForm(f => ({ ...f, montant_gnf: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = palette.cardBorder }}
                  style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={venteLoading}
                style={{ padding: '11px 24px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#fff', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: venteLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8, boxShadow: theme.shadow.primary }}>
                {venteLoading && <div style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {venteLoading ? 'Enregistrement...' : 'Confirmer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '11px 20px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, fontSize: theme.font.size.md, cursor: 'pointer', fontFamily: theme.font.family }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ val: '', label: 'Toutes' }, { val: 'essence', label: '⛽ Essence' }, { val: 'gasoil', label: '🛢️ Gasoil' }].map(({ val, label }) => (
          <button key={val} onClick={() => { setFilterType(val); setPage(1) }}
            style={{ padding: '7px 16px', borderRadius: theme.radius.full, border: `1px solid ${filterType === val ? theme.colors.primary : palette.cardBorder}`, background: filterType === val ? theme.colors.primaryLight : palette.card, color: filterType === val ? theme.colors.primary : palette.textSub, fontSize: theme.font.size.sm, fontWeight: filterType === val ? theme.font.weight.semi : theme.font.weight.normal, cursor: 'pointer', fontFamily: theme.font.family, transition: theme.transition.fast }}>
            {label}
          </button>
        ))}
        {ventes.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: theme.font.size.xs, color: palette.textMuted, alignSelf: 'center' }}>
            {meta.total ?? 0} vente{(meta.total ?? 0) > 1 ? 's' : ''} au total
          </span>
        )}
      </div>

      {/* Tableau */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 130px 150px', padding: '10px 22px', background: palette.hover, borderBottom: `1px solid ${palette.cardBorder}`, gap: 8 }}>
          {['#', 'Type', 'Litres', 'Montant', 'Date'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: theme.font.weight.bold, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
          : ventes.length === 0
          ? <EmptyState type="ventes" />
          : ventes.map((v, i) => (
            <div key={v.id}
              style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 130px 150px', padding: '13px 22px', borderBottom: i < ventes.length - 1 ? `1px solid ${palette.cardBorder}` : 'none', transition: theme.transition.fast, gap: 8, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = palette.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: theme.font.size.sm, color: palette.textMuted, fontFamily: theme.font.mono }}>#{v.id}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>{v.type === 'essence' ? '⛽' : '🛢️'}</span>
                <div>
                  <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: palette.text, textTransform: 'capitalize' }}>{v.type}</div>
                  {v.employe_nom && <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>{v.employe_nom}</div>}
                </div>
              </div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.success, fontFamily: theme.font.mono }}>{formatLitres(v.litres)}</div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(v.montant_gnf)}</div>
              <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>{formatDateTime(v.created_at)}</div>
            </div>
          ))
        }

        {/* Pagination */}
        {meta.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderTop: `1px solid ${palette.cardBorder}` }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.has_prev}
              style={{ padding: '7px 14px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: meta.has_prev ? palette.text : palette.textMuted, cursor: meta.has_prev ? 'pointer' : 'not-allowed', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
              ← Précédent
            </button>
            <span style={{ fontSize: theme.font.size.sm, color: palette.textSub }}>Page {meta.page} / {meta.pages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!meta.has_next}
              style={{ padding: '7px 14px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.card, color: meta.has_next ? palette.text : palette.textMuted, cursor: meta.has_next ? 'pointer' : 'not-allowed', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}>
              Suivant →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .fuelo-ventes { padding: 20px 16px !important; }
          .fuelo-grid-3  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}