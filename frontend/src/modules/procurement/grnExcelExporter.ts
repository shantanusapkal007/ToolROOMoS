import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';

export interface GrnExportData {
  grnNumber: string;
  poNumber: string;
  supplierChallan: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  items: Array<{
    toolNo: string;
    detNo: string;
    length: string;
    width: string;
    height: string;
    materialGrade: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    heatNumber: string;
    rate: number;
    basicCost: number;
    gst: number;
    total: number;
    remarks?: string;
  }>;
}

export async function exportGrnToExcel(data: GrnExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('GRN Sheet', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    },
  });

  // Apply Krupa Official Header
  let r = await applyKrupaHeader(workbook, sheet, 'GOODS RECEIPT NOTE (GRN)', 'A', 'Q');

  // Metadata Block
  r += 1;
  const metaStart = r;

  const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD4D4D8' } };

  // Row 1 Metadata
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'GRN NUMBER:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.grnNumber;
  sheet.getCell(`C${r}`).font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'PO NUMBER:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:Q${r}`);
  sheet.getCell(`K${r}`).value = data.poNumber;
  sheet.getCell(`K${r}`).font = { bold: true, size: 10 };

  // Row 2 Metadata
  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'VENDOR:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.vendorName;

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'CHALLAN NO:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:Q${r}`);
  sheet.getCell(`K${r}`).value = data.supplierChallan || 'N/A';

  // Row 3 Metadata
  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'ADDRESS:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.vendorAddress || 'MIDC Waluj, Chakan Pune';

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'DATE:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:Q${r}`);
  sheet.getCell(`K${r}`).value = data.date;

  // Apply borders to Metadata block
  for (let rowIdx = metaStart; rowIdx <= r; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    for (let c = 1; c <= 17; c++) {
      row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    }
  }

  // Spacing
  r += 2;

  // Table Headers
  const headers = [
    'SR.NO', 'TOOL NO', 'DET NO', 'L', 'W', 'H', 'MATERIAL',
    'QTY ORDERED', 'QTY RECEIVED', 'QTY ACCEPTED', 'QTY REJECTED',
    'HEAT NUMBER', 'RATE (₹)', 'BASIC COST (₹)', 'GST (₹)', 'TOTAL (₹)', 'REMARKS'
  ];

  sheet.getRow(r).height = 24;
  headers.forEach((h, idx) => {
    const cell = sheet.getRow(r).getCell(idx + 1);
    cell.value = h;
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  });

  let totalOrdered = 0;
  let totalReceived = 0;
  let totalAccepted = 0;
  let totalRejected = 0;
  let totalBasic = 0;
  let totalGst = 0;
  let totalGrand = 0;

  r++;
  data.items.forEach((item, idx) => {
    sheet.getRow(r).height = 22;
    const ord = Number(item.orderedQty) || 0;
    const rec = Number(item.receivedQty) || 0;
    const acc = Number(item.acceptedQty) || 0;
    const rej = Number(item.rejectedQty) || 0;
    const basic = Number(item.basicCost) || 0;
    const gst = Number(item.gst) || 0;
    const tot = Number(item.total) || 0;

    totalOrdered += ord;
    totalReceived += rec;
    totalAccepted += acc;
    totalRejected += rej;
    totalBasic += basic;
    totalGst += gst;
    totalGrand += tot;

    const rowValues = [
      idx + 1,
      item.toolNo || '',
      item.detNo || `${idx + 1}`,
      item.length || '',
      item.width || '',
      item.height || '',
      item.materialGrade || 'MS',
      ord,
      rec,
      acc,
      rej,
      item.heatNumber || '',
      item.rate || 0,
      basic,
      gst,
      tot,
      item.remarks || ''
    ];

    rowValues.forEach((val, cIdx) => {
      const cell = sheet.getRow(r).getCell(cIdx + 1);
      cell.value = val;
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx >= 7 && cIdx <= 15 ? 'right' : 'center' };
      if (cIdx >= 12 && cIdx <= 15) {
        cell.numFmt = '#,##0.00';
      }
      cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    });

    r++;
  });

  // Grand Total Row
  sheet.getRow(r).height = 26;
  sheet.mergeCells(`A${r}:G${r}`);
  const gtCell = sheet.getCell(`A${r}`);
  gtCell.value = 'GRAND TOTAL';
  gtCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
  gtCell.alignment = { vertical: 'middle', horizontal: 'right' };

  sheet.getRow(r).getCell(8).value = totalOrdered;
  sheet.getRow(r).getCell(9).value = totalReceived;
  sheet.getRow(r).getCell(10).value = totalAccepted;
  sheet.getRow(r).getCell(11).value = totalRejected;
  sheet.getRow(r).getCell(14).value = totalBasic;
  sheet.getRow(r).getCell(15).value = totalGst;
  sheet.getRow(r).getCell(16).value = totalGrand;

  [8, 9, 10, 11, 14, 15, 16].forEach(c => {
    const cell = sheet.getRow(r).getCell(c);
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    if (c >= 14) cell.numFmt = '#,##0.00';
  });

  for (let c = 1; c <= 17; c++) {
    sheet.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  }

  r += 3;

  // Signatures
  sheet.getRow(r).height = 24;
  sheet.mergeCells(`A${r}:C${r}`);
  sheet.getCell(`A${r}`).value = 'STORES IN-CHARGE';
  sheet.getCell(`A${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`A${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:G${r}`);
  sheet.getCell(`E${r}`).value = 'QUALITY INSPECTOR';
  sheet.getCell(`E${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`I${r}:K${r}`);
  sheet.getCell(`I${r}`).value = 'PURCHASE MANAGER';
  sheet.getCell(`I${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`I${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`M${r}:O${r}`);
  sheet.getCell(`M${r}`).value = 'ACCOUNTS AUDIT';
  sheet.getCell(`M${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`M${r}`).alignment = { horizontal: 'center' };

  // Set column widths
  sheet.columns = [
    { width: 8 },   // SR.NO
    { width: 14 },  // TOOL NO
    { width: 10 },  // DET NO
    { width: 8 },   // L
    { width: 8 },   // W
    { width: 8 },   // H
    { width: 18 },  // MATERIAL
    { width: 14 },  // QTY ORDERED
    { width: 14 },  // QTY RECEIVED
    { width: 14 },  // QTY ACCEPTED
    { width: 14 },  // QTY REJECTED
    { width: 16 },  // HEAT NUMBER
    { width: 12 },  // RATE
    { width: 15 },  // BASIC COST
    { width: 12 },  // GST
    { width: 16 },  // TOTAL
    { width: 18 },  // REMARKS
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.grnNumber.replace(/[\/\\]/g, '_')}_GRN.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
