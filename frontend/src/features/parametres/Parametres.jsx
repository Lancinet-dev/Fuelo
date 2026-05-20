// ================================================
// FUELO V2 — Parametres
// Fichier : frontend/src/features/parametres/Parametres.jsx
// ================================================

import { useState, useEffect } from 'react'
import { useAuth }  from '../../context/AuthContext'
import api          from '../../services/api'
import toast        from 'react-hot-toast'
import theme        from '../../config/theme'

// ── Icônes ───────────────────────────────────────────
const ICONS = {
  station: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  lock:    'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  bell:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  check:   'M20 6L9 17l-5-5',
  save:    'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff:  'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22',
}

// ── Section card ──────────────────────────────────────
function SectionCard({ icon, title, desc, children }) {
  return (
    <div style={{ background: theme.colors.card, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm, marginBottom: 20 }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${theme.colors.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: theme.radius.md, background: theme.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round"><path d={icon} /></svg>
        </div>
        <div>
          <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: theme.colors.text }}>{title}</div>
          {desc && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textSub, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
      <div style={{ padding: '22px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Champ input ───────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, suffix, error, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
          onBlur={e  => { e.target.style.borderColor = error ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
          style={{ width: '100%', height: 46, background: '#F9FAFB', border: `1.5px solid ${error ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: suffix ? '0 50px 0 14px' : '0 14px', fontSize: theme.font.size.base, color: theme.colors.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textMuted, pointerEvents: 'none' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{error}</div>}
      {hint && !error && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.textMuted, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ── Parametres ────────────────────────────────────────
export default function Parametres() {
  const { user } = useAuth()

  // ── Station ───────────────────────────────────────
  const [station,        setStation]        = useState({ nom: '', adresse: '', ville: '', pays: '', seuil_essence: 300, seuil_gasoil: 300 })
  const [stationLoading, setStationLoading] = useState(false)
  const [stationSaved,   setStationSaved]   = useState(false)
  const [stationErrors,  setStationErrors]  = useState({})

  // ── Mot de passe ──────────────────────────────────
  const [pwd,       setPwd]       = useState({ actuel: '', nouveau: '', confirm: '' })
  const [showPwd,   setShowPwd]   = useState({ actuel: false, nouveau: false, confirm: false })
  const [pwdLoading,setPwdLoading] = useState(false)
  const [pwdErrors, setPwdErrors]  = useState({})

  // ── Charger infos station au démarrage ────────────
  useEffect(() => {
    api.get('/station')
      .then(res => {
        const s = res.data.station
        setStation({
          nom:           s.nom           ?? '',
          adresse:       s.adresse       ?? '',
          ville:         s.ville         ?? '',
          pays:          s.pays          ?? '',
          seuil_essence: s.seuil_essence ?? 300,
          seuil_gasoil:  s.seuil_gasoil  ?? 300,
        })
      })
      .catch(() => toast.error('Erreur chargement infos station'))
  }, [])

  // ── Sauvegarder station ───────────────────────────
  const handleStationSave = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!station.nom.trim()) errors.nom = 'Obligatoire'
    if (parseFloat(station.seuil_essence) <= 0) errors.seuil_essence = 'Doit être > 0'
    if (parseFloat(station.seuil_gasoil)  <= 0) errors.seuil_gasoil  = 'Doit être > 0'
    if (Object.keys(errors).length > 0) { setStationErrors(errors); return }

    setStationLoading(true)
    try {
      await api.put('/station', {
        nom:           station.nom,
        adresse:       station.adresse || null,
        ville:         station.ville   || null,
        pays:          station.pays    || null,
        seuil_essence: parseFloat(station.seuil_essence),
        seuil_gasoil:  parseFloat(station.seuil_gasoil),
      })
      toast.success('Station mise à jour')
      setStationSaved(true)
      setStationErrors({})
      setTimeout(() => setStationSaved(false), 3000)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur lors de la sauvegarde')
    } finally {
      setStationLoading(false)
    }
  }

  // ── Changer mot de passe ──────────────────────────
  const handlePwdSave = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!pwd.actuel)                   errors.actuel  = 'Obligatoire'
    if (pwd.nouveau.length < 6)        errors.nouveau = 'Minimum 6 caractères'
    if (pwd.nouveau !== pwd.confirm)   errors.confirm = 'Les mots de passe ne correspondent pas'
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return }

    setPwdLoading(true)
    try {
      await api.put('/auth/change-password', {
        mot_de_passe_actuel: pwd.actuel,
        nouveau_mot_de_passe: pwd.nouveau,
      })
      toast.success('Mot de passe modifié avec succès')
      setPwd({ actuel: '', nouveau: '', confirm: '' })
      setPwdErrors({})
    } catch (err) {
      const msg = err?.response?.data?.error ?? 'Erreur'
      if (msg.toLowerCase().includes('actuel') || msg.toLowerCase().includes('incorrect')) {
        setPwdErrors({ actuel: 'Mot de passe actuel incorrect' })
      } else {
        toast.error(msg)
      }
    } finally {
      setPwdLoading(false)
    }
  }

  const setS = (key) => (val) => {
    setStation(f => ({ ...f, [key]: val }))
    setStationErrors(e => ({ ...e, [key]: '' }))
  }

  const setP = (key) => (val) => {
    setPwd(f => ({ ...f, [key]: val }))
    setPwdErrors(e => ({ ...e, [key]: '' }))
  }

  const togglePwd = (key) => setShowPwd(s => ({ ...s, [key]: !s[key] }))

  return (
    <div style={{ padding: '32px 28px', maxWidth: 700, margin: '0 auto' }} className="fuelo-params">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: theme.colors.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          Paramètres
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: theme.colors.textSub, margin: 0 }}>
          Gérez les informations de votre station et votre compte
        </p>
      </div>

      {/* ── Infos station ─────────────────────────── */}
      <SectionCard icon={ICONS.station} title="Informations de la station" desc="Ces informations apparaissent sur vos rapports PDF">
        <form onSubmit={handleStationSave}>

          <Field label="Nom de la station" value={station.nom} onChange={setS('nom')} placeholder="Ex: Station Almamya" error={stationErrors.nom} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Ville" value={station.ville} onChange={setS('ville')} placeholder="Conakry" />
            <Field label="Pays"  value={station.pays}  onChange={setS('pays')}  placeholder="Guinée"  />
          </div>

          <Field label="Adresse complète" value={station.adresse} onChange={setS('adresse')} placeholder="Ex: Rue KA-020, Kaloum" hint="Optionnel — apparaît sur les rapports" />

          <button type="submit" disabled={stationLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: 'none', background: stationSaved ? theme.colors.success : stationLoading ? theme.colors.primaryDark : theme.colors.primary, color: stationSaved ? '#fff' : '#0F172A', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: stationLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.normal }}>
            {stationLoading
              ? <div style={{ width: 16, height: 16, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : stationSaved
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.check} /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.save} /></svg>
            }
            {stationLoading ? 'Sauvegarde...' : stationSaved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </form>
      </SectionCard>

      {/* ── Seuils alertes ────────────────────────── */}
      <SectionCard icon={ICONS.bell} title="Seuils d'alerte stock" desc="Fuelo vous alerte automatiquement quand le stock descend sous ces valeurs">
        <form onSubmit={handleStationSave}>
          <div style={{ background: '#FFFBEB', border: `1px solid rgba(245,158,11,0.25)`, borderRadius: theme.radius.md, padding: '12px 16px', marginBottom: 20, fontSize: theme.font.size.sm, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span>
            <span>En dessous de ces seuils, une alerte est déclenchée automatiquement.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Field
                label="⛽ Seuil Essence"
                type="number"
                value={station.seuil_essence}
                onChange={setS('seuil_essence')}
                placeholder="300"
                suffix="Litres"
                error={stationErrors.seuil_essence}
                hint="Recommandé : 300 L minimum"
              />
            </div>
            <div>
              <Field
                label="🛢️ Seuil Gasoil"
                type="number"
                value={station.seuil_gasoil}
                onChange={setS('seuil_gasoil')}
                placeholder="300"
                suffix="Litres"
                error={stationErrors.seuil_gasoil}
                hint="Recommandé : 300 L minimum"
              />
            </div>
          </div>

          <button type="submit" disabled={stationLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: 'none', background: stationSaved ? theme.colors.success : theme.colors.primary, color: stationSaved ? '#fff' : '#0F172A', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: stationLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.normal }}>
            {stationSaved
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d={ICONS.check} /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.save} /></svg>
            }
            {stationSaved ? 'Sauvegardé !' : 'Enregistrer les seuils'}
          </button>
        </form>
      </SectionCard>

      {/* ── Mot de passe ──────────────────────────── */}
      <SectionCard icon={ICONS.lock} title="Changer le mot de passe" desc="Utilisez un mot de passe fort d'au moins 8 caractères">
        <form onSubmit={handlePwdSave}>

          {/* Mot de passe actuel */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Mot de passe actuel
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.actuel ? 'text' : 'password'}
                value={pwd.actuel}
                onChange={e => setP('actuel')(e.target.value)}
                placeholder="••••••••"
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                onBlur={e  => { e.target.style.borderColor = pwdErrors.actuel ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 46, background: '#F9FAFB', border: `1.5px solid ${pwdErrors.actuel ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '0 44px 0 14px', fontSize: theme.font.size.base, color: theme.colors.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
              />
              <button type="button" onClick={() => togglePwd('actuel')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted, display: 'flex', alignItems: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={showPwd.actuel ? ICONS.eyeOff : ICONS.eye} />
                </svg>
              </button>
            </div>
            {pwdErrors.actuel && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{pwdErrors.actuel}</div>}
          </div>

          {/* Nouveau mot de passe */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 4 }}>
            {[
              { key: 'nouveau', label: 'Nouveau mot de passe' },
              { key: 'confirm', label: 'Confirmer le mot de passe' },
            ].map(({ key, label }) => (
              <div key={key}>
                <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd[key] ? 'text' : 'password'}
                    value={pwd[key]}
                    onChange={e => setP(key)(e.target.value)}
                    placeholder="••••••••"
                    onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                    onBlur={e  => { e.target.style.borderColor = pwdErrors[key] ? theme.colors.danger : theme.colors.cardBorder; e.target.style.boxShadow = 'none' }}
                    style={{ width: '100%', height: 46, background: '#F9FAFB', border: `1.5px solid ${pwdErrors[key] ? theme.colors.danger : theme.colors.cardBorder}`, borderRadius: theme.radius.md, padding: '0 44px 0 14px', fontSize: theme.font.size.base, color: theme.colors.text, fontFamily: theme.font.family, outline: 'none', transition: theme.transition.fast }}
                  />
                  <button type="button" onClick={() => togglePwd(key)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted, display: 'flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={showPwd[key] ? ICONS.eyeOff : ICONS.eye} />
                    </svg>
                  </button>
                </div>
                {pwdErrors[key] && <div style={{ fontSize: theme.font.size.xs, color: theme.colors.danger, marginTop: 4 }}>{pwdErrors[key]}</div>}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }} />

          <button type="submit" disabled={pwdLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: `1px solid ${theme.colors.cardBorder}`, background: '#F9FAFB', color: theme.colors.text, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, cursor: pwdLoading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, transition: theme.transition.fast }}
            onMouseEnter={e => { if (!pwdLoading) { e.currentTarget.style.background = theme.colors.primary; e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = theme.colors.primary }}}
            onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = theme.colors.text; e.currentTarget.style.borderColor = theme.colors.cardBorder }}
          >
            {pwdLoading
              ? <div style={{ width: 16, height: 16, border: `2px solid ${theme.colors.textSub}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.lock} /></svg>
            }
            {pwdLoading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </SectionCard>

      {/* ── Infos compte ──────────────────────────── */}
      <div style={{ background: '#F9FAFB', border: `1px solid ${theme.colors.cardBorder}`, borderRadius: theme.radius.lg, padding: '18px 22px' }}>
        <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: theme.colors.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Informations du compte
        </div>
        {[
          ['Nom',    user?.nom],
          ['Email',  user?.email],
          ['Rôle',   user?.role === 'owner' ? 'Propriétaire' : user?.role === 'manager' ? 'Gérant' : 'Pompiste'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${theme.colors.cardBorder}` }}>
            <span style={{ fontSize: theme.font.size.sm, color: theme.colors.textSub }}>{label}</span>
            <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: theme.colors.text }}>{val ?? '—'}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: theme.font.size.xs, color: theme.colors.textMuted }}>
          Pour modifier votre nom ou email, contactez le support.
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .fuelo-params { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  )
}