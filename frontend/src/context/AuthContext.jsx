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
import AppLoader from '../ui/AppLoader'

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

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignorer les erreurs réseau — on déconnecte quand même localement
    } finally {
      storage.clear()
      setUser(null)
      setStationId(null)
    }
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

  if (loading) return <AppLoader />

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
