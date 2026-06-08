// ================================================
// FUELO V2.3 — Paramètres premium (sections glassmorphism)
// Fichier : frontend/src/features/parametres/Parametres.jsx
// ================================================

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParametres } from '../../hooks/useParametres'
import { useLogoUpload } from '../../hooks/useLogoUpload'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api          from '../../services/api'
import toast        from 'react-hot-toast'
import theme        from '../../config/theme'

const ICONS = {
  station: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  prix:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  bell:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  check:   'M20 6L9 17l-5-5',
  save:    'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff:  'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
  logo:    'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
}

function SectionCard({ icon, title, desc, children, palette, isDark, color = theme.colors.primary, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{
        background:   isDark ? palette.glass : palette.card,
        backdropFilter: isDark ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
        border:       `1px solid ${palette.cardBorder}`,
        borderRadius: theme.radius.card,
        overflow:     'hidden',
        boxShadow:    isDark ? theme.shadow.premium : theme.shadow.sm,
        marginBottom: 20,
      }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${color}15`, backdropFilter: 'blur(12px)', border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d={icon} /></svg>
        </div>
        <div>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text }}>{title}</div>
          {desc && <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </motion.div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, suffix, error, hint, palette }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
          onBlur={e  => { e.target.style.borderColor = error ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
          style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${error ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.button, padding: suffix ? '0 60px 0 14px' : '0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.hover, boxSizing: 'border-box' }}
        />
        {suffix && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textMuted, pointerEvents: 'none' }}>{suffix}</span>}
      </div>
      {error  && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ── Bouton-bascule animé (afficher/masquer mot de passe) ──
function PwdToggle({ visible, onToggle, palette }) {
  return (
    <motion.button type="button" onClick={onToggle} whileTap={{ scale: 0.82 }}
      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, borderRadius: theme.radius.full, overflow: 'hidden' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={visible ? 'on' : 'off'}
          initial={{ opacity: 0, rotate: -55, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 55, scale: 0.5 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d={visible ? ICONS.eyeOff : ICONS.eye} />
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  )
}

// ── Bouton de sauvegarde animé (idle / loading / sauvegardé) ──
function SaveBtn({ loading, saved, label = 'Sauvegarder' }) {
  return (
    <motion.button type="submit" disabled={loading} whileHover={{ y: loading ? 0 : -2 }} whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.button, border: 'none',
        background: saved ? theme.colors.success : loading ? theme.colors.primaryDark : theme.colors.primary,
        color: '#fff', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold,
        cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family,
        boxShadow: saved ? theme.shadow.glow(theme.colors.success) : theme.shadow.primary,
        transition: theme.transition.normal,
      }}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : saved ? (
          <motion.svg key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 480, damping: 22 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.check} /></motion.svg>
        ) : (
          <motion.svg key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.save} /></motion.svg>
        )}
      </AnimatePresence>
      {loading ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : label}
    </motion.button>
  )
}

// ── Section logo station ──────────────────────────────
function LogoSection({ palette, isDark, delay }) {
  const fileRef = useRef()
  const [preview, setPreview] = useState(null)

  // Source unique de vérité — même cache que la sidebar
  const { parametres } = useParametres()
  const logoUrl = parametres?.logo_url ?? null

  const { uploadLogo, uploading, deleteLogo, deleting } = useLogoUpload()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    try {
      await uploadLogo(file)
    } catch { /* erreur déjà affichée par useLogoUpload */ }
    setPreview(null)
    e.target.value = ''
  }

  const handleDelete = async () => {
    try { await deleteLogo() } catch { /* erreur déjà affichée par useLogoUpload */ }
  }

  const displayUrl = preview ?? logoUrl

  return (
    <SectionCard
      icon={ICONS.logo}
      title="Logo de la station"
      desc="Apparaît dans la sidebar, les exports PDF et Excel"
      palette={palette} isDark={isDark} delay={delay}
      color={theme.colors.info}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Aperçu */}
        <div style={{
          width: 80, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative',
          border: `1.5px solid ${palette.cardBorder}`,
          background: palette.hover,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: displayUrl ? `0 0 0 1px ${theme.colors.info}25, 0 6px 20px ${theme.colors.info}1a` : 'none',
        }}>
          <AnimatePresence mode="wait">
            {displayUrl ? (
              <motion.img key={displayUrl} src={displayUrl} alt="logo station"
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <motion.svg key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="1.5" strokeLinecap="round">
                <path d={ICONS.logo} />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <motion.button
            whileHover={{ y: uploading ? 0 : -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '9px 18px', borderRadius: theme.radius.button, border: 'none',
              background: uploading ? palette.hover : theme.colors.primary,
              color: uploading ? palette.textMuted : '#fff',
              fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: uploading ? 'none' : theme.shadow.primary,
              transition: theme.transition.hover,
            }}>
            {uploading
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            }
            {uploading ? 'Upload...' : logoUrl ? 'Changer le logo' : 'Uploader un logo'}
          </motion.button>
          {logoUrl && (
            <motion.button
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '7px 18px', borderRadius: theme.radius.button,
                border: `1px solid ${theme.colors.danger}30`,
                background: theme.colors.dangerLight, color: theme.colors.danger,
                fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: theme.font.family, transition: theme.transition.hover,
              }}>
              {deleting ? 'Suppression...' : 'Supprimer le logo'}
            </motion.button>
          )}
          <div style={{ fontSize: 11, color: palette.textMuted }}>JPG, PNG · Max 5 Mo · Carré recommandé</div>
        </div>
      </div>
    </SectionCard>
  )
}

export default function Parametres() {
  const { user }    = useAuth()
  const { palette, isDark } = useTheme()
  const isOwner     = user?.role === 'owner'

  const [station,        setStation]        = useState({ nom: '', adresse: '', ville: '', pays: '' })
  const [prix,           setPrix]           = useState({ prix_essence: 10000, prix_gasoil: 9000 })
  const [seuils,         setSeuils]         = useState({ seuil_essence: 300, seuil_gasoil: 300, seuil_fraude_citerne: 50 })
  const [stationLoading, setStationLoading] = useState(false)
  const [prixLoading,    setPrixLoading]    = useState(false)
  const [seuilLoading,   setSeuilLoading]   = useState(false)
  const [stationSaved,   setStationSaved]   = useState(false)
  const [prixSaved,      setPrixSaved]      = useState(false)
  const [seuilSaved,     setSeuilSaved]     = useState(false)
  const [stationErrors,  setStationErrors]  = useState({})
  const [prixErrors,     setPrixErrors]     = useState({})
  const [pwd,            setPwd]            = useState({ actuel: '', nouveau: '', confirm: '' })
  const [showPwd,        setShowPwd]        = useState({ actuel: false, nouveau: false, confirm: false })
  const [pwdLoading,     setPwdLoading]     = useState(false)
  const [pwdErrors,      setPwdErrors]      = useState({})
  useEffect(() => {
    api.get('/station')
      .then(res => {
        const s = res.data.station
        setStation({ nom: s.nom ?? '', adresse: s.adresse ?? '', ville: s.ville ?? '', pays: s.pays ?? '' })
        setPrix({ prix_essence: s.prix_essence ?? 10000, prix_gasoil: s.prix_gasoil ?? 9000 })
        setSeuils({ seuil_essence: s.seuil_essence ?? 300, seuil_gasoil: s.seuil_gasoil ?? 300, seuil_fraude_citerne: s.seuil_fraude_citerne ?? 50 })
      })
      .catch(() => toast.error('Erreur chargement infos station'))
  }, [])

  const savedFn = (fn) => { fn(true); setTimeout(() => fn(false), 3000) }

  const handleStationSave = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!station.nom.trim()) errors.nom = 'Obligatoire'
    if (Object.keys(errors).length > 0) { setStationErrors(errors); return }
    setStationLoading(true)
    try {
      await api.put('/station', { ...station })
      toast.success('Infos station mises à jour')
      setStationErrors({})
      savedFn(setStationSaved)
    } catch (err) { toast.error(err?.response?.data?.error ?? 'Erreur') }
    finally { setStationLoading(false) }
  }

  const handlePrixSave = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!prix.prix_essence || prix.prix_essence <= 0) errors.prix_essence = 'Prix invalide'
    if (!prix.prix_gasoil  || prix.prix_gasoil  <= 0) errors.prix_gasoil  = 'Prix invalide'
    if (Object.keys(errors).length > 0) { setPrixErrors(errors); return }
    setPrixLoading(true)
    try {
      await api.put('/station', { prix_essence: parseInt(prix.prix_essence), prix_gasoil: parseInt(prix.prix_gasoil) })
      toast.success('Prix des carburants mis à jour')
      setPrixErrors({})
      savedFn(setPrixSaved)
    } catch (err) { toast.error(err?.response?.data?.error ?? 'Erreur') }
    finally { setPrixLoading(false) }
  }

  const handleSeuilSave = async (e) => {
    e.preventDefault()
    setSeuilLoading(true)
    try {
      await api.put('/station', {
        seuil_essence:        parseInt(seuils.seuil_essence),
        seuil_gasoil:         parseInt(seuils.seuil_gasoil),
        seuil_fraude_citerne: parseInt(seuils.seuil_fraude_citerne),
      })
      toast.success("Seuils d'alerte mis à jour")
      savedFn(setSeuilSaved)
    } catch (err) { toast.error(err?.response?.data?.error ?? 'Erreur') }
    finally { setSeuilLoading(false) }
  }

const handlePwdSave = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!pwd.actuel)                 errors.actuel  = 'Obligatoire'
    if (pwd.nouveau.length < 6)      errors.nouveau = 'Minimum 6 caractères'
    if (pwd.nouveau !== pwd.confirm) errors.confirm = 'Ne correspondent pas'
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return }
    setPwdLoading(true)
    try {
      await api.put('/auth/change-password', { mot_de_passe_actuel: pwd.actuel, nouveau_mot_de_passe: pwd.nouveau })
      toast.success('Mot de passe modifié ✅')
      setPwd({ actuel: '', nouveau: '', confirm: '' })
      setPwdErrors({})
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Erreur'
      if (msg.toLowerCase().includes('actuel') || msg.toLowerCase().includes('incorrect')) {
        setPwdErrors({ actuel: 'Mot de passe actuel incorrect' })
      } else { toast.error(msg) }
    } finally { setPwdLoading(false) }
  }

  const setS = (k) => (v) => { setStation(f => ({ ...f, [k]: v })); setStationErrors(e => ({ ...e, [k]: '' })) }
  const setP = (k) => (v) => { setPrix(f => ({ ...f, [k]: v })); setPrixErrors(e => ({ ...e, [k]: '' })) }
  const setQ = (k) => (v) => setSeuils(f => ({ ...f, [k]: v }))
  const setW = (k) => (v) => { setPwd(f => ({ ...f, [k]: v })); setPwdErrors(e => ({ ...e, [k]: '' })) }

  const fieldProps = { palette }

  // Délais de stagger — la section logo n'existe que pour l'owner
  const dLogo    = 0
  const dStation = isOwner ? 0.06 : 0
  const dPrix    = isOwner ? 0.12 : 0.06
  const dSeuils  = isOwner ? 0.18 : 0.12
  const dPwd     = isOwner ? 0.24 : 0.18
  const dCompte  = isOwner ? 0.30 : 0.24

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }} className="fuelo-params">

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Paramètres</h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>Gérez votre station et votre compte</p>
      </motion.div>

      {/* Logo station — owner uniquement */}
      {isOwner && <LogoSection palette={palette} isDark={isDark} delay={dLogo} />}

      {/* Infos station */}
      <SectionCard icon={ICONS.station} title="Informations de la station" desc="Ces informations apparaissent sur vos rapports PDF" palette={palette} isDark={isDark} delay={dStation} color={theme.colors.primary}>
        <form onSubmit={handleStationSave}>
          <Field label="Nom de la station" value={station.nom} onChange={setS('nom')} placeholder="Ex: Station Almamya" error={stationErrors.nom} {...fieldProps} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Ville" value={station.ville} onChange={setS('ville')} placeholder="Conakry" {...fieldProps} />
            <Field label="Pays"  value={station.pays}  onChange={setS('pays')}  placeholder="Guinée"  {...fieldProps} />
          </div>
          <Field label="Adresse" value={station.adresse} onChange={setS('adresse')} placeholder="Ex: Rue KA-020, Kaloum" hint="Optionnel" {...fieldProps} />
          <SaveBtn loading={stationLoading} saved={stationSaved} />
        </form>
      </SectionCard>

      {/* Prix carburants */}
      <SectionCard icon={ICONS.prix} title="Prix des carburants" desc="Le pompiste verra ces prix — le montant sera calculé automatiquement" palette={palette} isDark={isDark} delay={dPrix} color={theme.colors.success}>
        <form onSubmit={handlePrixSave}>
          <div style={{ background: `${theme.colors.info}12`, border: `1px solid ${theme.colors.info}28`, borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: theme.font.size.sm, color: theme.colors.info, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.info} strokeWidth="2" strokeLinecap="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>
            <span>Ces prix sont utilisés pour calculer automatiquement le montant quand le pompiste entre les litres.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Prix Essence" type="number" value={prix.prix_essence} onChange={setP('prix_essence')} placeholder="10000" suffix="GNF/L" error={prixErrors.prix_essence} hint="Prix par litre d'essence" {...fieldProps} />
            <Field label="Prix Gasoil"  type="number" value={prix.prix_gasoil}  onChange={setP('prix_gasoil')}  placeholder="9000"  suffix="GNF/L" error={prixErrors.prix_gasoil}  hint="Prix par litre de gasoil"  {...fieldProps} />
          </div>
          <div style={{ background: palette.hover, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 4 }}>50L d'essence =</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.primary, fontFamily: theme.font.mono }}>{(parseInt(prix.prix_essence) * 50).toLocaleString('fr-FR')} GNF</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 4 }}>50L de gasoil =</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.colors.primary, fontFamily: theme.font.mono }}>{(parseInt(prix.prix_gasoil) * 50).toLocaleString('fr-FR')} GNF</div>
            </div>
          </div>
          <SaveBtn loading={prixLoading} saved={prixSaved} label="Mettre à jour les prix" />
        </form>
      </SectionCard>

      {/* Seuils alertes */}
      <SectionCard icon={ICONS.bell} title="Seuils d'alerte stock" desc="Fuelo vous alerte automatiquement quand le stock descend sous ces valeurs" palette={palette} isDark={isDark} delay={dSeuils} color={theme.colors.warning}>
        <form onSubmit={handleSeuilSave}>
          <div style={{ background: `${theme.colors.warning}12`, border: `1px solid ${theme.colors.warning}28`, borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: theme.font.size.sm, color: theme.colors.warning, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>En dessous de ces seuils, une alerte est déclenchée automatiquement.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Seuil Essence" type="number" value={seuils.seuil_essence} onChange={setQ('seuil_essence')} placeholder="300" suffix="Litres" hint="Recommandé : 300 L" {...fieldProps} />
            <Field label="Seuil Gasoil"  type="number" value={seuils.seuil_gasoil}  onChange={setQ('seuil_gasoil')}  placeholder="300" suffix="Litres" hint="Recommandé : 300 L" {...fieldProps} />
          </div>
          <Field label="Seuil fraude citerne" type="number" value={seuils.seuil_fraude_citerne} onChange={setQ('seuil_fraude_citerne')} placeholder="50" suffix="Litres" hint="Alerte si écart départ/arrivée dépasse ce seuil" {...fieldProps} />
          <SaveBtn loading={seuilLoading} saved={seuilSaved} label="Enregistrer les seuils" />
        </form>
      </SectionCard>

      {/* Mot de passe */}
      <SectionCard icon={ICONS.lock} title="Changer le mot de passe" desc="Utilisez un mot de passe fort d'au moins 8 caractères" palette={palette} isDark={isDark} delay={dPwd} color={theme.colors.danger}>
        <form onSubmit={handlePwdSave}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe actuel</div>
            <div style={{ position: 'relative' }}>
              <input type={showPwd.actuel ? 'text' : 'password'} value={pwd.actuel} onChange={e => setW('actuel')(e.target.value)} placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e  => { e.target.style.borderColor = pwdErrors.actuel ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${pwdErrors.actuel ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.button, padding: '0 46px 0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.hover, boxSizing: 'border-box' }}
              />
              <PwdToggle visible={showPwd.actuel} onToggle={() => setShowPwd(s => ({ ...s, actuel: !s.actuel }))} palette={palette} />
            </div>
            {pwdErrors.actuel && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{pwdErrors.actuel}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[{ k: 'nouveau', label: 'Nouveau mot de passe' }, { k: 'confirm', label: 'Confirmer' }].map(({ k, label }) => (
              <div key={k}>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd[k] ? 'text' : 'password'} value={pwd[k]} onChange={e => setW(k)(e.target.value)} placeholder="••••••••"
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                    onBlur={e  => { e.target.style.borderColor = pwdErrors[k] ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${pwdErrors[k] ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.button, padding: '0 46px 0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.hover, boxSizing: 'border-box' }}
                  />
                  <PwdToggle visible={showPwd[k]} onToggle={() => setShowPwd(s => ({ ...s, [k]: !s[k] }))} palette={palette} />
                </div>
                {pwdErrors[k] && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{pwdErrors[k]}</div>}
              </div>
            ))}
          </div>

          <motion.button type="submit" disabled={pwdLoading} whileHover={{ y: pwdLoading ? 0 : -2 }} whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.button, border: `1px solid ${theme.colors.danger}30`, background: theme.colors.dangerLight, color: theme.colors.danger, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, cursor: pwdLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, transition: theme.transition.hover }}>
            {pwdLoading ? <div style={{ width: 16, height: 16, border: `2px solid ${theme.colors.danger}40`, borderTopColor: theme.colors.danger, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.lock} /></svg>}
            {pwdLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </motion.button>
        </form>
      </SectionCard>

      {/* Infos compte */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: dCompte }}
        style={{
          background:   isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
          border:       `1px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.card,
          padding:      '18px 22px',
          boxShadow:    isDark ? theme.shadow.premium : theme.shadow.sm,
        }}>
        <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Informations du compte</div>
        {[
          ['Nom',   user?.nom],
          ['Email', user?.email],
          ['Rôle',  user?.role === 'owner' ? 'Propriétaire' : ['manager','gerant'].includes(user?.role) ? 'Gérant' : 'Pompiste'],
        ].map(([label, val], i, arr) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${palette.cardBorder}` : 'none' }}>
            <span style={{ fontSize: theme.font.size.sm, color: palette.textSub }}>{label}</span>
            <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: palette.text }}>{val ?? '—'}</span>
          </div>
        ))}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) { .fuelo-params { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}
