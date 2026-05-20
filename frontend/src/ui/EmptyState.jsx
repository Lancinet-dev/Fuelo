// ================================================
// FUELO V2 — EmptyState
// Fichier : frontend/src/ui/EmptyState.jsx
// État vide premium — jamais une page blanche
// ================================================

import { memo } from 'react'
import theme from '../config/theme'

// ── Illustrations SVG par type ────────────────────────
const ILLUSTRATIONS = {
  ventes: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#FEF3C7" />
      <rect x="12" y="32" width="8" height="20" rx="2" fill="#F59E0B" opacity="0.4" />
      <rect x="24" y="22" width="8" height="30" rx="2" fill="#F59E0B" opacity="0.6" />
      <rect x="36" y="14" width="8" height="38" rx="2" fill="#F59E0B" />
      <rect x="48" y="26" width="8" height="26" rx="2" fill="#F59E0B" opacity="0.7" />
      <polyline points="14,28 28,18 40,10 56,20" stroke="#D97706" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ),
  stock: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#D1FAE5" />
      <rect x="10" y="42" width="44" height="10" rx="3" fill="#10B981" opacity="0.3" />
      <rect x="10" y="42" width="20" height="10" rx="3" fill="#10B981" />
      <rect x="14" y="24" width="36" height="16" rx="3" fill="#10B981" opacity="0.6" />
      <rect x="18" y="14" width="28" height="12" rx="3" fill="#10B981" opacity="0.4" />
      <path d="M32 30 L32 46" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  ),
  alertes: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#D1FAE5" />
      <path d="M32 16L48 44H16L32 16Z" fill="#10B981" opacity="0.3" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="52" r="4" fill="#10B981" />
      <path d="M32 28V38" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  employes: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#EDE9FE" />
      <circle cx="24" cy="24" r="8" fill="#8B5CF6" opacity="0.4" />
      <circle cx="40" cy="24" r="8" fill="#8B5CF6" opacity="0.6" />
      <path d="M10 50c0-8 6-14 14-14h16c8 0 14 6 14 14" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  ),
  stations: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#DBEAFE" />
      <rect x="16" y="28" width="32" height="24" rx="3" fill="#3B82F6" opacity="0.3" />
      <path d="M12 28L32 12L52 28" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="26" y="38" width="12" height="14" rx="2" fill="#3B82F6" opacity="0.6" />
    </svg>
  ),
  default: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill="#F3F4F6" />
      <rect x="16" y="20" width="32" height="4" rx="2" fill="#9CA3AF" opacity="0.5" />
      <rect x="16" y="30" width="24" height="4" rx="2" fill="#9CA3AF" opacity="0.35" />
      <rect x="16" y="40" width="20" height="4" rx="2" fill="#9CA3AF" opacity="0.25" />
    </svg>
  ),
}

// ── EmptyState ────────────────────────────────────────
const EmptyState = memo(function EmptyState({
  type      = 'default',
  title,
  message,
  actionLabel,
  onAction,
}) {
  const illustration = ILLUSTRATIONS[type] ?? ILLUSTRATIONS.default

  const DEFAULT_CONTENT = {
    ventes:   { title: 'Aucune vente enregistrée',   message: 'Les ventes de votre station apparaîtront ici.' },
    stock:    { title: 'Stock non configuré',          message: 'Ajoutez une première livraison pour commencer.' },
    alertes:  { title: 'Aucune alerte active',         message: 'Tout fonctionne normalement. Votre stock est en bon état.' },
    employes: { title: 'Aucun employé ajouté',         message: 'Créez des comptes pompistes pour qu\'ils puissent enregistrer des ventes.' },
    stations: { title: 'Aucune station supplémentaire',message: 'Créez une nouvelle station pour la gérer depuis ce tableau de bord.' },
    default:  { title: 'Aucune donnée',                message: 'Il n\'y a rien à afficher pour le moment.' },
  }

  const content = DEFAULT_CONTENT[type] ?? DEFAULT_CONTENT.default
  const finalTitle   = title   ?? content.title
  const finalMessage = message ?? content.message

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '60px 24px',
      textAlign:      'center',
      gap:            16,
    }}>
      {/* Illustration */}
      <div style={{ marginBottom: 4 }}>
        {illustration}
      </div>

      {/* Titre */}
      <div style={{
        fontSize:    theme.font.size.lg,
        fontWeight:  theme.font.weight.bold,
        color:       theme.colors.text,
        letterSpacing: '-0.3px',
      }}>
        {finalTitle}
      </div>

      {/* Message */}
      <div style={{
        fontSize:  theme.font.size.md,
        color:     theme.colors.textSub,
        maxWidth:  340,
        lineHeight:1.6,
      }}>
        {finalMessage}
      </div>

      {/* CTA */}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          style={{
            marginTop:    8,
            padding:      '10px 22px',
            borderRadius: theme.radius.md,
            border:       'none',
            background:   theme.colors.primary,
            color:        '#0F172A',
            fontSize:     theme.font.size.md,
            fontWeight:   theme.font.weight.semi,
            cursor:       'pointer',
            fontFamily:   theme.font.family,
            boxShadow:    theme.shadow.primary,
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            transition:   theme.transition.fast,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  )
})

export default EmptyState