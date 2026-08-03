import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ─────────────────────────────────────────────────────────────────────────────
// Premium Palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  black: 'FF000000',
  darkText: 'FF1E293B',
  mediumText: 'FF475569',
  lightText: 'FF64748B',
  headerBg: 'FF0F172A',     // Ultra-dark slate blue header
  headerText: 'FFFFFFFF',
  border: 'FFE2E8F0',
  lightBorder: 'FFF1F5F9',
  white: 'FFFFFFFF',
  totalBg: 'FFF8FAFC',
  grandTotalBg: 'FF0F172A',
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
  workbook.creator = 'ToolRoomOS Enterprise Engineering';
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

  // Column widths
  sheet.columns = [
    { width: 2 },    // A - margin
    { width: 6 },    // B - NO.
    { width: 32 },   // C - PART NAME
    { width: 8 },    // D - QTY
    { width: 22 },   // E - RAW STOCK SIZE
    { width: 22 },   // F - FINISH SIZES
    { width: 22 },   // G - MATERIAL
    { width: 14 },   // H - WEIGHT (KG)
    { width: 18 },   // I - EST COST (INR)
    { width: 2 },    // J - margin
  ];

  // Embed logo
  const logoBuffer = await fetchLogo();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: 1, row: 1 },
      ext: { width: 100, height: 75 },
    });
  }

  let row = 2;

  // Title Banner
  const titleCell = sheet.getCell(`C${row}`);
  titleCell.value = 'PROJECT BILL OF MATERIALS (BOM)';
  font(titleCell, 16, true, C.darkText);
  
  row++;
  const subTitleCell = sheet.getCell(`C${row}`);
  subTitleCell.value = `TOOLING PROJECT: ${project.projectNumber || 'PRJ'} | ${project.partName || ''}`;
  font(subTitleCell, 10, true, C.mediumText);

  // Metadata Block
  row += 2;
  sheet.getRow(row).height = 24;

  const prjLabel = sheet.getCell(`B${row}`);
  prjLabel.value = 'PROJECT NUMBER';
  font(prjLabel, 9, true, C.mediumText);
  prjLabel.alignment = { vertical: 'middle' };
  thinBorder(prjLabel, ['top', 'bottom', 'left']);

  const prjVal = sheet.getCell(`C${row}`);
  prjVal.value = project.projectNumber || '';
  font(prjVal, 10, true, C.darkText);
  prjVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(prjVal, ['top', 'bottom']);

  const customerLabel = sheet.getCell(`D${row}`);
  customerLabel.value = 'CUSTOMER';
  font(customerLabel, 9, true, C.mediumText);
  customerLabel.alignment = { vertical: 'middle' };
  thinBorder(customerLabel, ['top', 'bottom']);

  const customerVal = sheet.getCell(`E${row}`);
  customerVal.value = project.customer?.companyName || 'CLIENT';
  font(customerVal, 10, true, C.darkText);
  customerVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(customerVal, ['top', 'bottom']);

  const verLabel = sheet.getCell(`G${row}`);
  verLabel.value = 'RELEASE DATE';
  font(verLabel, 9, true, C.mediumText);
  verLabel.alignment = { vertical: 'middle' };
  thinBorder(verLabel, ['top', 'bottom']);

  const verVal = sheet.getCell(`I${row}`);
  verVal.value = new Date().toLocaleDateString('en-IN');
  font(verVal, 10, true, C.darkText);
  verVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(verVal, ['top', 'bottom', 'right']);

  // Table Headers
  row += 2;
  sheet.getRow(row).height = 28;

  const headers = [
    { col: 'B', text: 'NO.', align: 'center' as const },
    { col: 'C', text: 'PART NAME / COMPONENT', align: 'left' as const },
    { col: 'D', text: 'QTY', align: 'center' as const },
    { col: 'E', text: 'RAW STOCK SIZE (L×W×H mm)', align: 'center' as const },
    { col: 'F', text: 'FINISH SIZE (L×W×H mm)', align: 'center' as const },
    { col: 'G', text: 'MATERIAL GRADE', align: 'left' as const },
    { col: 'H', text: 'EST WEIGHT (KG)', align: 'right' as const },
    { col: 'I', text: 'EST COST (INR)', align: 'right' as const },
  ];

  headers.forEach(h => {
    const cell = sheet.getCell(`${h.col}${row}`);
    cell.value = h.text;
    font(cell, 9, true, C.headerText);
    fill(cell, C.headerBg);
    cell.alignment = { vertical: 'middle', horizontal: h.align, indent: h.align === 'left' ? 1 : 0 };
    thinBorder(cell, ['top', 'bottom', 'left', 'right'], C.headerBg);
  });

  // Table Items
  row++;
  let totalParts = 0;
  let totalWeight = 0;
  let totalCost = 0;

  bomItems.forEach((item, idx) => {
    const mat = materials?.find((m: any) => m.id === item.materialId);
    const matName = mat ? `${mat.materialName} (${mat.materialGrade || ''})` : "Steel";
    
    const finishSizes = item.dimensions || item.finishSize || "-";
    const stockSizes = item.rawSize || item.rawStockSize || "-";
    const weightNum = Number(item.calculatedWeight || 0);
    const costNum = Number(item.estimatedCost || 0);

    totalParts += Number(item.requiredQty || 1);
    totalWeight += weightNum;
    totalCost += costNum;

    sheet.getRow(row).height = 24;
    const isAlt = idx % 2 !== 0;
    const bgColor = isAlt ? C.totalBg : C.white;

    const cols = [
      { col: 'B', val: idx + 1, align: 'center' as const, isMono: true },
      { col: 'C', val: item.customFields?.partName || item.partName || '-', align: 'left' as const, isMono: false },
      { col: 'D', val: Number(item.requiredQty || 1), align: 'center' as const, isMono: true },
      { col: 'E', val: stockSizes, align: 'center' as const, isMono: true },
      { col: 'F', val: finishSizes, align: 'center' as const, isMono: true },
      { col: 'G', val: matName, align: 'left' as const, isMono: false },
      { col: 'H', val: weightNum ? `${weightNum.toFixed(2)} kg` : '0.00 kg', align: 'right' as const, isMono: true },
      { col: 'I', val: costNum ? `₹${costNum.toFixed(2)}` : '₹0.00', align: 'right' as const, isMono: true },
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

  // Grand Total Summary Row
  sheet.getRow(row).height = 26;
  
  const totalLabelCell = sheet.getCell(`C${row}`);
  totalLabelCell.value = 'GRAND TOTAL';
  font(totalLabelCell, 10, true, C.white);
  fill(totalLabelCell, C.grandTotalBg);
  totalLabelCell.alignment = { vertical: 'middle', indent: 1 };

  const totalQtyCell = sheet.getCell(`D${row}`);
  totalQtyCell.value = totalParts;
  font(totalQtyCell, 10, true, C.white, 'Consolas');
  fill(totalQtyCell, C.grandTotalBg);
  totalQtyCell.alignment = { vertical: 'middle', horizontal: 'center' };

  ['E', 'F', 'G'].forEach(col => {
    const c = sheet.getCell(`${col}${row}`);
    fill(c, C.grandTotalBg);
  });

  const totalWtCell = sheet.getCell(`H${row}`);
  totalWtCell.value = `${totalWeight.toFixed(2)} kg`;
  font(totalWtCell, 10, true, C.white, 'Consolas');
  fill(totalWtCell, C.grandTotalBg);
  totalWtCell.alignment = { vertical: 'middle', horizontal: 'right' };

  const totalCostCell = sheet.getCell(`I${row}`);
  totalCostCell.value = `₹${totalCost.toFixed(2)}`;
  font(totalCostCell, 10, true, C.white, 'Consolas');
  fill(totalCostCell, C.grandTotalBg);
  totalCostCell.alignment = { vertical: 'middle', horizontal: 'right' };

  // ── Signature / Approval Block ──────────────────────────────────────────────
  row += 3;

  // Signature space row
  sheet.getRow(row).height = 42;

  const signBoxes = [
    { startCol: 'B', endCol: 'C', label: 'VERIFIED BY DESIGNER', defaultVal: bomHeader?.verifiedByDesigner || project?.verifiedByDesigner || '' },
    { startCol: 'D', endCol: 'E', label: 'PREPARED BY', defaultVal: bomHeader?.preparedBy || project?.preparedBy || 'DESIGN TEAM' },
    { startCol: 'F', endCol: 'G', label: 'CHECKED BY', defaultVal: bomHeader?.checkedBy || project?.checkedBy || '' },
    { startCol: 'H', endCol: 'I', label: 'AUTHORISED SIGNATORY', defaultVal: bomHeader?.authorisedSignatory || project?.authorisedSignatory || '' },
  ];

  signBoxes.forEach(box => {
    sheet.mergeCells(`${box.startCol}${row}:${box.endCol}${row}`);
    const cell = sheet.getCell(`${box.startCol}${row}`);
    cell.value = box.defaultVal;
    font(cell, 10, true, C.darkText);
    cell.alignment = { vertical: 'bottom', horizontal: 'center' };
    
    thinBorder(sheet.getCell(`${box.startCol}${row}`), ['top', 'left', 'bottom'], C.border);
    thinBorder(sheet.getCell(`${box.endCol}${row}`), ['top', 'right', 'bottom'], C.border);
  });

  // Label row
  row++;
  sheet.getRow(row).height = 22;

  signBoxes.forEach(box => {
    sheet.mergeCells(`${box.startCol}${row}:${box.endCol}${row}`);
    const cell = sheet.getCell(`${box.startCol}${row}`);
    cell.value = box.label;
    font(cell, 9, true, C.darkText);
    fill(cell, 'FFF1F5F9');
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    thinBorder(sheet.getCell(`${box.startCol}${row}`), ['top', 'left', 'bottom'], C.border);
    thinBorder(sheet.getCell(`${box.endCol}${row}`), ['top', 'right', 'bottom'], C.border);
  });

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `BOM_${project.projectNumber || 'PRJ'}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
