// ================================================
// FUELO V2 — Landing Page
// Fichier : frontend/src/features/auth/Landing.jsx
// ================================================

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Couleurs ──────────────────────────────────────────
const C = {
  bg:       '#050A14',
  bgCard:   '#0A1020',
  bgCard2:  '#0D1528',
  border:   'rgba(255,255,255,0.06)',
  primary:  '#F59E0B',
  text:     '#F1F5F9',
  textSub:  'rgba(255,255,255,0.45)',
  textMuted:'rgba(255,255,255,0.2)',
  green:    '#10B981',
  red:      '#EF4444',
  blue:     '#3B82F6',
}

// ── Compteur animé ────────────────────────────────────
function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const progress = Math.min((Date.now() - start) / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(ease * target))
          if (progress < 1) requestAnimationFrame(tick)
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

// ── Navbar ────────────────────────────────────────────
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 24px', transition: 'all 0.3s', background: scrolled ? 'rgba(5,10,20,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? `0.5px solid ${C.border}` : 'none' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 34, height: 34, background: C.primary, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(245,158,11,0.35)' }}>
            <svg width="17" height="17" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
              <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#fff' }}>fuel</span>
            <span style={{ color: C.primary }}>o</span>
          </span>
        </div>

        {/* Nav links desktop */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['Fonctionnalités', 'features'], ['Témoignages', 'testimonials'], ['Tarifs', 'pricing'], ['FAQ', 'faq']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = C.textSub}
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 18px', borderRadius: 9, border: `0.5px solid ${C.border}`, background: 'transparent', color: 'rgba(255,255,255,0.65)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
          >
            Connexion
          </button>
          <button onClick={() => navigate('/register')}
            style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: C.primary, color: '#0F172A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(245,158,11,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(245,158,11,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)' }}
          >
            Essai gratuit →
          </button>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────
