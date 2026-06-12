// ================================================
// FUELO — Hook Notifications (DB + temps réel)
// ================================================

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../services/api'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socket = null

export function useNotifications() {
  const { user, stationId, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  // ── Fetch notifications depuis l'API ──────────
  const { data, isLoading } = useQuery({
    queryKey:        ['notifications'],
    queryFn:         () => api.get('/notifications').then(r => r.data),
    staleTime:       30_000,
    refetchInterval: 60_000,
    enabled:         !!isAuthenticated,
  })

  const notifications = data?.notifications ?? []
  const nonLues       = data?.nbNonLues ?? 0

  // ── Marquer une notification lue ─────────────
  const { mutateAsync: marquerLu } = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/lu`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // ── Marquer tout lu ───────────────────────────
  const { mutateAsync: marquerToutLu } = useMutation({
    mutationFn: () => api.put('/notifications/tout-lu').then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // ── Socket.IO — temps réel ────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return

    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      })
    }

    const onConnect = () => {
      if (stationId) socket.emit('join_station', stationId)
    }

    const onAlerteStock = (data) => {
      toast.error(`⚠️ Stock critique : ${data.message}`, {
        duration: 6000,
        icon: '🔔',
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #EF4444' }
      })
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    const onNouvelleVente = (data) => {
      const montant = data.montant_gnf
        ? String(Math.round(data.montant_gnf)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        : '0'
      toast.success(`💰 Vente : ${data.litres}L ${data.type} — ${montant} GNF`, {
        duration: 4000,
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #2563EB' }
      })
      queryClient.invalidateQueries({ queryKey: ['ventes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    }

    const onStockUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }

    socket.on('connect',        onConnect)
    socket.on('alerte_stock',   onAlerteStock)
    socket.on('nouvelle_vente', onNouvelleVente)
    socket.on('stock_update',   onStockUpdate)

    if (socket.connected && stationId) socket.emit('join_station', stationId)

    return () => {
      socket.off('connect',        onConnect)
      socket.off('alerte_stock',   onAlerteStock)
      socket.off('nouvelle_vente', onNouvelleVente)
      socket.off('stock_update',   onStockUpdate)
    }
  }, [isAuthenticated, user, stationId, queryClient])

  return { notifications, nonLues, isLoading, marquerLu, marquerToutLu }
}
