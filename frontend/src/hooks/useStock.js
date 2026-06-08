// ================================================
// FUELO V2 — useStock
// Fichier : frontend/src/hooks/useStock.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useStock() {
  const queryClient = useQueryClient()

  // ── Lire le stock ─────────────────────────────────
  const { data, isLoading, error, refetch } = useQuery({
    queryKey:  ['stock'],
    queryFn:   () => api.get('/stock/current').then(r => r.data),
    staleTime: 15_000,
  })

  const stocks = data?.stock ?? {}

  const essence = parseFloat(stocks.essence?.quantite ?? 0)
  const gasoil  = parseFloat(stocks.gasoil?.quantite  ?? 0)

  const essenceMaj = stocks.essence?.updated_at ?? null
  const gasoilMaj  = stocks.gasoil?.updated_at  ?? null

  // ── Ajouter une livraison ─────────────────────────
  const { mutateAsync: ajouterLivraison, isPending: livraisonLoading } = useMutation({
    mutationFn: (payload) => api.post('/stock/livraison', payload).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Livraison ajoutée — nouveau stock : ${data.nouveau_stock}L`)
      queryClient.invalidateQueries({ queryKey: ['stock'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la livraison')
    },
  })

  return {
    essence,
    gasoil,
    essenceMaj,
    gasoilMaj,
    loading:          isLoading,
    livraisonLoading,
    error:            error?.message ?? null,
    ajouterLivraison,
    refetch,
  }
}