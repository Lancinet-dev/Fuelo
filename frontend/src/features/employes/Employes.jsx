// ================================================
// FUELO V2.3 — Employés premium (grid cards glassmorphism)
// Owner       → voit gérants + logisticiens, crée les deux
// Gérant      → voit ses pompistes, crée pompiste
// Logisticien → voit ses chauffeurs, crée chauffeur
// ================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEmployes } from '../../hooks/useEmployes'
import { useTheme }    from '../../context/ThemeContext'
import { useAuth }     from '../../context/AuthContext'
import { usePlan }     from '../../hooks/usePlan'
import { useUpgradeModal } from '../../ui/PlanGate'
import EmptyState      from '../../ui/EmptyState'
import Shimmer, { SkeletonStyle } from '../../ui/Skeleton'
import { formatGNF }   from '../../utils/format'
import { CREATABLE_ROLES } from '../../config/roles'
import theme from '../../config/theme'

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

// ── Config par rôle créateur ──────────────────────────
const ROLE_CONFIG = {
  owner: {
    title:       'Gérants, Logisticiens & Comptables',
    subtitle:    (n) => `${n} membre${n > 1 ? 's' : ''} dans votre équipe de gestion`,
    btnLabel:    'Ajouter un membre',
    formTitle:   'Nouveau membre',
    rolesDispos: [
      { value: 'gerant',      label: 'Gérant',      desc: 'Dashboard, ventes, stock, alertes, services, pompistes' },
      { value: 'logisticien', label: 'Logisticien', desc: 'Citernes, trajets GPS, alertes transport, chauffeurs' },
      { value: 'comptable',   label: 'Comptable',   desc: 'Gestion financière, BL, factures et paie' },
    ],
    showVentes:  false,
  },
  gerant: {
    title:       'Mes Pompistes',
    subtitle:    (n) => `${n} pompiste${n > 1 ? 's' : ''} sous votre gestion`,
    btnLabel:    'Ajouter un pompiste',
    formTitle:   'Nouveau pompiste',
    rolesDispos: CREATABLE_ROLES.gerant,
    showVentes:  true,
  },
  logisticien: {
    title:       'Mes Chauffeurs',
    subtitle:    (n) => `${n} chauffeur${n > 1 ? 's' : ''} sous votre gestion`,
    btnLabel:    'Ajouter un chauffeur',
    formTitle:   'Nouveau chauffeur',
    rolesDispos: CREATABLE_ROLES.logisticien,
    showVentes:  false,
  },
}

const ROLE_COLORS = {
  gerant:      { color: theme.colors.info,    bg: theme.colors.infoLight },
  logisticien: { color: '#8B5CF6',            bg: 'rgba(139,92,246,0.1)' },
  pompiste:    { color: theme.colors.success, bg: theme.colors.successLight },
  chauffeur:   { color: theme.colors.warning, bg: theme.colors.warningLight },
  comptable:   { color: '#0891B2',            bg: 'rgba(8,145,178,0.1)' },
}

