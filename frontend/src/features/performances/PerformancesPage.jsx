// ================================================
// FUELO V2 — Performances & Primes (glassmorphism)
// Fichier : frontend/src/features/performances/PerformancesPage.jsx
// ================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme }  from '../../context/ThemeContext'
import { useAuth }   from '../../context/AuthContext'
import { PlanGatePage } from '../../ui/PlanGate'
import { usePerformances, usePerformancesEmploye, useValiderPrime, useAnneesDisponibles } from '../../hooks/usePerformances'
import StatCard      from '../../ui/StatCard'
import EmptyState    from '../../ui/EmptyState'
import Shimmer, { SkeletonStatCard, SkeletonStyle } from '../../ui/Skeleton'
import theme from '../../config/theme'

const NIVEAUX = [
  { min: 95, label: 'Exemplaire', color: '#7C3AED', bg: 'rgba(124,58,237,0.14)', stars: 5 },
  { min: 80, label: 'Excellent',  color: '#059669', bg: 'rgba(5,150,105,0.14)',  stars: 4 },
  { min: 60, label: 'Très bien',  color: '#2563EB', bg: 'rgba(37,99,235,0.14)',  stars: 3 },
  { min: 40, label: 'Bon',        color: '#D97706', bg: 'rgba(217,119,6,0.14)',  stars: 2 },
  { min: 0,  label: 'Débutant',   color: '#6B7280', bg: 'rgba(107,114,128,0.14)',stars: 1 },
]

const getNiveau = (score) => NIVEAUX.find(n => (score ?? -1) >= n.min) ?? NIVEAUX[NIVEAUX.length - 1]

const MOIS_LABELS = ['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const ICONS = {
  check: 'M20 6L9 17l-5-5',
  x:     'M18 6L6 18M6 6l12 12',
  user:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

function fmt(n) {
  return (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// ── Étoiles ─────────────────────────────────────
function Etoiles({ count, color }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= count ? color : 'none'}
          stroke={color} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

// ── Barre de score ───────────────────────────────
function ScoreBar({ score, color, palette }) {
  const s = score ?? 0
  return (
    <div style={{ width: '100%', height: 6, background: palette.hover, borderRadius: theme.radius.full, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${s}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: theme.radius.full, background: color }}
      />
    </div>
  )
}

// ── Modal historique d'un employé ────────────────
function ModalHistorique({ employe, onClose, palette, isDark }) {
  const { data } = usePerformancesEmploye(employe.id)
  const historique = data?.historique ?? []

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
          borderRadius: theme.radius.card,
          border: `1px solid ${palette.cardBorder}`,
          width: '100%', maxWidth: 480,
          maxHeight: '80vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? theme.shadow.premium : theme.shadow.lg,
        }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: palette.text }}>{employe.nom}</div>
            <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginTop: 2 }}>Historique 12 derniers mois</div>
          </div>
          <motion.button whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            style={{ background: palette.hover, border: 'none', borderRadius: theme.radius.md, cursor: 'pointer', color: palette.textMuted, padding: 8, display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.x} /></svg>
          </motion.button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {historique.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: palette.textMuted, fontSize: theme.font.size.sm }}>Aucun historique disponible</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: theme.font.size.sm }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                  {['Mois','Score','Niveau','Prime','Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: palette.textMuted, fontWeight: theme.font.weight.semi, fontSize: theme.font.size.xs, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historique.map(h => {
                  const niv = getNiveau(h.score)
                  const statut = h.prime_validee === true ? 'Validée' : h.prime_validee === false ? 'Refusée' : h.prime_proposee ? 'En attente' : '—'
                  const statutColor = h.prime_validee === true ? theme.colors.success : h.prime_validee === false ? theme.colors.danger : h.prime_proposee ? theme.colors.warning : palette.textMuted
                  return (
                    <tr key={h.id} style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                      <td style={{ padding: '10px 16px', color: palette.text, fontWeight: theme.font.weight.medium }}>{MOIS_LABELS[h.mois]} {h.annee}</td>
                      <td style={{ padding: '10px 16px', color: palette.text, fontFamily: theme.font.mono, fontWeight: theme.font.weight.bold }}>{h.score ?? '—'}%</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color: niv.color, background: niv.bg, padding: '2px 8px', borderRadius: theme.radius.full }}>{niv.label}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: palette.text, fontFamily: theme.font.mono }}>{h.prime_montant ? `${fmt(h.prime_montant)} GNF` : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: statutColor }}>{statut}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Carte employé ────────────────────────────────
