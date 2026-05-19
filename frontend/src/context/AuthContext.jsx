// ================================================
// FUELO V2 — AuthContext
// Fichier : frontend/src/context/AuthContext.jsx
// ================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// ── Helpers localStorage ──────────────────────────────
const storage = {
  getToken:   () => localStorage.getItem('fuelo_token'),
  getStation: () => {
    const val = localStorage.getItem('fuelo_station')
    return val ? Number(val) || null : null
  },
  set: (token, stationId) => {
    localStorage.setItem('fuelo_token',   String(token))
    localStorage.setItem('fuelo_station', String(stationId))
  },
  clear: () => {
    localStorage.removeItem('fuelo_token')
    localStorage.removeItem('fuelo_station')
    // Nettoyer le header axios pour éviter les requêtes avec vieux token
    delete api.defaults.headers.common['Authorization']
  },
}

// ── Splash screen de chargement ───────────────────────
function LoadingScreen() {
  return (
    <div style={{
      height:          '100vh',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      background:      '#F5F7FA',
      gap:             16,
    }}>
      <div style={{
        width:        40,
        height:       40,
        background:   '#F59E0B',
        borderRadius: 11,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        boxShadow:    '0 0 20px rgba(245,158,11,0.3)',
      }}>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
          <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
        </svg>
      </div>
      <div style={{
        width:        32,
        height:       32,
        border:       '3px solid #E5E7EB',
        borderTopColor: '#F59E0B',
        borderRadius: '50%',
        animation:    'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [stationId, setStationId] = useState(() => storage.getStation())
  const [loading,   setLoading]   = useState(() => !!storage.getToken())

  // ── Vérifier token au démarrage ───────────────────
  useEffect(() => {
    const token = storage.getToken()
    if (!token) return

    let cancelled = false

    api.get('/auth/me')
      .then(res => {
        if (cancelled) return
        setUser(res.data.user)
        setStationId(storage.getStation())
      })
      .catch(() => {
        if (cancelled) return
        storage.clear()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  // ── Login ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      storage.set(data.token, data.station_id)
      setUser(data.user)
      setStationId(Number(data.station_id))
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Register ──────────────────────────────────────
  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', payload)
      storage.set(data.token, data.station_id)
      setUser(data.user)
      setStationId(Number(data.station_id))
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ────────────────────────────────────────
  const logout = useCallback(() => {
    storage.clear()
    setUser(null)
    setStationId(null)
  }, [])

  // ── Changer de station (owner) ────────────────────
  const changerStation = useCallback(async (newStationId) => {
    const { data } = await api.post('/station/changer', { station_id: newStationId })
    storage.set(data.token, data.station_id)
    setUser(data.user)
    setStationId(Number(data.station_id))
    return Number(data.station_id)
  }, [])

  // ── Valeurs mémorisées ────────────────────────────
  const value = useMemo(() => ({
    user,
    stationId,
    loading,
    isAuthenticated: !!user,
    role:            user?.role   ?? null,
    isOwner:         user?.role === 'owner',
    isManager:       user?.role === 'owner' || user?.role === 'manager',
    isPompiste:      user?.role === 'pompiste',
    isSuperAdmin:    user?.role === 'superadmin',
    login,
    register,
    logout,
    changerStation,
  }), [user, stationId, loading, login, register, logout, changerStation])

  if (loading) return <LoadingScreen />

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


export { AuthContext }

// ── Hook ─────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être dans un AuthProvider')
  return ctx
}