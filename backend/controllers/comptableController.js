// ================================================
// FUELO — Comptable Controller
// Dashboard financier, BL, achats, dépenses, paie
// ================================================

const pool   = require('../config/database')
const logger = require('../utils/logger')
const erreurServeur = require('../utils/erreurServeur')

// Helper — station_id de l'utilisateur courant
const getStationId = (req) => req.user.station_id

// ── Dashboard financier premium ───────────────────────
const getDashboard = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { mois, annee } = req.query
    const m = parseInt(mois)  || new Date().getMonth() + 1
    const a = parseInt(annee) || new Date().getFullYear()
    const debut  = new Date(a, m - 1, 1)
    const fin    = new Date(a, m, 1)
    // Période précédente
    const mPrec  = m === 1 ? 12 : m - 1
    const aPrec  = m === 1 ? a - 1 : a
    const debutP = new Date(aPrec, mPrec - 1, 1)
    const finP   = new Date(aPrec, mPrec, 1)

    const [ca, caPrec, achats, achatsPrec, depenses, depensesPrec,
           transport, paie, blEnAttente, facturesRetard, facturesMontant,
           ca30j, prixAchatEvol, volumesType] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(montant_gnf),0) AS total, COALESCE(SUM(litres),0) AS litres FROM ventes WHERE station_id=$1 AND created_at>=$2 AND created_at<$3 AND deleted_at IS NULL`, [station_id, debut, fin]),
      pool.query(`SELECT COALESCE(SUM(montant_gnf),0) AS total FROM ventes WHERE station_id=$1 AND created_at>=$2 AND created_at<$3 AND deleted_at IS NULL`, [station_id, debutP, finP]),
      pool.query(`SELECT COALESCE(SUM(montant_ttc),0) AS total, COALESCE(SUM(quantite_recue),0) AS litres, COALESCE(AVG(prix_unitaire_ht),0) AS prix_moyen FROM fuel_purchases WHERE station_id=$1 AND date_achat>=$2 AND date_achat<$3`, [station_id, debut, fin]),
      pool.query(`SELECT COALESCE(SUM(montant_ttc),0) AS total FROM fuel_purchases WHERE station_id=$1 AND date_achat>=$2 AND date_achat<$3`, [station_id, debutP, finP]),
      pool.query(`SELECT categorie, COALESCE(SUM(montant),0) AS cat_total FROM depenses WHERE station_id=$1 AND date_depense>=$2 AND date_depense<$3 GROUP BY categorie`, [station_id, debut, fin]),
      pool.query(`SELECT COALESCE(SUM(montant),0) AS total FROM depenses WHERE station_id=$1 AND date_depense>=$2 AND date_depense<$3`, [station_id, debutP, finP]),
      pool.query(`SELECT COALESCE(SUM(cout_total),0) AS total FROM couts_transport WHERE station_id=$1 AND created_at>=$2 AND created_at<$3`, [station_id, debut, fin]),
      pool.query(`SELECT COALESCE(SUM(salaire_net),0) AS total FROM fiches_paie WHERE station_id=$1 AND mois=$2 AND annee=$3`, [station_id, m, a]),
      pool.query(`SELECT COUNT(*) FROM bons_livraison WHERE station_id=$1 AND statut='en_attente'`, [station_id]),
      pool.query(`SELECT COUNT(*) FROM fuel_purchases WHERE station_id=$1 AND statut_paiement='non_paye' AND date_echeance < NOW()`, [station_id]),
      pool.query(`SELECT COALESCE(SUM(montant_ttc),0) AS total FROM fuel_purchases WHERE station_id=$1 AND statut_paiement='non_paye' AND date_achat>=$2 AND date_achat<$3`, [station_id, debut, fin]),
      // CA journalier 30 derniers jours
      pool.query(`SELECT DATE(created_at) AS jour, COALESCE(SUM(montant_gnf),0) AS ca, COALESCE(SUM(litres),0) AS litres FROM ventes WHERE station_id=$1 AND created_at >= NOW()-INTERVAL '30 days' AND deleted_at IS NULL GROUP BY 1 ORDER BY 1`, [station_id]),
      // Évolution prix achat carburant
      pool.query(`SELECT DATE(date_achat) AS jour, AVG(prix_unitaire_ht) AS prix, type_carburant FROM fuel_purchases WHERE station_id=$1 AND date_achat >= NOW()-INTERVAL '90 days' GROUP BY 1,3 ORDER BY 1`, [station_id]),
      // Volumes par type ce mois
      pool.query(`SELECT type, COALESCE(SUM(litres),0) AS litres, COALESCE(SUM(montant_gnf),0) AS ca FROM ventes WHERE station_id=$1 AND created_at>=$2 AND created_at<$3 AND deleted_at IS NULL GROUP BY type`, [station_id, debut, fin]),
    ])

    const caTotal        = parseFloat(ca.rows[0].total)
    const caPrecTotal    = parseFloat(caPrec.rows[0].total)
    const achatTotal     = parseFloat(achats.rows[0].total)
    const achatPrecTotal = parseFloat(achatsPrec.rows[0].total)
    const depTotal       = depenses.rows.reduce((s,r) => s+parseFloat(r.cat_total||0), 0)
    const depPrecTotal   = parseFloat(depensesPrec.rows[0].total)
    const transportTotal = parseFloat(transport.rows[0].total)
    const paieTotal      = parseFloat(paie.rows[0].total)
    const litresVendus   = parseFloat(ca.rows[0].litres)
    const litresAchetes  = parseFloat(achats.rows[0].litres)
    const prixAchatMoyen = parseFloat(achats.rows[0].prix_moyen)

    const margeBrute     = caTotal - achatTotal - transportTotal - depTotal - paieTotal
    const margePct       = caTotal > 0 ? (margeBrute / caTotal) * 100 : 0
    const prixVenteMoyen = litresVendus > 0 ? caTotal / litresVendus : 0

    const variation = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100 * 10) / 10 : null

    res.json({
      mois: m, annee: a,
      stats: {
        ca: caTotal, ca_var: variation(caTotal, caPrecTotal),
        achats: achatTotal, achats_var: variation(achatTotal, achatPrecTotal),
        depenses: depTotal, depenses_var: variation(depTotal, depPrecTotal),
        transport: transportTotal, paie: paieTotal,
        marge_brute: margeBrute,
        marge_pct: Math.round(margePct * 10) / 10,
        litres_vendus: litresVendus, litres_achetes: litresAchetes,
        prix_achat_moyen: Math.round(prixAchatMoyen),
        prix_vente_moyen: Math.round(prixVenteMoyen),
        factures_montant: parseFloat(facturesMontant.rows[0].total),
        factures_retard_nb: parseInt(facturesRetard.rows[0].count),
      },
      alertes: {
        bl_en_attente:   parseInt(blEnAttente.rows[0].count),
        factures_retard: parseInt(facturesRetard.rows[0].count),
        marge_negative:  margeBrute < 0,
        marge_baisse:    (caTotal > 0 && caPrecTotal > 0)
          ? (margePct < ((caPrecTotal - achatPrecTotal - depPrecTotal) / caPrecTotal * 100) - 10)
          : false,
      },
      depenses_par_categorie: depenses.rows.map(r => ({ categorie: r.categorie, total: parseFloat(r.cat_total) })),
      ca_30j: ca30j.rows,
      prix_achat_evol: prixAchatEvol.rows,
      volumes_par_type: volumesType.rows,
    })
  } catch (err) {
    logger.error('getDashboard comptable', err)
    res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Achats carburant ──────────────────────────────────
const getAchats = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { page = 1, limit = 20, statut, mois, annee } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = [station_id]
    let where = `WHERE station_id=$1`
    if (statut) { params.push(statut); where += ` AND statut_paiement=$${params.length}` }
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois)-1, 1)
      const fin   = new Date(parseInt(annee), parseInt(mois), 1)
      params.push(debut, fin)
      where += ` AND date_achat>=$${params.length-1} AND date_achat<$${params.length}`
    }
    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM fuel_purchases ${where} ORDER BY date_achat DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, parseInt(limit), offset]),
      pool.query(`SELECT COUNT(*) FROM fuel_purchases ${where}`, params),
    ])
    res.json({ achats: rows.rows, total: parseInt(count.rows[0].count), page: parseInt(page) })
  } catch (err) {
    logger.error('getAchats', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const createAchat = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { fournisseur, type_carburant, quantite_commandee, quantite_recue, prix_unitaire_ht,
            tva_taux = 0, numero_bl, numero_facture, date_achat, date_echeance,
            statut_paiement = 'non_paye', mode_paiement, depot_origine, notes } = req.body
    if (!fournisseur || !type_carburant || !prix_unitaire_ht)
      return res.status(400).json({ error: 'fournisseur, type_carburant et prix_unitaire_ht requis' })
    const qteRec  = parseFloat(quantite_recue) || 0
    const prixHT  = parseFloat(prix_unitaire_ht)
    const tva     = parseFloat(tva_taux)
    const mntHT   = qteRec * prixHT
    const mntTTC  = mntHT * (1 + tva / 100)
    const result  = await pool.query(
      `INSERT INTO fuel_purchases
       (station_id, fournisseur, type_carburant, quantite_commandee, quantite_recue,
        prix_unitaire_ht, tva_taux, montant_ttc, numero_bl, numero_facture,
        date_achat, date_echeance, statut_paiement, mode_paiement, depot_origine, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [station_id, fournisseur, type_carburant, parseFloat(quantite_commandee)||null, qteRec,
       prixHT, tva, mntTTC, numero_bl||null, numero_facture||null,
       date_achat||new Date(), date_echeance||null, statut_paiement, mode_paiement||null,
       depot_origine||null, notes||null, req.user.id]
    )
    res.status(201).json({ achat: result.rows[0] })
  } catch (err) {
    logger.error('createAchat', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const updateAchat = async (req, res) => {
  try {
    const { id } = req.params
    const station_id = getStationId(req)
    const { statut_paiement, mode_paiement, date_echeance, notes } = req.body
    const result = await pool.query(
      `UPDATE fuel_purchases
       SET statut_paiement=COALESCE($1,statut_paiement),
           mode_paiement=COALESCE($2,mode_paiement),
           date_echeance=COALESCE($3,date_echeance),
           notes=COALESCE($4,notes)
       WHERE id=$5 AND station_id=$6 RETURNING *`,
      [statut_paiement||null, mode_paiement||null, date_echeance||null, notes||null, id, station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Achat introuvable' })
    res.json({ achat: result.rows[0] })
  } catch (err) {
    logger.error('updateAchat', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const deleteAchat = async (req, res) => {
  try {
    const { id } = req.params
    const station_id = getStationId(req)
    const result = await pool.query(
      `DELETE FROM fuel_purchases WHERE id=$1 AND station_id=$2 RETURNING id`, [id, station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Achat introuvable' })
    res.json({ message: 'Achat supprimé' })
  } catch (err) {
    logger.error('deleteAchat', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Bons de livraison ─────────────────────────────────
const getBL = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { page = 1, limit = 20, statut } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = [station_id]
    let where = `WHERE station_id=$1`
    if (statut) { params.push(statut); where += ` AND statut=$${params.length}` }
    const [rows, count] = await Promise.all([
      pool.query(`SELECT * FROM bons_livraison ${where} ORDER BY date_livraison DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, parseInt(limit), offset]),
      pool.query(`SELECT COUNT(*) FROM bons_livraison ${where}`, params),
    ])
    res.json({ bls: rows.rows, total: parseInt(count.rows[0].count) })
  } catch (err) {
    logger.error('getBL', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const createBL = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { numero_bl, date_livraison, fournisseur, depot_origine, chauffeur_nom,
            type_carburant, quantite_commandee, quantite_livree, temperature, densite,
            reserves, citerne_id } = req.body
    if (!numero_bl || !fournisseur || !type_carburant || !quantite_commandee)
      return res.status(400).json({ error: 'numero_bl, fournisseur, type_carburant et quantite_commandee requis' })
    const qteCmd = parseFloat(quantite_commandee)
    const qteLiv = parseFloat(quantite_livree) || null
    const ecart  = qteLiv !== null ? qteLiv - qteCmd : null
    const result = await pool.query(
      `INSERT INTO bons_livraison
       (station_id, numero_bl, date_livraison, fournisseur, depot_origine, chauffeur_nom,
        citerne_id, type_carburant, quantite_commandee, quantite_livree, ecart,
        temperature, densite, reserves, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [station_id, numero_bl, date_livraison||new Date(), fournisseur, depot_origine||null,
       chauffeur_nom||null, citerne_id||null, type_carburant, qteCmd, qteLiv, ecart,
       temperature||null, densite||null, reserves||null, req.user.id]
    )
    res.status(201).json({ bl: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: `Numéro BL "${req.body.numero_bl}" déjà utilisé` })
    logger.error('createBL', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const signerBL = async (req, res) => {
  try {
    const { id } = req.params
    const station_id = getStationId(req)
    const { qui } = req.body // 'chauffeur' | 'receptionnaire'
    const field  = qui === 'chauffeur' ? 'signe_chauffeur' : 'signe_receptionnaire'
    const result = await pool.query(
      `UPDATE bons_livraison SET ${field}=TRUE,
       statut = CASE WHEN signe_chauffeur=TRUE AND signe_receptionnaire=TRUE THEN 'valide' ELSE statut END
       WHERE id=$1 AND station_id=$2 RETURNING *`,
      [id, station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'BL introuvable' })
    res.json({ bl: result.rows[0] })
  } catch (err) {
    logger.error('signerBL', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Dépenses ──────────────────────────────────────────
const getDepenses = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { page = 1, limit = 20, categorie, mois, annee } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const params = [station_id]
    let where = `WHERE station_id=$1`
    if (categorie) { params.push(categorie); where += ` AND categorie=$${params.length}` }
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois)-1, 1)
      const fin   = new Date(parseInt(annee), parseInt(mois), 1)
      params.push(debut, fin)
      where += ` AND date_depense>=$${params.length-1} AND date_depense<$${params.length}`
    }
    const [rows, count] = await Promise.all([
      pool.query(`SELECT d.*, u.nom as createur FROM depenses d LEFT JOIN users u ON u.id=d.created_by ${where} ORDER BY date_depense DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, parseInt(limit), offset]),
      pool.query(`SELECT COUNT(*), COALESCE(SUM(montant),0) AS total FROM depenses ${where}`, params),
    ])
    res.json({ depenses: rows.rows, total_count: parseInt(count.rows[0].count), total_montant: parseFloat(count.rows[0].total) })
  } catch (err) {
    logger.error('getDepenses', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const createDepense = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { categorie, description, montant, date_depense } = req.body
    if (!categorie || !montant) return res.status(400).json({ error: 'categorie et montant requis' })
    const result = await pool.query(
      `INSERT INTO depenses (station_id, categorie, description, montant, date_depense, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [station_id, categorie, description||null, parseFloat(montant), date_depense||new Date(), req.user.id]
    )
    res.status(201).json({ depense: result.rows[0] })
  } catch (err) {
    logger.error('createDepense', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const deleteDepense = async (req, res) => {
  try {
    const { id } = req.params
    const station_id = getStationId(req)
    const result = await pool.query(
      `DELETE FROM depenses WHERE id=$1 AND station_id=$2 RETURNING id`, [id, station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Dépense introuvable' })
    res.json({ message: 'Dépense supprimée' })
  } catch (err) {
    logger.error('deleteDepense', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Coûts transport ───────────────────────────────────
const createCoutTransport = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const {
      trajet_id,
      fournisseur_transport, date_transport, distance_km, reference_trajet,
      carburant_camion = 0, peages = 0, prime_chauffeur = 0, autres_frais = 0,
      cout_total, litres_transportes,
    } = req.body
    // cout_total peut être fourni directement OU calculé depuis les composantes
    const composantes = parseFloat(carburant_camion) + parseFloat(peages) + parseFloat(prime_chauffeur) + parseFloat(autres_frais)
    const total  = cout_total ? parseFloat(cout_total) : composantes
    if (!total)  return res.status(400).json({ error: 'cout_total requis' })
    const litres = parseFloat(litres_transportes) || 0
    const cpl    = litres > 0 ? total / litres : 0
    const result = await pool.query(
      `INSERT INTO couts_transport
       (trajet_id, station_id, fournisseur_transport, date_transport, distance_km, reference_trajet,
        carburant_camion, peages, prime_chauffeur, autres_frais, cout_total, litres_transportes, cout_par_litre, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [trajet_id||null, station_id, fournisseur_transport||null, date_transport||null,
       distance_km||null, reference_trajet||null,
       parseFloat(carburant_camion)||0, parseFloat(peages)||0,
       parseFloat(prime_chauffeur)||0, parseFloat(autres_frais)||0,
       total, litres, cpl, req.user.id]
    )
    res.status(201).json({ cout: result.rows[0] })
  } catch (err) {
    logger.error('createCoutTransport', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const getCoutsTransport = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { mois, annee } = req.query
    const params = [station_id]
    let where = `WHERE ct.station_id=$1`
    if (mois && annee) {
      const debut = new Date(parseInt(annee), parseInt(mois)-1, 1)
      const fin   = new Date(parseInt(annee), parseInt(mois), 1)
      params.push(debut, fin)
      where += ` AND ct.created_at>=$${params.length-1} AND ct.created_at<$${params.length}`
    }
    const result = await pool.query(
      `SELECT ct.*, t.statut as trajet_statut, t.started_at, u.nom as chauffeur_nom
       FROM couts_transport ct
       LEFT JOIN trajets t ON t.id=ct.trajet_id
       LEFT JOIN users u ON u.id=t.chauffeur_id
       ${where} ORDER BY ct.created_at DESC`,
      params
    )
    res.json({ couts: result.rows })
  } catch (err) {
    logger.error('getCoutsTransport', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

// ── Fiches de paie ────────────────────────────────────
const getFichesPaie = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { mois, annee } = req.query
    const m = parseInt(mois)  || new Date().getMonth() + 1
    const a = parseInt(annee) || new Date().getFullYear()
    const result = await pool.query(
      `SELECT fp.*, u.nom, u.role, u.email
       FROM fiches_paie fp JOIN users u ON u.id=fp.user_id
       WHERE fp.station_id=$1 AND fp.mois=$2 AND fp.annee=$3
       ORDER BY u.nom`,
      [station_id, m, a]
    )
    // Liste des employés de la station sans fiche ce mois
    const sansRubriques = await pool.query(
      `SELECT u.id, u.nom, u.role FROM users u
       JOIN station_users su ON su.user_id=u.id
       WHERE su.station_id=$1 AND u.deleted_at IS NULL
         AND u.role NOT IN ('owner','superadmin')
         AND u.id NOT IN (SELECT user_id FROM fiches_paie WHERE station_id=$1 AND mois=$2 AND annee=$3)`,
      [station_id, m, a]
    )
    res.json({ fiches: result.rows, employes_sans_fiche: sansRubriques.rows, mois: m, annee: a })
  } catch (err) {
    logger.error('getFichesPaie', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const createFichePaie = async (req, res) => {
  try {
    const station_id = getStationId(req)
    const { user_id, mois, annee, salaire_base, primes = 0, avances = 0, retenues = 0, notes } = req.body
    if (!user_id || !salaire_base || !mois || !annee)
      return res.status(400).json({ error: 'user_id, salaire_base, mois et annee requis' })
    const net = parseFloat(salaire_base) + parseFloat(primes) - parseFloat(avances) - parseFloat(retenues)
    const result = await pool.query(
      `INSERT INTO fiches_paie (station_id, user_id, mois, annee, salaire_base, primes, avances, retenues, salaire_net, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (station_id, user_id, mois, annee) DO UPDATE
         SET salaire_base=$5, primes=$6, avances=$7, retenues=$8, salaire_net=$9, notes=$10
       RETURNING *`,
      [station_id, user_id, parseInt(mois), parseInt(annee),
       parseFloat(salaire_base), parseFloat(primes), parseFloat(avances), parseFloat(retenues),
       net, notes||null, req.user.id]
    )
    res.status(201).json({ fiche: result.rows[0] })
  } catch (err) {
    logger.error('createFichePaie', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

const payerFichePaie = async (req, res) => {
  try {
    const { id } = req.params
    const station_id = getStationId(req)
    const result = await pool.query(
      `UPDATE fiches_paie SET statut='paye', date_paiement=NOW()
       WHERE id=$1 AND station_id=$2 RETURNING *`,
      [id, station_id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Fiche introuvable' })
    res.json({ fiche: result.rows[0] })
  } catch (err) {
    logger.error('payerFichePaie', err); res.status(500).json({ error: erreurServeur(err) })
  }
}

module.exports = {
  getDashboard,
  getAchats, createAchat, updateAchat, deleteAchat,
  getBL, createBL, signerBL,
  getDepenses, createDepense, deleteDepense,
  createCoutTransport, getCoutsTransport,
  getFichesPaie, createFichePaie, payerFichePaie,
}
