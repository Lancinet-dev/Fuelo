// ================================================
// FUELO V2 — useParametres
// Fichier : frontend/src/hooks/useParametres.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useParametres() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:  ['parametres'],
    queryFn:   () => api.get('/station').then(r => r.data),
    staleTime: 60_000,
  })

  const { mutateAsync: sauvegarder, isPending: saveLoading } = useMutation({
    mutationFn: (payload) => api.put('/station', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Paramètres sauvegardés')
      queryClient.invalidateQueries({ queryKey: ['parametres'] })
      queryClient.invalidateQueries({ queryKey: ['stations'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la sauvegarde')
    },
  })

  return {
    parametres:  data?.station ?? null,
    loading:     isLoading,
    saveLoading,
    sauvegarder,
  }
}