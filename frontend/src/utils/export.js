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

const urlToBase64 = async (url) => {
  try {
    const resp = await fetch(url)
    const blob = await resp.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

const drawHeader = (doc, name, ventes, logoBase64 = null) => {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.navy); doc.rect(0, 0, W, 34, 'F')
  doc.setFillColor(...C.orange); doc.rect(0, 0, 5, 34, 'F')

  if (logoBase64) {
    try { doc.addImage(logoBase64, 'JPEG', 9, 5, 24, 24) } catch { /* logo optionnel — on continue sans */ }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.setTextColor(...C.white)
    doc.text(name, 37, 16)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.setTextColor(200, 210, 225)
    doc.text('Rapport des ventes', 37, 23)
    doc.text(`Periode : ${periodLabel(ventes)}`, 37, 29)
  } else {
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
    doc.text('FUELO', 14, 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.setTextColor(200, 210, 225)
    doc.text('Rapport des ventes', 14, 21)
    doc.text(`Periode : ${periodLabel(ventes)}`, 14, 27)
  }

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
export const exportVentesPDF = async (ventes, nomStation = 'Station', logoUrl = null) => {
  const name       = cleanName(nomStation)
  const s          = buildSummary(ventes)
  const doc        = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W          = doc.internal.pageSize.getWidth()
  const logoBase64 = logoUrl ? await urlToBase64(logoUrl) : null

  drawHeader(doc, name, ventes, logoBase64)

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
      if (data.pageNumber > 1) drawHeader(doc, name, ventes, logoBase64)
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

  addTitleBand(ws1, `${name} — RAPPORT DES VENTES`, 'A1:D1')
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

// ─── EXPORT TRAJETS LOGISTIQUE ────────────────────────
export const exportTrajetsExcel = async (trajets = [], stats = {}, options = {}) => {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Fuelo'; wb.created = new Date()
  wb.modified = new Date()
  wb.subject = 'Rapport logistique transport'
  wb.title = 'Fuelo - Rapport logistique'

  const chauffeurs = options.chauffeurs ?? []
  const chauffeurById = new Map(chauffeurs.map(c => [Number(c.id), c]))
  const chauffeurByName = new Map(chauffeurs.map(c => [String(c.nom ?? '').trim().toLowerCase(), c]))
  const getChauffeur = (trajet = {}) =>
    chauffeurById.get(Number(trajet.chauffeur_id)) ??
    chauffeurByName.get(String(trajet.chauffeur_nom ?? '').trim().toLowerCase()) ??
    {}

  const termines   = trajets.filter(t => t.statut !== 'en_cours')
  const nbFraudes  = trajets.filter(t => t.statut === 'alerte').length
  const totalEcart = termines.reduce((s, t) => s + (parseFloat(t.ecart) || 0), 0)

  const durationHours = (start, end) => {
    if (!start || !end) return null
    const a = new Date(start).getTime()
    const b = new Date(end).getTime()
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
    return (b - a) / 36e5
  }

  const performanceMap = new Map()
  trajets.forEach((t) => {
    const chauffeur = getChauffeur(t)
    const key = String(chauffeur.id ?? t.chauffeur_id ?? t.chauffeur_nom ?? 'inconnu')
    const current = performanceMap.get(key) ?? {
      id: chauffeur.id ?? t.chauffeur_id ?? '-',
      nom: chauffeur.nom ?? t.chauffeur_nom ?? 'Chauffeur non renseigne',
      email: chauffeur.email ?? '-',
      actif: chauffeur.actif,
      trajets: 0,
      termines: 0,
      enCours: 0,
      fraudes: 0,
      depart: 0,
      arrivee: 0,
      ecart: 0,
      heures: 0,
    }
    const heures = durationHours(t.started_at, t.ended_at)
    current.trajets += 1
    current.termines += t.statut !== 'en_cours' ? 1 : 0
    current.enCours += t.statut === 'en_cours' ? 1 : 0
    current.fraudes += t.statut === 'alerte' ? 1 : 0
    current.depart += toNum(t.qty_depart)
    current.arrivee += t.statut !== 'en_cours' ? toNum(t.qty_arrivee) : 0
    current.ecart += t.statut !== 'en_cours' ? (parseFloat(t.ecart) || 0) : 0
    current.heures += heures ?? 0
    performanceMap.set(key, current)
  })
  chauffeurs.forEach((c) => {
    const key = String(c.id)
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        id: c.id,
        nom: c.nom ?? '-',
        email: c.email ?? '-',
        actif: c.actif,
        trajets: 0,
        termines: 0,
        enCours: 0,
        fraudes: 0,
        depart: 0,
        arrivee: 0,
        ecart: 0,
        heures: 0,
      })
    }
  })
  const performances = Array.from(performanceMap.values()).sort((a, b) => b.trajets - a.trajets || Math.abs(b.ecart) - Math.abs(a.ecart))

  const fmtStatut = (s) =>
    s === 'en_cours' ? 'En cours' : s === 'alerte' ? 'Fraude détectée' : 'Arrivé'

  // ── Feuille 1 : Résumé ─────────────────────────────
  const ws1 = wb.addWorksheet('Résumé')
  styleCols(ws1, [{ width: 30 }, { width: 20 }, { width: 16 }, { width: 20 }])

  addTitleBand(ws1, 'FUELO — RAPPORT LOGISTIQUE TRANSPORT', 'A1:D1')
  addMetaRow(ws1, `Généré le : ${fmtDateXL(new Date())}`, 'A2:D2')
  ws1.addRow([]).height = 8

  addSectionHeader(ws1, '▸  INDICATEURS CLÉS', 'A4:D4', XL.orange)
  addColHeaders(ws1, ['INDICATEUR', 'VALEUR', '', ''], ['left', 'right', 'left', 'left'])

  const kpis = [
    ['Total trajets',          stats.total ?? trajets.length, '#,##0'],
    ['Trajets terminés',       termines.length,               '#,##0'],
    ['Trajets en cours',       stats.enCours ?? 0,            '#,##0'],
    ['Alertes fraude',         nbFraudes,                     '#,##0'],
    ['Écart total constaté',   totalEcart,                    '+#,##0.0;-#,##0.0;0.0'],
  ]
  kpis.forEach(([label, val, fmt], i) => {
    const row = addDataRow(ws1, [label, val, 'L', ''], ['left', 'right', 'left', 'left'], i % 2 === 1, ['', fmt, '', ''])
    if (label === 'Alertes fraude' && val > 0)
      row.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // ── Feuille 2 : Tous les trajets ───────────────────
  const ws2 = wb.addWorksheet('Trajets')
  styleCols(ws2, [
    { width: 8  },   // ID
    { width: 24 },   // Chauffeur
    { width: 14 },   // Citerne
    { width: 16 },   // Chargement (L)
    { width: 16 },   // Livraison (L)
    { width: 14 },   // Écart (L)
    { width: 18 },   // Statut
    { width: 20 },   // Départ
    { width: 20 },   // Arrivée
  ])
  ws2.views = [{ state: 'frozen', ySplit: 5 }]

  addTitleBand(ws2, 'FUELO — DÉTAIL DES TRAJETS', 'A1:I1')
  addMetaRow(ws2, `Généré le : ${fmtDateXL(new Date())}`, 'A2:I2')
  addMetaRow(ws2, `${trajets.length} trajet(s) · ${nbFraudes} alerte(s) fraude`, 'A3:I3')
  ws2.addRow([]).height = 8

  const h2 = addColHeaders(ws2,
    ['ID', 'CHAUFFEUR', 'CITERNE', 'CHARGEMENT (L)', 'LIVRAISON (L)', 'ÉCART (L)', 'STATUT', 'DÉPART', 'ARRIVÉE'],
    ['center', 'left', 'center', 'right', 'right', 'right', 'center', 'center', 'center']
  )
  ws2.autoFilter = { from: { row: h2.number, column: 1 }, to: { row: h2.number, column: 9 } }

  const dataRows = trajets.length
    ? trajets
    : [{ id: '-', chauffeur_nom: 'Aucun trajet', citerne_code: '-', qty_depart: 0, qty_arrivee: null, ecart: null, statut: '-', started_at: new Date(), ended_at: null }]

  dataRows.forEach((t, i) => {
    const ecart    = t.ecart != null ? parseFloat(t.ecart) : null
    const isFraude = t.statut === 'alerte'
    const row = addDataRow(ws2,
      [
        t.id ?? '-',
        t.chauffeur_nom ?? '-',
        t.citerne_code  ?? '-',
        t.qty_depart    != null ? parseFloat(t.qty_depart) : '-',
        t.qty_arrivee   != null ? parseFloat(t.qty_arrivee) : '—',
        ecart           != null ? ecart : '—',
        fmtStatut(t.statut),
        fmtDateXL(t.started_at),
        t.ended_at ? fmtDateXL(t.ended_at) : '—',
      ],
      ['center', 'left', 'center', 'right', 'right', 'right', 'center', 'center', 'center'],
      i % 2 === 1,
      ['', '', '', '#,##0.0', '#,##0.0', '+#,##0.0;-#,##0.0;0.0', '', '', '']
    )
    if (isFraude) {
      row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
      row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
    }
  })

  // Feuille 3 : fichier chauffeurs complet
  const ws3 = wb.addWorksheet('Chauffeurs')
  styleCols(ws3, [
    { width: 10 }, { width: 30 }, { width: 36 }, { width: 16 }, { width: 14 },
    { width: 22 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 14 },
  ])
  ws3.views = [{ state: 'frozen', ySplit: 5 }]
  ws3.properties.tabColor = { argb: XL.green }

  addTitleBand(ws3, 'FUELO - FICHIER CHAUFFEURS', 'A1:J1', XL.green)
  addMetaRow(ws3, `Genere le : ${fmtDateXL(new Date())}`, 'A2:J2')
  addMetaRow(ws3, `${chauffeurs.length} chauffeur(s) enregistres`, 'A3:J3')
  ws3.addRow([]).height = 8

  const h3 = addColHeaders(ws3,
    ['ID', 'NOM COMPLET', 'EMAIL', 'ROLE', 'STATUT', 'CREATION', 'VENTES/JOUR', 'REVENU/JOUR', 'TRAJETS', 'FRAUDES'],
    ['center', 'left', 'left', 'center', 'center', 'center', 'right', 'right', 'right', 'right']
  )
  ws3.autoFilter = { from: { row: h3.number, column: 1 }, to: { row: h3.number, column: 10 } }

  const chauffeurRows = chauffeurs.length
    ? chauffeurs
    : [{ id: '-', nom: 'Aucun chauffeur', email: '-', role: 'chauffeur', actif: false, created_at: null }]

  chauffeurRows.forEach((c, i) => {
    const perf = performances.find(p => String(p.id) === String(c.id)) ?? {}
    const row = addDataRow(ws3,
      [
        c.id ?? '-',
        c.nom ?? '-',
        c.email ?? '-',
        c.role ?? 'chauffeur',
        c.actif === false ? 'Inactif' : 'Actif',
        c.created_at ? fmtDateXL(c.created_at) : '-',
        toNum(c.nb_ventes_jour),
        toNum(c.total_ventes_jour),
        perf.trajets ?? 0,
        perf.fraudes ?? 0,
      ],
      ['center', 'left', 'left', 'center', 'center', 'center', 'right', 'right', 'right', 'right'],
      i % 2 === 1,
      ['', '', '', '', '', '', '#,##0', '#,##0', '#,##0', '#,##0']
    )
    row.getCell(5).font = { name: 'Calibri', size: 10, bold: true, color: { argb: c.actif === false ? XL.red : XL.green } }
    if ((perf.fraudes ?? 0) > 0) row.getCell(10).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // Feuille 4 : performance par chauffeur
  const ws4 = wb.addWorksheet('Performance')
  styleCols(ws4, [
    { width: 10 }, { width: 30 }, { width: 36 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 16 },
    { width: 14 }, { width: 16 },
  ])
  ws4.views = [{ state: 'frozen', ySplit: 5 }]
  ws4.properties.tabColor = { argb: XL.red }

  addTitleBand(ws4, 'FUELO - PERFORMANCE CHAUFFEURS', 'A1:L1', XL.red)
  addMetaRow(ws4, `Genere le : ${fmtDateXL(new Date())}`, 'A2:L2')
  addMetaRow(ws4, 'Analyse par chauffeur : volumes, ecarts, alertes et duree', 'A3:L3')
  ws4.addRow([]).height = 8

  const h4 = addColHeaders(ws4,
    ['ID', 'CHAUFFEUR', 'EMAIL', 'TRAJETS', 'TERMINES', 'EN COURS', 'FRAUDES', 'VOLUME CHARGE (L)', 'VOLUME LIVRE (L)', 'ECART (L)', 'DUREE (H)', 'TAUX FRAUDE'],
    ['center', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right']
  )
  ws4.autoFilter = { from: { row: h4.number, column: 1 }, to: { row: h4.number, column: 12 } }

  const perfRows = performances.length
    ? performances
    : [{ id: '-', nom: 'Aucune donnee', email: '-', trajets: 0, termines: 0, enCours: 0, fraudes: 0, depart: 0, arrivee: 0, ecart: 0, heures: 0 }]

  perfRows.forEach((p, i) => {
    const row = addDataRow(ws4,
      [p.id, p.nom, p.email, p.trajets, p.termines, p.enCours, p.fraudes, p.depart, p.arrivee, p.ecart, p.heures, p.trajets ? p.fraudes / p.trajets : 0],
      ['center', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'],
      i % 2 === 1,
      ['', '', '', '#,##0', '#,##0', '#,##0', '#,##0', '#,##0.0', '#,##0.0', '+#,##0.0;-#,##0.0;0.0', '0.00', '0.0%']
    )
    if (p.fraudes > 0) row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
    if (Math.abs(p.ecart) > 0) row.getCell(10).font = { name: 'Calibri', size: 10, bold: true, color: { argb: Math.abs(p.ecart) > 50 ? XL.red : XL.orange } }
  })

  await downloadBuffer(wb, `Fuelo_Logistique_${stamp()}.xlsx`)
}

// ── EXPORT PDF — CENTRE ANTI-FRAUDE ────────────────────
const fmtEcartPdf = (v) => {
  const n = toNum(v)
  return `${n > 0 ? '+' : ''}${n.toFixed(1)} L`
}

export const exportAntiFraudePDF = async (data, nomStation = 'Station', logoUrl = null) => {
  if (!data) return
  const name = cleanName(nomStation)
  const { stats = {}, classementPompistes = [], alertesFraude = [], alertesTransport = [] } = data
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()
  const logoBase64 = logoUrl ? await urlToBase64(logoUrl) : null

  const drawAFHeader = () => {
    doc.setFillColor(...C.navy); doc.rect(0, 0, W, 34, 'F')
    doc.setFillColor(...C.red);  doc.rect(0, 0, 5, 34, 'F')

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'JPEG', 9, 5, 24, 24) } catch { /* logo optionnel — on continue sans */ }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.white)
      doc.text(name, 37, 16)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 210, 225)
      doc.text('Centre Anti-Fraude - Rapport complet', 37, 23)
    } else {
      doc.setTextColor(...C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(22)
      doc.text('FUELO', 14, 14)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 210, 225)
      doc.text('Centre Anti-Fraude - Rapport complet', 14, 21)
    }

    doc.setTextColor(...C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text(`Station : ${name}`, W - 14, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 225)
    doc.text(`Genere le : ${fmtNow()}`, W - 14, 20, { align: 'right' })
    doc.text(`${stats.totalFraudes ?? 0} cas de fraude detectes`, W - 14, 26, { align: 'right' })
  }

  const onDrawPage = (hookData) => {
    if (hookData.pageNumber > 1) drawAFHeader()
    drawFooter(doc)
  }

  // ── Page 1 — vue d'ensemble + classement ──────────
  drawAFHeader()

  const gap   = 4
  const total = W - 28 - gap * 3
  const cw    = total / 4
  metricCard(doc, 14,                  38, cw, 'Fraudes detectees',     String(stats.totalFraudes ?? 0),        C.red)
  metricCard(doc, 14 + cw + gap,       38, cw, 'Montant recupere',      fmtGNF(stats.montantRecupere ?? 0),     C.orange)
  metricCard(doc, 14 + (cw + gap) * 2, 38, cw, 'Pompistes surveilles',  String(stats.pompistesSurveilles ?? 0), C.blue)
  metricCard(doc, 14 + (cw + gap) * 3, 38, cw, 'Taux de fraude',        `${stats.tauxFraude ?? 0} %`,           C.green)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.text)
  doc.text('Classement fiabilite des pompistes', 14, 70)

  autoTable(doc, {
    startY: 74,
    margin: { top: 40, right: 14, bottom: 16, left: 14 },
    head: [['Pompiste', 'Score / 100', 'Badge', 'Fraudes detectees', 'Montant fraude estime']],
    body: classementPompistes.length
      ? classementPompistes.map(p => [p.nom, String(p.score), p.badge, String(p.fraudes), p.montantFraude > 0 ? fmtGNF(p.montantFraude) : '-'])
      : [['-', '-', '-', '-', 'Aucun pompiste surveille pour le moment']],
    styles: {
      font: 'helvetica', fontSize: 8, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: C.text, lineColor: C.line, lineWidth: 0.1, valign: 'middle',
    },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 36, halign: 'center' },
      2: { cellWidth: 46, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 46, halign: 'center' },
      4: { cellWidth: 60, halign: 'right' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const badge = hookData.cell.raw
        hookData.cell.styles.textColor = badge === 'Fiable' ? C.green : badge === 'Surveillé' ? C.orange : badge === 'Dangereux' ? C.red : C.text
      }
    },
    didDrawPage: onDrawPage,
  })

  // ── Page 2 — alertes fraude pompistes ──────────────
  doc.addPage()
  drawAFHeader()
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.text)
  doc.text('Alertes fraude - pompistes (anti-fraude compteur)', 14, 42)

  autoTable(doc, {
    startY: 46,
    margin: { top: 40, right: 14, bottom: 16, left: 14 },
    head: [['#', 'Pompiste', 'Ecart essence', 'Ecart gasoil', 'Montant perdu estime', 'Statut', 'Detecte le']],
    body: alertesFraude.length
      ? alertesFraude.map(a => [
          String(a.id),
          a.pompisteNom ?? '-',
          fmtEcartPdf(a.ecartEssence),
          fmtEcartPdf(a.ecartGasoil),
          fmtGNF(a.montantPerdu),
          a.statut === 'resolu' ? 'Resolu' : 'En cours',
          fmtDate(a.date),
        ])
      : [['-', 'Aucune alerte fraude pompiste detectee', '-', '-', '-', '-', '-']],
    styles: {
      font: 'helvetica', fontSize: 8, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: C.text, lineColor: C.line, lineWidth: 0.1, valign: 'middle',
    },
    headStyles: { fillColor: C.red, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 36, halign: 'right' },
      4: { cellWidth: 50, halign: 'right' },
      5: { cellWidth: 30, halign: 'center' },
      6: { cellWidth: 42 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 5) {
        hookData.cell.styles.textColor  = hookData.cell.raw === 'Resolu' ? C.green : C.red
        hookData.cell.styles.fontStyle  = 'bold'
      }
    },
    didDrawPage: onDrawPage,
  })

  // ── Page 3 — vol de carburant au cours du transport ───
  doc.addPage()
  drawAFHeader()
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.text)
  doc.text('Vol de carburant au cours du transport', 14, 42)

  autoTable(doc, {
    startY: 46,
    margin: { top: 40, right: 14, bottom: 16, left: 14 },
    head: [['#', 'Chauffeur', 'Citerne', 'Depart (L)', 'Arrivee (L)', 'Ecart', 'Montant perdu estime', 'QR code', 'Statut', 'Detecte le']],
    body: alertesTransport.length
      ? alertesTransport.map(t => [
          String(t.id),
          t.chauffeurNom ?? '-',
          t.citerneCode ?? '-',
          fmtL(t.qtyDepart),
          t.qtyArrivee != null ? fmtL(t.qtyArrivee) : '-',
          fmtEcartPdf(t.ecart),
          fmtGNF(t.montantPerdu),
          t.qrCode ?? '-',
          t.statut === 'resolu' ? 'Resolu' : 'En cours',
          fmtDate(t.date),
        ])
      : [['-', 'Aucune alerte fraude transport detectee', '-', '-', '-', '-', '-', '-', '-', '-']],
    styles: {
      font: 'helvetica', fontSize: 7.5, cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      textColor: C.text, lineColor: C.line, lineWidth: 0.1, valign: 'middle',
    },
    headStyles: { fillColor: C.orange, textColor: C.white, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
      6: { cellWidth: 44, halign: 'right' },
      7: { cellWidth: 38, halign: 'center' },
      8: { cellWidth: 26, halign: 'center' },
      9: { cellWidth: 38 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 8) {
        hookData.cell.styles.textColor = hookData.cell.raw === 'Resolu' ? C.green : C.red
        hookData.cell.styles.fontStyle = 'bold'
      }
    },
    didDrawPage: onDrawPage,
  })

  drawFooter(doc)
  doc.save(`Fuelo_AntiFraude_${fileSlug(name)}_${stamp()}.pdf`)
}

