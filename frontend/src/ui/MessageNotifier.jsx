// ================================================
// FUELO — Notifications globales de messagerie
// ================================================
// Monté dans le Router (toutes pages) : joue un son discret + affiche un toast
// cliquable quand un message arrive alors qu'on n'est PAS sur la page /messages.

import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { useUnreadMessages } from '../hooks/useMessages'
import { playMessageBeep } from '../utils/messageSound'

export default function MessageNotifier() {
  const { isAuthenticated, user } = useAuth()
  const { socket } = useSocket()
  const location   = useLocation()
  const navigate   = useNavigate()
  const unread     = useUnreadMessages()

  // Compteur de non-lus dans le titre de l'onglet (style WhatsApp Web)
  const baseTitle = useRef(document.title)
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current
  }, [unread])

  // Chemin courant lu via ref (évite de re-souscrire le socket à chaque navigation)
  const pathRef = useRef(location.pathname)
  pathRef.current = location.pathname

  useEffect(() => {
    if (!socket || !isAuthenticated) return

    const onNew = ({ message }) => {
      if (!message || message.sender_id === user?.id) return // mon propre message

      playMessageBeep()

      // Pas de toast si on est déjà dans la messagerie
      if (pathRef.current.startsWith('/messages')) return

      const apercu = message.type !== 'texte'
        ? '📎 Pièce jointe'
        : (message.contenu || '').slice(0, 60)

      toast((t) => (
        <div
          onClick={() => { toast.dismiss(t.id); navigate('/messages') }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', maxWidth: 280 }}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {message.sender_nom || 'Nouveau message'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {apercu}
            </div>
          </div>
        </div>
      ), { duration: 5000, id: `msg-${message.conversation_id}` })
    }

    socket.on('message:nouveau', onNew)
    return () => socket.off('message:nouveau', onNew)
  }, [socket, isAuthenticated, user, navigate])

  return null
}
