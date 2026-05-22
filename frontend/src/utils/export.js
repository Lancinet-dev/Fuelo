// ================================================
// FUELO V2 - Export PDF + Excel
// Fichier : frontend/src/utils/export.js
// ================================================

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatLitres, formatDateTime } from './format'

const PDF = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  orange: [245, 158, 11],
  green: [16, 185, 129],
  red: [239, 68, 68],
  slate: [100, 116, 139],
  text: [30, 41, 59],
  soft: [248, 250, 252],
  line: [226, 232, 240],
  white: [255, 255, 255],
}

const STOCK_ALERT_THRESHOLD = 300

const toNumber = (value) => Number(value) || 0

const formatReportGNF = (value) => `${toNumber(value).toLocaleString('fr-FR')} GNF`

const getSafeStationName = (name = 'Station') => {
  const value = String(name ?? '').trim()
  if (!value) return 'Station'
  return /^\d+$/.test(value) ? 'Ma Station' : value
}

const getFilenamePart = (value = 'Station') =>
  getSafeStationName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Station'

const getReportStamp = () => new Date().toISOString().slice(0, 10)

const getGeneratedAtLabel = () =>
  new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const getLongDateLabel = (value) =>
  new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const getFuelLabel = (type = '') => {
  const value = String(type).trim().toLowerCase()
  if (value === 'gasoil') return 'Gasoil'
  if (value === 'essence') return 'Essence'
  return value || 'Inconnu'
}

const getEmployeeLabel = (vente = {}) => {
  const value = String(vente.employe_nom ?? '').trim()
  return value || 'Pompiste'
}

const getPricePerLitre = (vente = {}) => {
  const litres = toNumber(vente.litres)
  const montant = toNumber(vente.montant_gnf)
  if (litres <= 0) return 0
  return montant / litres
}

const getPeriodLabel = (ventes = []) => {
  if (!ventes.length) return 'Aucune transaction'

  const timestamps = ventes
    .map((vente) => new Date(vente.created_at).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)

  if (!timestamps.length) return 'Dates indisponibles'

  const firstDate = timestamps[0]
  const lastDate = timestamps[timestamps.length - 1]

  if (getLongDateLabel(firstDate) === getLongDateLabel(lastDate)) {
    return `Le ${getLongDateLabel(firstDate)}`
  }

  return `Du ${getLongDateLabel(firstDate)} au ${getLongDateLabel(lastDate)}`
}

const buildVentesSummary = (ventes = []) => {
  const summary = {
    totalTransactions: ventes.length,
    totalLitres: 0,
    totalMontant: 0,
    averageTicket: 0,
    averageLitres: 0,
    byType: {
      essence: { label: 'Essence', count: 0, litres: 0, montant: 0 },
      gasoil: { label: 'Gasoil', count: 0, litres: 0, montant: 0 },
    },
    byEmployee: [],
  }

  const employeeMap = new Map()

  ventes.forEach((vente) => {
    const type = String(vente.type ?? '').trim().toLowerCase() === 'gasoil' ? 'gasoil' : 'essence'
    const litres = toNumber(vente.litres)
    const montant = toNumber(vente.montant_gnf)
    const employee = getEmployeeLabel(vente)

    summary.totalLitres += litres
    summary.totalMontant += montant
    summary.byType[type].count += 1
    summary.byType[type].litres += litres
    summary.byType[type].montant += montant

    const currentEmployee = employeeMap.get(employee) ?? {
      employe: employee,
      transactions: 0,
      litres: 0,
      montant: 0,
    }

    currentEmployee.transactions += 1
    currentEmployee.litres += litres
    currentEmployee.montant += montant
    employeeMap.set(employee, currentEmployee)
  })

  summary.averageTicket = summary.totalTransactions > 0 ? summary.totalMontant / summary.totalTransactions : 0
  summary.averageLitres = summary.totalTransactions > 0 ? summary.totalLitres / summary.totalTransactions : 0
  summary.byEmployee = Array.from(employeeMap.values())
    .map((employee) => ({
      ...employee,
      ticketMoyen: employee.transactions > 0 ? employee.montant / employee.transactions : 0,
    }))
    .sort((a, b) => b.montant - a.montant)

  return summary
}

