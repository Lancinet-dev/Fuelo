// ================================================
// FUELO — Recherche globale (command palette)
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'
import theme from '../config/theme'

const numFmt = (n) => Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// ── Sous-composants ──────────────────────────────────

function SectionLabel({ label, palette }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 18px 4px' }}>
      {label}
    </div>
  )
}

function ResultRow({ children, active, onClick, palette }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '9px 18px',
        background: active ? palette.hover : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: 'inherit', transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = palette.hover }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? palette.hover : 'transparent' }}
    >
      {children}
    </button>
  )
}

// ── Composant principal ──────────────────────────────

export default function SearchModal({ onClose }) {
  const { palette, isDark } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (query.trim().length < 2) { setResults(null); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: query.trim() } })
        setResults(res.data)
        setActiveIdx(0)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(timerRef.current)
  }, [query])

  // Liste aplatie pour la navigation clavier
  const flat = results ? [
    ...results.employes.map(r => ({ ...r, _cat: 'employes' })),
    ...results.ventes.map(r =>   ({ ...r, _cat: 'ventes' })),
    ...results.alertes.map(r =>  ({ ...r, _cat: 'alertes' })),
  ] : []

  const goTo = (item) => {
    onClose()
    if (item._cat === 'employes') navigate('/employes')
    if (item._cat === 'ventes')   navigate('/ventes')
    if (item._cat === 'alertes')  navigate('/alertes')
  }

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flat[activeIdx]) goTo(flat[activeIdx])
  }

  const isActive = (item, cat) => flat[activeIdx]?._cat === cat && flat[activeIdx]?.id === item.id
  const hasResults = results && flat.length > 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '10vh 16px 16px',
        fontFamily: theme.font.family,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: isDark ? '#0D1B2A' : '#fff',
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.xl,
          width: '100%', maxWidth: 520,
          boxShadow: theme.shadow.lg,
          overflow: 'hidden',
          animation: 'srchSlide 0.15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barre de saisie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${palette.cardBorder}` }}>
          {loading ? (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${palette.cardBorder}`, borderTopColor: theme.colors.primary, animation: 'srchSpin 0.7s linear infinite', flexShrink: 0 }} />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Rechercher un employé, une vente, une alerte..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: palette.text, fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, padding: '3px 5px', borderRadius: 6, lineHeight: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <kbd style={{ fontSize: 10, color: palette.textMuted, background: palette.hover, border: `1px solid ${palette.cardBorder}`, borderRadius: 5, padding: '2px 6px', fontFamily: 'monospace', flexShrink: 0 }}>
            Échap
          </kbd>
        </div>

        {/* État : attente saisie */}
        {query.trim().length < 2 && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <div style={{ fontSize: 13, color: palette.textMuted }}>Tapez 2 caractères minimum</div>
          </div>
        )}

        {/* État : aucun résultat */}
        {query.trim().length >= 2 && !loading && results !== null && !hasResults && (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: palette.textMuted }}>Aucun résultat pour «&nbsp;{query}&nbsp;»</div>
          </div>
        )}

        {/* Résultats */}
        {hasResults && (
          <div style={{ maxHeight: 370, overflowY: 'auto' }}>

            {results.employes.length > 0 && (
              <>
                <SectionLabel label="Employés" palette={palette} />
                {results.employes.map(r => (
                  <ResultRow key={r.id} active={isActive(r, 'employes')} onClick={() => goTo({ ...r, _cat: 'employes' })} palette={palette}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: theme.colors.primary, flexShrink: 0 }}>
                      {r.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{r.nom}</div>
                      <div style={{ fontSize: 11, color: palette.textMuted }}>{r.email} · <span style={{ textTransform: 'capitalize' }}>{r.role}</span></div>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </ResultRow>
                ))}
              </>
            )}

            {results.ventes.length > 0 && (
              <>
                <SectionLabel label="Ventes" palette={palette} />
                {results.ventes.map(r => (
                  <ResultRow key={r.id} active={isActive(r, 'ventes')} onClick={() => goTo({ ...r, _cat: 'ventes' })} palette={palette}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: palette.text, textTransform: 'capitalize' }}>{r.type} — {r.litres} L</div>
                      <div style={{ fontSize: 11, color: palette.textMuted }}>{numFmt(r.montant_gnf)} GNF · {new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </ResultRow>
                ))}
              </>
            )}

            {results.alertes.length > 0 && (
              <>
                <SectionLabel label="Alertes" palette={palette} />
                {results.alertes.map(r => (
                  <ResultRow key={r.id} active={isActive(r, 'alertes')} onClick={() => goTo({ ...r, _cat: 'alertes' })} palette={palette}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
                      </svg>
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>{r.type.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: 11, color: palette.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.message}</div>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </ResultRow>
                ))}
              </>
            )}
          </div>
        )}

        {/* Footer raccourcis clavier */}
        <div style={{ padding: '8px 18px', borderTop: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { keys: ['↑', '↓'], label: 'naviguer' },
            { keys: ['↵'],      label: 'ouvrir'   },
            { keys: ['Échap'],  label: 'fermer'   },
          ].map(({ keys, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {keys.map(k => (
                <kbd key={k} style={{ fontSize: 10, color: palette.textMuted, background: palette.hover, border: `1px solid ${palette.cardBorder}`, borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{k}</kbd>
              ))}
              <span style={{ fontSize: 10, color: palette.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes srchSlide { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes srchSpin  { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
