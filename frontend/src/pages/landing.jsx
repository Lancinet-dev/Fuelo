import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Logo ─────────────────────────────────────────────
const FueloLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 36, height: 36, background: '#F59E0B', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(245,158,11,0.35)' }}>
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
        <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
      </svg>
    </div>
    <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
      <span style={{ color: '#F1F5F9' }}>fuel</span>
      <span style={{ color: '#F59E0B' }}>o</span>
    </span>
  </div>
)

// ── Icônes SVG ───────────────────────────────────────
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const FEATURES = [
  {
    icon: '⛽',
    title: 'Stock en temps réel',
    desc: 'Suivez vos niveaux d\'essence et de gasoil à la seconde près. Alertes automatiques quand le stock devient critique.',
    color: '#10B981',
  },
  {
    icon: '💰',
    title: 'Suivi des ventes',
    desc: 'Chaque vente enregistrée en 3 secondes. Historique complet, stats du jour et du mois disponibles instantanément.',
    color: '#F59E0B',
  },
  {
    icon: '🔔',
    title: 'Alertes intelligentes',
    desc: 'Stock faible, anomalie financière, vente suspecte — vous êtes alerté automatiquement avant que le problème s\'aggrave.',
    color: '#EF4444',
  },
  {
    icon: '📊',
    title: 'Dashboard complet',
    desc: 'Graphiques des ventes, tendances, comparaisons. Toutes vos données en un seul coup d\'œil depuis n\'importe où.',
    color: '#60A5FA',
  },
  {
    icon: '🛡️',
    title: 'Anti-fraude intégré',
    desc: 'Détection automatique des anomalies entre votre caisse et votre stock. Chaque vente est liée à un employé.',
    color: '#C084FC',
  },
  {
    icon: '📱',
    title: 'Accessible partout',
    desc: 'Depuis votre téléphone, tablette ou ordinateur. Gérez votre station depuis n\'importe où dans le monde.',
    color: '#F59E0B',
  },
]

const PROBLEMS = [
  'Vous ne savez jamais exactement combien de litres il vous reste',
  'Vos employés peuvent vendre sans que vous le sachiez',
  'Vous passez des heures à calculer sur un cahier ou Excel',
  'Vous découvrez la rupture de stock quand le client arrive',
  'Vous ne pouvez pas surveiller depuis chez vous',
  'Vous ne savez pas quel jour a été le plus rentable',
]

const SOLUTIONS = [
  'Stock mis à jour à chaque vente, visible depuis votre téléphone',
  'Chaque vente est liée à un employé — rien ne peut être caché',
  'Rapports automatiques générés en un clic',
  'Alerte avant la rupture, commandez au bon moment',
  'Dashboard accessible 24h/24 depuis n\'importe où',
  'Graphiques et statistiques détaillés par jour, semaine, mois',
]

const PLANS = [
  {
    name: 'Starter',
    price: '35',
    currency: '$',
    period: '/mois',
    desc: 'Pour une station unique',
    features: ['1 station', 'Stock + ventes', 'Alertes automatiques', 'Dashboard complet', 'Support WhatsApp'],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '75',
    currency: '$',
    period: '/mois',
    desc: 'Pour les gérants ambitieux',
    features: ['Jusqu\'à 3 stations', 'Multi-employés', 'Rapports PDF automatiques', 'Détection de fraude', 'Statistiques avancées', 'Support prioritaire'],
    cta: 'Essayer 14 jours gratuit',
    highlighted: true,
    badge: 'Populaire',
  },
  {
    name: 'Enterprise',
    price: '150',
    currency: '$',
    period: '/mois',
    desc: 'Pour les grands réseaux',
    features: ['Stations illimitées', 'API publique', 'Intégration paiement mobile', 'Manager dédié', 'Formation équipe', 'SLA garanti 99.9%'],
    cta: 'Nous contacter',
    highlighted: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Mamadou Diallo',
    role: 'Propriétaire — Station Almamya, Conakry',
    text: 'Avant Fuelo je passais 2 heures par jour sur mes cahiers. Maintenant je vois tout depuis mon téléphone en 30 secondes.',
    stars: 5,
    avatar: 'M',
    color: '#F59E0B',
  },
  {
    name: 'Fatoumata Camara',
    role: 'Gérante — Station Matoto, Conakry',
    text: 'J\'ai découvert qu\'un employé me volait depuis 3 mois. Fuelo m\'a montré l\'anomalie dès la première semaine.',
    stars: 5,
    avatar: 'F',
    color: '#10B981',
  },
  {
    name: 'Ibrahim Kouyaté',
    role: 'Directeur — 3 stations, Guinée',
    text: 'Je gère mes 3 stations depuis Dakar. Je vois tout en temps réel. C\'est exactement ce dont j\'avais besoin.',
    stars: 5,
    avatar: 'I',
    color: '#60A5FA',
  },
]

