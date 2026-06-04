// ================================================
// FUELO — Page Performances & Primes
// ================================================

import { useState } from 'react'
import { useTheme }  from '../../context/ThemeContext'
import { useAuth }   from '../../context/AuthContext'
import { usePerformances, usePerformancesEmploye, useValiderPrime } from '../../hooks/usePerformances'
import theme from '../../config/theme'

const NIVEAUX = [
  { min: 95, label: 'Exemplaire', color: '#7C3AED', bg: '#EDE9FE', stars: 5 },
  { min: 80, label: 'Excellent',  color: '#059669', bg: '#D1FAE5', stars: 4 },
  { min: 60, label: 'Très bien',  color: '#2563EB', bg: '#DBEAFE', stars: 3 },
  { min: 40, label: 'Bon',        color: '#D97706', bg: '#FEF3C7', stars: 2 },
  { min: 0,  label: 'Débutant',   color: '#6B7280', bg: '#F3F4F6', stars: 1 },
]

const getNiveau = (score) => NIVEAUX.find(n => (score ?? -1) >= n.min) ?? NIVEAUX[NIVEAUX.length - 1]

const MOIS_LABELS = ['','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

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
function ScoreBar({ score, color }) {
  const s = score ?? 0
  return (
    <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 99,
        width: `${s}%`,
        background: color,
        transition: 'width 0.8s ease',
      }} />
    </div>
  )
}

