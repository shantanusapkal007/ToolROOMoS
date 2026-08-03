import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';

export interface PoExportData {
  poNumber: string;
  rmSlipNo?: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  deliveryTerms?: string;
  items: Array<{
    toolNo: string;
    detNo: string;
    length: string;
    width: string;
    height: string;
    materialGrade: string;
    orderedQty: number;
    apWt: number;
    totalWt: number;
    agreedRate: number;
    basicValue: number;
    gstAmount: number;
    lineTotal: number;
    remarks?: string;
  }>;
}

export async function exportPoToExcel(data: PoExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Purchase Order', {
    views: [{ showGridLines: true }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    },
  });

  // Apply Krupa Official Header
  let r = await applyKrupaHeader(workbook, sheet, 'PURCHASE ORDER', 'A', 'O');

  const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD4D4D8' } };

  // Vendor Info Block
  r += 1;
  const metaStart = r;

  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'VENDOR NAME:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.vendorName;

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'RM SLIP NO:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:O${r}`);
  sheet.getCell(`K${r}`).value = data.rmSlipNo || data.poNumber;

  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'ADDRESS:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.vendorAddress || 'CHAKAN PUNE';

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'DATE:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:O${r}`);
  sheet.getCell(`K${r}`).value = data.date;

  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'DELIVERY TERMS:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:G${r}`);
  sheet.getCell(`C${r}`).value = data.deliveryTerms || 'DELIVERY WITHIN 1 DAYS';

  sheet.mergeCells(`I${r}:J${r}`);
  sheet.getCell(`I${r}`).value = 'PO NO:';
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`K${r}:O${r}`);
  sheet.getCell(`K${r}`).value = data.poNumber;
  sheet.getCell(`K${r}`).font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };

  for (let rowIdx = metaStart; rowIdx <= r; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    for (let c = 1; c <= 15; c++) {
      row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    }
  }

  r += 2;

  // Table Headers
  const headers = [
    'SR.NO', 'TOOL NO', 'DET NO', 'L', 'W', 'H', 'MATERIAL',
    'QTY', 'AP WT', 'TOTAL WT', 'RATE (₹)', 'BASIC COST (₹)', 'GST (₹)', 'TOTAL (₹)', 'REMARKS'
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

  let totalQty = 0;
  let totalApWt = 0;
  let totalWt = 0;
  let totalBasic = 0;
  let totalGst = 0;
  let totalGrand = 0;

  r++;
  data.items.forEach((item, idx) => {
    sheet.getRow(r).height = 22;
    const qty = Number(item.orderedQty) || 0;
    const apWt = Number(item.apWt) || 0;
    const totWt = Number(item.totalWt) || 0;
    const basic = Number(item.basicValue) || 0;
    const gst = Number(item.gstAmount) || 0;
    const tot = Number(item.lineTotal) || 0;

    totalQty += qty;
    totalApWt += apWt;
    totalWt += totWt;
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
      qty,
      apWt,
      totWt,
      item.agreedRate || 0,
      basic,
      gst,
      tot,
      item.remarks || ''
    ];

    rowValues.forEach((val, cIdx) => {
      const cell = sheet.getRow(r).getCell(cIdx + 1);
      cell.value = val;
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx >= 7 && cIdx <= 13 ? 'right' : 'center' };
      if (cIdx >= 8 && cIdx <= 13) cell.numFmt = '#,##0.00';
      cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    });

    r++;
  });

  // Grand Total Row
  sheet.getRow(r).height = 26;
  sheet.mergeCells(`A${r}:G${r}`);
  const gtCell = sheet.getCell(`A${r}`);
  gtCell.value = 'GRAND TOTAL';
  gtCell.font = { bold: true, size: 10 };
  gtCell.alignment = { vertical: 'middle', horizontal: 'right' };

  sheet.getRow(r).getCell(8).value = totalQty;
  sheet.getRow(r).getCell(9).value = totalApWt;
  sheet.getRow(r).getCell(10).value = totalWt;
  sheet.getRow(r).getCell(12).value = totalBasic;
  sheet.getRow(r).getCell(13).value = totalGst;
  sheet.getRow(r).getCell(14).value = totalGrand;

  [8, 9, 10, 12, 13, 14].forEach(c => {
    const cell = sheet.getRow(r).getCell(c);
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    if (c >= 9) cell.numFmt = '#,##0.00';
  });

  for (let c = 1; c <= 15; c++) {
    sheet.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  }

  r += 3;

  // Signatures
  sheet.getRow(r).height = 24;
  sheet.mergeCells(`A${r}:C${r}`);
  sheet.getCell(`A${r}`).value = 'PREPARED BY';
  sheet.getCell(`A${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`A${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`F${r}:H${r}`);
  sheet.getCell(`F${r}`).value = 'CHECKED BY';
  sheet.getCell(`F${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`F${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`K${r}:M${r}`);
  sheet.getCell(`K${r}`).value = 'AUTHORIZED SIGNATORY';
  sheet.getCell(`K${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`K${r}`).alignment = { horizontal: 'center' };

  // Set column widths
  sheet.columns = [
    { width: 8 },   // SR.NO
    { width: 14 },  // TOOL NO
    { width: 10 },  // DET NO
    { width: 8 },   // L
    { width: 8 },   // W
    { width: 8 },   // H
    { width: 18 },  // MATERIAL
    { width: 12 },  // QTY
    { width: 12 },  // AP WT
    { width: 12 },  // TOTAL WT
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
  a.download = `${data.poNumber.replace(/[\/\\]/g, '_')}_Purchase_Order.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
