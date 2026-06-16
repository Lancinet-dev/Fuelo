import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { compression } from 'vite-plugin-compression2'

// ── Icônes PWA (Cloudinary) ──────────────────────────
// Logo DÉTOURÉ (e_background_removal) posé sur le fond bleu nuit de la marque
// (#020817), carré plein bord à bord → rendu premium quel que soit le masque
// Android (cercle, squircle…).
//  • purpose "any"      : logo cadré plein carré.
//  • purpose "maskable" : logo agrandi pour REMPLIR le cercle de sécurité
//    (central 80%) via 2 transformations chaînées — sinon Android 12/13/14
//    rogne le logo ou l'affiche minuscule.
const CLD = 'https://res.cloudinary.com/de0xeqpj9/image/upload'
const ICON_SRC = 'v1780821117/Capture_vh0qaw.png'
const iconAny  = (s) => `${CLD}/e_background_removal/c_pad,b_rgb:020817,w_${s},h_${s}/${ICON_SRC}`
const iconMask = (s) => `${CLD}/e_background_removal/c_pad,b_rgb:020817,w_${Math.round(s * 0.8)},h_${Math.round(s * 0.8)}/c_pad,b_rgb:020817,w_${s},h_${s}/${ICON_SRC}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Met à jour le service worker automatiquement (pas de prompt utilisateur)
      registerType: 'autoUpdate',
      injectRegister: null, // on enregistre nous-mêmes via virtual:pwa-register (main.jsx)

      // ── Manifest PWA complet (installation) ──────────────
      manifest: {
        id: '/',
        name: 'Fuelo — Gestion de stations-service',
        short_name: 'Fuelo',
        description: 'Gestion de stations-service en Afrique de l\'Ouest — anti-fraude, GPS citernes, alertes temps réel.',
        lang: 'fr',
        dir: 'ltr',
        categories: ['business', 'productivity'],
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#020817',
        theme_color: '#2563EB',
        // Android moderne : il FAUT au moins une 192 + une 512, et une icône
        // maskable (avec zone de sécurité) pour une installation propre.
        icons: [
          { src: iconAny(192),  sizes: '192x192', type: 'image/png', purpose: 'any'      },
          { src: iconAny(512),  sizes: '512x512', type: 'image/png', purpose: 'any'      },
          { src: iconMask(192), sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: iconMask(512), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      // ── Service worker / Workbox ─────────────────────────
      workbox: {
        // Précache de tout le shell applicatif (JS, CSS, HTML, icônes locales,
        // polices) → Dashboard, Ventes, Stock, Alertes et toutes les pages
        // bundlées fonctionnent hors ligne une fois l'app chargée une 1ʳᵉ fois.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        // SPA : toute navigation hors ligne retombe sur le shell index.html
        // (l'app React démarre alors et affiche son propre état hors ligne)
        navigateFallback: '/index.html',
        // Ne PAS faire retomber les appels API sur index.html
        navigateFallbackDenylist: [/^\/api/, /\/api\//],

        runtimeCaching: [
          {
            // ── API backend (NetworkFirst, 3s puis cache) ──
            urlPattern: ({ url }) =>
              /\/api\//.test(url.pathname) || url.hostname.includes('onrender.com'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'fuelo-api',
              networkTimeoutSeconds: 3,
              // 14 jours : fallback hors ligne plus long (connectivité intermittente
              // en Afrique de l'Ouest). NetworkFirst → toujours frais quand en ligne.
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Images Cloudinary (logos, photos) — StaleWhileRevalidate ──
            // Sert l'image en cache instantanément (offline OK) et revérifie en
            // arrière-plan → un logo de station modifié apparaît au 2ᵉ affichage,
            // sans sacrifier la perf ni le hors ligne.
            urlPattern: ({ url }) => url.hostname === 'res.cloudinary.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'fuelo-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 jours
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Polices Google (CSS) — StaleWhileRevalidate ──
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // ── Polices Google (fichiers) — CacheFirst ──
            urlPattern: ({ url }) => url.hostname === 'fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ── Tuiles carte Leaflet/CartoDB — CacheFirst ──
            urlPattern: ({ url }) =>
              url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('global.ssl.fastly.net'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fuelo-map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // SW désactivé en dev (évite de cacher le HMR) — actif au build/preview
      devOptions: { enabled: false },
    }),

    // ── Pré-compression des assets (gzip + brotli) ──────────
    // Génère des fichiers .gz et .br à côté des assets. Utile si l'app est
    // servie ailleurs que Vercel (qui compresse déjà à la volée), et pour
    // le `preview`. Seuil 1 Ko : inutile de compresser les tout petits.
    compression({ algorithm: 'gzip',           threshold: 1024, exclude: [/\.(br|gz)$/] }),
    compression({ algorithm: 'brotliCompress', threshold: 1024, exclude: [/\.(br|gz)$/] }),
  ],

  build: {
    // Le chunk `index` (entrée principale) descend bien sous ce seuil après split
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Sépare les grosses dépendances en chunks vendor mis en cache long
        // terme : elles changent rarement, donc à chaque déploiement le
        // navigateur ne re-télécharge que le petit code applicatif.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion'
          if (id.includes('recharts') || id.includes('/d3-') || id.includes('victory-vendor') || id.includes('/decimal.js')) return 'vendor-charts'
          if (id.includes('leaflet'))   return 'vendor-leaflet'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('@sentry'))   return 'vendor-sentry'
          if (id.includes('socket.io') || id.includes('engine.io')) return 'vendor-socket'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/react-router') || id.includes('/react-is/') || id.includes('/scheduler/')) return 'vendor-react'
        },
      },
    },
  },
})
