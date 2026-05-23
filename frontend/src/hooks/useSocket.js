// ================================================
// FUELO — Hook Socket.IO
// Fichier : frontend/src/hooks/useSocket.js
// ================================================

import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

let socketInstance = null

export function useSocket() {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) return

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })
    }

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      if (user?.station_id) {
        socketInstance.emit('join_station', user.station_id)
      }
    })

    return () => {}
  }, [isAuthenticated, user])

  const emit = (event, data) => {
    socketInstance?.emit(event, data)
  }

  // Retourner socketInstance directement au lieu de socketRef.current
  return { socket: socketInstance, emit }
}