const buildStockRows = (stocks = {}) => {
  const essence = toNumber(stocks.essence ?? stocks.essence?.quantite)
  const gasoil = toNumber(stocks.gasoil ?? stocks.gasoil?.quantite)

  return [
    {
      type: 'Essence',
      quantite: essence,
      statut: essence <= STOCK_ALERT_THRESHOLD ? 'Critique' : 'Normal',
      seuil: STOCK_ALERT_THRESHOLD,
      marge: Math.max(essence - STOCK_ALERT_THRESHOLD, 0),
    },
    {
      type: 'Gasoil',
      quantite: gasoil,
      statut: gasoil <= STOCK_ALERT_THRESHOLD ? 'Critique' : 'Normal',
      seuil: STOCK_ALERT_THRESHOLD,
      marge: Math.max(gasoil - STOCK_ALERT_THRESHOLD, 0),
    },
  ]
}

const setNumberFormat = (worksheet, cellAddress, format) => {
  if (worksheet[cellAddress]) {
    worksheet[cellAddress].z = format
  }
}

const applyNumberFormatToColumn = (worksheet, columnIndex, rowStart, rowEnd, format) => {
  for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })
    setNumberFormat(worksheet, cellAddress, format)
  }
}

const createSummarySheet = (ventes, stationName) => {
  const summary = buildVentesSummary(ventes)
  const data = [
    ['FUELO - RAPPORT DES VENTES'],
    [`Station : ${stationName}`],
    [`Genere le : ${getGeneratedAtLabel()}`],
    [`Periode couverte : ${getPeriodLabel(ventes)}`],
    [],
    ['INDICATEUR', 'VALEUR'],
    ['Transactions', summary.totalTransactions],
    ['Litres totaux', summary.totalLitres],
    ['Montant total (GNF)', summary.totalMontant],
    ['Ticket moyen (GNF)', summary.averageTicket],
    ['Moyenne litres / vente', summary.averageLitres],
    [],
    ['REPARTITION PAR CARBURANT'],
    ['Type', 'Transactions', 'Litres', 'Montant GNF'],
    ['Essence', summary.byType.essence.count, summary.byType.essence.litres, summary.byType.essence.montant],
    ['Gasoil', summary.byType.gasoil.count, summary.byType.gasoil.litres, summary.byType.gasoil.montant],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(data)
  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
  ]
  worksheet['!merges'] = [
    XLSX.utils.decode_range('A1:D1'),
    XLSX.utils.decode_range('A2:D2'),
    XLSX.utils.decode_range('A3:D3'),
    XLSX.utils.decode_range('A4:D4'),
    XLSX.utils.decode_range('A13:D13'),
  ]

  applyNumberFormatToColumn(worksheet, 1, 6, 10, '#,##0.0')
  setNumberFormat(worksheet, 'B7', '#,##0')
  setNumberFormat(worksheet, 'B8', '#,##0.0 "L"')
  setNumberFormat(worksheet, 'B9', '#,##0 "GNF"')
  setNumberFormat(worksheet, 'B10', '#,##0 "GNF"')
  setNumberFormat(worksheet, 'B11', '#,##0.0 "L"')
  applyNumberFormatToColumn(worksheet, 1, 14, 15, '#,##0')
  applyNumberFormatToColumn(worksheet, 2, 14, 15, '#,##0.0 "L"')
  applyNumberFormatToColumn(worksheet, 3, 14, 15, '#,##0 "GNF"')

  return worksheet
}

const createTransactionsSheet = (ventes, stationName) => {
  const rows = [
    ['FUELO - DETAIL DES TRANSACTIONS'],
    [`Station : ${stationName}`],
    [`Periode : ${getPeriodLabel(ventes)}`],
    [],
    ['ID', 'Carburant', 'Employe', 'Litres', 'Montant GNF', 'Prix / L', 'Date et heure'],
  ]

  ventes.forEach((vente) => {
    rows.push([
      vente.id,
      getFuelLabel(vente.type),
      getEmployeeLabel(vente),
      toNumber(vente.litres),
      toNumber(vente.montant_gnf),
      getPricePerLitre(vente),
      formatDateTime(vente.created_at),
    ])
  })

  if (ventes.length === 0) {
    rows.push(['-', '-', 'Aucune transaction', 0, 0, 0, '-'])
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const lastRow = rows.length

  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 24 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
  ]
  worksheet['!merges'] = [
    XLSX.utils.decode_range('A1:G1'),
    XLSX.utils.decode_range('A2:G2'),
    XLSX.utils.decode_range('A3:G3'),
  ]
  worksheet['!autofilter'] = { ref: `A5:G${lastRow}` }

  applyNumberFormatToColumn(worksheet, 3, 5, lastRow - 1, '#,##0.0 "L"')
  applyNumberFormatToColumn(worksheet, 4, 5, lastRow - 1, '#,##0 "GNF"')
  applyNumberFormatToColumn(worksheet, 5, 5, lastRow - 1, '#,##0 "GNF"')

  return worksheet
}

