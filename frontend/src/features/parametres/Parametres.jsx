// ================================================
// FUELO V2 — Paramètres avec theme dark/light
// Fichier : frontend/src/features/parametres/Parametres.jsx
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api          from '../../services/api'
import toast        from 'react-hot-toast'
import theme        from '../../config/theme'
import { useQueryClient } from '@tanstack/react-query'

const ICONS = {
  station: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  prix:    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  bell:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  check:   'M20 6L9 17l-5-5',
  save:    'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff:  'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
}

function SectionCard({ icon, title, desc, children, palette }) {
  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm, marginBottom: 20 }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: theme.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round"><path d={icon} /></svg>
        </div>
        <div>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text }}>{title}</div>
          {desc && <div style={{ fontSize: theme.font.size.xs, color: palette.textSub, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </div>
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
          style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${error ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.md, padding: suffix ? '0 60px 0 14px' : '0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
        />
        {suffix && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textMuted, pointerEvents: 'none' }}>{suffix}</span>}
      </div>
      {error  && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function SaveBtn({ loading, saved, label = 'Sauvegarder' }) {
  return (
    <button type="submit" disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: 'none', background: saved ? theme.colors.success : loading ? theme.colors.primaryDark : theme.colors.primary, color: '#fff', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.normal }}>
      {loading
        ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        : saved
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.check} /></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.save} /></svg>
      }
      {loading ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : label}
    </button>
  )
}

// ── Section logo station ──────────────────────────────
function LogoSection({ palette }) {
  const fileRef      = useRef()
  const queryClient  = useQueryClient()
  const [logoUrl,    setLogoUrl]    = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    api.get('/station').then(r => setLogoUrl(r.data.station?.logo_url ?? null)).catch(() => {})
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const { data } = await api.post('/station/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setLogoUrl(data.logo_url)
      setPreview(null)
      toast.success('Logo mis à jour')
      queryClient.invalidateQueries({ queryKey: ['parametres'] })
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur upload')
      setPreview(null)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete('/station/logo')
      setLogoUrl(null)
      toast.success('Logo supprimé')
      queryClient.invalidateQueries({ queryKey: ['parametres'] })
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur')
    } finally {
      setDeleting(false)
    }
  }

  const displayUrl = preview ?? logoUrl

  return (
    <SectionCard
      icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      title="Logo de la station"
      desc="Apparaît dans la sidebar, les exports PDF et Excel"
      palette={palette}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Aperçu */}
        <div style={{
          width: 80, height: 80, borderRadius: 14, overflow: 'hidden',
          border: `1.5px solid ${palette.cardBorder}`,
          background: palette.hover,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {displayUrl ? (
            <img src={displayUrl} alt="logo station" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '9px 18px', borderRadius: theme.radius.md, border: 'none',
              background: uploading ? palette.hover : theme.colors.primary,
              color: uploading ? palette.textMuted : '#fff',
              fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: theme.font.family, display: 'flex', alignItems: 'center', gap: 8,
              transition: theme.transition.fast,
            }}>
            {uploading
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            }
            {uploading ? 'Upload...' : logoUrl ? 'Changer le logo' : 'Uploader un logo'}
          </button>
          {logoUrl && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '7px 18px', borderRadius: theme.radius.md,
                border: `1px solid rgba(239,68,68,0.3)`,
                background: 'transparent', color: theme.colors.danger,
                fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                fontFamily: theme.font.family, transition: theme.transition.fast,
              }}>
              {deleting ? 'Suppression...' : 'Supprimer le logo'}
            </button>
          )}
          <div style={{ fontSize: 11, color: palette.textMuted }}>JPG, PNG · Max 5 Mo · Carré recommandé</div>
        </div>
      </div>
    </SectionCard>
  )
}

