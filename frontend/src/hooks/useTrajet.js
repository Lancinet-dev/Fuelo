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
    mutationFn: (payload) => api.post('/trajets', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Trajet démarré — GPS activé')
      queryClient.invalidateQueries({ queryKey: ['trajet-actif'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })

  const { mutateAsync: envoyerPosition } = useMutation({
    mutationFn: ({ id, ...pos }) => api.post(`/trajets/${id}/position`, pos).then(r => r.data),
    onError: () => {},  // silencieux — ne pas spammer l'UI si le réseau flanche
  })

  const { mutateAsync: arriver, isPending: arriverLoading } = useMutation({
    mutationFn: ({ id, qty_arrivee }) => api.post(`/trajets/${id}/arriver`, { qty_arrivee }).then(r => r.data),
    onSuccess: (data) => {
      if (data.alerte_fraude) {
        toast.error('Arrivée enregistrée — Alerte fraude générée !', { duration: 6000 })
      } else {
        toast.success('Arrivée enregistrée avec succès !')
      }
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
