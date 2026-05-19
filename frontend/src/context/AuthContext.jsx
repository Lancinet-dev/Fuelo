// ================================================
// FUELO V2 — AuthContext
// Fichier : frontend/src/context/AuthContext.jsx
// Auth global — plus jamais de localStorage direct
// ================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

// ── Création du contexte ─────────────────────────────
const AuthContext = createContext(null)

// ── Provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,           setUser]           = useState(null)
  const [token,          setToken]          = useState(() => localStorage.getItem('fuelo_token'))
  const [stationId,      setStationId]      = useState(() => localStorage.getItem('fuelo_station'))
  const [loading,        setLoading]        = useState(true)
  const [isAuthenticated,setIsAuthenticated] = useState(false)

  // ── Charger le profil au démarrage ────────────────
  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('fuelo_token')
      if (!savedToken) {
        setLoading(false)
        return
      }
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
        setIsAuthenticated(true)
      } catch {
        // Token invalide ou expiré
        clearAuth()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ── Login ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user, station_id } = res.data

    localStorage.setItem('fuelo_token', token)
    localStorage.setItem('fuelo_station', station_id)

    setToken(token)
    setUser(user)
    setStationId(station_id)
    setIsAuthenticated(true)

    return user
  }, [])

  // ── Register ──────────────────────────────────────
  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data)
    const { token, user, station_id } = res.data

    localStorage.setItem('fuelo_token', token)
    localStorage.setItem('fuelo_station', station_id)

    setToken(token)
    setUser(user)
    setStationId(station_id)
    setIsAuthenticated(true)

    return user
  }, [])

  // ── Logout ────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth()
  }, [])

  // ── Changer de station (propriétaire) ─────────────
  const changerStation = useCallback(async (newStationId) => {
    const res = await api.post('/station/changer', { station_id: newStationId })
    const { token, station_id } = res.data

    localStorage.setItem('fuelo_token', token)
    localStorage.setItem('fuelo_station', station_id)

    setToken(token)
    setStationId(station_id)

    return station_id
  }, [])

  // ── Clear auth ────────────────────────────────────
  const clearAuth = () => {
    localStorage.removeItem('fuelo_token')
    localStorage.removeItem('fuelo_station')
    setToken(null)
    setUser(null)
    setStationId(null)
    setIsAuthenticated(false)
  }

  // ── Helpers rôle ──────────────────────────────────
  const isOwner      = user?.role === 'owner'
  const isManager    = user?.role === 'manager' || user?.role === 'owner'
  const isPompiste   = user?.role === 'pompiste'
  const isSuperAdmin = user?.role === 'superadmin'

  const value = {
    user,
    token,
    stationId,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    changerStation,
    isOwner,
    isManager,
    isPompiste,
    isSuperAdmin,
    role: user?.role || null,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook useAuth ──────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

export default AuthContext