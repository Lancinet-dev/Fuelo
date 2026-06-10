// ================================================
// FUELO — Module Comptable
// Tabs : Dashboard | Achats | BL | Dépenses | Transport | Paie
// ================================================
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
  useDashboardComptable,
  useAchats, useCreateAchat, useUpdateAchat, useDeleteAchat,
  useBL, useCreateBL, useSiginerBL,
  useDepenses, useCreateDepense, useDeleteDepense,
  useCoutsTransport, useCreateCoutTransport,
  useFichesPaie, useCreateFichePaie, usePayerFichePaie,
} from '../../hooks/useComptable'

const fmt = (n) => {
  const v = Math.round(parseFloat(n) || 0)
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
const MOIS_NOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'achats',    label: 'Achats' },
  { key: 'bl',        label: 'Bons livraison' },
  { key: 'depenses',  label: 'Dépenses' },
  { key: 'transport', label: 'Transport' },
  { key: 'paie',      label: 'Paie' },
]

const CATEGORIES_DEPENSES = [
  'Loyer', 'Électricité', 'Eau', 'Salaires', 'Carburant fonctionnement',
  'Maintenance', 'Sécurité', 'Nettoyage', 'Publicité', 'Impôts & taxes',
  'Frais bancaires', 'Fournitures', 'Réparations', 'Autre',
]

