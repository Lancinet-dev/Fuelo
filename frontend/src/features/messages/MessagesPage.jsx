// ================================================
// FUELO — Messagerie interne (style WhatsApp Web)
// ================================================

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  useConversations, useConversationMessages, useStationUsers,
  useMessageActions, useMessagesRealtime, useTypingEmitter,
} from '../../hooks/useMessages'
import toast from 'react-hot-toast'

// ── Helpers avatar (couleur depuis hash du nom) ───
const AV_COLORS = ['#2563EB', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']
const avatarColor = (nom = '') => {
  let h = 0
  for (let i = 0; i < nom.length; i++) h = nom.charCodeAt(i) + ((h << 5) - h)
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}
const initials = (nom = '?') => nom.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

const ROLE_LABEL = { owner: 'Propriétaire', gerant: 'Gérant', logisticien: 'Logisticien', comptable: 'Comptable', pompiste: 'Pompiste', chauffeur: 'Chauffeur', superadmin: 'Admin' }
const homePath = (role) => ({ pompiste: '/pompiste', chauffeur: '/chauffeur', logisticien: '/logistique', comptable: '/comptable', superadmin: '/admin' }[role] || '/dashboard')

const EMOJIS = ['😀','😂','😍','👍','🙏','🔥','✅','❌','⛽','🚚','💰','📊','⚠️','👏','🎉','❤️','😢','😡','🤝','💪']

// ── Avatar ────────────────────────────────────────
function Avatar({ nom, url, size = 44, groupe = false }) {
  const color = avatarColor(nom || (groupe ? 'Groupe' : '?'))
  if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${color}, ${color}AA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.38 }}>
      {groupe
        ? <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z"/></svg>
        : initials(nom)}
    </div>
  )
}

