// ================================================
// FUELO — useAdminStats + useAdminClients
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useAdminStats() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then(r => r.data),
    staleTime: 60_000,
  })

  return {
    stats:   data ?? { nb_clients: 0, nb_stations: 0, revenue_actif: 0, abonnements: {} },
    loading: isLoading,
    refetch,
  }
}

export function useAdminClients() {
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-clients'],
    queryFn:  () => api.get('/admin/clients').then(r => r.data),
    staleTime: 30_000,
  })

  const { mutateAsync: valider } = useMutation({
    mutationFn: (id) => api.put(`/admin/abonnements/${id}/valider`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const { mutateAsync: suspendre } = useMutation({
    mutationFn: (id) => api.put(`/admin/abonnements/${id}/suspendre`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  return {
    clients:  data?.clients ?? [],
    loading:  isLoading,
    refetch,
    valider,
    suspendre,
  }
}
