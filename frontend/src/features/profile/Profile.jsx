// ================================================
// FUELO V2 — Profile
// Fichier : frontend/src/features/profile/Profile.jsx
// ================================================

import { useState, useEffect } from 'react'
import { useAuth }  from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../hooks/useTranslation'
import api          from '../../services/api'
import toast        from 'react-hot-toast'
import {  formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const ICONS = {
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  station:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
  save:     'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
}

const ROLE_LABELS = {
  owner:      'Propriétaire',
  manager:    'Gérant',
  pompiste:   'Pompiste',
  superadmin: 'Super Admin',
}

const ROLE_COLORS = {
  owner:      '#F59E0B',
  manager:    '#3B82F6',
  pompiste:   '#10B981',
  superadmin: '#C084FC',
}

function SectionCard({ icon, title, children, palette }) {
  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, overflow: 'hidden', boxShadow: theme.shadow.sm, marginBottom: 20 }}>
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: theme.radius.md, background: theme.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round"><path d={icon} /></svg>
        </div>
        <div style={{ fontSize: theme.font.size.base, fontWeight: theme.font.weight.bold, color: palette.text }}>{title}</div>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  )
}

export default function Profile() {
  const { user }    = useAuth()
  const { palette } = useTheme()
  const { t }       = useTranslation()
  const roleKey     = user?.role === 'manager' ? 'gerant' : user?.role

  const [form,      setForm]      = useState({ nom: '', email: '', telephone: '' })
  const [loading,   setLoading]   = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [activite,  setActivite]  = useState([])
  const [stations,  setStations]  = useState([])

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  // ── Charger données ───────────────────────────────
  useEffect(() => {
    if (user) {
      const newForm = {
        nom:       user.nom       ?? '',
        email:     user.email     ?? '',
        telephone: user.telephone ?? '',
      }

      Promise.resolve().then(() => {
        setForm(prev => {
          if (JSON.stringify(prev) === JSON.stringify(newForm)) {
            return prev
          }
          return newForm
        })
      })
    }

    // Charger activité récente
    api.get('/stats/activite')
      .then(res => setActivite(res.data.activite ?? []))
      .catch(() => {})

    // Charger stations si owner
    if (user?.role === 'owner') {
      api.get('/station/mes-stations')
        .then(res => setStations(res.data.stations ?? []))
        .catch(() => {})
    }
  }, [user])

  // ── Sauvegarder profil ────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.nom.trim()) { toast.error('Le nom est obligatoire'); return }

    setLoading(true)
    try {
      await api.put('/auth/profile', {
        nom:       form.nom,
        telephone: form.telephone || null,
      })
      toast.success('Profil mis à jour')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      toast.error(err?.response?.data?.error ?? 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width:        '100%',
    height:       46,
    background:   palette.inputBg,
    border:       `1.5px solid ${palette.inputBorder}`,
    borderRadius: theme.radius.md,
    padding:      '0 14px',
    fontSize:     theme.font.size.base,
    color:        palette.text,
    fontFamily:   theme.font.family,
    outline:      'none',
    transition:   theme.transition.fast,
  }

  const roleColor = ROLE_COLORS[user?.role] ?? theme.colors.primary

  return (
    <div style={{ padding: '32px 28px', maxWidth: 720, margin: '0 auto' }} className="fuelo-profile">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4 }}>
          {t('profile.title')}
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Avatar + infos principales */}
      <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '24px', marginBottom: 20, boxShadow: theme.shadow.sm, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.nom} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${roleColor}30` }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}15)`, border: `3px solid ${roleColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: roleColor }}>
              {(user?.nom || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          {user?.google_id && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: theme.shadow.sm }}>
              <svg width="13" height="13" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
          )}
        </div>

        {/* Infos */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: theme.font.weight.black, color: palette.text, marginBottom: 4 }}>
            {user?.nom}
          </div>
          <div style={{ fontSize: theme.font.size.sm, color: palette.textSub, marginBottom: 8 }}>
            {user?.email}
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: roleColor, background: `${roleColor}15`, border: `1px solid ${roleColor}30`, padding: '3px 12px', borderRadius: theme.radius.full, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {roleKey ? t('roles.' + roleKey) : (ROLE_LABELS[user?.role] ?? user?.role)}
          </span>
        </div>
      </div>

      {/* Informations personnelles */}
      <SectionCard icon={ICONS.edit} title={t('profile.infosPerso')} palette={palette}>
        <form onSubmit={handleSave}>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('profile.nomComplet')}
            </div>
            <input
              type="text"
              value={form.nom}
              onChange={e => set('nom')(e.target.value)}
              placeholder="Votre nom"
              onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
              onBlur={e  => { e.target.style.borderColor = palette.inputBorder; e.target.style.boxShadow = 'none' }}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('profile.email')}
            </div>
            <input
              type="email"
              value={form.email}
              disabled
              style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            />
            <div style={{ fontSize: theme.font.size.xs, color: palette.textMuted, marginTop: 4 }}>
              {t('profile.emailNote')}
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: theme.font.size.xs, fontWeight: theme.font.weight.semi, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {t('profile.telephone')}
            </div>
            <input
              type="tel"
              value={form.telephone}
              onChange={e => set('telephone')(e.target.value)}
              placeholder="+224 6XX XXX XXX"
              onFocus={e => { e.target.style.borderColor = theme.colors.primary; e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primaryLight}` }}
              onBlur={e  => { e.target.style.borderColor = palette.inputBorder; e.target.style.boxShadow = 'none' }}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: theme.radius.md, border: 'none', background: saved ? theme.colors.success : loading ? theme.colors.primaryDark : theme.colors.primary, color: saved ? '#fff' : '#0F172A', fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: theme.font.family, boxShadow: theme.shadow.primary, transition: theme.transition.normal }}
          >
            {loading
              ? <div style={{ width: 16, height: 16, border: '2px solid #0F172A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : saved
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={ICONS.save} /></svg>
            }
            {loading ? `${t('common.loading')}` : saved ? t('parametres.sauvegarde') : t('parametres.sauvegarder')}
          </button>
        </form>
      </SectionCard>

      {/* Stations accessibles */}
      {stations.length > 0 && (
        <SectionCard icon={ICONS.station} title={t('profile.mesStations')} palette={palette}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stations.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: palette.inputBg, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⛽</span>
                  <div>
                    <div style={{ fontSize: theme.font.size.md, fontWeight: theme.font.weight.semi, color: palette.text }}>{s.nom}</div>
                    <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>{s.ville} · {s.pays}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.success, background: theme.colors.successLight, padding: '2px 10px', borderRadius: theme.radius.full }}>
                  {t('profile.active')}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Activité récente */}
      <SectionCard icon={ICONS.activity} title={t('profile.activiteRecente')} palette={palette}>
        {activite.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: palette.textSub, fontSize: theme.font.size.md }}>
            {t('profile.aucuneActivite')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activite.map((item, i) => {
              const isVente  = item.event === 'vente'
              const color    = isVente ? theme.colors.primary : theme.colors.danger
              const label    = isVente
                ? `Vente ${item.carburant} — ${parseInt(item.montant_gnf ?? 0).toLocaleString('fr-FR')} GNF`
                : item.message

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: palette.inputBg, borderRadius: theme.radius.md, border: `1px solid ${palette.cardBorder}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: theme.radius.md, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isVente
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.semi, color: palette.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: theme.font.size.xs, color: palette.textSub }}>
                      {formatRelative(item.created_at)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .fuelo-profile { padding: 20px 16px !important; } }
      `}</style>
    </div>
  )
}