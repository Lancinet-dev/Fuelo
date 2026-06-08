// ================================================
// FUELO — useAntiFraude
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useAntiFraude() {
  return useQuery({
    queryKey:  ['anti-fraude'],
    queryFn:   () => api.get('/anti-fraude').then(r => r.data),
    staleTime: 60_000,
  })
}

export function useMarquerResolu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type, id }) =>
      api.put(`/anti-fraude/${type}/${id}/resoudre`).then(r => r.data),
    onSuccess: () => {
      toast.success('Cas marqué comme résolu ✓')
      queryClient.invalidateQueries({ queryKey: ['anti-fraude'] })
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Erreur'),
  })
}
