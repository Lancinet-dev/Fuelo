// ================================================
// FUELO — PlanGate : bloque les features par plan
// ================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlan, PLAN_COLORS } from '../hooks/usePlan'
import { useTheme } from '../context/ThemeContext'
import theme from '../config/theme'

const FEATURE_LABELS = {
  exports:      'Export PDF & Excel',
  assistant:    'Assistant IA',
  performances: 'Primes & Performance',
  logistique:   'Module Logistique',
  trajets:      'GPS Citernes & Trajets',
  citernes:     'Gestion des Citernes',
  services:     'Services Pompiste',
  comptable:    'Module Comptable',
  antifraude:   'Centre Anti-Fraude',
}

const PLAN_REQUIS_LABEL = {
  pro:        'Pro',
  enterprise: 'Enterprise',
}

function LockIcon({ size = 28, color = '#F59E0B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

// Modal popup d'upgrade
export function UpgradeModal({ feature, onClose }) {
  const navigate = useNavigate()
  const { plan, planDef } = usePlan()
  const { palette, isDark } = useTheme()

  const reqPlan      = { exports: 'pro', assistant: 'pro', performances: 'pro', logistique: 'pro', trajets: 'pro', citernes: 'pro', services: 'pro', antifraude: 'pro', comptable: 'enterprise' }[feature] ?? 'pro'
  const featureLabel = FEATURE_LABELS[feature] ?? feature
  const reqColors    = PLAN_COLORS[reqPlan]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 20 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.card,
          padding: '36px 32px',
          maxWidth: 420, width: '100%',
          boxShadow: theme.shadow.lg,
          textAlign: 'center',
        }}
      >
        {/* Icône lock */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.10)', border: '1.5px solid rgba(245,158,11,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <LockIcon size={30} color="#F59E0B" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: reqColors?.text ?? '#93C5FD', background: reqColors?.bg ?? '#1E3A8A', border: `1px solid ${reqColors?.border ?? '#2563EB'}`, padding: '3px 12px', borderRadius: theme.radius.full, display: 'inline-block', marginBottom: 16 }}>
          Plan {PLAN_REQUIS_LABEL[reqPlan] ?? reqPlan}
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: palette.text, marginBottom: 8, letterSpacing: '-0.3px' }}>
          {featureLabel}
        </div>
        <div style={{ fontSize: 14, color: palette.textSub, marginBottom: 6, lineHeight: 1.7 }}>
          Cette fonctionnalité est disponible à partir du plan{' '}
          <strong style={{ color: reqPlan === 'pro' ? '#2563EB' : '#F59E0B' }}>{PLAN_REQUIS_LABEL[reqPlan]}</strong>.
        </div>
        <div style={{ fontSize: 13, color: palette.textMuted, marginBottom: 28 }}>
          Votre plan actuel : <strong style={{ color: palette.text }}>{planDef?.label ?? 'Starter'}</strong>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ flex: 1, height: 46, background: 'transparent', border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.button, color: palette.textSub, cursor: 'pointer', fontFamily: theme.font.family, fontSize: 14 }}>
            Fermer
          </button>
          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => { navigate('/abonnements'); onClose() }}
            style={{ flex: 2, height: 46, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', border: 'none', borderRadius: theme.radius.button, color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: 14, fontWeight: 700, boxShadow: '0 4px 18px rgba(37,99,235,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 5l7 7-7 7M5 12h15" /></svg>
            Upgrader maintenant
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Hook : retourne { showUpgrade, Modal } — à utiliser dans les pages pour les boutons
export function useUpgradeModal() {
  const [activeFeature, setActiveFeature] = useState(null)

  const Modal = (
    <AnimatePresence>
      {activeFeature && (
        <UpgradeModal key={activeFeature} feature={activeFeature} onClose={() => setActiveFeature(null)} />
      )}
    </AnimatePresence>
  )

  return { showUpgrade: setActiveFeature, Modal }
}

// Page gate : bloque une page entière et affiche un écran d'upgrade
export function PlanGatePage({ feature, children }) {
  const { canAccess, plan, planDef, loading } = usePlan()
  const navigate = useNavigate()
  const { palette, isDark } = useTheme()

  if (loading) return null
  if (canAccess(feature)) return children

  const reqPlan      = { logistique: 'pro', trajets: 'pro', performances: 'pro', assistant: 'pro', services: 'pro', antifraude: 'pro', comptable: 'enterprise' }[feature] ?? 'pro'
  const featureLabel = FEATURE_LABELS[feature] ?? feature
  const reqColors    = PLAN_COLORS[reqPlan]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 32 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          background: isDark ? palette.glass : palette.card,
          backdropFilter: isDark ? 'blur(20px)' : 'none',
          border: `1px solid ${palette.cardBorder}`,
          borderRadius: theme.radius.card,
          padding: '52px 40px',
          maxWidth: 480, width: '100%',
          textAlign: 'center',
          boxShadow: isDark ? theme.shadow.premium : theme.shadow.lg,
        }}
      >
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <LockIcon size={34} color="#F59E0B" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: reqColors?.text ?? '#93C5FD', background: reqColors?.bg ?? '#1E3A8A', border: `1px solid ${reqColors?.border ?? '#2563EB'}`, padding: '3px 14px', borderRadius: theme.radius.full, display: 'inline-block', marginBottom: 18 }}>
          Plan {PLAN_REQUIS_LABEL[reqPlan] ?? reqPlan}
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, color: palette.text, letterSpacing: '-0.5px', marginBottom: 10 }}>
          {featureLabel}
        </div>
        <div style={{ fontSize: 15, color: palette.textSub, lineHeight: 1.7, marginBottom: 8 }}>
          Cette fonctionnalité est incluse à partir du plan{' '}
          <strong style={{ color: reqPlan === 'pro' ? '#2563EB' : '#F59E0B' }}>{PLAN_REQUIS_LABEL[reqPlan]}</strong>.
        </div>
        <div style={{ fontSize: 13, color: palette.textMuted, marginBottom: 36 }}>
          Votre plan actuel : <strong style={{ color: palette.text }}>{planDef?.label ?? 'Starter'}</strong>
        </div>

        <motion.button
          whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/abonnements')}
          style={{ width: '100%', height: 52, background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', border: 'none', borderRadius: theme.radius.button, color: '#fff', cursor: 'pointer', fontFamily: theme.font.family, fontSize: 15, fontWeight: 700, boxShadow: '0 6px 20px rgba(37,99,235,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '0 auto' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 5l7 7-7 7M5 12h15" /></svg>
          Voir les plans et upgrader
        </motion.button>
      </motion.div>
    </div>
  )
}
