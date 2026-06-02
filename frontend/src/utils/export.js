// ================================================
// FUELO V2 - Export PDF + Excel
// Fichier : frontend/src/utils/export.js
// ================================================

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

// ── EXPORT EXCEL (ExcelJS — styling complet) ──────────
import ExcelJS from 'exceljs'

const XL = {
  navy:    'FF0F172A',
  navyMid: 'FF1E293B',
  blue:    'FF2563EB',
  orange:  'FFF59E0B',
  green:   'FF10B981',
  red:     'FFEF4444',
  slate:   'FF64748B',
  altRow:  'FFF8FAFC',
  border:  'FFE2E8F0',
  white:   'FFFFFFFF',
  text:    'FF1E293B',
}

const border = (color = XL.border) => ({
  top:    { style: 'thin', color: { argb: color } },
  bottom: { style: 'thin', color: { argb: color } },
  left:   { style: 'thin', color: { argb: color } },
  right:  { style: 'thin', color: { argb: color } },
})

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

const styleRow = (row, { font = {}, fillColor, align = 'left', borders = true, height } = {}) => {
  if (height) row.height = height
  row.eachCell({ includeEmpty: true }, cell => {
    cell.font      = { name: 'Calibri', size: 10, ...font }
    cell.alignment = { vertical: 'middle', horizontal: align, wrapText: false }
    if (fillColor) cell.fill = fill(fillColor)
    if (borders)   cell.border = border()
  })
}

const styleCols = (ws, defs) => { ws.columns = defs }

const addTitleBand = (ws, text, merged, color = XL.navy) => {
  const row = ws.addRow([text])
  row.height = 34
  const cell = row.getCell(1)
  cell.font      = { name: 'Calibri', size: 14, bold: true, color: { argb: XL.white } }
  cell.fill      = fill(color)
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.mergeCells(merged)
  return row
}

const addMetaRow = (ws, text, merged, color = XL.navyMid) => {
  const row = ws.addRow([text])
  row.height = 18
  const cell = row.getCell(1)
  cell.font      = { name: 'Calibri', size: 9, color: { argb: 'FFCBD5E1' } }
  cell.fill      = fill(color)
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.mergeCells(merged)
  return row
}

const addSectionHeader = (ws, text, merged, color = XL.blue) => {
  const row = ws.addRow([text])
  row.height = 22
  const cell = row.getCell(1)
  cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.white } }
  cell.fill      = fill(color)
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.mergeCells(merged)
  return row
}

const addColHeaders = (ws, labels, aligns = []) => {
  const row = ws.addRow(labels)
  row.height = 26
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.font      = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.white } }
    cell.fill      = fill(XL.navyMid)
    cell.alignment = { vertical: 'middle', horizontal: aligns[col - 1] ?? 'center' }
    cell.border    = border(XL.blue)
  })
  return row
}

const addDataRow = (ws, values, aligns = [], isAlt = false, fmts = []) => {
  const row = ws.addRow(values)
  row.height = 18
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.font      = { name: 'Calibri', size: 10, color: { argb: XL.text } }
    cell.fill      = fill(isAlt ? XL.altRow : XL.white)
    cell.alignment = { vertical: 'middle', horizontal: aligns[col - 1] ?? 'left' }
    cell.border    = border()
    if (fmts[col - 1]) cell.numFmt = fmts[col - 1]
  })
  return row
}

