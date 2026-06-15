import * as Sentry from '@sentry/react'
Sentry.init({
  dsn: "https://287284428f711e01eeb5b4f031afec39@o4511425920565248.ingest.de.sentry.io/4511425923252304",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
})

import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster }       from 'react-hot-toast'
import { registerSW }    from 'virtual:pwa-register'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import NetworkStatus     from './ui/NetworkStatus'
import Router            from './app/router'

// ── Service worker PWA (généré par vite-plugin-pwa) ───
// autoUpdate : la nouvelle version s'installe et prend la main automatiquement
registerSW({ immediate: true })

// ── React Query ───────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                3,
      retryDelay:           (i) => Math.min(1000 * 2 ** i, 30_000),
      refetchOnWindowFocus: false,
      staleTime:            5 * 60_000,
      gcTime:               10 * 60_000,
    },
    mutations: { retry: 0 },
  },
})

// ── Styles globaux ────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background 0.3s ease, color 0.3s ease;
  }

  button { font-family: inherit; }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

  ::-webkit-scrollbar       { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #F3F4F6; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

  /* Accessibilité — focus visible uniquement au clavier */
  :focus-visible {
    outline: 2px solid #2563EB;
    outline-offset: 2px;
    border-radius: 4px;
  }
  :focus:not(:focus-visible) { outline: none; }

  /* Tableaux mobiles scrollables */
  .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  /* Boutons — minimum touch target 48px WCAG */
  @media (max-width: 768px) {
    button { min-height: 48px; touch-action: manipulation; }
  }

  /* ── Responsive utilitaires globaux ─────────── */
  @media (max-width: 1024px) {
    .fuelo-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 768px) {
    .fuelo-grid-2 { grid-template-columns: 1fr !important; }
    .fuelo-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
    .fuelo-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 480px) {
    .fuelo-grid-3 { grid-template-columns: 1fr !important; }
    .fuelo-grid-4 { grid-template-columns: 1fr !important; }
  }

  /* ── Modals → bottom-sheet sur mobile ────────── */
  @media (max-width: 480px) {
    .fuelo-modal-overlay {
      align-items: flex-end !important;
      padding: 0 !important;
    }
    .fuelo-modal {
      border-radius: 24px 24px 0 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      max-height: 90dvh;
      overflow-y: auto;
    }
  }

  /* ── Images responsive ───────────────────────── */
  img { max-width: 100%; height: auto; }

  /* ── Prévenir overflow horizontal global ─────── */
  html, body { overflow-x: hidden; max-width: 100vw; }

  /* Shimmer animation pour skeletons */
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 6px;
  }
`
const styleEl = document.createElement('style')
styleEl.textContent = globalStyles
document.head.appendChild(styleEl)

// ── Rendu ─────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <NetworkStatus />
          <Router />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background:   '#fff',
                color:        '#111827',
                border:       '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize:     '14px',
                boxShadow:    '0 4px 12px rgba(0,0,0,0.08)',
                fontFamily:   "'DM Sans', system-ui, sans-serif",
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' }, duration: 3000 },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' }, duration: 4000 },
              loading: { iconTheme: { primary: '#2563EB', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
)