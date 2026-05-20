// ================================================
// FUELO V2 — Bouton WhatsApp flottant
// Fichier : frontend/src/ui/WhatsAppButton.jsx
// Visible sur toutes les pages
// ================================================

import { useState } from 'react'

const WA_LINK = 'https://chat.whatsapp.com/DrmXOBqbaNUDTo34z5WuoE?s=sw&p=a&mlu=0'

export default function WhatsAppButton() {
  const [hovered,  setHovered]  = useState(false)
  const [tooltip,  setTooltip]  = useState(false)

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          background:   '#111827',
          color:        '#F1F5F9',
          fontSize:     13,
          fontWeight:   500,
          padding:      '8px 14px',
          borderRadius: 10,
          whiteSpace:   'nowrap',
          boxShadow:    '0 4px 16px rgba(0,0,0,0.2)',
          border:       '0.5px solid rgba(255,255,255,0.08)',
          fontFamily:   "'DM Sans', system-ui, sans-serif",
          animation:    'fadeIn 0.2s ease',
        }}>
          💬 Rejoindre le groupe Fuelo
          <div style={{ position: 'absolute', right: 18, bottom: -5, width: 10, height: 10, background: '#111827', transform: 'rotate(45deg)', border: '0.5px solid rgba(255,255,255,0.08)', borderTop: 'none', borderLeft: 'none' }} />
        </div>
      )}

      {/* Bouton */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => { setHovered(true); setTooltip(true) }}
        onMouseLeave={() => { setHovered(false); setTooltip(false) }}
        style={{
          width:          56,
          height:         56,
          borderRadius:   '50%',
          background:     hovered ? '#1DA851' : '#25D366',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      hovered
            ? '0 8px 28px rgba(37,211,102,0.55)'
            : '0 4px 16px rgba(37,211,102,0.4)',
          transform:      hovered ? 'scale(1.1)' : 'scale(1)',
          transition:     'all 0.25s ease',
          textDecoration: 'none',
          position:       'relative',
        }}
        aria-label="Rejoindre le groupe WhatsApp Fuelo"
      >
        {/* Icône WhatsApp SVG officielle */}
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3C8.82 3 3 8.82 3 16c0 2.35.63 4.64 1.84 6.64L3 29l6.54-1.82A13 13 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3z"
            fill="#fff"
          />
          <path
            d="M22.46 19.36c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.5-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.09 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.28-.2-.58-.35z"
            fill="#25D366"
          />
        </svg>

        {/* Pulse animé */}
        <div style={{
          position:     'absolute',
          inset:        -4,
          borderRadius: '50%',
          border:       '2px solid rgba(37,211,102,0.4)',
          animation:    'waPulse 2s infinite',
          pointerEvents:'none',
        }} />
      </a>

      <style>{`
        @keyframes waPulse {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}