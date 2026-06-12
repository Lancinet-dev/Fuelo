// ================================================
// FUELO V2 — API Service
// Fichier : frontend/src/services/api.js
// Axios centralisé + interceptors auth + refresh token
// ================================================

import axios from 'axios'

// ── Instance axios ────────────────────────────────────
const api = axios.create({
  baseURL:          import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  // 30s — le backend Render (tier gratuit) s'endort après 15 min d'inactivité
  // et met 30-50s à se réveiller au premier appel. Un timeout trop court (15s)
  // coupe la requête avant la réponse → l'inscription/connexion semblent "buguées"
  // alors que le serveur démarrait juste. 30s couvre la majorité des réveils.
  timeout:          30000,
  withCredentials:  true, // envoyer le cookie HttpOnly fuelo_refresh
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Interceptor requête — ajouter access token ───────
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

// ── Gestion des requêtes en attente pendant le refresh ─
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

const clearSession = () => {
  localStorage.removeItem('fuelo_token')
  localStorage.removeItem('fuelo_station')
  delete api.defaults.headers.common['Authorization']
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

// ── Interceptor réponse — refresh automatique sur 401 ─
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Le refresh lui-même a échoué → session vraiment expirée
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearSession()
      return Promise.reject(error)
    }

    // Déjà retried après refresh → logout
    if (originalRequest._retry) {
      clearSession()
      return Promise.reject(error)
    }

    // D'autres requêtes attendent déjà un refresh en cours
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await api.post('/auth/refresh')
      const newToken = data.token

      localStorage.setItem('fuelo_token', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      originalRequest.headers.Authorization = `Bearer ${newToken}`

      processQueue(null, newToken)
      return api(originalRequest)
    } catch {
      processQueue(new Error('Session expirée'), null)
      clearSession()
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
