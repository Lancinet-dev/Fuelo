import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import FueloLogo from '../../components/FueloLogo'
import WhatsAppButton from '../../ui/WhatsAppButton'

// ── Palette───────────────────────────────────────────
const C = {
  bg:     '#020817',
  bg2:    '#060D1C',
  blue:   '#2563EB',
  soft:   '#60A5FA',
  dark:   '#1D4ED8',
  orange: '#F59E0B',
  gold:   '#D4AF37',
  violet: '#7C3AED',
  green:  '#10B981',
  red:    '#EF4444',
  text:   '#FFFFFF',
  sub:    '#94A3B8',
  muted:  'rgba(255,255,255,0.38)',
  card:   'rgba(255,255,255,0.03)',
  glass:  'rgba(255,255,255,0.045)',
  border: 'rgba(255,255,255,0.08)',
  bord2:  'rgba(37,99,235,0.28)',
}

// ── Variants Framer Motion ────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 46 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const fadeLeft = {
  hidden:  { opacity: 0, x: -70 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const fadeRight = {
  hidden:  { opacity: 0, x: 70 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

// Pseudo-aléatoire déterministe — évite Math.random() pendant le render
function seededRandom(seed) {
  let t = seed + 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

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
          const p = Math.min((Date.now() - t0) / 1700, 1)
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
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{count}{suffix}</span>
}

// ── Particules flottantes ─────────────────────────────
function Particles({ count = 28 }) {
  const pts = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: seededRandom(i * 7 + 1) * 100,
    y: seededRandom(i * 11 + 2) * 100,
    size: seededRandom(i * 13 + 3) * 2.4 + 1,
    color: i % 5 === 0 ? C.orange : i % 3 === 0 ? C.soft : C.blue,
    dur: 11 + seededRandom(i * 17 + 4) * 22,
    delay: seededRandom(i * 19 + 5) * 10,
  })), [count])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%', background: p.color, opacity: 0.32,
          animation: `floatPt ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  )
}

// ── Grille de points animée (style Linear) ───────────
function DotGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(rgba(96,165,250,0.16) 1px, transparent 1.4px)`,
        backgroundSize: '34px 34px',
        animation: 'gridPulse 6s ease-in-out infinite',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 20%, transparent 80%)',
      }} />
    </div>
  )
}

