// ================================================
// FUELO V2 — Ventes responsive mobile
// Fichier : frontend/src/features/ventes/Ventes.jsx
// ================================================

import { useEffect, useState } from 'react'
import { useVentes }  from '../../hooks/useVentes'
import { useTheme }   from '../../context/ThemeContext'
import StatCard       from '../../ui/StatCard'
import EmptyState     from '../../ui/EmptyState'
import { SkeletonStatCard, SkeletonRow, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatDateTime } from '../../utils/format'
import { exportVentesPDF, exportVentesExcel }      from '../../utils/export'
import api   from '../../services/api'
import theme from '../../config/theme'

const ICONS = {
  ventes: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  litres: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  cash:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  pdf:    'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  excel:  'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}

export default function Ventes() {
  const { palette }  = useTheme()
  const [filterType, setFilterType] = useState('')
  const [page,       setPage]       = useState(1)
  const [exporting,  setExporting]  = useState('')
  const [nomStation, setNomStation] = useState('Ma Station')

  const { ventes, meta, aujourdhui, loading } = useVentes({ page, limit: 20, type: filterType })

  useEffect(() => {
    let cancelled = false
    api.get('/station').then(res => {
      if (cancelled) return
      const name = res.data?.station?.nom?.trim()
      if (name) setNomStation(name)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleExportPDF   = async () => { setExporting('pdf');   try { exportVentesPDF(ventes, nomStation)   } finally { setExporting('') } }
  const handleExportExcel = async () => { setExporting('excel'); try { await exportVentesExcel(ventes, nomStation) } finally { setExporting('') } }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }} className="fuelo-ventes">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Ventes</h1>
          <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>Historique des ventes enregistrées par vos pompistes</p>
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
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: theme.radius.md, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: theme.font.size.sm, color: theme.colors.primary }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Les ventes sont enregistrées uniquement par vos pompistes depuis leur interface dédiée.
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

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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

        {/* Header — desktop seulement */}
        <div className="ventes-header-desktop" style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 130px 150px', padding: '10px 22px', background: palette.hover, borderBottom: `1px solid ${palette.cardBorder}`, gap: 8 }}>
          {['#', 'Type', 'Litres', 'Montant', 'Date'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: theme.font.weight.bold, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
          : ventes.length === 0
          ? <EmptyState type="ventes" />
          : ventes.map((v, i) => (
            <div key={v.id}>
              {/* Desktop row */}
              <div className="ventes-row-desktop"
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

              {/* Mobile card */}
              <div className="ventes-row-mobile"
                style={{ display: 'none', padding: '12px 16px', borderBottom: i < ventes.length - 1 ? `1px solid ${palette.cardBorder}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: v.type === 'essence' ? theme.colors.warningLight : theme.colors.infoLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {v.type === 'essence' ? '⛽' : '🛢️'}
                    </div>
                    <div>
                      <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: palette.text, textTransform: 'capitalize' }}>{v.type}</div>
                      <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted }}>
                        {v.employe_nom && `${v.employe_nom} · `}{formatDateTime(v.created_at)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(v.montant_gnf)}</div>
                    <div style={{ fontSize: theme.font.size.xs, color: theme.colors.success, fontFamily: theme.font.mono }}>{formatLitres(v.litres)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        }

        {/* Pagination */}
        {meta.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderTop: `1px solid ${palette.cardBorder}`, flexWrap: 'wrap' }}>
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
        @media (max-width: 768px) {
          .fuelo-ventes          { padding: 20px 16px !important; }
          .fuelo-grid-3          { grid-template-columns: 1fr !important; }
          .ventes-header-desktop { display: none !important; }
          .ventes-row-desktop    { display: none !important; }
          .ventes-row-mobile     { display: block !important; }
        }
      `}</style>
    </div>
  )
}