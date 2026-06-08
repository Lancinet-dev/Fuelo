// ================================================
// FUELO V2 — useVentes
// Fichier : frontend/src/hooks/useVentes.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useVentes({ page = 1, limit = 20, type = '', search = '' } = {}) {
  const queryClient = useQueryClient()

  // ── Historique paginé ─────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey:  ['ventes', page, limit, type, search],
    queryFn:   () => api.get('/ventes', { params: { page, limit, type: type || undefined, search: search || undefined } }).then(r => r.data),
    staleTime: 15_000,
    keepPreviousData: true,
  })

  // ── Ventes récentes (dashboard) ───────────────────
  const { data: recentesData } = useQuery({
    queryKey:  ['ventes-recentes'],
    queryFn:   () => api.get('/ventes/recentes').then(r => r.data),
    staleTime: 15_000,
  })

  // ── Ventes du jour ────────────────────────────────
  const { data: todayData } = useQuery({
    queryKey:  ['ventes-today'],
    queryFn:   () => api.get('/ventes/aujourdhui').then(r => r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  // ── Enregistrer une vente ─────────────────────────
  const { mutateAsync: enregistrerVente, isPending: venteLoading } = useMutation({
    mutationFn: (payload) => api.post('/ventes', payload).then(r => r.data),
    onSuccess: (data) => {
      const msg = data.alerte
        ? `Vente enregistrée — ⚠️ Stock faible : ${data.stock_restant}L`
        : `Vente enregistrée — Stock restant : ${data.stock_restant}L`
      data.alerte ? toast.error(msg) : toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['ventes'] })
      queryClient.invalidateQueries({ queryKey: ['ventes-recentes'] })
      queryClient.invalidateQueries({ queryKey: ['ventes-today'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la vente')
    },
  })

  return {
    ventes:          data?.ventes        ?? [],
    meta:            data?.meta          ?? {},
    recentes:        recentesData?.ventes ?? [],
    aujourdhui:      todayData?.aujourdhui ?? { nb: 0, total_litres: 0, total_gnf: 0 },
    loading:         isLoading,
    venteLoading,
    error:           error?.message ?? null,
    enregistrerVente,
  }
}