const downloadBuffer = async (wb, filename) => {
  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const fmtDateXL = (v) => {
  try {
    const d = new Date(v)
    const p = (n) => String(n).padStart(2, '0')
    return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
  } catch { return '-' }
}

// ─── EXPORT VENTES ────────────────────────────────────
export const exportVentesExcel = async (ventes, nomStation = 'Station') => {
  const name = cleanName(nomStation)
  const s    = buildSummary(ventes)
  const wb   = new ExcelJS.Workbook()
  wb.creator = 'Fuelo'; wb.created = new Date()

  // ── Feuille 1 : Résumé ─────────────────────────────
  const ws1 = wb.addWorksheet('Résumé')
  styleCols(ws1, [
    { width: 32 }, { width: 22 }, { width: 16 }, { width: 22 },
  ])

  addTitleBand(ws1, 'FUELO — RAPPORT DES VENTES', 'A1:D1')
  addMetaRow(ws1,  `Station : ${name}`,                'A2:D2')
  addMetaRow(ws1,  `Généré le : ${fmtDateXL(new Date())}`, 'A3:D3')
  addMetaRow(ws1,  `Période : ${periodLabel(ventes)}`, 'A4:D4')
  ws1.addRow([]).height = 8

  addSectionHeader(ws1, '▸  INDICATEURS CLÉS', 'A6:D6', XL.orange)
  addColHeaders(ws1, ['INDICATEUR', 'VALEUR', '', ''], ['left','right','left','left'])

  const kpis = [
    ['Nombre de transactions',   s.total,              '#,##0',   ''],
    ['Volume total vendu',       s.litres,             '#,##0.0', 'L'],
    ['Chiffre d\'affaires (GNF)',s.montant,            '#,##0',   'GNF'],
    ['Ticket moyen (GNF)',       s.avgTicket,          '#,##0',   'GNF'],
    ['Volume moyen / vente',     s.litres / Math.max(s.total,1), '#,##0.0', 'L'],
  ]
  kpis.forEach(([label, val, fmt, unit], i) => {
    const row = addDataRow(ws1, [label, val, unit, ''], ['left','right','left','left'], i % 2 === 1, ['','#,##0','',''])
    row.getCell(2).numFmt = fmt
  })

  ws1.addRow([]).height = 10
  addSectionHeader(ws1, '▸  RÉPARTITION PAR CARBURANT', 'A13:D13', XL.blue)
  addColHeaders(ws1, ['TYPE', 'TRANSACTIONS', 'VOLUME (L)', 'MONTANT (GNF)'], ['left','right','right','right'])
  ;[
    ['⛽ Essence', s.byType.essence.count, s.byType.essence.litres, s.byType.essence.montant],
    ['🛢 Gasoil',  s.byType.gasoil.count,  s.byType.gasoil.litres,  s.byType.gasoil.montant],
  ].forEach(([t, nb, l, m], i) => {
    addDataRow(ws1, [t, nb, l, m], ['left','right','right','right'], i % 2 === 1, ['','#,##0','#,##0.0','#,##0'])
  })

  // ── Feuille 2 : Transactions ────────────────────────
  const ws2 = wb.addWorksheet('Transactions')
  styleCols(ws2, [
    { width: 9 }, { width: 14 }, { width: 30 }, { width: 14 }, { width: 20 }, { width: 17 }, { width: 22 },
  ])
  ws2.views = [{ state: 'frozen', ySplit: 5 }]

  addTitleBand(ws2, 'FUELO — DÉTAIL DES TRANSACTIONS', 'A1:G1')
  addMetaRow(ws2, `Station : ${name}`,                 'A2:G2')
  addMetaRow(ws2, `Période : ${periodLabel(ventes)}`,  'A3:G3')
  ws2.addRow([]).height = 8

  const h2 = addColHeaders(ws2,
    ['ID', 'CARBURANT', 'EMPLOYÉ', 'LITRES', 'MONTANT (GNF)', 'PRIX/L (GNF)', 'DATE'],
    ['center','center','left','right','right','right','center']
  )
  ws2.autoFilter = { from: { row: h2.number, column: 1 }, to: { row: h2.number, column: 7 } }

  const dataVentes = ventes.length
    ? ventes
    : [{ id: '-', type: '-', employe_nom: 'Aucune transaction', litres: 0, montant_gnf: 0, created_at: new Date() }]

  dataVentes.forEach((v, i) => {
    addDataRow(ws2,
      [
        v.id ?? '-',
        fuelLabel(v.type),
        empLabel(v),
        toNum(v.litres),
        toNum(v.montant_gnf),
        toNum(v.montant_gnf) / Math.max(toNum(v.litres), 1),
        fmtDateXL(v.created_at),
      ],
      ['center','center','left','right','right','right','center'],
      i % 2 === 1,
      ['','','','#,##0.0','#,##0','#,##0','']
    )
  })

  // ── Feuille 3 : Par Employé ─────────────────────────
  const ws3 = wb.addWorksheet('Par Employé')
  styleCols(ws3, [
    { width: 30 }, { width: 16 }, { width: 16 }, { width: 22 }, { width: 22 },
  ])
  ws3.views = [{ state: 'frozen', ySplit: 4 }]

  addTitleBand(ws3, 'FUELO — PERFORMANCE PAR EMPLOYÉ', 'A1:E1')
  addMetaRow(ws3, `Généré le : ${fmtDateXL(new Date())}`, 'A2:E2')
  ws3.addRow([]).height = 8

  const h3 = addColHeaders(ws3,
    ['EMPLOYÉ', 'TRANSACTIONS', 'VOLUME (L)', 'MONTANT (GNF)', 'TICKET MOYEN (GNF)'],
    ['left','right','right','right','right']
  )
  ws3.autoFilter = { from: { row: h3.number, column: 1 }, to: { row: h3.number, column: 5 } }

  const empRows = s.byEmp.length ? s.byEmp : [{ emp: 'Aucune donnée', nb: 0, litres: 0, montant: 0, avg: 0 }]
  empRows.forEach((e, i) => {
    addDataRow(ws3,
      [e.emp, e.nb, e.litres, e.montant, e.avg],
      ['left','right','right','right','right'],
      i % 2 === 1,
      ['','#,##0','#,##0.0','#,##0','#,##0']
    )
  })

  await downloadBuffer(wb, `Fuelo_Ventes_${fileSlug(name)}_${stamp()}.xlsx`)
}

// ─── EXPORT STOCK ─────────────────────────────────────
export const exportStockExcel = async (stocks, nomStation = 'Station') => {
  const name    = cleanName(nomStation)
  const essence = toNum(stocks?.essence?.quantite ?? stocks?.essence ?? 0)
  const gasoil  = toNum(stocks?.gasoil?.quantite  ?? stocks?.gasoil  ?? 0)
  const SEUIL   = 300
  const wb      = new ExcelJS.Workbook()
  wb.creator    = 'Fuelo'; wb.created = new Date()

  const ws = wb.addWorksheet('Stock')
  styleCols(ws, [{ width: 28 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 16 }])

  addTitleBand(ws, 'FUELO — RAPPORT DE STOCK', 'A1:E1')
  addMetaRow(ws, `Station : ${name}`,                      'A2:E2')
  addMetaRow(ws, `Généré le : ${fmtDateXL(new Date())}`,   'A3:E3')
  ws.addRow([]).height = 8

  addColHeaders(ws,
    ['TYPE', 'QUANTITÉ (L)', 'STATUT', 'SEUIL ALERTE (L)', 'MARGE (L)'],
    ['center','right','center','right','right']
  )

  ;[
    { t: '⛽ Essence', q: essence },
    { t: '🛢 Gasoil',  q: gasoil  },
  ].forEach(({ t, q }, i) => {
    const statut = q <= SEUIL ? '⚠️ Critique' : '✅ Normal'
    const marge  = Math.max(q - SEUIL, 0)
    const row = addDataRow(ws,
      [t, q, statut, SEUIL, marge],
      ['left','right','center','right','right'],
      i % 2 === 1,
      ['','#,##0.0','','#,##0.0','#,##0.0']
    )
    if (q <= SEUIL) row.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  ws.addRow([]).height = 10
  addSectionHeader(ws, '▸  TOTAL', 'A8:E8', XL.slate)
  addDataRow(ws,
    ['Stock total', essence + gasoil, '', '', ''],
    ['left','right','','',''],
    false,
    ['','#,##0.0','','','']
  )

  await downloadBuffer(wb, `Fuelo_Stock_${fileSlug(name)}_${stamp()}.xlsx`)
}