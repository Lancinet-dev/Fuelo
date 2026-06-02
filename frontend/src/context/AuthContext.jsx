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

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

const normalizeUser = (user) => {
  if (!user) return null
  return {
    ...user,
    role: normalizeRole(user.role),
  }
}

const storage = {
  getToken: () => localStorage.getItem('fuelo_token'),
  getStation: () => {
    const val = localStorage.getItem('fuelo_station')
    return val ? Number(val) || null : null
  },
  set: (token, stationId) => {
    localStorage.setItem('fuelo_token', String(token))
    localStorage.setItem('fuelo_station', String(stationId))
  },
  clear: () => {
    localStorage.removeItem('fuelo_token')
    localStorage.removeItem('fuelo_station')
    delete api.defaults.headers.common.Authorization
  },
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F7FA',
      gap: 16,
    }}>
      <div style={{
        width: 40,
        height: 40,
        background: '#F59E0B',
        borderRadius: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 20px rgba(245,158,11,0.3)',
      }}>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
          <ellipse cx="18" cy="36" rx="4" ry="6" fill="#F59E0B" opacity="0.6" />
        </svg>
      </div>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid #E5E7EB',
        borderTopColor: '#F59E0B',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [stationId, setStationId] = useState(() => storage.getStation())
  const [loading, setLoading] = useState(() => !!storage.getToken())

  useEffect(() => {
    const token = storage.getToken()
    if (!token) return

    let cancelled = false

    api.get('/auth/me')
      .then((res) => {
        if (cancelled) return
        setUser(normalizeUser(res.data.user))
        setStationId(storage.getStation())
      })
      .catch(() => {
        if (cancelled) return
        storage.clear()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      storage.set(data.token, data.station_id)
      setUser(normalizeUser(data.user))
      setStationId(Number(data.station_id))
      return normalizeUser(data.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', payload)
      storage.set(data.token, data.station_id)
      setUser(normalizeUser(data.user))
      setStationId(Number(data.station_id))
      return normalizeUser(data.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    storage.clear()
    setUser(null)
    setStationId(null)
  }, [])

  const changerStation = useCallback(async (newStationId) => {
    const { data } = await api.post('/station/changer', { station_id: newStationId })
    storage.set(data.token, data.station_id)
    setUser(normalizeUser(data.user))
    setStationId(Number(data.station_id))
    return Number(data.station_id)
  }, [])

  const role = user?.role ?? null

  const value = useMemo(() => ({
    user,
    stationId,
    loading,
    isAuthenticated: !!user,
    role,
    isOwner: role === 'owner',
    isManager: role === 'owner' || role === 'gerant',
    isPompiste: role === 'pompiste',
    isChauffeur: role === 'chauffeur',
    isLogisticien: role === 'logisticien',
    isSuperAdmin: role === 'superadmin',
    login,
    register,
    logout,
    changerStation,
  }), [user, stationId, loading, role, login, register, logout, changerStation])

  if (loading) return <LoadingScreen />

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}



// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être dans un AuthProvider')
  return ctx
}
