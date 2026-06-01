// ================================================
// FUELO V2 — PompistePage
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { useStock }      from '../../hooks/useStock'
import { useVentes }     from '../../hooks/useVentes'
import { useParametres } from '../../hooks/useParametres'
import { useService }    from '../../hooks/useService'
import { useTheme }      from '../../context/ThemeContext'
import { formatGNF, formatLitres, formatRelative, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

const ORANGE = '#F59E0B'

// ── Durée écoulée depuis une date ─────────────────────
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`)
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [startedAt])
  return elapsed
}

// ── Modal service (démarrer / terminer) ──────────────
function ServiceModal({ mode, service, onClose, onSubmit, loading, isDark, palette }) {
  const [photo,             setPhoto]             = useState(null)
  const [preview,           setPreview]           = useState(null)
  const [compteurEssence,   setCompteurEssence]   = useState('')
  const [compteurGasoil,    setCompteurGasoil]    = useState('')
  const [errors,            setErrors]            = useState({})
  const fileRef = useRef()

  const isDemarrer = mode === 'demarrer'

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, photo: null }))
  }

  const validate = () => {
    const e = {}
    if (!photo) e.photo = 'La photo du compteur est obligatoire'
    if (!compteurEssence && !compteurGasoil) {
      e.compteurs = 'Saisissez au moins un relevé de compteur'
    }
    if (compteurEssence && isNaN(parseFloat(compteurEssence))) e.compteurEssence = 'Valeur invalide'
    if (compteurGasoil  && isNaN(parseFloat(compteurGasoil)))  e.compteurGasoil  = 'Valeur invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const fd = new FormData()
    fd.append('photo', photo)
    if (compteurEssence) fd.append(isDemarrer ? 'compteur_essence_debut' : 'compteur_essence_fin', compteurEssence)
    if (compteurGasoil)  fd.append(isDemarrer ? 'compteur_gasoil_debut'  : 'compteur_gasoil_fin',  compteurGasoil)
    onSubmit(fd)
  }

  const inputStyle = (hasError) => ({
    width: '100%', height: 52, background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
    border: `2px solid ${hasError ? theme.colors.danger : palette.cardBorder}`,
    borderRadius: 12, padding: '0 14px', fontSize: 22, fontWeight: 700,
    color: palette.text, fontFamily: theme.font.mono, outline: 'none',
    transition: 'all 0.2s', textAlign: 'center',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: '24px 24px 0 0',
        padding: '28px 20px 36px',
        width: '100%', maxWidth: 480,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
      }}>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 20px', opacity: 0.6 }} />

        {/* Titre */}
        <div style={{ fontSize: 17, fontWeight: 800, color: palette.text, marginBottom: 20, textAlign: 'center' }}>
          {isDemarrer ? '🟢 Démarrer mon service' : '🔴 Terminer mon service'}
        </div>

        {/* Photo compteur */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Photo du compteur {isDemarrer ? '(début)' : '(fin)'}
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handlePhoto} style={{ display: 'none' }} />

          {preview ? (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `2px solid ${theme.colors.success}` }}>
              <img src={preview} alt="compteur" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Changer
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: 100, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                border: `2px dashed ${errors.photo ? theme.colors.danger : palette.cardBorder}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: errors.photo ? theme.colors.danger : palette.textMuted, transition: 'all 0.2s',
              }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {errors.photo ? errors.photo : 'Prendre une photo'}
              </span>
            </button>
          )}
        </div>

        {/* Relevés compteurs */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Relevés compteurs (en litres)
          </div>

          {errors.compteurs && (
            <div style={{ fontSize: 11, color: theme.colors.danger, marginBottom: 8, textAlign: 'center' }}>
              {errors.compteurs}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '⛽ Essence', val: compteurEssence, set: setCompteurEssence, err: errors.compteurEssence },
              { label: '🛢️ Gasoil',  val: compteurGasoil,  set: setCompteurGasoil,  err: errors.compteurGasoil  },
            ].map(({ label, val, set, err }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5, textAlign: 'center' }}>{label}</div>
                <input
                  type="number" min="0" step="0.1" placeholder="0"
                  value={val}
                  onChange={e => { set(e.target.value); setErrors(prev => ({ ...prev, compteurs: null })) }}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
                  onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }}
                  style={inputStyle(!!err)}
                />
                {err && <div style={{ fontSize: 10, color: theme.colors.danger, marginTop: 3, textAlign: 'center' }}>{err}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Note si terminer */}
        {!isDemarrer && (
          <div style={{ fontSize: 11, color: palette.textSub, textAlign: 'center', marginBottom: 16, marginTop: 10, padding: '8px 12px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderRadius: 10, border: `1px solid rgba(245,158,11,0.2)` }}>
            Les compteurs sont comparés aux ventes enregistrées. Un écart &gt; 10L génère une alerte fraude.
          </div>
        )}

        {/* Bouton soumettre */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', height: 54, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0')
              : isDemarrer
                ? `linear-gradient(135deg, ${theme.colors.success}, #059669)`
                : `linear-gradient(135deg, ${theme.colors.danger}, #DC2626)`,
            fontSize: 15, fontWeight: 800, color: loading ? palette.textMuted : '#fff',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: loading ? 'none' : isDemarrer ? '0 6px 20px rgba(16,185,129,0.35)' : '0 6px 20px rgba(239,68,68,0.35)',
            transition: 'all 0.2s', marginTop: 4,
          }}>
          {loading
            ? <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : isDemarrer ? 'Démarrer le service' : 'Terminer et calculer l\'écart'
          }
        </button>

        <button onClick={onClose} disabled={loading}
          style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────
