import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';

export interface MaterialIssueExportData {
  issueNumber: string;
  productionSection: string;
  date: string;
  remarks?: string;
  items: Array<{
    materialName: string;
    batchNumber: string;
    heatNumber: string;
    length?: string;
    width?: string;
    height?: string;
    issuedQty: number;
    unitCost: number;
    totalValue: number;
    remarks?: string;
  }>;
}

export async function exportMaterialIssueToExcel(data: MaterialIssueExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Material Issue', {
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
  let r = await applyKrupaHeader(workbook, sheet, 'MATERIAL ISSUE / DISPATCH SLIP', 'A', 'K');

  const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD4D4D8' } };

  // Metadata Block
  r += 1;
  const metaStart = r;

  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'ISSUE NUMBER:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:E${r}`);
  sheet.getCell(`C${r}`).value = data.issueNumber;
  sheet.getCell(`C${r}`).font = { bold: true, size: 10, color: { argb: 'FFD97706' } };

  sheet.mergeCells(`G${r}:H${r}`);
  sheet.getCell(`G${r}`).value = 'SECTION:';
  sheet.getCell(`G${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`I${r}:K${r}`);
  sheet.getCell(`I${r}`).value = data.productionSection;
  sheet.getCell(`I${r}`).font = { bold: true, size: 10 };

  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'DATE:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:E${r}`);
  sheet.getCell(`C${r}`).value = data.date;

  sheet.mergeCells(`G${r}:H${r}`);
  sheet.getCell(`G${r}`).value = 'REMARKS:';
  sheet.getCell(`G${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`I${r}:K${r}`);
  sheet.getCell(`I${r}`).value = data.remarks || 'N/A';

  for (let rowIdx = metaStart; rowIdx <= r; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    }
  }

  r += 2;

  // Table Headers
  const headers = [
    'SR.NO', 'MATERIAL', 'BATCH NO', 'HEAT NO', 'L', 'W', 'H',
    'ISSUED QTY', 'UNIT COST (₹)', 'TOTAL VALUE (₹)', 'REMARKS'
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
  let totalVal = 0;

  r++;
  data.items.forEach((item, idx) => {
    sheet.getRow(r).height = 22;
    const qty = Number(item.issuedQty) || 0;
    const val = Number(item.totalValue) || 0;
    totalQty += qty;
    totalVal += val;

    const rowValues = [
      idx + 1,
      item.materialName || 'Raw Material',
      item.batchNumber || '',
      item.heatNumber || '',
      item.length || '',
      item.width || '',
      item.height || '',
      qty,
      item.unitCost || 0,
      val,
      item.remarks || ''
    ];

    rowValues.forEach((val, cIdx) => {
      const cell = sheet.getRow(r).getCell(cIdx + 1);
      cell.value = val;
      cell.font = { size: 9 };
      cell.alignment = { vertical: 'middle', horizontal: cIdx >= 7 && cIdx <= 9 ? 'right' : 'center' };
      if (cIdx >= 8 && cIdx <= 9) cell.numFmt = '#,##0.00';
      cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    });

    r++;
  });

  // Grand Total Row
  sheet.getRow(r).height = 26;
  sheet.mergeCells(`A${r}:G${r}`);
  const gtCell = sheet.getCell(`A${r}`);
  gtCell.value = 'TOTAL';
  gtCell.font = { bold: true, size: 10 };
  gtCell.alignment = { vertical: 'middle', horizontal: 'right' };

  sheet.getRow(r).getCell(8).value = totalQty;
  sheet.getRow(r).getCell(10).value = totalVal;

  [8, 10].forEach(c => {
    const cell = sheet.getRow(r).getCell(c);
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    if (c === 10) cell.numFmt = '#,##0.00';
  });

  for (let c = 1; c <= 11; c++) {
    sheet.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
  }

  r += 3;

  // Signatures
  sheet.getRow(r).height = 24;
  sheet.mergeCells(`A${r}:C${r}`);
  sheet.getCell(`A${r}`).value = 'ISSUED BY (STORES)';
  sheet.getCell(`A${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`A${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:G${r}`);
  sheet.getCell(`E${r}`).value = 'RECEIVED BY (OPERATOR)';
  sheet.getCell(`E${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`I${r}:K${r}`);
  sheet.getCell(`I${r}`).value = 'AUTHORIZED BY (HOD)';
  sheet.getCell(`I${r}`).font = { bold: true, size: 9 };
  sheet.getCell(`I${r}`).alignment = { horizontal: 'center' };

  // Set column widths
  sheet.columns = [
    { width: 8 },   // SR.NO
    { width: 24 },  // MATERIAL
    { width: 18 },  // BATCH NO
    { width: 14 },  // HEAT NO
    { width: 8 },   // L
    { width: 8 },   // W
    { width: 8 },   // H
    { width: 14 },  // ISSUED QTY
    { width: 15 },  // UNIT COST
    { width: 16 },  // TOTAL VALUE
    { width: 18 },  // REMARKS
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.issueNumber.replace(/[\/\\]/g, '_')}_Material_Issue.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
