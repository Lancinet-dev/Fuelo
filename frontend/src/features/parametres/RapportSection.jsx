// ================================================
// FUELO — Section Rapport dans Paramètres
// À ajouter dans Parametres.jsx
// ================================================

// Ajoute ce state en haut de la fonction Parametres() :
// const [rapportLoading, setRapportLoading] = useState(false)

// Ajoute cette fonction dans Parametres() :
// const handleEnvoyerRapport = async (mois) => {
//   setRapportLoading(true)
//   try {
//     const now   = new Date()
//     const year  = mois === 'current' ? now.getFullYear() : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
//     const month = mois === 'current' ? now.getMonth() + 1 : (now.getMonth() === 0 ? 12 : now.getMonth())
//     await api.post('/reports/envoyer', { year, month })
//     toast.success('Rapport envoyé par email ✅')
//   } catch (err) {
//     toast.error(err?.response?.data?.error ?? 'Erreur envoi rapport')
//   } finally {
//     setRapportLoading(false)
//   }
// }

// ── JSX à ajouter dans le return de Parametres (avant les infos compte) ──

const RapportSection = ({ palette, rapportLoading, handleEnvoyerRapport }) => {
  const now        = new Date()
  const moisLabels = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  const moisCourant = moisLabels[now.getMonth()]
  const moisPrec    = moisLabels[now.getMonth() === 0 ? 11 : now.getMonth() - 1]

  return (
    <div style={{ background: palette.card, border: `1px solid ${palette.cardBorder}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${palette.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: palette.text }}>Rapports mensuels</div>
          <div style={{ fontSize: 12, color: palette.textSub, marginTop: 2 }}>
            Envoyé automatiquement le 1er de chaque mois à 8h00
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {/* Info automatique */}
        <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', marginBottom: 3 }}>Envoi automatique actif</div>
            <div style={{ fontSize: 12, color: palette.textSub, lineHeight: 1.6 }}>
              Chaque 1er du mois, un rapport PDF complet est envoyé automatiquement sur votre email avec les ventes, stocks et performance du mois écoulé.
            </div>
          </div>
        </div>

        {/* Boutons envoi manuel */}
        <div style={{ fontSize: 12, fontWeight: 600, color: palette.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Envoyer maintenant
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleEnvoyerRapport('current')}
            disabled={rapportLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: rapportLoading ? 'not-allowed' : 'pointer', opacity: rapportLoading ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            {rapportLoading
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <span>📧</span>
            }
            Rapport {moisCourant}
          </button>

          <button
            onClick={() => handleEnvoyerRapport('prev')}
            disabled={rapportLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: `1px solid ${palette.cardBorder}`, background: 'transparent', color: palette.text, fontSize: 13, fontWeight: 500, cursor: rapportLoading ? 'not-allowed' : 'pointer', opacity: rapportLoading ? 0.7 : 1, transition: 'all 0.2s' }}
          >
            <span>📄</span>
            Rapport {moisPrec}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RapportSection