// ── Orbes de lumière flottants ────────────────────────
function Orbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: '8%', left: '6%', width: 480, height: 480, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(37,99,235,0.30) 0%, transparent 70%)`, filter: 'blur(60px)',
        animation: 'orbFloatA 22s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '4%', right: '8%', width: 420, height: 420, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 70%)`, filter: 'blur(60px)',
        animation: 'orbFloatB 26s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', top: '38%', right: '26%', width: 260, height: 260, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)`, filter: 'blur(50px)',
        animation: 'orbFloatA 18s ease-in-out infinite reverse',
      }} />
    </div>
  )
}

// ── Mockup d'application (effet 3D au survol) ────────
function AppMockup({ width = 560 }) {
  const ref = useRef(null)
  const handle = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1400px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.015)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = 'perspective(1400px) rotateY(0) rotateX(0) scale(1)' }
  const bars = [62, 84, 48, 96, 70, 58, 88]
  return (
    <div
      ref={ref} onMouseMove={handle} onMouseLeave={reset}
      style={{
        width, maxWidth: '100%', borderRadius: 20, padding: 18,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
        border: `1px solid ${C.border}`, backdropFilter: 'blur(18px)',
        boxShadow: '0 40px 100px rgba(2,8,23,0.55), 0 0 0 1px rgba(255,255,255,0.02)',
        transition: 'transform 0.25s ease', willChange: 'transform',
      }}>
      {/* barre fenêtre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: C.red, opacity: 0.7 }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: C.orange, opacity: 0.7 }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: C.green, opacity: 0.7 }} />
        <div style={{ marginLeft: 14, height: 8, width: 140, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
      </div>
      {/* contenu */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'Ventes du jour', value: '2 480 000 GNF', color: C.soft },
          { label: 'Stock essence', value: '8 240 L', color: C.green },
          { label: 'Alertes actives', value: '2', color: C.orange },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 16px 12px', display: 'flex', alignItems: 'flex-end', gap: 10, height: 132 }}>
        {bars.map((h, i) => (
          <motion.div key={i}
            initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
            style={{ flex: 1, borderRadius: '6px 6px 2px 2px', background: i === 3 ? `linear-gradient(180deg, ${C.soft}, ${C.blue})` : 'rgba(96,165,250,0.18)' }} />
        ))}
      </div>
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs',          href: '#tarifs' },
  { label: 'À propos',        href: '#apropos' },
]

function Navbar({ solid, mobile }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.nav initial={{ y: -90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: solid ? 'rgba(2,8,23,0.78)' : 'transparent',
        backdropFilter: solid ? 'blur(20px) saturate(140%)' : 'none',
        borderBottom: `1px solid ${solid ? C.border : 'transparent'}`,
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        padding: mobile ? '14px 20px' : '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex' }}>
        <FueloLogo size={52} forceTextColor="#fff" />
      </Link>

      {mobile ? (
        <>
          <button onClick={() => setOpen(o => !o)} aria-label="Menu" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 10px', cursor: 'pointer', color: C.text, display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}
                style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgba(2,8,23,0.97)', backdropFilter: 'blur(22px)', borderBottom: `1px solid ${C.border}`, padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {NAV_LINKS.map(l => (
                  <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ color: C.sub, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{l.label}</a>
                ))}
                <div style={{ height: 1, background: C.border, margin: '4px 0' }} />
                <Link to="/login" onClick={() => setOpen(false)} style={{ textAlign: 'center', color: C.text, fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '12px 0', borderRadius: 10, border: `1px solid ${C.border}` }}>Connexion</Link>
                <Link to="/register" onClick={() => setOpen(false)} style={{ textAlign: 'center', background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', padding: '13px 0', borderRadius: 10, boxShadow: '0 4px 22px rgba(37,99,235,0.4)' }}>Commencer</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 36 }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} style={{ color: C.sub, fontSize: 14, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.text} onMouseLeave={e => e.currentTarget.style.color = C.sub}>{l.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/login" style={{
                color: C.text, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                padding: '10px 22px', borderRadius: 10, border: `1px solid ${C.border}`, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}>
              Connexion
            </Link>
            <Link to="/register" style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', fontSize: 14, textDecoration: 'none', fontWeight: 700, padding: '10px 24px', borderRadius: 10, boxShadow: '0 4px 20px rgba(37,99,235,0.38)', transition: 'all 0.2s', display: 'inline-block' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.38)' }}>
              Commencer
            </Link>
          </div>
        </>
      )}
    </motion.nav>
  )
}

// ── Logos défilants (preuve sociale) ──────────────────
const FAKE_BRANDS = ['Station Soleil', 'AfriPetrol', 'Diamant Fuel', 'Baobab Énergie', 'Sahel Oil', 'Atlantique Gaz', 'Étoile du Niger', 'Teranga Fuel']

function BrandPill({ name }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', background: C.glass, border: `1px solid ${C.border}`, borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(135deg, ${C.soft}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
        {name.charAt(0)}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>{name}</span>
    </div>
  )
}

function Marquee() {
  const row = [...FAKE_BRANDS, ...FAKE_BRANDS]
  return (
    <div style={{ position: 'relative', overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)' }}>
      <div style={{ display: 'flex', gap: 16, width: 'max-content', animation: 'marquee 34s linear infinite' }}>
        {row.map((n, i) => <BrandPill key={`${n}-${i}`} name={n} />)}
      </div>
    </div>
  )
}

// ── Feature Card ──────────────────────────────────────
function FeatureCard({ icon, title, desc, color }) {
  const ref = useRef(null)
  const handle = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`
    el.style.boxShadow = `0 24px 60px -16px ${color}33, 0 0 0 1px ${color}22`
  }
  const reset = () => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)'
    ref.current.style.boxShadow = 'none'
  }
  return (
    <motion.div ref={ref} variants={fadeUp} onMouseMove={handle} onMouseLeave={reset}
      style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '30px 26px', cursor: 'default', transition: 'transform 0.2s ease, box-shadow 0.3s ease', backdropFilter: 'blur(10px)', willChange: 'transform' }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '-0.3px' }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  )
}

