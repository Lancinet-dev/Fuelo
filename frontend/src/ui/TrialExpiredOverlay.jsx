// ================================================
// FUELO — Overlay "essai gratuit terminé" (premium)
// ================================================

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function TrialExpiredOverlay() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        background: 'rgba(2,8,23,0.72)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.05 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 460,
          background: 'linear-gradient(160deg, rgba(15,23,42,0.96), rgba(2,8,23,0.96))',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 26,
          padding: '40px 34px 34px', textAlign: 'center',
          boxShadow: '0 30px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Lueur décorative */}
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)', pointerEvents: 'none' }} />

        {/* Illustration cadenas */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 0.15 }}
          style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 22px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(245,158,11,0.25)' }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2.5" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
            <circle cx="12" cy="16" r="1.4" fill="#F59E0B" stroke="none" />
          </svg>
        </motion.div>

        <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 800, color: '#FCD34D', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 99, padding: '4px 12px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Essai terminé
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.5px', lineHeight: 1.25, margin: '0 0 12px' }}>
          Votre essai gratuit Enterprise est terminé
        </h2>
        <p style={{ fontSize: 14.5, color: '#94A3B8', lineHeight: 1.65, margin: '0 auto 26px', maxWidth: 360 }}>
          Choisissez un plan pour continuer à utiliser Fuelo et garder l'accès à vos ventes, votre stock et votre équipe.
        </p>

        <button
          onClick={() => navigate('/abonnements')}
          style={{ width: '100%', height: 54, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15.5, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', boxShadow: '0 10px 30px rgba(37,99,235,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Voir les plans
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
        </button>

        <div style={{ fontSize: 12, color: '#64748B', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Paiement mobile sécurisé
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Sans engagement
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
