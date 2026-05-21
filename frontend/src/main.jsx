// ================================================
// FUELO V2 — Point d'entrée principal
// Fichier : frontend/src/main.jsx
// ================================================

import { StrictMode }    from 'react'
import { createRoot }    from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster }       from 'react-hot-toast'
import { AuthProvider }  from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Router            from './app/router'
import WhatsAppButton    from './ui/WhatsAppButton'

// ── React Query ───────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                0,
      refetchOnWindowFocus: false,
      staleTime:            15_000,
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
`
const styleEl = document.createElement('style')
styleEl.textContent = globalStyles
document.head.appendChild(styleEl)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
// ── Rendu ─────────────────────────────────────────────
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <WhatsAppButton />
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
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)