const ROLE_LABELS = {
  gerant:      'Gérant',
  logisticien: 'Logisticien',
  pompiste:    'Pompiste',
  chauffeur:   'Chauffeur',
  comptable:   'Comptable',
  owner:       'Propriétaire',
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

function ConfirmModal({ employe, onConfirm, onCancel, palette, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fuelo-modal-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="fuelo-modal"
        style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
          border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: '28px 24px', maxWidth: 400, width: '100%',
          boxShadow: isDark ? theme.shadow.premium : theme.shadow.lg,
        }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.colors.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.colors.danger} strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: palette.text, marginBottom: 8, textAlign: 'center' }}>Supprimer {employe.nom} ?</div>
        <div style={{ fontSize: 13, color: palette.textSub, marginBottom: 24, textAlign: 'center', lineHeight: 1.6 }}>Cette action est irréversible.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '11px', borderRadius: theme.radius.button, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13 }}>Annuler</button>
          <button onClick={onConfirm} style={{ padding: '11px', borderRadius: theme.radius.button, border: 'none', background: theme.colors.danger, color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: 13, fontWeight: 700 }}>Supprimer</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Employes() {
  const { user }    = useAuth()
  const userRole    = normalizeRole(user?.role)
  const isOwner       = userRole === 'owner'
  const isGerant      = userRole === 'gerant'
  const isLogisticien = userRole === 'logisticien'
  const canManage     = isOwner || isGerant || isLogisticien
  const config        = ROLE_CONFIG[userRole] ?? ROLE_CONFIG.gerant

  const { palette, isDark } = useTheme()
  const { employes, loading, createLoading, creerEmploye, toggleEmploye, supprimerEmploye } = useEmployes()
  const { maxEmployes } = usePlan()
  const { showUpgrade, Modal: UpgradeModal } = useUpgradeModal()

  // Limite employés : maxEmployes null = illimité
  const limitEmployesAtteinte = maxEmployes !== null && employes.length >= maxEmployes

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
    if (nom.trim().length < 2)       e.nom      = 'Minimum 2 caractères'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = 'Email invalide (ex: nom@gmail.com)'
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
    } catch { /* erreur déjà affichée par useEmployes */ }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try { await supprimerEmploye(toDelete.id); setToDelete(null) } catch { /* erreur déjà affichée par useEmployes */ }
  }

  const handleToggle = async (id) => {
    try { await toggleEmploye(id) } catch { /* erreur déjà affichée par useEmployes */ }
  }

  const inputStyle = (hasError) => ({
    width: '100%', height: 46,
    background: palette.inputBg,
    border: `1.5px solid ${hasError ? theme.colors.danger : palette.cardBorder}`,
    borderRadius: theme.radius.button, padding: '0 14px',
    fontSize: theme.font.size.base, color: palette.text,
    fontFamily: theme.font.family, outline: 'none',
    transition: theme.transition.fast, boxSizing: 'border-box',
  })

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1180, margin: '0 auto' }} className="fuelo-employes">

      <AnimatePresence>
        {toDelete && (
          <ConfirmModal key="confirm-delete" employe={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} palette={palette} isDark={isDark} />
        )}
      </AnimatePresence>
      {UpgradeModal}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 5 }}>
            {config.title}
          </h1>
          <p style={{ fontSize: 13, color: palette.textSub, margin: 0 }}>
            {config.subtitle(employes.length)}
            {maxEmployes !== null && ` · ${employes.length}/${maxEmployes} max`}
          </p>
        </div>
        {canManage && (
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (limitEmployesAtteinte) return showUpgrade('performances')
              resetForm(); setShowForm(v => !v)
            }}
            title={limitEmployesAtteinte ? `Limite de ${maxEmployes} employé(s) atteinte` : config.btnLabel}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: theme.radius.button, border: 'none', background: limitEmployesAtteinte ? palette.hover : theme.colors.primary, color: limitEmployesAtteinte ? palette.textMuted : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: theme.font.family, boxShadow: limitEmployesAtteinte ? 'none' : theme.shadow.primary, whiteSpace: 'nowrap' }}>
            {limitEmployesAtteinte
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>}
            {limitEmployesAtteinte ? `Limite atteinte (${maxEmployes} max)` : config.btnLabel}
          </motion.button>
        )}
      </div>

      {/* Formulaire de création */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              background: isDark ? palette.glass : palette.card,
              backdropFilter: isDark ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
              border: `1px solid ${palette.cardBorder}`,
              borderRadius: theme.radius.card,
              padding: '24px 22px',
              boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, marginBottom: 20 }}>{config.formTitle}</div>
              <form onSubmit={handleSubmit}>
                <div className="fuelo-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                  {/* Nom */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Nom complet</div>
                    <input type="text" placeholder="Mamadou Diallo" value={nom}
                      onChange={e => { setNom(e.target.value); setErrors(er => ({ ...er, nom: '' })) }}
                      onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                      onBlur={e  => { e.target.style.borderColor = errors.nom ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                      style={inputStyle(errors.nom)} />
                    {errors.nom && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 4 }}>{errors.nom}</div>}
                  </div>
                  {/* Email */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Email</div>
                    <input type="email" placeholder="membre@mastation.com" value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })) }}
                      onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                      onBlur={e  => { e.target.style.borderColor = errors.email ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                      style={inputStyle(errors.email)} />
                    {errors.email && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 4 }}>{errors.email}</div>}
                  </div>
                  {/* Mot de passe */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe</div>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 6 caractères" value={password}
                        onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })) }}
                        onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                        onBlur={e  => { e.target.style.borderColor = errors.password ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
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
                          <motion.button key={r.value} type="button" whileTap={{ scale: 0.97 }} onClick={() => setRole(r.value)} style={{
                            padding: '12px 16px', borderRadius: theme.radius.button, textAlign: 'left', cursor: 'pointer', fontFamily: theme.font.family,
                            border: `1.5px solid ${sel ? rc?.color ?? theme.colors.primary : palette.cardBorder}`,
                            background: sel ? (rc?.bg ?? theme.colors.primaryLight) : palette.inputBg,
                            boxShadow: sel ? `0 0 0 1px ${(rc?.color ?? theme.colors.primary)}30, 0 6px 20px ${(rc?.color ?? theme.colors.primary)}20` : 'none',
                            transition: theme.transition.hover,
                          }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: sel ? (rc?.color ?? theme.colors.primary) : palette.text, marginBottom: 3 }}>{r.label}</div>
                            <div style={{ fontSize: 11, color: palette.textMuted, lineHeight: 1.4 }}>{r.desc}</div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <motion.button type="submit" disabled={createLoading} whileHover={{ y: createLoading ? 0 : -2 }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '11px 24px', borderRadius: theme.radius.button, border: 'none', background: theme.colors.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: createLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8, boxShadow: theme.shadow.primary }}>
                    {createLoading && <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                    {createLoading ? 'Création...' : 'Créer le compte'}
                  </motion.button>
                  <button type="button" onClick={() => { resetForm(); setShowForm(false) }}
                    style={{ padding: '11px 20px', borderRadius: theme.radius.button, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.textSub, fontSize: 13, cursor: 'pointer', fontFamily: theme.font.family }}>
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille de cartes */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div className="fuelo-emp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: isDark ? palette.glass : palette.card,
                border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card, padding: 22,
                boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Shimmer width={46} height={46} radius="50%" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <Shimmer width="70%" height={13} />
                    <Shimmer width="50%" height={11} />
                  </div>
                </div>
                <Shimmer width="40%" height={20} radius={theme.radius.full} />
                <Shimmer width="100%" height={36} radius={theme.radius.md} />
              </div>
            ))}
          </div>
        </>
      ) : employes.length === 0 ? (
        <div style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
          border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.card,
          boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
        }}>
          <EmptyState
            type="employes"
            actionLabel={canManage ? config.btnLabel : undefined}
            onAction={canManage ? () => setShowForm(true) : undefined}
          />
        </div>
      ) : (
        <div className="fuelo-emp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
          <AnimatePresence mode="popLayout">
            {employes.map((emp, i) => {
              const displayRole = normalizeRole(emp.role)
              const rc          = ROLE_COLORS[displayRole] ?? { color: theme.colors.success, bg: theme.colors.successLight }
              const initial     = emp.nom?.trim()?.charAt(0)?.toUpperCase() || '?'
              const createdDate = emp.created_at
                ? new Date(emp.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'

              return (
                <motion.div
                  key={emp.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.045, 0.4) }}
                  whileHover={{ y: -4 }}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: isDark ? palette.glass : palette.card,
                    backdropFilter: isDark ? 'blur(20px)' : 'none',
                    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
                    border: `1px solid ${palette.cardBorder}`,
                    borderRadius: theme.radius.card,
                    padding: 22,
                    boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
                    transition: theme.transition.hover,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 1px ${rc.color}30, 0 14px 38px ${rc.color}1f` }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = isDark ? theme.shadow.premium : theme.shadow.sm }}
                >
                  {/* Lueur colorée */}
                  <div style={{ position: 'absolute', top: -36, right: -36, width: 120, height: 120, borderRadius: '50%', background: rc.color, opacity: isDark ? 0.10 : 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />

                  {/* Avatar + identité + badge rôle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${rc.color} 0%, ${rc.color}99 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, fontWeight: 800, color: '#fff',
                        boxShadow: `0 4px 16px ${rc.color}45`,
                      }}>
                        {initial}
                      </div>
                      <div style={{ minWidth: 0, paddingTop: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nom}</div>
                        <div style={{ fontSize: 11, color: palette.textSub, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{emp.email}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: rc.color, background: rc.bg, padding: '3px 10px', borderRadius: theme.radius.full, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {ROLE_LABELS[displayRole] || displayRole}
                    </span>
                  </div>

                  {/* Statut + ancienneté */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: config.showVentes ? 16 : 18, position: 'relative' }}>
                    <StatusBadge actif={emp.actif} />
                    <span style={{ fontSize: 11, color: palette.textMuted }}>Depuis {createdDate}</span>
                  </div>

                  {/* Stats (gérant uniquement) */}
                  {config.showVentes && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18, position: 'relative' }}>
                      <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '10px 14px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Ventes / jour</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono }}>{emp.nb_ventes_jour ?? 0}</div>
                      </div>
                      <div style={{ background: palette.hover, borderRadius: theme.radius.md, padding: '10px 14px', overflow: 'hidden' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Revenu généré</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.primary, fontFamily: theme.font.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatGNF(emp.total_ventes_jour ?? 0)}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {canManage && (
                    <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => handleToggle(emp.id)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '9px', borderRadius: theme.radius.button,
                          border: `1px solid ${(emp.actif ? theme.colors.warning : theme.colors.success)}30`,
                          background: emp.actif ? theme.colors.warningLight : theme.colors.successLight,
                          color: emp.actif ? theme.colors.warning : theme.colors.success,
                          cursor: 'pointer', fontFamily: theme.font.family, fontSize: 12, fontWeight: 700,
                          transition: theme.transition.hover,
                        }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d={emp.actif ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                        </svg>
                        {emp.actif ? 'Désactiver' : 'Activer'}
                      </motion.button>
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => setToDelete(emp)} title="Supprimer"
                        style={{
                          width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: theme.radius.button, border: `1px solid ${theme.colors.danger}30`,
                          background: theme.colors.dangerLight, color: theme.colors.danger, cursor: 'pointer',
                          transition: theme.transition.hover,
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .fuelo-employes { padding: 20px 16px !important; }
          .fuelo-grid-3   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 540px) {
          .fuelo-grid-3   { grid-template-columns: 1fr !important; }
          .fuelo-emp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