const FAQS = [
  { q: 'Est-ce que je dois installer quelque chose ?', a: 'Non. Fuelo fonctionne directement dans votre navigateur ou sur votre téléphone. Aucune installation requise.' },
  { q: 'Comment mes données sont-elles protégées ?', a: 'Vos données sont chiffrées avec SSL 256-bit et stockées sur des serveurs sécurisés. Personne d\'autre ne peut y accéder.' },
  { q: 'Est-ce que je peux essayer avant de payer ?', a: '14 jours d\'essai gratuit, sans carte bancaire. Vous testez tout sans engagement.' },
  { q: 'Que se passe-t-il si je n\'ai pas de connexion internet ?', a: 'Fuelo nécessite une connexion pour fonctionner. Nous recommandons une connexion mobile basique.' },
  { q: 'Puis-je ajouter plusieurs employés ?', a: 'Oui à partir du plan Pro. Chaque employé a son propre compte avec des permissions limitées.' },
  { q: 'Est-ce que Fuelo fonctionne dans d\'autres pays ?', a: 'Oui. Fuelo est conçu pour toute l\'Afrique et peut être utilisé dans n\'importe quel pays.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
 

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ background: '#0A0F1E', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#F1F5F9', overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FueloLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {[['Fonctionnalités', 'features'], ['Tarifs', 'pricing'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/login')}
              style={{ padding: '9px 20px', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Se connecter
            </button>
            <button onClick={() => navigate('/register')}
              style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#F59E0B', color: '#0F172A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
              Essayer gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', top: -100, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '0.5px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#F59E0B', marginBottom: 24, fontWeight: 500 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
          Déjà 200+ stations en Afrique
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 20, position: 'relative' }}>
          Gérez votre station.<br />
          <span style={{ color: '#F59E0B' }}>Depuis n'importe où.</span>
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Stock, ventes, alertes et statistiques — tout en temps réel.
          Le logiciel de gestion que les stations africaines attendaient.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={() => navigate('/register')}
            style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: '#F59E0B', color: '#0F172A', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Essayer 14 jours gratuit
            <IconArrow />
          </button>
          <button onClick={() => scrollTo('features')}
            style={{ padding: '14px 28px', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            Voir les fonctionnalités
          </button>
        </div>

        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['✓ Aucune carte bancaire', ''], ['✓ 14 jours gratuits', ''], ['✓ Sans engagement', '']].map(([text]) => (
            <span key={text} style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{text}</span>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ───────────────────── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg,#0F172A,#1E293B)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
          {/* Mini dashboard mockup */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[['Stock essence', '1 847 L', '#10B981', 'Normal'], ['Stock gasoil', '312 L', '#F59E0B', 'Attention'], ['Ventes du jour', '6,4M GNF', '#60A5FA', '↑ 12%']].map(([label, val, color, sub]) => (
              <div key={label} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'monospace', marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px', height: 120, display: 'flex', alignItems: 'flex-end', gap: 8, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginRight: 8, flexShrink: 0 }}>Ventes 7j</div>
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, background: `linear-gradient(0deg,#F59E0B80,#F59E0B)`, borderRadius: '4px 4px 0 0', height: `${h}%`, transition: 'height 0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLÈME / SOLUTION ─────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Le problème</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
            Les stations africaines gèrent<br />encore tout sur <span style={{ color: '#EF4444' }}>papier</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
            Pertes d'argent, vols silencieux, ruptures de stock — tout ça parce qu'il n'existe pas d'outil simple et adapté.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '28px 32px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>❌ Sans Fuelo</div>
            {PROBLEMS.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>✗</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{p}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(16,185,129,0.05)', border: '0.5px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '28px 32px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>✅ Avec Fuelo</div>
            {SOLUTIONS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>✓</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ─────────────────────── */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Fonctionnalités</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
            Tout ce dont votre station a besoin
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto' }}>
            Des outils pensés pour les réalités des stations africaines — simples, rapides, efficaces.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc, color }) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = `${color}40` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                {icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────── */}
      <section style={{ background: 'rgba(245,158,11,0.05)', border: '0.5px solid rgba(245,158,11,0.1)', margin: '0 0 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {[
              ['200+', 'Stations actives'],
              ['99.9%', 'Uptime garanti'],
              ['14j', 'Essai gratuit'],
              ['24h', 'Support réactif'],
            ].map(([n, l], i) => (
              <div key={l} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#F59E0B', letterSpacing: '-2px', fontFamily: 'monospace', marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Témoignages</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px' }}>
            Ce que disent nos gérants
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {TESTIMONIALS.map(({ name, role, text, stars, avatar, color }) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {Array(stars).fill(0).map((_, i) => <IconStar key={i} />)}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>
                "{text}"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>
                  {avatar}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TARIFS ──────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Tarifs</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>
            Simple et transparent
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }}>
            14 jours gratuits sur tous les plans. Sans carte bancaire.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
          {PLANS.map(({ name, price, currency, period, desc, features, cta, highlighted, badge }) => (
            <div key={name} style={{ background: highlighted ? 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.05))' : 'rgba(255,255,255,0.03)', border: `0.5px solid ${highlighted ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: '32px 28px', position: 'relative' }}>
              {badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#0F172A', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {badge}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: highlighted ? '#F59E0B' : 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{name}</div>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-2px', fontFamily: 'monospace' }}>{currency}{price}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{period}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{desc}</div>
              <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <IconCheck />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/register')}
                style={{ width: '100%', padding: '13px', borderRadius: 11, border: highlighted ? 'none' : '0.5px solid rgba(255,255,255,0.15)', background: highlighted ? '#F59E0B' : 'transparent', color: highlighted ? '#0F172A' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: highlighted ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: highlighted ? '0 4px 16px rgba(245,158,11,0.3)' : 'none' }}>
                {cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: 720, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px' }}>Questions fréquentes</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map(({ q, a }, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '18px 22px', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#F1F5F9', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, textAlign: 'left', gap: 12 }}>
                {q}
                <div style={{ transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <IconArrow />
                </div>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))', border: '0.5px solid rgba(245,158,11,0.25)', borderRadius: 24, padding: '72px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Commencez maintenant</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.1 }}>
              Votre station mérite<br />mieux qu'un cahier
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 36, maxWidth: 460, margin: '0 auto 36px' }}>
              Rejoignez les gérants qui ont repris le contrôle de leur station. 14 jours gratuits, sans engagement.
            </p>
            <button onClick={() => navigate('/register')}
              style={{ padding: '16px 40px', borderRadius: 12, border: 'none', background: '#F59E0B', color: '#0F172A', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(245,158,11,0.4)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Créer mon compte gratuitement
              <IconArrow />
            </button>
            <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
              ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ 14 jours gratuits &nbsp;·&nbsp; ✓ Sans engagement
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <FueloLogo />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Fuelo. Tous droits réservés.
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Confidentialité', 'Conditions', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}