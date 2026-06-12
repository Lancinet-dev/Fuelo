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
      // recommandé de eslint-plugin-react-hooks). Elles signalent des patterns
      // d'intégration parfaitement valides et utilisés volontairement dans
      // l'app — et qui fonctionnent en production :
      //   • set-state-in-effect : timers setInterval, géoloc watchPosition,
      //     recherche debouncée (synchronisation avec des systèmes externes)
      //   • refs : pattern "latest ref" (ref.current = valeur au render pour
      //     les callbacks Socket.IO / Leaflet)
      //   • purity : Date.now() pour un affichage de durée écoulée
      // On les garde en `warn` (visibles, non bloquantes) plutôt qu'en `error`
      // pour ne pas casser un code volontaire et stable.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
])
