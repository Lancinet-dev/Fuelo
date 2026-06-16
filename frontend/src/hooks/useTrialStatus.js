// ================================================
// FUELO — useTrialStatus : statut de l'essai gratuit
// ================================================

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export function useTrialStatus() {
  const { isAuthenticated } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey:        ['trial-status'],
    queryFn:         () => api.get('/abonnements/statut-trial').then(r => r.data),
    enabled:         !!isAuthenticated,
    staleTime:       5 * 60_000,
    refetchInterval: 5 * 60_000,
  })

  const statut        = data?.statut ?? null
  const joursRestants = data?.joursRestants ?? null

  return {
    statut,
    joursRestants,
    plan:      data?.plan ?? null,
    isTrial:   statut === 'trial',
    isExpired: statut === 'expired',
    loading:   isLoading,
  }
}
