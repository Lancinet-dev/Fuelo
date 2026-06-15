// ================================================
// FUELO V2 — Stock premium (glassmorphism)
// Fichier : frontend/src/features/stock/Stock.jsx
// ================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStock }    from '../../hooks/useStock'
import { useTheme }    from '../../context/ThemeContext'
import { useAuth }     from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'
import StockGauge      from '../../ui/StockGauge'
import { SkeletonStockGauge, SkeletonStyle } from '../../ui/Skeleton'
import { formatLitres, formatRelative } from '../../utils/format'
import theme from '../../config/theme'

export default function Stock() {
  const { user }    = useAuth()
  const isOwner     = user?.role === 'owner'
  const { palette, isDark } = useTheme()
  const { t }       = useTranslation()
  const { essence, gasoil, essenceMaj, gasoilMaj, essenceJours, gasoilJours, loading, livraisonLoading, ajouterLivraison } = useStock()

  const [type,     setType]     = useState('essence')
  const [quantite, setQuantite] = useState('')

  const preview = (type === 'essence' ? essence : gasoil) + (parseFloat(quantite) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const qty = parseFloat(quantite)
    if (!qty || qty <= 0) return
    await ajouterLivraison({ type, quantite: qty })
    setQuantite('')
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-stock">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          {t('stock.title')}
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          {isOwner ? t('stock.subtitleOwner') : t('stock.subtitleGerant')}
        </p>
      </div>

      {/* Jauges */}
      {loading ? (
        <>
          <SkeletonStyle />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="fuelo-grid-2">
            <SkeletonStockGauge /><SkeletonStockGauge />
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }} className="fuelo-grid-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <StockGauge label={t('stock.essence')} quantite={essence} derniereMaj={essenceMaj ? formatRelative(essenceMaj) : null} />
            {essenceJours !== null && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: essenceJours <= 3 ? '#EF4444' : essenceJours <= 7 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                ~{essenceJours} jour{essenceJours !== 1 ? 's' : ''} restant{essenceJours !== 1 ? 's' : ''}
                {essenceJours <= 3 && <span style={{ marginLeft: 4 }}>⚠ Commandez !</span>}
              </div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
            <StockGauge label={t('stock.gasoil')} quantite={gasoil} derniereMaj={gasoilMaj ? formatRelative(gasoilMaj) : null} />
            {gasoilJours !== null && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: gasoilJours <= 3 ? '#EF4444' : gasoilJours <= 7 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>
                ~{gasoilJours} jour{gasoilJours !== 1 ? 's' : ''} restant{gasoilJours !== 1 ? 's' : ''}
                {gasoilJours <= 3 && <span style={{ marginLeft: 4 }}>⚠ Commandez !</span>}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Formulaire livraison — gérant uniquement */}
      {!isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          style={{
            background: isDark ? palette.glass : palette.card,
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
            border: `1px solid ${palette.cardBorder}`,
            borderRadius: theme.radius.card,
            padding: '26px 28px', maxWidth: 520,
            boxShadow: isDark ? theme.shadow.premium : theme.shadow.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${theme.colors.primary}15`, backdropFilter: 'blur(12px)', border: `1px solid ${theme.colors.primary}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold, color: palette.text }}>
                {t('stock.livraisonTitre')}
              </div>
              <div style={{ fontSize: theme.font.size.sm, color: palette.textSub, marginTop: 2 }}>
                {t('stock.livraisonSub')}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Choix type */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {t('stock.typeCarburant')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[{ val: 'essence', icon: 'pump', color: theme.colors.warning }, { val: 'gasoil', icon: 'drum', color: theme.colors.info }].map(({ val, icon, color }) => {
                  const active = type === val
                  return (
                    <motion.button key={val} type="button" whileTap={{ scale: 0.97 }} onClick={() => setType(val)}
                      style={{
                        padding: '12px', borderRadius: theme.radius.button,
                        border: `1.5px solid ${active ? color : palette.cardBorder}`,
                        background: active ? `${color}15` : palette.inputBg,
                        color: active ? color : palette.textSub,
                        fontFamily: theme.font.family, fontSize: theme.font.size.md,
                        fontWeight: active ? theme.font.weight.bold : theme.font.weight.normal,
                        cursor: 'pointer', textTransform: 'capitalize', transition: theme.transition.hover,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: active ? `0 0 0 1px ${color}30, 0 6px 20px ${color}20` : 'none',
                      }}>
                      {icon === 'pump'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 22V5a2 2 0 012-2h8a2 2 0 012 2v17H3z"/><path d="M3 11h12"/><path d="M15 7h1a2 2 0 012 2v3a1 1 0 002 0V7l-3-3"/><path d="M6 7h4"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/></svg>
                      }
                      {t('stock.' + val)}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Quantité */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {t('stock.quantiteRecue')}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="1" step="0.1" placeholder="Ex: 2000"
                  value={quantite}
                  onChange={e => setQuantite(e.target.value)}
                  onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
                  onBlur={e  => { e.target.style.borderColor = palette.cardBorder; e.target.style.boxShadow = 'none' }}
                  style={{ width: '100%', height: 52, background: palette.inputBg, border: `1.5px solid ${palette.cardBorder}`, borderRadius: theme.radius.button, padding: '0 70px 0 16px', fontSize: 18, fontWeight: theme.font.weight.bold, color: palette.text, fontFamily: theme.font.mono, outline: 'none', transition: theme.transition.hover, boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: palette.textMuted, pointerEvents: 'none' }}>
                  Litres
                </span>
              </div>

              <AnimatePresence>
                {quantite && parseFloat(quantite) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: theme.radius.md, background: `${theme.colors.success}12`, border: `1px solid ${theme.colors.success}28`, fontSize: theme.font.size.sm, color: theme.colors.success, fontWeight: theme.font.weight.semi }}>
                      Stock {type} après livraison : <strong style={{ fontFamily: theme.font.mono }}>{formatLitres(preview)}</strong>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bouton */}
            <motion.button type="submit" whileHover={{ y: livraisonLoading || !quantite ? 0 : -2 }} whileTap={{ scale: 0.98 }} disabled={livraisonLoading || !quantite || parseFloat(quantite) <= 0}
              style={{ width: '100%', height: 50, background: livraisonLoading ? theme.colors.primaryDark : theme.colors.primary, border: 'none', borderRadius: theme.radius.button, fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: '#fff', cursor: livraisonLoading || !quantite ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.hover, opacity: !quantite || parseFloat(quantite) <= 0 ? 0.6 : 1 }}>
              {livraisonLoading
                ? <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              }
              {livraisonLoading ? `${t('common.loading')}` : t('stock.confirmer')}
            </motion.button>
          </form>
        </motion.div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .fuelo-stock  { padding: 20px 16px !important; }
          .fuelo-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