function CarteEmploye({ p, mois, annee, palette, isDark, onHistorique, index }) {
  const { mutateAsync: valider, isPending } = useValiderPrime()
  const niv   = getNiveau(p.score)
  const score = p.score ?? null

  const enAttente = p.prime_proposee && p.prime_validee === null
  const validee   = p.prime_validee === true
  const refusee   = p.prime_validee === false
  const aucuneDonnee = score === null

  const handleAction = async (action) => {
    await valider({ userId: p.id, mois, annee, action })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ delay: Math.min(index, 10) * 0.05, duration: 0.3 }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: isDark ? palette.glass : palette.card,
        backdropFilter: isDark ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
        border: `1px solid ${enAttente ? theme.colors.warning + '50' : palette.cardBorder}`,
        borderRadius: theme.radius.card,
        padding: '20px 22px',
        boxShadow: enAttente ? theme.shadow.glow(theme.colors.warning) : (isDark ? theme.shadow.premium : theme.shadow.sm),
        transition: theme.transition.hover,
      }}
      onMouseEnter={e => { if (!enAttente) e.currentTarget.style.boxShadow = `0 0 0 1px ${niv.color}30, 0 14px 38px ${niv.color}1f` }}
      onMouseLeave={e => { if (!enAttente) e.currentTarget.style.boxShadow = isDark ? theme.shadow.premium : theme.shadow.sm }}
    >
      {/* Glow décoratif */}
      <div style={{ position: 'absolute', top: -36, right: -36, width: 120, height: 120, borderRadius: '50%', background: niv.color, opacity: isDark ? 0.10 : 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${niv.color} 0%, ${niv.color}99 100%)`,
            boxShadow: `0 4px 16px ${niv.color}45`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: '#fff',
          }}>
            {p.nom?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, color: palette.text, marginBottom: 2 }}>{p.nom}</div>
            <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, textTransform: 'capitalize' }}>
              {p.user_role === 'pompiste' ? 'Pompiste' : 'Chauffeur'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          {!aucuneDonnee && (
            <span style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color: niv.color, background: niv.bg, padding: '3px 10px', borderRadius: theme.radius.full, whiteSpace: 'nowrap' }}>
              {niv.label}
            </span>
          )}
          <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} onClick={() => onHistorique(p)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: theme.font.size.xs, color: palette.textMuted, background: 'transparent', border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.md, padding: '4px 10px', cursor: 'pointer', fontFamily: theme.font.family, transition: theme.transition.hover }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.clock} /></svg>
            Historique
          </motion.button>
        </div>
      </div>

      {aucuneDonnee ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: palette.textMuted, fontSize: theme.font.size.sm, position: 'relative' }}>
          Pas encore de données pour ce mois
        </div>
      ) : (
        <>
          {/* Score + étoiles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative' }}>
            <Etoiles count={niv.stars} color={niv.color} />
            <span style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.black, color: niv.color, fontFamily: theme.font.mono }}>{score}%</span>
          </div>
          <div style={{ position: 'relative' }}>
            <ScoreBar score={score} color={niv.color} palette={palette} />
          </div>

          {/* Métriques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16, position: 'relative' }}>
            {(p.user_role === 'pompiste' ? [
              { l: 'Jours',   v: p.nb_jours_travailles ?? 0 },
              { l: 'Ventes',  v: p.nb_ventes ?? 0 },
              { l: 'Fraudes', v: p.nb_fraudes ?? 0, bad: (p.nb_fraudes ?? 0) > 0 },
            ] : [
              { l: 'Trajets',   v: p.nb_trajets ?? 0 },
              { l: 'Fraudes',   v: p.nb_fraudes ?? 0, bad: (p.nb_fraudes ?? 0) > 0 },
              { l: 'Arrêts',    v: p.nb_alertes ?? 0, bad: (p.nb_alertes ?? 0) > 0 },
            ]).map(({ l, v, bad }) => (
              <div key={l} style={{
                background: palette.hover,
                borderRadius: theme.radius.md, padding: '8px 10px', textAlign: 'center',
                border: `1px solid ${bad ? theme.colors.danger + '30' : 'transparent'}`,
              }}>
                <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.black, color: bad ? theme.colors.danger : palette.text, fontFamily: theme.font.mono }}>{v}</div>
                <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Prime */}
          <AnimatePresence>
            {p.prime_proposee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', position: 'relative' }}
              >
                <div style={{
                  marginTop: 16, padding: '14px 16px', borderRadius: theme.radius.md,
                  background: validee ? `${theme.colors.success}12` : refusee ? `${theme.colors.danger}12` : `${theme.colors.warning}12`,
                  border: `1px solid ${validee ? theme.colors.success + '35' : refusee ? theme.colors.danger + '35' : theme.colors.warning + '35'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, color: validee ? theme.colors.success : refusee ? theme.colors.danger : theme.colors.warning, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                        {validee ? 'Prime validée' : refusee ? 'Prime refusée' : 'Prime proposée'}
                      </div>
                      <div style={{ fontSize: theme.font.size.xl, fontWeight: theme.font.weight.black, color: palette.text, fontFamily: theme.font.mono }}>
                        {fmt(p.prime_montant)} GNF
                      </div>
                      {(validee || refusee) && p.valideur_nom && (
                        <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginTop: 4 }}>
                          par {p.valideur_nom}
                        </div>
                      )}
                    </div>

                    {enAttente && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} disabled={isPending} onClick={() => handleAction('valider')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: theme.radius.button, border: 'none', background: theme.colors.success, color: '#fff', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, whiteSpace: 'nowrap', opacity: isPending ? 0.7 : 1, transition: theme.transition.hover }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.check} /></svg>
                          Valider
                        </motion.button>
                        <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} disabled={isPending} onClick={() => handleAction('refuser')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: theme.radius.button, border: `1px solid ${theme.colors.danger}`, background: 'transparent', color: theme.colors.danger, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.bold, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, whiteSpace: 'nowrap', opacity: isPending ? 0.7 : 1, transition: theme.transition.hover }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS.x} /></svg>
                          Refuser
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────
function PerformancesPageContent() {
  const { isDark, palette } = useTheme()
  const { role }            = useAuth()

  const now     = new Date()
  const [mois,  setMois]  = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [historique, setHistorique] = useState(null)

  const { data, isLoading } = usePerformances({ mois, annee })
  const { data: anneesData } = useAnneesDisponibles()
  const performances = data?.performances ?? []

  const enAttente  = performances.filter(p => p.prime_proposee && p.prime_validee === null)
  const totalPrime = performances
    .filter(p => p.prime_validee === true)
    .reduce((s, p) => s + (p.prime_montant ?? 0), 0)

  // Années avec données réelles en base ; fallback sur l'année courante
  const annees = anneesData?.annees?.length > 0
    ? anneesData.annees
    : [now.getFullYear()]

  return (
    <div style={{ padding: '32px 28px', maxWidth: 980, margin: '0 auto' }} className="fuelo-perfs">

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: `${theme.colors.warning}15`, border: `1px solid ${theme.colors.warning}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6"/>
              <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
            </svg>
          </span>
          Performances & Primes
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          {role === 'gerant' ? 'Vos pompistes' : role === 'logisticien' ? 'Vos chauffeurs' : 'Tous les employés'}
        </p>
      </div>

      {/* Filtres mois/année */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[...Array(12)].map((_, i) => {
            const m = i + 1
            const active = mois === m
            return (
              <motion.button key={m} whileTap={{ scale: 0.94 }} onClick={() => setMois(m)}
                style={{
                  padding: '6px 13px', borderRadius: theme.radius.full,
                  border: `1px solid ${active ? 'transparent' : palette.cardBorder}`,
                  background: active ? theme.colors.primary : (isDark ? palette.glass : palette.card),
                  color: active ? '#fff' : palette.textSub,
                  fontSize: theme.font.size.xs, fontWeight: active ? theme.font.weight.bold : theme.font.weight.medium,
                  cursor: 'pointer', fontFamily: theme.font.family, transition: theme.transition.hover,
                  boxShadow: active ? '0 0 0 1px rgba(37,99,235,0.25), 0 6px 18px rgba(37,99,235,0.28)' : 'none',
                }}>
                {MOIS_LABELS[m]}
              </motion.button>
            )
          })}
        </div>
        <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
          onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
          onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }}
          style={{
            height: 34, padding: '0 12px', background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`,
            borderRadius: theme.radius.button, color: palette.text, fontSize: theme.font.size.sm, fontFamily: theme.font.family,
            outline: 'none', cursor: 'pointer', transition: theme.transition.hover,
          }}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Résumé */}
      {isLoading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }} className="fuelo-grid-3">
            <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
          </div>
        </>
      ) : performances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }} className="fuelo-grid-3">
          <StatCard label="Employés"     value={String(performances.length)} icon={ICONS.user}  color={palette.textSub} />
          <StatCard label="En attente"   value={String(enAttente.length)}    icon={ICONS.clock} color={enAttente.length > 0 ? theme.colors.warning : theme.colors.success} />
          <StatCard label="Total validé" value={`${fmt(totalPrime)} GNF`}    icon={ICONS.check} color={theme.colors.success} />
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div className="fuelo-perf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              background: isDark ? palette.glass : palette.card,
              border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: 22,
              boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Shimmer width={44} height={44} radius="50%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <Shimmer width="60%" height={13} />
                  <Shimmer width="40%" height={11} />
                </div>
              </div>
              <Shimmer width="100%" height={6} radius={theme.radius.full} />
              <Shimmer width="100%" height={60} radius={theme.radius.md} />
            </div>
          ))}
        </div>
      ) : performances.length === 0 ? (
        <div style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
          border: `1px dashed ${palette.cardBorder}`, borderRadius: theme.radius.card,
          boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
        }}>
          <EmptyState
            type="default"
            title="Aucun employé actif"
            message="Les performances sont calculées automatiquement à la fin de chaque mois."
          />
        </div>
      ) : (
        <div className="fuelo-perf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {performances.map((p, i) => (
              <CarteEmploye
                key={p.id}
                p={p}
                index={i}
                mois={mois}
                annee={annee}
                palette={palette}
                isDark={isDark}
                onHistorique={setHistorique}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal historique */}
      <AnimatePresence>
        {historique && (
          <ModalHistorique
            employe={historique}
            onClose={() => setHistorique(null)}
            palette={palette}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .fuelo-perfs     { padding: 20px 16px !important; }
          .fuelo-grid-3    { grid-template-columns: 1fr !important; }
          .fuelo-perf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function PerformancesPage() {
  return (
    <PlanGatePage feature="performances">
      <PerformancesPageContent />
    </PlanGatePage>
  )
}
