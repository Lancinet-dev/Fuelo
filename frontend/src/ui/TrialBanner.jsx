// ================================================
// FUELO — Bannière d'essai gratuit
// ================================================

import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrialStatus } from '../hooks/useTrialStatus'
import { useAuth } from '../context/AuthContext'

export default function TrialBanner() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { isTrial, joursRestants } = useTrialStatus()

  // Affiché pour l'owner uniquement, pendant l'essai
  if (role !== 'owner' || !isTrial || joursRestants == null) return null

  const j = joursRestants
  const cfg =
    j <= 1 ? { bg: 'linear-gradient(90deg,#EF4444,#DC2626)', label: j === 0 ? 'Dernier jour d\'essai gratuit' : 'Dernier jour d\'essai gratuit', urgent: true } :
    j <= 3 ? { bg: 'linear-gradient(90deg,#F59E0B,#D97706)', label: `Votre essai se termine dans ${j} jours`, urgent: true } :
             { bg: 'linear-gradient(90deg,#2563EB,#1D4ED8)', label: `Essai gratuit — ${j} jours restants`, urgent: false }

  const sousTexte = j <= 3
    ? 'Choisissez un plan pour ne pas perdre l\'accès'
    : 'Profitez de toutes les fonctionnalités Enterprise'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        style={{
          background: cfg.bg, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          padding: '9px 16px', fontFamily: "'DM Sans', system-ui, sans-serif",
          flexWrap: 'wrap', textAlign: 'center',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={cfg.urgent ? { animation: 'fuelo-trial-pulse 1.4s infinite' } : undefined}>
            {cfg.urgent
              ? <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></>
              : <><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6z"/></>}
          </svg>
          <span style={{ fontSize: 13.5, fontWeight: 800 }}>{cfg.label}</span>
        </span>
        <span style={{ fontSize: 12.5, opacity: 0.92 }}>{sousTexte}</span>
        <button onClick={() => navigate('/abonnements')}
          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 8, padding: '5px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          Voir les plans →
        </button>
        <style>{`@keyframes fuelo-trial-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </motion.div>
    </AnimatePresence>
  )
}
