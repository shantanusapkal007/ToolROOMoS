import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
// Premium Palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black: 'FF000000',
  darkText: 'FF1D1D1F',
  mediumText: 'FF424245',
  lightText: 'FF86868B',
  headerBg: 'FFF5F5F7',
  border: 'FFD2D2D7',
  lightBorder: 'FFE8E8ED',
  white: 'FFFFFFFF',
  totalBg: 'FFF9FAFB',
  grandTotalBg: 'FF1D1D1F',
  grandTotalText: 'FFFFFFFF',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function font(cell: ExcelJS.Cell, size: number, bold: boolean, color: string, family: string = 'Segoe UI') {
  cell.font = { name: family, size, bold, color: { argb: color } };
}

function thinBorder(cell: ExcelJS.Cell, sides: ('top' | 'bottom' | 'left' | 'right')[], color: string = C.border) {
  const b: Partial<ExcelJS.Borders> = {};
  for (const s of sides) {
    b[s] = { style: 'thin', color: { argb: color } };
  }
  cell.border = { ...cell.border, ...b };
}

function fill(cell: ExcelJS.Cell, color: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

async function fetchLogo(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('/Krupa_Logo.png');
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPremiumRMSlip(po: any) {
  if (!po) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('RM Slip', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0, footer: 0 },
    },
  });

  // ── Column widths ──────────────────────────────────────────────────────
  sheet.columns = [
    { width: 2 },    // A - margin
    { width: 7 },    // B - SR NO
    { width: 12 },   // C - TOOL NO
    { width: 12 },   // D - DET NO
    { width: 8 },    // E - L
    { width: 8 },    // F - W
    { width: 8 },    // G - H
    { width: 22 },   // H - MATERIAL
    { width: 8 },    // I - QTY
    { width: 10 },   // J - AP WT.
    { width: 12 },   // K - TOTAL WT
    { width: 12 },   // L - RATE
    { width: 15 },   // M - BASIC COST
    { width: 12 },   // N - GST
    { width: 15 },   // O - TOTAL
    { width: 2 },    // P - margin
  ];

  // ── Embed logo ─────────────────────────────────────────────────────────
  const logoBuffer = await fetchLogo();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: 1, row: 1 },
      ext: { width: 100, height: 80 },
    });
  }

  let row = 2;

  // ═══════════════════════════════════════════════════════════════════════
  //  HEADER SECTION
  // ═══════════════════════════════════════════════════════════════════════

  // Row 2: Company name
  sheet.getRow(row).height = 30;
  sheet.mergeCells(`D${row}:O${row}`);
  const companyCell = sheet.getCell(`D${row}`);
  companyCell.value = 'KRUPA TOOLS & STAMPINGS LTD.';
  font(companyCell, 20, true, C.darkText, 'Arial');
  companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Address
  row = 3;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`D${row}:O${row}`);
  const addrCell = sheet.getCell(`D${row}`);
  addrCell.value = 'GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANAGABAD.';
  font(addrCell, 10, false, C.mediumText);
  addrCell.alignment = { vertical: 'middle' };

  // Row 5: RM SLIP Banner
  row = 5;
  sheet.getRow(row).height = 28;
  sheet.mergeCells(`B${row}:O${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = 'RAW MATERIAL (RM) SLIP';
  font(titleCell, 14, true, C.white, 'Arial');
  fill(titleCell, C.darkText);
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // ═══════════════════════════════════════════════════════════════════════
  //  VENDOR & SLIP DETAILS
  // ═══════════════════════════════════════════════════════════════════════
  row = 7;
  const vendorStartRow = row;

  // Vendor Fields
  sheet.getRow(row).height = 22;
  sheet.mergeCells(`B${row}:E${row}`);
  const vLabel1 = sheet.getCell(`B${row}`);
  vLabel1.value = 'VENDOR NAME & ADDRESS';
  font(vLabel1, 10, true, C.mediumText);
  vLabel1.alignment = { vertical: 'middle' };
  thinBorder(vLabel1, ['left', 'top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`E${row}`), ['top', 'bottom'], C.border);

  sheet.mergeCells(`F${row}:J${row}`);
  const vVal1 = sheet.getCell(`F${row}`);
  vVal1.value = po.vendor?.companyName || po.vendor?.vendorName || 'STEEL HUB';
  font(vVal1, 10, true, C.darkText);
  vVal1.alignment = { vertical: 'middle' };
  thinBorder(vVal1, ['top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`J${row}`), ['top', 'bottom', 'right'], C.border);

  // Slip Fields
  sheet.mergeCells(`L${row}:M${row}`);
  const sLabel1 = sheet.getCell(`L${row}`);
  sLabel1.value = 'RM SLIP NO';
  font(sLabel1, 10, true, C.mediumText);
  sLabel1.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(sLabel1, ['left', 'top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`M${row}`), ['top', 'bottom'], C.border);

  sheet.mergeCells(`N${row}:O${row}`);
  const sVal1 = sheet.getCell(`N${row}`);
  sVal1.value = po.customFields?.rmSlipNo || 'PUR/26-27/0035';
  font(sVal1, 10, true, C.darkText);
  sVal1.alignment = { vertical: 'middle' };
  thinBorder(sVal1, ['top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`O${row}`), ['top', 'bottom', 'right'], C.border);

  row++;
  sheet.getRow(row).height = 22;
  
  // Address empty label space
  sheet.mergeCells(`B${row}:E${row}`);
  const vLabel2 = sheet.getCell(`B${row}`);
  vLabel2.value = '';
  thinBorder(vLabel2, ['left', 'top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`E${row}`), ['top', 'bottom'], C.border);

  sheet.mergeCells(`F${row}:J${row}`);
  const vVal2 = sheet.getCell(`F${row}`);
  vVal2.value = po.vendor?.address || 'WALUJ';
  font(vVal2, 10, false, C.darkText);
  vVal2.alignment = { vertical: 'middle' };
  thinBorder(vVal2, ['top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`J${row}`), ['top', 'bottom', 'right'], C.border);

  sheet.mergeCells(`L${row}:M${row}`);
  const sLabel2 = sheet.getCell(`L${row}`);
  sLabel2.value = 'DATE';
  font(sLabel2, 10, true, C.mediumText);
  sLabel2.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(sLabel2, ['left', 'top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`M${row}`), ['top', 'bottom'], C.border);

  sheet.mergeCells(`N${row}:O${row}`);
  const sVal2 = sheet.getCell(`N${row}`);
  sVal2.value = po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  font(sVal2, 10, false, C.darkText);
  sVal2.alignment = { vertical: 'middle' };
  thinBorder(sVal2, ['top', 'bottom'], C.border);
  thinBorder(sheet.getCell(`O${row}`), ['top', 'bottom', 'right'], C.border);

  row += 2;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`B${row}:O${row}`);
  const kindly = sheet.getCell(`B${row}`);
  kindly.value = 'KINDLY SUPPLY THE FOLLOWING ITEMS AS PER TERMS & CONDITIONS MENTIONED BELOW.';
  font(kindly, 9, false, C.lightText);

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE HEADERS
  // ═══════════════════════════════════════════════════════════════════════
  row += 2;
  sheet.getRow(row).height = 24;

  const headers = [
    { col: 'B', text: 'SR.NO', align: 'center' as const },
    { col: 'C', text: 'TOOL NO', align: 'center' as const },
    { col: 'D', text: 'DET NO', align: 'center' as const },
    { col: 'E', text: 'L', align: 'center' as const },
    { col: 'F', text: 'W', align: 'center' as const },
    { col: 'G', text: 'H', align: 'center' as const },
    { col: 'H', text: 'MATERIAL', align: 'left' as const },
    { col: 'I', text: 'QTY', align: 'right' as const },
    { col: 'J', text: 'AP WT.', align: 'right' as const },
    { col: 'K', text: 'TOTAL WT', align: 'right' as const },
    { col: 'L', text: 'RATE', align: 'right' as const },
    { col: 'M', text: 'BASIC COST', align: 'right' as const },
    { col: 'N', text: 'GST', align: 'right' as const },
    { col: 'O', text: 'TOTAL', align: 'right' as const },
  ];

  headers.forEach(h => {
    const cell = sheet.getCell(`${h.col}${row}`);
    cell.value = h.text;
    font(cell, 9, true, C.darkText);
    fill(cell, C.headerBg);
    cell.alignment = { vertical: 'middle', horizontal: h.align };
    thinBorder(cell, ['top', 'bottom', 'left', 'right'], C.border);
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  row++;
  let grandQty = 0;
  let grandTotalWt = 0;
  let grandBasicCost = 0;
  let grandGst = 0;
  let grandTotal = 0;

  const items = po.items || [];
  items.forEach((item: any, idx: number) => {
    const grnItem = item.goodsReceiptItems?.[0] || 
                    po.goodsReceiptHeaders?.[0]?.items?.find((i: any) => i.poItemId === item.id);
    
    const qty = grnItem ? Number(grnItem.acceptedQty) : Number(item.orderedQty);
    const rate = Number(item.agreedRate || 0);
    const apWt = Number(grnItem?.apWeight || 0);
    const totalWt = Number(grnItem?.totalWeight || (apWt * qty) || 0);
    const basicCost = Number(grnItem?.basicCost || (totalWt * rate) || 0);
    const gstPercent = Number(item.gstPercent || 18);
    const gst = Number(grnItem?.gst || (basicCost * (gstPercent / 100)) || 0);
    const total = Number(grnItem?.total || (basicCost + gst) || 0);

    grandQty += qty;
    grandTotalWt += totalWt;
    grandBasicCost += basicCost;
    grandGst += gst;
    grandTotal += total;

    sheet.getRow(row).height = 24;

    const cols = [
      { col: 'B', val: idx + 1, fmt: undefined, align: 'center' as const },
      { col: 'C', val: grnItem?.toolNo || po.customFields?.toolNo || '-', fmt: undefined, align: 'center' as const },
      { col: 'D', val: grnItem?.detNo || '-', fmt: undefined, align: 'center' as const },
      { col: 'E', val: grnItem?.length || '-', fmt: undefined, align: 'center' as const },
      { col: 'F', val: grnItem?.width || '-', fmt: undefined, align: 'center' as const },
      { col: 'G', val: grnItem?.height || '-', fmt: undefined, align: 'center' as const },
      { col: 'H', val: item.material?.materialCode || '', fmt: undefined, align: 'left' as const },
      { col: 'I', val: qty, fmt: '#,##0.00', align: 'right' as const },
      { col: 'J', val: apWt > 0 ? apWt : '-', fmt: apWt > 0 ? '#,##0.00' : undefined, align: 'right' as const },
      { col: 'K', val: totalWt > 0 ? totalWt : '-', fmt: totalWt > 0 ? '#,##0.00' : undefined, align: 'right' as const },
      { col: 'L', val: rate, fmt: '#,##0.00', align: 'right' as const },
      { col: 'M', val: basicCost, fmt: '#,##0.00', align: 'right' as const },
      { col: 'N', val: gst, fmt: '#,##0.00', align: 'right' as const },
      { col: 'O', val: total, fmt: '#,##0.00', align: 'right' as const },
    ];

    cols.forEach(c => {
      const cell = sheet.getCell(`${c.col}${row}`);
      cell.value = c.val;
      font(cell, 9, false, C.darkText);
      cell.alignment = { vertical: 'middle', horizontal: c.align };
      if (c.fmt) cell.numFmt = c.fmt;
      thinBorder(cell, ['left', 'right', 'bottom'], C.lightBorder);
    });

    row++;
  });

  // Empty rows
  const minRows = Math.max(0, 3 - items.length);
  for (let i = 0; i < minRows; i++) {
    sheet.getRow(row).height = 24;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'].forEach(col => {
      thinBorder(sheet.getCell(`${col}${row}`), ['left', 'right', 'bottom'], C.lightBorder);
    });
    row++;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GRAND TOTAL ROW
  // ═══════════════════════════════════════════════════════════════════════
  sheet.getRow(row).height = 28;
  
  sheet.mergeCells(`B${row}:H${row}`);
  const gtLabel = sheet.getCell(`B${row}`);
  gtLabel.value = 'GRAND TOTAL';
  font(gtLabel, 11, true, C.grandTotalText, 'Arial');
  fill(gtLabel, C.grandTotalBg);
  gtLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 2 };
  
  for (let c = 2; c <= 8; c++) fill(sheet.getCell(row, c), C.grandTotalBg);

  const gtCols = [
    { col: 'I', val: grandQty, fmt: '#,##0.00' },
    { col: 'J', val: '', fmt: undefined },
    { col: 'K', val: grandTotalWt, fmt: '#,##0.00' },
    { col: 'L', val: '', fmt: undefined },
    { col: 'M', val: grandBasicCost, fmt: '#,##0.00' },
    { col: 'N', val: grandGst, fmt: '#,##0.00' },
    { col: 'O', val: grandTotal, fmt: '#,##0.00' },
  ];

  gtCols.forEach(c => {
    const cell = sheet.getCell(`${c.col}${row}`);
    cell.value = c.val;
    font(cell, 11, true, C.grandTotalText, 'Arial');
    fill(cell, C.grandTotalBg);
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
    if (c.fmt) cell.numFmt = c.fmt;
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  SIGNATURE SECTION
  // ═══════════════════════════════════════════════════════════════════════
  row += 5;
  sheet.getRow(row).height = 25;

  sheet.mergeCells(`B${row}:D${row}`);
  const prepCell = sheet.getCell(`B${row}`);
  prepCell.value = 'Prepared By';
  font(prepCell, 10, true, C.darkText);
  prepCell.alignment = { horizontal: 'center' };
  thinBorder(prepCell, ['top'], C.border);
  thinBorder(sheet.getCell(`C${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`D${row}`), ['top'], C.border);

  sheet.mergeCells(`H${row}:J${row}`);
  const checkCell = sheet.getCell(`H${row}`);
  checkCell.value = 'Checked By';
  font(checkCell, 10, true, C.darkText);
  checkCell.alignment = { horizontal: 'center' };
  thinBorder(checkCell, ['top'], C.border);
  thinBorder(sheet.getCell(`I${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`J${row}`), ['top'], C.border);

  sheet.mergeCells(`M${row}:O${row}`);
  const authCell = sheet.getCell(`M${row}`);
  authCell.value = 'Authorised Signatory';
  font(authCell, 10, true, C.darkText);
  authCell.alignment = { horizontal: 'center' };
  thinBorder(authCell, ['top'], C.border);
  thinBorder(sheet.getCell(`N${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`O${row}`), ['top'], C.border);

  row++;
  sheet.mergeCells(`M${row}:O${row}`);
  const forKtsl = sheet.getCell(`M${row}`);
  forKtsl.value = 'For: KTSL';
  font(forKtsl, 9, false, C.lightText);
  forKtsl.alignment = { horizontal: 'center' };

  // ═══════════════════════════════════════════════════════════════════════
  //  WRITE & DOWNLOAD
  // ═══════════════════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `RMSlip_${po.poNumber}.xlsx`);
}
