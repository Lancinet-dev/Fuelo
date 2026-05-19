// ================================================
// FUELO V2 — useAlertes
// Fichier : frontend/src/hooks/useAlertes.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useAlertes() {
  const queryClient = useQueryClient()

  // ── Lire les alertes ──────────────────────────────
  const { data, isLoading, error, refetch } = useQuery({
    queryKey:        ['alertes'],
    queryFn:         () => api.get('/alertes').then(r => r.data),
    staleTime:       15_000,
    refetchInterval: 30_000,
  })

  // ── Marquer une alerte lue ────────────────────────
  const { mutateAsync: marquerLue } = useMutation({
    mutationFn: (id) => api.put(`/alertes/${id}/lire`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // ── Marquer toutes lues ───────────────────────────
  const { mutateAsync: marquerToutesLues } = useMutation({
    mutationFn: () => api.put('/alertes/toutes/lire').then(r => r.data),
    onSuccess: () => {
      toast.success('Toutes les alertes marquées comme lues')
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const alertes  = data?.alertes  ?? []
  const nonLues  = data?.non_lues ?? 0

  return {
    alertes,
    nonLues,
    loading: isLoading,
    error:   error?.message ?? null,
    marquerLue,
    marquerToutesLues,
    refetch,
  }
}