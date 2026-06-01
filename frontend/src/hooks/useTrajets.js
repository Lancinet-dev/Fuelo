// ================================================
// FUELO — useTrajets : vue owner/gérant
// ================================================

import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useTrajets({ statut } = {}) {
  const { data, isLoading } = useQuery({
    queryKey:        ['trajets', statut ?? 'all'],
    queryFn:         () => api.get('/trajets', { params: statut ? { statut } : {} }).then(r => r.data),
    staleTime:       20_000,
    refetchInterval: 30_000,
  })

  const trajets = data?.trajets ?? []
  return {
    trajets,
    loading: isLoading,
    stats: {
      total:   trajets.length,
      enCours: trajets.filter(t => t.statut === 'en_cours').length,
      alertes: trajets.filter(t => t.statut === 'alerte').length,
    },
  }
}

export function useGpsPoints(trajetId) {
  return useQuery({
    queryKey:        ['gps-points', trajetId],
    queryFn:         () => api.get(`/trajets/${trajetId}/points`).then(r => r.data),
    enabled:         !!trajetId,
    staleTime:       10_000,
    refetchInterval: 15_000,
  })
}

export function useCiternes() {
  return useQuery({
    queryKey: ['citernes'],
    queryFn:  () => api.get('/citernes').then(r => r.data),
    staleTime: 60_000,
  })
}
