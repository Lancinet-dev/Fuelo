// ================================================
// FUELO V2 — Employes avec rôle Pompiste/Gérant
// Fichier : frontend/src/features/employes/Employes.jsx
// ================================================

import { useState } from 'react'
import { useEmployes } from '../../hooks/useEmployes'
import EmptyState      from '../../ui/EmptyState'
import { SkeletonRow, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF }   from '../../utils/format'
import theme from '../../config/theme'

const ICONS = {
  plus:  'M12 5v14M5 12h14',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
}

const ROLE_LABELS = {
  pompiste: '⛽ Pompiste',
  manager:  '👔 Gérant',
  owner:    '👑 Propriétaire',
}

// ── Badge statut ──────────────────────────────────────
function StatusBadge({ actif }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, padding: '3px 10px', borderRadius: theme.radius.full, background: actif ? theme.colors.successLight : theme.colors.dangerLight, color: actif ? theme.colors.success : theme.colors.danger }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: actif ? theme.colors.success : theme.colors.danger }} />
      {actif ? 'Actif' : 'Désactivé'}
    </span>
  )
}

// ── Modal suppression ─────────────────────────────────
function ConfirmModal({ employe, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.xl, padding: '28px 32px', maxWidth: 400, width: '90%', boxShadow: theme.shadow.lg }}>
        <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
        <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: 8, textAlign: 'center' }}>
          Supprimer {employe.nom} ?
        </div>
        <div style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, marginBottom: 24, textAlign: 'center', lineHeight: 1.6 }}>
          Cette action est irréversible. L'employé ne pourra plus se connecter.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '11px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: 'transparent', color: theme.colors.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: theme.font.size.md }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ padding: '11px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.danger, color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold }}>
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Employes ──────────────────────────────────────────
export default function Employes() {
  const { employes, loading, createLoading, creerEmploye, toggleEmploye, supprimerEmploye } = useEmployes()

  const [showForm,  setShowForm]  = useState(false)
  const [toDelete,  setToDelete]  = useState(null)
  const [showPwd,   setShowPwd]   = useState(false)
  const [errors,    setErrors]    = useState({})

  // ── Un seul useState pour le form ────────────────
  const [form, setForm] = useState({
    nom:      '',
    email:    '',
    password: '',
    role:     'pompiste',
  })

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.nom.trim())         e.nom      = 'Obligatoire'
    if (!form.email.includes('@')) e.email    = 'Email invalide'
    if (form.password.length < 6) e.password = 'Minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    await creerEmploye(form)
    setForm({ nom: '', email: '', password: '', role: 'pompiste' })
    setErrors({})
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!toDelete) return
    await supprimerEmploye(toDelete.id)
    setToDelete(null)
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
    <div style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }} className="fuelo-employes">

      {toDelete && <ConfirmModal employe={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
            Employés
          </h1>
          <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, margin: 0 }}>
            {employes.length} membre{employes.length > 1 ? 's' : ''} dans votre station
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', cursor: 'pointer', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, fontFamily: theme.font.family, boxShadow: theme.shadow.primary }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.plus} /></svg>
          Ajouter un membre
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '24px 26px', marginBottom: 24, boxShadow: theme.shadow.sm }}>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: theme.colors.text, marginBottom: 20 }}>
            Nouveau membre
          </div>
          <form onSubmit={handleSubmit}>

            {/* Ligne 1 — Nom + Email + Mot de passe */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }} className="fuelo-grid-3">

              {/* Nom */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nom complet</div>
                <input type="text" placeholder="Mamadou Diallo" value={form.nom}
                  onChange={e => set('nom')(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = errors.nom ? theme.colors.danger : theme.colors.cardBorder }}
                  style={inputStyle(errors.nom)}
                />
                {errors.nom && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.nom}</div>}
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email</div>
                <input type="email" placeholder="membre@mastation.com" value={form.email}
                  onChange={e => set('email')(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = errors.email ? theme.colors.danger : theme.colors.cardBorder }}
                  style={inputStyle(errors.email)}
                />
                {errors.email && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.email}</div>}
              </div>

              {/* Mot de passe */}
              <div>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
                    value={form.password}
                    onChange={e => set('password')(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                    onBlur={e  => { e.target.style.borderColor = errors.password ? theme.colors.danger : theme.colors.cardBorder }}
                    style={{ ...inputStyle(errors.password), paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                      }
                    </svg>
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{errors.password}</div>}
              </div>
            </div>

            {/* Ligne 2 — Choix rôle */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Rôle dans la station
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { val: 'pompiste', label: ROLE_LABELS.pompiste, desc: 'Enregistre les ventes uniquement' },
                  { val: 'manager',  label: ROLE_LABELS.manager,  desc: 'Accès complet au dashboard'      },
                ].map(({ val, label, desc }) => (
                  <button
                    key={val}
                    type="button"
                  onClick={() => setForm(f => ({ ...f, role: val }))}
                    style={{
                      flex:         1,
                      padding:      '12px 16px',
                      borderRadius: theme.radius.md,
                      border:       `1.5px solid ${form.role === val ? theme.colors.primary : theme.colors.cardBorder}`,
                      background:   form.role === val ? theme.colors.primaryLight : '#F9FAFB',
                      cursor:       'pointer',
                      fontFamily:   theme.font.family,
                      textAlign:    'left',
                      transition:   theme.transition.fast,
                    }}
                  >
                    <div style={{ fontSize: theme.font.size.base, fontWeight: form.role === val ? theme.font.weight.bold : theme.font.weight.normal, color: form.role === val ? theme.colors.primary : theme.colors.text, marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: theme.font.size.xs, color: form.role === val ? theme.colors.primary : theme.colors.textMuted }}>
                      {desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={createLoading}
                style={{ padding: '11px 24px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#0F172A', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: createLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8, boxShadow: theme.shadow.primary }}>
                {createLoading && <div style={{ width: 14, height: 14, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {createLoading ? 'Création...' : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setErrors({}) }}
                style={{ padding: '11px 20px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: 'transparent', color: theme.colors.textSub, fontSize: theme.font.size.md, cursor: 'pointer', fontFamily: theme.font.family }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau */}
      <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 100px 110px 120px', padding: '10px 22px', background: '#F9FAFB', borderBottom: `1px solid ${theme.colors.cardBorder}`, gap: 8 }}>
          {['Membre', 'Email', 'Rôle', 'Ventes/jour', 'Revenu/jour', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: theme.font.weight.bold, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <>
            <SkeletonStyle />
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
          </>
        ) : employes.length === 0 ? (
          <EmptyState type="employes" actionLabel="Ajouter un membre" onAction={() => setShowForm(true)} />
        ) : (
          employes.map((emp, i) => (
            <div key={emp.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 80px 100px 110px 120px', padding: '14px 22px', borderBottom: i < employes.length - 1 ? `1px solid ${theme.colors.cardBorder}` : 'none', transition: theme.transition.fast, gap: 8, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Nom + statut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: theme.font.weight.bold, color: theme.colors.primary, flexShrink: 0 }}>
                  {emp.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: theme.colors.text }}>{emp.nom}</div>
                  <StatusBadge actif={emp.actif} />
                </div>
              </div>

              {/* Email */}
              <div style={{ fontSize: theme.font.size.sm, color: theme.colors.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</div>

              {/* Rôle */}
              <div>
                <span style={{ fontSize: 11, fontWeight: theme.font.weight.semi, color: emp.role === 'manager' ? theme.colors.info : theme.colors.success, background: emp.role === 'manager' ? theme.colors.infoLight : theme.colors.successLight, padding: '2px 8px', borderRadius: theme.radius.full }}>
                  {ROLE_LABELS[emp.role] || emp.role}
                </span>
              </div>

              {/* Ventes */}
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.text, fontFamily: theme.font.mono }}>
                {emp.nb_ventes_jour ?? 0}
              </div>

              {/* Revenu */}
              <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, color: theme.colors.primary, fontFamily: theme.font.mono }}>
                {formatGNF(emp.total_ventes_jour)}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleEmploye(emp.id)} title={emp.actif ? 'Désactiver' : 'Activer'}
                  style={{ width: 32, height: 32, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: emp.actif ? theme.colors.warning : theme.colors.success, transition: theme.transition.fast }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={emp.actif ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                  </svg>
                </button>
                <button onClick={() => setToDelete(emp)} title="Supprimer"
                  style={{ width: 32, height: 32, borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.danger, transition: theme.transition.fast }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.colors.dangerLight}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.trash} /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .fuelo-employes { padding: 20px 16px !important; }
          .fuelo-grid-3   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}