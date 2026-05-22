// ================================================
// FUELO V2 - Export PDF + Excel
// Fichier : frontend/src/utils/export.js
// ================================================

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ── Helpers format ────────────────────────────────────
const toNum = (v) => Number(v) || 0

// PAS de toLocaleString dans PDF — cause les &&& 
const numFmt = (v) => {
  const n = toNum(v)
  const s = Math.round(n).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const fmtGNF  = (v) => `${numFmt(v)} GNF`
const fmtL    = (v) => `${numFmt(v)} L`
const fmtDate = (v) => {
  try {
    const d = new Date(v)
    const day  = String(d.getDate()).padStart(2, '0')
    const mon  = String(d.getMonth() + 1).padStart(2, '0')
    const yr   = d.getFullYear()
    const hr   = String(d.getHours()).padStart(2, '0')
    const min  = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${mon}/${yr} ${hr}:${min}`
  } catch { return '-' }
}
const fmtNow = () => fmtDate(new Date())
const fmtLongDate = (v) => {
  try {
    const d = new Date(v)
    const months = ['janv','fevr','mars','avr','mai','juin','juil','aout','sept','oct','nov','dec']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch { return '-' }
}

const fuelLabel = (t) => String(t ?? '').toLowerCase() === 'gasoil' ? 'Gasoil' : 'Essence'
const empLabel  = (v) => String(v?.employe_nom ?? '').trim() || 'Pompiste'

const cleanName = (n = 'Station') => {
  const v = String(n ?? '').trim()
  return (!v || /^\d+$/.test(v)) ? 'Ma Station' : v
}
const fileSlug = (n) => cleanName(n).replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'Station'
const stamp    = () => new Date().toISOString().slice(0, 10)

const periodLabel = (ventes = []) => {
  if (!ventes.length) return 'Aucune transaction'
  const ts = ventes.map(v => new Date(v.created_at).getTime()).filter(Number.isFinite).sort((a,b) => a-b)
  if (!ts.length) return 'Dates indisponibles'
  const a = fmtLongDate(ts[0]), b = fmtLongDate(ts[ts.length-1])
  return a === b ? `Le ${a}` : `Du ${a} au ${b}`
}

const buildSummary = (ventes = []) => {
  const s = { total: ventes.length, litres: 0, montant: 0,
    byType: {
      essence: { label: 'Essence', count: 0, litres: 0, montant: 0 },
      gasoil:  { label: 'Gasoil',  count: 0, litres: 0, montant: 0 },
    },
    byEmp: [],
  }
  const empMap = new Map()
  ventes.forEach(v => {
    const type = String(v.type ?? '').toLowerCase() === 'gasoil' ? 'gasoil' : 'essence'
    const l = toNum(v.litres), m = toNum(v.montant_gnf), emp = empLabel(v)
    s.litres += l; s.montant += m
    s.byType[type].count++; s.byType[type].litres += l; s.byType[type].montant += m
    const cur = empMap.get(emp) ?? { emp, nb: 0, litres: 0, montant: 0 }
    cur.nb++; cur.litres += l; cur.montant += m
    empMap.set(emp, cur)
  })
  s.avgTicket = s.total > 0 ? s.montant / s.total : 0
  s.byEmp = Array.from(empMap.values()).map(e => ({ ...e, avg: e.nb > 0 ? e.montant / e.nb : 0 })).sort((a,b) => b.montant - a.montant)
  return s
}

// ── PDF colors ────────────────────────────────────────
const C = {
  navy:   [15,  23,  42],
  blue:   [37,  99,  235],
  orange: [245, 158, 11],
  green:  [16,  185, 129],
  red:    [239, 68,  68],
  slate:  [100, 116, 139],
  text:   [30,  41,  59],
  soft:   [248, 250, 252],
  line:   [226, 232, 240],
  white:  [255, 255, 255],
}

const drawHeader = (doc, name, ventes) => {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.navy); doc.rect(0, 0, W, 34, 'F')
  doc.setFillColor(...C.orange); doc.rect(0, 0, 5, 34, 'F')
  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
  doc.text('FUELO', 14, 14)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.setTextColor(200, 210, 225)
  doc.text('Rapport des ventes', 14, 21)
  doc.text(`Periode : ${periodLabel(ventes)}`, 14, 27)
  doc.setTextColor(...C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text(`Station : ${name}`, W - 14, 14, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 225)
  doc.text(`Genere le : ${fmtNow()}`, W - 14, 20, { align: 'right' })
  doc.text(`${ventes.length} transaction(s)`, W - 14, 26, { align: 'right' })
}

const drawFooter = (doc) => {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const cur = doc.getCurrentPageInfo().pageNumber
  const tot = doc.internal.getNumberOfPages()
  doc.setDrawColor(...C.line); doc.line(14, H - 12, W - 14, H - 12)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.slate)
  doc.text('Fuelo - Export professionnel', 14, H - 7)
  doc.text(`Page ${cur} / ${tot}`, W - 14, H - 7, { align: 'right' })
}

const metricCard = (doc, x, y, w, title, value, accent) => {
  doc.setFillColor(...C.soft); doc.setDrawColor(...C.line)
  doc.roundedRect(x, y, w, 22, 2, 2, 'FD')
  doc.setFillColor(...accent); doc.roundedRect(x, y, 4, 22, 2, 2, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.slate)
  doc.text(title.toUpperCase(), x + 8, y + 7)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.text)
  // Tronquer si trop long
  const maxChars = Math.floor((w - 12) / 2.2)
  const display  = value.length > maxChars ? value.slice(0, maxChars - 2) + '..' : value
  doc.text(display, x + 8, y + 16)
}

const typeCard = (doc, x, y, w, data, accent) => {
  doc.setFillColor(...C.white); doc.setDrawColor(...C.line)
  doc.roundedRect(x, y, w, 26, 2, 2, 'FD')
  doc.setFillColor(...accent); doc.circle(x + 7, y + 7, 3, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.text)
  doc.text(data.label, x + 14, y + 9)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.slate)
  doc.text(`${data.count} transaction(s)`, x + 7, y + 16)
  doc.text(fmtL(data.litres), x + 7, y + 22)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text)
  doc.text(fmtGNF(data.montant), x + w - 8, y + 22, { align: 'right' })
}

// ── EXPORT PDF ────────────────────────────────────────
export const exportVentesPDF = (ventes, nomStation = 'Station') => {
  const name = cleanName(nomStation)
  const s    = buildSummary(ventes)
  const doc  = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()  // 297mm

  drawHeader(doc, name, ventes)

  // 4 metric cards — largeur fixe et proportionnelle
  const gap   = 4
  const total = W - 28 - gap * 3
  const cw    = total / 4

  metricCard(doc, 14,                    38, cw, 'Transactions',  String(s.total),        C.blue)
  metricCard(doc, 14 + cw + gap,         38, cw, 'Litres vendus', fmtL(s.litres),         C.green)
  metricCard(doc, 14 + (cw + gap) * 2,   38, cw, 'Montant total', fmtGNF(s.montant),      C.orange)
  metricCard(doc, 14 + (cw + gap) * 3,   38, cw, 'Ticket moyen',  fmtGNF(s.avgTicket),    C.red)

  // Type breakdown
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.text)
  doc.text('Repartition par carburant', 14, 68)
  const half = (W - 28 - 5) / 2
  typeCard(doc, 14,            71, half, s.byType.essence, C.blue)
  typeCard(doc, 14 + half + 5, 71, half, s.byType.gasoil,  C.green)

  // Tableau
  autoTable(doc, {
    startY: 105,
    margin: { top: 40, right: 14, bottom: 16, left: 14 },
    head: [['#', 'Carburant', 'Employe', 'Litres', 'Montant GNF', 'Prix/L GNF', 'Date']],
    body: ventes.length
      ? ventes.map(v => [
          String(v.id ?? '-'),
          fuelLabel(v.type),
          empLabel(v),
          fmtL(v.litres),
          fmtGNF(v.montant_gnf),
          fmtGNF(toNum(v.montant_gnf) / Math.max(toNum(v.litres), 1)),
          fmtDate(v.created_at),
        ])
      : [['-', '-', 'Aucune transaction', '-', '-', '-', '-']],
    styles: {
      font:        'helvetica',
      fontSize:    8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor:   C.text,
      lineColor:   C.line,
      lineWidth:   0.1,
      overflow:    'linebreak',
      valign:      'middle',
    },
    headStyles: {
      fillColor:  C.navy,
      textColor:  C.white,
      fontStyle:  'bold',
      fontSize:   8,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
    },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { cellWidth: 12,  halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 55 },
      3: { cellWidth: 24,  halign: 'right' },
      4: { cellWidth: 40,  halign: 'right' },
      5: { cellWidth: 36,  halign: 'right' },
      6: { cellWidth: 38 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, name, ventes)
      drawFooter(doc)
    },
  })

  drawFooter(doc)
  doc.save(`Fuelo_Ventes_${fileSlug(name)}_${stamp()}.pdf`)
}

// ── EXPORT EXCEL ──────────────────────────────────────
const setFmt    = (ws, addr, fmt) => { if (ws[addr]) ws[addr].z = fmt }
const fmtCol    = (ws, col, r1, r2, fmt) => { for (let r = r1; r <= r2; r++) setFmt(ws, XLSX.utils.encode_cell({ r, c: col }), fmt) }
const fmtDateXL = (v) => { try { return new Date(v).toLocaleString('fr-FR') } catch { return '-' } }

const sheetResume = (ventes, name) => {
  const s = buildSummary(ventes)
  const data = [
    ['FUELO - RAPPORT DES VENTES'],
    [`Station : ${name}`],
    [`Genere le : ${fmtDateXL(new Date())}`],
    [`Periode : ${periodLabel(ventes)}`],
    [],
    ['INDICATEUR', 'VALEUR'],
    ['Transactions', s.total],
    ['Litres totaux', s.litres],
    ['Montant total (GNF)', s.montant],
    ['Ticket moyen (GNF)', s.avgTicket],
    ['Litres moyen / vente', s.avgLitres ?? 0],
    [],
    ['REPARTITION PAR CARBURANT'],
    ['Type', 'Transactions', 'Litres', 'Montant (GNF)'],
    ['Essence', s.byType.essence.count, s.byType.essence.litres, s.byType.essence.montant],
    ['Gasoil',  s.byType.gasoil.count,  s.byType.gasoil.litres,  s.byType.gasoil.montant],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 26 }, { wch: 20 }, { wch: 16 }, { wch: 20 }]
  ws['!merges'] = ['A1:D1','A2:D2','A3:D3','A4:D4','A13:D13'].map(r => XLSX.utils.decode_range(r))
  setFmt(ws, 'B7', '#,##0'); setFmt(ws, 'B8', '#,##0.0'); setFmt(ws, 'B9', '#,##0'); setFmt(ws, 'B10', '#,##0'); setFmt(ws, 'B11', '#,##0.0')
  fmtCol(ws, 1, 14, 15, '#,##0'); fmtCol(ws, 2, 14, 15, '#,##0.0'); fmtCol(ws, 3, 14, 15, '#,##0')
  return ws
}

const sheetTransactions = (ventes, name) => {
  const rows = [
    ['FUELO - DETAIL DES TRANSACTIONS'],
    [`Station : ${name}`],
    [`Periode : ${periodLabel(ventes)}`],
    [],
    ['ID', 'Carburant', 'Employe', 'Litres', 'Montant (GNF)', 'Prix/L (GNF)', 'Date'],
    ...ventes.map(v => [
      v.id,
      fuelLabel(v.type),
      empLabel(v),
      toNum(v.litres),
      toNum(v.montant_gnf),
      toNum(v.montant_gnf) / Math.max(toNum(v.litres), 1),
      fmtDateXL(v.created_at),
    ]),
  ]
  if (!ventes.length) rows.push(['-', '-', 'Aucune transaction', 0, 0, 0, '-'])
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 24 }]
  ws['!merges'] = ['A1:G1','A2:G2','A3:G3'].map(r => XLSX.utils.decode_range(r))
  ws['!autofilter'] = { ref: `A5:G${rows.length}` }
  fmtCol(ws, 3, 5, rows.length - 1, '#,##0.0')
  fmtCol(ws, 4, 5, rows.length - 1, '#,##0')
  fmtCol(ws, 5, 5, rows.length - 1, '#,##0')
  return ws
}

const sheetEmployes = (ventes) => {
  const s = buildSummary(ventes)
  const rows = [
    ['FUELO - PERFORMANCE PAR EMPLOYE'],
    [`Genere le : ${fmtDateXL(new Date())}`],
    [],
    ['Employe', 'Transactions', 'Litres', 'Montant (GNF)', 'Ticket moyen (GNF)'],
    ...s.byEmp.map(e => [e.emp, e.nb, e.litres, e.montant, e.avg]),
  ]
  if (!s.byEmp.length) rows.push(['Aucune donnee', 0, 0, 0, 0])
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }]
  ws['!merges'] = ['A1:E1','A2:E2'].map(r => XLSX.utils.decode_range(r))
  ws['!autofilter'] = { ref: `A4:E${rows.length}` }
  fmtCol(ws, 2, 4, rows.length - 1, '#,##0.0')
  fmtCol(ws, 3, 4, rows.length - 1, '#,##0')
  fmtCol(ws, 4, 4, rows.length - 1, '#,##0')
  return ws
}

export const exportVentesExcel = (ventes, nomStation = 'Station') => {
  const name = cleanName(nomStation)
  const wb   = XLSX.utils.book_new()
  wb.Props   = { Title: `Rapport ventes - ${name}`, Author: 'Fuelo', CreatedDate: new Date() }
  XLSX.utils.book_append_sheet(wb, sheetResume(ventes, name),       'Resume')
  XLSX.utils.book_append_sheet(wb, sheetTransactions(ventes, name), 'Transactions')
  XLSX.utils.book_append_sheet(wb, sheetEmployes(ventes),           'Par employe')
  XLSX.writeFile(wb, `Fuelo_Ventes_${fileSlug(name)}_${stamp()}.xlsx`)
}

export const exportStockExcel = (stocks, nomStation = 'Station') => {
  const name    = cleanName(nomStation)
  const essence = toNum(stocks?.essence ?? stocks?.essence?.quantite)
  const gasoil  = toNum(stocks?.gasoil  ?? stocks?.gasoil?.quantite)
  const SEUIL   = 300
  const rows2   = [
    { type: 'Essence', q: essence, statut: essence <= SEUIL ? 'Critique' : 'Normal', seuil: SEUIL, marge: Math.max(essence - SEUIL, 0) },
    { type: 'Gasoil',  q: gasoil,  statut: gasoil  <= SEUIL ? 'Critique' : 'Normal', seuil: SEUIL, marge: Math.max(gasoil  - SEUIL, 0) },
  ]
  const wsSum = XLSX.utils.aoa_to_sheet([
    ['FUELO - RAPPORT DE STOCK'], [`Station : ${name}`], [`Genere le : ${fmtDateXL(new Date())}`], [],
    ['INDICATEUR', 'VALEUR'],
    ['Stock total (L)', essence + gasoil],
    ['Stock essence (L)', essence],
    ['Stock gasoil (L)', gasoil],
  ])
  wsSum['!cols'] = [{ wch: 22 }, { wch: 16 }]
  wsSum['!merges'] = ['A1:B1','A2:B2','A3:B3'].map(r => XLSX.utils.decode_range(r))
  fmtCol(wsSum, 1, 5, 7, '#,##0.0')

  const wsDet = XLSX.utils.aoa_to_sheet([
    ['Type', 'Quantite (L)', 'Statut', 'Seuil alerte (L)', 'Marge (L)'],
    ...rows2.map(r => [r.type, r.q, r.statut, r.seuil, r.marge]),
  ])
  wsDet['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }]
  fmtCol(wsDet, 1, 1, 2, '#,##0.0'); fmtCol(wsDet, 3, 1, 2, '#,##0.0'); fmtCol(wsDet, 4, 1, 2, '#,##0.0')

  const wb = XLSX.utils.book_new()
  wb.Props = { Title: `Stock - ${name}`, Author: 'Fuelo', CreatedDate: new Date() }
  XLSX.utils.book_append_sheet(wb, wsSum, 'Resume')
  XLSX.utils.book_append_sheet(wb, wsDet, 'Stock')
  XLSX.writeFile(wb, `Fuelo_Stock_${fileSlug(name)}_${stamp()}.xlsx`)
}