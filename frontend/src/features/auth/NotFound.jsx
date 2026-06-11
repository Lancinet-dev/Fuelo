import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../../context/AuthContext'
import { motion }      from 'framer-motion'
import FueloLogo       from '../../components/FueloLogo'

const BG   = '#050A15'
const BLUE = '#2563EB'
const SOFT = '#60A5FA'
const ORG  = '#F59E0B'
const TEXT = '#F1F5F9'
const SUB  = 'rgba(255,255,255,0.4)'

const DOTS = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  color: i % 4 === 0 ? ORG : SOFT,
  dur: 10 + Math.random() * 20, delay: Math.random() * 8,
}))

export default function NotFound() {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()

  const goHome = () => {
    if (!isAuthenticated) { navigate('/'); return }
    const r = String(role ?? '').toLowerCase()
    if (r === 'pompiste')    return navigate('/pompiste')
    if (r === 'chauffeur')   return navigate('/chauffeur')
    if (r === 'logisticien') return navigate('/logistique')
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", padding: '32px 24px' }}>

      <div style={{ position: 'absolute', top: '-20%', left: '30%', width: '50vw', height: '50vh', background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.025) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {DOTS.map((d, i) => <div key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, borderRadius: '50%', background: d.color, opacity: 0.2, animation: `floatPt ${d.dur}s ${d.delay}s ease-in-out infinite alternate` }} />)}
      </div>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ marginBottom: 52, zIndex: 2 }}>
        <FueloLogo size={48} forceTextColor="#fff" />
      </motion.div>

      {/* 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, type: 'spring', damping: 14 }}
        style={{ zIndex: 2, display: 'flex', alignItems: 'center', marginBottom: 28, position: 'relative' }}
      >
        <div style={{ position: 'absolute', inset: '-30px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(24px)', pointerEvents: 'none' }} />
        <span style={{ fontSize: 'clamp(72px, 14vw, 128px)', fontWeight: 900, color: TEXT, letterSpacing: '-4px', lineHeight: 1, textShadow: '0 0 60px rgba(37,99,235,0.35)' }}>4</span>
        <motion.span
          animate={{ textShadow: ['0 0 30px rgba(245,158,11,0.4)', '0 0 60px rgba(245,158,11,0.8)', '0 0 30px rgba(245,158,11,0.4)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(72px, 14vw, 128px)', fontWeight: 900, color: ORG, letterSpacing: '-4px', lineHeight: 1, display: 'inline-block', margin: '0 4px' }}
        >
          0
        </motion.span>
        <span style={{ fontSize: 'clamp(72px, 14vw, 128px)', fontWeight: 900, color: TEXT, letterSpacing: '-4px', lineHeight: 1, textShadow: '0 0 60px rgba(37,99,235,0.35)' }}>4</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
        style={{ zIndex: 2, textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, color: TEXT, letterSpacing: '-0.5px', marginBottom: 10 }}>Page introuvable</div>
        <div style={{ fontSize: 14, color: SUB, maxWidth: 340, lineHeight: 1.65, margin: '0 auto' }}>
          Cette page n'existe pas ou a été déplacée. Retournez à votre tableau de bord.
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} style={{ zIndex: 2 }}>
        <button onClick={goHome}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 32px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${BLUE}, #1D4ED8)`, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 4px 24px rgba(37,99,235,0.45)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.45)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Retour à l'accueil
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ position: 'absolute', bottom: 24, fontSize: 11, color: 'rgba(255,255,255,0.18)', zIndex: 2 }}>
        fuel<span style={{ color: ORG }}>o</span> · Gestion de stations-service
      </motion.div>

      <style>{`
        @keyframes floatPt { from { transform: translateY(0) scale(1); } to { transform: translateY(-25px) scale(1.2); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}
