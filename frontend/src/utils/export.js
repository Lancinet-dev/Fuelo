// ================================================
// FUELO V2 — Export PDF + Excel
// Fichier : frontend/src/utils/export.js
// ================================================

import jsPDF       from 'jspdf'
import autoTable   from 'jspdf-autotable'
import * as XLSX   from 'xlsx'
import { formatGNF, formatLitres, formatDateTime } from './format'

// ── Export Excel ventes ───────────────────────────────
export const exportVentesExcel = (ventes, nomStation = 'Station') => {
  const rows = ventes.map(v => ({
    'ID':          v.id,
    'Type':        v.type,
    'Litres':      parseFloat(v.litres),
    'Montant GNF': parseInt(v.montant_gnf),
    'Employé':     v.employe_nom ?? 'Pompiste',
    'Date':        formatDateTime(v.created_at),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Largeur colonnes
  ws['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ventes')

  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  XLSX.writeFile(wb, `Fuelo_Ventes_${nomStation}_${date}.xlsx`)
}

// ── Export PDF ventes ─────────────────────────────────
export const exportVentesPDF = (ventes, nomStation = 'Station') => {
  const doc = new jsPDF()

  // ── En-tête ──────────────────────────────────────
  // Fond sombre
  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, 210, 40, 'F')

  // Logo texte
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('fuel', 14, 22)

  doc.setTextColor(245, 158, 11)
  doc.text('o', 36, 22)

  // Sous-titre
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport des ventes', 14, 32)

  // Infos droite
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(`Station : ${nomStation}`, 210 - 14, 18, { align: 'right' })
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 210 - 14, 26, { align: 'right' })
  doc.text(`${ventes.length} transactions`, 210 - 14, 34, { align: 'right' })

  // ── Stats résumé ──────────────────────────────────
  const totalMontant = ventes.reduce((s, v) => s + parseInt(v.montant_gnf || 0), 0)
  const totalLitres  = ventes.reduce((s, v) => s + parseFloat(v.litres || 0), 0)

  doc.setFillColor(249, 250, 251)
  doc.rect(14, 46, 182, 22, 'F')

  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('TOTAL TRANSACTIONS', 22, 53)
  doc.text('TOTAL LITRES', 80, 53)
  doc.text('MONTANT TOTAL', 140, 53)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(String(ventes.length), 22, 63)
  doc.text(formatLitres(totalLitres), 80, 63)

  doc.setTextColor(245, 158, 11)
  doc.text(formatGNF(totalMontant), 140, 63)

  // ── Tableau ventes ────────────────────────────────
  doc.setFont('helvetica', 'normal')

  autoTable(doc, {
    startY:     76,
    head:       [['#', 'Type', 'Litres', 'Montant GNF', 'Employé', 'Date']],
    body:       ventes.map(v => [
      `#${v.id}`,
      v.type === 'essence' ? '⛽ Essence' : '🛢️ Gasoil',
      formatLitres(v.litres),
      formatGNF(v.montant_gnf),
      v.employe_nom ?? 'Pompiste',
      formatDateTime(v.created_at),
    ]),
    styles: {
      fontSize:  8,
      cellPadding: 4,
      textColor: [17, 24, 39],
    },
    headStyles: {
      fillColor:  [17, 24, 39],
      textColor:  [255, 255, 255],
      fontStyle:  'bold',
      fontSize:   8,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 48 },
    },
  })

  // ── Pied de page ──────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(
      `Fuelo — ${nomStation} — Page ${i} / ${pageCount}`,
      105, 290, { align: 'center' }
    )
  }

  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  doc.save(`Fuelo_Ventes_${nomStation}_${date}.pdf`)
}

// ── Export Excel stock ────────────────────────────────
export const exportStockExcel = (stocks, nomStation = 'Station') => {
  const rows = [
    { 'Type': 'Essence', 'Quantité (L)': parseFloat(stocks.essence ?? 0), 'Statut': parseFloat(stocks.essence) <= 300 ? 'Critique' : 'Normal' },
    { 'Type': 'Gasoil',  'Quantité (L)': parseFloat(stocks.gasoil  ?? 0), 'Statut': parseFloat(stocks.gasoil)  <= 300 ? 'Critique' : 'Normal' },
  ]

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stock')

  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  XLSX.writeFile(wb, `Fuelo_Stock_${nomStation}_${date}.xlsx`)
}