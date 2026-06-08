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
      // Content-Type à `undefined` : laisse le navigateur poser
      // `multipart/form-data; boundary=...` lui-même — un override manuel
      // (ou l'`application/json` par défaut de l'instance axios) casse le
      // parsing multer côté backend (boundary manquant / FormData sérialisée en JSON)
      api.post('/services', formData, { headers: { 'Content-Type': undefined } })
        .then(r => r.data),
    onSuccess: () => {
      toast.success('Service démarré')
      queryClient.invalidateQueries({ queryKey: ['service-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur au démarrage'),
  })

  const { mutateAsync: terminer, isPending: terminerLoading } = useMutation({
    mutationFn: ({ id, formData }) =>
      api.post(`/services/${id}/terminer`, formData, { headers: { 'Content-Type': undefined } })
        .then(r => r.data),
    onSuccess: () => {
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
