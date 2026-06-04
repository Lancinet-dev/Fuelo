// ================================================
// FUELO — usePerformances
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function usePerformances({ mois, annee } = {}) {
  const now = new Date()
  const m   = mois  ?? now.getMonth() + 1
  const a   = annee ?? now.getFullYear()

  return useQuery({
    queryKey:  ['performances', m, a],
    queryFn:   () => api.get('/performances', { params: { mois: m, annee: a } }).then(r => r.data),
    staleTime: 60_000,
  })
}

export function usePerformancesEmploye(userId) {
  return useQuery({
    queryKey: ['performances-employe', userId],
    queryFn:  () => api.get(`/performances/${userId}`).then(r => r.data),
    enabled:  !!userId,
    staleTime: 60_000,
  })
}

export function useAnneesDisponibles() {
  return useQuery({
    queryKey:  ['performances-annees'],
    queryFn:   () => api.get('/performances/annees').then(r => r.data),
    staleTime: 300_000,
  })
}

export function usePerformancesBadge() {
  return useQuery({
    queryKey:        ['performances-badge'],
    queryFn:         () => api.get('/performances/badge').then(r => r.data),
    staleTime:       120_000,
    refetchInterval: 300_000,
  })
}

export function useValiderPrime() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, mois, annee, action }) =>
      api.post(`/performances/${userId}/valider`, { mois, annee, action }).then(r => r.data),
    onSuccess: (_, { action }) => {
      toast.success(action === 'valider' ? 'Prime validée ✓' : 'Prime refusée')
      queryClient.invalidateQueries({ queryKey: ['performances'] })
      queryClient.invalidateQueries({ queryKey: ['performances-badge'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })
}
