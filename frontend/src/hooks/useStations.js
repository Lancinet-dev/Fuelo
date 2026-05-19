// ================================================
// FUELO V2 — useStations
// Fichier : frontend/src/hooks/useStations.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export function useStations() {
  const queryClient  = useQueryClient()
  const { changerStation } = useAuth()

  // ── Mes stations ──────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey:  ['stations'],
    queryFn:   () => api.get('/station/mes-stations').then(r => r.data),
    staleTime: 30_000,
  })

  // ── Vue consolidée ────────────────────────────────
  const { data: consolideData } = useQuery({
    queryKey:        ['consolide'],
    queryFn:         () => api.get('/station/consolide').then(r => r.data),
    staleTime:       30_000,
    refetchInterval: 60_000,
  })

  // ── Créer une station ─────────────────────────────
  const { mutateAsync: creerStation, isPending: createLoading } = useMutation({
    mutationFn: (payload) => api.post('/station/nouvelle', payload).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Station "${data.station.nom}" créée`)
      queryClient.invalidateQueries({ queryKey: ['stations'] })
      queryClient.invalidateQueries({ queryKey: ['consolide'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la création')
    },
  })

  // ── Changer de station active ─────────────────────
  const { mutateAsync: switchStation, isPending: switchLoading } = useMutation({
    mutationFn: (stationId) => changerStation(stationId),
    onSuccess: () => {
      toast.success('Station changée')
      queryClient.invalidateQueries()
    },
    onError: () => toast.error('Erreur lors du changement'),
  })

  return {
    stations:     data?.stations         ?? [],
    consolide:    consolideData?.consolide ?? {},
    loading:      isLoading,
    createLoading,
    switchLoading,
    error:        error?.message ?? null,
    creerStation,
    switchStation,
  }
}