// ================================================
// FUELO — Assistant IA (chat flottant powered by Claude)
// Fichier : frontend/src/ui/AssistantFuelo.jsx
// ================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useAssistantChat } from '../hooks/useAssistant'
import theme from '../config/theme'

const ICONS = {
  bot:     'M12 2v4M7 8h10a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3v-6a3 3 0 013-3zM9 13v1M15 13v1',
  send:    'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  close:   'M18 6L6 18M6 6l12 12',
  sparkle: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z',
}

const SUGGESTIONS = [
  "Quelles sont mes ventes aujourd'hui ?",
  'Quel pompiste a le plus vendu ce mois ?',
  'Y a-t-il des alertes critiques ?',
  'Mon stock va durer combien de jours ?',
  'Quel est mon chiffre d\'affaires ce mois ?',
  'Qui a fraudé récemment ?',
]

const ERREUR_DEFAUT = "Désolé, je n'ai pas pu répondre. Réessayez dans un instant."

function Icon({ path, size = 16, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function BotAvatar({ size = 30 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      boxShadow: '0 4px 14px rgba(37,99,235,0.40)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon path={ICONS.bot} size={Math.round(size * 0.5)} color="#fff" />
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '14px 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8' }}
          animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function Bubble({ role, content, erreur }) {
  const isUser = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10 }}>
      {!isUser && <BotAvatar />}
      <div style={{
        maxWidth: '76%',
        padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
          : erreur ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
        border: isUser ? 'none' : `1px solid ${erreur ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
        color: isUser ? '#fff' : erreur ? '#FCA5A5' : '#E2E8F0',
        fontSize: theme.font.size.sm,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: isUser ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
      }}>
        {content}
      </div>
    </div>
  )
}

export default function AssistantFuelo() {
  const { isManager } = useAuth()
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [messages, setMessages] = useState([])
  const { mutateAsync: envoyer, isPending } = useAssistantChat()
  const scrollRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, isPending])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 350)
    return () => clearTimeout(id)
  }, [open])

  const envoyerMessage = useCallback(async (texte) => {
    const contenu = (texte ?? input).trim()
    if (!contenu || isPending) return
    setInput('')
    const historique = [...messages, { role: 'user', content: contenu }]
    setMessages(historique)
    try {
      const reponse = await envoyer(historique)
      setMessages((m) => [...m, { role: 'assistant', content: reponse }])
    } catch (err) {
      const msg = err?.response?.data?.error ?? ERREUR_DEFAUT
      setMessages((m) => [...m, { role: 'assistant', content: msg, erreur: true }])
    }
  }, [input, messages, isPending, envoyer])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyerMessage()
    }
  }

  if (!isManager) return null

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="assistant-fab"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="fuelo-assistant-fab"
            style={{
              position: 'fixed', bottom: 24, right: 24, zIndex: 1200,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 20px', borderRadius: theme.radius.full,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(37,99,235,0.45), 0 0 0 1px rgba(255,255,255,0.08)',
              color: '#fff', fontFamily: theme.font.family,
            }}
          >
            <Icon path={ICONS.bot} size={20} color="#fff" />
            <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold }}>Assistant IA</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="assistant-overlay"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,8,23,0.55)', backdropFilter: 'blur(2px)', zIndex: 1190 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="assistant-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fuelo-assistant-drawer"
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1195,
              width: 420, maxWidth: '100vw', display: 'flex', flexDirection: 'column',
              background: 'rgba(13,27,42,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: theme.shadow.premium,
              fontFamily: theme.font.family,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <BotAvatar size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold }}>
                  Assistant IA Fuelo
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94A3B8', fontSize: theme.font.size.xs, marginTop: 2 }}>
                  <Icon path={ICONS.sparkle} size={11} color="#F59E0B" />
                  Propulsé par Claude · données en temps réel
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                width: 34, height: 34, borderRadius: theme.radius.md, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#94A3B8',
              }}>
                <Icon path={ICONS.close} size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && (
                <div>
                  <div style={{ color: '#fff', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, marginBottom: 6 }}>
                    Bonjour 👋
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: theme.font.size.sm, lineHeight: 1.6, marginBottom: 18 }}>
                    Je suis votre assistant Fuelo. Je connais en temps réel les ventes, le stock, les alertes et la performance de votre station. Posez-moi une question, ou choisissez une suggestion :
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => envoyerMessage(q)}
                        style={{
                          textAlign: 'left', padding: '11px 14px', borderRadius: theme.radius.lg,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#CBD5E1', fontSize: theme.font.size.sm, cursor: 'pointer', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,0.12)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => <Bubble key={i} {...m} />)}

              {isPending && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <BotAvatar />
                  <div style={{ borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Posez votre question..."
                rows={1}
                style={{
                  flex: 1, resize: 'none', maxHeight: 120, padding: '12px 14px', borderRadius: theme.radius.lg,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                  color: '#fff', fontSize: theme.font.size.sm, fontFamily: theme.font.family, outline: 'none',
                }}
              />
              <motion.button
                onClick={() => envoyerMessage()}
                disabled={!input.trim() || isPending}
                whileHover={input.trim() && !isPending ? { scale: 1.06 } : {}}
                whileTap={input.trim() && !isPending ? { scale: 0.94 } : {}}
                style={{
                  width: 44, height: 44, borderRadius: theme.radius.lg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                  background: input.trim() && !isPending ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'rgba(255,255,255,0.06)',
                  cursor: input.trim() && !isPending ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() && !isPending ? '0 4px 16px rgba(37,99,235,0.40)' : 'none',
                }}
              >
                <Icon path={ICONS.send} size={18} color={input.trim() && !isPending ? '#fff' : '#64748B'} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .fuelo-assistant-fab span { display: none; }
          .fuelo-assistant-fab { padding: 14px !important; }
          .fuelo-assistant-drawer { width: 100vw !important; }
        }
      `}</style>
    </>
  )
}