const createEmployeesSheet = (ventes) => {
  const summary = buildVentesSummary(ventes)
  const rows = [
    ['FUELO - PERFORMANCE PAR EMPLOYE'],
    [`Genere le : ${getGeneratedAtLabel()}`],
    [],
    ['Employe', 'Transactions', 'Litres', 'Montant GNF', 'Ticket moyen'],
  ]

  summary.byEmployee.forEach((employee) => {
    rows.push([
      employee.employe,
      employee.transactions,
      employee.litres,
      employee.montant,
      employee.ticketMoyen,
    ])
  })

  if (summary.byEmployee.length === 0) {
    rows.push(['Aucune donnee', 0, 0, 0, 0])
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const lastRow = rows.length

  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ]
  worksheet['!merges'] = [
    XLSX.utils.decode_range('A1:E1'),
    XLSX.utils.decode_range('A2:E2'),
  ]
  worksheet['!autofilter'] = { ref: `A4:E${lastRow}` }

  applyNumberFormatToColumn(worksheet, 1, 4, lastRow - 1, '#,##0')
  applyNumberFormatToColumn(worksheet, 2, 4, lastRow - 1, '#,##0.0 "L"')
  applyNumberFormatToColumn(worksheet, 3, 4, lastRow - 1, '#,##0 "GNF"')
  applyNumberFormatToColumn(worksheet, 4, 4, lastRow - 1, '#,##0 "GNF"')

  return worksheet
}

