// ================================================
// FUELO V2 — useEmployes
// Fichier : frontend/src/hooks/useEmployes.js
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'

const normalizeRole = (value = '') => {
  const role = String(value).trim().toLowerCase()
  return role === 'manager' ? 'gerant' : role
}

const normalizeEmploye = (employe = {}) => ({
  ...employe,
  role: normalizeRole(employe.role),
  nb_ventes_jour: Number(employe.nb_ventes_jour ?? 0),
  total_ventes_jour: Number(employe.total_ventes_jour ?? 0),
})

export function useEmployes() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['employes'],
    queryFn: async () => {
      const response = await api.get('/employes')
      const employes = Array.isArray(response.data?.employes) ? response.data.employes.map(normalizeEmploye) : []
      return { employes }
    },
    staleTime: 30_000,
  })

  const { mutateAsync: creerEmploye, isPending: createLoading } = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/employes', {
        ...payload,
        nom: payload.nom?.trim(),
        email: payload.email?.trim().toLowerCase(),
        role: normalizeRole(payload.role || 'pompiste'),
      })
      return response.data
    },
    onSuccess: (data) => {
      toast.success(`Employé ${data.employe.nom} créé avec succès`)
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? 'Erreur lors de la création')
    },
  })

  const { mutateAsync: toggleEmploye } = useMutation({
    mutationFn: async (id) => {
      const response = await api.put(`/employes/${id}/toggle`)
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? 'Erreur lors de la mise à jour')
    },
  })

  const { mutateAsync: supprimerEmploye } = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/employes/${id}`)
      return response.data
    },
    onSuccess: () => {
      toast.success('Employé supprimé')
      queryClient.invalidateQueries({ queryKey: ['employes'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error ?? err.response?.data?.message ?? 'Erreur lors de la suppression')
    },
  })

  return {
    employes: data?.employes ?? [],
    loading: isLoading,
    createLoading,
    error: error?.message ?? null,
    creerEmploye,
    toggleEmploye,
    supprimerEmploye,
  }
}