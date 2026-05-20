// ================================================
// FUELO V2 — ThemeContext
// Fichier : frontend/src/context/ThemeContext.jsx
// Dark / Light mode global persisté
// ================================================

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const ThemeContext = createContext(null)

// ── Thèmes ────────────────────────────────────────────
const THEMES = {
  light: {
    name:          'light',
    // Fonds
    bg:            '#F5F7FA',
    bgSecondary:   '#ECEEF2',
    // Cards
    card:          '#FFFFFF',
    cardBorder:    '#E5E7EB',
    // Sidebar — toujours sombre
    sidebar:       '#111827',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    // Textes
    text:          '#111827',
    textSub:       '#6B7280',
    textMuted:     '#9CA3AF',
    // Inputs
    inputBg:       '#F9FAFB',
    inputBorder:   '#E5E7EB',
    // Hover
    hover:         '#F3F4F6',
  },
  dark: {
    name:          'dark',
    // Fonds
    bg:            '#0A0F1E',
    bgSecondary:   '#0D1528',
    // Cards
    card:          '#111827',
    cardBorder:    '#1E2D42',
    // Sidebar — toujours sombre
    sidebar:       '#080D18',
    sidebarBorder: 'rgba(255,255,255,0.05)',
    // Textes
    text:           '#F1F5F9',      
    textSub:       '#64748B',
    textMuted:     '#334155',
    // Inputs
    inputBg:       '#0A0F1E',
    inputBorder:   '#1E2D42',
    // Hover
    hover:         '#1E293B',
  },
}

// ── Provider ─────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('fuelo_theme') ?? 'light'
  })

  const isDark  = mode === 'dark'
  const palette = THEMES[mode] ?? THEMES.light

  // Appliquer la couleur de fond sur <body>
  useEffect(() => {
    document.body.style.background = palette.bg
    document.body.style.color      = palette.text
  }, [palette])

  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('fuelo_theme', next)
  }

  const setTheme = (newMode) => {
    if (!THEMES[newMode]) return
    setMode(newMode)
    localStorage.setItem('fuelo_theme', newMode)
  }

  const value = useMemo(() => ({
    mode,
    isDark,
    palette,
    toggle,
    setTheme,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [mode, isDark])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être dans un ThemeProvider')
  return ctx
}