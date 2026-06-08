// ================================================
// FUELO V2 — ThemeContext
// Fichier : frontend/src/context/ThemeContext.jsx
// ================================================

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  light: {
    name: 'light',
    bg: '#F0F4FF',
    bgSecondary: '#E8EEFF',
    card: '#FFFFFF',
    cardBorder: '#DBEAFE',
    sidebar: '#0F172A',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    text: '#1E293B',
    textSub: '#64748B',
    textMuted: '#94A3B8',
    inputBg: '#F8FAFF',
    inputBorder: '#DBEAFE',
    hover: '#EFF6FF',
    primary: '#2563EB',
    primaryLight: 'rgba(37,99,235,0.10)',
  },
  dark: {
    name: 'dark',
    bg: '#020817',
    bgSecondary: '#0A1424',
    card: '#0D1B2A',
    cardBorder: 'rgba(255,255,255,0.06)',
    glass: 'rgba(13,27,42,0.6)',
    sidebar: 'rgba(2,8,23,0.85)',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    text: '#FFFFFF',
    textSub: '#94A3B8',
    textMuted: '#64748B',
    inputBg: 'rgba(255,255,255,0.03)',
    inputBorder: 'rgba(255,255,255,0.08)',
    hover: 'rgba(255,255,255,0.04)',
    primary: '#2563EB',
    primaryLight: 'rgba(37,99,235,0.12)',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return window.localStorage.getItem('fuelo_theme') ?? 'light'
  })

  const isDark = mode === 'dark'
  const palette = THEMES[mode] ?? THEMES.light

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.background = palette.bg
    document.body.style.color = palette.text
  }, [palette])

  const toggle = useCallback(() => {
    const next = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fuelo_theme', next)
    }
  }, [mode])

  const setTheme = useCallback((newMode) => {
    if (!THEMES[newMode]) return
    setMode(newMode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fuelo_theme', newMode)
    }
  }, [])

  const value = useMemo(() => ({
    mode,
    isDark,
    palette,
    toggle,
    setTheme,
  }), [mode, isDark, palette, toggle, setTheme])

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

