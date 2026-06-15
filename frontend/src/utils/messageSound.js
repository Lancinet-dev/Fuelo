// ================================================
// FUELO — Son de notification messagerie (discret)
// ================================================
// Bip court généré via Web Audio API — aucun fichier audio à charger.

export const isSoundOn  = () => { try { return localStorage.getItem('fuelo_msg_sound') !== 'off' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem('fuelo_msg_sound', on ? 'on' : 'off') } catch { /* privé */ } }

let ctx = null

export function playMessageBeep() {
  if (!isSoundOn()) return
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = ctx || new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'
    o.frequency.value = 660
    const t = ctx.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    o.start(t)
    o.stop(t + 0.24)
  } catch { /* autoplay bloqué tant que pas d'interaction — silencieux */ }
}
