// ================================================
// FUELO V2 — Design System centralisé
// Fichier : frontend/src/config/theme.js
// UNE seule source de vérité pour tout le design
// ================================================

const theme = {

  // ── Couleurs ──────────────────────────────────────
  colors: {
    // Principale
    primary:     '#F59E0B',
    primaryDark: '#D97706',
    primaryLight:'rgba(245,158,11,0.12)',

    // Sidebar — toujours sombre
    sidebar:     '#111827',
    sidebarBorder: 'rgba(255,255,255,0.06)',

    // Fond général — clair
    bg:          '#F5F7FA',
    bgWhite:     '#FFFFFF',

    // Cards
    card:        '#FFFFFF',
    cardBorder:  '#E5E7EB',

    // Textes
    text:        '#111827',
    textSub:     '#6B7280',
    textMuted:   '#9CA3AF',

    // États
    success:     '#10B981',
    successLight:'rgba(16,185,129,0.12)',
    danger:      '#EF4444',
    dangerLight: 'rgba(239,68,68,0.10)',
    warning:     '#F59E0B',
    warningLight:'rgba(245,158,11,0.10)',
    info:        '#3B82F6',
    infoLight:   'rgba(59,130,246,0.10)',
  },

  // ── Border radius ─────────────────────────────────
  radius: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '18px',
    full: '9999px',
  },

  // ── Shadows ───────────────────────────────────────
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md:  '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    lg:  '0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
    primary: '0 4px 14px rgba(245,158,11,0.25)',
  },

  // ── Typographie ───────────────────────────────────
  font: {
    family: "'DM Sans', system-ui, sans-serif",
    mono:   "'DM Mono', 'Courier New', monospace",
    size: {
      xs:   '11px',
      sm:   '12px',
      md:   '13px',
      base: '14px',
      lg:   '16px',
      xl:   '18px',
      '2xl':'22px',
      '3xl':'28px',
    },
    weight: {
      normal:  400,
      medium:  500,
      semi:    600,
      bold:    700,
      black:   800,
    },
  },

  // ── Espacements ───────────────────────────────────
  spacing: {
    xs:  '4px',
    sm:  '8px',
    md:  '12px',
    lg:  '16px',
    xl:  '20px',
    '2xl':'24px',
    '3xl':'32px',
    '4xl':'40px',
  },

  // ── Sidebar width ─────────────────────────────────
  sidebarWidth: '220px',

  // ── Transitions ───────────────────────────────────
  transition: {
    fast:   'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow:   'all 0.35s ease',
  },

  // ── Breakpoints ───────────────────────────────────
  breakpoints: {
    mobile:  '768px',
    tablet:  '1024px',
    desktop: '1280px',
  },
}

export default theme