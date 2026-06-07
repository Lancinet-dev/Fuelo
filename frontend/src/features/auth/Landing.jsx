import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import FueloLogo from '../../components/FueloLogo'
import WhatsAppButton from '../../ui/WhatsAppButton'

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
const GOOGLE_URL = `${BACKEND}/api/auth/google`

const C = {
  bg:     '#050A15',
  bg2:    '#080D1A',
  blue:   '#2563EB',
  soft:   '#60A5FA',
  dark:   '#1D4ED8',
  orange: '#F59E0B',
  green:  '#10B981',
  red:    '#EF4444',
  text:   '#F1F5F9',
  sub:    'rgba(241,245,249,0.55)',
  muted:  'rgba(241,245,249,0.25)',
  card:   'rgba(255,255,255,0.03)',
  border: 'rgba(96,165,250,0.08)',
  bord2:  'rgba(37,99,235,0.18)',
}

const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }
const fadeIn  = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6 } } }

function useWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ── Compteur animé (Intersection Observer) ───────────
function Counter({ target, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / 1800, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.floor(ease * target))
          if (p < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

// ── Particules flottantes ─────────────────────────────
function Particles({ count = 30 }) {
  const pts = useRef(
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      color: i % 5 === 0 ? C.orange : i % 3 === 0 ? C.soft : C.blue,
      dur: 10 + Math.random() * 20,
      delay: Math.random() * 10,
    }))
  ).current
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          opacity: 0.35,
          animation: `floatPt ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  )
}

// ── Illustration station-service (SVG, scène stylisée) ──
function StationIllustration({ scale = 1 }) {
  return (
    <svg width={640 * scale} height={360 * scale} viewBox="0 0 640 360" fill="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ilCanopy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.soft} stopOpacity="0.5" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id="ilPump" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
        <linearGradient id="ilGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={C.orange} stopOpacity="0" />
          <stop offset="50%"  stopColor={C.orange} stopOpacity="0.9" />
          <stop offset="100%" stopColor={C.orange} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="320" cy="340" rx="260" ry="16" fill="rgba(37,99,235,0.10)" />

      {/* Piliers de l'auvent */}
      <rect x="150" y="118" width="11" height="140" rx="5" fill={C.blue} opacity="0.30" />
      <rect x="470" y="118" width="11" height="140" rx="5" fill={C.blue} opacity="0.30" />

      {/* Auvent + liseré lumineux animé */}
      <rect x="96" y="76" width="448" height="44" rx="16" fill="url(#ilCanopy)" />
      <motion.rect x="114" y="118" width="412" height="4" rx="2" fill="url(#ilGlow)"
        animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Borne 1 — écran orange animé + pistolet qui goutte */}
      <rect x="232" y="192" width="62" height="116" rx="14" fill="url(#ilPump)" stroke={C.border} />
      <rect x="244" y="210" width="38" height="26" rx="6" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.30)" />
      <motion.rect x="250" y="220" width="24" height="7" rx="3" fill={C.orange} style={{ originX: 0 }}
        animate={{ scaleX: [0.5, 1, 0.5] }} transition={{ duration: 2.1, repeat: Infinity }} />
      <path d="M294 232 C 322 238, 326 268, 306 282" stroke={C.soft} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.45" />
      <motion.circle cx="306" cy="282" r="5" fill={C.orange}
        animate={{ scale: [1, 1.5, 1], opacity: [0.9, 0.4, 0.9] }} transition={{ duration: 1.6, repeat: Infinity }} />
      <motion.circle cx="306" cy="290" r="2.2" fill={C.orange}
        animate={{ y: [0, 28], opacity: [1, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: 'easeIn' }} />

      {/* Borne 2 — écran bleu animé */}
      <rect x="346" y="192" width="62" height="116" rx="14" fill="url(#ilPump)" stroke={C.border} />
      <rect x="358" y="210" width="38" height="26" rx="6" fill="rgba(96,165,250,0.08)" stroke="rgba(96,165,250,0.28)" />
      <motion.rect x="364" y="220" width="28" height="7" rx="3" fill={C.soft} style={{ originX: 0 }}
        animate={{ scaleX: [0.6, 1, 0.6] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />

      {/* Voiture stylisée */}
      <g opacity="0.8">
        <rect x="58" y="278" width="146" height="38" rx="16" fill={C.soft} opacity="0.16" />
        <rect x="82" y="258" width="96"  height="30" rx="14" fill={C.soft} opacity="0.20" />
        <circle cx="94"  cy="318" r="12" fill={C.bg2} stroke={C.border} />
        <circle cx="186" cy="318" r="12" fill={C.bg2} stroke={C.border} />
      </g>
    </svg>
  )
}

// ── Navbar ─────────────────────────────────────────────
function Navbar({ solid, mobile }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: solid ? 'rgba(5,10,21,0.92)' : 'transparent',
        backdropFilter: solid ? 'blur(20px)' : 'none',
        borderBottom: solid ? `1px solid ${C.border}` : 'none',
        transition: 'all 0.4s ease',
        padding: mobile ? '14px 20px' : '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
      <FueloLogo size={32} forceTextColor="#fff" />
      {mobile ? (
        <>
          <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: `1px solid ${C.bord2}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: C.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(5,10,21,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Fonctionnalités', 'Tarifs'].map(l => (
                  <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)} style={{ color: C.sub, fontSize: 14, textDecoration: 'none' }}>{l}</a>
                ))}
                <Link to="/login" style={{ color: C.text, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>Se connecter</Link>
                <Link to="/register" style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', fontSize: 14, textDecoration: 'none', fontWeight: 700, padding: '10px 16px', borderRadius: 8, textAlign: 'center' }}>Essai gratuit</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Fonctionnalités', 'Tarifs'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ color: C.sub, fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = C.text} onMouseLeave={e => e.target.style.color = C.sub}>{l}</a>
          ))}
          <Link to="/login" style={{ color: C.text, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>Se connecter</Link>
          <Link to="/register" style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', fontSize: 14, textDecoration: 'none', fontWeight: 700, padding: '10px 22px', borderRadius: 10, boxShadow: '0 4px 20px rgba(37,99,235,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.35)' }}>
            Commencer gratuitement
          </Link>
        </div>
      )}
    </motion.nav>
  )
}

