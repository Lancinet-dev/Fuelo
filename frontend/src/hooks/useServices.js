// ================================================
// FUELO — useServices : vue owner/gérant
// ================================================

import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useServices({ statut } = {}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey:        ['services', statut ?? 'all'],
    queryFn:         () => api.get('/services', { params: statut ? { statut } : {} }).then(r => r.data),
    staleTime:       30_000,
    refetchInterval: 60_000,
  })

  const services = data?.services ?? []

  return {
    services,
    loading:  isLoading,
    refetch,
    stats: {
      total:   services.length,
      alertes: services.filter(s => s.statut === 'alerte').length,
      enCours: services.filter(s => s.statut === 'en_cours').length,
    },
  }
}
