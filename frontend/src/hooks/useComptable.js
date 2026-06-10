import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const BASE = '/api/comptable'

// ── Dashboard ────────────────────────────────────────
export function useDashboardComptable(mois, annee) {
  return useQuery({
    queryKey: ['comptable', 'dashboard', mois, annee],
    queryFn: () => api.get(`${BASE}/dashboard`, { params: { mois, annee } }).then(r => r.data),
    staleTime: 60_000,
  })
}

// ── Achats ────────────────────────────────────────────
export function useAchats({ page = 1, statut, mois, annee } = {}) {
  return useQuery({
    queryKey: ['comptable', 'achats', page, statut, mois, annee],
    queryFn: () => api.get(`${BASE}/achats`, { params: { page, statut, mois, annee } }).then(r => r.data),
  })
}

export function useCreateAchat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`${BASE}/achats`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable'] }),
  })
}

export function useUpdateAchat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`${BASE}/achats/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable'] }),
  })
}

export function useDeleteAchat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/achats/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable'] }),
  })
}

// ── BL ────────────────────────────────────────────────
export function useBL({ page = 1, statut } = {}) {
  return useQuery({
    queryKey: ['comptable', 'bl', page, statut],
    queryFn: () => api.get(`${BASE}/bl`, { params: { page, statut } }).then(r => r.data),
  })
}

export function useCreateBL() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`${BASE}/bl`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable', 'bl'] }),
  })
}

export function useSiginerBL() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, qui }) => api.post(`${BASE}/bl/${id}/signer`, { qui }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable', 'bl'] }),
  })
}

// ── Dépenses ─────────────────────────────────────────
export function useDepenses({ page = 1, categorie, mois, annee } = {}) {
  return useQuery({
    queryKey: ['comptable', 'depenses', page, categorie, mois, annee],
    queryFn: () => api.get(`${BASE}/depenses`, { params: { page, categorie, mois, annee } }).then(r => r.data),
  })
}

export function useCreateDepense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`${BASE}/depenses`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable'] }),
  })
}

export function useDeleteDepense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`${BASE}/depenses/${id}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable', 'depenses'] }),
  })
}

// ── Coûts transport ───────────────────────────────────
export function useCoutsTransport({ mois, annee } = {}) {
  return useQuery({
    queryKey: ['comptable', 'transport', mois, annee],
    queryFn: () => api.get(`${BASE}/transport`, { params: { mois, annee } }).then(r => r.data),
  })
}

export function useCreateCoutTransport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`${BASE}/transport`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable'] }),
  })
}

// ── Fiches de paie ────────────────────────────────────
export function useFichesPaie({ mois, annee } = {}) {
  return useQuery({
    queryKey: ['comptable', 'paie', mois, annee],
    queryFn: () => api.get(`${BASE}/paie`, { params: { mois, annee } }).then(r => r.data),
  })
}

export function useCreateFichePaie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post(`${BASE}/paie`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable', 'paie'] }),
  })
}

export function usePayerFichePaie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`${BASE}/paie/${id}/payer`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comptable', 'paie'] }),
  })
}