export default function ComptablePage() {
  const { palette } = useTheme()
  const { user } = useAuth()
  const readOnly = user?.role === 'owner' || user?.role === 'superadmin'
  const now = new Date()
  const [tab, setTab] = useState('dashboard')
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())

  const s = {
    page:    { padding: 24, maxWidth: 1100, margin: '0 auto' },
    header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    titre:   { fontSize: 22, fontWeight: 700, color: palette.text },
    tabs:    { display: 'flex', gap: 4, background: palette.card, borderRadius: 10, padding: 4, marginBottom: 24, overflowX: 'auto' },
    tab:     (active) => ({
      padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
      background: active ? '#2563EB' : 'transparent', color: active ? '#fff' : palette.textSecondary,
      whiteSpace: 'nowrap',
    }),
    periodeRow: { display: 'flex', gap: 8, alignItems: 'center' },
    select: { padding: '6px 10px', borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontSize: 14 },
    card:   { background: palette.card, borderRadius: 12, padding: 20, border: `1px solid ${palette.border}` },
    grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    grid3:  { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
    grid4:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
    label:  { fontSize: 12, color: palette.textSecondary, marginBottom: 4 },
    val:    { fontSize: 20, fontWeight: 700, color: palette.text },
    valSm:  { fontSize: 16, fontWeight: 600, color: palette.text },
    badge:  (ok) => ({ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: ok ? '#dcfce7' : '#fef2f2', color: ok ? '#166534' : '#991b1b' }),
    btn:    { padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
    btnSm:  { padding: '5px 12px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
    btnGrey:{ padding: '5px 12px', background: palette.border, color: palette.text, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
    input:  { padding: '8px 12px', borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text, fontSize: 14, width: '100%', boxSizing: 'border-box' },
    table:  { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th:     { textAlign: 'left', padding: '8px 12px', color: palette.textSecondary, borderBottom: `1px solid ${palette.border}`, fontWeight: 600 },
    td:     { padding: '8px 12px', borderBottom: `1px solid ${palette.border}`, color: palette.text },
    row:    { cursor: 'pointer' },
    alertBox: (danger) => ({ padding: 12, borderRadius: 8, background: danger ? '#fef2f2' : '#fffbeb', borderLeft: `4px solid ${danger ? '#ef4444' : '#f59e0b'}`, marginBottom: 12, fontSize: 13, color: palette.text }),
    green:  { color: '#22c55e', fontWeight: 700 },
    red:    { color: '#ef4444', fontWeight: 700 },
    orange: { color: '#f59e0b', fontWeight: 700 },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.titre}>Comptabilité</h1>
        <div style={s.periodeRow}>
          <select style={s.select} value={mois} onChange={e => setMois(+e.target.value)}>
            {MOIS_NOMS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select style={s.select} value={annee} onChange={e => setAnnee(+e.target.value)}>
            {[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <TabDashboard mois={mois} annee={annee} s={s} palette={palette} />}
      {tab === 'achats'    && <TabAchats    mois={mois} annee={annee} s={s} palette={palette} readOnly={readOnly} />}
      {tab === 'bl'        && <TabBL        s={s} palette={palette} readOnly={readOnly} />}
      {tab === 'depenses'  && <TabDepenses  mois={mois} annee={annee} s={s} palette={palette} readOnly={readOnly} />}
      {tab === 'transport' && <TabTransport mois={mois} annee={annee} s={s} palette={palette} readOnly={readOnly} />}
      {tab === 'paie'      && <TabPaie      mois={mois} annee={annee} s={s} palette={palette} readOnly={readOnly} />}
    </div>
  )
}

// ── Tab Dashboard ──────────────────────────────────────
function TabDashboard({ mois, annee, s, palette }) {
  const { data, isLoading } = useDashboardComptable(mois, annee)
  if (isLoading) return <Skeleton s={s} />
  const st = data?.stats || {}
  const al = data?.alertes || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {al.bl_en_attente > 0 && (
        <div style={s.alertBox(false)}>
          {al.bl_en_attente} bon(s) de livraison en attente de validation
        </div>
      )}
      {al.factures_retard > 0 && (
        <div style={s.alertBox(true)}>
          {al.factures_retard} facture(s) fournisseur en retard de paiement
        </div>
      )}
      {al.marge_negative && (
        <div style={s.alertBox(true)}>Marge brute négative ce mois — vérifiez vos coûts</div>
      )}

      {/* KPIs principaux */}
      <div style={s.grid4}>
        <StatBox label="Chiffre d'affaires" val={`${fmt(st.ca)} GNF`} s={s} />
        <StatBox label="Marge brute" val={`${fmt(st.marge_brute)} GNF`} s={s} accent={st.marge_brute >= 0 ? '#22c55e' : '#ef4444'} />
        <StatBox label="Taux de marge" val={`${st.marge_pct ?? 0} %`} s={s} accent={st.marge_pct >= 0 ? '#22c55e' : '#ef4444'} />
        <StatBox label="Litres vendus" val={`${fmt(st.litres_vendus)} L`} s={s} />
      </div>

      {/* Détail coûts */}
      <div style={s.grid4}>
        <StatBox label="Achats carburant" val={`${fmt(st.achats)} GNF`} s={s} />
        <StatBox label="Coûts transport" val={`${fmt(st.transport)} GNF`} s={s} />
        <StatBox label="Dépenses" val={`${fmt(st.depenses)} GNF`} s={s} />
        <StatBox label="Masse salariale" val={`${fmt(st.paie)} GNF`} s={s} />
      </div>

      {/* Prix revient */}
      <div style={s.grid3}>
        <StatBox label="Prix achat moyen / L" val={`${fmt(st.prix_achat_moyen)} GNF`} s={s} />
        <StatBox label="Coût transport / L"   val={`${fmt(st.cout_transport_litre)} GNF`} s={s} />
        <StatBox label="Prix de revient / L"  val={`${fmt(st.prix_revient)} GNF`} s={s} accent="#2563EB" />
      </div>

      <div style={s.grid2}>
        {/* Dépenses par catégorie */}
        <div style={s.card}>
          <p style={{ fontWeight: 600, marginBottom: 12, color: palette.text }}>Dépenses par catégorie</p>
          {(data?.depenses_par_categorie || []).length === 0
            ? <p style={{ color: palette.textSecondary, fontSize: 13 }}>Aucune dépense ce mois</p>
            : (data.depenses_par_categorie).map(d => (
              <div key={d.categorie} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${palette.border}`, fontSize: 13 }}>
                <span style={{ color: palette.text }}>{d.categorie}</span>
                <span style={{ fontWeight: 600, color: palette.text }}>{fmt(d.total)} GNF</span>
              </div>
            ))
          }
        </div>

        {/* Historique CA 6 mois */}
        <div style={s.card}>
          <p style={{ fontWeight: 600, marginBottom: 12, color: palette.text }}>CA — 6 derniers mois</p>
          {(data?.historique || []).map((h, i) => {
            const d = new Date(h.mois)
            const label = MOIS_NOMS[d.getMonth()] + ' ' + d.getFullYear()
            const max = Math.max(...(data.historique.map(x => parseFloat(x.ca)) || [1]))
            const pct = max > 0 ? (parseFloat(h.ca) / max) * 100 : 0
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: palette.textSecondary, marginBottom: 2 }}>
                  <span>{label}</span><span>{fmt(h.ca)} GNF</span>
                </div>
                <div style={{ height: 6, background: palette.border, borderRadius: 99 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#2563EB', borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab Achats ────────────────────────────────────────
function TabAchats({ mois, annee, s, palette, readOnly }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fournisseur:'', type_carburant:'essence', quantite_commandee:'', quantite_recue:'', prix_unitaire_ht:'', tva_taux:'18', numero_bl:'', numero_facture:'', date_echeance:'', statut_paiement:'non_paye', depot_origine:'', notes:'' })
  const { data, isLoading } = useAchats({ mois, annee })
  const create = useCreateAchat()
  const update = useUpdateAchat()
  const remove = useDeleteAchat()

  const prixHT = parseFloat(form.quantite_recue || 0) * parseFloat(form.prix_unitaire_ht || 0)
  const ttc    = prixHT * (1 + parseFloat(form.tva_taux || 0) / 100)

  const submit = async (e) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowForm(false)
    setForm({ fournisseur:'', type_carburant:'essence', quantite_commandee:'', quantite_recue:'', prix_unitaire_ht:'', tva_taux:'18', numero_bl:'', numero_facture:'', date_echeance:'', statut_paiement:'non_paye', depot_origine:'', notes:'' })
  }

  return (
    <div>
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button style={s.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Nouvel achat'}
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Fournisseur *" value={form.fournisseur} onChange={v => setForm({...form, fournisseur: v})} s={s} />
            <div>
              <p style={s.label}>Type carburant</p>
              <select style={s.input} value={form.type_carburant} onChange={e => setForm({...form, type_carburant: e.target.value})}>
                <option value="essence">Essence</option>
                <option value="gasoil">Gasoil</option>
                <option value="kerosene">Kérosène</option>
              </select>
            </div>
            <FormField label="Qté commandée (L)" value={form.quantite_commandee} onChange={v => setForm({...form, quantite_commandee: v})} s={s} type="number" />
            <FormField label="Qté reçue (L)" value={form.quantite_recue} onChange={v => setForm({...form, quantite_recue: v})} s={s} type="number" />
            <FormField label="Prix unitaire HT (GNF/L) *" value={form.prix_unitaire_ht} onChange={v => setForm({...form, prix_unitaire_ht: v})} s={s} type="number" />
            <FormField label="TVA (%)" value={form.tva_taux} onChange={v => setForm({...form, tva_taux: v})} s={s} type="number" />
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 16, padding: '8px 12px', background: palette.bg, borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: palette.textSecondary }}>Montant HT : <strong style={{ color: palette.text }}>{fmt(prixHT)} GNF</strong></span>
              <span style={{ color: palette.textSecondary }}>TTC : <strong style={{ color: '#2563EB' }}>{fmt(ttc)} GNF</strong></span>
            </div>
            <FormField label="N° BL" value={form.numero_bl} onChange={v => setForm({...form, numero_bl: v})} s={s} />
            <FormField label="N° Facture" value={form.numero_facture} onChange={v => setForm({...form, numero_facture: v})} s={s} />
            <FormField label="Date échéance" value={form.date_echeance} onChange={v => setForm({...form, date_echeance: v})} s={s} type="date" />
            <div>
              <p style={s.label}>Statut paiement</p>
              <select style={s.input} value={form.statut_paiement} onChange={e => setForm({...form, statut_paiement: e.target.value})}>
                <option value="non_paye">Non payé</option>
                <option value="partiel">Partiel</option>
                <option value="paye">Payé</option>
              </select>
            </div>
            <FormField label="Dépôt origine" value={form.depot_origine} onChange={v => setForm({...form, depot_origine: v})} s={s} />
            <FormField label="Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} s={s} />
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={s.btnGrey} onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" style={s.btn} disabled={create.isPending}>
                {create.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Skeleton s={s} /> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th><th style={s.th}>Fournisseur</th><th style={s.th}>Type</th>
                <th style={s.th}>Qté reçue</th><th style={s.th}>Prix/L</th><th style={s.th}>TTC</th>
                <th style={s.th}>N° BL</th><th style={s.th}>Statut</th><th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {(data?.achats || []).map(a => (
                <tr key={a.id}>
                  <td style={s.td}>{new Date(a.date_achat).toLocaleDateString('fr-GN')}</td>
                  <td style={s.td}>{a.fournisseur}</td>
                  <td style={s.td}>{a.type_carburant}</td>
                  <td style={s.td}>{fmt(a.quantite_recue)} L</td>
                  <td style={s.td}>{fmt(a.prix_unitaire_ht)}</td>
                  <td style={s.td}><strong>{fmt(a.montant_ttc)} GNF</strong></td>
                  <td style={s.td}>{a.numero_bl || '—'}</td>
                  <td style={s.td}><StatutPaiementBadge statut={a.statut_paiement} /></td>
                  <td style={s.td}>
                    {!readOnly && a.statut_paiement !== 'paye' && (
                      <button style={s.btnSm} onClick={() => update.mutate({ id: a.id, statut_paiement: 'paye' })}>
                        Marquer payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.achats || []).length === 0 && (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: palette.textSecondary }}>Aucun achat ce mois</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab BL ────────────────────────────────────────────
function TabBL({ s, palette, readOnly }) {
  const [showForm, setShowForm] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('')
  const [form, setForm] = useState({ numero_bl:'', fournisseur:'', type_carburant:'essence', quantite_commandee:'', quantite_livree:'', chauffeur_nom:'', depot_origine:'', reserves:'' })
  const { data, isLoading } = useBL({ statut: filtreStatut || undefined })
  const create = useCreateBL()
  const signer = useSiginerBL()

  const submit = async (e) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowForm(false)
    setForm({ numero_bl:'', fournisseur:'', type_carburant:'essence', quantite_commandee:'', quantite_livree:'', chauffeur_nom:'', depot_origine:'', reserves:'' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <select style={s.select} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validé</option>
          <option value="litige">Litige</option>
        </select>
        {!readOnly && (
          <button style={s.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Nouveau BL'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="N° BL *" value={form.numero_bl} onChange={v => setForm({...form, numero_bl: v})} s={s} />
            <FormField label="Fournisseur *" value={form.fournisseur} onChange={v => setForm({...form, fournisseur: v})} s={s} />
            <div>
              <p style={s.label}>Type carburant</p>
              <select style={s.input} value={form.type_carburant} onChange={e => setForm({...form, type_carburant: e.target.value})}>
                <option value="essence">Essence</option>
                <option value="gasoil">Gasoil</option>
                <option value="kerosene">Kérosène</option>
              </select>
            </div>
            <FormField label="Qté commandée (L) *" value={form.quantite_commandee} onChange={v => setForm({...form, quantite_commandee: v})} s={s} type="number" />
            <FormField label="Qté livrée (L)" value={form.quantite_livree} onChange={v => setForm({...form, quantite_livree: v})} s={s} type="number" />
            <FormField label="Chauffeur" value={form.chauffeur_nom} onChange={v => setForm({...form, chauffeur_nom: v})} s={s} />
            <FormField label="Dépôt origine" value={form.depot_origine} onChange={v => setForm({...form, depot_origine: v})} s={s} />
            <FormField label="Réserves / observations" value={form.reserves} onChange={v => setForm({...form, reserves: v})} s={s} />
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={s.btnGrey} onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" style={s.btn} disabled={create.isPending}>
                {create.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Skeleton s={s} /> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th><th style={s.th}>N° BL</th><th style={s.th}>Fournisseur</th>
                <th style={s.th}>Type</th><th style={s.th}>Commandé</th><th style={s.th}>Livré</th>
                <th style={s.th}>Écart</th><th style={s.th}>Statut</th><th style={s.th}>Signatures</th>
              </tr>
            </thead>
            <tbody>
              {(data?.bls || []).map(bl => {
                const ecart = parseFloat(bl.ecart) || 0
                return (
                  <tr key={bl.id}>
                    <td style={s.td}>{new Date(bl.date_livraison).toLocaleDateString('fr-GN')}</td>
                    <td style={s.td}><strong>{bl.numero_bl}</strong></td>
                    <td style={s.td}>{bl.fournisseur}</td>
                    <td style={s.td}>{bl.type_carburant}</td>
                    <td style={s.td}>{fmt(bl.quantite_commandee)} L</td>
                    <td style={s.td}>{bl.quantite_livree ? `${fmt(bl.quantite_livree)} L` : '—'}</td>
                    <td style={s.td}>
                      {ecart !== 0 && <span style={ecart < 0 ? s.red : s.green}>{ecart > 0 ? '+' : ''}{fmt(ecart)} L</span>}
                    </td>
                    <td style={s.td}><StatutBLBadge statut={bl.statut} /></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ ...s.btnSm, background: bl.signe_chauffeur ? '#22c55e' : palette.border, color: bl.signe_chauffeur ? '#fff' : palette.text, cursor: 'default', ...(readOnly ? {} : { cursor: 'pointer' }) }}
                          onClick={() => !readOnly && !bl.signe_chauffeur && signer.mutate({ id: bl.id, qui: 'chauffeur' })}>
                          Chauffeur {bl.signe_chauffeur ? '✓' : ''}
                        </span>
                        <span style={{ ...s.btnSm, background: bl.signe_receptionnaire ? '#22c55e' : palette.border, color: bl.signe_receptionnaire ? '#fff' : palette.text, cursor: 'default', ...(readOnly ? {} : { cursor: 'pointer' }) }}
                          onClick={() => !readOnly && !bl.signe_receptionnaire && signer.mutate({ id: bl.id, qui: 'receptionnaire' })}>
                          Réceptionnaire {bl.signe_receptionnaire ? '✓' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(data?.bls || []).length === 0 && (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: palette.textSecondary }}>Aucun bon de livraison</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab Dépenses ───────────────────────────────────────
function TabDepenses({ mois, annee, s, palette, readOnly }) {
  const [showForm, setShowForm] = useState(false)
  const [filtreCat, setFiltreCat] = useState('')
  const [form, setForm] = useState({ categorie: '', description: '', montant: '', date_depense: '' })
  const { data, isLoading } = useDepenses({ mois, annee, categorie: filtreCat || undefined })
  const create = useCreateDepense()
  const remove = useDeleteDepense()

  const submit = async (e) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowForm(false)
    setForm({ categorie: '', description: '', montant: '', date_depense: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select style={s.select} value={filtreCat} onChange={e => setFiltreCat(e.target.value)}>
            <option value="">Toutes catégories</option>
            {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {data?.total_montant > 0 && (
            <span style={{ fontSize: 14, color: palette.textSecondary }}>
              Total : <strong style={{ color: palette.text }}>{fmt(data.total_montant)} GNF</strong>
            </span>
          )}
        </div>
        {!readOnly && (
          <button style={s.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Nouvelle dépense'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={s.label}>Catégorie *</p>
              <select style={s.input} value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} required>
                <option value="">Choisir...</option>
                {CATEGORIES_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <FormField label="Montant (GNF) *" value={form.montant} onChange={v => setForm({...form, montant: v})} s={s} type="number" />
            <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} s={s} />
            <FormField label="Date" value={form.date_depense} onChange={v => setForm({...form, date_depense: v})} s={s} type="date" />
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={s.btnGrey} onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" style={s.btn} disabled={create.isPending}>
                {create.isPending ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Skeleton s={s} /> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Date</th><th style={s.th}>Catégorie</th><th style={s.th}>Description</th>
                <th style={s.th}>Montant</th><th style={s.th}>Enregistré par</th><th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {(data?.depenses || []).map(d => (
                <tr key={d.id}>
                  <td style={s.td}>{new Date(d.date_depense).toLocaleDateString('fr-GN')}</td>
                  <td style={s.td}>{d.categorie}</td>
                  <td style={s.td}>{d.description || '—'}</td>
                  <td style={s.td}><strong>{fmt(d.montant)} GNF</strong></td>
                  <td style={s.td}>{d.createur || '—'}</td>
                  <td style={s.td}>
                    {!readOnly && (
                      <button style={{ ...s.btnSm, background: '#fef2f2', color: '#ef4444' }}
                        onClick={() => window.confirm('Supprimer cette dépense ?') && remove.mutate(d.id)}>
                        Suppr.
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.depenses || []).length === 0 && (
                <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: palette.textSecondary }}>Aucune dépense ce mois</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab Transport ──────────────────────────────────────
function TabTransport({ mois, annee, s, palette, readOnly }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ trajet_id:'', litres_transportes:'', carburant_camion:'', peages:'', prime_chauffeur:'', autres_frais:'' })
  const { data, isLoading } = useCoutsTransport({ mois, annee })
  const create = useCreateCoutTransport()

  const total = ['carburant_camion','peages','prime_chauffeur','autres_frais'].reduce((s,k) => s + parseFloat(form[k]||0), 0)
  const cpl   = parseFloat(form.litres_transportes) > 0 ? total / parseFloat(form.litres_transportes) : 0

  const submit = async (e) => {
    e.preventDefault()
    await create.mutateAsync(form)
    setShowForm(false)
    setForm({ trajet_id:'', litres_transportes:'', carburant_camion:'', peages:'', prime_chauffeur:'', autres_frais:'' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        {!readOnly && (
          <button style={s.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Nouveau coût transport'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="ID Trajet *" value={form.trajet_id} onChange={v => setForm({...form, trajet_id: v})} s={s} type="number" />
            <FormField label="Litres transportés" value={form.litres_transportes} onChange={v => setForm({...form, litres_transportes: v})} s={s} type="number" />
            <FormField label="Carburant camion (GNF)" value={form.carburant_camion} onChange={v => setForm({...form, carburant_camion: v})} s={s} type="number" />
            <FormField label="Péages (GNF)" value={form.peages} onChange={v => setForm({...form, peages: v})} s={s} type="number" />
            <FormField label="Prime chauffeur (GNF)" value={form.prime_chauffeur} onChange={v => setForm({...form, prime_chauffeur: v})} s={s} type="number" />
            <FormField label="Autres frais (GNF)" value={form.autres_frais} onChange={v => setForm({...form, autres_frais: v})} s={s} type="number" />
            <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: palette.bg, borderRadius: 8, fontSize: 13, display: 'flex', gap: 16 }}>
              <span style={{ color: palette.textSecondary }}>Total : <strong style={{ color: palette.text }}>{fmt(total)} GNF</strong></span>
              {cpl > 0 && <span style={{ color: palette.textSecondary }}>Coût/L : <strong style={{ color: '#2563EB' }}>{fmt(cpl)} GNF</strong></span>}
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" style={s.btnGrey} onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" style={s.btn} disabled={create.isPending}>
                {create.isPending ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? <Skeleton s={s} /> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Trajet #</th><th style={s.th}>Chauffeur</th><th style={s.th}>Carburant</th>
                <th style={s.th}>Péages</th><th style={s.th}>Prime</th><th style={s.th}>Autres</th>
                <th style={s.th}>Total</th><th style={s.th}>Litres</th><th style={s.th}>Coût/L</th>
              </tr>
            </thead>
            <tbody>
              {(data?.couts || []).map(c => (
                <tr key={c.id}>
                  <td style={s.td}>#{c.trajet_id}</td>
                  <td style={s.td}>{c.chauffeur_nom || '—'}</td>
                  <td style={s.td}>{fmt(c.carburant_camion)}</td>
                  <td style={s.td}>{fmt(c.peages)}</td>
                  <td style={s.td}>{fmt(c.prime_chauffeur)}</td>
                  <td style={s.td}>{fmt(c.autres_frais)}</td>
                  <td style={s.td}><strong>{fmt(c.cout_total)} GNF</strong></td>
                  <td style={s.td}>{fmt(c.litres_transportes)} L</td>
                  <td style={s.td}>{fmt(c.cout_par_litre)} GNF/L</td>
                </tr>
              ))}
              {(data?.couts || []).length === 0 && (
                <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: palette.textSecondary }}>Aucun coût enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Tab Paie ──────────────────────────────────────────
function TabPaie({ mois, annee, s, palette, readOnly }) {
  const [showForm, setShowForm] = useState(false)
  const [selectedEmploye, setSelectedEmploye] = useState(null)
  const [form, setForm] = useState({ salaire_base:'', primes:'', avances:'', retenues:'', notes:'' })
  const { data, isLoading } = useFichesPaie({ mois, annee })
  const create = useCreateFichePaie()
  const payer  = usePayerFichePaie()

  const net = parseFloat(form.salaire_base||0) + parseFloat(form.primes||0) - parseFloat(form.avances||0) - parseFloat(form.retenues||0)

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedEmploye) return
    await create.mutateAsync({ user_id: selectedEmploye.id, mois, annee, ...form })
    setShowForm(false)
    setSelectedEmploye(null)
    setForm({ salaire_base:'', primes:'', avances:'', retenues:'', notes:'' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <p style={{ color: palette.textSecondary, fontSize: 14 }}>
          {MOIS_NOMS[mois-1]} {annee} — {data?.fiches?.length || 0} fiche(s)
        </p>
        {!readOnly && (
          <button style={s.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Nouvelle fiche'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: palette.text, marginBottom: 12 }}>Nouvelle fiche de paie</p>
          {/* Employés sans fiche */}
          {(data?.employes_sans_fiche || []).length > 0 && !selectedEmploye && (
            <div style={{ marginBottom: 16 }}>
              <p style={s.label}>Choisir un employé</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.employes_sans_fiche.map(e => (
                  <button key={e.id} style={{ ...s.btnGrey, padding: '8px 14px' }} onClick={() => setSelectedEmploye(e)}>
                    {e.nom} <span style={{ opacity: 0.7, fontSize: 11 }}>({e.role})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedEmploye && (
            <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: palette.bg, borderRadius: 8, fontSize: 13, color: palette.text }}>
                Fiche pour : <strong>{selectedEmploye.nom}</strong> ({selectedEmploye.role})
              </div>
              <FormField label="Salaire de base (GNF) *" value={form.salaire_base} onChange={v => setForm({...form, salaire_base: v})} s={s} type="number" />
              <FormField label="Primes (GNF)" value={form.primes} onChange={v => setForm({...form, primes: v})} s={s} type="number" />
              <FormField label="Avances déduites (GNF)" value={form.avances} onChange={v => setForm({...form, avances: v})} s={s} type="number" />
              <FormField label="Autres retenues (GNF)" value={form.retenues} onChange={v => setForm({...form, retenues: v})} s={s} type="number" />
              <div style={{ gridColumn: '1/-1', padding: '8px 12px', background: palette.bg, borderRadius: 8, fontSize: 14 }}>
                Salaire net : <strong style={{ color: net >= 0 ? '#22c55e' : '#ef4444', fontSize: 18 }}>{fmt(net)} GNF</strong>
              </div>
              <FormField label="Notes" value={form.notes} onChange={v => setForm({...form, notes: v})} s={s} />
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" style={s.btnGrey} onClick={() => { setShowForm(false); setSelectedEmploye(null) }}>Annuler</button>
                <button type="submit" style={s.btn} disabled={create.isPending}>
                  {create.isPending ? '...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {isLoading ? <Skeleton s={s} /> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Employé</th><th style={s.th}>Rôle</th><th style={s.th}>Base</th>
                <th style={s.th}>Primes</th><th style={s.th}>Avances</th><th style={s.th}>Net</th>
                <th style={s.th}>Statut</th><th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {(data?.fiches || []).map(f => (
                <tr key={f.id}>
                  <td style={s.td}><strong>{f.nom}</strong></td>
                  <td style={s.td}>{f.role}</td>
                  <td style={s.td}>{fmt(f.salaire_base)} GNF</td>
                  <td style={s.td}><span style={s.green}>{fmt(f.primes)} GNF</span></td>
                  <td style={s.td}><span style={s.red}>{fmt(parseFloat(f.avances)+parseFloat(f.retenues))} GNF</span></td>
                  <td style={s.td}><strong style={{ fontSize: 15 }}>{fmt(f.salaire_net)} GNF</strong></td>
                  <td style={s.td}>
                    <span style={s.badge(f.statut === 'paye')}>
                      {f.statut === 'paye' ? 'Payé' : 'En attente'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {!readOnly && f.statut !== 'paye' && (
                      <button style={s.btnSm} onClick={() => payer.mutate(f.id)}>Marquer payé</button>
                    )}
                  </td>
                </tr>
              ))}
              {(data?.fiches || []).length === 0 && (
                <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: palette.textSecondary }}>Aucune fiche ce mois</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Composants utilitaires ────────────────────────────
function StatBox({ label, val, s, accent }) {
  return (
    <div style={s.card}>
      <p style={s.label}>{label}</p>
      <p style={{ ...s.val, color: accent || s.val.color }}>{val}</p>
    </div>
  )
}

function FormField({ label, value, onChange, s, type = 'text' }) {
  return (
    <div>
      <p style={s.label}>{label}</p>
      <input style={s.input} type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function StatutPaiementBadge({ statut }) {
  const colors = { non_paye: ['#fef2f2','#991b1b'], partiel: ['#fffbeb','#92400e'], paye: ['#dcfce7','#166534'] }
  const [bg, color] = colors[statut] || colors.non_paye
  const labels = { non_paye: 'Non payé', partiel: 'Partiel', paye: 'Payé' }
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color }}>{labels[statut] || statut}</span>
}

function StatutBLBadge({ statut }) {
  const colors = { en_attente: ['#fffbeb','#92400e'], valide: ['#dcfce7','#166534'], litige: ['#fef2f2','#991b1b'] }
  const [bg, color] = colors[statut] || colors.en_attente
  const labels = { en_attente: 'En attente', valide: 'Validé', litige: 'Litige' }
  return <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: bg, color }}>{labels[statut] || statut}</span>
}

function Skeleton({ s }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1,2,3].map(i => <div key={i} style={{ ...s.card, height: 60, opacity: 0.4 }} />)}
    </div>
  )
}
