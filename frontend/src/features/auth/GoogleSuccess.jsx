// ================================================
// FUELO V2 — Google Auth Success
// Fichier : frontend/src/features/auth/GoogleSuccess.jsx
// Page intermédiaire qui reçoit le token Google
// ================================================

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api         from '../../services/api'
import toast       from 'react-hot-toast'
import AppLoader   from '../../ui/AppLoader'

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

  return <AppLoader />
}
