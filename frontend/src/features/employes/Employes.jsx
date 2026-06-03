// ================================================
// FUELO V2.2 — Employés (vue RBAC par rôle)
// Owner   → voit gérants + logisticiens, crée les deux
// Gérant  → voit ses pompistes, crée pompiste
// ================================================

import { useState } from 'react'
import { useEmployes } from '../../hooks/useEmployes'
import { useTheme }    from '../../context/ThemeContext'
import { useAuth }     from '../../context/AuthContext'
import EmptyState      from '../../ui/EmptyState'
import { SkeletonRow, SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF }   from '../../utils/format'
import theme from '../../config/theme'

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

// ── Config par rôle créateur ──────────────────────────
const ROLE_CONFIG = {
  owner: {
    title:       'Gérants & Logisticiens',
    subtitle:    (n) => `${n} membre${n > 1 ? 's' : ''} dans votre équipe de gestion`,
    btnLabel:    'Ajouter un membre',
    formTitle:   'Nouveau membre',
    rolesDispos: [
      { value: 'gerant',      label: '👔 Gérant',      desc: 'Dashboard, ventes, stock, alertes, services, pompistes' },
      { value: 'logisticien', label: '📦 Logisticien', desc: 'Citernes, trajets GPS, alertes transport, chauffeurs' },
    ],
    showVentes: false,
  },
  gerant: {
    title:       'Mes Pompistes',
    subtitle:    (n) => `${n} pompiste${n > 1 ? 's' : ''} sous votre gestion`,
    btnLabel:    'Ajouter un pompiste',
    formTitle:   'Nouveau pompiste',
    rolesDispos: [
      { value: 'pompiste', label: '⛽ Pompiste', desc: 'Enregistrement des ventes et gestion de service' },
    ],
    showVentes: true,
  },
}

const ROLE_COLORS = {
  gerant:      { color: theme.colors.info,    bg: theme.colors.infoLight },
  logisticien: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.1)' },
  pompiste:    { color: theme.colors.success, bg: theme.colors.successLight },
  chauffeur:   { color: theme.colors.warning, bg: theme.colors.warningLight },
}

const ROLE_LABELS = {
  gerant:      '👔 Gérant',
  logisticien: '📦 Logisticien',
  pompiste:    '⛽ Pompiste',
  chauffeur:   '🚛 Chauffeur',
  owner:       '👑 Propriétaire',
}

function StatusBadge({ actif }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, padding: '2px 9px',
      borderRadius: theme.radius.full,
      background: actif ? theme.colors.successLight : theme.colors.dangerLight,
      color: actif ? theme.colors.success : theme.colors.danger,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: actif ? theme.colors.success : theme.colors.danger }} />
      {actif ? 'Actif' : 'Désactivé'}
    </span>
  )
}

function ConfirmModal({ employe, onConfirm, onCancel, palette }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}>
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.xl, padding: '28px 24px', maxWidth: 400, width: '100%', boxShadow: theme.shadow.lg }}>
        <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 8, textAlign: 'center' }}>Supprimer {employe.nom} ?</div>
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 24, textAlign: 'center', lineHeight: 1.6 }}>Cette action est irréversible.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '11px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13 }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '11px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.danger, color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13, fontWeight: 700 }}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

