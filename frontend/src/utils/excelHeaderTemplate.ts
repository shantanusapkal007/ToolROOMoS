import ExcelJS from 'exceljs';

/**
 * Helper to get 1-based column index from column letter e.g. 'A' -> 1, 'N' -> 14, 'Q' -> 17
 */
function colLetterToNumber(letter: string): number {
  let column = 0;
  const length = letter.length;
  for (let i = 0; i < length; i++) {
    column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
  }
  return column;
}

/**
 * Fetch company logo ArrayBuffer from public directory
 */
export async function fetchKrupaLogo(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('/Krupa_Logo.png');
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Applies the official Krupa Tools header layout with logo, red company title, address, GST, tagline, and document title.
 * Fits perfectly to any column span.
 */
export async function applyKrupaHeader(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  documentTitle: string,
  startCol: string = 'A',
  endCol: string = 'N'
): Promise<number> {
  const maxColIdx = colLetterToNumber(endCol);

  // Embed logo (Spans A1 to C3)
  const logoBuffer = await fetchKrupaLogo();
  if (logoBuffer) {
    const imageId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 145, height: 85 },
    });
  }

  const borderStyle: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: 'FF000000' }
  };

  const applyRowBorder = (rowNum: number) => {
    const r = sheet.getRow(rowNum);
    for (let c = 1; c <= maxColIdx; c++) {
      const cell = r.getCell(c);
      cell.border = {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle
      };
    }
  };

  // Merge A1:C3 for Logo Area Box
  sheet.mergeCells(`A1:C3`);
  applyRowBorder(1);
  applyRowBorder(2);
  applyRowBorder(3);

  // Row 1: Company Name (RED, Bold, 20pt)
  sheet.getRow(1).height = 36;
  sheet.mergeCells(`D1:${endCol}1`);
  const companyCell = sheet.getCell(`D1`);
  companyCell.value = 'KRUPA TOOLS & STAMPING LTD.';
  companyCell.font = { name: 'Calibri', size: 20, bold: true, color: { argb: 'FFCC0000' } };
  companyCell.alignment = { vertical: 'middle', horizontal: 'center' };
  applyRowBorder(1);

  // Row 2: Address
  sheet.getRow(2).height = 20;
  sheet.mergeCells(`D2:${endCol}2`);
  const addrCell = sheet.getCell(`D2`);
  addrCell.value = 'GUT NO.23,PLOT NO.45 MIDC WALUJ, AURANGABAD-431136';
  addrCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF000000' } };
  addrCell.alignment = { vertical: 'middle', horizontal: 'center' };
  applyRowBorder(2);

  // Row 3: GST
  sheet.getRow(3).height = 20;
  sheet.mergeCells(`D3:${endCol}3`);
  const gstCell = sheet.getCell(`D3`);
  gstCell.value = 'GST NO : 27AAKCK1751B1ZS';
  gstCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF000000' } };
  gstCell.alignment = { vertical: 'middle', horizontal: 'center' };
  applyRowBorder(3);

  // Row 4: Tagline
  sheet.getRow(4).height = 22;
  sheet.mergeCells(`${startCol}4:${endCol}4`);
  const taglineCell = sheet.getCell(`${startCol}4`);
  taglineCell.value = 'Manufacturers of Press Tools,Jig Fixtures,Die sets, Gauge,All Types of Engineering Works';
  taglineCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF000000' } };
  taglineCell.alignment = { vertical: 'middle', horizontal: 'center' };
  applyRowBorder(4);

  // Row 5: Document Title (Underlined)
  sheet.getRow(5).height = 26;
  sheet.mergeCells(`${startCol}5:${endCol}5`);
  const titleCell = sheet.getCell(`${startCol}5`);
  titleCell.value = documentTitle.toUpperCase();
  titleCell.font = { name: 'Calibri', size: 13, bold: true, underline: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  applyRowBorder(5);

  return 6; // Returns next available row index
}
