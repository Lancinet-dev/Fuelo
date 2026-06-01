// ================================================
// FUELO — Services / Anti-fraude (owner + gérant)
// ================================================

import { useState } from 'react'
import { useServices }    from '../../hooks/useServices'
import { useTheme }       from '../../context/ThemeContext'
import StatCard           from '../../ui/StatCard'
import EmptyState         from '../../ui/EmptyState'
import { formatRelative } from '../../utils/format'
import theme from '../../config/theme'

const TABS = [
  { key: null,       label: 'Tous'             },
  { key: 'alerte',   label: 'Alertes fraude'   },
  { key: 'en_cours', label: 'En cours'         },
  { key: 'termine',  label: 'Terminés'         },
]

const STATUT_CONFIG = {
  alerte:   { label: 'Alerte fraude', color: theme.colors.danger,  bg: theme.colors.dangerLight  },
  en_cours: { label: 'En cours',      color: theme.colors.success, bg: theme.colors.successLight },
  termine:  { label: 'Terminé',       color: theme.colors.info,    bg: theme.colors.infoLight    },
}

// ── Modal détail service ──────────────────────────
function ServiceModal({ service, onClose, isDark, palette }) {
  const [photoMode, setPhotoMode] = useState(null) // 'debut' | 'fin'
  const sc = STATUT_CONFIG[service.statut] ?? STATUT_CONFIG.termine

  const Ecart = ({ label, ecart, vendu, debut, fin }) => {
    if (debut == null) return null
    const hasAlerte = ecart != null && Math.abs(ecart) > 10
    const sign = ecart > 0 ? '+' : ''
    return (
      <div style={{ background: hasAlerte ? theme.colors.dangerLight : isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${hasAlerte ? theme.colors.danger + '40' : palette.cardBorder}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: hasAlerte ? theme.colors.danger : palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          {label} {hasAlerte && '⚠️'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Compteur début', v: debut != null ? `${debut} L` : '—' },
            { l: 'Compteur fin',   v: fin   != null ? `${fin} L`   : '—' },
            { l: 'Ventes enreg.',  v: vendu != null ? `${vendu} L` : '—' },
          ].map(({ l, v }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: palette.text, fontFamily: theme.font.mono }}>{v}</div>
              <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        {ecart != null && (
          <div style={{ marginTop: 10, textAlign: 'center', padding: '8px', borderRadius: 8, background: hasAlerte ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)', border: `1px solid ${hasAlerte ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: hasAlerte ? theme.colors.danger : theme.colors.success, fontFamily: theme.font.mono }}>
              Écart : {sign}{ecart.toFixed(1)} L
            </span>
            <span style={{ fontSize: 11, color: palette.textSub, marginLeft: 8 }}>
              {hasAlerte ? '> seuil 10 L' : 'OK'}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{ background: isDark ? '#0D1B2A' : '#fff', borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'slideUp 0.25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: palette.text, marginBottom: 4 }}>
              Détail du service
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {sc.label}
              </span>
              <span style={{ fontSize: 12, color: palette.textSub }}>{service.pompiste_nom}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMuted, padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Horaires */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Début service', v: service.started_at ? new Date(service.started_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—' },
            { l: 'Fin service',   v: service.ended_at   ? new Date(service.ended_at).toLocaleString('fr-FR',   { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'En cours' },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${palette.cardBorder}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, fontFamily: theme.font.mono }}>{v}</div>
              <div style={{ fontSize: 10, color: palette.textMuted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Écarts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <Ecart
            label="Essence"
            ecart={service.ecart_essence}
            debut={service.compteur_essence_debut}
            fin={service.compteur_essence_fin}
          />
          <Ecart
            label="Gasoil"
            ecart={service.ecart_gasoil}
            debut={service.compteur_gasoil_debut}
            fin={service.compteur_gasoil_fin}
          />
        </div>

        {/* Photos */}
        {(service.photo_debut_url || service.photo_fin_url) && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Photos compteurs
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Début', url: service.photo_debut_url, key: 'debut' },
                { label: 'Fin',   url: service.photo_fin_url,   key: 'fin'   },
              ].map(({ label, url, key }) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: palette.textSub, marginBottom: 5, textAlign: 'center' }}>{label}</div>
                  {url ? (
                    <div onClick={() => setPhotoMode(key)} style={{ cursor: 'zoom-in', borderRadius: 10, overflow: 'hidden', border: `1px solid ${palette.cardBorder}` }}>
                      <img src={url} alt={`compteur ${label}`} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ height: 110, borderRadius: 10, border: `1px dashed ${palette.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textMuted, fontSize: 12 }}>
                      Non fournie
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox photo */}
      {photoMode && (
        <div onClick={() => setPhotoMode(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img
            src={photoMode === 'debut' ? service.photo_debut_url : service.photo_fin_url}
            alt="compteur"
            style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Carte service ─────────────────────────────────
function ServiceCard({ service, onClick, palette, isDark }) {
  const sc = STATUT_CONFIG[service.statut] ?? STATUT_CONFIG.termine
  const aFraude = service.statut === 'alerte'

  const ecartEssence = service.ecart_essence
  const ecartGasoil  = service.ecart_gasoil

  return (
    <div
      onClick={onClick}
      style={{
        background: aFraude ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)') : palette.card,
        border: `1px solid ${aFraude ? theme.colors.danger + '35' : palette.cardBorder}`,
        borderRadius: theme.radius.lg, padding: '16px 18px',
        cursor: 'pointer', transition: 'all 0.15s', boxShadow: theme.shadow.sm,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = theme.shadow.md }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = theme.shadow.sm }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            {aFraude && <span style={{ fontSize: 14 }}>🚨</span>}
            <span style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>{service.pompiste_nom}</span>
          </div>
          <div style={{ fontSize: 11, color: palette.textSub }}>{formatRelative(service.started_at)}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
          {sc.label}
        </span>
      </div>

      {/* Écarts résumés */}
      {(ecartEssence != null || ecartGasoil != null) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {ecartEssence != null && (
            <div style={{ flex: 1, textAlign: 'center', background: Math.abs(ecartEssence) > 10 ? theme.colors.dangerLight : (isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB'), border: `1px solid ${Math.abs(ecartEssence) > 10 ? theme.colors.danger + '40' : palette.cardBorder}`, borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: Math.abs(ecartEssence) > 10 ? theme.colors.danger : theme.colors.success, fontFamily: theme.font.mono }}>
                {ecartEssence > 0 ? '+' : ''}{ecartEssence.toFixed(1)} L
              </div>
              <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 1 }}>Écart essence</div>
            </div>
          )}
          {ecartGasoil != null && (
            <div style={{ flex: 1, textAlign: 'center', background: Math.abs(ecartGasoil) > 10 ? theme.colors.dangerLight : (isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB'), border: `1px solid ${Math.abs(ecartGasoil) > 10 ? theme.colors.danger + '40' : palette.cardBorder}`, borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: Math.abs(ecartGasoil) > 10 ? theme.colors.danger : theme.colors.success, fontFamily: theme.font.mono }}>
                {ecartGasoil > 0 ? '+' : ''}{ecartGasoil.toFixed(1)} L
              </div>
              <div style={{ fontSize: 9, color: palette.textMuted, marginTop: 1 }}>Écart gasoil</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page principale ────────────────────────────────
export default function ServicesPage() {
  const { palette, isDark } = useTheme()
  const [tabStatut, setTabStatut] = useState(null)
  const [selected,  setSelected]  = useState(null)

  const { services, loading, stats } = useServices({ statut: tabStatut })

  const ICON_FRAUDE  = 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01'
  const ICON_SERVICE = 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
  const ICON_CHECK   = 'M20 6L9 17l-5-5'

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }} className="fuelo-services">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: theme.font.size['2xl'], fontWeight: theme.font.weight.black, color: palette.text, letterSpacing: '-0.5px', margin: 0, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          Services pompistes
          {stats.alertes > 0 && (
            <span style={{ fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold, background: theme.colors.danger, color: '#fff', borderRadius: theme.radius.full, padding: '2px 10px' }}>
              {stats.alertes} fraude{stats.alertes > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <p style={{ fontSize: theme.font.size.md, color: palette.textSub, margin: 0 }}>
          Suivi des relevés de compteurs et détection de fraude
        </p>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="fuelo-grid-3">
          <StatCard label="Total services"  value={String(stats.total)}   icon={ICON_SERVICE} color={palette.textSub} />
          <StatCard label="Alertes fraude"  value={String(stats.alertes)} icon={ICON_FRAUDE}  color={stats.alertes > 0 ? theme.colors.danger : theme.colors.success} />
          <StatCard label="En cours"        value={String(stats.enCours)} icon={ICON_CHECK}   color={theme.colors.success} />
        </div>
      )}

      {/* Tabs filtre */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={String(tab.key)} onClick={() => setTabStatut(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s',
              background: tabStatut === tab.key
                ? tab.key === 'alerte' ? theme.colors.danger : theme.colors.primary
                : palette.card,
              color: tabStatut === tab.key ? '#fff' : palette.textSub,
              boxShadow: tabStatut === tab.key ? theme.shadow.primary : theme.shadow.sm,
              border: `1px solid ${tabStatut === tab.key ? 'transparent' : palette.cardBorder}`,
            }}>
            {tab.key === 'alerte' && stats.alertes > 0 ? `🚨 ${tab.label} (${stats.alertes})` : tab.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, padding: '16px 18px', height: 88 }} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: theme.radius.lg, boxShadow: theme.shadow.sm }}>
          <EmptyState type="alertes" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map(s => (
            <ServiceCard
              key={s.id}
              service={s}
              onClick={() => setSelected(s)}
              palette={palette}
              isDark={isDark}
            />
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <ServiceModal
          service={selected}
          onClose={() => setSelected(null)}
          isDark={isDark}
          palette={palette}
        />
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @media (max-width: 768px) {
          .fuelo-services { padding: 20px 16px !important; }
          .fuelo-grid-3   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
