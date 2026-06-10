import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useAdminStats() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then(r => r.data),
    staleTime: 60_000,
  })
  return {
    stats:   data ?? {
      nb_clients: 0, nb_stations: 0, revenue_actif: 0,
      abonnements: {}, nouveaux_ce_mois: 0, sans_abonnement: 0,
      mrr_12mois: [], nouveaux_12mois: [], repartition_plans: [], expirables: [],
    },
    loading: isLoading,
    refetch,
  }
}

export function useAdminClients() {
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-clients'],
    queryFn:  () => api.get('/admin/clients').then(r => r.data),
    staleTime: 30_000,
  })

  const { mutateAsync: valider } = useMutation({
    mutationFn: (id) => api.put(`/admin/abonnements/${id}/valider`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const { mutateAsync: suspendre } = useMutation({
    mutationFn: (id) => api.put(`/admin/abonnements/${id}/suspendre`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  return { clients: data?.clients ?? [], loading: isLoading, refetch, valider, suspendre }
}

export function exportClientsCSV(clients) {
  const headers = ['Nom','Email','Plan','Statut','Stations','Montant/mois','Inscription','Expiration']
  const rows = clients.map(c => [
    c.nom ?? '', c.email ?? '', c.sub_plan ?? '', c.sub_statut ?? '',
    c.nb_stations ?? 0, c.sub_montant ?? 0,
    c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
    c.expires_at  ? new Date(c.expires_at).toLocaleDateString('fr-FR')  : '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = 'clients_fuelo.csv'
  a.click(); URL.revokeObjectURL(url)
}
