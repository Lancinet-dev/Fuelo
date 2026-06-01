// ================================================
// FUELO — useService : anti-fraude pompistes
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useService() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:       ['service-actif'],
    queryFn:        () => api.get('/services/actif').then(r => r.data),
    staleTime:      30_000,
    refetchInterval: 60_000,
  })

  const { mutateAsync: demarrer, isPending: demarrerLoading } = useMutation({
    mutationFn: (formData) =>
      api.post('/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(r => r.data),
    onSuccess: () => {
      toast.success('Service démarré')
      queryClient.invalidateQueries({ queryKey: ['service-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur au démarrage'),
  })

  const { mutateAsync: terminer, isPending: terminerLoading } = useMutation({
    mutationFn: ({ id, formData }) =>
      api.post(`/services/${id}/terminer`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(r => r.data),
    onSuccess: (data) => {
      if (data.alerte_fraude) {
        toast.error('Service terminé — Alerte fraude générée !', { duration: 6000 })
      } else {
        toast.success('Service terminé avec succès')
      }
      queryClient.invalidateQueries({ queryKey: ['service-actif'] })
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur à la clôture'),
  })

  return {
    serviceActif:    data?.service ?? null,
    loading:         isLoading,
    demarrer,
    demarrerLoading,
    terminer,
    terminerLoading,
  }
}