// ── Feature Card ──────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const ref = useRef(null)
  const handle = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.03)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) scale(1)' }
  return (
    <motion.div ref={ref} variants={fadeUp} onMouseMove={handle} onMouseLeave={reset}
      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '32px 28px', cursor: 'default', transition: 'transform 0.2s ease', backdropFilter: 'blur(10px)', willChange: 'transform' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '-0.3px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75 }}>{desc}</p>
    </motion.div>
  )
}

// ── Pricing Card ──────────────────────────────────────
function PricingCard({ plan, price, features, highlighted, delay }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background: highlighted ? `linear-gradient(145deg, rgba(37,99,235,0.12), rgba(29,78,216,0.06))` : C.card,
        border: `1px solid ${highlighted ? C.bord2 : C.border}`,
        borderRadius: 20, padding: '36px 28px', position: 'relative', overflow: 'hidden',
        boxShadow: highlighted ? '0 0 60px rgba(37,99,235,0.18), inset 0 1px 0 rgba(96,165,250,0.2)' : 'none',
        backdropFilter: 'blur(12px)',
      }}>
      {highlighted && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, letterSpacing: '0.05em' }}>
          POPULAIRE
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: highlighted ? C.soft : C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{plan}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
        <span style={{ fontSize: 42, fontWeight: 800, color: C.text, letterSpacing: '-2px' }}>{price}</span>
        <span style={{ fontSize: 14, color: C.muted }}>/ mois</span>
      </div>
      <div style={{ height: 1, background: C.border, marginBottom: 24 }} />
      {features.map(f => (
        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={highlighted ? C.soft : C.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style={{ fontSize: 14, color: C.sub }}>{f}</span>
        </div>
      ))}
      <Link to="/register" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 28, padding: '13px 0', textAlign: 'center', borderRadius: 12, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
          color:      highlighted ? '#fff' : '#FF6B00',
          background: highlighted ? 'linear-gradient(135deg, #FF6B00, #E65100)' : 'rgba(255,107,0,0.08)',
          border:     highlighted ? 'none' : '1px solid rgba(255,107,0,0.28)',
          boxShadow:  highlighted ? '0 4px 20px rgba(255,107,0,0.40)' : 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; if(highlighted) e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,107,0,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if(highlighted) e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,0,0.4)' }}>
        Payer avec Orange Money 🟠
      </Link>
    </motion.div>
  )
}