// ── Format heure / date ───────────────────────────
const heure = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
function labelJour(dateStr) {
  const d = new Date(dateStr), now = new Date()
  const j = (x) => x.toDateString()
  if (j(d) === j(now)) return "Aujourd'hui"
  const hier = new Date(now); hier.setDate(now.getDate() - 1)
  if (j(d) === j(hier)) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ════════════════════════════════════════════════
export default function MessagesPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { palette, isDark } = useTheme()
  const { conversations, loading: loadingConvs } = useConversations()
  const { send, create, markRead, upload } = useMessageActions()

  const [activeId,  setActiveId]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [showNew,   setShowNew]   = useState(false)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat'
  const [typing,    setTyping]    = useState({})       // { [convId]: nom }

  const active = useMemo(() => conversations.find(c => c.id === activeId) ?? null, [conversations, activeId])

  // ── Temps réel ──
  const handleTyping = useCallback((data, isTyping) => {
    setTyping(prev => {
      const next = { ...prev }
      if (isTyping) next[data.conversation_id] = data.nom || 'Quelqu\'un'
      else delete next[data.conversation_id]
      return next
    })
  }, [])
  useMessagesRealtime(handleTyping)

  // Nettoie l'indicateur typing au bout de 4s
  useEffect(() => {
    if (Object.keys(typing).length === 0) return
    const t = setTimeout(() => setTyping({}), 4000)
    return () => clearTimeout(t)
  }, [typing])

  const openConversation = (conv) => {
    setActiveId(conv.id)
    setMobileView('chat')
    if (conv.non_lus > 0) markRead.mutate(conv.id)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(c => {
      const nom = c.type === 'groupe' ? c.nom : c.autre_nom
      return (nom ?? '').toLowerCase().includes(q)
    })
  }, [conversations, search])

  const convNom    = (c) => c.type === 'groupe' ? (c.nom || 'Groupe') : (c.autre_nom || 'Utilisateur')
  const convSousTitre = (c) => c.type === 'groupe' ? `${c.nb_membres} membres` : (ROLE_LABEL[c.autre_role] ?? '')

  return (
    <div style={{ height: '100dvh', display: 'flex', background: palette.bg, fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* ── SIDEBAR CONVERSATIONS ── */}
      <div className="msg-sidebar" style={{
        width: 340, flexShrink: 0, borderRight: `1px solid ${palette.cardBorder}`,
        background: palette.sidebar ?? palette.card, display: 'flex', flexDirection: 'column',
        ...(mobileView === 'chat' ? { } : {}),
      }}>
        {/* Header sidebar */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(homePath(role))} title="Retour"
            style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: `1px solid ${palette.cardBorder}`, background: 'transparent', cursor: 'pointer', color: palette.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: palette.text }}>Messages</div>
          <button onClick={() => setShowNew(true)} title="Nouvelle conversation"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#2563EB', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        {/* Recherche */}
        <div style={{ padding: '10px 14px' }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une conversation..."
              style={{ width: '100%', height: 40, boxSizing: 'border-box', padding: '0 12px 0 34px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.inputBg ?? 'rgba(255,255,255,0.04)', color: palette.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: palette.hover }} />
                <div style={{ flex: 1 }}><div style={{ height: 12, width: '50%', background: palette.hover, borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 10, width: '75%', background: palette.hover, borderRadius: 4 }} /></div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>
              {search ? 'Aucun résultat' : 'Aucune conversation. Cliquez sur + pour démarrer.'}
            </div>
          ) : filtered.map(c => {
            const isActive = c.id === activeId
            const estTyping = !!typing[c.id]
            return (
              <button key={c.id} onClick={() => openConversation(c)}
                style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', borderBottom: `1px solid ${palette.cardBorder}`, cursor: 'pointer', background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent', fontFamily: 'inherit', transition: 'background 0.15s' }}>
                <Avatar nom={convNom(c)} url={c.type === 'direct' ? c.autre_avatar : null} groupe={c.type === 'groupe'} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: palette.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convNom(c)}</span>
                    {c.dernier_at && <span style={{ fontSize: 11, color: palette.textMuted, flexShrink: 0 }}>{heure(c.dernier_at)}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 12.5, color: estTyping ? '#10B981' : palette.textSub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: estTyping ? 'italic' : 'normal' }}>
                      {estTyping ? 'écrit…' : c.dernier_contenu
                        ? `${c.type === 'groupe' && c.dernier_sender_nom ? c.dernier_sender_nom.split(' ')[0] + ': ' : ''}${c.dernier_type !== 'texte' ? '📎 Pièce jointe' : c.dernier_contenu}`
                        : 'Démarrez la conversation'}
                    </span>
                    {c.non_lus > 0 && (
                      <span style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 99, background: '#10B981', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{c.non_lus}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── ZONE CONVERSATION ── */}
      <div className="msg-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: isDark ? 'rgba(2,8,23,0.4)' : '#F8FAFC' }}>
        {active ? (
          <ChatZone
            key={active.id}
            conversation={active}
            me={user}
            palette={palette} isDark={isDark}
            onBack={() => setMobileView('list')}
            typingNom={typing[active.id]}
            send={send} upload={upload} markRead={markRead}
            convNom={convNom(active)} convSousTitre={convSousTitre(active)}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: palette.textMuted, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: palette.text }}>Votre messagerie Fuelo</div>
            <div style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>Sélectionnez une conversation ou démarrez-en une nouvelle pour discuter avec votre équipe.</div>
          </div>
        )}
      </div>

      {/* ── MODAL NOUVELLE CONVERSATION ── */}
      <AnimatePresence>
        {showNew && (
          <NewConversationModal
            palette={palette} isDark={isDark}
            onClose={() => setShowNew(false)}
            onCreated={(id) => { setShowNew(false); setActiveId(id); setMobileView('chat') }}
            create={create}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .msg-sidebar { width: 100% !important; ${''} display: ${mobileView === 'chat' ? 'none' : 'flex'} !important; }
          .msg-chat    { display: ${mobileView === 'chat' ? 'flex' : 'none'} !important; }
        }
      `}</style>
    </div>
  )
}

// ════════════════════════════════════════════════
// Zone de conversation active
// ════════════════════════════════════════════════
function ChatZone({ conversation, me, palette, isDark, onBack, typingNom, send, upload, markRead, convNom, convSousTitre }) {
  const { messages, loading } = useConversationMessages(conversation.id)
  const emitTyping = useTypingEmitter()
  const [text, setText]       = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [sending,  setSending] = useState(false)
  const scrollRef = useRef(null)
  const inputRef  = useRef(null)
  const fileRef   = useRef(null)
  const typingTimer = useRef(null)

  const recipients = useMemo(() => (conversation.membre_ids ?? []).filter(id => id !== me?.id), [conversation.membre_ids, me?.id])
  const estGroupe  = conversation.type === 'groupe'

  // Auto-scroll vers le bas
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, typingNom])

  // Marquer comme lu quand un message des autres arrive pendant qu'on regarde
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.sender_id !== me?.id) markRead.mutate(conversation.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }
  }, [text])

  const onChangeText = (e) => {
    setText(e.target.value)
    emitTyping(conversation.id, recipients, true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => emitTyping(conversation.id, recipients, false), 2000)
  }

  const doSend = async () => {
    const contenu = text.trim()
    if (!contenu || sending) return
    setSending(true)
    setText('')
    emitTyping(conversation.id, recipients, false)
    try {
      await send.mutateAsync({ conversationId: conversation.id, contenu, type: 'texte' })
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Message non envoyé')
      setText(contenu)
    } finally { setSending(false) }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend() }
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const tId = toast.loading('Envoi du fichier…')
    try {
      const { url, type } = await upload.mutateAsync({ conversationId: conversation.id, file })
      await send.mutateAsync({ conversationId: conversation.id, contenu: file.name, type, fichier_url: url })
      toast.success('Fichier envoyé', { id: tId })
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Échec de l\'envoi', { id: tId })
    }
  }

  // Groupement par jour
  const groupes = useMemo(() => {
    const out = []
    let lastDay = null
    for (const m of messages) {
      const day = new Date(m.created_at).toDateString()
      if (day !== lastDay) { out.push({ separator: labelJour(m.created_at), id: 'sep-' + day }); lastDay = day }
      out.push(m)
    }
    return out
  }, [messages])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header conversation */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, background: palette.card, flexShrink: 0 }}>
        <button onClick={onBack} className="msg-back"
          style={{ display: 'none', width: 34, height: 34, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: palette.textSub, alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <Avatar nom={convNom} url={conversation.type === 'direct' ? conversation.autre_avatar : null} groupe={estGroupe} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: palette.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{convNom}</div>
          <div style={{ fontSize: 11.5, color: typingNom ? '#10B981' : palette.textSub }}>
            {typingNom ? `${typingNom.split(' ')[0]} écrit…` : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {!estGroupe && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />}
                {convSousTitre}
              </span>
            )}
          </div>
        </div>
        {!estGroupe && conversation.autre_role && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#60A5FA', background: 'rgba(37,99,235,0.14)', borderRadius: 99, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {ROLE_LABEL[conversation.autre_role] ?? conversation.autre_role}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {loading ? (
          <div style={{ margin: 'auto', color: palette.textMuted, fontSize: 13 }}>Chargement…</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', color: palette.textMuted, fontSize: 13, textAlign: 'center' }}>Aucun message.<br/>Écrivez le premier 👋</div>
        ) : groupes.map((item) => item.separator ? (
          <div key={item.id} style={{ alignSelf: 'center', margin: '10px 0', fontSize: 11, fontWeight: 600, color: palette.textMuted, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '3px 12px', borderRadius: 99 }}>
            {item.separator}
          </div>
        ) : (
          <MessageBubble key={item.id} m={item} mine={item.sender_id === me?.id} estGroupe={estGroupe} palette={palette} isDark={isDark} />
        ))}

        {typingNom && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 16, background: isDark ? 'rgba(30,41,59,0.7)' : '#fff', border: `1px solid ${palette.cardBorder}`, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: palette.textSub }}>{typingNom.split(' ')[0]} écrit</span>
            <span className="msg-dots"><i/><i/><i/></span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${palette.cardBorder}`, background: palette.card, flexShrink: 0, position: 'relative' }}>
        <AnimatePresence>
          {showEmoji && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              style={{ position: 'absolute', bottom: 64, left: 14, background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', zIndex: 5 }}>
              {EMOJIS.map(em => (
                <button key={em} onClick={() => { setText(t => t + em); setShowEmoji(false); inputRef.current?.focus() }}
                  style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }}>{em}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button onClick={() => setShowEmoji(s => !s)} title="Emoji"
            style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: palette.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>
          <button onClick={() => fileRef.current?.click()} title="Pièce jointe"
            style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: palette.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={onFile} style={{ display: 'none' }} />

          <textarea ref={inputRef} value={text} onChange={onChangeText} onKeyDown={onKeyDown} rows={1}
            placeholder="Écrivez un message…"
            style={{ flex: 1, resize: 'none', maxHeight: 120, padding: '10px 14px', borderRadius: 20, border: `1px solid ${palette.cardBorder}`, background: palette.inputBg ?? 'rgba(255,255,255,0.04)', color: palette.text, fontSize: 14, lineHeight: 1.4, outline: 'none', fontFamily: 'inherit' }} />

          <button onClick={doSend} disabled={!text.trim() || sending} title="Envoyer"
            style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', border: 'none', cursor: text.trim() && !sending ? 'pointer' : 'not-allowed', background: text.trim() && !sending ? '#2563EB' : palette.hover, color: text.trim() && !sending ? '#fff' : palette.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: text.trim() && !sending ? '0 4px 14px rgba(37,99,235,0.4)' : 'none', transition: 'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .msg-back { display: flex !important; } }
        .msg-dots { display: inline-flex; gap: 3px; }
        .msg-dots i { width: 5px; height: 5px; border-radius: 50%; background: ${palette.textMuted}; display: inline-block; animation: msgBounce 1.2s infinite; }
        .msg-dots i:nth-child(2) { animation-delay: 0.2s; }
        .msg-dots i:nth-child(3) { animation-delay: 0.4s; }
        @keyframes msgBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4 } 30% { transform: translateY(-4px); opacity: 1 } }
      `}</style>
    </div>
  )
}

// ── Bulle de message ──────────────────────────────
function MessageBubble({ m, mine, estGroupe, palette, isDark }) {
  const bg   = mine ? '#2563EB' : (isDark ? '#1E293B' : '#fff')
  const col  = mine ? '#fff' : palette.text
  const isFichier = m.type === 'image' || m.type === 'document'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', maxWidth: '76%', alignSelf: mine ? 'flex-end' : 'flex-start' }}>
      {estGroupe && !mine && (
        <span style={{ fontSize: 11, fontWeight: 700, color: avatarColor(m.sender_nom), marginBottom: 2, marginLeft: 6 }}>{m.sender_nom}</span>
      )}
      <div style={{ background: bg, color: col, padding: isFichier ? 6 : '9px 13px', borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4, border: mine ? 'none' : `1px solid ${palette.cardBorder}`, boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)', wordBreak: 'break-word' }}>
        {m.type === 'image' && m.fichier_url ? (
          <a href={m.fichier_url} target="_blank" rel="noreferrer">
            <img src={m.fichier_url} alt={m.contenu || ''} style={{ maxWidth: 240, maxHeight: 280, borderRadius: 12, display: 'block' }} />
          </a>
        ) : m.type === 'document' && m.fichier_url ? (
          <a href={m.fichier_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', textDecoration: 'none', color: col }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.contenu || 'Document'}</span>
          </a>
        ) : (
          <span style={{ fontSize: 14, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{m.contenu}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, padding: '0 4px' }}>
        <span style={{ fontSize: 10.5, color: palette.textMuted }}>{heure(m.created_at)}</span>
        {mine && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={m.lu ? '#38BDF8' : palette.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 7L9.5 16 6 12.5"/><path d="M22 7l-8 8" opacity={m.lu ? 1 : 0.9}/>
          </svg>
        )}
      </div>
    </motion.div>
  )
}

// ── Modal nouvelle conversation ───────────────────
function NewConversationModal({ palette, onClose, onCreated, create }) {
  const users = useStationUsers()
  const [selected, setSelected] = useState([])
  const [nomGroupe, setNomGroupe] = useState('')
  const [search, setSearch] = useState('')

  const estGroupe = selected.length > 1
  const filtered = users.filter(u => u.nom.toLowerCase().includes(search.trim().toLowerCase()))

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const valider = async () => {
    if (selected.length === 0) return
    if (estGroupe && !nomGroupe.trim()) { toast.error('Donnez un nom au groupe'); return }
    try {
      const id = await create.mutateAsync({
        type: estGroupe ? 'groupe' : 'direct',
        membres: selected,
        nom: estGroupe ? nomGroupe.trim() : null,
      })
      onCreated(id)
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Création impossible')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fuelo-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="fuelo-modal"
        style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 18, width: '100%', maxWidth: 440, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: palette.text }}>Nouvelle conversation</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {estGroupe && (
          <div style={{ padding: '12px 20px 0' }}>
            <input value={nomGroupe} onChange={e => setNomGroupe(e.target.value)} placeholder="Nom du groupe *"
              style={{ width: '100%', boxSizing: 'border-box', height: 42, padding: '0 14px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.inputBg ?? 'rgba(255,255,255,0.04)', color: palette.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
        )}

        <div style={{ padding: '12px 20px 8px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un employé…"
            style={{ width: '100%', boxSizing: 'border-box', height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: palette.inputBg ?? 'rgba(255,255,255,0.04)', color: palette.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11, color: palette.textMuted, marginTop: 8 }}>
            {selected.length === 0 ? 'Sélectionnez 1 personne (privé) ou plusieurs (groupe)' : `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}${estGroupe ? ' · groupe' : ' · conversation privée'}`}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 12px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: palette.textMuted, fontSize: 13 }}>Aucun employé</div>
          ) : filtered.map(u => {
            const sel = selected.includes(u.id)
            return (
              <button key={u.id} onClick={() => toggle(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '9px 10px', border: 'none', borderRadius: 10, cursor: 'pointer', background: sel ? 'rgba(37,99,235,0.12)' : 'transparent', fontFamily: 'inherit', marginBottom: 2 }}>
                <Avatar nom={u.nom} url={u.avatar} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: palette.text }}>{u.nom}</div>
                  <div style={{ fontSize: 11.5, color: palette.textSub }}>{ROLE_LABEL[u.role] ?? u.role}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel ? '#2563EB' : palette.cardBorder}`, background: sel ? '#2563EB' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {sel && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${palette.cardBorder}` }}>
          <button onClick={valider} disabled={selected.length === 0 || create.isPending}
            style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: selected.length ? '#2563EB' : palette.hover, color: selected.length ? '#fff' : palette.textMuted, fontSize: 14, fontWeight: 700, cursor: selected.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {create.isPending ? 'Création…' : estGroupe ? `Créer le groupe (${selected.length})` : 'Démarrer la conversation'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
