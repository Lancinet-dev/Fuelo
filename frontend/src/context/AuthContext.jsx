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

    let settled = false

    const finish = (normalizedUser) => {
      if (settled) return
      settled = true
      clearTimeout(safety)
      if (!normalizedUser) storage.clear()
      setUser(normalizedUser)
      setStationId(normalizedUser ? storage.getStation() : null)
      setLoading(false)
    }

    // Filet de sécurité — backend lent à se réveiller (Render gratuit) ou
    // requête qui ne répond jamais : au bout de 3s on considère la session
    // comme invalide plutôt que de bloquer l'app sur l'écran de chargement
    const safety = setTimeout(() => finish(null), 3_000)

    api.get('/auth/me')
      .then((res) => finish(normalizeUser(res.data.user)))
      .catch(() => finish(null))

    return () => {
      settled = true
      clearTimeout(safety)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    storage.set(data.token, data.station_id)
    setUser(normalizeUser(data.user))
    setStationId(Number(data.station_id))
    return normalizeUser(data.user)
  }, [])

  // Connexion via un token déjà émis (callback OAuth Google) — recharge
  // l'utilisateur via /auth/me pour que isAuthenticated reflète l'état réel
  const loginWithToken = useCallback(async (token, stationId) => {
    setLoading(true)
    try {
      storage.set(token, stationId)
      const { data } = await api.get('/auth/me')
      const normalized = normalizeUser(data.user)
      setUser(normalized)
      setStationId(storage.getStation())
      return normalized
    } catch (err) {
      storage.clear()
      setUser(null)
      setStationId(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    storage.set(data.token, data.station_id)
    setUser(normalizeUser(data.user))
    setStationId(Number(data.station_id))
    return normalizeUser(data.user)
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
    loginWithToken,
    register,
    logout,
    changerStation,
  }), [user, stationId, loading, role, login, loginWithToken, register, logout, changerStation])

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
