// ================================================
// FUELO — Hook Notifications (données pures)
// ================================================
// Le temps réel (toasts + invalidation) est centralisé dans ui/RealtimeNotifier
// pour éviter les doublons quand plusieurs cloches sont montées.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export function useNotifications() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:        ['notifications'],
    queryFn:         () => api.get('/notifications').then(r => r.data),
    staleTime:       30_000,
    refetchInterval: 60_000,
    enabled:         !!isAuthenticated,
  })

  const notifications = data?.notifications ?? []
  const nonLues       = data?.nbNonLues ?? 0

  const { mutateAsync: marquerLu } = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/lu`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutateAsync: marquerToutLu } = useMutation({
    mutationFn: () => api.put('/notifications/tout-lu').then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return { notifications, nonLues, isLoading, marquerLu, marquerToutLu }
}