export default function Parametres() {
  const { user }    = useAuth()
  const { palette } = useTheme()
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

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }} className="fuelo-params">

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>Paramètres</h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>Gérez votre station et votre compte</p>
      </div>

      {/* Logo station — owner uniquement */}
      {isOwner && <LogoSection palette={palette} />}

      {/* Infos station */}
      <SectionCard icon={ICONS.station} title="Informations de la station" desc="Ces informations apparaissent sur vos rapports PDF" palette={palette}>
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
      <SectionCard icon={ICONS.prix} title="Prix des carburants" desc="Le pompiste verra ces prix — le montant sera calculé automatiquement" palette={palette}>
        <form onSubmit={handlePrixSave}>
          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: theme.font.size.sm, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💡</span>
            <span>Ces prix sont utilisés pour calculer automatiquement le montant quand le pompiste entre les litres.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="⛽ Prix Essence" type="number" value={prix.prix_essence} onChange={setP('prix_essence')} placeholder="10000" suffix="GNF/L" error={prixErrors.prix_essence} hint="Prix par litre d'essence" {...fieldProps} />
            <Field label="🛢️ Prix Gasoil"  type="number" value={prix.prix_gasoil}  onChange={setP('prix_gasoil')}  placeholder="9000"  suffix="GNF/L" error={prixErrors.prix_gasoil}  hint="Prix par litre de gasoil"  {...fieldProps} />
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
      <SectionCard icon={ICONS.bell} title="Seuils d'alerte stock" desc="Fuelo vous alerte automatiquement quand le stock descend sous ces valeurs" palette={palette}>
        <form onSubmit={handleSeuilSave}>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: theme.font.size.sm, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>En dessous de ces seuils, une alerte est déclenchée automatiquement.</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="⛽ Seuil Essence" type="number" value={seuils.seuil_essence} onChange={setQ('seuil_essence')} placeholder="300" suffix="Litres" hint="Recommandé : 300 L" {...fieldProps} />
            <Field label="🛢️ Seuil Gasoil"  type="number" value={seuils.seuil_gasoil}  onChange={setQ('seuil_gasoil')}  placeholder="300" suffix="Litres" hint="Recommandé : 300 L" {...fieldProps} />
          </div>
          <Field label="🚛 Seuil fraude citerne" type="number" value={seuils.seuil_fraude_citerne} onChange={setQ('seuil_fraude_citerne')} placeholder="50" suffix="Litres" hint="Alerte si écart départ/arrivée dépasse ce seuil" {...fieldProps} />
          <SaveBtn loading={seuilLoading} saved={seuilSaved} label="Enregistrer les seuils" />
        </form>
      </SectionCard>

      {/* Mot de passe */}
      <SectionCard icon={ICONS.lock} title="Changer le mot de passe" desc="Utilisez un mot de passe fort d'au moins 8 caractères" palette={palette}>
        <form onSubmit={handlePwdSave}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Mot de passe actuel</div>
            <div style={{ position: 'relative' }}>
              <input type={showPwd.actuel ? 'text' : 'password'} value={pwd.actuel} onChange={e => setW('actuel')(e.target.value)} placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e  => { e.target.style.borderColor = pwdErrors.actuel ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${pwdErrors.actuel ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.md, padding: '0 44px 0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
              />
              <button type="button" onClick={() => setShowPwd(s => ({ ...s, actuel: !s.actuel }))}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, display: 'flex', alignItems: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={showPwd.actuel ? ICONS.eyeOff : ICONS.eye} /></svg>
              </button>
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
                    style={{ width: '100%', height: 46, background: palette.inputBg, border: `1.5px solid ${pwdErrors[k] ? theme.colors.danger : palette.cardBorder}`, borderRadius: theme.radius.md, padding: '0 44px 0 14px', fontSize: theme.font.size.base, color: palette.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
                  />
                  <button type="button" onClick={() => setShowPwd(s => ({ ...s, [k]: !s[k] }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, display: 'flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={showPwd[k] ? ICONS.eyeOff : ICONS.eye} /></svg>
                  </button>
                </div>
                {pwdErrors[k] && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{pwdErrors[k]}</div>}
              </div>
            ))}
          </div>

          <button type="submit" disabled={pwdLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}`, background: palette.hover, color: palette.text, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, cursor: pwdLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, transition: theme.transition.fast }}
            onMouseEnter={e => { if (!pwdLoading) { e.currentTarget.style.background = theme.colors.primary; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = theme.colors.primary }}}
            onMouseLeave={e => { e.currentTarget.style.background = palette.hover; e.currentTarget.style.color = palette.text; e.currentTarget.style.borderColor = palette.cardBorder }}>
            {pwdLoading ? <div style={{ width: 16, height: 16, border: `2px solid ${palette.textSub}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.lock} /></svg>}
            {pwdLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </SectionCard>

      {/* Infos compte */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '18px 22px' }}>
        <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Informations du compte</div>
        {[
          ['Nom',   user?.nom],
          ['Email', user?.email],
          ['Rôle',  user?.role === 'owner' ? 'Propriétaire' : ['manager','gerant'].includes(user?.role) ? 'Gérant' : 'Pompiste'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${palette.cardBorder}` }}>
            <span style={{ fontSize: theme.font.size.sm, color: palette.textSub }}>{label}</span>
            <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: palette.text }}>{val ?? '—'}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) { .fuelo-params { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}