export default function PompistePage() {
  const { user, logout }                               = useAuth()
  const { essence, gasoil }                            = useStock()
  const { enregistrerVente, venteLoading, aujourdhui } = useVentes()
  const { parametres }                                 = useParametres()
  const { serviceActif, demarrer, demarrerLoading, terminer, terminerLoading } = useService()
  const { isDark, toggle, palette }                    = useTheme()

  const [type,      setType]      = useState('essence')
  const [litres,    setLitres]    = useState('')
  const [lastVente, setLastVente] = useState(null)
  const [errors,    setErrors]    = useState({})
  const [success,   setSuccess]   = useState(false)
  const [modal,     setModal]     = useState(null) // 'demarrer' | 'terminer' | null

  const elapsed = useElapsed(serviceActif?.started_at)

  const prixEssence = parseInt(parametres?.prix_essence) || 10000
  const prixGasoil  = parseInt(parametres?.prix_gasoil)  || 9000
  const prixLitre   = type === 'essence' ? prixEssence : prixGasoil
  const stock       = type === 'essence' ? essence : gasoil
  const litresNum   = parseFloat(litres) || 0
  const montantAuto = Math.round(litresNum * prixLitre)

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 4000)
      return () => clearTimeout(t)
    }
  }, [success])

  const validate = () => {
    const e = {}
    const l = parseFloat(litres)
    if (!l || l <= 0) e.litres = 'Entrez une quantité valide'
    if (l > stock)    e.litres = `Stock insuffisant (${formatLitres(stock)} dispo)`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleVente = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = await enregistrerVente({ type, litres: litresNum, montant_gnf: montantAuto })
    if (result) {
      setLastVente({ type, litres: litresNum, montant_gnf: montantAuto, created_at: new Date() })
      setLitres('')
      setErrors({})
      setSuccess(true)
    }
  }

  const handleDemarrer = async (formData) => {
    await demarrer(formData)
    setModal(null)
  }

  const handleTerminer = async (formData) => {
    if (!serviceActif) return
    await terminer({ id: serviceActif.id, formData })
    setModal(null)
  }

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>

      {/* Header */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill={ORANGE} opacity="0.6" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
            fuel<span style={{ color: ORANGE }}>o</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ORANGE }}>
              {(user?.nom || 'P').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{user?.nom}</span>
          </div>

          <button onClick={toggle}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark
                ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></>
                : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
            </svg>
            {isDark ? 'Jour' : 'Nuit'}
          </button>

          <button onClick={logout} style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px', gap: 14 }}>

        {/* ── Carte service ──────────────────────────── */}
        {serviceActif ? (
          // Service en cours
          <div style={{
            background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
            border: `2px solid rgba(16,185,129,0.3)`,
            borderRadius: theme.radius.lg, padding: '14px 18px',
            width: '100%', maxWidth: 480,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.colors.success, boxShadow: '0 0 8px rgba(16,185,129,0.6)', animation: 'pulse 2s infinite' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.colors.success }}>Service en cours</div>
                <div style={{ fontSize: 11, color: palette.textSub }}>Depuis {elapsed}</div>
              </div>
            </div>
            <button onClick={() => setModal('terminer')}
              style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: theme.colors.danger, color: '#fff', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              Terminer
            </button>
          </div>
        ) : (
          // Pas de service
          <div style={{
            background: palette.card, border: `1px solid ${palette.cardBorder}`,
            borderRadius: theme.radius.lg, padding: '14px 18px',
            width: '100%', maxWidth: 480,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            boxShadow: theme.shadow.sm,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: palette.cardBorder }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: palette.text }}>Aucun service actif</div>
                <div style={{ fontSize: 11, color: palette.textSub }}>Démarrez avant de vendre</div>
              </div>
            </div>
            <button onClick={() => setModal('demarrer')}
              style={{
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: theme.colors.success, color: '#fff', fontSize: 12, fontWeight: 700,
                fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(16,185,129,0.3)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              Démarrer
            </button>
          </div>
        )}

        {/* Stocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 480 }}>
          {[
            { label: 'Essence', qty: essence, prix: prixEssence },
            { label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
          ].map(({ label, qty, prix }) => {
            const st = getStockStatus(qty)
            return (
              <div key={label} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '12px 14px', boxShadow: theme.shadow.sm, transition: 'background 0.3s' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono, marginBottom: 3 }}>
                  {qty.toLocaleString('fr-FR')} <span style={{ fontSize: 11, fontWeight: 400, color: palette.textMuted }}>L</span>
                </div>
                <div style={{ fontSize: 11, color: theme.colors.primary, fontWeight: 600, marginBottom: 4 }}>{formatGNF(prix)} / L</div>
                <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', borderRadius: theme.radius.full, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {st.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Stats du jour */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '12px 20px', width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-around', boxShadow: theme.shadow.sm, transition: 'background 0.3s' }}>
          {[
            { label: 'Ventes', val: String(aujourdhui.nb ?? 0), emoji: '🛒' },
            { label: 'Litres',  val: formatLitres(aujourdhui.total_litres), emoji: '⛽' },
            { label: 'Montant', val: formatGNF(aujourdhui.total_gnf), emoji: '💰' },
          ].map(({ label, val, emoji }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono }}>{val}</div>
              <div style={{ fontSize: 9, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Formulaire vente */}
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 20, padding: '22px 20px', width: '100%', maxWidth: 480, boxShadow: theme.shadow.md, transition: 'background 0.3s' }}>

          <div style={{ fontSize: 14, fontWeight: 800, color: palette.text, marginBottom: 18, textAlign: 'center', letterSpacing: '-0.3px' }}>
            ⛽ Enregistrer une vente
          </div>

          <form onSubmit={handleVente}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { val: 'essence', emoji: '⛽', label: 'Essence', qty: essence, prix: prixEssence },
                { val: 'gasoil',  emoji: '🛢️', label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
              ].map(({ val, emoji, label, qty, prix }) => (
                <button key={val} type="button"
                  onClick={() => { setType(val); setLitres(''); setErrors({}) }}
                  style={{
                    padding: '14px 10px', borderRadius: 14,
                    border: `2.5px solid ${type === val ? theme.colors.primary : palette.cardBorder}`,
                    background: type === val
                      ? isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)'
                      : palette.inputBg,
                    cursor: 'pointer', fontFamily: theme.font.family,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.2s',
                    transform: type === val ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: type === val ? `0 4px 16px rgba(37,99,235,0.2)` : 'none',
                  }}>
                  <span style={{ fontSize: 26 }}>{emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: type === val ? 800 : 500, color: type === val ? theme.colors.primary : palette.text }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: type === val ? theme.colors.primary : palette.textMuted }}>{formatGNF(prix)} / L</span>
                  <span style={{ fontSize: 10, color: palette.textMuted }}>{formatLitres(qty)} dispo</span>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Quantité en litres
              </div>
              <input
                type="number" min="0.1" step="0.1" placeholder="0"
                value={litres}
                onChange={e => { setLitres(e.target.value); setErrors({}) }}
                onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
                onBlur={e  => { e.target.style.borderColor = errors.litres ? theme.colors.danger : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 70, background: palette.inputBg, border: `2px solid ${errors.litres ? theme.colors.danger : palette.cardBorder}`, borderRadius: 14, padding: '0 16px', fontSize: 36, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono, outline: 'none', transition: 'all 0.2s', textAlign: 'center', letterSpacing: '-1px' }}
              />
              {errors.litres && <div style={{ fontSize: 11, color: theme.colors.danger, marginTop: 4, textAlign: 'center' }}>{errors.litres}</div>}
            </div>

            <div style={{
              background: litresNum > 0 ? isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)' : palette.inputBg,
              border: `2px solid ${litresNum > 0 ? theme.colors.primary : palette.cardBorder}`,
              borderRadius: 14, padding: '14px', marginBottom: 18, textAlign: 'center', transition: 'all 0.3s',
              transform: litresNum > 0 ? 'scale(1.01)' : 'scale(1)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Montant à encaisser</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: litresNum > 0 ? theme.colors.primary : palette.textMuted, fontFamily: theme.font.mono, letterSpacing: '-1px', transition: 'all 0.3s' }}>
                {litresNum > 0 ? formatGNF(montantAuto) : '— GNF'}
              </div>
              {litresNum > 0 && (
                <div style={{ fontSize: 11, color: palette.textSub, marginTop: 5 }}>
                  {litresNum} L × {formatGNF(prixLitre)}
                </div>
              )}
            </div>

            <button type="submit" disabled={venteLoading || !litresNum}
              style={{
                width: '100%', height: 56,
                background: venteLoading || !litresNum
                  ? isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'
                  : `linear-gradient(135deg, ${theme.colors.primary}, #1D4ED8)`,
                border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800,
                color: venteLoading || !litresNum ? palette.textMuted : '#fff',
                cursor: venteLoading || !litresNum ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: theme.font.family,
                boxShadow: !litresNum ? 'none' : '0 6px 24px rgba(37,99,235,0.4)',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => { if (litresNum && !venteLoading) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.5)' }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = litresNum ? '0 6px 24px rgba(37,99,235,0.4)' : 'none' }}>
              {venteLoading
                ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              }
              {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
            </button>
          </form>
        </div>

        {/* Confirmation vente */}
        {success && lastVente && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '14px 18px', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 12, animation: 'slideUp 0.4s ease' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Vente enregistrée !</div>
              <div style={{ fontSize: 11, color: palette.textSub }}>
                {formatLitres(lastVente.litres)} {lastVente.type} · <strong style={{ color: theme.colors.primary }}>{formatGNF(lastVente.montant_gnf)}</strong> · {formatRelative(lastVente.created_at)}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal service */}
      {modal && (
        <ServiceModal
          mode={modal}
          service={serviceActif}
          onClose={() => setModal(null)}
          onSubmit={modal === 'demarrer' ? handleDemarrer : handleTerminer}
          loading={modal === 'demarrer' ? demarrerLoading : terminerLoading}
          isDark={isDark}
          palette={palette}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(16,185,129,0.6)} 50%{opacity:0.6;box-shadow:0 0 16px rgba(16,185,129,0.9)} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}
