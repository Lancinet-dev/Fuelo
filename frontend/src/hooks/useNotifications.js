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
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [notifications, setNotifications] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Connexion socket
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      })
    }

    socket.on('connect', () => {
      setConnected(true)
      // Rejoindre la room station
      const stationId = user.station_id || localStorage.getItem('station_id')
      if (stationId) {
        socket.emit('join_station', stationId)
      }
    })

    socket.on('disconnect', () => setConnected(false))

    // ── Nouvelle alerte stock critique ────────────────
    socket.on('alerte_stock', (data) => {
      toast.error(`⚠️ Stock critique : ${data.message}`, {
        duration: 6000,
        icon: '🔔',
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #EF4444' }
      })
      setNotifications(prev => [{ ...data, id: Date.now(), lu: false }, ...prev.slice(0, 19)])
      queryClient.invalidateQueries({ queryKey: ['alertes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    // ── Nouvelle vente enregistrée ────────────────────
    socket.on('nouvelle_vente', (data) => {
      toast.success(`💰 Vente : ${data.litres}L ${data.type} — ${data.montant_gnf?.toLocaleString('fr-FR')} GNF`, {
        duration: 4000,
        style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #2563EB' }
      })
      queryClient.invalidateQueries({ queryKey: ['ventes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
    })

    // ── Stock mis à jour ──────────────────────────────
   socket.on('stock_update', () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    return () => {
      socket.off('alerte_stock')
      socket.off('nouvelle_vente')
      socket.off('stock_update')
      socket.off('connect')
      socket.off('disconnect')
    }
  }, [isAuthenticated, user, queryClient])

  const marquerLu = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }, [])

  const nonLues = notifications.filter(n => !n.lu).length

  return { notifications, nonLues, connected, marquerLu }
}