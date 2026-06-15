import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Icône PWA (Cloudinary — runtime-cachée par la règle CacheFirst images)
const ICON = 'https://res.cloudinary.com/de0xeqpj9/image/upload/v1780821117/Capture_vh0qaw.png'

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
        name: 'Fuelo — Gestion de stations-service',
        short_name: 'Fuelo',
        description: 'Gestion de stations-service en Afrique de l\'Ouest — anti-fraude, GPS citernes, alertes temps réel.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#020817',
        theme_color: '#2563EB',
        icons: [
          { src: ICON, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: ICON, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: ICON, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
  ],
})
