import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import {
  useDashboardComptable, useAchats, useCreateAchat, useDeleteAchat,
  useBL, useCreateBL, useSiginerBL,
  useDepenses, useCreateDepense, useDeleteDepense,
  useCoutsTransport, useCreateCoutTransport,
  useFichesPaie, useCreateFichePaie, usePayerFichePaie,
} from '../../hooks/useComptable'

const fmt = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Md'
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M'
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
const fmtGNF = (n) => (n === null || n === undefined || isNaN(n)) ? '—' : fmt(n) + ' GNF'
const varColor = (v) => (v === null || v === undefined) ? '#94a3b8' : v >= 0 ? '#22c55e' : '#ef4444'

const MOIS_NOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const PIE_COLORS = ['#2563eb','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316']

const TAB_IDS = ['dashboard','achats','bl','depenses','transport','paie','rapports']
const TAB_LABELS = ['Dashboard','Achats','BL','Dépenses','Transport','Paie','Rapports']

// ═══════════════════════════════════════════════════════════
export default function ComptablePage() {
  const { user } = useAuth()
  const readOnly = user?.role === 'owner' || user?.role === 'superadmin'

  const now = new Date()
  const [mois, setMois]   = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [tab, setTab]     = useState('dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#020817', color: '#e2e8f0', fontFamily: '"DM Sans", system-ui, sans-serif', paddingBottom: 60 }}>
      {/* Header sticky */}
      <div style={{ padding: '20px 32px 0', borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f8fafc', letterSpacing: -0.5 }}>Finance & Comptabilité</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#475569' }}>
              {readOnly ? 'Vue lecture — owner' : 'Tableau de bord financier'} · {MOIS_NOMS[mois-1]} {annee}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={mois} onChange={e => setMois(+e.target.value)} style={selStyle}>
              {MOIS_NOMS.map((n,i) => <option key={i} value={i+1}>{n}</option>)}
            </select>
            <select value={annee} onChange={e => setAnnee(+e.target.value)} style={selStyle}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {readOnly && (
              <span style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: 11, color: '#f59e0b', fontWeight: 600, letterSpacing: 0.5 }}>LECTURE SEULE</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TAB_IDS.map((id, i) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #38bdf8' : '2px solid transparent', color: tab === id ? '#38bdf8' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {TAB_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px 32px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {tab === 'dashboard' && <TabDashboard mois={mois} annee={annee} readOnly={readOnly} />}
            {tab === 'achats'    && <TabAchats mois={mois} annee={annee} readOnly={readOnly} />}
            {tab === 'bl'        && <TabBL readOnly={readOnly} />}
            {tab === 'depenses'  && <TabDepenses mois={mois} annee={annee} readOnly={readOnly} />}
            {tab === 'transport' && <TabTransport mois={mois} annee={annee} readOnly={readOnly} />}
            {tab === 'paie'      && <TabPaie mois={mois} annee={annee} readOnly={readOnly} />}
            {tab === 'rapports'  && <TabRapports mois={mois} annee={annee} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function TabDashboard({ mois, annee }) {
  const { data, isLoading } = useDashboardComptable(mois, annee)

  if (isLoading) return <LoadingGrid />

  const s = data?.stats || {}
  const alertes = data?.alertes || {}
  const ca30j = data?.ca_30j || []
  const depCat = data?.depenses_par_categorie || []
  const prixEvol = data?.prix_achat_evol || []
  const volTypes = data?.volumes_par_type || []

  const statsCards = [
    { label: "Chiffre d'affaires", val: s.ca, unit: 'GNF', variation: s.ca_var, icon: '📈', color: '#22c55e' },
    { label: 'Marge brute', val: s.marge_brute, unit: `GNF · ${s.marge_pct ?? 0}% du CA`, icon: '💹', color: s.marge_brute >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'Coût achats', val: s.achats, unit: 'GNF', variation: s.achats_var, icon: '⛽', color: '#f59e0b' },
    { label: 'Dépenses', val: s.depenses, unit: 'GNF', variation: s.depenses_var, icon: '💸', color: '#ef4444' },
    { label: 'Coût transport', val: s.transport, unit: 'GNF', icon: '🚛', color: '#8b5cf6' },
    { label: 'Masse salariale', val: s.paie, unit: 'GNF', icon: '👥', color: '#06b6d4' },
    { label: 'Prix achat moyen', val: s.prix_achat_moyen, unit: 'GNF/L', icon: '📊', color: '#f97316' },
    { label: 'Prix vente moyen', val: s.prix_vente_moyen, unit: 'GNF/L', icon: '💰', color: '#a78bfa' },
  ]

  return (
    <div>
      {/* Alertes */}
      {(alertes.bl_en_attente > 0 || alertes.factures_retard > 0 || alertes.marge_negative) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {alertes.bl_en_attente > 0 && <AlertBadge color="#f59e0b" text={`⚠️ ${alertes.bl_en_attente} BL en attente de signature`} />}
          {alertes.factures_retard > 0 && <AlertBadge color="#ef4444" text={`🔴 ${alertes.factures_retard} facture(s) en retard`} />}
          {alertes.marge_negative && <AlertBadge color="#ef4444" text="📉 Marge brute négative ce mois" />}
        </motion.div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 28 }}>
        {statsCards.map((c, i) => <KpiCard key={i} {...c} index={i} />)}
      </div>

      {/* Charts ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Chiffre d'affaires — 30 derniers jours" subtitle="Évolution quotidienne (GNF)">
          {ca30j.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ca30j} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
                <XAxis dataKey="jour" tickFormatter={d => d ? d.slice(8) : ''} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [fmtGNF(v), 'CA']} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ca" stroke="#2563eb" strokeWidth={2} fill="url(#gradCA)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Répartition dépenses" subtitle="Par catégorie">
          {depCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={depCat} cx="50%" cy="48%" outerRadius={75} dataKey="total" nameKey="categorie" label={({ percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {depCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtGNF(v)} contentStyle={tooltipStyle} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Charts ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <ChartCard title="Évolution prix achat carburant" subtitle="90 derniers jours — GNF/L">
          {prixEvol.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={prixEvol} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
                <XAxis dataKey="jour" tickFormatter={d => d ? d.slice(5) : ''} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [fmt(v) + ' GNF/L', 'Prix achat']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="prix" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Volumes vendus par type" subtitle="Litres — ce mois">
          {volTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volTypes} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="gradG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" />
                <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [fmt(v) + ' L', 'Litres']} contentStyle={tooltipStyle} />
                <Bar dataKey="litres" radius={[4,4,0,0]}>
                  {volTypes.map((_, i) => <Cell key={i} fill={i === 0 ? 'url(#gradE)' : 'url(#gradG)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* Compte de résultat */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase' }}>Compte de résultat simplifié</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
          {[
            { label: 'CA total', val: s.ca, color: '#22c55e' },
            { label: '— Achats carburant', val: s.achats, color: '#ef4444' },
            { label: '— Coût transport', val: s.transport, color: '#ef4444' },
            { label: '— Dépenses', val: s.depenses, color: '#ef4444' },
            { label: '— Masse salariale', val: s.paie, color: '#ef4444' },
            { label: '= Résultat net', val: s.marge_brute, color: s.marge_brute >= 0 ? '#22c55e' : '#ef4444', bold: true },
          ].map((r, i) => (
            <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: `3px solid ${r.color}` }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 5 }}>{r.label}</div>
              <div style={{ fontSize: r.bold ? 18 : 15, fontWeight: r.bold ? 800 : 600, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{fmtGNF(r.val)}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ACHATS
// ═══════════════════════════════════════════════════════════
function TabAchats({ mois, annee, readOnly }) {
  const { data, isLoading } = useAchats({ mois, annee })
  const createAchat = useCreateAchat()
  const deleteAchat = useDeleteAchat()
  const emptyForm = { fournisseur:'', date_achat:'', type_carburant:'essence', quantite_commandee:'', quantite_recue:'', prix_unitaire_ht:'', date_echeance:'' }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const achats = data?.achats || []

  const handleCreate = async (e) => {
    e.preventDefault()
    await createAchat.mutateAsync(form)
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <TabHeader title="Achats carburant" count={achats.length} onAdd={!readOnly ? () => setShowForm(true) : null} btnLabel="Nouvel achat" />

      {showForm && (
        <FormCard onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <FormGrid>
              <FormField label="Fournisseur" required><input style={inputStyle} value={form.fournisseur} onChange={e => setForm(p=>({...p,fournisseur:e.target.value}))} required /></FormField>
              <FormField label="Date achat" required><input type="date" style={inputStyle} value={form.date_achat} onChange={e => setForm(p=>({...p,date_achat:e.target.value}))} required /></FormField>
              <FormField label="Type">
                <select style={inputStyle} value={form.type_carburant} onChange={e => setForm(p=>({...p,type_carburant:e.target.value}))}>
                  <option value="essence">Essence</option><option value="gasoil">Gasoil</option>
                </select>
              </FormField>
              <FormField label="Qté commandée (L)"><input type="number" style={inputStyle} value={form.quantite_commandee} onChange={e => setForm(p=>({...p,quantite_commandee:e.target.value}))} /></FormField>
              <FormField label="Qté reçue (L)" required><input type="number" style={inputStyle} value={form.quantite_recue} onChange={e => setForm(p=>({...p,quantite_recue:e.target.value}))} required /></FormField>
              <FormField label="Prix HT (GNF/L)" required><input type="number" style={inputStyle} value={form.prix_unitaire_ht} onChange={e => setForm(p=>({...p,prix_unitaire_ht:e.target.value}))} required /></FormField>
              <FormField label="Échéance paiement"><input type="date" style={inputStyle} value={form.date_echeance} onChange={e => setForm(p=>({...p,date_echeance:e.target.value}))} /></FormField>
            </FormGrid>
            <FormActions onCancel={() => setShowForm(false)} loading={createAchat.isPending} />
          </form>
        </FormCard>
      )}

      {isLoading ? <LoadingTable /> : (
        <DataTable headers={['Fournisseur','Date','Type','Qté cmd','Qté reçue','Prix HT/L','Montant TTC','Statut','']}>
          {achats.map(a => (
            <tr key={a.id} style={trStyle}>
              <td style={{ ...tdStyle, fontWeight: 600, color: '#e2e8f0' }}>{a.fournisseur}</td>
              <td style={tdStyle}>{a.date_achat?.slice(0,10)}</td>
              <td style={tdStyle}><TypeBadge type={a.type_carburant} /></td>
              <td style={tdNumStyle}>{fmt(a.quantite_commandee)} L</td>
              <td style={tdNumStyle}>{fmt(a.quantite_recue)} L</td>
              <td style={tdNumStyle}>{fmt(a.prix_unitaire_ht)}</td>
              <td style={{ ...tdNumStyle, color: '#22c55e', fontWeight: 700 }}>{fmtGNF(a.montant_ttc)}</td>
              <td style={tdStyle}><StatutBadge statut={a.statut_paiement} /></td>
              <td style={tdStyle}>{!readOnly && <button onClick={() => deleteAchat.mutate(a.id)} style={btnDangerSmall}>Suppr.</button>}</td>
            </tr>
          ))}
          {achats.length === 0 && <EmptyRow cols={9} />}
        </DataTable>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// BL
// ═══════════════════════════════════════════════════════════
function TabBL({ readOnly }) {
  const { data, isLoading } = useBL()
  const createBL = useCreateBL()
  const signerBL = useSiginerBL()
  const emptyForm = { numero_bl:'', fournisseur:'', date_livraison:'', type_carburant:'essence', quantite_livree:'', reference_commande:'' }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const bls = data?.bls || []

  const handleCreate = async (e) => {
    e.preventDefault()
    await createBL.mutateAsync(form)
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <TabHeader title="Bons de livraison" count={bls.length} onAdd={!readOnly ? () => setShowForm(true) : null} btnLabel="Nouveau BL" />

      {showForm && (
        <FormCard onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <FormGrid>
              <FormField label="N° BL" required><input style={inputStyle} value={form.numero_bl} onChange={e => setForm(p=>({...p,numero_bl:e.target.value}))} required /></FormField>
              <FormField label="Fournisseur" required><input style={inputStyle} value={form.fournisseur} onChange={e => setForm(p=>({...p,fournisseur:e.target.value}))} required /></FormField>
              <FormField label="Date livraison" required><input type="date" style={inputStyle} value={form.date_livraison} onChange={e => setForm(p=>({...p,date_livraison:e.target.value}))} required /></FormField>
              <FormField label="Type">
                <select style={inputStyle} value={form.type_carburant} onChange={e => setForm(p=>({...p,type_carburant:e.target.value}))}>
                  <option value="essence">Essence</option><option value="gasoil">Gasoil</option>
                </select>
              </FormField>
              <FormField label="Quantité livrée (L)" required><input type="number" style={inputStyle} value={form.quantite_livree} onChange={e => setForm(p=>({...p,quantite_livree:e.target.value}))} required /></FormField>
              <FormField label="Réf. commande"><input style={inputStyle} value={form.reference_commande} onChange={e => setForm(p=>({...p,reference_commande:e.target.value}))} /></FormField>
            </FormGrid>
            <FormActions onCancel={() => setShowForm(false)} loading={createBL.isPending} />
          </form>
        </FormCard>
      )}

      {isLoading ? <LoadingTable /> : (
        <DataTable headers={['N° BL','Fournisseur','Date','Type','Qté livrée','Statut','Signé par','']}>
          {bls.map(b => (
            <tr key={b.id} style={trStyle}>
              <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#38bdf8', fontSize: 12 }}>{b.numero_bl}</td>
              <td style={tdStyle}>{b.fournisseur}</td>
              <td style={tdStyle}>{b.date_livraison?.slice(0,10)}</td>
              <td style={tdStyle}><TypeBadge type={b.type_carburant} /></td>
              <td style={tdNumStyle}>{fmt(b.quantite_livree)} L</td>
              <td style={tdStyle}><StatutBLBadge statut={b.statut} /></td>
              <td style={tdStyle}>{b.signe_par || '—'}</td>
              <td style={tdStyle}>{!readOnly && b.statut === 'en_attente' && <button onClick={() => signerBL.mutate({ id: b.id, qui: 'comptable' })} style={btnPrimarySmall}>Signer</button>}</td>
            </tr>
          ))}
          {bls.length === 0 && <EmptyRow cols={8} />}
        </DataTable>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DEPENSES
// ═══════════════════════════════════════════════════════════
function TabDepenses({ mois, annee, readOnly }) {
  const { data, isLoading } = useDepenses({ mois, annee })
  const createDep = useCreateDepense()
  const deleteDep = useDeleteDepense()
  const CATS = ['carburant_exploitation','loyer','salaires','maintenance','electricite','eau','assurance','transport_divers','fournitures','autre']
  const emptyForm = { categorie:'carburant_exploitation', description:'', montant:'', date_depense:'', justificatif:'' }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const depenses = data?.depenses || []

  const handleCreate = async (e) => {
    e.preventDefault()
    await createDep.mutateAsync(form)
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <TabHeader title="Dépenses" count={depenses.length} onAdd={!readOnly ? () => setShowForm(true) : null} btnLabel="Nouvelle dépense" />

      {showForm && (
        <FormCard onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <FormGrid>
              <FormField label="Catégorie">
                <select style={inputStyle} value={form.categorie} onChange={e => setForm(p=>({...p,categorie:e.target.value}))}>
                  {CATS.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                </select>
              </FormField>
              <FormField label="Description" required><input style={inputStyle} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} required /></FormField>
              <FormField label="Montant (GNF)" required><input type="number" style={inputStyle} value={form.montant} onChange={e => setForm(p=>({...p,montant:e.target.value}))} required /></FormField>
              <FormField label="Date" required><input type="date" style={inputStyle} value={form.date_depense} onChange={e => setForm(p=>({...p,date_depense:e.target.value}))} required /></FormField>
              <FormField label="N° justificatif"><input style={inputStyle} value={form.justificatif} onChange={e => setForm(p=>({...p,justificatif:e.target.value}))} /></FormField>
            </FormGrid>
            <FormActions onCancel={() => setShowForm(false)} loading={createDep.isPending} />
          </form>
        </FormCard>
      )}

      {isLoading ? <LoadingTable /> : (
        <DataTable headers={['Date','Catégorie','Description','Montant','Justificatif','']}>
          {depenses.map(d => (
            <tr key={d.id} style={trStyle}>
              <td style={tdStyle}>{d.date_depense?.slice(0,10)}</td>
              <td style={tdStyle}><CatBadge cat={d.categorie} /></td>
              <td style={tdStyle}>{d.description}</td>
              <td style={{ ...tdNumStyle, color: '#ef4444', fontWeight: 600 }}>{fmtGNF(d.montant)}</td>
              <td style={{ ...tdStyle, fontSize: 11, color: '#475569' }}>{d.justificatif || '—'}</td>
              <td style={tdStyle}>{!readOnly && <button onClick={() => deleteDep.mutate(d.id)} style={btnDangerSmall}>Suppr.</button>}</td>
            </tr>
          ))}
          {depenses.length === 0 && <EmptyRow cols={6} />}
        </DataTable>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TRANSPORT
// ═══════════════════════════════════════════════════════════
function TabTransport({ mois, annee, readOnly }) {
  const { data, isLoading } = useCoutsTransport({ mois, annee })
  const createCT = useCreateCoutTransport()
  const emptyForm = { fournisseur_transport:'', date_transport:'', litres_transportes:'', cout_total:'', distance_km:'', reference_trajet:'' }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const couts = data?.couts || []

  const handleCreate = async (e) => {
    e.preventDefault()
    await createCT.mutateAsync(form)
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <TabHeader title="Coûts transport" count={couts.length} onAdd={!readOnly ? () => setShowForm(true) : null} btnLabel="Nouveau coût" />

      {showForm && (
        <FormCard onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <FormGrid>
              <FormField label="Transporteur" required><input style={inputStyle} value={form.fournisseur_transport} onChange={e => setForm(p=>({...p,fournisseur_transport:e.target.value}))} required /></FormField>
              <FormField label="Date" required><input type="date" style={inputStyle} value={form.date_transport} onChange={e => setForm(p=>({...p,date_transport:e.target.value}))} required /></FormField>
              <FormField label="Litres transportés" required><input type="number" style={inputStyle} value={form.litres_transportes} onChange={e => setForm(p=>({...p,litres_transportes:e.target.value}))} required /></FormField>
              <FormField label="Coût total (GNF)" required><input type="number" style={inputStyle} value={form.cout_total} onChange={e => setForm(p=>({...p,cout_total:e.target.value}))} required /></FormField>
              <FormField label="Distance (km)"><input type="number" style={inputStyle} value={form.distance_km} onChange={e => setForm(p=>({...p,distance_km:e.target.value}))} /></FormField>
              <FormField label="Réf. trajet"><input style={inputStyle} value={form.reference_trajet} onChange={e => setForm(p=>({...p,reference_trajet:e.target.value}))} /></FormField>
            </FormGrid>
            <FormActions onCancel={() => setShowForm(false)} loading={createCT.isPending} />
          </form>
        </FormCard>
      )}

      {isLoading ? <LoadingTable /> : (
        <DataTable headers={['Date','Transporteur','Litres','Distance','Coût total','Coût/L','Réf.']}>
          {couts.map(c => (
            <tr key={c.id} style={trStyle}>
              <td style={tdStyle}>{c.date_transport?.slice(0,10)}</td>
              <td style={tdStyle}>{c.fournisseur_transport}</td>
              <td style={tdNumStyle}>{fmt(c.litres_transportes)} L</td>
              <td style={tdNumStyle}>{c.distance_km ? fmt(c.distance_km) + ' km' : '—'}</td>
              <td style={{ ...tdNumStyle, color: '#ef4444', fontWeight: 600 }}>{fmtGNF(c.cout_total)}</td>
              <td style={{ ...tdNumStyle, color: '#f59e0b' }}>{c.litres_transportes > 0 ? fmt(Math.round(c.cout_total/c.litres_transportes)) + ' GNF/L' : '—'}</td>
              <td style={{ ...tdStyle, fontSize: 11, color: '#475569' }}>{c.reference_trajet || '—'}</td>
            </tr>
          ))}
          {couts.length === 0 && <EmptyRow cols={7} />}
        </DataTable>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PAIE
// ═══════════════════════════════════════════════════════════
function TabPaie({ mois, annee, readOnly }) {
  const { data, isLoading } = useFichesPaie({ mois, annee })
  const createFiche = useCreateFichePaie()
  const payerFiche = usePayerFichePaie()
  const emptyForm = { employe_nom:'', employe_role:'', salaire_base:'', primes:'', retenues:'' }
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)

  const fiches = data?.fiches || []
  const totalNet = fiches.reduce((s, f) => s + parseFloat(f.salaire_net || 0), 0)

  const handleCreate = async (e) => {
    e.preventDefault()
    await createFiche.mutateAsync({ ...form, mois, annee })
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Fiches de paie — {MOIS_NOMS[mois-1]} {annee}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>
            {fiches.length} employé(s) · Masse salariale : <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmtGNF(totalNet)}</span>
          </p>
        </div>
        {!readOnly && <button onClick={() => setShowForm(true)} style={btnPrimary}>+ Fiche de paie</button>}
      </div>

      {showForm && (
        <FormCard onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate}>
            <FormGrid>
              <FormField label="Nom employé" required><input style={inputStyle} value={form.employe_nom} onChange={e => setForm(p=>({...p,employe_nom:e.target.value}))} required /></FormField>
              <FormField label="Rôle">
                <select style={inputStyle} value={form.employe_role} onChange={e => setForm(p=>({...p,employe_role:e.target.value}))}>
                  <option value="">—</option>
                  {['gerant','pompiste','chauffeur','logisticien','comptable'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>
              <FormField label="Salaire de base (GNF)" required><input type="number" style={inputStyle} value={form.salaire_base} onChange={e => setForm(p=>({...p,salaire_base:e.target.value}))} required /></FormField>
              <FormField label="Primes (GNF)"><input type="number" style={inputStyle} value={form.primes} onChange={e => setForm(p=>({...p,primes:e.target.value}))} /></FormField>
              <FormField label="Retenues (GNF)"><input type="number" style={inputStyle} value={form.retenues} onChange={e => setForm(p=>({...p,retenues:e.target.value}))} /></FormField>
            </FormGrid>
            <FormActions onCancel={() => setShowForm(false)} loading={createFiche.isPending} />
          </form>
        </FormCard>
      )}

      {isLoading ? <LoadingTable /> : (
        <DataTable headers={['Employé','Rôle','Salaire base','Primes','Retenues','Net','Statut','']}>
          {fiches.map(f => (
            <tr key={f.id} style={trStyle}>
              <td style={{ ...tdStyle, fontWeight: 600, color: '#e2e8f0' }}>{f.employe_nom}</td>
              <td style={tdStyle}><RoleBadge role={f.employe_role} /></td>
              <td style={tdNumStyle}>{fmtGNF(f.salaire_base)}</td>
              <td style={{ ...tdNumStyle, color: '#22c55e' }}>+{fmtGNF(f.primes || 0)}</td>
              <td style={{ ...tdNumStyle, color: '#ef4444' }}>-{fmtGNF(f.retenues || 0)}</td>
              <td style={{ ...tdNumStyle, fontWeight: 800, color: '#f8fafc', fontSize: 14 }}>{fmtGNF(f.salaire_net)}</td>
              <td style={tdStyle}><StatutPaieBadge statut={f.statut} /></td>
              <td style={tdStyle}>{!readOnly && f.statut === 'en_attente' && <button onClick={() => payerFiche.mutate(f.id)} style={btnPrimarySmall}>Payer</button>}</td>
            </tr>
          ))}
          {fiches.length === 0 && <EmptyRow cols={8} />}
        </DataTable>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// RAPPORTS
// ═══════════════════════════════════════════════════════════
function TabRapports({ mois, annee }) {
  const { data } = useDashboardComptable(mois, annee)
  const s = data?.stats || {}
  const charges = (s.achats||0) + (s.transport||0) + (s.depenses||0) + (s.paie||0)

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Rapports financiers</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { title: 'Bilan mensuel', desc: `Compte de résultat complet de ${MOIS_NOMS[mois-1]} ${annee}`, icon: '📋' },
          { title: 'Journal des achats', desc: 'Détail des achats carburant par fournisseur', icon: '📦' },
          { title: 'Journal des dépenses', desc: 'Dépenses classées par catégorie', icon: '💸' },
          { title: 'Masse salariale', desc: 'Récapitulatif fiches de paie du mois', icon: '👥' },
        ].map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: 20, cursor: 'pointer' }}
            whileHover={{ borderColor: 'rgba(56,189,248,0.3)', scale: 1.01 }}
          >
            <div style={{ fontSize: 26, marginBottom: 12 }}>{r.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 14 }}>{r.desc}</div>
            <button style={{ ...btnPrimary, fontSize: 12, padding: '7px 14px' }}>Exporter</button>
          </motion.div>
        ))}
      </div>

      {data && (
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 12, color: '#475569', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Synthèse {MOIS_NOMS[mois-1]} {annee}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'CA total', val: s.ca, color: '#22c55e' },
              { label: 'Charges totales', val: charges, color: '#ef4444' },
              { label: 'Résultat net', val: s.marge_brute, color: s.marge_brute >= 0 ? '#22c55e' : '#ef4444' },
            ].map((r, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{fmtGNF(r.val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPOSANTS UI PARTAGÉS
// ═══════════════════════════════════════════════════════════
function KpiCard({ label, val, unit, variation, index, icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1.4, maxWidth: '75%' }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>{fmt(val)}</div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{unit}</div>
      {variation !== null && variation !== undefined && (
        <div style={{ fontSize: 11, color: varColor(variation), marginTop: 7, fontWeight: 600 }}>
          {variation >= 0 ? '▲' : '▼'} {Math.abs(variation)}% vs mois préc.
        </div>
      )}
    </motion.div>
  )
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

function AlertBadge({ color, text }) {
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, fontSize: 13, color }}>{text}</div>
}

function TabHeader({ title, count, onAdd, btnLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{title}</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{count} entrée(s)</p>
      </div>
      {onAdd && <button onClick={onAdd} style={btnPrimary}>+ {btnLabel}</button>}
    </div>
  )
}

function FormCard({ onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 12, padding: 24, marginBottom: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#38bdf8' }}>Nouvel enregistrement</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </motion.div>
  )
}

function FormGrid({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>{children}</div>
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function FormActions({ onCancel, loading }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button type="button" onClick={onCancel} style={btnSecondary}>Annuler</button>
      <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}

function DataTable({ headers, children }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '12px 14px', textAlign: i > 2 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(15,23,42,0.9)', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function EmptyRow({ cols }) {
  return (
    <tr><td colSpan={cols} style={{ textAlign: 'center', padding: '48px 20px', color: '#334155', fontSize: 13 }}>Aucune donnée pour cette période</td></tr>
  )
}

function EmptyChart() {
  return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 13 }}>Aucune donnée</div>
}

function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
      {Array.from({length: 8}).map((_, i) => (
        <div key={i} style={{ height: 104, background: 'rgba(15,23,42,0.8)', borderRadius: 12 }} />
      ))}
    </div>
  )
}

function LoadingTable() {
  return (
    <div style={{ borderRadius: 10, border: '1px solid rgba(148,163,184,0.08)', overflow: 'hidden' }}>
      {Array.from({length: 5}).map((_, i) => (
        <div key={i} style={{ height: 46, background: i%2===0 ? 'rgba(15,23,42,0.8)' : 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(148,163,184,0.05)' }} />
      ))}
    </div>
  )
}

function TypeBadge({ type }) {
  const c = { essence: '#2563eb', gasoil: '#06b6d4' }[type] || '#475569'
  return <span style={{ padding: '2px 8px', background: `${c}20`, color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{type || '—'}</span>
}

function StatutBadge({ statut }) {
  const map = { paye: ['#22c55e','Payé'], non_paye: ['#ef4444','Non payé'], partiel: ['#f59e0b','Partiel'] }
  const [c, l] = map[statut] || ['#475569', statut || '—']
  return <span style={{ padding: '2px 8px', background: `${c}20`, color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{l}</span>
}

function StatutBLBadge({ statut }) {
  const map = { en_attente: ['#f59e0b','En attente'], signe: ['#22c55e','Signé'], litige: ['#ef4444','Litige'] }
  const [c, l] = map[statut] || ['#475569', statut || '—']
  return <span style={{ padding: '2px 8px', background: `${c}20`, color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{l}</span>
}

function StatutPaieBadge({ statut }) {
  const map = { paye: ['#22c55e','Payé'], en_attente: ['#f59e0b','En attente'] }
  const [c, l] = map[statut] || ['#475569', statut || '—']
  return <span style={{ padding: '2px 8px', background: `${c}20`, color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{l}</span>
}

function CatBadge({ cat }) {
  return <span style={{ padding: '2px 8px', background: 'rgba(148,163,184,0.08)', color: '#94a3b8', borderRadius: 4, fontSize: 11 }}>{cat?.replace(/_/g,' ') || '—'}</span>
}

function RoleBadge({ role }) {
  const c = { gerant:'#2563eb', pompiste:'#22c55e', chauffeur:'#8b5cf6', logisticien:'#f59e0b', comptable:'#06b6d4' }[role] || '#475569'
  return <span style={{ padding: '2px 8px', background: `${c}20`, color: c, borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{role || '—'}</span>
}

// ── Styles partagés ──────────────────────────────────────
const tooltipStyle = { background: '#0f172a', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }
const inputStyle   = { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 7, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }
const btnPrimary       = { padding: '9px 18px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }
const btnPrimarySmall  = { padding: '4px 10px', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600 }
const btnSecondary     = { padding: '9px 18px', background: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, cursor: 'pointer', fontSize: 13 }
const btnDangerSmall   = { padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, cursor: 'pointer', fontSize: 11 }
const selStyle         = { padding: '7px 12px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 7, color: '#94a3b8', fontSize: 13, outline: 'none' }
const trStyle          = { borderBottom: '1px solid rgba(148,163,184,0.05)', transition: 'background 0.15s' }
const tdStyle          = { padding: '11px 14px', fontSize: 13, color: '#94a3b8', verticalAlign: 'middle' }
const tdNumStyle       = { padding: '11px 14px', fontSize: 13, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums', textAlign: 'right', verticalAlign: 'middle' }
