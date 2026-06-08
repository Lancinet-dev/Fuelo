// ================================================
// FUELO — PompistePage (anti-fraude renforcé)
// ================================================

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth }       from '../../context/AuthContext'
import { useStock }      from '../../hooks/useStock'
import { useVentes }     from '../../hooks/useVentes'
import { useParametres } from '../../hooks/useParametres'
import { useService }    from '../../hooks/useService'
import { useTheme }      from '../../context/ThemeContext'
import { formatGNF, formatLitres, getStockStatus } from '../../utils/format'
import theme from '../../config/theme'

const ORANGE = '#F59E0B'
const GREEN  = '#10B981'
const BLUE   = '#2563EB'
const RED    = '#EF4444'

// ── Timer en cours de service ─────────────────────
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000)
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      setElapsed(h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`)
    }
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [startedAt])
  return elapsed
}

// ── Modal service (démarrer / terminer) ──────────
function ServiceModal({ mode, onClose, onSubmit, loading, isDark, palette }) {
  const [photo,           setPhoto]           = useState(null)
  const [compteurEssence, setCompteurEssence] = useState('')
  const [compteurGasoil,  setCompteurGasoil]  = useState('')
  const [errors,          setErrors]          = useState({})
  const fileRef = useRef()

  const isDemarrer = mode === 'demarrer'

  // Mémoïsée sur `photo` — et révoquée au changement/démontage (sinon fuite
  // mémoire à chaque nouvelle prise de photo)
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setErrors(p => ({ ...p, photo: null }))
  }

  const validate = () => {
    const e = {}
    if (!photo) e.photo = 'Photo obligatoire'
    if (!compteurEssence && !compteurGasoil) e.compteurs = 'Saisissez au moins un relevé'
    if (compteurEssence && isNaN(parseFloat(compteurEssence))) e.compteurEssence = 'Invalide'
    if (compteurGasoil  && isNaN(parseFloat(compteurGasoil)))  e.compteurGasoil  = 'Invalide'
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

  const counterStyle = (err) => ({
    width: '100%', height: 58, boxSizing: 'border-box',
    background: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
    border: `2px solid ${err ? RED : palette.cardBorder}`,
    borderRadius: 14, padding: '0 14px',
    fontSize: 26, fontWeight: 800, fontFamily: theme.font.mono,
    color: palette.text, outline: 'none', textAlign: 'center',
    transition: 'all 0.2s',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px 44px',
        width: '100%', maxWidth: 480,
        boxShadow: '0 -12px 48px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ width: 44, height: 5, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 22px', opacity: 0.5 }} />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{isDemarrer ? '🟢' : '🔴'}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: palette.text, letterSpacing: '-0.3px' }}>
            {isDemarrer ? 'Démarrer mon service' : 'Terminer mon service'}
          </div>
          {!isDemarrer && (
            <div style={{ fontSize: 12, color: palette.textSub, marginTop: 6 }}>
              Photo + relevé obligatoires pour valider
            </div>
          )}
        </div>

        {/* Photo compteur */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            📷 Photo du compteur {isDemarrer ? '(début)' : '(fin)'}
            <span style={{ color: RED }}> *</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
          {preview ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `2px solid ${GREEN}` }}>
              <img src={preview} alt="compteur" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Changer
              </button>
              <div style={{ position: 'absolute', top: 8, left: 8, background: GREEN, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>✓ Photo prise</div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={{
              width: '100%', height: 120, borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit',
              border: `2px dashed ${errors.photo ? RED : palette.cardBorder}`,
              background: errors.photo
                ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)')
                : (isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB'),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: errors.photo ? RED : palette.textMuted, transition: 'all 0.2s',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {errors.photo ? '⚠️ ' + errors.photo : 'Appuyer pour prendre la photo'}
              </span>
              <span style={{ fontSize: 11, color: palette.textMuted }}>Obligatoire</span>
            </button>
          )}
        </div>

        {/* Relevés compteurs */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            🔢 Relevés compteurs (litres)<span style={{ color: RED }}> *</span>
          </div>
          {errors.compteurs && (
            <div style={{ fontSize: 11, color: RED, marginBottom: 8, textAlign: 'center', fontWeight: 600 }}>{errors.compteurs}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '⛽ Essence', val: compteurEssence, set: setCompteurEssence, err: errors.compteurEssence },
              { label: '🛢️ Gasoil',  val: compteurGasoil,  set: setCompteurGasoil,  err: errors.compteurGasoil  },
            ].map(({ label, val, set, err }) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: palette.textSub, marginBottom: 6, textAlign: 'center' }}>{label}</div>
                <input
                  type="number" min="0" step="0.1" placeholder="0"
                  value={val}
                  onChange={e => { set(e.target.value); setErrors(p => ({ ...p, compteurs: null })) }}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.15)` }}
                  onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }}
                  style={counterStyle(!!err)}
                />
                {err && <div style={{ fontSize: 10, color: RED, marginTop: 3, textAlign: 'center' }}>{err}</div>}
              </div>
            ))}
          </div>
        </div>

        {!isDemarrer && (
          <div style={{ fontSize: 12, color: ORANGE, textAlign: 'center', margin: '14px 0', padding: '10px 14px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600 }}>
            ⚠️ Un écart &gt; 10L génère une alerte fraude automatique
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', height: 58, borderRadius: 16, border: 'none', marginTop: 4,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          background: loading
            ? (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0')
            : isDemarrer
              ? `linear-gradient(135deg, ${GREEN}, #059669)`
              : `linear-gradient(135deg, ${RED}, #DC2626)`,
          fontSize: 15, fontWeight: 800, color: loading ? palette.textMuted : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: loading ? 'none' : isDemarrer ? `0 8px 24px rgba(16,185,129,0.4)` : `0 8px 24px rgba(239,68,68,0.4)`,
          transition: 'all 0.2s',
        }}>
          {loading
            ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : null
          }
          {loading ? 'Enregistrement...' : isDemarrer ? '▶ Démarrer le service' : '⏹ Terminer et calculer l\'écart'}
        </button>
        <button onClick={onClose} disabled={loading} style={{ display: 'block', width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: palette.textMuted, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Modal résumé fin de service ───────────────────
function ResumeModal({ data, onClose, isDark, palette }) {
  const { service, ventes, alerte_fraude } = data

  const hasEssence = service.compteur_essence_debut != null && service.compteur_essence_fin != null
  const hasGasoil  = service.compteur_gasoil_debut  != null && service.compteur_gasoil_fin  != null

  const carburants = [
    hasEssence && {
      label:     'Essence ⛽',
      app:       parseFloat(ventes.essence  ?? 0),
      conso:     parseFloat(service.compteur_essence_fin) - parseFloat(service.compteur_essence_debut),
      ecart:     parseFloat(service.ecart_essence ?? 0),
    },
    hasGasoil && {
      label:     'Gasoil 🛢️',
      app:       parseFloat(ventes.gasoil   ?? 0),
      conso:     parseFloat(service.compteur_gasoil_fin)  - parseFloat(service.compteur_gasoil_debut),
      ecart:     parseFloat(service.ecart_gasoil  ?? 0),
    },
  ].filter(Boolean)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: isDark ? '#0D1B2A' : '#fff',
        borderRadius: '28px 28px 0 0',
        padding: '12px 20px 48px',
        width: '100%', maxWidth: 480,
        boxShadow: '0 -12px 48px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ width: 44, height: 5, background: palette.cardBorder, borderRadius: 99, margin: '0 auto 20px', opacity: 0.5 }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            {alerte_fraude
              ? <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              : <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
          </div>
          <div style={{ fontSize: 21, fontWeight: 900, color: alerte_fraude ? RED : GREEN, letterSpacing: '-0.4px' }}>
            {alerte_fraude ? 'Alerte fraude détectée' : 'Service terminé'}
          </div>
          {alerte_fraude && (
            <div style={{ fontSize: 13, color: palette.textSub, marginTop: 8, lineHeight: 1.6, maxWidth: 280, margin: '8px auto 0' }}>
              Un écart anormal a été détecté. Le gérant et le propriétaire ont été notifiés.
            </div>
          )}
          {!alerte_fraude && (
            <div style={{ fontSize: 13, color: palette.textSub, marginTop: 6 }}>
              Tous les relevés sont conformes
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>
          Récapitulatif
        </div>

        {/* Carburants */}
        {carburants.map((c) => {
          const aFraudeType = Math.abs(c.ecart) > 10
          const ecartColor  = aFraudeType ? RED : GREEN

          return (
            <div key={c.label} style={{
              border: `1.5px solid ${aFraudeType ? RED + '50' : palette.cardBorder}`,
              borderRadius: 18, padding: '18px 16px', marginBottom: 14,
              background: aFraudeType
                ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)')
                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: palette.text, marginBottom: 16 }}>{c.label}</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {/* App */}
                <div style={{ textAlign: 'center', background: isDark ? 'rgba(37,99,235,0.10)' : 'rgba(37,99,235,0.06)', borderRadius: 12, padding: '14px 10px' }}>
                  <div style={{ fontSize: 10, color: palette.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Vendus (app)</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: BLUE, fontFamily: theme.font.mono, letterSpacing: '-1px' }}>
                    {c.app.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>litres</div>
                </div>
                {/* Compteur */}
                <div style={{ textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '14px 10px' }}>
                  <div style={{ fontSize: 10, color: palette.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Compteur</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, letterSpacing: '-1px' }}>
                    {c.conso.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>litres</div>
                </div>
              </div>

              {/* Écart */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 12,
                background: aFraudeType
                  ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
                  : (isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.07)'),
                border: `1px solid ${ecartColor}25`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: ecartColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                  Écart
                  {aFraudeType
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ecartColor} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ecartColor} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  }
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: ecartColor, fontFamily: theme.font.mono }}>
                  {c.ecart > 0 ? '+' : ''}{c.ecart.toFixed(1)} L
                </span>
              </div>
            </div>
          )
        })}

        {/* Statut global */}
        <div style={{
          textAlign: 'center', padding: '16px',
          borderRadius: 16, marginBottom: 20,
          background: alerte_fraude
            ? (isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)')
            : (isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)'),
          border: `1.5px solid ${alerte_fraude ? RED + '40' : GREEN + '40'}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: alerte_fraude ? RED : GREEN }}>
            {alerte_fraude ? '🚨 Fraude potentielle' : '✅ Tout est normal'}
          </div>
        </div>

        <button onClick={onClose} style={{
          width: '100%', height: 58, borderRadius: 18, border: 'none',
          background: alerte_fraude
            ? `linear-gradient(135deg, ${RED}, #DC2626)`
            : `linear-gradient(135deg, ${GREEN}, #059669)`,
          color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: alerte_fraude ? '0 8px 24px rgba(239,68,68,0.4)' : '0 8px 24px rgba(16,185,129,0.4)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {alerte_fraude ? 'Compris' : 'Fermer'}
        </button>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────
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
  const [modal,     setModal]     = useState(null)
  const [resume,    setResume]    = useState(null)

  const elapsed = useElapsed(serviceActif?.started_at)
  const locked  = !serviceActif

  const prixEssence = parseInt(parametres?.prix_essence) || 10_000
  const prixGasoil  = parseInt(parametres?.prix_gasoil)  || 9_000
  const prixLitre   = type === 'essence' ? prixEssence : prixGasoil
  const stockActuel = type === 'essence' ? essence : gasoil
  const litresNum   = parseFloat(litres) || 0
  const montantAuto = Math.round(litresNum * prixLitre)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 4_500)
    return () => clearTimeout(t)
  }, [success])

  const validate = () => {
    const e = {}
    const l = parseFloat(litres)
    if (!l || l <= 0) e.litres = 'Quantité invalide'
    if (l > stockActuel) e.litres = `Stock insuffisant (${formatLitres(stockActuel)} dispo)`
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleVente = async (e) => {
    e.preventDefault()
    if (locked) return
    if (!validate()) return
    const result = await enregistrerVente({ type, litres: litresNum, montant_gnf: montantAuto })
    if (result) {
      setLastVente({ type, litres: litresNum, montant_gnf: montantAuto })
      setLitres('')
      setErrors({})
      setSuccess(true)
    }
  }

  const handleDemarrer = async (fd) => {
    await demarrer(fd)
    setModal(null)
  }

  const handleTerminer = async (fd) => {
    if (!serviceActif) return
    try {
      const result = await terminer({ id: serviceActif.id, formData: fd })
      setModal(null)
      setResume(result)
    } catch {
      setModal(null)
    }
  }

  const BG = isDark ? '#0D1B2A' : '#F0F4FF'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: theme.font.family, display: 'flex', flexDirection: 'column', transition: 'background 0.3s' }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{ background: '#0A1628', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 24px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parametres?.logo_url ? (
            <img src={parametres.logo_url} alt="logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }} />
          ) : (
            <div style={{ width: 32, height: 32, background: ORANGE, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
                <ellipse cx="18" cy="36" rx="4" ry="6" fill={ORANGE} opacity="0.6" />
              </svg>
            </div>
          )}
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {parametres?.nom ?? <span>fuel<span style={{ color: ORANGE }}>o</span></span>}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>Pompiste</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: ORANGE }}>
              {(user?.nom || 'P').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{user?.nom}</span>
          </div>
          <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: 'rgba(255,255,255,0.35)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isDark ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></> : <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>}
            </svg>
          </button>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(239,68,68,0.85)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 11px' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = RED }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'rgba(239,68,68,0.85)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 40px', gap: 14, maxWidth: 500, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── Carte service ──────────────────────── */}
        {serviceActif ? (
          <div style={{
            width: '100%',
            background: isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)',
            border: `2px solid rgba(16,185,129,0.3)`,
            borderRadius: 22, padding: '20px 22px',
            boxShadow: '0 8px 28px rgba(16,185,129,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: GREEN, boxShadow: `0 0 10px ${GREEN}80`, animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: GREEN, letterSpacing: '-0.2px' }}>Service en cours</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: GREEN, fontFamily: theme.font.mono, lineHeight: 1, letterSpacing: '-1px' }}>{elapsed}</div>
                <div style={{ fontSize: 10, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Durée</div>
              </div>
            </div>
            <button onClick={() => setModal('terminer')} style={{
              width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${RED}, #DC2626)`,
              color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(239,68,68,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              Terminer mon service
            </button>
          </div>
        ) : (
          /* ── Carte "pas de service" avec gros CTA ── */
          <div style={{
            width: '100%',
            background: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)',
            border: `2px solid rgba(37,99,235,0.25)`,
            borderRadius: 22, padding: '28px 22px',
            boxShadow: theme.shadow.md,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>📷</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: palette.text, marginBottom: 6 }}>
                Prenez la photo du compteur
              </div>
              <div style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.6, maxWidth: 280 }}>
                Pour démarrer votre service et enregistrer des ventes, prenez une photo du compteur et saisissez les relevés
              </div>
            </div>
            <button onClick={() => setModal('demarrer')} style={{
              width: '100%', maxWidth: 300, height: 56,
              borderRadius: 16, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${GREEN}, #059669)`,
              color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
              boxShadow: '0 6px 22px rgba(16,185,129,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Démarrer mon service
            </button>
          </div>
        )}

        {/* ── Zone verrouillée quand pas de service ── */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Stats du jour ───────────────────────── */}
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }} className="pompiste-grid-3">
            {[
              { label: 'Ventes', value: String(aujourdhui.nb ?? 0), iconType: 'cart',  color: BLUE },
              { label: 'Litres', value: formatLitres(aujourdhui.total_litres), iconType: 'pump', color: GREEN },
              { label: 'Total',  value: formatGNF(aujourdhui.total_gnf),       iconType: 'coin', color: ORANGE },
            ].map(({ label, value, iconType, color }) => (
              <div key={label} style={{
                background: palette.card, border: `1px solid ${palette.cardBorder}`,
                borderRadius: 18, padding: '14px 10px', textAlign: 'center',
                boxShadow: theme.shadow.sm,
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>
                  {iconType === 'cart' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
                  {iconType === 'pump' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>}
                  {iconType === 'coin' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 015 0c0 3-5 3-5 5a2.5 2.5 0 005 0"/></svg>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color, fontFamily: theme.font.mono, lineHeight: 1.2, letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Stocks avec jauge ──────────────────── */}
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Essence', qty: essence, prix: prixEssence, iconType: 'pump' },
              { label: 'Gasoil',  qty: gasoil,  prix: prixGasoil,  iconType: 'drum' },
            ].map(({ label, qty, prix, iconType }) => {
              const st  = getStockStatus(qty)
              const pct = Math.min(100, Math.max(0, (qty / 5000) * 100))
              return (
                <div key={label} style={{
                  background: palette.card, border: `1px solid ${palette.cardBorder}`,
                  borderRadius: 18, padding: '14px 16px',
                  boxShadow: theme.shadow.sm, transition: 'background 0.3s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '1px 7px', borderRadius: 99 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: palette.text, fontFamily: theme.font.mono, marginBottom: 4, letterSpacing: '-1px', lineHeight: 1 }}>
                    {qty.toLocaleString('fr-FR')}
                    <span style={{ fontSize: 12, fontWeight: 400, color: palette.textMuted, marginLeft: 3 }}>L</span>
                  </div>
                  <div style={{ height: 4, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: st.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: BLUE, fontWeight: 700 }}>{formatGNF(prix)} / L</div>
                </div>
              )
            })}
          </div>

          {/* ── Formulaire vente ─────────────────── */}
          <div style={{
            width: '100%',
            background: palette.card, border: `1px solid ${palette.cardBorder}`,
            borderRadius: 22, padding: '22px 20px',
            boxShadow: theme.shadow.md, transition: 'background 0.3s',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: palette.text, marginBottom: 18, textAlign: 'center', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
              Enregistrer une vente
            </div>

            {/* Message si pas de service */}
            {locked && (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)', marginBottom: 18, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 4 }}>Vente impossible</div>
                <div style={{ fontSize: 12, color: palette.textSub }}>Démarrez votre service pour enregistrer des ventes</div>
              </div>
            )}

            <form onSubmit={handleVente} style={{ opacity: locked ? 0.45 : 1, transition: 'opacity 0.3s', pointerEvents: locked ? 'none' : 'auto' }}>
              {/* Sélecteur type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {[
                  { val: 'essence', iconType: 'pump', label: 'Essence', qty: essence, prix: prixEssence },
                  { val: 'gasoil',  iconType: 'drum', label: 'Gasoil',  qty: gasoil,  prix: prixGasoil  },
                ].map(({ val, iconType, label, qty, prix }) => {
                  const sel = type === val
                  return (
                    <button key={val} type="button"
                      onClick={() => { setType(val); setLitres(''); setErrors({}) }}
                      style={{
                        padding: '16px 10px', borderRadius: 16,
                        border: `2.5px solid ${sel ? BLUE : palette.cardBorder}`,
                        background: sel
                          ? (isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.07)')
                          : palette.inputBg,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s',
                        transform: sel ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: sel ? `0 4px 18px rgba(37,99,235,0.2)` : 'none',
                      }}>
                      {iconType === 'pump'
                        ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sel ? BLUE : theme.colors.warning} strokeWidth="1.8" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
                        : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={sel ? BLUE : theme.colors.info} strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/></svg>
                      }
                      <span style={{ fontSize: 13, fontWeight: sel ? 800 : 500, color: sel ? BLUE : palette.text }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sel ? BLUE : palette.textMuted }}>{formatGNF(prix)} / L</span>
                      <span style={{ fontSize: 10, color: palette.textMuted }}>{formatLitres(qty)} dispo</span>
                    </button>
                  )
                })}
              </div>

              {/* Input litres */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Quantité (litres)
                </div>
                <input
                  type="number" min="0.1" step="0.1" placeholder="0"
                  value={litres}
                  onChange={e => { setLitres(e.target.value); setErrors({}) }}
                  onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 4px rgba(37,99,235,0.15)` }}
                  onBlur={e  => { e.target.style.borderColor = errors.litres ? RED : palette.cardBorder; e.target.style.boxShadow = 'none' }}
                  style={{
                    width: '100%', height: 80, boxSizing: 'border-box',
                    background: palette.inputBg,
                    border: `2px solid ${errors.litres ? RED : palette.cardBorder}`,
                    borderRadius: 16, padding: '0 16px',
                    fontSize: 48, fontWeight: 900, color: palette.text,
                    fontFamily: theme.font.mono, outline: 'none',
                    textAlign: 'center', letterSpacing: '-2px', transition: 'all 0.2s',
                  }}
                />
                {errors.litres && <div style={{ fontSize: 12, color: RED, marginTop: 6, textAlign: 'center', fontWeight: 600 }}>{errors.litres}</div>}
              </div>

              {/* Montant */}
              <div style={{
                borderRadius: 16, padding: '16px', marginBottom: 20, textAlign: 'center',
                background: litresNum > 0
                  ? (isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)')
                  : palette.inputBg,
                border: `2px solid ${litresNum > 0 ? BLUE : palette.cardBorder}`,
                transition: 'all 0.3s',
                transform: litresNum > 0 ? 'scale(1.01)' : 'scale(1)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Montant à encaisser</div>
                <div style={{
                  fontSize: 34, fontWeight: 900,
                  color: litresNum > 0 ? BLUE : palette.textMuted,
                  fontFamily: theme.font.mono, letterSpacing: '-1px',
                  transition: 'all 0.3s',
                }}>
                  {litresNum > 0 ? formatGNF(montantAuto) : '— GNF'}
                </div>
                {litresNum > 0 && (
                  <div style={{ fontSize: 12, color: palette.textSub, marginTop: 5 }}>
                    {litresNum} L × {formatGNF(prixLitre)}
                  </div>
                )}
              </div>

              {/* Bouton confirmer */}
              <button type="submit"
                disabled={venteLoading || !litresNum || locked}
                style={{
                  width: '100%', height: 60,
                  borderRadius: 18, border: 'none',
                  background: venteLoading || !litresNum || locked
                    ? (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB')
                    : `linear-gradient(135deg, ${BLUE}, #1D4ED8)`,
                  color: venteLoading || !litresNum || locked ? palette.textMuted : '#fff',
                  fontSize: 17, fontWeight: 800, fontFamily: 'inherit',
                  cursor: venteLoading || !litresNum || locked ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: litresNum && !venteLoading && !locked ? '0 8px 28px rgba(37,99,235,0.4)' : 'none',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => { if (litresNum && !venteLoading && !locked) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(37,99,235,0.5)' }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = litresNum && !locked ? '0 8px 28px rgba(37,99,235,0.4)' : 'none' }}>
                {venteLoading
                  ? <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                }
                {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
              </button>
            </form>
          </div>

          {/* ── Confirmation vente ─────────────────── */}
          {success && lastVente && (
            <div style={{
              width: '100%',
              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)',
              border: `2px solid rgba(16,185,129,0.35)`,
              borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              animation: 'bounceIn 0.5s ease',
              boxShadow: '0 6px 24px rgba(16,185,129,0.18)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(16,185,129,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: GREEN, marginBottom: 3 }}>Vente enregistrée !</div>
                <div style={{ fontSize: 12, color: palette.textSub, lineHeight: 1.5 }}>
                  {formatLitres(lastVente.litres)} {lastVente.type} ·{' '}
                  <strong style={{ color: BLUE }}>{formatGNF(lastVente.montant_gnf)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── Overlay lock ────────────────────────── */}
          {locked && (
            <div style={{
              position: 'absolute',
              inset: '-6px',
              zIndex: 8,
              background: isDark ? 'rgba(13,27,42,0.78)' : 'rgba(240,244,255,0.84)',
              backdropFilter: 'blur(5px)',
              borderRadius: 24,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 28px',
              textAlign: 'center',
              gap: 18,
              minHeight: 280,
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)',
                border: `2px solid rgba(37,99,235,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              }}>
                🔒
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: palette.text, marginBottom: 8 }}>
                  Fonctionnalités verrouillées
                </div>
                <div style={{ fontSize: 14, color: palette.textSub, lineHeight: 1.7, maxWidth: 260 }}>
                  Prenez la photo du compteur pour démarrer votre service et débloquer toutes les fonctionnalités
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: BLUE, fontSize: 13, fontWeight: 700 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                Démarrez votre service ci-dessus
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal service ─────────────────────── */}
      {modal && (
        <ServiceModal
          mode={modal}
          onClose={() => setModal(null)}
          onSubmit={modal === 'demarrer' ? handleDemarrer : handleTerminer}
          loading={modal === 'demarrer' ? demarrerLoading : terminerLoading}
          isDark={isDark} palette={palette}
        />
      )}

      {/* ── Modal résumé fin de service ──────── */}
      {resume && (
        <ResumeModal
          data={resume}
          onClose={() => setResume(null)}
          isDark={isDark}
          palette={palette}
        />
      )}

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse    { 0%,100%{opacity:1;box-shadow:0 0 10px rgba(16,185,129,0.6)} 50%{opacity:0.6;box-shadow:0 0 18px rgba(16,185,129,0.9)} }
        @keyframes bounceIn { 0%{opacity:0;transform:scale(0.9) translateY(10px)} 60%{transform:scale(1.02) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        select { -webkit-appearance: none; }
        @media (max-width: 480px) {
          .pompiste-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .pompiste-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
