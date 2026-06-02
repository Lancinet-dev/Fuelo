// ================================================
// FUELO V2 — Google Auth Success
// Fichier : frontend/src/features/auth/GoogleSuccess.jsx
// Page intermédiaire qui reçoit le token Google
// ================================================

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api         from '../../services/api'
import toast       from 'react-hot-toast'
import theme       from '../../config/theme'

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

const getHomePathByRole = (role) => {
  const normalizedRole = normalizeRole(role)
  if (normalizedRole === 'pompiste') return '/pompiste'
  if (normalizedRole === 'chauffeur') return '/chauffeur'
  if (normalizedRole === 'logisticien') return '/logistique'
  return '/dashboard'
}

export default function GoogleSuccess() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()

  useEffect(() => {
    const token     = params.get('token')
    const stationId = params.get('station')
    const role      = params.get('role')
    const nom       = params.get('nom')
    const error     = params.get('error')

    if (error) {
      toast.error('Connexion Google échouée')
      navigate('/login')
      return
    }

    if (!token) {
      navigate('/login')
      return
    }

    // Stocker le token
    localStorage.setItem('fuelo_token', token)
    localStorage.setItem('fuelo_station', String(stationId))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    toast.success(`Bienvenue ${decodeURIComponent(nom)} ⛽`)

    // Rediriger selon rôle
    navigate(getHomePathByRole(role))

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font.family }}>
      <div style={{ textAlign: 'center', color: '#F1F5F9' }}>
        <div style={{ width: 48, height: 48, background: theme.colors.primary, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: theme.shadow.primary }}>
          <svg width="24" height="24" viewBox="0 0 48 48">
            <path d="M24 4C24 4 10 20 10 30C10 39.5 16.5 45 24 45C31.5 45 38 39.5 38 30C38 20 24 4 24 4Z" fill="#0F172A" />
          </svg>
        </div>
        <div style={{ width: 32, height: 32, border: '3px solid #1E2D42', borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 14, color: '#475569' }}>Connexion en cours...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