function Hero({ navigate }) {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Fond radial */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(245,158,11,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.25)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: C.primary, marginBottom: 28, fontWeight: 500, position: 'relative' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
        Déjà 200+ stations en Afrique
        <span style={{ color: C.textSub }}>· Version 2.0 disponible</span>
      </div>

      {/* Titre */}
      <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, color: '#fff', lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 24, maxWidth: 800, position: 'relative' }}>
        La plateforme qui{' '}
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{ background: `linear-gradient(135deg, ${C.primary}, #F97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>révolutionne</span>
        </span>
        {' '}la gestion des stations en Afrique
      </h1>

      <p style={{ fontSize: 18, color: C.textSub, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
        Stock, ventes, alertes, multi-stations — tout en temps réel depuis votre téléphone. Zéro papier. Zéro erreur. Zéro stress.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56 }}>
        <button onClick={() => navigate('/register')}
          style={{ padding: '15px 34px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #F97316)`, color: '#0F172A', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 30px rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.25s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(245,158,11,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,158,11,0.35)' }}
        >
          Commencer gratuitement
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ padding: '15px 28px', borderRadius: 12, border: `0.5px solid ${C.border}`, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.75)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', backdropFilter: 'blur(10px)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = C.border }}
        >
          Voir comment ça marche ↓
        </button>
      </div>

      {/* Trust */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
        {['✓ Sans carte bancaire', '✓ 14 jours gratuits', '✓ Sans engagement', '✓ Support WhatsApp'].map(t => (
          <span key={t} style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>{t}</span>
        ))}
      </div>

      {/* Dashboard preview */}
      <div style={{ maxWidth: 900, width: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: -1, background: `linear-gradient(135deg, rgba(245,158,11,0.3), rgba(16,185,129,0.15), rgba(59,130,246,0.2))`, borderRadius: 20, filter: 'blur(20px)', opacity: 0.5 }} />
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0D1528, #0A1020)', border: `0.5px solid rgba(255,255,255,0.08)`, borderRadius: 18, padding: 20, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>

          {/* Barre titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#EF4444', '#F59E0B', '#10B981'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 26, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>app.fuelo.africa/dashboard</span>
            </div>
          </div>

          {/* Cartes stat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'Stock Essence', val: '1 847 L', status: 'Normal', color: C.green, icon: '⛽' },
              { label: 'Ventes du jour', val: '6,4M GNF', status: '↑ 12%',  color: C.primary, icon: '💰' },
              { label: 'Alertes', val: '2 actives', status: 'Critique', color: C.red, icon: '⚠️' },
            ].map(card => (
              <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.5px', marginBottom: 6 }}>{card.val}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: card.color }}>{card.status}</div>
              </div>
            ))}
          </div>

          {/* Graphique simulé */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '16px', height: 130, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Ventes — 7 derniers jours</span>
              <span style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>+18% ce mois</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {[35, 58, 42, 75, 62, 88, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, background: `linear-gradient(0deg, rgba(245,158,11,0.7), rgba(245,158,11,0.2))`, borderRadius: '4px 4px 0 0', height: `${h}%`, transition: 'height 0.5s' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Problème / Solution ───────────────────────────────
function ProblemSolution() {
  const PROBLEMS  = ['Cahiers et Excel perdus ou illisibles', 'Vols silencieux non détectés pendant des mois', 'Rupture de stock découverte trop tard', 'Impossible de surveiller depuis chez vous', 'Aucun rapport fiable pour prendre des décisions', 'Employés sans compte = aucune traçabilité']
  const SOLUTIONS = ['Dashboard digital accessible partout 24h/24', 'Chaque vente liée à un employé — rien ne se cache', 'Alerte automatique avant la rupture de stock', 'Surveillance temps réel depuis votre téléphone', 'Rapports PDF automatiques chaque mois', 'Comptes séparés par pompiste avec historique complet']

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Le problème</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>
          Les stations africaines perdent de l'argent<br />
          <span style={{ color: C.red }}>chaque jour</span> sans le savoir
        </h2>
        <p style={{ fontSize: 16, color: C.textSub, maxWidth: 500, margin: '0 auto' }}>
          Le papier et Excel ne suffisent plus. Il manquait un outil simple, fiable, adapté à la réalité africaine.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sans Fuelo */}
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '0.5px solid rgba(239,68,68,0.15)', borderRadius: 18, padding: '28px 30px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✗</span>
            Sans Fuelo
          </div>
          {PROBLEMS.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>✗</span>
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>

        {/* Avec Fuelo */}
        <div style={{ background: 'rgba(16,185,129,0.04)', border: '0.5px solid rgba(16,185,129,0.15)', borderRadius: 18, padding: '28px 30px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
            Avec Fuelo
          </div>
          {SOLUTIONS.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓</span>
              </div>
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
  const FEATURES = [
    { icon: '⛽', color: C.green,   title: 'Stock en temps réel',      desc: 'Niveaux mis à jour à chaque vente. Alertes automatiques avant la panne. Commandez au bon moment.' },
    { icon: '💰', color: C.primary, title: 'Suivi des ventes',          desc: 'Chaque vente enregistrée en 5 secondes par le pompiste. Historique complet, filtres avancés.' },
    { icon: '🔔', color: C.red,     title: 'Alertes intelligentes',     desc: 'Stock faible, anomalie financière, vente suspecte — vous êtes alerté avant que ça devienne un problème.' },
    { icon: '👥', color: '#C084FC', title: 'Multi-utilisateurs',        desc: 'Propriétaire, gérant, pompiste — chaque rôle a son interface adaptée. Tout est tracé.' },
    { icon: '🏪', color: C.blue,    title: 'Multi-stations',            desc: 'Gérez toutes vos stations depuis un seul compte. Vue consolidée en temps réel.' },
    { icon: '📱', color: C.green,   title: 'Responsive parfait',        desc: 'Fonctionne sur téléphone, tablette, ordinateur. Installe-le comme une app sans passer par le store.' },
    { icon: '📊', color: C.primary, title: 'Rapports automatiques',     desc: 'PDF mensuel généré automatiquement. Export Excel de vos ventes. Aucun effort.' },
    { icon: '🛡️', color: '#C084FC', title: 'Anti-fraude intégré',       desc: 'Détection des anomalies entre caisse et stock. Chaque vente liée à un employé identifié.' },
    { icon: '⚡', color: C.blue,    title: 'Ultra rapide',              desc: 'Interface pensée pour être utilisée sous le soleil, sur un petit écran. Action principale en 1 clic.' },
  ]

  return (
    <section id="features" style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Fonctionnalités</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: 16 }}>
          Tout ce dont votre station a besoin
        </h2>
        <p style={{ fontSize: 16, color: C.textSub, maxWidth: 480, margin: '0 auto' }}>
          Des outils pensés pour les réalités des stations africaines. Simples, rapides, fiables.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="landing-grid-3">
        {FEATURES.map(({ icon, color, title, desc }) => (
          <div key={title}
            style={{ background: C.bgCard, border: `0.5px solid ${C.border}`, borderRadius: 16, padding: '24px 22px', transition: 'all 0.25s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bgCard2; e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.bgCard; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}15`, border: `0.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
              {icon}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Stats ─────────────────────────────────────────────
function Stats() {
  return (
    <section style={{ borderTop: `0.5px solid ${C.border}`, borderBottom: `0.5px solid ${C.border}`, background: 'rgba(245,158,11,0.03)', margin: '0 0 120px', padding: '60px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }} className="landing-grid-4">
          {[
            { target: 200, suffix: '+', label: 'Stations actives',  sub: 'En Afrique de l\'Ouest' },
            { target: 99,  suffix: '.9%', label: 'Uptime garanti', sub: 'Infrastructure fiable'   },
            { target: 14,  suffix: 'j',   label: 'Essai gratuit',  sub: 'Sans carte bancaire'     },
            { target: 5,   suffix: 'sec', label: 'Par vente',      sub: 'Temps d\'enregistrement' },
          ].map(({ target, suffix, label, sub }, i) => (
            <div key={label} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 3 ? `0.5px solid ${C.border}` : 'none' }}>
              <div style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, background: `linear-gradient(135deg, ${C.primary}, #F97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-2px', fontFamily: 'monospace', marginBottom: 8 }}>
                <Counter target={target} suffix={suffix} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Témoignages ───────────────────────────────────────
function Testimonials() {
  const TESTIMONIALS = [
    { name: 'Mamadou Diallo',    role: 'Propriétaire · Station Almamya, Conakry',       avatar: 'M', color: C.primary, stars: 5, text: 'Avant Fuelo je passais 2 heures par jour sur mes cahiers. Maintenant je vois tout depuis mon téléphone en 30 secondes. C\'est exactement ce dont j\'avais besoin.' },
    { name: 'Fatoumata Camara',  role: 'Gérante · Station Matoto, Conakry',             avatar: 'F', color: C.green,   stars: 5, text: 'J\'ai découvert qu\'un employé me volait depuis 3 mois grâce aux alertes Fuelo. Sans ce logiciel j\'aurais continué à perdre de l\'argent sans le savoir.' },
    { name: 'Ibrahim Kouyaté',   role: 'Directeur · 3 stations en Guinée',              avatar: 'I', color: C.blue,    stars: 5, text: 'Je gère mes 3 stations depuis Dakar maintenant. Je vois les ventes et le stock de chaque station en temps réel. Fuelo a changé ma façon de travailler.' },
    { name: 'Aissatou Bah',      role: 'Propriétaire · Station Kaloum, Conakry',        avatar: 'A', color: '#C084FC', stars: 5, text: 'Simple à utiliser pour mes pompistes. Même celui qui n\'est pas à l\'aise avec les téléphones y arrive sans problème. Je recommande à tous les gérants.' },
    { name: 'Sekou Touré',       role: 'Gérant · Station Ratoma, Conakry',              avatar: 'S', color: C.primary, stars: 5, text: 'Les rapports PDF automatiques m\'ont permis de présenter mes chiffres à la banque pour un prêt. Fuelo m\'a aidé à obtenir un financement pour agrandir ma station.' },
    { name: 'Mariama Condé',     role: 'Propriétaire · 2 stations, Kindia',             avatar: 'M', color: C.green,   stars: 5, text: 'Je reçois une alerte sur mon téléphone dès que le stock descend trop bas. Je n\'ai plus jamais de rupture de stock depuis que j\'utilise Fuelo.' },
  ]

  return (
    <section id="testimonials" style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Témoignages</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
          Ce que disent nos gérants
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="landing-grid-3">
        {TESTIMONIALS.map(({ name, role, avatar, color, stars, text }) => (
          <div key={name} style={{ background: C.bgCard, border: `0.5px solid ${C.border}`, borderRadius: 16, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: stars }).map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={C.primary} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontStyle: 'italic', flex: 1 }}>
              "{text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
                {avatar}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Tarifs ────────────────────────────────────────────
function Pricing({ navigate }) {
  const PLANS = [
    {
      name: 'Starter', price: '35', period: '/mois', desc: 'Pour une station unique',
      features: ['1 station', 'Stock + ventes illimités', 'Alertes automatiques', 'Dashboard complet', '3 comptes pompistes', 'Support WhatsApp'],
      cta: 'Commencer gratuitement', highlighted: false,
    },
    {
      name: 'Pro', price: '75', period: '/mois', desc: 'Pour les gérants ambitieux', badge: '🔥 Populaire',
      features: ['Jusqu\'à 3 stations', 'Multi-employés illimités', 'Rapports PDF automatiques', 'Détection de fraude', 'Export Excel', 'Support prioritaire 24h'],
      cta: 'Essayer 14 jours gratuit', highlighted: true,
    },
    {
      name: 'Enterprise', price: '150', period: '/mois', desc: 'Pour les grands réseaux',
      features: ['Stations illimitées', 'API publique', 'Intégration paiement mobile', 'Manager dédié', 'Formation équipe', 'SLA 99.9% garanti'],
      cta: 'Nous contacter', highlighted: false,
    },
  ]

  return (
    <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto 120px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Tarifs</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', marginBottom: 16 }}>Simple et transparent</h2>
        <p style={{ fontSize: 16, color: C.textSub }}>14 jours gratuits sur tous les plans. Aucune carte bancaire requise.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }} className="landing-grid-3">
        {PLANS.map(({ name, price, period, desc, badge, features, cta, highlighted }) => (
          <div key={name} style={{ background: highlighted ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))' : C.bgCard, border: `0.5px solid ${highlighted ? 'rgba(245,158,11,0.35)' : C.border}`, borderRadius: 18, padding: '28px 24px', position: 'relative', transition: 'transform 0.25s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {badge && (
              <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${C.primary}, #F97316)`, color: '#0F172A', fontSize: 11, fontWeight: 800, padding: '3px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                {badge}
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: highlighted ? C.primary : C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{name}</div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-2px', fontFamily: 'monospace' }}>${price}</span>
              <span style={{ fontSize: 14, color: C.textSub, marginLeft: 4 }}>{period}</span>
            </div>
            <div style={{ fontSize: 13, color: C.textSub, marginBottom: 24 }}>{desc}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 26 }}>
              {features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/register')}
              style={{ width: '100%', padding: '13px', borderRadius: 11, border: highlighted ? 'none' : `0.5px solid ${C.border}`, background: highlighted ? `linear-gradient(135deg, ${C.primary}, #F97316)` : 'rgba(255,255,255,0.04)', color: highlighted ? '#0F172A' : 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: highlighted ? 800 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: highlighted ? '0 6px 20px rgba(245,158,11,0.3)' : 'none' }}
            >
              {cta}
            </button>
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
    { q: 'Est-ce que je dois installer une application ?',    a: 'Non. Fuelo fonctionne directement dans votre navigateur, sur tous les appareils. Vous pouvez aussi l\'installer comme une app sur votre téléphone Android en un clic.' },
    { q: 'Comment mes données sont-elles protégées ?',        a: 'Vos données sont chiffrées SSL 256-bit et stockées sur des serveurs sécurisés en Europe. Personne d\'autre ne peut y accéder.' },
    { q: 'Puis-je essayer avant de payer ?',                  a: 'Oui. 14 jours d\'essai gratuit complet, sans carte bancaire. Vous testez toutes les fonctionnalités sans aucun engagement.' },
    { q: 'Comment mes pompistes accèdent-ils à Fuelo ?',      a: 'Vous créez un compte pour chaque pompiste depuis votre dashboard. Ils reçoivent un accès simplifié : juste un grand bouton pour enregistrer leurs ventes.' },
    { q: 'Est-ce que Fuelo fonctionne sans internet ?',       a: 'Fuelo nécessite une connexion pour fonctionner. Une connexion mobile basique suffit. Nous optimisons pour les connexions lentes.' },
    { q: 'Puis-je gérer plusieurs stations ?',                a: 'Oui, à partir du plan Pro. Vous pouvez voir toutes vos stations depuis un seul compte, avec une vue consolidée en temps réel.' },
    { q: 'Et si j\'ai besoin d\'aide pour démarrer ?',        a: 'Notre équipe vous accompagne par WhatsApp pour configurer votre première station. Support en français et en langues locales.' },
    { q: 'Fuelo fonctionne dans quel pays ?',                 a: 'Fuelo est conçu pour toute l\'Afrique. Utilisé principalement en Guinée, Sénégal, Côte d\'Ivoire, Mali et en expansion continue.' },
  ]

  return (
    <section id="faq" style={{ maxWidth: 720, margin: '0 auto 120px', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>FAQ</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px' }}>
          Questions fréquentes
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FAQS.map(({ q, a }, i) => (
          <div key={i} style={{ background: C.bgCard, border: `0.5px solid ${open === i ? 'rgba(245,158,11,0.25)' : C.border}`, borderRadius: 13, overflow: 'hidden', transition: 'border-color 0.25s' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', padding: '17px 22px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, textAlign: 'left', gap: 12 }}
            >
              {q}
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: open === i ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s', transform: open === i ? 'rotate(45deg)' : 'none', color: open === i ? C.primary : C.textSub }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
            </button>
            {open === i && (
              <div style={{ padding: '0 22px 18px', fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── CTA Final ─────────────────────────────────────────
function FinalCTA({ navigate }) {
  return (
    <section style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 24px' }}>
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05), rgba(16,185,129,0.05))', border: '0.5px solid rgba(245,158,11,0.2)', borderRadius: 24, padding: 'clamp(48px, 8vw, 80px) 48px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Commencez maintenant</div>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, color: '#fff', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1.05 }}>
            Votre station mérite<br />
            <span style={{ background: `linear-gradient(135deg, ${C.primary}, #F97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>mieux qu'un cahier</span>
          </h2>
          <p style={{ fontSize: 17, color: C.textSub, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Rejoignez 200+ gérants qui ont repris le contrôle de leur station. Démarrez en 2 minutes.
          </p>
          <button onClick={() => navigate('/register')}
            style={{ padding: '17px 42px', borderRadius: 13, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #F97316)`, color: '#0F172A', fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 40px rgba(245,158,11,0.4)', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(245,158,11,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(245,158,11,0.4)' }}
          >
            Créer mon compte gratuitement
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <div style={{ marginTop: 20, fontSize: 13, color: C.textMuted }}>
            ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 14 jours gratuits &nbsp;·&nbsp; ✓ Sans engagement &nbsp;·&nbsp; ✓ Support WhatsApp
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `0.5px solid ${C.border}`, padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: C.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 48 48">
              <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>fuel<span style={{ color: C.primary }}>o</span></span>
        </div>
        <div style={{ fontSize: 13, color: C.textMuted }}>© 2026 Fuelo. Tous droits réservés.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Confidentialité', 'Conditions', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 13, color: C.textMuted, cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = C.textMuted}
            >{l}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── Landing ───────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: C.text, overflowX: 'hidden' }}>
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <ProblemSolution />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing navigate={navigate} />
      <FAQ />
      <FinalCTA navigate={navigate} />
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @media (max-width: 1024px) {
          .landing-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .landing-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .landing-grid-3 { grid-template-columns: 1fr !important; }
          .landing-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .nav-links      { display: none !important; }
        }
        @media (max-width: 480px) {
          .landing-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}