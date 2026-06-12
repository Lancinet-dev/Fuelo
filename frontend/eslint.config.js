import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Règles EXPÉRIMENTALES du React Compiler (ajoutées récemment au preset
      // recommandé de eslint-plugin-react-hooks, pas encore stables). Chaque
      // occurrence dans l'app a été revue manuellement (2026-06-12) : ce sont
      // toutes des intégrations volontaires et correctes avec des systèmes
      // externes, qui fonctionnent en production :
      //   • set-state-in-effect : timers setInterval, géoloc watchPosition,
      //     recherche debouncée (synchronisation avec des systèmes externes)
      //   • refs : pattern "latest ref" (ref.current = valeur au render pour
      //     les callbacks Socket.IO / Leaflet)
      //   • purity : Date.now() pour un affichage de durée écoulée
      // Désactivées tant que le React Compiler n'est pas stable, pour éviter
      // des faux positifs sur du code volontaire. À réévaluer plus tard.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
    },
  },
])