// ── LANDING ───────────────────────────────────────────
export default function Landing() {
  const w      = useWidth()
  const mobile = w < 768
  const tablet = w < 1024
  const [navSolid, setNavSolid] = useState(false)
  const { scrollY } = useScroll()
  const heroY  = useTransform(scrollY, [0, 600], [0, 180])
  const heroOp = useTransform(scrollY, [0, 400], [1, 0])
  const illusY = useTransform(scrollY, [0, 700], [0, -110])

  useEffect(() => {
    const unsub = scrollY.on('change', v => setNavSolid(v > 60))
    return unsub
  }, [scrollY])

  const FEATURES = [
    {
      color: C.red,
      title: 'Anti-fraude pompiste',
      desc: 'Photos compteur obligatoires au départ et à l\'arrivée. Overlay de verrouillage pendant le service. Alerte automatique si écart > 10L.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      ),
    },
    {
      color: C.blue,
      title: 'GPS citernes temps réel',
      desc: 'Suivi GPS des camions citerne. Détection automatique des arrêts suspects. QR code anti-vol sur chaque citerne.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
        </svg>
      ),
    },
    {
      color: C.orange,
      title: 'Multi-stations unifié',
      desc: 'Gérez toutes vos stations depuis un seul tableau de bord. Switch instantané entre sites. Rapports consolidés.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
  ]

  const STATS = [
    { value: 500, suffix: 'L+', label: 'Litres récupérés / fraude', prefix: '' },
    { value: 99,  suffix: '%',  label: 'Taux de détection fraude',  prefix: '' },
    { value: 200, suffix: '+',  label: 'Stations actives',          prefix: '' },
    { value: 14,  suffix: 'j',  label: 'Essai gratuit',             prefix: '' },
  ]

  const STEPS = [
    {
      num: '01',
      title: 'Créez votre compte',
      desc: 'Inscription en 2 minutes. Aucune carte bancaire requise. 14 jours d\'essai offerts.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      num: '02',
      title: 'Configurez votre station',
      desc: 'Ajoutez vos produits, prix, seuils d\'alerte et vos employés en quelques clics.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M2 12h2M20 12h2M6.34 6.34L4.93 4.93M19.07 19.07l-1.41-1.41M12 2v2M12 20v2"/></svg>,
    },
    {
      num: '03',
      title: 'Gérez en temps réel',
      desc: 'Stock, ventes, alertes et GPS — tout depuis votre téléphone, depuis n\'importe où.',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    },
  ]

  const PLANS = [
    {
      plan: 'Starter',
      price: '50$',
      highlighted: false,
      features: ['1 station', '5 employés', 'Ventes & stock', 'Alertes email', 'Support standard'],
    },
    {
      plan: 'Pro',
      price: '150$',
      highlighted: true,
      features: ['3 stations', '20 employés', 'Anti-fraude pompiste', 'GPS citernes', 'Primes & performance', 'Support prioritaire'],
    },
    {
      plan: 'Enterprise',
      price: '300$',
      highlighted: false,
      features: ['Stations illimitées', 'Employés illimités', 'Tout Pro inclus', 'API dédiée', 'Manager de compte', 'SLA garanti'],
    },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, color: C.text, overflowX: 'hidden' }}>
      <Navbar solid={navSolid} mobile={mobile} />

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Fond atmosphérique */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.25) 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none' }} />
        <Particles count={25} />

        {/* Illustration station-service en parallax (desktop large) */}
        {!tablet && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 0.55, x: 0 }}
            transition={{ delay: 0.5, duration: 1.1, ease: 'easeOut' }}
            style={{ y: illusY, position: 'absolute', bottom: '-6%', right: '-4%', zIndex: 1, pointerEvents: 'none', filter: 'drop-shadow(0 30px 70px rgba(37,99,235,0.25))' }}
          >
            <StationIllustration scale={w >= 1440 ? 1.1 : 0.85} />
          </motion.div>
        )}

        {/* Contenu hero en parallax */}
        <motion.div style={{ y: heroY, opacity: heroOp, position: 'relative', zIndex: 2, textAlign: 'center', padding: mobile ? '120px 24px 60px' : '0 24px', maxWidth: 860, margin: '0 auto' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.1)', border: `1px solid ${C.bord2}`, borderRadius: 100, padding: '6px 18px', marginBottom: 32 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>En production · 200+ stations actives</span>
          </motion.div>

          {/* Titre */}
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ fontSize: mobile ? 38 : tablet ? 58 : 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 24, color: C.text }}>
            Gérez vos stations.<br />
            <span style={{ background: `linear-gradient(135deg, ${C.soft}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Éliminez la fraude.</span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
            style={{ fontSize: mobile ? 16 : 19, color: C.sub, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 44px', fontWeight: 400 }}>
            Le logiciel de gestion que les stations-service africaines attendaient. Stock, ventes, alertes et anti-fraude — en temps réel, depuis votre téléphone.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"
              style={{ padding: mobile ? '14px 28px' : '16px 36px', background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 30px rgba(37,99,235,0.5)', transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(37,99,235,0.5)' }}>
              Commencer gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
            <a href={GOOGLE_URL}
              style={{ padding: mobile ? '14px 28px' : '16px 32px', background: 'rgba(255,255,255,0.04)', color: C.text, borderRadius: 12, textDecoration: 'none', fontSize: 15, fontWeight: 600, border: `1px solid ${C.bord2}`, transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.bord2 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Voir la démo
            </a>
          </motion.div>

          {/* Trust */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
            style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 44, flexWrap: 'wrap' }}>
            {['Sans carte bancaire', '14 jours gratuits', 'Sans engagement'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 13, color: C.muted }}>{t}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Flèche scroll */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────── */}
      <section style={{ background: C.bg2, padding: mobile ? '64px 24px' : '96px 48px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}
          style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 40 }}>
          {STATS.map(({ value, suffix, label, prefix }) => (
            <motion.div key={label} variants={fadeUp} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: mobile ? 40 : 54, fontWeight: 800, letterSpacing: '-2px', color: C.soft, lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
                <Counter target={value} suffix={suffix} prefix={prefix} />
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section id="fonctionnalités" style={{ padding: mobile ? '80px 24px' : '120px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.08)', border: `1px solid ${C.bord2}`, borderRadius: 100, padding: '5px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fonctionnalités</span>
            </div>
            <h2 style={{ fontSize: mobile ? 30 : 48, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 16, lineHeight: 1.1 }}>
              Tout ce dont vous avez besoin.<br />
              <span style={{ color: C.soft }}>Rien de superflu.</span>
            </h2>
            <p style={{ fontSize: 16, color: C.sub, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Conçu spécifiquement pour les stations-service d'Afrique de l'Ouest.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : tablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.1} />)}
          </div>
        </motion.div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────── */}
      <section style={{ background: C.bg2, padding: mobile ? '80px 24px' : '120px 48px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Comment ça marche</h2>
            <p style={{ fontSize: 16, color: C.sub }}>Opérationnel en moins de 5 minutes.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: mobile ? 32 : 48, position: 'relative' }}>
            {!mobile && (
              <div style={{ position: 'absolute', top: 28, left: '16%', right: '16%', height: 1, background: `linear-gradient(90deg, ${C.bord2}, rgba(37,99,235,0.4), ${C.bord2})`, pointerEvents: 'none' }} />
            )}
            {STEPS.map(({ num, title, desc, icon }) => (
              <motion.div key={num} variants={fadeUp} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `rgba(37,99,235,0.1)`, border: `1px solid ${C.bord2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
                  {icon}
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: C.blue, fontSize: 10, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{num.slice(1)}</div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, maxWidth: 260, margin: '0 auto' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PRICING ───────────────────────────────────── */}
      <section id="tarifs" style={{ padding: mobile ? '80px 24px' : '120px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Tarifs simples et transparents</h2>
            <p style={{ fontSize: 16, color: C.sub }}>14 jours gratuits sur tous les plans. Aucune carte bancaire requise.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
            {PLANS.map((p, i) => <PricingCard key={p.plan} {...p} delay={i * 0.1} />)}
          </div>
        </motion.div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────── */}
      <section style={{ padding: mobile ? '80px 24px' : '120px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <motion.h2 variants={fadeUp} style={{ fontSize: mobile ? 32 : 56, fontWeight: 800, letterSpacing: '-2px', color: C.text, lineHeight: 1.05, marginBottom: 20 }}>
            Prêt à éliminer la fraude<br />dans votre station ?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 17, color: C.sub, marginBottom: 40, lineHeight: 1.7 }}>
            Rejoignez 200+ stations qui font confiance à Fuelo. Sans engagement, sans carte bancaire.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"
              style={{ padding: '17px 40px', background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', borderRadius: 12, textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 30px rgba(37,99,235,0.5)', transition: 'all 0.25s', animation: 'ctaPulse 3s infinite' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(37,99,235,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(37,99,235,0.5)' }}>
              Commencer gratuitement — 14 jours
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, padding: mobile ? '40px 24px' : '48px 64px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 24 }}>
          <FueloLogo size={30} forceTextColor="#fff" />
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['Fonctionnalités', 'Tarifs', 'Se connecter', 'Créer un compte'].map(l => (
              <a key={l} href={l === 'Se connecter' ? '/login' : l === 'Créer un compte' ? '/register' : `#${l.toLowerCase()}`}
                style={{ fontSize: 13, color: C.muted, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = C.text} onMouseLeave={e => e.target.style.color = C.muted}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>© 2026 Fuelo. Fait avec soin pour l'Afrique.</div>
        </div>
      </footer>

      <WhatsAppButton />

      <style>{`
        @keyframes floatPt { from { transform: translateY(0) scale(1); opacity: 0.35; } to { transform: translateY(-30px) scale(1.3); opacity: 0.1; } }
        @keyframes pulse   { 0%,100%{opacity:1;box-shadow:0 0 8px currentColor} 50%{opacity:0.4;box-shadow:none} }
        @keyframes ctaPulse { 0%,100%{box-shadow:0 4px 30px rgba(37,99,235,0.5)} 50%{box-shadow:0 4px 50px rgba(37,99,235,0.8)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.4); border-radius: 3px; }
      `}</style>
    </div>
  )
}
