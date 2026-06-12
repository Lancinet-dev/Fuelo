// ================================================
// FUELO — useActivite : journal d'activité
// ================================================

import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export function useActivite({ debut, fin, employe_id, type, limite = 80 } = {}) {
  const params = {}
  if (debut)       params.debut      = debut
  if (fin)         params.fin        = fin
  if (employe_id)  params.employe_id = employe_id
  if (type)        params.type       = type
  if (limite)      params.limite     = limite

  const { data, isLoading, refetch } = useQuery({
    queryKey:  ['activite', params],
    queryFn:   () => api.get('/activite', { params }).then(r => r.data),
    staleTime: 30_000,
  })

  return {
    activite: data?.activite ?? [],
    loading:  isLoading,
    refetch,
  }
}

export function useActiviteEmployes() {
  const { data, isLoading } = useQuery({
    queryKey:  ['activite-employes'],
    queryFn:   () => api.get('/activite/employes').then(r => r.data),
    staleTime: 5 * 60_000,
  })
  return {
    employes: data?.employes ?? [],
    loading:  isLoading,
  }
}
