import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';
import { PurchaseRequisition } from '@/services/purchase-requisitions.service';

export async function exportPrnToExcel(prn: PurchaseRequisition) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Purchase Requisition', {
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
  let r = await applyKrupaHeader(workbook, sheet, 'PURCHASE REQUISITION NOTE (PRN)', 'A', 'M');

  const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD4D4D8' } };

  // Requisition Info Block
  r += 1;
  const metaStart = r;

  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'PRN NUMBER:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:F${r}`);
  sheet.getCell(`C${r}`).value = prn.prNumber;
  sheet.getCell(`C${r}`).font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };

  sheet.mergeCells(`H${r}:I${r}`);
  sheet.getCell(`H${r}`).value = 'DATE:';
  sheet.getCell(`H${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`J${r}:M${r}`);
  sheet.getCell(`J${r}`).value = prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : '-';

  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'PROJECT / TOOL NO:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:F${r}`);
  sheet.getCell(`C${r}`).value = prn.project ? `${prn.project.projectNumber} - ${prn.project.partName}` : 'General Toolroom / Stores';

  sheet.mergeCells(`H${r}:I${r}`);
  sheet.getCell(`H${r}`).value = 'DEPARTMENT:';
  sheet.getCell(`H${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`J${r}:M${r}`);
  sheet.getCell(`J${r}`).value = prn.department || 'Stores / Tool Crib';

  r++;
  sheet.getRow(r).height = 22;
  sheet.mergeCells(`A${r}:B${r}`);
  sheet.getCell(`A${r}`).value = 'REQUESTED BY:';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`C${r}:F${r}`);
  sheet.getCell(`C${r}`).value = prn.requestedBy || 'Shop Floor Supervisor';

  sheet.mergeCells(`H${r}:I${r}`);
  sheet.getCell(`H${r}`).value = 'PRIORITY / STATUS:';
  sheet.getCell(`H${r}`).font = { bold: true, size: 10 };
  sheet.mergeCells(`J${r}:M${r}`);
  sheet.getCell(`J${r}`).value = `${prn.priority} | ${prn.status}`;
  sheet.getCell(`J${r}`).font = { bold: true, size: 10 };

  for (let rowIdx = metaStart; rowIdx <= r; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    for (let c = 1; c <= 13; c++) {
      row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    }
  }

  // Items Header
  r += 2;
  sheet.getRow(r).height = 26;
  const headers = [
    { col: 1, label: 'SR.', width: 6 },
    { col: 2, label: 'DET #', width: 10 },
    { col: 3, label: 'PART / ITEM NAME', width: 26 },
    { col: 4, label: 'MATERIAL GRADE', width: 18 },
    { col: 5, label: 'DIMENSIONS / RAW SIZE', width: 22 },
    { col: 6, label: 'REQ QTY', width: 10 },
    { col: 7, label: 'UOM', width: 8 },
    { col: 8, label: 'EST. RATE (₹)', width: 14 },
    { col: 9, label: 'LINE TOTAL (₹)', width: 16 },
    { col: 10, label: 'ORDERED QTY', width: 12 },
    { col: 11, label: 'STATUS', width: 12 },
    { col: 12, label: 'SUGGESTED VENDOR', width: 20 },
    { col: 13, label: 'REMARKS', width: 22 },
  ];

  headers.forEach((h) => {
    const cell = sheet.getRow(r).getCell(h.col);
    cell.value = h.label;
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    sheet.getColumn(h.col).width = h.width;
  });

  // Table Body Rows
  let totalEstimated = 0;
  prn.items.forEach((item, idx) => {
    r++;
    const row = sheet.getRow(r);
    row.height = 20;

    const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
    totalEstimated += lineTotal;

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = item.detNo || '-';
    row.getCell(3).value = item.itemName || 'Raw Material / Component';
    row.getCell(4).value = item.materialGrade || item.material?.materialGrade || '-';
    row.getCell(5).value = item.dimensions || item.rawSize || '-';
    row.getCell(6).value = Number(item.requiredQuantity);
    row.getCell(7).value = item.uom || 'PCS';
    row.getCell(8).value = Number(item.estimatedRate || 0);
    row.getCell(9).value = lineTotal;
    row.getCell(10).value = Number(item.orderedQty || 0);
    row.getCell(11).value = item.status || 'PENDING';
    row.getCell(12).value = item.suggestedVendor || '-';
    row.getCell(13).value = item.remarks || '-';

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(12).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(13).alignment = { horizontal: 'left', vertical: 'middle' };

    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(9).numFmt = '#,##0.00';

    for (let c = 1; c <= 13; c++) {
      row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
      row.getCell(c).font = { size: 9 };
    }
  });

  // Total Row
  r++;
  sheet.getRow(r).height = 24;
  sheet.mergeCells(`A${r}:H${r}`);
  sheet.getCell(`A${r}`).value = 'TOTAL ESTIMATED AMOUNT (₹):';
  sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
  sheet.getCell(`A${r}`).alignment = { horizontal: 'right', vertical: 'middle' };

  sheet.getCell(`I${r}`).value = totalEstimated;
  sheet.getCell(`I${r}`).font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };
  sheet.getCell(`I${r}`).numFmt = '₹#,##0.00';
  sheet.getCell(`I${r}`).alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 13; c++) {
    sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    sheet.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  }

  // Signatures / Approval Block
  r += 3;
  sheet.getRow(r).height = 30;
  sheet.mergeCells(`A${r}:D${r}`);
  sheet.getCell(`A${r}`).value = `PREPARED BY:\n${prn.requestedBy || 'Storekeeper'}`;
  sheet.getCell(`A${r}`).font = { bold: true, size: 9 };

  sheet.mergeCells(`F${r}:I${r}`);
  sheet.getCell(`F${r}`).value = `VERIFIED / APPROVED BY:\n${prn.approvedBy || (prn.status === 'APPROVED' ? 'Authorized Manager' : 'Pending Approval')}`;
  sheet.getCell(`F${r}`).font = { bold: true, size: 9 };

  sheet.mergeCells(`K${r}:M${r}`);
  sheet.getCell(`K${r}`).value = `PURCHASE DEPT ACTION:\n${prn.status === 'PO_CREATED' ? 'PO Issued' : 'Pending Procurement'}`;
  sheet.getCell(`K${r}`).font = { bold: true, size: 9 };

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prn.prNumber}_Requisition.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