const drawPdfHeader = (doc, stationName, ventes) => {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFillColor(...PDF.navy)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setFillColor(...PDF.orange)
  doc.rect(0, 0, 4, 32, 'F')

  doc.setTextColor(...PDF.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('FUELO', 14, 14)

  doc.setFontSize(11)
  doc.setTextColor(207, 216, 228)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport des ventes', 14, 21)
  doc.text(`Periode : ${getPeriodLabel(ventes)}`, 14, 27)

  doc.setTextColor(...PDF.white)
  doc.setFontSize(10)
  doc.text(`Station : ${stationName}`, pageWidth - 14, 14, { align: 'right' })
  doc.setTextColor(207, 216, 228)
  doc.text(`Genere le : ${getGeneratedAtLabel()}`, pageWidth - 14, 20, { align: 'right' })
  doc.text(`${ventes.length} transaction(s)`, pageWidth - 14, 26, { align: 'right' })
}

const drawPdfFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageCount = doc.internal.getNumberOfPages()
  const currentPage = doc.getCurrentPageInfo().pageNumber

  doc.setDrawColor(...PDF.line)
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF.slate)
  doc.text(`Fuelo - Export professionnel`, 14, pageHeight - 7)
  doc.text(`Page ${currentPage} / ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' })
}

const drawMetricCard = (doc, x, y, width, title, value, accent) => {
  doc.setFillColor(...PDF.soft)
  doc.setDrawColor(...PDF.line)
  doc.roundedRect(x, y, width, 24, 3, 3, 'FD')

  doc.setFillColor(...accent)
  doc.roundedRect(x, y, 4, 24, 3, 3, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF.slate)
  doc.text(title.toUpperCase(), x + 8, y + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...PDF.text)
  doc.text(value, x + 8, y + 17)
}

const drawTypeBreakdownCard = (doc, x, y, width, data, accent) => {
  doc.setFillColor(...PDF.white)
  doc.setDrawColor(...PDF.line)
  doc.roundedRect(x, y, width, 28, 3, 3, 'FD')

  doc.setFillColor(...accent)
  doc.circle(x + 8, y + 8, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF.text)
  doc.text(data.label, x + 14, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...PDF.slate)
  doc.text(`${data.count} transaction(s)`, x + 8, y + 16)
  doc.text(formatLitres(data.litres), x + 8, y + 22)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF.text)
  doc.text(formatReportGNF(data.montant), x + width - 8, y + 22, { align: 'right' })
}

export const exportVentesExcel = (ventes, nomStation = 'Station') => {
  const stationName = getSafeStationName(nomStation)
  const workbook = XLSX.utils.book_new()

  workbook.Props = {
    Title: `Rapport des ventes - ${stationName}`,
    Subject: 'Export Fuelo',
    Author: 'Fuelo',
    Company: 'Fuelo',
    CreatedDate: new Date(),
  }

  XLSX.utils.book_append_sheet(workbook, createSummarySheet(ventes, stationName), 'Resume')
  XLSX.utils.book_append_sheet(workbook, createTransactionsSheet(ventes, stationName), 'Transactions')
  XLSX.utils.book_append_sheet(workbook, createEmployeesSheet(ventes), 'Par employe')

  XLSX.writeFile(
    workbook,
    `Fuelo_Ventes_${getFilenamePart(stationName)}_${getReportStamp()}.xlsx`
  )
}

export const exportVentesPDF = (ventes, nomStation = 'Station') => {
  const stationName = getSafeStationName(nomStation)
  const summary = buildVentesSummary(ventes)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  drawPdfHeader(doc, stationName, ventes)

  drawMetricCard(doc, 14, 40, 62, 'Transactions', String(summary.totalTransactions), PDF.blue)
  drawMetricCard(doc, 82, 40, 62, 'Litres vendus', formatLitres(summary.totalLitres), PDF.green)
  drawMetricCard(doc, 150, 40, 62, 'Montant total', formatReportGNF(summary.totalMontant), PDF.orange)
  drawMetricCard(doc, 218, 40, 65, 'Ticket moyen', formatReportGNF(summary.averageTicket), PDF.red)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PDF.text)
  doc.text('Repartition par carburant', 14, 73)

  drawTypeBreakdownCard(doc, 14, 76, 132, summary.byType.essence, PDF.blue)
  drawTypeBreakdownCard(doc, 151, 76, 132, summary.byType.gasoil, PDF.green)

  autoTable(doc, {
    startY: 112,
    margin: { top: 38, right: 14, bottom: 18, left: 14 },
    head: [['ID', 'Carburant', 'Employe', 'Litres', 'Montant', 'Prix / L', 'Date et heure']],
    body: (ventes.length ? ventes : [{}]).map((vente, index) => {
      if (!ventes.length) {
        return ['-', '-', 'Aucune transaction', '-', '-', '-', '-']
      }

      return [
        vente.id ?? index + 1,
        getFuelLabel(vente.type),
        getEmployeeLabel(vente),
        formatLitres(vente.litres),
        formatReportGNF(vente.montant_gnf),
        formatReportGNF(getPricePerLitre(vente)),
        formatDateTime(vente.created_at),
      ]
    }),
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: PDF.text,
      lineColor: PDF.line,
      lineWidth: 0.1,
      valign: 'middle',
    },
    headStyles: {
      fillColor: PDF.navy,
      textColor: PDF.white,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: PDF.soft,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 52 },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 34, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 46 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawPdfHeader(doc, stationName, ventes)
      }
      drawPdfFooter(doc)
    },
  })

  doc.save(`Fuelo_Ventes_${getFilenamePart(stationName)}_${getReportStamp()}.pdf`)
}

export const exportStockExcel = (stocks, nomStation = 'Station') => {
  const stationName = getSafeStationName(nomStation)
  const stockRows = buildStockRows(stocks)
  const totalStock = stockRows.reduce((sum, row) => sum + row.quantite, 0)

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['FUELO - RAPPORT DE STOCK'],
    [`Station : ${stationName}`],
    [`Genere le : ${getGeneratedAtLabel()}`],
    [],
    ['INDICATEUR', 'VALEUR'],
    ['Stock total', totalStock],
    ['Stock essence', stockRows[0].quantite],
    ['Stock gasoil', stockRows[1].quantite],
  ])

  summarySheet['!cols'] = [{ wch: 22 }, { wch: 16 }]
  summarySheet['!merges'] = [
    XLSX.utils.decode_range('A1:B1'),
    XLSX.utils.decode_range('A2:B2'),
    XLSX.utils.decode_range('A3:B3'),
  ]

  applyNumberFormatToColumn(summarySheet, 1, 5, 7, '#,##0.0 "L"')

  const detailSheet = XLSX.utils.aoa_to_sheet([
    ['Type', 'Quantite (L)', 'Statut', 'Seuil alerte (L)', 'Marge apres seuil (L)'],
    ...stockRows.map((row) => [row.type, row.quantite, row.statut, row.seuil, row.marge]),
  ])

  detailSheet['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
  ]
  detailSheet['!autofilter'] = { ref: 'A1:E3' }

  applyNumberFormatToColumn(detailSheet, 1, 1, 2, '#,##0.0 "L"')
  applyNumberFormatToColumn(detailSheet, 3, 1, 2, '#,##0.0 "L"')
  applyNumberFormatToColumn(detailSheet, 4, 1, 2, '#,##0.0 "L"')

  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: `Rapport de stock - ${stationName}`,
    Subject: 'Export Fuelo',
    Author: 'Fuelo',
    Company: 'Fuelo',
    CreatedDate: new Date(),
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resume')
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Stock')

  XLSX.writeFile(
    workbook,
    `Fuelo_Stock_${getFilenamePart(stationName)}_${getReportStamp()}.xlsx`
  )
}
