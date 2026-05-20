// ================================================
// FUELO V2 — Ventes
// Fichier : frontend/src/features/ventes/Ventes.jsx
// ================================================

import { useState } from 'react'
import { useVentes }    from '../../hooks/useVentes'
import StatCard         from '../../ui/StatCard'
import EmptyState       from '../../ui/EmptyState'
import { SkeletonStatCard, SkeletonRow, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF, formatLitres, formatDateTime } from '../../utils/format'
import theme from '../../config/theme'

const ICONS = {
  ventes: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  litres: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  cash:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  plus:   'M12 5v14M5 12h14',
}

export default function Ventes() {
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState({ type: 'essence', litres: '', montant_gnf: '' })

  const { ventes, meta, aujourdhui, loading, venteLoading, enregistrerVente } = useVentes({ page, limit: 20, type: filterType })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.litres || !form.montant_gnf) return
    await enregistrerVente({
      type:        form.type,
      litres:      parseFloat(form.litres),
      montant_gnf: parseInt(form.montant_gnf),
    })
    setForm({ type: 'essence', litres: '', montant_gnf: '' })
    setShowForm(false)
  }

  const inputStyle = {
    width:        '100%',
    height:       46,
    background:   '#F9FAFB',
    border:       `1.5px solid ${theme.colors.cardBorder}`,
    borderRadius: theme.radius.md,
    padding:      '0 14px',
    fontSize:     15,
    fontWeight:   theme.font.weight.bold,
    color:        theme.colors.text,
    fontFamily:   theme.font.mono,
    outline:      'none',
    transition:   theme.transition.fast,
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }} className="fuelo-ventes">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Ventes</h1>
          <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, margin: 0 }}>Historique et enregistrement</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', cursor: 'pointer', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.plus} /></svg>
          Nouvelle vente
        </button>
      </div>

      {/* Stat cards du jour */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
          <StatCard label="Transactions aujourd'hui" value={String(aujourdhui.nb ?? 0)}           icon={ICONS.ventes} color={theme.colors.primary} />
          <StatCard label="Litres vendus"            value={formatLitres(aujourdhui.total_litres)} icon={ICONS.litres} color={theme.colors.success} />
          <StatCard label="Montant encaissé"         value={formatGNF(aujourdhui.total_gnf)}       icon={ICONS.cash}   color={theme.colors.info}    />
        </div>
      )}

      {/* Formulaire nouvelle vente */}
      {showForm && (
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '24px 26px', marginBottom: 24, boxShadow: theme.shadow.sm }}>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: 20 }}>Enregistrer une vente</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }} className="fuelo-grid-3">

              {/* Type */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Type</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ val: 'essence', emoji: '⛽' }, { val: 'gasoil', emoji: '🛢️' }].map(({ val, emoji }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: val }))}
                      style={{ flex: 1, padding: '11px 8px', borderRadius: theme.radius.md, border: `1.5px solid ${form.type === val ? theme.colors.primary : theme.colors.cardBorder}`, background: form.type === val ? theme.colors.primaryLight : '#F9FAFB', color: form.type === val ? theme.colors.primary : theme.colors.textSub, fontFamily: theme.font.family, fontSize: theme.font.size.sm, fontWeight: form.type === val ? theme.font.weight.bold : theme.font.weight.normal, cursor: 'pointer', transition: theme.transition.fast }}
                    >
                      {emoji} {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Litres */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Litres vendus</div>
                <input
                  type="number" min="0.1" step="0.1" placeholder="Ex: 50"
                  value={form.litres}
                  onChange={e => setForm(f => ({ ...f, litres: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e =>  { e.target.style.borderColor = theme.colors.cardBorder }}
                  style={inputStyle}
                />
              </div>

              {/* Montant */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Montant (GNF)</div>
                <input
                  type="number" min="1" placeholder="Ex: 500000"
                  value={form.montant_gnf}
                  onChange={e => setForm(f => ({ ...f, montant_gnf: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e =>  { e.target.style.borderColor = theme.colors.cardBorder }}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={venteLoading}
                style={{ padding: '11px 24px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: venteLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8, boxShadow: theme.shadow.primary }}
              >
                {venteLoading && <div style={{ width: 14, height: 14, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {venteLoading ? 'Enregistrement...' : 'Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ padding: '11px 20px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: 'transparent', color: theme.colors.textSub, fontSize: theme.font.size.md, cursor: 'pointer', fontFamily: theme.font.family }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ val: '', label: 'Toutes' }, { val: 'essence', label: '⛽ Essence' }, { val: 'gasoil', label: '🛢️ Gasoil' }].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => { setFilterType(val); setPage(1) }}
            style={{ padding: '7px 16px', borderRadius: theme.radius.full, border: `1px solid ${filterType === val ? theme.colors.primary : theme.colors.cardBorder}`, background: filterType === val ? theme.colors.primaryLight : theme.colors.card, color: filterType === val ? theme.colors.primary : theme.colors.textSub, fontSize: theme.font.size.sm, fontWeight: filterType === val ? theme.font.weight.semi : theme.font.weight.normal, cursor: 'pointer', fontFamily: theme.font.family, transition: theme.transition.fast }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tableau historique */}
      <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${theme.colors.cardBorder}` }}>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: theme.colors.text }}>Historique des ventes</div>
          <div style={{ fontSize: theme.font.size.sm, color: theme.colors.textSub }}>{meta.total ?? 0} vente{(meta.total ?? 0) > 1 ? 's' : ''}</div>
        </div>

        {/* En-têtes */}
        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 130px 150px', padding: '10px 22px', background: '#F9FAFB', borderBottom: `1px solid ${theme.colors.cardBorder}`, gap: 8 }}>
          {['#', 'Type', 'Litres', 'Montant', 'Date'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: theme.font.weight.bold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
        ) : ventes.length === 0 ? (
          <EmptyState type="ventes" />
        ) : (
          ventes.map((v, i) => (
            <div
              key={v.id}
              style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 130px 150px', padding: '13px 22px', borderBottom: i < ventes.length - 1 ? `1px solid ${theme.colors.cardBorder}` : 'none', transition: theme.transition.fast, gap: 8, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: theme.font.size.sm, color: theme.colors.textMuted, fontFamily: theme.font.mono }}>#{v.id}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>{v.type === 'essence' ? '⛽' : '🛢️'}</span>
                <div>
                  <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: theme.colors.text, textTransform: 'capitalize' }}>{v.type}</div>
                  {v.employe_nom && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>{v.employe_nom}</div>}
                </div>
              </div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.success, fontFamily: theme.font.mono }}>{formatLitres(v.litres)}</div>
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(v.montant_gnf)}</div>
              <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub }}>{formatDateTime(v.created_at)}</div>
            </div>
          ))
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '16px', borderTop: `1px solid ${theme.colors.cardBorder}` }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!meta.has_prev}
              style={{ padding: '7px 14px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: theme.colors.card, color: meta.has_prev ? theme.colors.text : theme.colors.textMuted, cursor: meta.has_prev ? 'pointer' : 'not-allowed', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}
            >
              ← Précédent
            </button>
            <span style={{ fontSize: theme.font.size.sm, color: theme.colors.textSub }}>
              Page {meta.page} / {meta.pages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!meta.has_next}
              style={{ padding: '7px 14px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: theme.colors.card, color: meta.has_next ? theme.colors.text : theme.colors.textMuted, cursor: meta.has_next ? 'pointer' : 'not-allowed', fontFamily: theme.font.family, fontSize: theme.font.size.sm }}
            >
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
          .fuelo-grid-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}