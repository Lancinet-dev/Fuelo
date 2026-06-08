// ================================================
// FUELO V2 — Google Auth Success
// Fichier : frontend/src/features/auth/GoogleSuccess.jsx
// Page intermédiaire qui reçoit le token Google
// ================================================

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
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
  if (normalizedRole === 'superadmin') return '/admin'
  return '/dashboard'
}

export default function GoogleSuccess() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { loginWithToken } = useAuth()

  useEffect(() => {
    const token     = params.get('token')
    const stationId = params.get('station')
    const role      = params.get('role')
    const nom       = params.get('nom')
    const error     = params.get('error')

    if (error) {
      toast.error('Connexion Google échouée')
      navigate('/login', { replace: true })
      return
    }

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    // Recharger la session via le contexte (met à jour isAuthenticated/role
    // — sans ça, PrivateRoute renvoie vers /login car le contexte ignore
    // un token écrit directement dans localStorage)
    loginWithToken(token, stationId)
      .then((user) => {
        toast.success(`Bienvenue ${decodeURIComponent(nom)} ⛽`)
        navigate(getHomePathByRole(user?.role ?? role), { replace: true })
      })
      .catch(() => {
        toast.error('Connexion Google échouée')
        navigate('/login', { replace: true })
      })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <AppLoader />
}