export default function Employes() {
  const { user }    = useAuth()
  const userRole    = normalizeRole(user?.role)
  const isOwner     = userRole === 'owner'
  const isGerant    = userRole === 'gerant'
  const canManage   = isOwner || isGerant
  const config      = ROLE_CONFIG[userRole] ?? ROLE_CONFIG.gerant

  const { palette } = useTheme()
  const { employes, loading, createLoading, creerEmploye, toggleEmploye, supprimerEmploye } = useEmployes()

  const [showForm, setShowForm] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [showPwd,  setShowPwd]  = useState(false)
  const [errors,   setErrors]   = useState({})
  const [nom,      setNom]      = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState(config.rolesDispos[0]?.value ?? 'pompiste')

  const resetForm = () => {
    setNom(''); setEmail(''); setPassword('')
    setRole(config.rolesDispos[0]?.value ?? 'pompiste')
    setShowPwd(false); setErrors({})
  }

  const validate = () => {
    const e = {}
    if (!nom.trim())                 e.nom      = 'Obligatoire'
    if (!email.trim().includes('@')) e.email    = 'Email invalide'
    if (password.length < 6)         e.password = 'Minimum 6 caractères'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    try {
      await creerEmploye({ nom: nom.trim(), email: email.trim().toLowerCase(), password, role })
      resetForm()
      setShowForm(false)
    } catch (_) {}
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try { await supprimerEmploye(toDelete.id); setToDelete(null) } catch (_) {}
  }

  const handleToggle = async (id) => {
    try { await toggleEmploye(id) } catch (_) {}
  }

  const inputStyle = (hasError) => ({
    width: '100%', height: 46,
    background: palette.inputBg,
    border: `1.5px solid ${hasError ? theme.colors.danger : palette.cardBorder}`,
    borderRadius: theme.radius.md, padding: '0 14px',
    fontSize: theme.font.size.base, color: palette.text,
    fontFamily: theme.font.family, outline: 'none',
    transition: theme.transition.fast, boxSizing: 'border-box',
  })

  // Colonnes dynamiques selon le rôle
  const cols = config.showVentes
    ? '1fr 160px 90px 90px 110px 80px'
    : '1fr 180px 110px 100px 90px'
  const headers = config.showVentes
    ? ['Membre', 'Email', 'Rôle', 'Ventes', 'Revenu', 'Actions']
    : ['Membre', 'Email', 'Rôle', 'Depuis', 'Actions']

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1060, margin: '0 auto' }} className="fuelo-employes">

      {toDelete && <ConfirmModal employe={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} palette={palette} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 5 }}>
            {config.title}
          </h1>
          <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
            {config.subtitle(employes.length)}
          </p>
        </div>
        {canManage && (
          <button onClick={() => { resetForm(); setShowForm(v => !v) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: theme.font.family, boxShadow: theme.shadow.primary, whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {config.btnLabel}
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '24px 22px', marginBottom: 24, boxShadow: theme.shadow.sm }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 20 }}>{config.formTitle}</div>
          <form onSubmit={handleSubmit}>
            <div className="fuelo-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
              {/* Nom */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nom complet</div>
                <input type="text" placeholder="Mamadou Diallo" value={nom}
                  onChange={e => { setNom(e.target.value); setErrors(er => ({ ...er, nom: '' })) }}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = errors.nom ? theme.colors.danger : palette.cardBorder }}
                  style={inputStyle(errors.nom)} />
                {errors.nom && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 4 }}>{errors.nom}</div>}
              </div>
              {/* Email */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email</div>
                <input type="email" placeholder="membre@mastation.com" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                  onBlur={e  => { e.target.style.borderColor = errors.email ? theme.colors.danger : palette.cardBorder }}
                  style={inputStyle(errors.email)} />
                {errors.email && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 4 }}>{errors.email}</div>}
              </div>
              {/* Mot de passe */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 caractères" value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary }}
                    onBlur={e  => { e.target.style.borderColor = errors.password ? theme.colors.danger : palette.cardBorder }}
                    style={{ ...inputStyle(errors.password), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showPwd ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                    </svg>
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 4 }}>{errors.password}</div>}
              </div>
            </div>

            {/* Sélection du rôle */}
            {config.rolesDispos.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Rôle</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {config.rolesDispos.map(r => {
                    const rc = ROLE_COLORS[r.value]
                    const sel = role === r.value
                    return (
                      <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                        padding: '12px 16px', borderRadius: theme.radius.md, textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.family,
                        border: `1.5px solid ${sel ? rc?.color ?? theme.colors.primary : palette.cardBorder}`,
                        background: sel ? (rc?.bg ?? theme.colors.primaryLight) : palette.inputBg,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? (rc?.color ?? theme.colors.primary) : palette.text, marginBottom: 3 }}>{r.label}</div>
                        <div style={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.4 }}>{r.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" disabled={createLoading}
                style={{ padding: '11px 24px', borderRadius: theme.radius.md, border: 'none', background: theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: createLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8, boxShadow: theme.shadow.primary }}>
                {createLoading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                {createLoading ? 'Création...' : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => { resetForm(); setShowForm(false) }}
                style={{ padding: '11px 20px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, fontSize: 13, cursor: 'pointer', fontFamily: theme.font.family }}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm }}>

        {/* En-tête tableau — desktop */}
        <div className="fuelo-table-header" style={{ display: 'grid', gridTemplateColumns: cols, padding: '10px 20px', background: palette.hover, borderBottom: `1px solid ${palette.cardBorder}`, gap: 8 }}>
          {headers.map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <>
            <SkeletonStyle />
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={headers.length} />)}
          </>
        ) : employes.length === 0 ? (
          <EmptyState
            type="employes"
            actionLabel={canManage ? config.btnLabel : undefined}
            onAction={canManage ? () => setShowForm(true) : undefined}
          />
        ) : (
          employes.map((emp, i) => {
            const displayRole = normalizeRole(emp.role)
            const rc          = ROLE_COLORS[displayRole] ?? { color: theme.colors.success, bg: theme.colors.successLight }
            const initial     = emp.nom?.trim()?.charAt(0)?.toUpperCase() || '?'
            const createdDate = emp.created_at
              ? new Date(emp.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'

            return (
              <div key={emp.id}>
                {/* Desktop row */}
                <div className="fuelo-table-row"
                  style={{ display: 'grid', gridTemplateColumns: cols, padding: '14px 20px', borderBottom: i < employes.length - 1 ? `1px solid ${palette.cardBorder}` : 'none', transition: theme.transition.fast, gap: 8, alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = palette.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Nom + statut */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: theme.colors.primary, flexShrink: 0 }}>
                      {initial}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nom}</div>
                      <StatusBadge actif={emp.actif} />
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ fontSize: 12, color: palette.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</div>

                  {/* Rôle */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.bg, padding: '2px 9px', borderRadius: theme.radius.full, whiteSpace: 'nowrap' }}>
                      {ROLE_LABELS[displayRole] || displayRole}
                    </span>
                  </div>

                  {/* Ventes (gérant) ou Date (owner) */}
                  {config.showVentes ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: palette.text, fontFamily: theme.font.mono }}>{emp.nb_ventes_jour ?? 0}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(emp.total_ventes_jour ?? 0)}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: palette.textMuted }}>{createdDate}</div>
                  )}

                  {/* Actions */}
                  {canManage && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleToggle(emp.id)} title={emp.actif ? 'Désactiver' : 'Activer'}
                        style={{ width: 30, height: 30, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: emp.actif ? theme.colors.warning : theme.colors.success, transition: theme.transition.fast, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.background = palette.hover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d={emp.actif ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                        </svg>
                      </button>
                      <button onClick={() => setToDelete(emp)} title="Supprimer"
                        style={{ width: 30, height: 30, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.danger, transition: theme.transition.fast, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.colors.dangerLight}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile card */}
                <div className="fuelo-mobile-card"
                  style={{ display: 'none', padding: '14px 16px', borderBottom: i < employes.length - 1 ? `1px solid ${palette.cardBorder}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.colors.primaryLight, border: `1px solid ${theme.colors.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: theme.colors.primary, flexShrink: 0 }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>{emp.nom}</div>
                        <div style={{ fontSize: 11, color: palette.textSub, marginTop: 1 }}>{emp.email}</div>
                      </div>
                    </div>
                    {canManage && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleToggle(emp.id)}
                          style={{ width: 32, height: 32, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: emp.actif ? theme.colors.warning : theme.colors.success }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d={emp.actif ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                          </svg>
                        </button>
                        <button onClick={() => setToDelete(emp)}
                          style={{ width: 32, height: 32, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.danger }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge actif={emp.actif} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.bg, padding: '2px 8px', borderRadius: theme.radius.full }}>
                      {ROLE_LABELS[displayRole] || displayRole}
                    </span>
                    {config.showVentes && (
                      <>
                        <span style={{ fontSize: 11, color: palette.textMuted }}>{emp.nb_ventes_jour ?? 0} vente{(emp.nb_ventes_jour ?? 0) > 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary, fontFamily: theme.font.mono }}>{formatGNF(emp.total_ventes_jour ?? 0)}</span>
                      </>
                    )}
                    {!config.showVentes && (
                      <span style={{ fontSize: 11, color: palette.textMuted }}>Depuis {createdDate}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .fuelo-employes     { padding: 20px 16px !important; }
          .fuelo-grid-3       { grid-template-columns: 1fr !important; }
          .fuelo-table-header { display: none !important; }
          .fuelo-table-row    { display: none !important; }
          .fuelo-mobile-card  { display: block !important; }
        }
      `}</style>
    </div>
  )
}
