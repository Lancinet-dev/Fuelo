// ================================================
// FUELO — useTrajet : interface chauffeur
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useTrajet() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:        ['trajet-actif'],
    queryFn:         () => api.get('/trajets/actif').then(r => r.data),
    staleTime:       30_000,
    refetchInterval: 60_000,
  })

  const { mutateAsync: demarrer, isPending: demarrerLoading } = useMutation({
    mutationFn: ({ photoFile, ...fields }) => {
      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)))
      if (photoFile) fd.append('photo', photoFile)
      return api.post('/trajets', fd).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Trajet démarré — GPS activé')
      queryClient.invalidateQueries({ queryKey: ['trajet-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })

  const { mutateAsync: envoyerPosition } = useMutation({
    mutationFn: ({ id, ...pos }) => api.post(`/trajets/${id}/position`, pos).then(r => r.data),
    onError: () => {
      toast.error('Position GPS non envoyée — vérifiez votre connexion', {
        id: 'gps-sync-error',
        duration: 5000,
      })
    },
  })

  const { mutateAsync: arriver, isPending: arriverLoading } = useMutation({
    mutationFn: ({ id, photoFile, ...fields }) => {
      const fd = new FormData()
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)))
      if (photoFile) fd.append('photo', photoFile)
      return api.post(`/trajets/${id}/arriver`, fd).then(r => r.data)
    },
    onSuccess: () => {
      toast.success('Arrivée déclarée — Montrez votre code au logisticien')
      queryClient.invalidateQueries({ queryKey: ['trajet-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })

  return {
    trajetActif:    data?.trajet ?? null,
    loading:        isLoading,
    demarrer,       demarrerLoading,
    envoyerPosition,
    arriver,        arriverLoading,
  }
}
