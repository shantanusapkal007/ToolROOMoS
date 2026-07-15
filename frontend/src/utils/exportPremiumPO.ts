import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
// Apple-inspired premium color palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black: 'FF000000',
  darkText: 'FF1D1D1F',      // Apple SF text primary
  mediumText: 'FF424245',     // Apple SF text secondary  
  lightText: 'FF86868B',      // Apple SF text tertiary
  mutedLabel: 'FFB0B0B5',    // Ultra-light label text
  accent: 'FF0066CC',         // Apple link blue
  headerBg: 'FFF5F5F7',       // Apple surface grey
  border: 'FFD2D2D7',         // Apple separator
  lightBorder: 'FFE8E8ED',    // Subtle separator
  white: 'FFFFFFFF',
  totalBg: 'FFF9FAFB',        // Subtle highlight for total row
  grandTotalBg: 'FF1D1D1F',   // Dark total bar (inverted)
  grandTotalText: 'FFFFFFFF', // White text on dark bar
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: apply font to a cell
// ─────────────────────────────────────────────────────────────────────────────
function font(
  cell: ExcelJS.Cell,
  size: number,
  bold: boolean,
  color: string,
  family: string = 'Segoe UI'
) {
  cell.font = { name: family, size, bold, color: { argb: color } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: apply thin border to a cell
// ─────────────────────────────────────────────────────────────────────────────
function thinBorder(cell: ExcelJS.Cell, sides: ('top' | 'bottom' | 'left' | 'right')[], color: string = C.border) {
  const b: Partial<ExcelJS.Borders> = {};
  for (const s of sides) {
    b[s] = { style: 'thin', color: { argb: color } };
  }
  cell.border = { ...cell.border, ...b };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fill a cell
// ─────────────────────────────────────────────────────────────────────────────
function fill(cell: ExcelJS.Cell, color: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: apply box border to a range of cells
// ─────────────────────────────────────────────────────────────────────────────
function boxBorder(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, color: string = C.border) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = sheet.getCell(r, c);
      const sides: ('top' | 'bottom' | 'left' | 'right')[] = [];
      if (r === startRow) sides.push('top');
      if (r === endRow) sides.push('bottom');
      if (c === startCol) sides.push('left');
      if (c === endCol) sides.push('right');
      thinBorder(cell, sides, color);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch logo as ArrayBuffer from public path
// ─────────────────────────────────────────────────────────────────────────────
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
// Number to Indian words
// ─────────────────────────────────────────────────────────────────────────────
function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const num = Math.floor(Math.abs(n));
  
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPremiumPO(po: any) {
  if (!po) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Purchase Order', {
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
    { width: 40 },   // C - Material Description
    { width: 12 },   // D - HSN
    { width: 10 },   // E - QTY
    { width: 8 },    // F - UOM
    { width: 14 },   // G - Rate
    { width: 8 },    // H - DISC
    { width: 16 },   // I - Basic Value
    { width: 8 },    // J - CGST %
    { width: 14 },   // K - CGST Value
    { width: 8 },    // L - SGST %
    { width: 14 },   // M - SGST Value
    { width: 18 },   // N - Total Value
    { width: 2 },    // O - margin
  ];

  // ── Fetch & embed logo ─────────────────────────────────────────────────
  const logoBuffer = await fetchLogo();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: 1, row: 1 },
      ext: { width: 110, height: 90 },
    });
  }

  let row = 2;

  // ═══════════════════════════════════════════════════════════════════════
  //  HEADER SECTION
  // ═══════════════════════════════════════════════════════════════════════

  // Row 2: Company name (right of logo space)
  sheet.getRow(row).height = 36;
  sheet.mergeCells(`D${row}:N${row}`);
  const companyCell = sheet.getCell(`D${row}`);
  companyCell.value = 'KRUPA TOOLS & STAMPING LTD.';
  font(companyCell, 22, true, C.darkText, 'Arial');
  companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Address
  row = 3;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`D${row}:N${row}`);
  const addrCell = sheet.getCell(`D${row}`);
  addrCell.value = 'GUT NO.23, PLOT NO.45 MIDC WALUJ, AURANGABAD - 431136';
  font(addrCell, 10, false, C.mediumText);
  addrCell.alignment = { vertical: 'middle' };

  // Row 4: GST & tagline
  row = 4;
  sheet.getRow(row).height = 16;
  sheet.mergeCells(`D${row}:H${row}`);
  const gstCell = sheet.getCell(`D${row}`);
  gstCell.value = 'GSTIN: 27AAKCK1751B1ZS';
  font(gstCell, 9, true, C.mediumText);

  sheet.mergeCells(`I${row}:N${row}`);
  const tagline = sheet.getCell(`I${row}`);
  tagline.value = 'Manufacturers of Press Tools, Jig Fixtures, Die sets, Gauges';
  font(tagline, 8, false, C.lightText);
  tagline.alignment = { horizontal: 'right' };

  // Row 5: "PURCHASE ORDER" banner
  row = 6;
  sheet.getRow(row).height = 32;
  sheet.mergeCells(`B${row}:N${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = 'PURCHASE ORDER';
  font(titleCell, 16, true, C.white, 'Arial');
  fill(titleCell, C.darkText);
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // ═══════════════════════════════════════════════════════════════════════
  //  VENDOR & PO DETAILS SECTION
  // ═══════════════════════════════════════════════════════════════════════

  row = 8;
  const vendorStartRow = row;

  // Vendor block labels
  const vendorFields = [
    { label: 'Vendor Name', value: po.vendor?.companyName || po.vendor?.vendorName || 'NEW ERA METALS' },
    { label: 'Address', value: po.vendor?.address || '45B SHREE JI ARCADE, TATA ROAD NO2, MUMBAI' },
    { label: 'GSTIN', value: po.vendor?.taxId || '27ATGPJ6102R1ZB' },
    { label: 'Contact', value: po.vendor?.contactEmail || po.vendor?.contactPhone || '' },
  ];

  const poFields = [
    { label: 'P.O. NO', value: po.poNumber || '' },
    { label: 'DATE', value: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN') },
    { label: 'REF.', value: 'BY EMAIL' },
  ];

  vendorFields.forEach((vf, idx) => {
    const r = vendorStartRow + idx;
    sheet.getRow(r).height = 22;
    
    // Label
    sheet.mergeCells(`B${r}:C${r}`);
    const labelCell = sheet.getCell(`B${r}`);
    labelCell.value = vf.label;
    font(labelCell, 10, true, C.mediumText);
    labelCell.alignment = { vertical: 'middle' };
    thinBorder(labelCell, ['left', 'top', 'bottom'], C.border);
    thinBorder(sheet.getCell(`C${r}`), ['top', 'bottom'], C.border);

    // Value
    sheet.mergeCells(`D${r}:I${r}`);
    const valCell = sheet.getCell(`D${r}`);
    valCell.value = vf.value;
    font(valCell, 10, false, C.darkText);
    valCell.alignment = { vertical: 'middle' };
    thinBorder(valCell, ['top', 'bottom'], C.border);
    thinBorder(sheet.getCell(`I${r}`), ['top', 'bottom', 'right'], C.border);
  });

  // PO details on the right
  poFields.forEach((pf, idx) => {
    const r = vendorStartRow + idx;
    
    // PO Label
    sheet.mergeCells(`K${r}:L${r}`);
    const poLabelCell = sheet.getCell(`K${r}`);
    poLabelCell.value = pf.label;
    font(poLabelCell, 10, true, C.mediumText);
    poLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
    thinBorder(poLabelCell, ['left', 'top', 'bottom'], C.border);
    thinBorder(sheet.getCell(`L${r}`), ['top', 'bottom'], C.border);

    // PO Value
    sheet.mergeCells(`M${r}:N${r}`);
    const poValCell = sheet.getCell(`M${r}`);
    poValCell.value = pf.value;
    font(poValCell, 10, true, C.darkText);
    poValCell.alignment = { vertical: 'middle' };
    thinBorder(poValCell, ['top', 'bottom'], C.border);
    thinBorder(sheet.getCell(`N${r}`), ['top', 'bottom', 'right'], C.border);
  });

  // ── Salutation ──
  row = vendorStartRow + vendorFields.length + 1;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`B${row}:N${row}`);
  const dearSir = sheet.getCell(`B${row}`);
  dearSir.value = 'Dear Sir,';
  font(dearSir, 10, false, C.mediumText);

  row++;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`B${row}:N${row}`);
  const kindly = sheet.getCell(`B${row}`);
  kindly.value = 'Kindly supply the following material / services in accordance with the terms and conditions mentioned below.';
  font(kindly, 9, false, C.lightText);

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE HEADER (2-row header with merged CGST/SGST)
  // ═══════════════════════════════════════════════════════════════════════
  row += 2;
  const tableHeaderRow1 = row;
  const tableHeaderRow2 = row + 1;

  sheet.getRow(tableHeaderRow1).height = 22;
  sheet.getRow(tableHeaderRow2).height = 18;

  // Columns that span 2 rows vertically
  const verticalHeaders = [
    { col: 'B', text: 'SR\nNO' },
    { col: 'C', text: 'Material Description' },
    { col: 'D', text: 'HSN' },
    { col: 'E', text: 'QTY' },
    { col: 'F', text: 'UOM' },
    { col: 'G', text: 'Rate / Unit\n(INR)' },
    { col: 'H', text: 'DISC.' },
    { col: 'I', text: 'Basic Value\n(INR)' },
    { col: 'N', text: 'TOTAL\nVALUE' },
  ];

  verticalHeaders.forEach(h => {
    sheet.mergeCells(`${h.col}${tableHeaderRow1}:${h.col}${tableHeaderRow2}`);
    const cell = sheet.getCell(`${h.col}${tableHeaderRow1}`);
    cell.value = h.text;
    font(cell, 9, true, C.darkText);
    fill(cell, C.headerBg);
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    thinBorder(cell, ['top', 'bottom', 'left', 'right'], C.border);
  });

  // CGST horizontal merge (J-K)
  sheet.mergeCells(`J${tableHeaderRow1}:K${tableHeaderRow1}`);
  const cgstHeader = sheet.getCell(`J${tableHeaderRow1}`);
  cgstHeader.value = 'CGST';
  font(cgstHeader, 9, true, C.darkText);
  fill(cgstHeader, C.headerBg);
  cgstHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(cgstHeader, ['top', 'left', 'right'], C.border);

  // CGST sub-headers
  const cgstPct = sheet.getCell(`J${tableHeaderRow2}`);
  cgstPct.value = '%';
  font(cgstPct, 8, true, C.lightText);
  fill(cgstPct, C.headerBg);
  cgstPct.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(cgstPct, ['bottom', 'left'], C.border);

  const cgstVal = sheet.getCell(`K${tableHeaderRow2}`);
  cgstVal.value = 'Value (INR)';
  font(cgstVal, 8, true, C.lightText);
  fill(cgstVal, C.headerBg);
  cgstVal.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(cgstVal, ['bottom', 'right'], C.border);

  // SGST horizontal merge (L-M)
  sheet.mergeCells(`L${tableHeaderRow1}:M${tableHeaderRow1}`);
  const sgstHeader = sheet.getCell(`L${tableHeaderRow1}`);
  sgstHeader.value = 'SGST';
  font(sgstHeader, 9, true, C.darkText);
  fill(sgstHeader, C.headerBg);
  sgstHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(sgstHeader, ['top', 'left', 'right'], C.border);

  const sgstPct = sheet.getCell(`L${tableHeaderRow2}`);
  sgstPct.value = '%';
  font(sgstPct, 8, true, C.lightText);
  fill(sgstPct, C.headerBg);
  sgstPct.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(sgstPct, ['bottom', 'left'], C.border);

  const sgstValH = sheet.getCell(`M${tableHeaderRow2}`);
  sgstValH.value = 'Value (INR)';
  font(sgstValH, 8, true, C.lightText);
  fill(sgstValH, C.headerBg);
  sgstValH.alignment = { vertical: 'middle', horizontal: 'center' };
  thinBorder(sgstValH, ['bottom', 'right'], C.border);

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  row = tableHeaderRow2 + 1;

  let grandBasic = 0;
  let grandCgst = 0;
  let grandSgst = 0;
  let grandTotal = 0;

  const items = po.items || [];
  items.forEach((item: any, idx: number) => {
    const qty = Number(item.orderedQty || 0);
    const rate = Number(item.agreedRate || 0);
    const disc = Number(item.discount || 0);
    const basicVal = (qty * rate) - disc;
    const gstPercent = Number(item.gstPercent || 18);
    const cgstPercent = gstPercent / 2;
    const sgstPercent = gstPercent / 2;
    const cgstAmt = basicVal * (cgstPercent / 100);
    const sgstAmt = basicVal * (sgstPercent / 100);
    const totalVal = basicVal + cgstAmt + sgstAmt;

    grandBasic += basicVal;
    grandCgst += cgstAmt;
    grandSgst += sgstAmt;
    grandTotal += totalVal;

    sheet.getRow(row).height = 28;

    const materialDesc = `${item.material?.materialCode || ''} ${item.dimensions || ''}`.trim() || item.material?.materialName || '';

    const cols = [
      { col: 'B', val: idx + 1, fmt: undefined, align: 'center' as const },
      { col: 'C', val: materialDesc, fmt: undefined, align: 'left' as const },
      { col: 'D', val: item.hsnCode || '', fmt: undefined, align: 'center' as const },
      { col: 'E', val: qty, fmt: '#,##0.00', align: 'right' as const },
      { col: 'F', val: item.uom || 'NOS', fmt: undefined, align: 'center' as const },
      { col: 'G', val: rate, fmt: '#,##0.00', align: 'right' as const },
      { col: 'H', val: disc, fmt: '#,##0.00', align: 'right' as const },
      { col: 'I', val: basicVal, fmt: '#,##0.00', align: 'right' as const },
      { col: 'J', val: cgstPercent / 100, fmt: '0%', align: 'center' as const },
      { col: 'K', val: cgstAmt, fmt: '#,##0.00', align: 'right' as const },
      { col: 'L', val: sgstPercent / 100, fmt: '0%', align: 'center' as const },
      { col: 'M', val: sgstAmt, fmt: '#,##0.00', align: 'right' as const },
      { col: 'N', val: totalVal, fmt: '#,##0.00', align: 'right' as const },
    ];

    cols.forEach(c => {
      const cell = sheet.getCell(`${c.col}${row}`);
      cell.value = c.val;
      font(cell, 10, false, C.darkText);
      cell.alignment = { vertical: 'middle', horizontal: c.align };
      if (c.fmt) cell.numFmt = c.fmt;
      thinBorder(cell, ['left', 'right', 'bottom'], C.lightBorder);
    });

    // Make SR NO bold
    font(sheet.getCell(`B${row}`), 10, true, C.mediumText);
    // Make total bold
    font(sheet.getCell(`N${row}`), 10, true, C.darkText);

    row++;
  });

  // ── Empty rows for spacing (minimum 3 blank item rows for consistency)
  const minRows = Math.max(0, 3 - items.length);
  for (let i = 0; i < minRows; i++) {
    sheet.getRow(row).height = 28;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].forEach(col => {
      thinBorder(sheet.getCell(`${col}${row}`), ['left', 'right', 'bottom'], C.lightBorder);
    });
    row++;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GRAND TOTAL ROW
  // ═══════════════════════════════════════════════════════════════════════
  sheet.getRow(row).height = 30;
  sheet.mergeCells(`B${row}:M${row}`);
  const gtLabel = sheet.getCell(`B${row}`);
  gtLabel.value = 'GRAND TOTAL';
  font(gtLabel, 12, true, C.grandTotalText, 'Arial');
  fill(gtLabel, C.grandTotalBg);
  gtLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 2 };

  // Fill merged cells bg
  for (let c = 2; c <= 13; c++) {
    fill(sheet.getCell(row, c), C.grandTotalBg);
  }

  const gtValueCell = sheet.getCell(`N${row}`);
  gtValueCell.value = grandTotal;
  gtValueCell.numFmt = '#,##0.00';
  font(gtValueCell, 13, true, C.grandTotalText, 'Arial');
  fill(gtValueCell, C.grandTotalBg);
  gtValueCell.alignment = { vertical: 'middle', horizontal: 'right' };

  row += 2;

  // ── Amount in words ──
  sheet.getRow(row).height = 22;
  sheet.mergeCells(`B${row}:E${row}`);
  const rsLabel = sheet.getCell(`B${row}`);
  rsLabel.value = `Rs. ${grandTotal.toFixed(2)} /-`;
  font(rsLabel, 11, true, C.darkText);

  row++;
  sheet.getRow(row).height = 22;
  sheet.mergeCells(`B${row}:C${row}`);
  const poValLabel = sheet.getCell(`B${row}`);
  poValLabel.value = 'Purchase Order Value (INR)';
  font(poValLabel, 10, true, C.mediumText);

  sheet.mergeCells(`D${row}:N${row}`);
  const wordsCell = sheet.getCell(`D${row}`);
  wordsCell.value = numberToWords(Math.floor(grandTotal)).toUpperCase() + ' RUPEES ONLY';
  font(wordsCell, 10, true, C.darkText);

  // ═══════════════════════════════════════════════════════════════════════
  //  TERMS & CONDITIONS
  // ═══════════════════════════════════════════════════════════════════════
  row += 2;
  sheet.getRow(row).height = 22;

  // Terms on the left
  sheet.mergeCells(`B${row}:I${row}`);
  const termsTitle = sheet.getCell(`B${row}`);
  termsTitle.value = '*TERMS & CONDITIONS';
  font(termsTitle, 10, true, C.darkText);

  // Commercial info on the right
  sheet.mergeCells(`J${row}:N${row}`);
  const commTitle = sheet.getCell(`J${row}`);
  commTitle.value = '*COMMERCIAL INFORMATION:';
  font(commTitle, 10, true, C.darkText);
  commTitle.alignment = { horizontal: 'right' };

  const terms = [
    { left: '*Delivery schedule :- 2-3 DAYS', right: '' },
    { left: '*Mode of Transport :- BY ROAD', right: 'COMMISIONERATE: A\'BAD.' },
    { left: '*Payment Term:- 45 DAYS', right: '' },
    { left: '*Header Text:- RAW MATERIAL', right: '' },
    { left: '*All the legal concerns associated with Aurangabad jurisdiction board', right: '' },
    { left: 'Please indicate our PO No., Material code & HSN Code on all your correspondence.', right: '' },
    { left: 'The material is to be supplied as per drawing and parts inspection specification / supply specification as applicable.', right: '' },
    { left: '"Any Product delivered under this Purchase order must meet all requirement of ROHS "Restriction of Hazardous Substances" and', right: '' },
    { left: 'Packing material used for packing for such products, should be within legal norms set by Government from time to time.', right: '' },
  ];

  terms.forEach(t => {
    row++;
    sheet.getRow(row).height = 16;
    sheet.mergeCells(`B${row}:I${row}`);
    const leftCell = sheet.getCell(`B${row}`);
    leftCell.value = t.left;
    font(leftCell, 9, false, C.mediumText);

    if (t.right) {
      sheet.mergeCells(`J${row}:N${row}`);
      const rightCell = sheet.getCell(`J${row}`);
      rightCell.value = t.right;
      font(rightCell, 9, false, C.mediumText);
      rightCell.alignment = { horizontal: 'right' };
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  SIGNATURE SECTION
  // ═══════════════════════════════════════════════════════════════════════
  row += 5;

  // Signature lines
  sheet.getRow(row).height = 25;

  sheet.mergeCells(`B${row}:D${row}`);
  const prepCell = sheet.getCell(`B${row}`);
  prepCell.value = 'Prepared By';
  font(prepCell, 10, true, C.darkText);
  prepCell.alignment = { horizontal: 'center' };
  thinBorder(prepCell, ['top'], C.border);
  thinBorder(sheet.getCell(`C${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`D${row}`), ['top'], C.border);

  sheet.mergeCells(`G${row}:I${row}`);
  const checkCell = sheet.getCell(`G${row}`);
  checkCell.value = 'Checked By';
  font(checkCell, 10, true, C.darkText);
  checkCell.alignment = { horizontal: 'center' };
  thinBorder(checkCell, ['top'], C.border);
  thinBorder(sheet.getCell(`H${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`I${row}`), ['top'], C.border);

  sheet.mergeCells(`L${row}:N${row}`);
  const authCell = sheet.getCell(`L${row}`);
  authCell.value = 'Authorised Signatory';
  font(authCell, 10, true, C.darkText);
  authCell.alignment = { horizontal: 'center' };
  thinBorder(authCell, ['top'], C.border);
  thinBorder(sheet.getCell(`M${row}`), ['top'], C.border);
  thinBorder(sheet.getCell(`N${row}`), ['top'], C.border);

  row++;
  sheet.mergeCells(`L${row}:N${row}`);
  const forKtsl = sheet.getCell(`L${row}`);
  forKtsl.value = 'For: KTSL';
  font(forKtsl, 9, false, C.lightText);
  forKtsl.alignment = { horizontal: 'center' };

  // ── Footer ──
  row += 2;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`B${row}:N${row}`);
  const footer = sheet.getCell(`B${row}`);
  footer.value = 'Regd Office : GUT NO.23, PLOT NO.45 MIDC WALUJ, AURANGABAD-431136';
  font(footer, 8, false, C.lightText);
  footer.alignment = { horizontal: 'center' };

  // ═══════════════════════════════════════════════════════════════════════
  //  WRITE & DOWNLOAD
  // ═══════════════════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `PO_${po.poNumber}.xlsx`);
}
