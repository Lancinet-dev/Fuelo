// ================================================
// FUELO V2 — API Service
// Fichier : frontend/src/services/api.js
// Axios centralisé + interceptors auth
// ================================================

import axios from 'axios'

// ── Instance axios ────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Interceptor requête — ajouter token ──────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fuelo_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor réponse — gérer erreurs globales ─────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expiré ou invalide — déconnecter
    if (error.response?.status === 401) {
      localStorage.removeItem('fuelo_token')
      localStorage.removeItem('fuelo_station')
      delete api.defaults.headers.common['Authorization']

      // Rediriger vers login si pas déjà dessus
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api