// ── EXPORT EXCEL — CENTRE ANTI-FRAUDE (multi-feuilles) ─
export const exportAntiFraudeExcel = async (data, nomStation = 'Station') => {
  if (!data) return
  const name = cleanName(nomStation)
  const { stats = {}, fraudesParMois = [], classementPompistes = [], alertesFraude = [], alertesTransport = [] } = data

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Fuelo'; wb.created = new Date(); wb.modified = new Date()
  wb.subject = 'Rapport Centre Anti-Fraude'
  wb.title   = 'Fuelo - Centre Anti-Fraude'

  const fmtStatutCas = (s) => (s === 'resolu' ? 'Resolu' : 'En cours')

  // ── Feuille 1 : Resume ─────────────────────────────
  const ws1 = wb.addWorksheet('Résumé')
  styleCols(ws1, [{ width: 34 }, { width: 22 }, { width: 16 }, { width: 16 }])

  addTitleBand(ws1, 'FUELO — CENTRE ANTI-FRAUDE — RAPPORT COMPLET', 'A1:D1', XL.red)
  addMetaRow(ws1, `Station : ${name}  ·  Généré le : ${fmtDateXL(new Date())}`, 'A2:D2')
  ws1.addRow([]).height = 8

  addSectionHeader(ws1, '▸  INDICATEURS CLÉS', 'A4:D4', XL.orange)
  addColHeaders(ws1, ['INDICATEUR', 'VALEUR', '', ''], ['left', 'right', 'left', 'left'])

  const kpis = [
    ['Total fraudes détectées',        stats.totalFraudes ?? 0,        '#,##0'],
    ['Montant récupéré estimé (GNF)',  stats.montantRecupere ?? 0,     '#,##0'],
    ['Pompistes surveillés',           stats.pompistesSurveilles ?? 0, '#,##0'],
    ['Taux de fraude (%)',             stats.tauxFraude ?? 0,          '0.0'],
    ['Alertes fraude pompistes',       alertesFraude.length,           '#,##0'],
    ['Alertes fraude transport',       alertesTransport.length,        '#,##0'],
  ]
  kpis.forEach(([label, val, fmtCode], i) => {
    const row = addDataRow(ws1, [label, val, '', ''], ['left', 'right', 'left', 'left'], i % 2 === 1, ['', fmtCode, '', ''])
    if (val > 0 && (label.startsWith('Total fraudes') || label.startsWith('Alertes')))
      row.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // ── Feuille 2 : Fraudes par mois ───────────────────
  const ws2 = wb.addWorksheet('Fraudes par mois')
  styleCols(ws2, [{ width: 18 }, { width: 16 }, { width: 16 }, { width: 14 }])
  ws2.views = [{ state: 'frozen', ySplit: 5 }]

  addTitleBand(ws2, 'FUELO — FRAUDES PAR MOIS (12 DERNIERS MOIS)', 'A1:D1', XL.red)
  addMetaRow(ws2, `Généré le : ${fmtDateXL(new Date())}`, 'A2:D2')
  addMetaRow(ws2, `${fraudesParMois.reduce((s, m) => s + (m.total ?? 0), 0)} cas de fraude au total sur la période`, 'A3:D3')
  ws2.addRow([]).height = 8

  const h2 = addColHeaders(ws2, ['MOIS', 'POMPISTES', 'CHAUFFEURS', 'TOTAL'], ['left', 'right', 'right', 'right'])
  ws2.autoFilter = { from: { row: h2.number, column: 1 }, to: { row: h2.number, column: 4 } }

  const moisRows = fraudesParMois.length ? fraudesParMois : [{ mois: '-', pompistes: 0, chauffeurs: 0, total: 0 }]
  moisRows.forEach((m, i) => {
    const row = addDataRow(ws2, [m.mois, m.pompistes ?? 0, m.chauffeurs ?? 0, m.total ?? 0],
      ['left', 'right', 'right', 'right'], i % 2 === 1, ['', '#,##0', '#,##0', '#,##0'])
    if ((m.total ?? 0) > 0) row.getCell(4).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // ── Feuille 3 : Classement pompistes ───────────────
  const ws3 = wb.addWorksheet('Classement pompistes')
  styleCols(ws3, [
    { width: 8 }, { width: 28 }, { width: 32 }, { width: 14 },
    { width: 12 }, { width: 12 }, { width: 16 }, { width: 22 },
  ])
  ws3.views = [{ state: 'frozen', ySplit: 5 }]
  ws3.properties.tabColor = { argb: XL.blue }

  addTitleBand(ws3, 'FUELO — CLASSEMENT FIABILITÉ POMPISTES', 'A1:H1', XL.blue)
  addMetaRow(ws3, `Généré le : ${fmtDateXL(new Date())}`, 'A2:H2')
  addMetaRow(ws3, `${classementPompistes.length} pompiste(s) classé(s) — score basé sur le taux et le nombre de fraudes`, 'A3:H3')
  ws3.addRow([]).height = 8

  const h3 = addColHeaders(ws3,
    ['ID', 'POMPISTE', 'EMAIL', 'SERVICES', 'FRAUDES', 'SCORE / 100', 'BADGE', 'MONTANT FRAUDÉ ESTIMÉ'],
    ['center', 'left', 'left', 'right', 'right', 'right', 'center', 'right']
  )
  ws3.autoFilter = { from: { row: h3.number, column: 1 }, to: { row: h3.number, column: 8 } }

  const classementRows = classementPompistes.length
    ? classementPompistes
    : [{ id: '-', nom: 'Aucun pompiste', email: '-', totalServices: 0, fraudes: 0, score: 0, badge: '-', montantFraude: 0 }]

  const badgeColor = (badge) => badge === 'Fiable' ? XL.green : badge === 'Surveillé' ? XL.orange : badge === 'Dangereux' ? XL.red : XL.text

  classementRows.forEach((p, i) => {
    const row = addDataRow(ws3,
      [p.id, p.nom, p.email ?? '-', p.totalServices ?? 0, p.fraudes ?? 0, p.score ?? 0, p.badge ?? '-', p.montantFraude ?? 0],
      ['center', 'left', 'left', 'right', 'right', 'right', 'center', 'right'],
      i % 2 === 1,
      ['', '', '', '#,##0', '#,##0', '#,##0', '', '#,##0']
    )
    row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: badgeColor(p.badge) } }
    row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: badgeColor(p.badge) } }
    if ((p.fraudes ?? 0) > 0) row.getCell(5).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // ── Feuille 4 : Alertes pompistes ──────────────────
  const ws4 = wb.addWorksheet('Alertes pompistes')
  styleCols(ws4, [
    { width: 8 }, { width: 28 }, { width: 16 }, { width: 16 },
    { width: 22 }, { width: 14 }, { width: 20 }, { width: 20 },
  ])
  ws4.views = [{ state: 'frozen', ySplit: 5 }]
  ws4.properties.tabColor = { argb: XL.red }

  addTitleBand(ws4, 'FUELO — ALERTES FRAUDE POMPISTES (ANTI-FRAUDE COMPTEUR)', 'A1:H1', XL.red)
  addMetaRow(ws4, `Généré le : ${fmtDateXL(new Date())}`, 'A2:H2')
  addMetaRow(ws4, `${alertesFraude.length} alerte(s) — écarts compteur essence/gasoil détectés en fin de service`, 'A3:H3')
  ws4.addRow([]).height = 8

  const h4 = addColHeaders(ws4,
    ['ID', 'POMPISTE', 'ÉCART ESSENCE (L)', 'ÉCART GASOIL (L)', 'MONTANT PERDU ESTIMÉ', 'STATUT', 'DÉTECTÉ LE', 'TERMINÉ LE'],
    ['center', 'left', 'right', 'right', 'right', 'center', 'center', 'center']
  )
  ws4.autoFilter = { from: { row: h4.number, column: 1 }, to: { row: h4.number, column: 8 } }

  const alertesFraudeRows = alertesFraude.length
    ? alertesFraude
    : [{ id: '-', pompisteNom: 'Aucune alerte', ecartEssence: 0, ecartGasoil: 0, montantPerdu: 0, statut: '-', date: null, dateFin: null }]

  alertesFraudeRows.forEach((a, i) => {
    const row = addDataRow(ws4,
      [a.id, a.pompisteNom ?? '-', a.ecartEssence ?? 0, a.ecartGasoil ?? 0, a.montantPerdu ?? 0,
       fmtStatutCas(a.statut), a.date ? fmtDateXL(a.date) : '-', a.dateFin ? fmtDateXL(a.dateFin) : '-'],
      ['center', 'left', 'right', 'right', 'right', 'center', 'center', 'center'],
      i % 2 === 1,
      ['', '', '+#,##0.0;-#,##0.0;0.0', '+#,##0.0;-#,##0.0;0.0', '#,##0', '', '', '']
    )
    row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: a.statut === 'resolu' ? XL.green : XL.red } }
    if (Math.abs(a.ecartEssence ?? 0) >= 0.05) row.getCell(3).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
    if (Math.abs(a.ecartGasoil  ?? 0) >= 0.05) row.getCell(4).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  // ── Feuille 5 : Alertes transport ──────────────────
  const ws5 = wb.addWorksheet('Alertes transport')
  styleCols(ws5, [
    { width: 8 }, { width: 26 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 12 }, { width: 22 }, { width: 18 }, { width: 14 }, { width: 20 },
  ])
  ws5.views = [{ state: 'frozen', ySplit: 5 }]
  ws5.properties.tabColor = { argb: XL.orange }

  addTitleBand(ws5, 'FUELO — VOL DE CARBURANT AU COURS DU TRANSPORT', 'A1:J1', XL.orange)
  addMetaRow(ws5, `Généré le : ${fmtDateXL(new Date())}`, 'A2:J2')
  addMetaRow(ws5, `${alertesTransport.length} alerte(s) — écarts jauge départ/arrivée détectés sur trajet`, 'A3:J3')
  ws5.addRow([]).height = 8

  const h5 = addColHeaders(ws5,
    ['ID', 'CHAUFFEUR', 'CITERNE', 'DÉPART (L)', 'ARRIVÉE (L)', 'ÉCART (L)', 'MONTANT PERDU ESTIMÉ', 'QR CODE', 'STATUT', 'DÉTECTÉ LE'],
    ['center', 'left', 'center', 'right', 'right', 'right', 'right', 'center', 'center', 'center']
  )
  ws5.autoFilter = { from: { row: h5.number, column: 1 }, to: { row: h5.number, column: 10 } }

  const alertesTransportRows = alertesTransport.length
    ? alertesTransport
    : [{ id: '-', chauffeurNom: 'Aucune alerte', citerneCode: '-', qtyDepart: 0, qtyArrivee: null, ecart: 0, montantPerdu: 0, qrCode: '-', statut: '-', date: null }]

  alertesTransportRows.forEach((t, i) => {
    const row = addDataRow(ws5,
      [t.id, t.chauffeurNom ?? '-', t.citerneCode ?? '-', t.qtyDepart ?? 0,
       t.qtyArrivee != null ? t.qtyArrivee : '—', t.ecart ?? 0, t.montantPerdu ?? 0,
       t.qrCode ?? '-', fmtStatutCas(t.statut), t.date ? fmtDateXL(t.date) : '-'],
      ['center', 'left', 'center', 'right', 'right', 'right', 'right', 'center', 'center', 'center'],
      i % 2 === 1,
      ['', '', '', '#,##0.0', '#,##0.0', '+#,##0.0;-#,##0.0;0.0', '#,##0', '', '', '']
    )
    row.getCell(9).font = { name: 'Calibri', size: 10, bold: true, color: { argb: t.statut === 'resolu' ? XL.green : XL.red } }
    if (Math.abs(t.ecart ?? 0) > 0) row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: XL.red } }
  })

  await downloadBuffer(wb, `Fuelo_AntiFraude_${fileSlug(name)}_${stamp()}.xlsx`)
}
