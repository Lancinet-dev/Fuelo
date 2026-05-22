// ================================================
// FUELO V2 — ThemeContext
// Fichier : frontend/src/context/ThemeContext.jsx
// ================================================

import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  light: {
    name:          'light',
    bg:            '#F0F4FF',
    bgSecondary:   '#E8EEFF',
    card:          '#FFFFFF',
    cardBorder:    '#DBEAFE',
    sidebar:       '#0F172A',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    text:          '#1E293B',
    textSub:       '#64748B',
    textMuted:     '#94A3B8',
    inputBg:       '#F8FAFF',
    inputBorder:   '#DBEAFE',
    hover:         '#EFF6FF',
    primary:       '#2563EB',
    primaryLight:  'rgba(37,99,235,0.10)',
  },
  dark: {
    name:          'dark',
    bg:            '#0D1B2A',
    bgSecondary:   '#112236',
    card:          '#162032',
    cardBorder:    '#1E3148',
    sidebar:       '#0A1628',
    sidebarBorder: 'rgba(255,255,255,0.05)',
    text:          '#E2EAF4',
    textSub:       '#8BA3BF',
    textMuted:     '#4A6480',
    inputBg:       '#112236',
    inputBorder:   '#1E3148',
    hover:         '#1A2E42',
    primary:       '#3B82F6',
    primaryLight:  'rgba(59,130,246,0.12)',
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('fuelo_theme') ?? 'light'
  })

  const isDark  = mode === 'dark'
  const palette = THEMES[mode] ?? THEMES.light

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

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être dans un ThemeProvider')
  return ctx
}