// ================================================
// FUELO — PompistePage PREMIUM (dark green identity)
// ================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }       from '../../context/AuthContext'
import { useStock }      from '../../hooks/useStock'
import { useVentes }     from '../../hooks/useVentes'
import { useParametres } from '../../hooks/useParametres'
import { useService }    from '../../hooks/useService'
import { formatGNF, formatLitres, getStockStatus } from '../../utils/format'

// ── Palette dark fixe — identité pompiste ────────
const C = {
  bg:      '#070B14',
  card:    '#0F1622',
  card2:   '#162032',
  border:  'rgba(255,255,255,0.08)',
  text:    '#F1F5F9',
  sub:     '#94A3B8',
  muted:   '#64748B',
  green:   '#10B981',
  orange:  '#F59E0B',
  red:     '#EF4444',
  blue:    '#38BDF8',
}

// ── Timer ─────────────────────────────────────────
function useElapsed(startedAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!startedAt) { setSecs(0); return }
    const update = () => setSecs(Math.floor((Date.now() - new Date(startedAt)) / 1000))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [startedAt])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return {
    secs,
    label: h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
    pct: Math.min(1, secs / (8 * 3600)),
  }
}

// ── Ring Timer SVG ────────────────────────────────
function RingTimer({ pct, label, secs }) {
  const R   = 64
  const cir = 2 * Math.PI * R
  const off = cir * (1 - pct)
  return (
    <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
      <svg width="160" height="160" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="8" />
        <circle cx="80" cy="80" r={R} fill="none" stroke={C.green} strokeWidth="8"
          strokeDasharray={cir} strokeDashoffset={off}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${C.green}80)`, transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: C.green, fontFamily: 'monospace', lineHeight: 1, letterSpacing: '-1px' }}>{label}</div>
        <div style={{ fontSize: 10, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>En service</div>
      </div>
    </div>
  )
}

// ── Photo Input ──────────────────────────────────
function PhotoInput({ onCapture, photoFile, error }) {
  const ref  = useRef()
  const prev = useMemo(() => photoFile ? URL.createObjectURL(photoFile) : null, [photoFile])
  useEffect(() => () => { if (prev) URL.revokeObjectURL(prev) }, [prev])

  const openPicker = () => {
    if (ref.current) { ref.current.value = ''; ref.current.click() }
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => onCapture(e.target.files?.[0] ?? null)} />
      {prev ? (
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `2px solid ${C.green}` }}>
          <img src={prev} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, left: 8, background: C.green, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>✓ Photo prise</div>
          <button onClick={openPicker} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 600, padding: '5px 12px', cursor: 'pointer' }}>Changer</button>
        </div>
      ) : (
        <button onClick={openPicker} style={{
          width: '100%', height: 110, borderRadius: 16, cursor: 'pointer',
          border: `2px dashed ${error ? C.red : 'rgba(255,255,255,0.15)'}`,
          background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={error ? C.red : C.green} strokeWidth="1.5" strokeLinecap="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: error ? C.red : C.text }}>{error || 'Prendre la photo du compteur'}</span>
          <span style={{ fontSize: 11, color: C.muted }}>Obligatoire</span>
        </button>
      )}
    </div>
  )
}

// ── Modal service ─────────────────────────────────
function ServiceModal({ mode, onClose, onSubmit, loading }) {
  const [photo, setPhoto]   = useState(null)
  const [ess,   setEss]     = useState('')
  const [gas,   setGas]     = useState('')
  const [errs,  setErrs]    = useState({})
  const start = mode === 'demarrer'

  const submit = () => {
    const e = {}
    if (!photo) e.photo = 'Photo obligatoire'
    if (!ess && !gas) e.cpt = 'Saisissez au moins un relevé'
    if (ess && isNaN(parseFloat(ess))) e.ess = 'Invalide'
    if (gas && isNaN(parseFloat(gas))) e.gas = 'Invalide'
    setErrs(e)
    if (Object.keys(e).length) return
    const fd = new FormData()
    fd.append('photo', photo)
    if (ess) fd.append(start ? 'compteur_essence_debut' : 'compteur_essence_fin', ess)
    if (gas) fd.append(start ? 'compteur_gasoil_debut'  : 'compteur_gasoil_fin',  gas)
    onSubmit(fd)
  }

  const inputSt = (err) => ({
    width: '100%', height: 64, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `2px solid ${err ? C.red : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 14, padding: '0 14px',
    fontSize: 30, fontWeight: 800, fontFamily: 'monospace',
    color: C.text, outline: 'none', textAlign: 'center', transition: 'all 0.2s',
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25 }}
        style={{ background: '#0F1622', borderRadius: '28px 28px 0 0', padding: '12px 22px 52px', width: '100%', maxWidth: 500, boxShadow: '0 -16px 64px rgba(0,0,0,0.5)', maxHeight: '92vh', overflowY: 'auto', border: `1px solid rgba(255,255,255,0.06)`, borderBottom: 'none' }}>

        <div style={{ width: 44, height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 99, margin: '0 auto 24px' }} />

        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: start ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `2px solid ${start ? C.green : C.red}40`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={start ? C.green : C.red} strokeWidth="2" strokeLinecap="round">
              {start ? <polygon points="5 3 19 12 5 21 5 3"/> : <rect x="3" y="3" width="18" height="18" rx="3"/>}
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{start ? 'Démarrer mon service' : 'Terminer mon service'}</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Photo du compteur + relevés obligatoires</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <PhotoInput onCapture={setPhoto} photoFile={photo} error={errs.photo} />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Relevés compteurs (L)</div>
            {errs.cpt && <div style={{ fontSize: 12, color: C.red, textAlign: 'center', marginBottom: 8, fontWeight: 600 }}>{errs.cpt}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['⛽ Essence', ess, setEss, errs.ess], ['🛢 Gasoil', gas, setGas, errs.gas]].map(([lbl, val, set, err]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 6, textAlign: 'center' }}>{lbl}</div>
                  <input type="number" min="0" step="0.1" placeholder="0" value={val}
                    onChange={e => { set(e.target.value); setErrs(p => ({ ...p, cpt: null })) }}
                    onFocus={e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = `0 0 0 3px ${C.green}25` }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                    style={inputSt(!!err)} />
                  {err && <div style={{ fontSize: 10, color: C.red, marginTop: 3, textAlign: 'center' }}>{err}</div>}
                </div>
              ))}
            </div>
          </div>

          {!start && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, color: C.orange, fontWeight: 600, textAlign: 'center' }}>
              ⚠ Un écart &gt; 10L génère une alerte fraude automatique
            </div>
          )}

          <button onClick={submit} disabled={loading}
            style={{ height: 60, borderRadius: 18, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,0.06)' : start ? `linear-gradient(135deg, ${C.green}, #059669)` : `linear-gradient(135deg, ${C.red}, #DC2626)`,
              color: loading ? C.muted : '#fff', fontSize: 16, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: !loading ? (start ? '0 8px 24px rgba(16,185,129,0.4)' : '0 8px 24px rgba(239,68,68,0.4)') : 'none',
              transition: 'all 0.2s',
            }}>
            {loading
              ? <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            }
            {loading ? 'Enregistrement...' : start ? 'Démarrer le service' : 'Terminer et calculer l\'écart'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Modal résumé fin de service ───────────────────
function ResumeModal({ data, onClose }) {
  const { service, ventes, alerte_fraude } = data
  const hEss = service.compteur_essence_debut != null && service.compteur_essence_fin != null
  const hGas = service.compteur_gasoil_debut  != null && service.compteur_gasoil_fin  != null
  const carbs = [
    hEss && { label: '⛽ Essence', app: parseFloat(ventes.essence ?? 0), conso: parseFloat(service.compteur_essence_fin) - parseFloat(service.compteur_essence_debut), ecart: parseFloat(service.ecart_essence ?? 0) },
    hGas && { label: '🛢 Gasoil',  app: parseFloat(ventes.gasoil  ?? 0), conso: parseFloat(service.compteur_gasoil_fin)  - parseFloat(service.compteur_gasoil_debut),  ecart: parseFloat(service.ecart_gasoil  ?? 0) },
  ].filter(Boolean)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', damping: 24 }}
        style={{ background: '#0F1622', borderRadius: '28px 28px 0 0', padding: '12px 22px 52px', width: '100%', maxWidth: 500, boxShadow: '0 -20px 80px rgba(0,0,0,0.6)', maxHeight: '94vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}>

        <div style={{ width: 44, height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 99, margin: '0 auto 24px' }} />

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14, delay: 0.1 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: alerte_fraude ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `3px solid ${alerte_fraude ? C.red : C.green}40`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={alerte_fraude ? C.red : C.green} strokeWidth="2" strokeLinecap="round">
              {alerte_fraude
                ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                : <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
              }
            </svg>
          </motion.div>
          <div style={{ fontSize: 22, fontWeight: 900, color: alerte_fraude ? C.red : C.green }}>{alerte_fraude ? 'Alerte fraude détectée' : 'Service terminé ✓'}</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>{alerte_fraude ? 'Le gérant a été notifié automatiquement' : 'Tous les relevés sont conformes'}</div>
        </div>

        {carbs.map((cb, i) => {
          const fraud = Math.abs(cb.ecart) > 10
          const ec    = fraud ? C.red : C.green
          return (
            <motion.div key={cb.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
              style={{ borderRadius: 18, padding: '18px', marginBottom: 14, border: `1.5px solid ${fraud ? C.red + '40' : 'rgba(255,255,255,0.08)'}`, background: fraud ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>{cb.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[['Vendus (app)', cb.app.toFixed(1), C.blue], ['Compteur', cb.conso.toFixed(1), C.text]].map(([k,v,c]) => (
                  <div key={k} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 10px' }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{k}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c, fontFamily: 'monospace' }}>{v}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>litres</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: `${ec}15`, border: `1px solid ${ec}25` }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: ec }}>Écart {fraud ? '⚠' : '✓'}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: ec, fontFamily: 'monospace' }}>{cb.ecart > 0 ? '+' : ''}{cb.ecart.toFixed(1)} L</span>
              </div>
            </motion.div>
          )
        })}

        <button onClick={onClose}
          style={{ width: '100%', height: 60, borderRadius: 18, border: 'none', cursor: 'pointer',
            background: alerte_fraude ? `linear-gradient(135deg, ${C.red}, #DC2626)` : `linear-gradient(135deg, ${C.green}, #059669)`,
            color: '#fff', fontSize: 16, fontWeight: 800,
            boxShadow: alerte_fraude ? '0 8px 24px rgba(239,68,68,0.4)' : '0 8px 24px rgba(16,185,129,0.4)',
          }}>
          {alerte_fraude ? 'Compris' : 'Fermer'}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Overlay lock premium ──────────────────────────
function LockOverlay({ onDemarrer }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: 'absolute', inset: 0, zIndex: 8, borderRadius: 24, backdropFilter: 'blur(6px)', background: 'rgba(7,11,20,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, textAlign: 'center' }}>
      <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: `2px solid ${C.green}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 32px ${C.green}20` }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </motion.div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Service non démarré</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, maxWidth: 260 }}>
          Prenez la photo du compteur pour démarrer votre service et enregistrer des ventes
        </div>
      </div>
      <motion.div animate={{ y: [-3, 3, -3] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.green, fontSize: 13, fontWeight: 700 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        Démarrez votre service ci-dessus
      </motion.div>
    </motion.div>
  )
}

// ── Confirmation vente ────────────────────────────
function VenteSuccess({ vente, onDismiss }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
      onClick={onDismiss}
      style={{ width: '100%', background: `linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))`, border: `1.5px solid ${C.green}40`, borderRadius: 20, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10, delay: 0.1 }}
        style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: `2px solid ${C.green}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 20px ${C.green}40` }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.green, marginBottom: 4 }}>Vente enregistrée !</div>
        <div style={{ fontSize: 13, color: C.sub }}>
          {formatLitres(vente.litres)} {vente.type} ·{' '}
          <strong style={{ color: C.text }}>{formatGNF(vente.montant_gnf)}</strong>
        </div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.green, fontFamily: 'monospace', letterSpacing: '-1px' }}>{formatGNF(vente.montant_gnf)}</div>
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────
export default function PompistePage() {
  const { user, logout }    = useAuth()
  const { essence, gasoil } = useStock()
  const { enregistrerVente, venteLoading, aujourdhui } = useVentes()
  const { parametres }      = useParametres()
  const { serviceActif, demarrer, demarrerLoading, terminer, terminerLoading } = useService()

  const [type,      setType]    = useState('essence')
  const [litres,    setLitres]  = useState('')
  const [lastVente, setLast]    = useState(null)
  const [errors,    setErrors]  = useState({})
  const [success,   setSuccess] = useState(false)
  const [modal,     setModal]   = useState(null)
  const [resume,    setResume]  = useState(null)

  const timer  = useElapsed(serviceActif?.started_at)
  const locked = !serviceActif

  const prixEss = parseInt(parametres?.prix_essence) || 10_000
  const prixGas = parseInt(parametres?.prix_gasoil)  || 9_000
  const prixL   = type === 'essence' ? prixEss : prixGas
  const stockNow = type === 'essence' ? essence : gasoil
  const litresN  = parseFloat(litres) || 0
  const montant  = Math.round(litresN * prixL)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 5_000)
    return () => clearTimeout(t)
  }, [success])

  const handleVente = async (e) => {
    e.preventDefault()
    if (locked) return
    const e2 = {}
    const l = parseFloat(litres)
    if (!l || l <= 0) e2.litres = 'Quantité invalide'
    else if (l > stockNow) e2.litres = `Stock insuffisant (${formatLitres(stockNow)})`
    setErrors(e2)
    if (Object.keys(e2).length) return
    const result = await enregistrerVente({ type, litres: litresN, montant_gnf: montant })
    if (result) {
      setLast({ type, litres: litresN, montant_gnf: montant })
      setLitres(''); setErrors({}); setSuccess(true)
    }
  }

  const handleDemarrer = async (fd) => {
    try { await demarrer(fd); setModal(null) }
    catch { /* toast affiché par onError — modal reste ouverte pour réessayer */ }
  }
  const handleTerminer = async (fd) => {
    if (!serviceActif) return
    try {
      const r = await terminer({ id: serviceActif.id, formData: fd })
      setModal(null)
      setResume(r)
    } catch { /* toast affiché par onError — modal reste ouverte pour réessayer */ }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #080D18, #0F1622)', borderBottom: `1px solid ${C.green}20`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: `0 2px 20px rgba(0,0,0,0.4)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {parametres?.logo_url
            ? <img src={parametres.logo_url} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.green}40` }} alt="" />
            : <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.green}, #059669)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${C.green}40` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/>
                </svg>
              </div>
          }
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{parametres?.nom ?? 'Fuelo'}</div>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pompiste</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {serviceActif && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(16,185,129,0.12)', border: `1px solid ${C.green}30`, borderRadius: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}`, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>En service</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${C.green}25`, border: `1px solid ${C.green}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.green }}>
              {(user?.nom || 'P').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{user?.nom}</span>
          </div>
          <button onClick={logout}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(239,68,68,0.8)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>

      {/* ── Contenu ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 40px', gap: 12, maxWidth: 500, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* ── Service card ──────────────────────── */}
        <AnimatePresence mode="wait">
          {serviceActif ? (
            <motion.div key="active" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              style={{ width: '100%', background: `linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))`, border: `1.5px solid ${C.green}35`, borderRadius: 24, padding: '20px', boxShadow: `0 8px 32px rgba(16,185,129,0.15)` }}>
              <div className="pompiste-svc" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <RingTimer pct={timer.pct} label={timer.label} secs={timer.secs} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Service actif</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: 'monospace' }}>{aujourdhui.nb ?? 0}</div>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>ventes</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: C.orange, fontFamily: 'monospace' }}>{formatLitres(aujourdhui.total_litres)}</div>
                      <div style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase' }}>litres</div>
                    </div>
                  </div>
                  <button onClick={() => setModal('terminer')}
                    style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.red}, #DC2626)`, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    Terminer le service
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="inactive" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              style={{ width: '100%', background: C.card, border: `1.5px solid ${C.green}25`, borderRadius: 24, padding: '28px 22px', textAlign: 'center', boxShadow: `0 4px 24px rgba(0,0,0,0.3)` }}>
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>📷</motion.div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Démarrez votre service</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, maxWidth: 280, margin: '0 auto 22px' }}>
                Prenez la photo du compteur pour activer toutes les fonctionnalités
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModal('demarrer')}
                style={{ width: '100%', maxWidth: 300, height: 60, borderRadius: 18, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.green}, #059669)`, color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 8px 28px rgba(16,185,129,0.45)`, margin: '0 auto' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Démarrer mon service
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats jour ────────────────────────── */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { l: 'Ventes',  v: String(aujourdhui.nb ?? 0),              c: C.blue,   ico: 'cart'  },
            { l: 'Litres',  v: formatLitres(aujourdhui.total_litres),   c: C.green,  ico: 'pump'  },
            { l: 'Total',   v: formatGNF(aujourdhui.total_gnf),         c: C.orange, ico: 'coin'  },
          ].map(({ l, v, c, ico }) => (
            <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                {ico === 'cart' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>}
                {ico === 'pump' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/></svg>}
                {ico === 'coin' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 015 0c0 3-5 3-5 5a2.5 2.5 0 005 0"/></svg>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: c, fontFamily: 'monospace', letterSpacing: '-0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
              <div style={{ fontSize: 9, color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── Zone stocks + form (lockable) ─────── */}
        <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { l: 'Essence', q: essence, p: prixEss },
              { l: 'Gasoil',  q: gasoil,  p: prixGas  },
            ].map(({ l, q, p }) => {
              const st  = getStockStatus(q)
              const pct = Math.min(100, (q / 5000) * 100)
              return (
                <div key={l} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{l}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: `${st.color}20`, padding: '1px 7px', borderRadius: 99 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.text, fontFamily: 'monospace', marginBottom: 6 }}>
                    {q.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}<span style={{ fontSize: 12, color: C.muted, marginLeft: 3 }}>L</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: st.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>{formatGNF(p)} / L</div>
                </div>
              )
            })}
          </div>

          {/* Formulaire vente */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: '20px 18px' }}>

            {/* Sélecteur carburant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
              {[
                { val: 'essence', label: 'Essence ⛽', q: essence, p: prixEss, color: C.green  },
                { val: 'gasoil',  label: 'Gasoil 🛢',  q: gasoil,  p: prixGas, color: C.orange },
              ].map(({ val, label, q, p, color }) => {
                const sel = type === val
                return (
                  <motion.button key={val} type="button" whileTap={{ scale: 0.97 }}
                    onClick={() => { setType(val); setLitres(''); setErrors({}) }}
                    style={{ padding: '14px 10px', borderRadius: 16, border: `2px solid ${sel ? color : 'rgba(255,255,255,0.08)'}`, background: sel ? `${color}18` : 'rgba(255,255,255,0.03)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s', boxShadow: sel ? `0 4px 16px ${color}25` : 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: sel ? 800 : 500, color: sel ? color : C.text }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sel ? color : C.muted }}>{formatGNF(p)} / L</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{formatLitres(q)}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Input litres */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, textAlign: 'center' }}>Quantité (litres)</div>
              <input type="number" min="0.1" step="0.1" placeholder="0" value={litres}
                onChange={e => { setLitres(e.target.value); setErrors({}) }}
                onFocus={e => { e.target.style.borderColor = C.green; e.target.style.boxShadow = `0 0 0 4px ${C.green}20` }}
                onBlur={e  => { e.target.style.borderColor = errors.litres ? C.red : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', height: 88, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `2px solid ${errors.litres ? C.red : 'rgba(255,255,255,0.1)'}`, borderRadius: 18, padding: '0 16px', fontSize: 52, fontWeight: 900, color: C.text, fontFamily: 'monospace', outline: 'none', textAlign: 'center', letterSpacing: '-2px', transition: 'all 0.2s' }} />
              {errors.litres && <div style={{ fontSize: 12, color: C.red, marginTop: 6, textAlign: 'center', fontWeight: 600 }}>{errors.litres}</div>}
            </div>

            {/* Montant */}
            <motion.div animate={{ scale: litresN > 0 ? 1.01 : 1 }}
              style={{ borderRadius: 16, padding: '16px', marginBottom: 18, textAlign: 'center', background: litresN > 0 ? `${C.green}12` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${litresN > 0 ? C.green + '35' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.3s' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Montant à encaisser</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: litresN > 0 ? C.green : C.muted, fontFamily: 'monospace', letterSpacing: '-1px', transition: 'color 0.3s' }}>
                {litresN > 0 ? formatGNF(montant) : '— GNF'}
              </div>
              {litresN > 0 && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{litresN} L × {formatGNF(prixL)}</div>}
            </motion.div>

            {/* Bouton confirmer */}
            <motion.button type="submit" whileTap={{ scale: 0.98 }}
              onClick={handleVente}
              disabled={venteLoading || !litresN || locked}
              style={{ width: '100%', height: 64, borderRadius: 20, border: 'none',
                background: venteLoading || !litresN || locked ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${C.green}, #059669)`,
                color: venteLoading || !litresN || locked ? C.muted : '#fff',
                fontSize: 17, fontWeight: 800, cursor: venteLoading || !litresN || locked ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: litresN && !locked ? `0 8px 28px ${C.green}40` : 'none', transition: 'all 0.3s',
              }}>
              {venteLoading
                ? <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              }
              {venteLoading ? 'Enregistrement...' : 'Confirmer la vente'}
            </motion.button>
          </div>

          {/* Confirmation vente */}
          <AnimatePresence>
            {success && lastVente && <VenteSuccess vente={lastVente} onDismiss={() => setSuccess(false)} />}
          </AnimatePresence>

          {/* Overlay lock */}
          <AnimatePresence>
            {locked && <LockOverlay onDemarrer={() => setModal('demarrer')} />}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <ServiceModal mode={modal} onClose={() => setModal(null)}
            onSubmit={modal === 'demarrer' ? handleDemarrer : handleTerminer}
            loading={modal === 'demarrer' ? demarrerLoading : terminerLoading} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {resume && <ResumeModal data={resume} onClose={() => setResume(null)} />}
      </AnimatePresence>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(16,185,129,0.7)} 50%{opacity:0.6;box-shadow:0 0 16px rgba(16,185,129,1)} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 400px) {
          .pompiste-svc { flex-direction: column !important; align-items: center !important; gap: 16px !important; }
          .pompiste-svc > div:last-child { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
