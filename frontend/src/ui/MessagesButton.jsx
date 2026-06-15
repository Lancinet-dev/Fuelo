// ================================================
// FUELO — Bouton Messages (avec badge non-lus)
// Pour les rôles sans sidebar principale (pompiste, chauffeur, logisticien, comptable)
// ================================================

import { useNavigate } from 'react-router-dom'
import { useUnreadMessages } from '../hooks/useMessages'

export default function MessagesButton({
  size = 32,
  color  = 'rgba(255,255,255,0.7)',
  bg     = 'rgba(255,255,255,0.06)',
  border = 'rgba(255,255,255,0.12)',
}) {
  const navigate = useNavigate()
  const unread   = useUnreadMessages()

  return (
    <button onClick={() => navigate('/messages')} title="Messages"
      style={{ position: 'relative', width: size, height: size, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color }}>
      <svg width={Math.round(size * 0.46)} height={Math.round(size * 0.46)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      {unread > 0 && (
        <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 99, background: '#10B981', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
