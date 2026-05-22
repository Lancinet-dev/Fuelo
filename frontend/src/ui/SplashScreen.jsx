// ================================================
// FUELO — Splash Screen Premium
// Fichier : frontend/src/ui/SplashScreen.jsx
// ================================================

import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0 = apparition icône
  // phase 1 = apparition texte + barre
  // phase 2 = fade out total

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 2200)
    const t3 = setTimeout(() => onDone?.(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050B18',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 2 ? 0 : 1,
      transition: phase === 2 ? 'opacity 0.6s ease' : 'none',
      pointerEvents: phase === 2 ? 'none' : 'all',
    }}>

      {/* Grille cyber */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      {/* Glow central */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Cercle animé autour de l'icône */}
      <div style={{
        position: 'relative',
        marginBottom: 32,
        opacity: phase >= 0 ? 1 : 0,
        transform: phase >= 0 ? 'scale(1)' : 'scale(0.5)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Anneau rotatif externe */}
        <div style={{
          position: 'absolute', inset: -16,
          borderRadius: '50%',
          border: '1.5px solid transparent',
          borderTopColor: '#2563EB',
          borderRightColor: 'rgba(37,99,235,0.3)',
          animation: 'spinRing 2s linear infinite',
        }} />
        {/* Anneau rotatif interne inversé */}
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          border: '1px solid transparent',
          borderTopColor: '#F59E0B',
          borderLeftColor: 'rgba(245,158,11,0.2)',
          animation: 'spinRing 1.5s linear infinite reverse',
        }} />

        {/* Points orbitaux */}
        <div style={{ position: 'absolute', inset: -20, animation: 'spinRing 3s linear infinite' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, borderRadius: '50%', background: '#60A5FA', boxShadow: '0 0 8px #60A5FA' }} />
        </div>
        <div style={{ position: 'absolute', inset: -20, animation: 'spinRing 3s linear infinite reverse' }}>
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
        </div>

        {/* Icône logo */}
        <div style={{
          width: 88, height: 88,
          borderRadius: 22,
          background: '#0D1B2A',
          border: '1px solid rgba(37,99,235,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(37,99,235,0.2), inset 0 0 20px rgba(37,99,235,0.05)',
          animation: 'iconPulse 2s ease-in-out infinite',
        }}>
          <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="sp-drop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA"/>
                <stop offset="100%" stopColor="#1D4ED8"/>
              </linearGradient>
              <linearGradient id="sp-bolt" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FCD34D"/>
                <stop offset="100%" stopColor="#F59E0B"/>
              </linearGradient>
            </defs>
            <path d="M24 7C24 7 11 20 11 28C11 35.7 17 42 24 42C31 42 37 35.7 37 28C37 20 24 7 24 7Z" fill="url(#sp-drop)"/>
            <path d="M26.5 15L21.5 27H25L22 41L30 25H26L29 15Z" fill="url(#sp-bolt)"/>
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s ease',
        marginBottom: 40,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1 }}>
          <span style={{ color: '#F1F5F9' }}>fuel</span>
          <span style={{ color: '#F59E0B' }}>o</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '4px', color: 'rgba(241,245,249,0.25)', marginTop: 6, textTransform: 'uppercase' }}>
          Station Management
        </div>
      </div>

      {/* Barre de chargement */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.4s ease 0.2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* Track */}
        <div style={{ width: 180, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
            borderRadius: 2,
            animation: phase >= 1 ? 'loadBar 1.4s ease forwards' : 'none',
            boxShadow: '0 0 8px rgba(96,165,250,0.6)',
          }} />
        </div>
        {/* Texte chargement */}
        <div style={{ fontSize: 11, color: 'rgba(241,245,249,0.2)', letterSpacing: '2px', animation: 'textBlink 1s ease-in-out infinite' }}>
          CHARGEMENT...
        </div>
      </div>

      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes iconPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(37,99,235,0.2), inset 0 0 20px rgba(37,99,235,0.05); }
          50%       { box-shadow: 0 0 60px rgba(37,99,235,0.4), inset 0 0 30px rgba(37,99,235,0.1); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes textBlink {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}