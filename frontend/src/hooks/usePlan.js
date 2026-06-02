// ================================================
// FUELO — usePlan : plan d'abonnement de l'owner
// ================================================

import { useQuery } from '@tanstack/react-query'
import { useAuth }  from '../context/AuthContext'
import api          from '../services/api'

export const PLAN_COLORS = {
  starter:    { bg: '#374151', text: '#9CA3AF', border: '#4B5563', label: 'Starter',    emoji: '🔘' },
  pro:        { bg: '#1E3A8A', text: '#93C5FD', border: '#2563EB', label: 'Pro',         emoji: '💎' },
  enterprise: { bg: '#78350F', text: '#FCD34D', border: '#F59E0B', label: 'Enterprise',  emoji: '👑' },
}

export function usePlan() {
  const { user } = useAuth()
  const isOwner  = user?.role === 'owner'

  const { data, isLoading } = useQuery({
    queryKey:  ['abonnement'],
    queryFn:   () => api.get('/abonnements').then(r => r.data),
    enabled:   isOwner,
    staleTime: 5 * 60_000,
  })

  const plan    = data?.plan ?? 'starter'
  const planDef = data?.planDef ?? { label: 'Starter', max_stations: 1, max_employes: 3, features: [] }
  const statut  = data?.abonnement?.statut ?? null

  return {
    plan,
    planDef,
    statut,
    colors:  PLAN_COLORS[plan] ?? PLAN_COLORS.starter,
    loading: isLoading,
    isOwner,
  }
}
