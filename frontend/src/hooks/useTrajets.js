// ================================================
// FUELO — useTrajets : vue owner/logisticien + flotte GPS
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useTrajets({ statut } = {}) {
  const { data, isLoading } = useQuery({
    queryKey:        ['trajets', statut ?? 'all'],
    queryFn:         () => api.get('/trajets', { params: statut ? { statut } : {} }).then(r => r.data),
    staleTime:       20_000,
    refetchInterval: 30_000,
  })
  const trajets = data?.trajets ?? []
  return {
    trajets,
    loading: isLoading,
    stats: {
      total:   trajets.length,
      enCours: trajets.filter(t => t.statut === 'en_cours').length,
      alertes: trajets.filter(t => t.statut === 'alerte').length,
    },
  }
}

export function useGpsPoints(trajetId) {
  return useQuery({
    queryKey:        ['gps-points', trajetId],
    queryFn:         () => api.get(`/trajets/${trajetId}/points`).then(r => r.data),
    enabled:         !!trajetId,
    staleTime:       10_000,
    refetchInterval: 15_000,
  })
}

export function useCiternes() {
  return useQuery({
    queryKey: ['citernes'],
    queryFn:  () => api.get('/citernes').then(r => r.data),
    staleTime: 60_000,
  })
}

// ── Flotte temps réel ────────────────────────────
export function useFlotte() {
  return useQuery({
    queryKey:        ['flotte'],
    queryFn:         () => api.get('/trajets/flotte').then(r => r.data.flotte ?? []),
    staleTime:       5_000,
    refetchInterval: 10_000,
  })
}

export function useFlotteStats() {
  return useQuery({
    queryKey:        ['flotte-stats'],
    queryFn:         () => api.get('/trajets/flotte/stats').then(r => r.data),
    staleTime:       15_000,
    refetchInterval: 30_000,
  })
}

// ── Géofencing ───────────────────────────────────
export function useGeofencing() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['geofencing'],
    queryFn:  () => api.get('/geofencing').then(r => r.data.zones ?? []),
    staleTime: 60_000,
  })
  const creer = useMutation({
    mutationFn: (zone) => api.post('/geofencing', zone).then(r => r.data.zone),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['geofencing'] }),
  })
  const modifier = useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/geofencing/${id}`, data).then(r => r.data.zone),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['geofencing'] }),
  })
  const supprimer = useMutation({
    mutationFn: (id) => api.delete(`/geofencing/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['geofencing'] }),
  })
  return { zones: data ?? [], loading: isLoading, creer, modifier, supprimer }
}
