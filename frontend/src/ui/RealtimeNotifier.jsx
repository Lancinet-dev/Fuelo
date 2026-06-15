// ================================================
// FUELO — Notifications temps réel globales (montées une seule fois)
// ================================================
// Centralise TOUS les toasts/sons temps réel (messages, notifications in-app,
// ventes, alertes stock) pour éviter les doublons. Monté dans le Router.

import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { useUnreadMessages } from '../hooks/useMessages'
import { playMessageBeep } from '../utils/messageSound'

const fmtN = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const TOAST_DARK = { background: '#1E293B', color: '#F1F5F9' }

export default function RealtimeNotifier() {
  const { isAuthenticated, user, role } = useAuth()
  const { socket } = useSocket()
  const location   = useLocation()
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const unread     = useUnreadMessages()

  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

  // Compteur de non-lus (messages) dans le titre de l'onglet
  const baseTitle = useRef(document.title)
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current
  }, [unread])

  useEffect(() => {
    if (!socket || !isAuthenticated) return
    const isManager = role === 'owner' || role === 'gerant' || role === 'superadmin'

    // ── Nouveau message ──
    const onMessage = ({ message }) => {
      if (!message || message.sender_id === user?.id) return
      playMessageBeep()
      if (pathRef.current.startsWith('/messages')) return
      const apercu = message.type !== 'texte' ? '📎 Pièce jointe' : (message.contenu || '').slice(0, 60)
      toast((t) => (
        <div onClick={() => { toast.dismiss(t.id); navigate('/messages') }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', maxWidth: 280 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message.sender_nom || 'Nouveau message'}</div>
            <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apercu}</div>
          </div>
        </div>
      ), { duration: 5000, id: `msg-${message.conversation_id}` })
    }

    // ── Notification in-app persistante (cloche) ──
    const onNotif = (notif) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      if (!notif) return
      const icon = notif.type === 'alerte' ? '⚠️' : notif.type === 'vente' ? '💰' : '🔔'
      toast((t) => (
        <div onClick={() => { toast.dismiss(t.id); if (notif.lien_url) navigate(notif.lien_url) }} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: notif.lien_url ? 'pointer' : 'default', maxWidth: 300 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{notif.titre}</div>
            {notif.corps && <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.corps}</div>}
          </div>
        </div>
      ), { duration: 6000 })
    }

    // ── Alertes / ventes (broadcast station) — managers uniquement ──
    const onAlerteStock = (data) => {
      if (!isManager) return
      toast.error(`⚠️ Stock critique : ${data.message}`, { duration: 6000, icon: '🔔', style: { ...TOAST_DARK, border: '1px solid #EF4444' } })
      qc.invalidateQueries({ queryKey: ['alertes'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }
    const onNouvelleVente = (data) => {
      qc.invalidateQueries({ queryKey: ['ventes'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['stock'] })
      if (!isManager) return
      toast.success(`💰 Vente : ${data.litres}L ${data.type} — ${fmtN(data.montant_gnf)} GNF`, { duration: 4000, style: { ...TOAST_DARK, border: '1px solid #2563EB' } })
    }
    const onStockUpdate = () => {
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    }

    socket.on('message:nouveau',  onMessage)
    socket.on('notification:new', onNotif)
    socket.on('alerte_stock',     onAlerteStock)
    socket.on('nouvelle_vente',   onNouvelleVente)
    socket.on('stock_update',     onStockUpdate)
    return () => {
      socket.off('message:nouveau',  onMessage)
      socket.off('notification:new', onNotif)
      socket.off('alerte_stock',     onAlerteStock)
      socket.off('nouvelle_vente',   onNouvelleVente)
      socket.off('stock_update',     onStockUpdate)
    }
  }, [socket, isAuthenticated, user, role, navigate, qc])

  return null
}
