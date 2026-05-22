// ================================================
// FUELO V2 — Landing Page Bleu Futuriste
// Fichier : frontend/src/features/auth/Landing.jsx
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const C = {
  bg:       '#050B18',
  bg2:      '#070F1E',
  card:     '#0A1628',
  border:   'rgba(96,165,250,0.08)',
  border2:  'rgba(37,99,235,0.25)',
  primary:  '#2563EB',
  soft:     '#60A5FA',
  glow:     'rgba(37,99,235,0.4)',
  orange:   '#F59E0B',
  text:     '#F1F5F9',
  textSub:  'rgba(241,245,249,0.55)',
  textMut:  'rgba(241,245,249,0.25)',
  green:    '#10B981',
  red:      '#EF4444',
  purple:   '#8B5CF6',
}

const heroWords = ['stations', 'ventes', 'stocks', 'alertes', 'équipes']

// ── Compteur animé ────────────────────────────────────
function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref     = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const p    = Math.min((Date.now() - start) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setCount(Math.floor(ease * target))
          if (p < 1) requestAnimationFrame(tick)
          else setCount(target)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Grille cyber animée ───────────────────────────────
function CyberGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Grille */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      {/* Glow central */}
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Lignes horizontales animées */}
      <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), rgba(96,165,250,0.5), rgba(37,99,235,0.3), transparent)', animation: 'scanline 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '65%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.15), rgba(96,165,250,0.3), rgba(37,99,235,0.15), transparent)', animation: 'scanline 6s 2s ease-in-out infinite' }} />
      {/* Points flottants */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? 3 : 2,
          height: i % 3 === 0 ? 3 : 2,
          borderRadius: '50%',
          background: i % 4 === 0 ? C.orange : C.soft,
          left: `${8 + i * 7.5}%`,
          top: `${15 + (i % 5) * 15}%`,
          opacity: 0.4,
          animation: `floatDot ${8 + i * 1.5}s ${i * 0.7}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 24px',
      background: scrolled ? 'rgba(5,11,24,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? `0.5px solid rgba(96,165,250,0.1)` : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, background: C.orange, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(245,158,11,0.5)' }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.7" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fff' }}>fuel</span>
            <span style={{ color: C.orange }}>o</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {[['Fonctionnalités', 'features'], ['Témoignages', 'testimonials'], ['Tarifs', 'pricing'], ['FAQ', 'faq']].map(([l, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = C.textSub}
            >{l}</button>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', borderRadius: 9, border: `1px solid rgba(96,165,250,0.2)`, background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(37,99,235,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent' }}
          >Connexion</button>
          <button onClick={() => navigate('/register')}
            style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #1D4ED8)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.4)' }}
          >Essai gratuit →</button>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────
function Hero({ navigate }) {
  const [typed, setTyped]       = useState('')
  const [wIdx, setWIdx]         = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = heroWords[wIdx]
    const timeout = setTimeout(() => {
      if (!deleting) {
        if (typed.length < word.length) setTyped(word.slice(0, typed.length + 1))
        else setTimeout(() => setDeleting(true), 1600)
      } else {
        if (typed.length > 0) setTyped(typed.slice(0, -1))
        else { setDeleting(false); setWIdx(i => (i + 1) % heroWords.length) }
      }
    }, deleting ? 55 : 95)
    return () => clearTimeout(timeout)
  }, [typed, deleting, wIdx])

  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <CyberGrid />

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 100, padding: '6px 20px', fontSize: 13, color: C.soft, marginBottom: 36, position: 'relative', zIndex: 1, animation: 'fadeDown 0.8s ease both' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.soft, animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
        <span style={{ fontWeight: 600 }}>200+ stations africaines font confiance à Fuelo</span>
        <span style={{ color: C.textMut, fontSize: 11 }}>· v2.0</span>
      </div>

      {/* Titre */}
      <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 82px)', fontWeight: 800, color: '#fff', lineHeight: 1.04, letterSpacing: '-3px', marginBottom: 26, maxWidth: 880, position: 'relative', zIndex: 1, animation: 'fadeUp 0.9s 0.1s both ease' }}>
        Gérez vos{' '}
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ background: `linear-gradient(135deg, ${C.soft} 0%, #818CF8 60%, ${C.soft} 100%)`, backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmerText 3s linear infinite' }}>
            {typed}
          </span>
          <span style={{ borderRight: `3px solid ${C.soft}`, animation: 'blink 1s infinite', marginLeft: 2 }}></span>
        </span>
        <br />depuis votre téléphone
      </h1>

      <p style={{ fontSize: 18, color: C.textSub, maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.8, position: 'relative', zIndex: 1, animation: 'fadeUp 0.9s 0.2s both ease' }}>
        La première plateforme SaaS pensée pour les stations-service africaines. Stock, ventes, alertes et équipes — tout en temps réel.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60, position: 'relative', zIndex: 1, animation: 'fadeUp 0.9s 0.3s both ease' }}>
        <button onClick={() => navigate('/register')}
          style={{ padding: '16px 38px', borderRadius: 13, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #1D4ED8)`, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(37,99,235,0.45)', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 44px rgba(37,99,235,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.45)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Démarrer gratuitement — 14 jours
        </button>
        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ padding: '16px 28px', borderRadius: 13, border: `1px solid rgba(96,165,250,0.2)`, background: 'rgba(37,99,235,0.05)', color: 'rgba(255,255,255,0.8)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.05)'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.2)' }}
        >Voir la démo ↓</button>
      </div>

      {/* Trust bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 72, position: 'relative', zIndex: 1, animation: 'fadeUp 0.9s 0.4s both ease' }}>
        {['✓ Sans carte bancaire', '✓ 14 jours gratuits', '✓ Support WhatsApp 🇬🇳'].map(t => (
          <span key={t} style={{ fontSize: 13, color: C.textMut, fontWeight: 500 }}>{t}</span>
        ))}
      </div>

      {/* Photos stations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 960, width: '100%', marginBottom: 40, position: 'relative', zIndex: 1, animation: 'fadeUp 1s 0.45s both ease' }} className="hero-photos">
        {[
          'https://images.pexels.com/photos/32133856/pexels-photo-32133856.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/18686324/pexels-photo-18686324.jpeg?auto=compress&cs=tinysrgb&w=600',
          'https://images.pexels.com/photos/16673147/pexels-photo-16673147.jpeg?auto=compress&cs=tinysrgb&w=600',
        ].map((src, i) => (
          <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(37,99,235,0.2)', height: 200, position: 'relative', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1.08)'; e.currentTarget.querySelector('img').style.opacity = '1' }}
            onMouseLeave={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; e.currentTarget.querySelector('img').style.opacity = '0.7' }}
          >
            <img src={src} alt="Station service" loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, transition: 'all 0.5s ease', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(5,11,24,0.7))' }} />
            {/* Bordure glow */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: 'inset 0 0 0 1px rgba(96,165,250,0.2)' }} />
          </div>
        ))}
      </div>

      {/* Dashboard mockup */}
      <div style={{ maxWidth: 960, width: '100%', position: 'relative', zIndex: 1, animation: 'fadeUp 1s 0.5s both ease' }}>
        <div style={{ position: 'absolute', inset: -1, background: `linear-gradient(135deg, rgba(37,99,235,0.5), rgba(96,165,250,0.2), rgba(37,99,235,0.4))`, borderRadius: 22, filter: 'blur(20px)', opacity: 0.7 }} />
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0A1628, #070F1E)', border: `1px solid rgba(96,165,250,0.15)`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.7)' }}>
          {/* Barre titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid rgba(96,165,250,0.08)` }}>
            {['#EF4444', '#F59E0B', '#10B981'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', paddingLeft: 10, maxWidth: 300, margin: '0 auto' }}>
              <span style={{ fontSize: 11, color: C.textMut }}>🔒 app.fuelo.africa/dashboard</span>
            </div>
          </div>
          {/* Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 380 }}>
            {/* Sidebar */}
            <div style={{ background: '#060E1C', borderRight: `1px solid rgba(96,165,250,0.06)`, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, background: C.orange, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⛽</div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>fuel<span style={{ color: C.orange }}>o</span></span>
              </div>
              {[['📊', 'Dashboard', true], ['⛽', 'Stock', false], ['💰', 'Ventes', false], ['⚠️', 'Alertes', false], ['👥', 'Employés', false]].map(([icon, label, active]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: active ? 'rgba(37,99,235,0.15)' : 'transparent', color: active ? C.soft : 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: active ? 600 : 400, borderLeft: active ? `2px solid ${C.soft}` : '2px solid transparent' }}>
                  <span>{icon}</span>{label}
                </div>
              ))}
            </div>
            {/* Main */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Stock Essence', val: '2 847 L', trend: '+12%', color: C.green, emoji: '⛽' },
                  { label: 'Ventes du jour', val: '8,4M GNF', trend: '+8%', color: C.soft, emoji: '💰' },
                  { label: 'Alertes actives', val: '2', trend: 'Critique', color: C.red, emoji: '🔔' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'rgba(37,99,235,0.05)', border: `1px solid rgba(96,165,250,0.08)`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 9, color: C.textMut, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                      <span style={{ fontSize: 16 }}>{c.emoji}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.5px', marginBottom: 4 }}>{c.val}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>{c.trend}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(37,99,235,0.04)', border: `1px solid rgba(96,165,250,0.08)`, borderRadius: 12, padding: '14px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Ventes — 7 jours</span>
                  <span style={{ fontSize: 10, color: C.soft, fontWeight: 600 }}>+18% ce mois</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {[35, 58, 42, 75, 62, 88, 95].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: `linear-gradient(0deg, rgba(37,99,235,0.9), rgba(96,165,250,0.3))`, borderRadius: '3px 3px 0 0', height: `${h}%`, animation: `barGrow 0.8s ${i * 0.1}s both ease` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '10px 20px', background: 'rgba(37,99,235,0.03)', borderTop: `1px solid rgba(96,165,250,0.06)`, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: C.textMut }}>VENTES RÉCENTES</span>
            {[['⛽ Essence', '50L', '500K GNF'], ['🛢️ Gasoil', '80L', '720K GNF'], ['⛽ Essence', '30L', '300K GNF']].map(([type, l, m], i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 10px', background: 'rgba(37,99,235,0.08)', borderRadius: 6, border: '1px solid rgba(96,165,250,0.08)' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{type}</span>
                <span style={{ fontSize: 10, color: C.green, fontFamily: 'monospace' }}>{l}</span>
                <span style={{ fontSize: 10, color: C.soft, fontFamily: 'monospace', fontWeight: 700 }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────
function Stats() {
  const data = [
    { target: 200, suffix: '+', label: 'Stations actives',  sub: "En Afrique de l'Ouest", color: C.soft   },
    { target: 99,  suffix: '%', label: 'Uptime garanti',    sub: 'Infrastructure fiable',  color: C.green  },
    { target: 14,  suffix: 'j', label: 'Essai gratuit',     sub: 'Sans carte bancaire',    color: C.orange },
    { target: 5,   suffix: 's', label: 'Par vente',         sub: "Temps d'enregistrement", color: C.purple },
  ]
  return (
    <section style={{ borderTop: `1px solid rgba(96,165,250,0.08)`, borderBottom: `1px solid rgba(96,165,250,0.08)`, background: `linear-gradient(90deg, rgba(37,99,235,0.04), rgba(96,165,250,0.02))`, padding: '70px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }} className="landing-grid-4">
        {data.map(({ target, suffix, label, sub, color }, i) => (
          <div key={label} style={{ textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? `1px solid rgba(96,165,250,0.08)` : 'none' }}>
            <div style={{ fontSize: 'clamp(38px, 5vw, 56px)', fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-2px', marginBottom: 10 }}>
              <Counter target={target} suffix={suffix} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: C.textMut }}>{sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Problème / Solution ───────────────────────────────
function ProblemSolution() {
  const PROBLEMS  = ['Cahiers perdus ou illisibles', 'Vols non détectés pendant des mois', 'Rupture de stock découverte trop tard', 'Impossible de surveiller à distance', 'Aucun rapport financier fiable', 'Zéro traçabilité des employés']
  const SOLUTIONS = ['Dashboard digital accessible partout', 'Chaque vente liée à un employé nommé', 'Alerte automatique avant la rupture', 'Surveillance temps réel depuis mobile', 'Rapports PDF + Excel automatiques', 'Historique complet de chaque pompiste']

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '120px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Le problème</div>
        <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.1 }}>
          Les stations africaines perdent<br />
          <span style={{ background: `linear-gradient(135deg, ${C.red}, #F97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>de l'argent chaque jour</span>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="landing-grid-2">
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 20, padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✗</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sans Fuelo</span>
          </div>
          {PROBLEMS.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.red, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✗</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 20, padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avec Fuelo</span>
          </div>
          {SOLUTIONS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.soft, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Features ──────────────────────────────────────────
function Features() {
  const [active, setActive] = useState(0)
  const FEATURES = [
    { icon: '⛽', color: C.green,  title: 'Stock temps réel',      desc: 'Niveaux mis à jour à chaque vente. Alertes automatiques avant la rupture.', stat: '0 rupture', statSub: 'pour nos clients' },
    { icon: '💰', color: C.soft,   title: 'Ventes en 5 secondes',  desc: "Interface ultra-simple pour les pompistes. Chaque vente enregistrée avec l'employé.", stat: '5 sec', statSub: 'par transaction' },
    { icon: '🔔', color: C.red,    title: 'Alertes intelligentes', desc: 'Stock faible, anomalie, vente suspecte — vous êtes alerté avant que ça devienne un problème.', stat: '< 1 min', statSub: "délai d'alerte" },
    { icon: '👥', color: C.purple, title: 'Multi-employés',        desc: 'Propriétaire, gérant, pompiste — chaque rôle a son interface. Tout est tracé.', stat: '100%', statSub: 'traçabilité' },
    { icon: '🏪', color: C.orange, title: 'Multi-stations',        desc: 'Gérez toutes vos stations depuis un seul compte. Vue consolidée. Switching en 1 clic.', stat: '∞', statSub: 'stations gérables' },
    { icon: '📊', color: C.soft,   title: 'Rapports automatiques', desc: 'PDF mensuel généré automatiquement. Export Excel en 1 clic.', stat: 'Auto', statSub: 'chaque mois' },
  ]

  return (
    <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Fonctionnalités</div>
        <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px', marginBottom: 16 }}>Tout ce dont votre station a besoin</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="landing-grid-3">
        {FEATURES.map(({ icon, color, title, desc, stat, statSub }, i) => (
          <div key={title} onMouseEnter={() => setActive(i)}
            style={{ background: active === i ? 'rgba(37,99,235,0.07)' : C.card, border: `1px solid ${active === i ? 'rgba(96,165,250,0.25)' : C.border}`, borderRadius: 18, padding: '26px 24px', cursor: 'default', transition: 'all 0.3s ease', transform: active === i ? 'translateY(-4px)' : 'translateY(0)', boxShadow: active === i ? `0 20px 40px rgba(37,99,235,0.15)` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'monospace' }}>{stat}</div>
                <div style={{ fontSize: 10, color: C.textMut }}>{statSub}</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Témoignages ───────────────────────────────────────
function Testimonials() {
  const TESTIMONIALS = [
    { name: 'Mamadou Diallo',   role: 'Propriétaire · Station Almamya, Conakry', avatar: 'M', color: C.soft,   stars: 5, text: 'Avant Fuelo je passais 2h par jour sur mes cahiers. Maintenant je vois tout depuis mon téléphone en 30 secondes. Révolutionnaire.' },
    { name: 'Fatoumata Camara', role: 'Gérante · Station Matoto, Conakry',        avatar: 'F', color: C.green,  stars: 5, text: "Grâce aux alertes Fuelo, j'ai découvert qu'un employé me volait depuis 3 mois. Sans ce logiciel j'aurais continué à perdre." },
    { name: 'Ibrahim Kouyaté',  role: 'Directeur · 3 stations en Guinée',         avatar: 'I', color: C.purple, stars: 5, text: 'Je gère mes 3 stations depuis Dakar. Je vois les ventes et le stock de chaque station en temps réel. Fuelo a changé ma façon de travailler.' },
    { name: 'Aissatou Bah',     role: 'Propriétaire · Station Kaloum, Conakry',  avatar: 'A', color: C.orange, stars: 5, text: "Mes pompistes adorent l'application. Même celui qui n'est pas à l'aise avec les téléphones y arrive. Simple et efficace." },
    { name: 'Sekou Touré',      role: 'Gérant · Station Ratoma, Conakry',         avatar: 'S', color: C.soft,   stars: 5, text: "Les rapports PDF m'ont permis de présenter mes chiffres à la banque. Fuelo m'a aidé à obtenir un financement." },
    { name: 'Mariama Condé',    role: 'Propriétaire · 2 stations, Kindia',        avatar: 'M', color: C.green,  stars: 5, text: "Je reçois une alerte sur mon téléphone dès que le stock descend trop bas. Je n'ai plus jamais de rupture depuis Fuelo." },
  ]

  return (
    <section id="testimonials" style={{ background: `linear-gradient(180deg, transparent, rgba(37,99,235,0.03), transparent)`, padding: '120px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Témoignages</div>
          <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px' }}>Ils ont transformé leur station</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="landing-grid-3">
          {TESTIMONIALS.map(({ name, role, avatar, color, stars, text }) => (
            <div key={name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 18, transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.2)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(37,99,235,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: stars }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={C.soft} stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>"{text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}20`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color, flexShrink: 0 }}>{avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{name}</div>
                  <div style={{ fontSize: 11, color: C.textMut }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Tarifs ────────────────────────────────────────────
function Pricing({ navigate }) {
  const [annual, setAnnual] = useState(false)
  const PLANS = [
    { name: 'Starter', price: annual ? 28 : 35, desc: 'Pour une station unique', features: ['1 station', 'Stock + ventes illimités', 'Alertes automatiques', 'Dashboard complet', '3 pompistes', 'Support WhatsApp'], cta: 'Commencer gratuitement', highlighted: false },
    { name: 'Pro', price: annual ? 60 : 75, desc: 'Pour les gérants ambitieux', badge: '🔥 Populaire', features: ["Jusqu'à 3 stations", 'Employés illimités', 'Export PDF + Excel', 'Détection fraude', 'Rapports auto', 'Support prioritaire 24h'], cta: 'Essayer 14 jours gratuit', highlighted: true },
    { name: 'Enterprise', price: annual ? 120 : 150, desc: 'Pour les grands réseaux', features: ['Stations illimitées', 'API publique', 'Paiement mobile', 'Manager dédié', 'Formation équipe', 'SLA 99.9%'], cta: 'Nous contacter', highlighted: false },
  ]

  return (
    <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 120px' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Tarifs</div>
        <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px', marginBottom: 20 }}>Simple et transparent</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: !annual ? '#fff' : C.textSub }}>Mensuel</span>
          <div onClick={() => setAnnual(v => !v)} style={{ width: 46, height: 24, borderRadius: 20, background: annual ? C.primary : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
            <div style={{ position: 'absolute', top: 2, left: annual ? 24 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </div>
          <span style={{ fontSize: 14, color: annual ? '#fff' : C.textSub }}>Annuel <span style={{ color: C.green, fontWeight: 600 }}>-20%</span></span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }} className="landing-grid-3">
        {PLANS.map(({ name, price, desc, badge, features, cta, highlighted }) => (
          <div key={name}
            style={{ background: highlighted ? 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(96,165,250,0.05))' : C.card, border: `1px solid ${highlighted ? 'rgba(96,165,250,0.3)' : C.border}`, borderRadius: 20, padding: '30px 26px', position: 'relative', transition: 'transform 0.25s', boxShadow: highlighted ? '0 0 60px rgba(37,99,235,0.15)' : 'none' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {badge && (
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.primary}, #1D4ED8)`, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>{badge}</div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: highlighted ? C.soft : C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{name}</div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-2px', fontFamily: 'monospace' }}>${price}</span>
              <span style={{ fontSize: 14, color: C.textSub, marginLeft: 4 }}>/mois</span>
            </div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 26 }}>{desc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/register')}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: highlighted ? 'none' : `1px solid rgba(96,165,250,0.15)`, background: highlighted ? `linear-gradient(135deg, ${C.primary}, #1D4ED8)` : 'rgba(37,99,235,0.06)', color: highlighted ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: highlighted ? 800 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: highlighted ? '0 6px 24px rgba(37,99,235,0.3)' : 'none' }}
            >{cta}</button>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState(null)
  const FAQS = [
    { q: "Est-ce que je dois installer une application ?", a: "Non. Fuelo fonctionne directement dans votre navigateur. Vous pouvez aussi l'installer comme une app sur Android en un clic depuis Chrome." },
    { q: "Comment mes données sont-elles protégées ?", a: "Vos données sont chiffrées SSL 256-bit et stockées sur des serveurs sécurisés. Personne d'autre ne peut y accéder." },
    { q: "Puis-je essayer avant de payer ?", a: "14 jours d'essai gratuit complet, sans carte bancaire. Toutes les fonctionnalités sans engagement." },
    { q: "Comment mes pompistes accèdent-ils à Fuelo ?", a: "Vous créez un compte pour chaque pompiste. Ils reçoivent un accès simplifié avec un grand bouton pour enregistrer leurs ventes." },
    { q: "Fuelo fonctionne dans quel pays ?", a: "Fuelo est conçu pour toute l'Afrique. Principalement utilisé en Guinée, Sénégal, Côte d'Ivoire, Mali et en expansion continue." },
    { q: "Et si j'ai besoin d'aide pour démarrer ?", a: "Notre équipe vous accompagne par WhatsApp pour configurer votre première station. Support en français." },
  ]
  return (
    <section id="faq" style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px 120px' }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>FAQ</div>
        <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px' }}>Questions fréquentes</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQS.map(({ q, a }, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${open === i ? 'rgba(96,165,250,0.2)' : C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.25s' }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', padding: '18px 22px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, textAlign: 'left', gap: 12 }}>
              {q}
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: open === i ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s', transform: open === i ? 'rotate(45deg)' : 'none', color: open === i ? C.soft : C.textSub }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
            </button>
            {open === i && <div style={{ padding: '0 22px 18px', fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>{a}</div>}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CTA Final ─────────────────────────────────────────
function FinalCTA({ navigate }) {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(96,165,250,0.06), rgba(37,99,235,0.08))', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 28, padding: 'clamp(52px, 8vw, 88px) 48px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 18 }}>Prêt à transformer votre station ?</div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 62px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px', marginBottom: 18, lineHeight: 1.05 }}>
            Rejoignez les 200+ gérants<br />
            <span style={{ background: `linear-gradient(135deg, ${C.soft}, #818CF8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>qui ont repris le contrôle</span>
          </h2>
          <p style={{ fontSize: 17, color: C.textSub, marginBottom: 44, maxWidth: 500, margin: '0 auto 44px', lineHeight: 1.75 }}>
            Démarrez en 2 minutes. Sans carte bancaire. Annulez à tout moment.
          </p>
          <button onClick={() => navigate('/register')}
            style={{ padding: '18px 48px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #1D4ED8)`, color: '#fff', fontSize: 18, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 44px rgba(37,99,235,0.5)', display: 'inline-flex', alignItems: 'center', gap: 12, transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 56px rgba(37,99,235,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 12px 44px rgba(37,99,235,0.5)' }}
          >
            Créer mon compte gratuitement
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <div style={{ marginTop: 22, fontSize: 13, color: C.textMut }}>
            ✓ Sans carte &nbsp;·&nbsp; ✓ 14 jours gratuits &nbsp;·&nbsp; ✓ Support WhatsApp
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid rgba(96,165,250,0.08)`, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, background: C.orange, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(245,158,11,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.7" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fff' }}>fuel</span>
            <span style={{ color: C.orange }}>o</span>
          </span>
        </div>
        <div style={{ fontSize: 13, color: C.textMut }}>© 2026 Fuelo Africa. Tous droits réservés.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Confidentialité', 'Conditions', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: C.textMut, cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = C.textMut}
            >{l}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── Landing principale ────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, overflowX: 'hidden' }}>
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <Stats />
      <ProblemSolution />
      <Features />
      <Testimonials />
      <Pricing navigate={navigate} />
      <FAQ />
      <FinalCTA navigate={navigate} />
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeDown   { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barGrow    { from{height:0} }
        @keyframes scanline   { 0%{opacity:0;transform:scaleX(0)} 20%{opacity:1} 80%{opacity:1} 100%{opacity:0;transform:scaleX(1)} }
        @keyframes floatDot   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-18px)} }
        @keyframes shimmerText{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }

        @media (max-width: 1024px) {
          .landing-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .landing-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .landing-grid-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .landing-grid-3 { grid-template-columns: 1fr !important; }
          .landing-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .nav-links      { display: none !important; }
          .hero-photos    { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .landing-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}