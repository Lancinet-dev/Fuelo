// ================================================
// FUELO — Contexte multi-langue (FR / EN / Arabe)
// ================================================
// Réactif dans toute l'app : changer la langue re-rend tous les composants.
// Gère la direction RTL pour l'arabe (document.dir).

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import fr from '../i18n/fr'
import en from '../i18n/en'
import ar from '../i18n/ar'

const LOCALES = { fr, en, ar }
const RTL     = ['ar']

// eslint-disable-next-line react-refresh/only-export-components
export const LANGUES_DISPONIBLES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦' },
]

// Résout un chemin pointé ('nav.dashboard') dans l'objet de traductions
function resolve(obj, path) {
  let cur = obj
  for (const k of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return path
    cur = cur[k]
  }
  return typeof cur === 'string' ? cur : path
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('fuelo_lang') || 'fr' } catch { return 'fr' }
  })

  const dir = RTL.includes(lang) ? 'rtl' : 'ltr'

  // Applique langue + direction au document (RTL pour l'arabe)
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir  = dir
  }, [lang, dir])

  const setLang = useCallback((code) => {
    if (!LOCALES[code]) return
    try { localStorage.setItem('fuelo_lang', code) } catch { /* privé */ }
    setLangState(code)
  }, [])

  const t = useCallback((key) => {
    const locale = LOCALES[lang] ?? fr
    const result = resolve(locale, key)
    // Fallback vers le français si la clé manque dans la locale courante
    if (result === key && lang !== 'fr') return resolve(fr, key)
    return result
  }, [lang])

  const value = useMemo(() => ({ t, lang, setLang, dir }), [t, lang, setLang, dir])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation doit être dans un LanguageProvider')
  return ctx
}
