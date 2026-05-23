// ================================================
// FUELO — Hook Notifications temps réel
// Fichier : frontend/src/hooks/useNotifications.js
// ================================================

import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socket = null

export function useNotifications() {
  const { user, stationId, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState([])
  const [connected, setConnected] = useState(false)

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
      setConnected(true)
      if (stationId) {
        socket.emit('join_station', stationId)
      }
    }

    const onDisconnect = () => setConnected(false)

    const onAlerteStock = (data) => {
      toast.error(`⚠️ Stock critique : ${data.message}`, {
        duration: 6000,
        icon: '🔔',
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #EF4444' }
      })
      setNotifications(prev => [{ ...data, id: Date.now(), lu: false }, ...prev.slice(0, 19)])
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
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

    socket.on('connect',       onConnect)
    socket.on('disconnect',    onDisconnect)
    socket.on('alerte_stock',  onAlerteStock)
    socket.on('nouvelle_vente', onNouvelleVente)
    socket.on('stock_update',  onStockUpdate)

    // Si déjà connecté, rejoindre la room immédiatement
    if (socket.connected && stationId) {
      socket.emit('join_station', stationId)
    }

    return () => {
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('alerte_stock',  onAlerteStock)
      socket.off('nouvelle_vente', onNouvelleVente)
      socket.off('stock_update',  onStockUpdate)
    }
  }, [isAuthenticated, user, stationId, queryClient])

  const marquerLu = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }, [])

  const nonLues = notifications.filter(n => !n.lu).length

  return { notifications, nonLues, connected, marquerLu }
}