// ── Modal historique d'un employé ────────────────
function ModalHistorique({ employe, onClose, palette, isDark }) {
  const { data } = usePerformancesEmploye(employe.id)
  const historique = data?.historique ?? []

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: palette.card, borderRadius: 20,
        border: `1px solid ${palette.cardBorder}`,
        width: '100%', maxWidth: 480,
        maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: palette.text }}>{employe.nom}</div>
            <div style={{ fontSize: 12, color: palette.textSub, marginTop: 2 }}>Historique 12 derniers mois</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {historique.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Aucun historique disponible</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                  {['Mois','Score','Niveau','Prime','Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: palette.textMuted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historique.map(h => {
                  const niv = getNiveau(h.score)
                  const statut = h.prime_validee === true ? 'Validée' : h.prime_validee === false ? 'Refusée' : h.prime_proposee ? 'En attente' : '—'
                  const statutColor = h.prime_validee === true ? theme.colors.success : h.prime_validee === false ? theme.colors.danger : h.prime_proposee ? '#D97706' : palette.textMuted
                  return (
                    <tr key={h.id} style={{ borderBottom: `1px solid ${palette.cardBorder}` }}>
                      <td style={{ padding: '10px 16px', color: palette.text, fontWeight: 500 }}>{MOIS_LABELS[h.mois]} {h.annee}</td>
                      <td style={{ padding: '10px 16px', color: palette.text, fontFamily: theme.font.mono, fontWeight: 700 }}>{h.score ?? '—'}%</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: niv.color, background: niv.bg, padding: '2px 8px', borderRadius: 99 }}>{niv.label}</span>
                      </td>
                      <td style={{ padding: '10px 16px', color: palette.text, fontFamily: theme.font.mono }}>{h.prime_montant ? `${fmt(h.prime_montant)} GNF` : '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: statutColor }}>{statut}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Carte employé ────────────────────────────────
function CarteEmploye({ p, mois, annee, palette, isDark, onHistorique }) {
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
    <div style={{
      background: palette.card,
      border: `1px solid ${enAttente ? '#D9770660' : palette.cardBorder}`,
      borderRadius: 16,
      padding: '18px 20px',
      boxShadow: enAttente ? '0 4px 20px rgba(217,119,6,0.1)' : theme.shadow.sm,
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${niv.color}22`,
            border: `2px solid ${niv.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 700, color: niv.color, flexShrink: 0,
          }}>
            {p.nom?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 2 }}>{p.nom}</div>
            <div style={{ fontSize: 11, color: palette.textSub, textTransform: 'capitalize' }}>
              {p.user_role === 'pompiste' ? 'Pompiste' : 'Chauffeur'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {!aucuneDonnee && (
            <span style={{ fontSize: 10, fontWeight: 700, color: niv.color, background: niv.bg, padding: '3px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
              {niv.label}
            </span>
          )}
          <button
            onClick={() => onHistorique(p)}
            style={{ fontSize: 10, color: palette.textMuted, background: 'none', border: `1px solid ${palette.cardBorder}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Historique
          </button>
        </div>
      </div>

      {aucuneDonnee ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: palette.textMuted, fontSize: 12 }}>
          Pas encore de données pour ce mois
        </div>
      ) : (
        <>
          {/* Score + étoiles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Etoiles count={niv.stars} color={niv.color} />
            <span style={{ fontSize: 20, fontWeight: 900, color: niv.color, fontFamily: theme.font.mono }}>{score}%</span>
          </div>
          <ScoreBar score={score} color={niv.color} />

          {/* Métriques */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
            {p.user_role === 'pompiste' ? [
              { l: 'Jours',   v: p.nb_jours_travailles ?? 0 },
              { l: 'Ventes',  v: p.nb_ventes ?? 0 },
              { l: 'Fraudes', v: p.nb_fraudes ?? 0, bad: (p.nb_fraudes ?? 0) > 0 },
            ] : [
              { l: 'Trajets',   v: p.nb_trajets ?? 0 },
              { l: 'Fraudes',   v: p.nb_fraudes ?? 0, bad: (p.nb_fraudes ?? 0) > 0 },
              { l: 'Arrêts',    v: p.nb_alertes ?? 0, bad: (p.nb_alertes ?? 0) > 0 },
            ].map(({ l, v, bad }) => (
              <div key={l} style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                borderRadius: 10, padding: '8px 10px', textAlign: 'center',
                border: bad ? `1px solid ${theme.colors.danger}30` : 'none',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: bad ? theme.colors.danger : palette.text, fontFamily: theme.font.mono }}>{v}</div>
                <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Prime */}
          {p.prime_proposee && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: validee ? theme.colors.successLight : refusee ? theme.colors.dangerLight : '#FEF3C7',
              border: `1px solid ${validee ? theme.colors.success + '40' : refusee ? theme.colors.danger + '40' : '#D9770640'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: validee ? theme.colors.success : refusee ? theme.colors.danger : '#D97706', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                    {validee ? 'Prime validée' : refusee ? 'Prime refusée' : 'Prime proposée'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono }}>
                    {fmt(p.prime_montant)} GNF
                  </div>
                  {(validee || refusee) && p.valideur_nom && (
                    <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2 }}>
                      par {p.valideur_nom}
                    </div>
                  )}
                </div>

                {enAttente && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => handleAction('valider')}
                      disabled={isPending}
                      style={{
                        padding: '8px 14px', borderRadius: 9, border: 'none',
                        background: theme.colors.success, color: '#fff',
                        fontSize: 12, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        opacity: isPending ? 0.7 : 1,
                      }}
                    >
                      ✓ Valider
                    </button>
                    <button
                      onClick={() => handleAction('refuser')}
                      disabled={isPending}
                      style={{
                        padding: '8px 14px', borderRadius: 9, border: `1px solid ${theme.colors.danger}`,
                        background: 'transparent', color: theme.colors.danger,
                        fontSize: 12, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', whiteSpace: 'nowrap',
                        opacity: isPending ? 0.7 : 1,
                      }}
                    >
                      ✗ Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────
export default function PerformancesPage() {
  const { isDark, palette } = useTheme()
  const { role }            = useAuth()

  const now     = new Date()
  const [mois,  setMois]  = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [historique, setHistorique] = useState(null)

  const { data, isLoading } = usePerformances({ mois, annee })
  const performances = data?.performances ?? []

  const enAttente  = performances.filter(p => p.prime_proposee && p.prime_validee === null)
  const totalPrime = performances
    .filter(p => p.prime_validee === true)
    .reduce((s, p) => s + (p.prime_montant ?? 0), 0)

  const annees = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, fontFamily: theme.font.family }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: palette.text, margin: 0, letterSpacing: '-0.3px' }}>
          Performances & Primes
        </h1>
        <p style={{ fontSize: 13, color: palette.textSub, margin: '4px 0 0' }}>
          {role === 'gerant' ? 'Vos pompistes' : role === 'logisticien' ? 'Vos chauffeurs' : 'Tous les employés'}
        </p>
      </div>

      {/* Filtres mois/année */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[...Array(12)].map((_, i) => {
            const m = i + 1
            return (
              <button key={m} onClick={() => setMois(m)}
                style={{
                  padding: '5px 10px', borderRadius: 99, border: `1px solid ${mois === m ? 'transparent' : palette.cardBorder}`,
                  background: mois === m ? theme.colors.primary : palette.card,
                  color: mois === m ? '#fff' : palette.textSub,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}>
                {MOIS_LABELS[m]}
              </button>
            )
          })}
        </div>
        <select value={annee} onChange={e => setAnnee(parseInt(e.target.value))}
          style={{
            height: 32, padding: '0 10px', background: palette.inputBg, border: `1px solid ${palette.cardBorder}`,
            borderRadius: 8, color: palette.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
          }}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Résumé */}
      {performances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { l: 'Employés', v: performances.length, color: palette.text },
            { l: 'En attente', v: enAttente.length, color: enAttente.length > 0 ? '#D97706' : theme.colors.success },
            { l: 'Total validé', v: `${fmt(totalPrime)} GNF`, color: theme.colors.success },
          ].map(({ l, v, color }) => (
            <div key={l} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: '14px 18px', boxShadow: theme.shadow.sm }}>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: theme.font.mono }}>{v}</div>
              <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 220, background: palette.card, borderRadius: 16, border: `1px solid ${palette.cardBorder}` }} />
          ))}
        </div>
      ) : performances.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 24px',
          background: palette.card, border: `1px dashed ${palette.cardBorder}`,
          borderRadius: 18,
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 6 }}>Aucun employé actif</div>
          <div style={{ fontSize: 13, color: palette.textSub }}>
            Les performances sont calculées automatiquement à la fin de chaque mois.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {performances.map(p => (
            <CarteEmploye
              key={p.id}
              p={p}
              mois={mois}
              annee={annee}
              palette={palette}
              isDark={isDark}
              onHistorique={setHistorique}
            />
          ))}
        </div>
      )}

      {/* Modal historique */}
      {historique && (
        <ModalHistorique
          employe={historique}
          onClose={() => setHistorique(null)}
          palette={palette}
          isDark={isDark}
        />
      )}
    </div>
  )
}
