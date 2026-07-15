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
export async function exportPremiumBOM(project: any, bomItems: any[], materials: any[], bomHeader: any) {
  if (!project) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('BOM Table', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      orientation: 'landscape',
      margins: { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0, footer: 0 },
    },
  });

  // ── Column widths ──────────────────────────────────────────────────────
  sheet.columns = [
    { width: 2 },    // A - margin
    { width: 6 },    // B - NO.
    { width: 35 },   // C - PART NAME
    { width: 8 },    // D - QTY
    { width: 25 },   // E - CATALOG/SIZE
    { width: 22 },   // F - FINISH SIZES
    { width: 22 },   // G - STOCK SIZES
    { width: 25 },   // H - MATERIAL
    { width: 2 },    // I - margin
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
  sheet.mergeCells(`C${row}:H${row}`);
  const companyCell = sheet.getCell(`C${row}`);
  companyCell.value = 'KRUPA TOOLS & STAMPING LTD.';
  font(companyCell, 20, true, C.darkText, 'Arial');
  companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Tagline
  row = 3;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`C${row}:H${row}`);
  const tagCell = sheet.getCell(`C${row}`);
  tagCell.value = 'BILL OF MATERIALS (BOM) LEDGER';
  font(tagCell, 10, true, C.mediumText);
  tagCell.alignment = { vertical: 'middle' };

  // Row 5: Metadata Banner
  row = 5;
  sheet.getRow(row).height = 24;

  sheet.mergeCells(`B${row}:C${row}`);
  const custLabel = sheet.getCell(`B${row}`);
  custLabel.value = 'CUSTOMER';
  font(custLabel, 10, true, C.mediumText);
  custLabel.alignment = { vertical: 'middle' };
  thinBorder(custLabel, ['left', 'top', 'bottom']);
  thinBorder(sheet.getCell(`C${row}`), ['top', 'bottom']);

  const custVal = sheet.getCell(`D${row}`);
  custVal.value = project.customer?.companyName || '';
  font(custVal, 10, true, C.darkText);
  custVal.alignment = { vertical: 'middle' };
  thinBorder(custVal, ['top', 'bottom']);

  const prjLabel = sheet.getCell(`E${row}`);
  prjLabel.value = 'PROJECT NUMBER';
  font(prjLabel, 10, true, C.mediumText);
  prjLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(prjLabel, ['top', 'bottom']);

  const prjVal = sheet.getCell(`F${row}`);
  prjVal.value = project.projectNumber || '';
  font(prjVal, 10, true, C.darkText);
  prjVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(prjVal, ['top', 'bottom']);

  const verLabel = sheet.getCell(`G${row}`);
  verLabel.value = 'VERSION';
  font(verLabel, 10, true, C.mediumText);
  verLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(verLabel, ['top', 'bottom']);

  const verVal = sheet.getCell(`H${row}`);
  verVal.value = 'V1.0';
  font(verVal, 10, true, C.darkText);
  verVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(verVal, ['top', 'bottom', 'right']);

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE HEADERS
  // ═══════════════════════════════════════════════════════════════════════
  row += 2;
  sheet.getRow(row).height = 28;

  const headers = [
    { col: 'B', text: 'NO.', align: 'center' as const },
    { col: 'C', text: 'PART NAME', align: 'left' as const },
    { col: 'D', text: 'QTY', align: 'center' as const },
    { col: 'E', text: 'CATALOG / DESCRIPTION', align: 'left' as const },
    { col: 'F', text: 'FINISH SIZES (L×W×H)', align: 'center' as const },
    { col: 'G', text: 'STOCK SIZES (L×W×H)', align: 'center' as const },
    { col: 'H', text: 'MATERIAL', align: 'left' as const },
  ];

  headers.forEach(h => {
    const cell = sheet.getCell(`${h.col}${row}`);
    cell.value = h.text;
    font(cell, 10, true, C.white);
    fill(cell, C.darkText);
    cell.alignment = { vertical: 'middle', horizontal: h.align, indent: h.align === 'left' ? 1 : 0 };
    thinBorder(cell, ['top', 'bottom', 'left', 'right'], C.darkText);
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  row++;
  let totalParts = 0;

  bomItems.forEach((item, idx) => {
    const mat = materials?.find((m: any) => m.id === item.materialId);
    const matName = mat ? `${mat.materialCode}` : "";
    
    const finishSizes = item.finishL && item.finishW && item.finishH ? `${item.finishL} X ${item.finishW} X ${item.finishH}` : (item.finishL || "");
    const stockSizes = item.rmL && item.rmW && item.rmH ? `${item.rmL} X ${item.rmW} X ${item.rmH}` : (item.rmL || "");

    totalParts += Number(item.requiredQty || 0);

    sheet.getRow(row).height = 24;

    const isAlt = idx % 2 !== 0;
    const bgColor = isAlt ? C.totalBg : C.white;

    const cols = [
      { col: 'B', val: idx + 1, align: 'center' as const, isMono: false },
      { col: 'C', val: item.partName || '-', align: 'left' as const, isMono: false },
      { col: 'D', val: item.requiredQty || 0, align: 'center' as const, isMono: true },
      { col: 'E', val: item.description || '-', align: 'left' as const, isMono: false },
      { col: 'F', val: finishSizes || '-', align: 'center' as const, isMono: true },
      { col: 'G', val: stockSizes || '-', align: 'center' as const, isMono: true },
      { col: 'H', val: matName || '-', align: 'left' as const, isMono: false },
    ];

    cols.forEach(c => {
      const cell = sheet.getCell(`${c.col}${row}`);
      cell.value = c.val;
      font(cell, 9, false, C.darkText, c.isMono ? 'Consolas' : 'Segoe UI');
      fill(cell, bgColor);
      cell.alignment = { vertical: 'middle', horizontal: c.align, indent: c.align === 'left' ? 1 : 0 };
      thinBorder(cell, ['left', 'right', 'bottom'], C.lightBorder);
    });

    row++;
  });

  // Empty rows padding
  const minRows = Math.max(0, 5 - bomItems.length);
  for (let i = 0; i < minRows; i++) {
    sheet.getRow(row).height = 24;
    ['B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      thinBorder(sheet.getCell(`${col}${row}`), ['left', 'right', 'bottom'], C.lightBorder);
    });
    row++;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  FOOTER / SIGN OFF
  // ═══════════════════════════════════════════════════════════════════════
  row += 3;
  sheet.getRow(row).height = 24;

  const rDateLabel = sheet.getCell(`B${row}`);
  rDateLabel.value = 'RELEASE DATE';
  font(rDateLabel, 10, true, C.mediumText);
  rDateLabel.alignment = { vertical: 'middle' };
  thinBorder(rDateLabel, ['left', 'top', 'bottom']);

  const rDateVal = sheet.getCell(`C${row}`);
  rDateVal.value = bomHeader?.releaseDate ? new Date(bomHeader.releaseDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  font(rDateVal, 10, true, C.darkText);
  rDateVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(rDateVal, ['top', 'bottom']);

  const desLabel = sheet.getCell(`D${row}`);
  desLabel.value = 'DESIGNED BY';
  font(desLabel, 10, true, C.mediumText);
  desLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(desLabel, ['top', 'bottom']);

  const desVal = sheet.getCell(`E${row}`);
  desVal.value = bomHeader?.designerBy || '-';
  font(desVal, 10, true, C.darkText);
  desVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(desVal, ['top', 'bottom']);

  sheet.mergeCells(`F${row}:G${row}`);
  const appLabel = sheet.getCell(`F${row}`);
  appLabel.value = 'APPROVED BY';
  font(appLabel, 10, true, C.mediumText);
  appLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(appLabel, ['top', 'bottom']);
  thinBorder(sheet.getCell(`G${row}`), ['top', 'bottom']);

  const appVal = sheet.getCell(`H${row}`);
  appVal.value = bomHeader?.approvedBy || '-';
  font(appVal, 10, true, C.darkText);
  appVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(appVal, ['top', 'bottom', 'right']);

  // ═══════════════════════════════════════════════════════════════════════
  //  WRITE & DOWNLOAD
  // ═══════════════════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `BOM_${project?.projectNumber || 'Export'}.xlsx`);
}
