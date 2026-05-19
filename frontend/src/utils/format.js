// ================================================
// FUELO V2 — Fonctions utilitaires
// Fichier : frontend/src/utils/format.js
// ================================================

// ── Formater montant GNF ─────────────────────────────
export const formatGNF = (montant) => {
  const n = parseFloat(montant) || 0
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}Md GNF`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M GNF`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K GNF`
  return `${n.toLocaleString('fr-FR')} GNF`
}

// ── Formater litres ───────────────────────────────────
export const formatLitres = (litres) => {
  const n = parseFloat(litres) || 0
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L`
}

// ── Formater date courte ──────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

// ── Formater date + heure ─────────────────────────────
export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('fr-FR', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ── Formater heure seule ──────────────────────────────
export const formatTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ── Temps relatif (il y a X minutes) ─────────────────
export const formatRelative = (date) => {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins  < 1)  return 'À l\'instant'
  if (mins  < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days  < 7)  return `Il y a ${days}j`
  return formatDate(date)
}

// ── Formater pourcentage ──────────────────────────────
export const formatPct = (value, total) => {
  if (!total || total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

// ── Couleur selon statut stock ────────────────────────
export const getStockStatus = (quantite, seuil = 300) => {
  if (quantite <= 0)       return { label: 'Vide',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  if (quantite <= seuil)   return { label: 'Critique',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   }
  if (quantite <= seuil*2) return { label: 'Attention', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  }
  return                          { label: 'Normal',    color: '#10B981', bg: 'rgba(16,185,129,0.1)'  }
}

// ── Tronquer texte ────────────────────────────────────
export const truncate = (str, max = 30) => {
  if (!str) return '—'
  return str.length > max ? `${str.slice(0, max)}…` : str
}

// ── Capitaliser première lettre ───────────────────────
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}