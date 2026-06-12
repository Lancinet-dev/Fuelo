// ================================================
// FUELO — useTranslation : scaffold multi-langue
// Langue stockée dans localStorage('fuelo_lang')
// Défaut : 'fr' (tout le UI est déjà en français)
// ================================================

import { useState, useCallback } from 'react'
import fr from '../i18n/fr'
import en from '../i18n/en'

const LOCALES = { fr, en }
export const LANGUES_DISPONIBLES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
]

// Résout un chemin pointé ('dashboard.title') dans l'objet de traductions
function resolve(obj, path) {
  const keys = path.split('.')
  let cur = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return path
    cur = cur[k]
  }
  return typeof cur === 'string' ? cur : path
}

export function useTranslation() {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('fuelo_lang') || 'fr'
  )

  const setLang = useCallback((code) => {
    if (!LOCALES[code]) return
    localStorage.setItem('fuelo_lang', code)
    setLangState(code)
  }, [])

  const t = useCallback((key) => {
    const locale = LOCALES[lang] ?? fr
    const result = resolve(locale, key)
    // Fallback to French if key missing in current locale
    if (result === key && lang !== 'fr') return resolve(fr, key)
    return result
  }, [lang])

  return { t, lang, setLang }
}
