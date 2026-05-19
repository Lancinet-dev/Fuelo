// ================================================
// FUELO V2 — useEmployes
// Fichier : frontend/src/hooks/useEmployes.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useEmployes() {
  const queryClient = useQueryClient()

  // ── Liste des employés ────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey:  ['employes'],
    queryFn:   () => api.get('/employes').then(r => r.data),
    staleTime: 30_000,
  })

  // ── Créer un employé ──────────────────────────────
  const { mutateAsync: creerEmploye, isPending: createLoading } = useMutation({
    mutationFn: (payload) => api.post('/employes', payload).then(r => r.data),
    onSuccess: (data) => {
      toast.success(`Employé ${data.employe.nom} créé avec succès`)
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? 'Erreur lors de la création')
    },
  })

  // ── Activer / Désactiver ──────────────────────────
  const { mutateAsync: toggleEmploye } = useMutation({
    mutationFn: (id) => api.put(`/employes/${id}/toggle`).then(r => r.data),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // ── Supprimer un employé ──────────────────────────
  const { mutateAsync: supprimerEmploye } = useMutation({
    mutationFn: (id) => api.delete(`/employes/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Employé supprimé')
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  return {
    employes:       data?.employes ?? [],
    loading:        isLoading,
    createLoading,
    error:          error?.message ?? null,
    creerEmploye,
    toggleEmploye,
    supprimerEmploye,
  }
}