// ── Démo interactive — mockups par onglet ────────────
function DemoDashboard() {
  const rows = [
    { label: 'Essence', pct: 78, color: C.soft },
    { label: 'Gasoil',  pct: 54, color: C.green },
    { label: 'Pétrole', pct: 32, color: C.orange },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Niveaux de stock</div>
        {rows.map(r => (
          <div key={r.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.sub, marginBottom: 6 }}>
              <span>{r.label}</span><span style={{ color: r.color, fontWeight: 700 }}>{r.pct}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${r.pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 4, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Activité du jour</div>
        {[
          { t: 'Vente enregistrée — 80 000 GNF', c: C.green },
          { t: 'Livraison reçue — Citerne #04',  c: C.soft },
          { t: 'Alerte stock faible — Gasoil',   c: C.orange },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: C.sub }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.c, flexShrink: 0 }} />
            {a.t}
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoAntifraude() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {['Photo départ', 'Photo fin de service'].map((label, i) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{label}</div>
          <div style={{ position: 'relative', height: 92, borderRadius: 10, background: 'linear-gradient(160deg, rgba(96,165,250,0.14), rgba(37,99,235,0.05))', border: `1px dashed ${C.bord2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            <motion.div initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 260, damping: 16 }}
              style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${C.green}88` }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </motion.div>
          </div>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.28)', borderRadius: 12, padding: '12px 16px' }}>
        <span style={{ fontSize: 13, color: C.sub }}>Écart théorique / réel</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.green, display: 'flex', alignItems: 'center', gap: 6 }}>
          2.4 L <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.18)' }}>Conforme</span>
        </span>
      </div>
    </div>
  )
}

function DemoGPS() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden', height: 220 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(96,165,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.05) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
      <svg width="100%" height="100%" viewBox="0 0 360 180" style={{ position: 'relative' }}>
        <path d="M30 150 C 100 150, 110 60, 180 70 S 300 130, 330 40" stroke="rgba(96,165,250,0.35)" strokeWidth="3" fill="none" strokeDasharray="7 7" />
        <circle cx="30" cy="150" r="6" fill={C.soft} />
        <circle cx="330" cy="40" r="6" fill={C.orange} />
        <text x="14" y="170" fill={C.muted} fontSize="10">Citerne #04</text>
        <text x="288" y="28" fill={C.muted} fontSize="10">Station Conakry</text>
        <motion.circle r="6.5" fill={C.blue} stroke="#fff" strokeWidth="2"
          animate={{ offsetDistance: ['0%', '100%'] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          style={{ offsetPath: `path('M30 150 C 100 150, 110 60, 180 70 S 300 130, 330 40')`, filter: `drop-shadow(0 0 8px ${C.blue})` }} />
        <motion.circle cx="180" cy="70" r="9" fill="none" stroke={C.red} strokeWidth="2"
          animate={{ scale: [1, 1.9], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
        <circle cx="180" cy="70" r="4" fill={C.red} />
        <text x="192" y="74" fill={C.red} fontSize="10" fontWeight="700">Arrêt suspect</text>
      </svg>
    </div>
  )
}

const DEMO_TABS = [
  { id: 'dashboard',  label: 'Dashboard',    render: DemoDashboard },
  { id: 'antifraude', label: 'Anti-fraude',  render: DemoAntifraude },
  { id: 'gps',        label: 'GPS',          render: DemoGPS },
]

// ── Pricing ───────────────────────────────────────────
const RATES   = { USD: 1, EUR: 0.92, GNF: 8600, FCFA: 600 }
const SYMBOLS = { USD: '$', EUR: '€', GNF: 'GNF', FCFA: 'FCFA' }

function formatMoney(usd, currency) {
  const value = usd * RATES[currency]
  const rounded = (currency === 'USD' || currency === 'EUR') ? Math.round(value) : Math.round(value / 100) * 100
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (currency === 'USD' || currency === 'EUR') ? `${SYMBOLS[currency]}${grouped}` : `${grouped} ${SYMBOLS[currency]}`
}

function PricingCard({ plan, priceUsd, accent, badge, features, period, currency }) {
  const monthly = period === 'annual' ? priceUsd * 0.8 : priceUsd
  const highlighted = plan === 'Pro'
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -8, scale: 1.015 }} transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      style={{
        background: highlighted ? `linear-gradient(150deg, rgba(37,99,235,0.16), rgba(29,78,216,0.05))` : C.card,
        border: `1px solid ${highlighted ? C.bord2 : C.border}`,
        borderRadius: 22, padding: '34px 28px', position: 'relative', overflow: 'hidden',
        boxShadow: highlighted ? '0 0 70px rgba(37,99,235,0.22), inset 0 1px 0 rgba(96,165,250,0.22)' : 'none',
        backdropFilter: 'blur(14px)',
      }}>
      {badge && (
        <div style={{ position: 'absolute', top: 18, right: 18, background: highlighted ? `linear-gradient(135deg, ${C.blue}, ${C.dark})` : `linear-gradient(135deg, ${C.gold}, #B8860B)`,
          color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '5px 13px', borderRadius: 100, letterSpacing: '0.08em',
          boxShadow: highlighted ? '0 0 24px rgba(37,99,235,0.6)' : '0 0 24px rgba(212,175,55,0.5)' }}>
          {badge}
        </div>
      )}
      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}18`, border: `1px solid ${accent}38`, marginBottom: 18 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: highlighted ? C.soft : C.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{plan}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, minHeight: 52 }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: C.text, letterSpacing: '-1.5px' }}>{formatMoney(monthly, currency)}</span>
        <span style={{ fontSize: 13, color: C.muted }}>/ mois</span>
      </div>
      {period === 'annual' ? (
        <div style={{ fontSize: 12, color: C.green, marginBottom: 18 }}>
          Facturé annuellement · économisez {formatMoney(priceUsd * 12 * 0.2, currency)}/an
        </div>
      ) : <div style={{ marginBottom: 18 }} />}
      <div style={{ height: 1, background: C.border, marginBottom: 22 }} />
      {features.map(({ label, included }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, opacity: included ? 1 : 0.4 }}>
          {included ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={highlighted ? C.soft : C.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          )}
          <span style={{ fontSize: 13.5, color: included ? C.sub : C.muted, textDecoration: included ? 'none' : 'line-through' }}>{label}</span>
        </div>
      ))}
      <Link to="/register" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginTop: 26, padding: '13px 0', textAlign: 'center', borderRadius: 12, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
          color: highlighted ? '#fff' : C.text,
          background: highlighted ? `linear-gradient(135deg, ${C.blue}, ${C.dark})` : 'rgba(255,255,255,0.06)',
          border: highlighted ? 'none' : `1px solid ${C.border}`,
          boxShadow: highlighted ? '0 8px 30px rgba(37,99,235,0.45)' : 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; if (highlighted) e.currentTarget.style.boxShadow = '0 14px 40px rgba(37,99,235,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (highlighted) e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.45)' }}>
        Commencer
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </Link>
    </motion.div>
  )
}

// ── Étoiles ───────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < count ? C.orange : 'none'} stroke={C.orange} strokeWidth="1.6">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

// ── Accordion FAQ ─────────────────────────────────────
function FaqItem({ q, a, open, onClick }) {
  return (
    <motion.div variants={fadeUp} style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onClick} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'none', border: 'none', cursor: 'pointer', padding: '22px 4px', textAlign: 'left',
        }}>
        <span style={{ fontSize: 15.5, fontWeight: 600, color: C.text }}>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}
          style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.soft }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </motion.span>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, paddingBottom: 22, paddingRight: 40 }}>{a}</p>
      </motion.div>
    </motion.div>
  )
}

// ── LANDING ───────────────────────────────────────────
export default function Landing() {
  const w       = useWidth()
  const mobile  = w < 768
  const tablet  = w < 1024
  const reduced = useReducedMotion()

  const [navSolid, setNavSolid] = useState(false)
  const { scrollY } = useScroll()
  const heroY  = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 160])
  const heroOp = useTransform(scrollY, [0, 420], [1, reduced ? 1 : 0])

  useEffect(() => {
    const unsub = scrollY.on('change', v => setNavSolid(v > 60))
    return unsub
  }, [scrollY])

  const [demoTab, setDemoTab]   = useState('dashboard')
  const [period, setPeriod]     = useState('monthly')
  const [currency, setCurrency] = useState('USD')
  const [openFaq, setOpenFaq]   = useState(0)

  const STATS = [
    { value: 500, suffix: 'L',  label: 'économisés / mois' },
    { value: 99,  suffix: '%',  label: 'fraude détectée' },
    { value: 50,  suffix: '+',  label: 'stations actives' },
  ]

  const PROBLEMS = [
    'Vols de carburant par les pompistes — pertes mensuelles invisibles',
    'Vol de carburant au cours du transport',
    'Aucune visibilité en temps réel sur le stock',
    'Rapports manuels, lents et peu fiables',
    'Employés mal encadrés, fraude impossible à prouver',
  ]
  const SOLUTIONS = [
    'Photos compteur + détection automatique des écarts pompiste',
    'GPS temps réel et alertes d\'arrêt suspect sur chaque citerne',
    'Tableau de bord live, accessible depuis le téléphone',
    'Rapports PDF et Excel générés automatiquement',
    'Rôles et permissions stricts — traçabilité totale',
  ]

  const FEATURES = [
    {
      color: C.red, title: 'Anti-fraude pompistes',
      desc: 'Photos compteur obligatoires au départ et à l\'arrivée, overlay de verrouillage pendant le service, alerte automatique si l\'écart dépasse 10L.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
    },
    {
      color: C.soft, title: 'GPS citernes temps réel',
      desc: 'Suivi GPS de chaque camion-citerne, détection automatique des arrêts suspects et QR code anti-vol sur chaque équipement.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>,
    },
    {
      color: C.orange, title: 'Alertes intelligentes',
      desc: 'Notifications instantanées — stock faible, fraude détectée, arrêt suspect — directement sur le téléphone du gérant, en temps réel.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    },
    {
      color: C.violet, title: 'Multi-stations unifié',
      desc: 'Pilotez toutes vos stations depuis un seul tableau de bord, switchez de site en un clic et consolidez vos rapports automatiquement.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.violet} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      color: C.green, title: 'Rapports automatiques',
      desc: 'Exports PDF et Excel générés en un clic et mis en forme automatiquement — ventes, stock, primes employés, trajets logistique.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    },
    {
      color: C.gold, title: 'Rôles et permissions',
      desc: 'Hiérarchie stricte owner → gérant → pompiste : chacun ne voit et ne gère que son propre périmètre, avec une traçabilité complète.',
      icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    },
  ]

  const PLANS = [
    {
      plan: 'Starter', priceUsd: 50, accent: C.muted, badge: null,
      features: [
        { label: '1 station',                 included: true },
        { label: '5 employés',                included: true },
        { label: 'Ventes & stock',            included: true },
        { label: 'Alertes par email',         included: true },
        { label: 'Anti-fraude pompiste',      included: false },
        { label: 'GPS citernes',              included: false },
      ],
    },
    {
      plan: 'Pro', priceUsd: 150, accent: C.soft, badge: 'POPULAIRE',
      features: [
        { label: '3 stations',                included: true },
        { label: '20 employés',               included: true },
        { label: 'Anti-fraude pompiste',      included: true },
        { label: 'GPS citernes temps réel',   included: true },
        { label: 'Primes & performance',      included: true },
        { label: 'Support prioritaire',       included: true },
      ],
    },
    {
      plan: 'Enterprise', priceUsd: 300, accent: C.gold, badge: 'SUR-MESURE',
      features: [
        { label: 'Stations illimitées',       included: true },
        { label: 'Employés illimités',        included: true },
        { label: 'Tout Pro inclus',           included: true },
        { label: 'API dédiée',                included: true },
        { label: 'Manager de compte dédié',   included: true },
        { label: 'SLA garanti',               included: true },
      ],
    },
  ]

  const TESTIMONIALS = [
    {
      quote: 'Depuis Fuelo, on a arrêté de perdre des litres chaque mois sans savoir pourquoi. Les photos compteur ont changé le comportement de toute l\'équipe.',
      name: 'Aïssatou Diallo', role: 'Gérante — Station Soleil, Conakry', stars: 5,
    },
    {
      quote: 'Le suivi GPS des citernes m\'a permis de repérer un vol de carburant pendant le transport. Sans Fuelo, je ne l\'aurais jamais su.',
      name: 'Moussa Camara', role: 'Propriétaire — AfriPetrol, Kindia', stars: 5,
    },
    {
      quote: 'Les rapports Excel se génèrent tout seuls, avec une mise en forme propre. Je gagne des heures chaque semaine sur la logistique.',
      name: 'Fatoumata Bah', role: 'Logisticienne — Diamant Fuel, Labé', stars: 4,
    },
  ]

  const FAQS = [
    { q: 'Comment fonctionne l\'essai gratuit ?', a: 'Vous créez votre compte en deux minutes et profitez de 14 jours d\'accès complet, sans carte bancaire. À la fin de la période, vous choisissez le plan qui correspond à votre station.' },
    { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Fuelo accepte Orange Money, MTN Mobile Money, PayCard et Kulu — adaptés aux réalités de paiement en Afrique de l\'Ouest, sans passer par une carte bancaire internationale.' },
    { q: 'Mes données sont-elles sécurisées ?', a: 'Oui : authentification JWT, mots de passe chiffrés, connexions HTTPS et base de données hébergée chez Neon (PostgreSQL) avec sauvegardes automatiques quotidiennes.' },
    { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace abonnement. Le changement prend effet immédiatement.' },
    { q: 'Fuelo fonctionne-t-il sans connexion internet ?', a: 'Fuelo est une application web et mobile (PWA) qui nécessite une connexion pour synchroniser les données en temps réel. Une connexion mobile standard suffit amplement.' },
    { q: 'Combien de temps pour configurer ma station ?', a: 'Comptez environ 5 minutes : ajoutez vos produits, vos prix, vos seuils d\'alerte et invitez vos employés. L\'onboarding vous guide pas à pas dès la première connexion.' },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg, color: C.text, overflowX: 'hidden' }}>
      <Navbar solid={navSolid} mobile={mobile} />

      {/* ══ 1. HERO ══════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: mobile ? 96 : 0 }}>
        <DotGrid />
        {!reduced && <Orbs />}
        <Particles count={mobile ? 14 : 26} />

        <motion.div style={{ y: heroY, opacity: heroOp, position: 'relative', zIndex: 2, textAlign: 'center', padding: mobile ? '40px 22px 60px' : '0 24px', maxWidth: 920, margin: '0 auto' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(37,99,235,0.10)', border: `1px solid ${C.bord2}`, borderRadius: 100, padding: '7px 20px', marginBottom: 32, boxShadow: '0 0 30px rgba(37,99,235,0.25)' }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.soft, letterSpacing: '0.06em' }}>Anti-fraude avancé</span>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'pulse 2s infinite' }} />
          </motion.div>

          {/* Titre */}
          <motion.h1 initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ fontSize: mobile ? 40 : tablet ? 60 : 80, fontWeight: 800, lineHeight: 1.04, letterSpacing: '-3px', marginBottom: 26, color: C.text }}>
            Gérez vos stations.<br />
            Éliminez la{' '}
            <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'nowrap' }}>
              <span style={{ background: `linear-gradient(135deg, ${C.soft}, ${C.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>fraude</span>
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.15, duration: 0.55, ease: 'easeInOut' }}
                style={{ position: 'absolute', left: -4, right: -4, top: '54%', height: mobile ? 3 : 4, background: C.red, borderRadius: 2, transformOrigin: 'left', boxShadow: `0 0 14px ${C.red}` }} />
            </span>.
          </motion.h1>

          {/* Sous-titre */}
          <motion.p initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
            style={{ fontSize: mobile ? 16 : 19, color: C.sub, lineHeight: 1.7, maxWidth: 620, margin: '0 auto 44px', fontWeight: 400 }}>
            Le seul SaaS qui protège vos stations-service en temps réel grâce au GPS, aux photos et à l'intelligence artificielle.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.66, duration: 0.6 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link to="/register"
              style={{ padding: mobile ? '14px 26px' : '16px 36px', background: `linear-gradient(135deg, ${C.blue}, ${C.dark})`, color: '#fff', borderRadius: 13, textDecoration: 'none', fontSize: 15.5, fontWeight: 700, boxShadow: '0 8px 36px rgba(37,99,235,0.5)', transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 9 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 46px rgba(37,99,235,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(37,99,235,0.5)' }}>
              Commencer gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
            <a href="#demo"
              style={{ padding: mobile ? '14px 26px' : '16px 32px', background: 'rgba(255,255,255,0.04)', color: C.text, borderRadius: 13, textDecoration: 'none', fontSize: 15.5, fontWeight: 600, border: `1px solid ${C.border}`, transition: 'all 0.25s', display: 'inline-flex', alignItems: 'center', gap: 9 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.border }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Voir la démo
            </a>
          </motion.div>

          {/* Compteurs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.8 }}
            style={{ display: 'flex', gap: mobile ? 28 : 56, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: mobile ? 26 : 34, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, lineHeight: 1, marginBottom: 6 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Mockup */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'flex', justifyContent: 'center' }}>
            <AppMockup width={mobile ? 340 : tablet ? 480 : 600} />
          </motion.div>
        </motion.div>

        <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', opacity: 0.32, zIndex: 2 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.soft} strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.div>
      </section>

      {/* ══ 2. PREUVE SOCIALE ════════════════════════ */}
      <section style={{ padding: mobile ? '48px 0 56px' : '64px 0 76px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bg2 }}>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 30 }}>
          Ils nous font confiance
        </motion.p>
        <Marquee />
      </section>

      {/* ══ 3. PROBLÈME → SOLUTION ═══════════════════ */}
      <section id="apropos" style={{ padding: mobile ? '80px 22px' : '128px 48px', maxWidth: 1180, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: mobile ? 28 : 46, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 14, lineHeight: 1.15 }}>
            La fraude coûte cher.<br />Fuelo y met fin.
          </h2>
          <p style={{ fontSize: 16, color: C.sub, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Un constat partagé par des dizaines de propriétaires de stations en Afrique de l'Ouest — et la réponse que Fuelo y apporte.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 24 }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeLeft}
            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 22, padding: mobile ? '28px 24px' : '36px 34px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text }}>Le problème</h3>
            </div>
            {PROBLEMS.map(p => (
              <div key={p} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.4" strokeLinecap="round" style={{ marginTop: 3, flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.65 }}>{p}</span>
              </div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={fadeRight}
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 22, padding: mobile ? '28px 24px' : '36px 34px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: C.text }}>Notre solution</h3>
            </div>
            {SOLUTIONS.map(s => (
              <div key={s} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.4" strokeLinecap="round" style={{ marginTop: 3, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.65 }}>{s}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ 4. FEATURES ══════════════════════════════ */}
      <section id="fonctionnalites" style={{ padding: mobile ? '64px 22px 96px' : '80px 48px 128px', maxWidth: 1220, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.08)', border: `1px solid ${C.bord2}`, borderRadius: 100, padding: '5px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Fonctionnalités</span>
            </div>
            <h2 style={{ fontSize: mobile ? 30 : 48, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 16, lineHeight: 1.1 }}>
              Tout ce dont vous avez besoin.
            </h2>
            <p style={{ fontSize: 16, color: C.sub, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>Conçu spécifiquement pour les réalités des stations-service d'Afrique de l'Ouest.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : tablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 22 }}>
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </motion.div>
      </section>

      {/* ══ 5. DÉMO INTERACTIVE ══════════════════════ */}
      <section id="demo" style={{ background: C.bg2, padding: mobile ? '80px 22px' : '128px 48px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Voyez Fuelo en action</h2>
            <p style={{ fontSize: 16, color: C.sub }}>Un aperçu des outils que vos équipes utilisent chaque jour.</p>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {DEMO_TABS.map(t => (
              <button key={t.id} onClick={() => setDemoTab(t.id)}
                style={{
                  padding: '10px 22px', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${demoTab === t.id ? C.bord2 : C.border}`,
                  background: demoTab === t.id ? 'rgba(37,99,235,0.14)' : 'rgba(255,255,255,0.03)',
                  color: demoTab === t.id ? C.soft : C.sub, transition: 'all 0.2s',
                }}>
                {t.label}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
              border: `1px solid ${C.border}`, borderRadius: 22, padding: mobile ? 18 : 28, backdropFilter: 'blur(16px)',
              boxShadow: '0 40px 90px rgba(2,8,23,0.5)',
            }}>
            <AnimatePresence mode="wait">
              <motion.div key={demoTab}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.3 }}>
                {DEMO_TABS.find(t => t.id === demoTab).render()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ 6. PRICING ═══════════════════════════════ */}
      <section id="tarifs" style={{ padding: mobile ? '80px 22px' : '128px 48px', maxWidth: 1220, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Tarifs transparents</h2>
            <p style={{ fontSize: 16, color: C.sub }}>14 jours d'essai gratuits sur tous les plans. Aucune carte bancaire requise.</p>
          </motion.div>

          {/* Toggle + devise */}
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 100, padding: 4, gap: 2 }}>
              {[['monthly', 'Mensuel'], ['annual', 'Annuel']].map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)}
                  style={{
                    padding: '9px 22px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                    background: period === key ? `linear-gradient(135deg, ${C.blue}, ${C.dark})` : 'transparent',
                    color: period === key ? '#fff' : C.sub, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  {label}
                  {key === 'annual' && (
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: period === 'annual' ? 'rgba(255,255,255,0.22)' : 'rgba(16,185,129,0.16)', color: period === 'annual' ? '#fff' : C.green }}>-20%</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, borderRadius: 100, padding: 4, gap: 2 }}>
              {Object.keys(RATES).map(cur => (
                <button key={cur} onClick={() => setCurrency(cur)}
                  style={{
                    padding: '9px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                    background: currency === cur ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: currency === cur ? C.text : C.muted, transition: 'all 0.2s',
                  }}>
                  {cur}
                </button>
              ))}
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 24, alignItems: 'start' }}>
            {PLANS.map(p => <PricingCard key={p.plan} {...p} period={period} currency={currency} />)}
          </div>
        </motion.div>
      </section>

      {/* ══ 7. TÉMOIGNAGES ═══════════════════════════ */}
      <section style={{ background: C.bg2, padding: mobile ? '80px 22px' : '128px 48px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          style={{ maxWidth: 1180, margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Ce qu'ils en disent</h2>
            <p style={{ fontSize: 16, color: C.sub }}>Des propriétaires et gérants qui ont repris le contrôle de leur station.</p>
          </motion.div>

          <div style={{
              display: mobile ? 'flex' : 'grid', gridTemplateColumns: mobile ? undefined : 'repeat(3, 1fr)',
              gap: 22, overflowX: mobile ? 'auto' : 'visible', paddingBottom: mobile ? 8 : 0,
              scrollSnapType: mobile ? 'x mandatory' : 'none',
            }}>
            {TESTIMONIALS.map(t => (
              <motion.div key={t.name} variants={fadeUp}
                style={{
                  background: C.glass, border: `1px solid ${C.border}`, borderRadius: 20, padding: '30px 28px',
                  backdropFilter: 'blur(10px)', minWidth: mobile ? '82%' : undefined, scrollSnapAlign: mobile ? 'start' : undefined,
                  display: 'flex', flexDirection: 'column', gap: 18,
                }}>
                <Stars count={t.stars} />
                <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.75, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.soft}, ${C.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: C.muted }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 8. FAQ ═══════════════════════════════════ */}
      <section style={{ padding: mobile ? '80px 22px' : '128px 48px', maxWidth: 820, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: mobile ? 28 : 44, fontWeight: 800, letterSpacing: '-1.5px', color: C.text, marginBottom: 12 }}>Questions fréquentes</h2>
            <p style={{ fontSize: 16, color: C.sub }}>Tout ce que vous devez savoir avant de vous lancer.</p>
          </motion.div>
          <div>
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 9. CTA FINAL ═════════════════════════════ */}
      <section style={{ padding: mobile ? '88px 22px' : '140px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(124,58,237,0.18) 50%, rgba(2,8,23,0) 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(37,99,235,0.16) 0%, transparent 70%)' }} />
        {!reduced && <Particles count={mobile ? 16 : 34} />}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <motion.h2 variants={fadeUp} style={{ fontSize: mobile ? 34 : 58, fontWeight: 800, letterSpacing: '-2px', color: C.text, lineHeight: 1.08, marginBottom: 20 }}>
            Prêt à protéger<br />vos stations ?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 17, color: C.sub, marginBottom: 44, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 44px' }}>
            Rejoignez les stations qui font confiance à Fuelo pour éliminer la fraude et piloter leur activité en temps réel.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: mobile ? '18px 36px' : '20px 48px', background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`, color: '#fff', borderRadius: 14, textDecoration: 'none', fontSize: mobile ? 16 : 18, fontWeight: 800, boxShadow: '0 8px 40px rgba(37,99,235,0.55)', transition: 'all 0.25s', animation: 'ctaPulse 3s infinite' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}>
              Commencer gratuitement — 14 jours
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══ 10. FOOTER ═══════════════════════════════ */}
      <footer style={{ background: C.bg2, borderTop: `1px solid ${C.border}`, padding: mobile ? '52px 22px 32px' : '72px 48px 36px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : tablet ? '1.4fr 1fr 1fr' : '1.6fr 1fr 1fr 1fr', gap: mobile ? 36 : 32, marginBottom: 44 }}>
            <div>
              <FueloLogo size={40} forceTextColor="#fff" />
              <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.7, marginTop: 16, maxWidth: 280 }}>
                Le SaaS de gestion de stations-service pensé pour l'Afrique de l'Ouest. Stock, ventes, alertes et anti-fraude — en temps réel.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                {[
                  { label: 'WhatsApp', d: 'M17.6 6.32A8.86 8.86 0 0012.04 4 8.94 8.94 0 003.5 16.78L2 21l4.34-1.45a8.9 8.9 0 004.7 1.34A8.94 8.94 0 0017.6 6.32zM12.04 19.4a7.4 7.4 0 01-3.78-1.04l-.27-.16-2.8.93.94-2.74-.18-.28a7.45 7.45 0 1112.6-3.97 7.43 7.43 0 01-6.5 7.26z' },
                  { label: 'Facebook', d: 'M22 12a10 10 0 10-11.56 9.88v-7H7.9V12h2.54V9.8c0-2.5 1.5-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.88h-2.33v7A10 10 0 0022 12z' },
                  { label: 'LinkedIn', d: 'M6.94 5a2 2 0 11-4-.02 2 2 0 014 .02zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.66-2.91l-.02-1.68z' },
                ].map(s => (
                  <a key={s.label} href="#" aria-label={s.label} onClick={e => e.preventDefault()}
                    style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.soft; e.currentTarget.style.borderColor = C.bord2; e.currentTarget.style.background = 'rgba(37,99,235,0.08)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={s.d} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Produit', links: [['Fonctionnalités', '#fonctionnalites'], ['Tarifs', '#tarifs'], ['Démo', '#demo'], ['Connexion', '/login']] },
              { title: 'Entreprise', links: [['À propos', '#apropos'], ['Témoignages', '#'], ['FAQ', '#'], ['Créer un compte', '/register']] },
              { title: 'Contact', links: [['support@fuelo.africa', 'mailto:support@fuelo.africa'], ['Conakry, Guinée', '#'], ['Lun – Sam, 8h – 19h', '#']] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(([label, href]) => {
                    const internal = href.startsWith('/')
                    const commonStyle = { fontSize: 13.5, color: C.sub, textDecoration: 'none', transition: 'color 0.2s' }
                    const hover = { onMouseEnter: e => e.currentTarget.style.color = C.text, onMouseLeave: e => e.currentTarget.style.color = C.sub }
                    return internal
                      ? <Link key={label} to={href} style={commonStyle} {...hover}>{label}</Link>
                      : <a key={label} href={href} style={commonStyle} {...hover}>{label}</a>
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`, marginBottom: 26 }} />

          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', alignItems: mobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14 }}>
            <span style={{ fontSize: 12.5, color: C.muted }}>© 2026 Fuelo. Fait avec soin pour l'Afrique de l'Ouest.</span>
            <span style={{ fontSize: 12.5, color: C.muted }}>Conakry · Guinée</span>
          </div>
        </div>
      </footer>

      <WhatsAppButton />

      <style>{`
        @keyframes floatPt   { from { transform: translateY(0) scale(1); opacity: 0.32; } to { transform: translateY(-30px) scale(1.3); opacity: 0.08; } }
        @keyframes pulse     { 0%,100%{opacity:1;box-shadow:0 0 8px currentColor} 50%{opacity:0.4;box-shadow:none} }
        @keyframes ctaPulse  { 0%,100%{box-shadow:0 8px 40px rgba(37,99,235,0.5)} 50%{box-shadow:0 12px 56px rgba(124,58,237,0.6)} }
        @keyframes gridPulse { 0%,100%{opacity:0.5} 50%{opacity:0.85} }
        @keyframes orbFloatA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,-50px)} }
        @keyframes orbFloatB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,40px)} }
        @keyframes marquee   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.4); border-radius: 3px; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </div>
  )
}
