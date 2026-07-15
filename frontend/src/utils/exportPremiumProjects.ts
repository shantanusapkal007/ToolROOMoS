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
};

// ─────────────────────────────────────────────────────────────────────────────
// Status Colors Mapping
// ─────────────────────────────────────────────────────────────────────────────
function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return { bg: 'FFE8F5E9', text: 'FF2E7D32' }; // Emerald
    case 'PLANNING': return { bg: 'FFE3F2FD', text: 'FF1565C0' }; // Blue
    case 'ON_HOLD': return { bg: 'FFFFF3E0', text: 'FFE65100' }; // Amber
    case 'COMPLETED': return { bg: 'FFF3E5F5', text: 'FF6A1B9A' }; // Purple
    default: return { bg: 'FFF5F5F7', text: 'FF424245' }; // Grey
  }
}

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

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPremiumProjects(projects: any[]) {
  if (!projects || projects.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Projects Portfolio', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
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
    { width: 6 },    // B - NO
    { width: 18 },   // C - PROJECT NUM
    { width: 35 },   // D - PART NAME
    { width: 30 },   // E - CUSTOMER
    { width: 15 },   // F - STATUS
    { width: 25 },   // G - STAGE
    { width: 12 },   // H - PRIORITY
    { width: 18 },   // I - TARGET DATE
    { width: 2 },    // J - margin
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
  sheet.mergeCells(`C${row}:I${row}`);
  const companyCell = sheet.getCell(`C${row}`);
  companyCell.value = 'KRUPA TOOLS & STAMPING LTD.';
  font(companyCell, 20, true, C.darkText, 'Arial');
  companyCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: Tagline
  row = 3;
  sheet.getRow(row).height = 18;
  sheet.mergeCells(`C${row}:I${row}`);
  const tagCell = sheet.getCell(`C${row}`);
  tagCell.value = 'PROJECTS PORTFOLIO EXPORT';
  font(tagCell, 10, true, C.mediumText);
  tagCell.alignment = { vertical: 'middle' };

  // Row 5: Metadata Banner
  row = 5;
  sheet.getRow(row).height = 24;

  sheet.mergeCells(`B${row}:C${row}`);
  const dateLabel = sheet.getCell(`B${row}`);
  dateLabel.value = 'EXPORT DATE';
  font(dateLabel, 10, true, C.mediumText);
  dateLabel.alignment = { vertical: 'middle' };
  thinBorder(dateLabel, ['left', 'top', 'bottom']);
  thinBorder(sheet.getCell(`C${row}`), ['top', 'bottom']);

  const dateVal = sheet.getCell(`D${row}`);
  dateVal.value = formatDate(new Date().toISOString());
  font(dateVal, 10, true, C.darkText);
  dateVal.alignment = { vertical: 'middle' };
  thinBorder(dateVal, ['top', 'bottom']);

  const totLabel = sheet.getCell(`H${row}`);
  totLabel.value = 'TOTAL PROJECTS';
  font(totLabel, 10, true, C.mediumText);
  totLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  thinBorder(totLabel, ['top', 'bottom', 'left']);

  const totVal = sheet.getCell(`I${row}`);
  totVal.value = projects.length;
  font(totVal, 10, true, C.darkText);
  totVal.alignment = { vertical: 'middle', indent: 1 };
  thinBorder(totVal, ['top', 'bottom', 'right']);

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE HEADERS
  // ═══════════════════════════════════════════════════════════════════════
  row += 2;
  sheet.getRow(row).height = 28;

  const headers = [
    { col: 'B', text: '#', align: 'center' as const },
    { col: 'C', text: 'PROJECT NO.', align: 'left' as const },
    { col: 'D', text: 'PART NAME', align: 'left' as const },
    { col: 'E', text: 'CUSTOMER', align: 'left' as const },
    { col: 'F', text: 'STATUS', align: 'center' as const },
    { col: 'G', text: 'CURRENT STAGE', align: 'left' as const },
    { col: 'H', text: 'PRIORITY', align: 'center' as const },
    { col: 'I', text: 'TARGET DATE', align: 'center' as const },
  ];

  headers.forEach(h => {
    const cell = sheet.getCell(`${h.col}${row}`);
    cell.value = h.text;
    font(cell, 10, true, C.darkText);
    fill(cell, C.headerBg);
    cell.alignment = { vertical: 'middle', horizontal: h.align, indent: h.align === 'left' ? 1 : 0 };
    thinBorder(cell, ['top', 'bottom', 'left', 'right'], C.border);
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  TABLE ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  row++;

  projects.forEach((p, idx) => {
    sheet.getRow(row).height = 28;

    const isAlt = idx % 2 !== 0;
    const bgColor = isAlt ? C.totalBg : C.white;
    const statusColors = getStatusColor(p.status);

    const cols = [
      { col: 'B', val: idx + 1, align: 'center' as const, fontColor: C.darkText, bg: bgColor },
      { col: 'C', val: p.projectNumber || '-', align: 'left' as const, fontColor: C.darkText, bg: bgColor },
      { col: 'D', val: p.partName || '-', align: 'left' as const, fontColor: C.darkText, bg: bgColor },
      { col: 'E', val: p.customer?.companyName || '-', align: 'left' as const, fontColor: C.mediumText, bg: bgColor },
      { col: 'F', val: p.status || '-', align: 'center' as const, fontColor: statusColors.text, bg: statusColors.bg },
      { col: 'G', val: p.currentStage || '-', align: 'left' as const, fontColor: C.mediumText, bg: bgColor },
      { col: 'H', val: p.priority || '-', align: 'center' as const, fontColor: p.priority === 'HIGH' ? 'FFD32F2F' : C.mediumText, bg: bgColor },
      { col: 'I', val: formatDate(p.targetDeliveryDate), align: 'center' as const, fontColor: C.mediumText, bg: bgColor },
    ];

    cols.forEach(c => {
      const cell = sheet.getCell(`${c.col}${row}`);
      cell.value = c.val;
      font(cell, 9, c.col === 'C' || c.col === 'F', c.fontColor, c.col === 'F' ? 'Consolas' : 'Segoe UI');
      fill(cell, c.bg);
      cell.alignment = { vertical: 'middle', horizontal: c.align, indent: c.align === 'left' ? 1 : 0 };
      thinBorder(cell, ['left', 'right', 'bottom'], C.lightBorder);
    });

    row++;
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  WRITE & DOWNLOAD
  // ═══════════════════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Projects_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
