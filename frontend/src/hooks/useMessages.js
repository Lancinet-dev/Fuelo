// ================================================
// FUELO — useMessages : messagerie interne temps réel
// ================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import api from '../services/api'
import { useSocket } from './useSocket'

// ── Liste des conversations ───────────────────────
export function useConversations() {
  const { data, isLoading } = useQuery({
    queryKey:  ['conversations'],
    queryFn:   () => api.get('/messages/conversations').then(r => r.data.conversations ?? []),
    staleTime: 10_000,
  })
  return { conversations: data ?? [], loading: isLoading }
}

// ── Messages d'une conversation ───────────────────
export function useConversationMessages(conversationId) {
  const { data, isLoading } = useQuery({
    queryKey:  ['messages', conversationId],
    queryFn:   () => api.get(`/messages/conversations/${conversationId}`, { params: { limit: 50 } }).then(r => r.data),
    enabled:   !!conversationId,
    staleTime: 5_000,
  })
  return { messages: data?.messages ?? [], hasMore: data?.has_more ?? false, loading: isLoading }
}

// ── Employés de la station (nouvelle conversation) ─
export function useStationUsers() {
  const { data } = useQuery({
    queryKey:  ['message-users'],
    queryFn:   () => api.get('/messages/users').then(r => r.data.users ?? []),
    staleTime: 60_000,
  })
  return data ?? []
}

// ── Mutations ─────────────────────────────────────
export function useMessageActions() {
  const qc = useQueryClient()

  const send = useMutation({
    mutationFn: ({ conversationId, ...body }) =>
      api.post(`/messages/conversations/${conversationId}/messages`, body).then(r => r.data.message),
    onSuccess: (message, { conversationId }) => {
      // Append optimiste (dédupliqué par id avec l'event socket)
      qc.setQueryData(['messages', conversationId], (old) => {
        if (!old) return old
        if (old.messages?.some(m => m.id === message.id)) return old
        return { ...old, messages: [...(old.messages ?? []), message] }
      })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const create = useMutation({
    mutationFn: (body) => api.post('/messages/conversations', body).then(r => r.data.conversation_id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const markRead = useMutation({
    mutationFn: (conversationId) => api.put(`/messages/conversations/${conversationId}/lu`).then(r => r.data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['messages-unread'] })
    },
  })

  const upload = useMutation({
    mutationFn: ({ conversationId, file }) => {
      const fd = new FormData()
      fd.append('fichier', file)
      return api.post(`/messages/conversations/${conversationId}/upload`, fd, {
        headers: { 'Content-Type': undefined },
      }).then(r => r.data)
    },
  })

  return { send, create, markRead, upload }
}

// ── Badge total non-lus (sidebar) + maj temps réel ─
export function useUnreadMessages() {
  const qc = useQueryClient()
  const { socket } = useSocket()

  const { data } = useQuery({
    queryKey:        ['messages-unread'],
    queryFn:         () => api.get('/messages/non-lus').then(r => r.data.total ?? 0),
    staleTime:       10_000,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (!socket) return
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['messages-unread'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }
    socket.on('message:nouveau', refresh)
    return () => socket.off('message:nouveau', refresh)
  }, [socket, qc])

  return data ?? 0
}

// ── Temps réel pour la page messagerie ────────────
// onTyping(data, isTyping) doit être stable (useCallback)
export function useMessagesRealtime(onTyping) {
  const qc = useQueryClient()
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const onNew = ({ conversation_id, message }) => {
      qc.setQueryData(['messages', conversation_id], (old) => {
        if (!old) return old
        if (old.messages?.some(m => m.id === message.id)) return old
        return { ...old, messages: [...(old.messages ?? []), message] }
      })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['messages-unread'] })
    }
    const onTypingEvt = (d) => onTyping?.(d, true)
    const onStop      = (d) => onTyping?.(d, false)
    const onLu        = ({ conversation_id }) => qc.invalidateQueries({ queryKey: ['messages', conversation_id] })

    socket.on('message:nouveau',     onNew)
    socket.on('message:typing',      onTypingEvt)
    socket.on('message:stop_typing', onStop)
    socket.on('message:lu',          onLu)
    return () => {
      socket.off('message:nouveau',     onNew)
      socket.off('message:typing',      onTypingEvt)
      socket.off('message:stop_typing', onStop)
      socket.off('message:lu',          onLu)
    }
  }, [socket, qc, onTyping])
}

// Émettre l'indicateur "en train d'écrire"
export function useTypingEmitter() {
  const { socket } = useSocket()
  const emitTyping = (conversation_id, recipients, isTyping) => {
    if (!socket) return
    socket.emit(isTyping ? 'message:typing' : 'message:stop_typing', { conversation_id, recipients })
  }
  return emitTyping
}
