"use client";

import React, { useState } from 'react';
import { 
  Printer, 
  ArrowLeft, 
  Download, 
  Building2, 
  Package, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Edit2,
  Trash2,
  Plus,
  RotateCcw,
  Check,
  XCircle
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { printIsolatedElement } from '@/utils/printDocument';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/Button';

interface AuthenticSubcontractPoDocumentProps {
  order: any;
  project?: any;
  onBack: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

// Convert numbers to Indian Rupees words
function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num < 10) return singleDigits[num];
    if (num < 20) return teens[num - 10];
    const unit = num % 10;
    return tens[Math.floor(num / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let res = '';
    if (hundred) res += singleDigits[hundred] + ' Hundred';
    if (hundred && rest) res += ' and ';
    if (rest) res += convertTwoDigits(rest);
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let remainder = rounded % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const parts: string[] = [];
  if (crore) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh) parts.push(convertThreeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(convertThreeDigits(thousand) + ' Thousand');
  if (remainder) parts.push(convertThreeDigits(remainder));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

export function AuthenticSubcontractPoDocument({ order, project, onBack, onCancel, onDelete }: AuthenticSubcontractPoDocumentProps) {
  const [isEditingTerms, setIsEditingTerms] = useState<boolean>(false);
  const [terms, setTerms] = useState<string[]>([
    "The materials dispatched under this Challan / PO remain the exclusive property of Krupa Tools & Stampings Ltd. and are issued strictly for job work / outside processing under Section 143 of the CGST Act.",
    "Goods must be inspected upon arrival. Delivery Challan / Gate Pass copy must be signed, stamped, and returned to the driver/delivery person.",
    "All finished/processed components must be returned accompanied by vendor delivery challan and process test certificate (e.g. Hardness / Coating report).",
    "Any rejection, dimensional distortion, cracking, or scrap during outside processing must be immediately reported to our Quality Department and returned with the batch.",
    "Processing must strictly adhere to specified technical hardness (HRC), tolerances, and surface finish.",
    "Delivery must be completed on or before the specified Expected Return Date.",
  ]);

  const items = order.items || [];
  
  // Calculate Totals
  let totalQty = 0;
  let totalHours = 0;
  let totalBasic = 0;
  let totalGst = 0;
  let totalCost = 0;

  items.forEach((item: any) => {
    const qty = Number(item.sentQty || 0);
    const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
    const rate = Number(item.rate || 0);
    const lineHours = qty * hoursPerPc;
    const basic = Number(item.lineEstimatedCost || lineHours * rate);
    const gst = basic * 0.18; // Standard 18% GST for job work
    const lineTotal = basic + gst;

    totalQty += qty;
    totalHours += lineHours;
    totalBasic += basic;
    totalGst += gst;
    totalCost += lineTotal;
  });

  totalBasic = Math.round((totalBasic + Number.EPSILON) * 100) / 100;
  totalGst = Math.round((totalGst + Number.EPSILON) * 100) / 100;
  totalCost = Math.round((totalCost + Number.EPSILON) * 100) / 100;

  const handlePrint = () => {
    printIsolatedElement('authentic-subcontract-po-sheet', {
      orientation: 'portrait',
      title: `Job_Work_PO_${order.challanNumber || 'Challan'}`,
    });
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KRUPA TOOLS & STAMPINGS LTD.';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Job Work PO', {
      views: [{ showGridLines: true }],
      pageSetup: {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
      },
    });

    // Company Header
    sheet.mergeCells('A1:J1');
    const headerCell = sheet.getCell('A1');
    headerCell.value = 'KRUPA TOOLS & STAMPINGS LTD.';
    headerCell.font = { bold: true, size: 16, color: { argb: 'FFEE1D36' } };
    headerCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:J2');
    sheet.getCell('A2').value = 'GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136 | GST: 27AAKCK1751B1ZS';
    sheet.getCell('A2').alignment = { horizontal: 'center' };
    sheet.getCell('A2').font = { size: 9, bold: true };

    sheet.mergeCells('A3:J3');
    sheet.getCell('A3').value = 'SUBCONTRACT JOB WORK PURCHASE ORDER & DELIVERY CHALLAN';
    sheet.getCell('A3').alignment = { horizontal: 'center' };
    sheet.getCell('A3').font = { size: 12, bold: true, underline: true };

    // Meta details
    sheet.getCell('A5').value = 'VENDOR:';
    sheet.getCell('B5').value = order.vendor?.vendorName || 'Outsource Vendor';
    sheet.getCell('A6').value = 'ADDRESS:';
    sheet.getCell('B6').value = order.vendor?.address || 'MIDC Waluj, Chhatrapati Sambhajinagar';
    sheet.getCell('A7').value = 'VENDOR GSTIN:';
    sheet.getCell('B7').value = order.vendor?.gstNumber || 'N/A';

    sheet.getCell('G5').value = 'CHALLAN NO:';
    sheet.getCell('H5').value = order.challanNumber;
    sheet.getCell('G6').value = 'DATE:';
    sheet.getCell('H6').value = formatDate(order.createdAt);
    sheet.getCell('G7').value = 'RETURN DATE:';
    sheet.getCell('H7').value = order.expectedReturnDate ? formatDate(order.expectedReturnDate) : '7 Days';

    sheet.getCell('G8').value = 'PROJECT:';
    sheet.getCell('H8').value = `${project?.projectNumber || 'KTD'} - ${project?.name || ''}`;

    // Table Header
    const rowStart = 10;
    const headers = [
      'SR',
      'OUTSOURCE OPERATION',
      'MATERIAL GRADE / SPEC',
      'BATCH / HEAT NO',
      'MATERIAL SOURCE',
      'SENT QTY',
      'HRS / PC',
      'TOTAL HRS',
      'RATE/HR (INR)',
      'BASIC COST',
      'GST (18%)',
      'TOTAL COST',
    ];

    const hRow = sheet.getRow(rowStart);
    headers.forEach((h, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF4F4F5' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Rows
    items.forEach((item: any, idx: number) => {
      const r = sheet.getRow(rowStart + 1 + idx);
      const isMat = !!item.inventoryBatch;
      const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
      const rate = Number(item.rate || 0);
      const totalHrs = Number(item.sentQty || 0) * hoursPerPc;
      const basic = Number(item.lineEstimatedCost || (totalHrs * rate));
      const gst = basic * 0.18;
      const total = basic + gst;

      r.getCell(1).value = idx + 1;
      r.getCell(2).value = item.operation?.operationName || 'Job Work Operation';
      r.getCell(3).value = item.inventoryBatch?.material?.materialGrade || item.inventoryBatch?.material?.materialName || 'N/A';
      r.getCell(4).value = isMat ? `${item.inventoryBatch?.batchNumber || ''} (Heat: ${item.inventoryBatch?.heatNumber || 'N/A'})` : 'N/A';
      r.getCell(5).value = isMat ? 'Factory Stores Issued' : 'Service Only';
      r.getCell(6).value = Number(item.sentQty || 0);
      r.getCell(7).value = hoursPerPc;
      r.getCell(8).value = totalHrs;
      r.getCell(9).value = rate;
      r.getCell(10).value = basic;
      r.getCell(11).value = gst;
      r.getCell(12).value = total;

      for (let c = 1; c <= 12; c++) {
        r.getCell(c).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });

    const totRow = sheet.getRow(rowStart + 1 + items.length);
    totRow.getCell(1).value = 'TOTAL';
    totRow.getCell(6).value = totalQty;
    totRow.getCell(8).value = totalHours;
    totRow.getCell(10).value = totalBasic;
    totRow.getCell(11).value = totalGst;
    totRow.getCell(12).value = totalCost;
    totRow.font = { bold: true };

    let termR = rowStart + 3 + items.length;
    sheet.getCell(`A${termR}`).value = 'TERMS & CONDITIONS FOR JOB WORK:';
    sheet.getCell(`A${termR}`).font = { bold: true, size: 10 };
    terms.forEach((t, i) => {
      termR += 1;
      sheet.getCell(`A${termR}`).value = `${i + 1}. ${t}`;
      sheet.getCell(`A${termR}`).font = { size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Job_Work_PO_${order.challanNumber}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151824] p-4 sm:p-5 rounded-[14px] border border-border-gray shadow-subtle hide-on-print">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBack}
              title="Back to Subcontract Register"
            >
              Back to Register
            </Button>
          )}
          <div>
            <h2 className="text-body font-bold text-ink flex items-center flex-wrap gap-2.5">
              <span>Subcontract Job Work PO &amp; Delivery Challan</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                order.status === 'CANCELLED'
                  ? 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30'
                  : 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success-border'
              }`}>
                {order.status === 'CANCELLED' ? 'CANCELLED / VOID' : 'Official Factory Document'}
              </span>
            </h2>
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-caption text-cool-gray mt-1">
              <span>Challan: <strong className="font-mono font-bold text-ink">{order.challanNumber}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Vendor: <strong className="font-semibold text-ink">{order.vendor?.vendorName}</strong></span>
              {order.documentNumber && (
                <>
                  <span className="text-border-gray">•</span>
                  <span>Gate Pass: <strong className="font-mono font-medium text-ink">{order.documentNumber}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {onCancel && order.status !== 'CANCELLED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              leftIcon={<XCircle className="w-4 h-4 text-semantic-warning-dark" />}
              className="text-semantic-warning-dark hover:bg-semantic-warning-subtle"
              title="Cancel this Subcontract Challan & restore deducted store stock"
            >
              Cancel Challan
            </Button>
          )}

          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDelete}
              leftIcon={<Trash2 className="w-4 h-4 text-semantic-danger" />}
              className="text-semantic-danger hover:bg-semantic-danger-subtle"
              title="Permanently delete this Subcontract Challan"
            >
              Delete
            </Button>
          )}

          <Button
            variant={isEditingTerms ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsEditingTerms(!isEditingTerms)}
            leftIcon={isEditingTerms ? <Check className="w-4 h-4 stroke-[3]" /> : <Edit2 className="w-4 h-4" />}
            title={isEditingTerms ? "Finish editing terms" : "Edit terms and conditions"}
          >
            {isEditingTerms ? "Done Editing" : "Edit Terms"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          >
            Export Excel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print PO / Save PDF
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Printable Paper Sheet Target (A4 Vertical / Portrait)                      */}
      {/* ========================================================================= */}
      <div
        id="authentic-subcontract-po-sheet"
        data-print-target="true"
        className="printable-sheet bg-white p-6 sm:p-8 print:p-0 rounded-[12px] shadow-level-4 border border-border-gray text-ink max-w-[210mm] mx-auto print:max-w-none print:w-full print:border-none print:shadow-none font-sans"
      >
        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 font-bold text-center py-1.5 uppercase tracking-widest text-xs mb-3 rounded break-inside-avoid">
            ⚠️ THIS SUBCONTRACT CHALLAN IS CANCELLED &amp; VOID — DO NOT DISPATCH GOODS
          </div>
        )}
        {/* Document Header */}
        <div className="border-2 border-zinc-900 p-3 sm:p-4 print:py-1.5 print:px-2 rounded-t-lg flex items-center justify-between gap-3 sm:gap-4 bg-white break-inside-avoid">
          <div className="w-24 sm:w-28 print:w-16 shrink-0 flex items-center justify-center p-1.5 sm:p-2 print:p-0.5 border border-border-gray rounded bg-white">
            <img src="/Krupa_Logo.png" alt="Krupa Logo" className="h-12 sm:h-14 print:h-8 w-auto object-contain" />
          </div>
          
          <div className="flex-1 text-center pr-2">
            <h1 className="text-base sm:text-lg md:text-xl print:text-[11px] font-bold uppercase tracking-wider text-[#ee1d36]">
              KRUPA TOOLS &amp; STAMPINGS LTD.
            </h1>
            <p className="text-[11px] print:text-[7px] font-semibold text-ink mt-0.5 print:mt-0 uppercase tracking-tight print:leading-[1.2]">
              GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136
            </p>
            <p className="text-[11px] print:text-[7px] font-semibold text-ink uppercase tracking-tight print:leading-[1.2]">
              GST NO : 27AAKCK1751B1ZS | STATE: MAHARASHTRA (27)
            </p>
            <p className="text-[9.5px] print:text-[6.5px] font-semibold text-zinc-700 uppercase tracking-tight mt-0.5 print:mt-0 print:leading-[1.2]">
              Manufacturers of Press Tools, Jig Fixtures, Moulds, Precision Tooling &amp; Outside Job Work
            </p>
            <div className="mt-1 print:mt-0.5 pt-0.5 print:pt-0 border-t border-zinc-900/20">
              <span className="font-bold text-xs sm:text-sm print:text-[9px] uppercase tracking-widest text-ink underline">
                SUBCONTRACT JOB WORK PURCHASE ORDER &amp; DELIVERY CHALLAN
              </span>
              <span className="text-[9px] print:text-[6.5px] block text-zinc-600 font-semibold tracking-tight mt-0.5 print:mt-0">
                (Issued under Rule 55 / Section 143 of CGST Act for Outside Job Work Processing)
              </span>
            </div>
          </div>
        </div>

        {/* Vendor & Challan Meta Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8.5px] break-inside-avoid">
          {/* Vendor Details (Left Col) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1.5 print:px-2 border-r-2 border-zinc-900 space-y-1 print:space-y-0.5">
            <div className="flex gap-2">
              <span className="font-bold w-22 print:w-18 text-zinc-600 uppercase text-[10px] print:text-[8px]">JOB WORK VENDOR:</span>
              <span className="font-bold text-ink uppercase text-xs sm:text-sm print:text-[9.5px]">{order.vendor?.vendorName || "OUTSOURCE VENDOR"}</span>
            </div>

            <div className="flex gap-2 text-[11px] print:text-[8px]">
              <span className="font-semibold w-22 print:w-18 text-zinc-600 uppercase text-[10px] print:text-[8px]">ADDRESS:</span>
              <span className="text-zinc-800 print:leading-tight">{order.vendor?.address || "MIDC Waluj Industrial Area, Chhatrapati Sambhajinagar - 431136"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] print:text-[8px] pt-1 print:pt-0.5 border-t border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600">GSTIN: </span>
                <span className="font-mono font-semibold text-ink">{order.vendor?.gstNumber || "UNREGISTERED"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600">CONTACT: </span>
                <span className="font-mono text-ink">{order.vendor?.contactPhone || order.vendor?.contactEmail || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Challan & Project Details (Right Col) */}
          <div className="col-span-5 p-2.5 sm:p-3 print:py-1.5 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/40">
            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7.5px] uppercase">CHALLAN / PO NO:</span>
                <span className="font-mono font-bold text-ink text-xs sm:text-sm print:text-[9px]">{order.challanNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8.5px]">{formatDate(order.createdAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7.5px] uppercase">REF / GATE PASS:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8.5px]">{order.documentNumber || order.challanNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7.5px] uppercase">EXPECTED RETURN:</span>
                <span className="font-mono font-semibold text-amber-700 text-xs print:text-[8.5px]">
                  {order.expectedReturnDate ? formatDate(order.expectedReturnDate) : "Within 7 Days"}
                </span>
              </div>
            </div>

            <div className="pt-0.5 print:pt-0">
              <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7.5px] uppercase">PROJECT / TOOLING:</span>
              <span className="font-semibold text-ink text-[11px] print:text-[8.5px] truncate block">
                {project?.projectNumber || 'KTD-2'} — {project?.name || 'Tooling Project'}
              </span>
              {project?.customer?.customerName && (
                <span className="text-micro text-cool-gray block print:hidden">
                  Customer: {project.customer.customerName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Table of Job Work Operations & Material                                   */}
        {/* ========================================================================= */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden break-inside-avoid">
          <table className="w-full border-collapse text-xs print:text-[8px]">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-900 font-bold text-zinc-800 text-[9.5px] print:text-[7.5px] uppercase tracking-wider">
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-7">SR.</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[120px]">OUTSOURCE OPERATION &amp; SPECS</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[130px]">MATERIAL GRADE &amp; STORES BATCH</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-12">QTY</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-12">HRS/PC</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-14">TOTAL HRS</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-18">RATE/HR (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-18">BASIC (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">GST (18%)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-20">TOTAL (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] print:text-[8px] font-sans">
              {items.map((item: any, idx: number) => {
                const isMaterial = !!item.inventoryBatch;
                const qty = Number(item.sentQty || 0);
                const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
                const rate = Number(item.rate || 0);
                const lineHours = qty * hoursPerPc;
                const basic = Number(item.lineEstimatedCost || lineHours * rate);
                const gst = basic * 0.18;
                const total = basic + gst;

                return (
                  <tr key={idx} className="hover:bg-zinc-50/50 break-inside-avoid">
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-500">{idx + 1}</td>
                    
                    {/* Operation & Specs */}
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300">
                      <div className="font-bold text-ink text-[11.5px] print:text-[8.5px]">
                        {item.operation?.operationName || 'Subcontract Operation'}
                      </div>
                      <div className="text-[10px] print:text-[7.5px] font-normal text-zinc-600 mt-0.5 print:leading-tight">
                        {item.remarks || order.remarks || 'Standard job work specs'}
                      </div>
                    </td>

                    {/* Material Grade & Stores Batch */}
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-ink text-[11px] print:text-[8px]">
                          {item.inventoryBatch?.material?.materialGrade || 
                           item.inventoryBatch?.material?.materialName || 
                           (isMaterial ? 'Factory Raw Material' : 'N/A')}
                        </span>
                        {isMaterial ? (
                          <span className="inline-flex items-center text-[9px] print:text-[6.5px] font-semibold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            Factory Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] print:text-[6.5px] font-semibold text-zinc-600 bg-zinc-100 px-1 py-0.2 rounded border border-zinc-200">
                            Service Only
                          </span>
                        )}
                      </div>
                      {isMaterial ? (
                        <div className="text-[9.5px] print:text-[7px] text-zinc-600 mt-0.5">
                          <span>Batch: <strong className="font-semibold text-ink">{item.inventoryBatch?.batchNumber?.length > 18 ? `${item.inventoryBatch.batchNumber.slice(0, 10)}...${item.inventoryBatch.batchNumber.slice(-5)}` : item.inventoryBatch?.batchNumber}</strong></span>
                          <span className="ml-1 text-zinc-400">•</span>
                          <span className="ml-1">Heat: {item.inventoryBatch?.heatNumber || 'N/A'}</span>
                        </div>
                      ) : (
                        <div className="text-[9.5px] print:text-[7px] text-zinc-400 italic mt-0.5">No Store Stock Issued</div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      {qty} {item.inventoryBatch?.material?.uom || 'NOS'}
                    </td>

                    {/* Hours/Pc */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-800">
                      {hoursPerPc}
                    </td>

                    {/* Total Hours */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      {lineHours.toFixed(1)}
                    </td>

                    {/* Rate / Hour */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-800">
                      ₹{rate.toFixed(2)}
                    </td>

                    {/* Basic */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-semibold text-ink">
                      ₹{basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* GST */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-700">
                      ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total */}
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in Words & Totals Summary Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Left: Amount in Words & Instructions (7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[9px] print:text-[7px] uppercase text-zinc-600">AMOUNT IN WORDS:</span>
              <p className="font-semibold text-ink text-[11px] print:text-[8px] italic mt-0.5 print:mt-0 leading-tight">
                {numberToWordsINR(totalCost)}
              </p>
            </div>

            {(order.remarks || order.documentNumber) && (
              <div className="mt-1 pt-1 border-t border-border-gray">
                <span className="font-bold text-[9px] print:text-[6.5px] uppercase text-zinc-500">GATE PASS NOTES / INSTRUCTIONS:</span>
                <p className="text-[10px] print:text-[7px] text-zinc-700 mt-0.5 leading-tight">
                  {order.remarks || 'Job work issued strictly per drawing tolerances and metallurgical specification.'}
                </p>
              </div>
            )}
          </div>

          {/* Right: Totals Box (5 Cols) */}
          <div className="col-span-5 p-2 sm:p-2.5 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/80">
            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL PIECES SENT:</span>
              <span className="font-mono font-bold text-ink">{totalQty} NOS</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL MACHINING:</span>
              <span className="font-mono font-bold text-ink">{totalHours.toFixed(1)} HRS</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">BASIC JOB WORK:</span>
              <span className="font-mono font-semibold text-ink">
                ₹{totalBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">EST. GST (18%):</span>
              <span className="font-mono font-semibold text-zinc-800">
                ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Subcontract PO Value */}
            <div className="pt-1 border-t border-primary/20 flex justify-between items-center bg-primary/10 border border-primary/30 text-ink p-1.5 print:py-0.5 print:px-1.5 rounded-[6px] mt-1 print:mt-0.5">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[7px] text-primary-dark">EST. OUTSOURCE VALUE:</span>
              <span className="font-mono font-bold text-xs sm:text-sm print:text-[9px] text-primary">
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Terms & Conditions for Job Work */}
        <div className="border-x-2 border-b-2 border-zinc-900 p-2 sm:p-2.5 print:py-1 print:px-2 bg-white break-inside-avoid">
          <div className="flex items-center justify-between pb-0.5 border-b border-border-gray mb-1 print:mb-0.5">
            <span className="font-bold text-[9px] print:text-[7px] uppercase tracking-wider text-zinc-700">
              TERMS &amp; CONDITIONS FOR JOB WORK:
            </span>
            <button
              type="button"
              onClick={() => setIsEditingTerms(!isEditingTerms)}
              className="hide-on-print text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-all"
              title={isEditingTerms ? "Finish editing terms" : "Edit terms and conditions"}
            >
              {isEditingTerms ? (
                <>
                  <Check className="w-3 h-3 text-semantic-success-dark stroke-[3]" />
                  <span className="text-semantic-success-dark font-bold">Done Editing</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-3 h-3 text-primary" />
                  <span>Edit Terms</span>
                </>
              )}
            </button>
          </div>

          {isEditingTerms && (
            <div className="space-y-1.5 hide-on-print bg-canvas p-2.5 rounded-[8px] border border-border-gray my-1.5 shadow-subtle">
              {terms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold text-cool-gray w-4 text-right shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => {
                      const updated = [...terms];
                      updated[idx] = e.target.value;
                      setTerms(updated);
                    }}
                    className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-border-gray rounded text-ink focus:outline-none focus:border-primary"
                    placeholder="Enter condition..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = terms.filter((_, i) => i !== idx);
                      setTerms(updated.length > 0 ? updated : ['']);
                    }}
                    disabled={terms.length <= 1}
                    className="text-cool-gray hover:text-semantic-danger p-1 disabled:opacity-30 cursor-pointer"
                    title="Remove clause"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              <div className="flex items-center justify-between pt-1.5 border-t border-border-gray">
                <button
                  type="button"
                  onClick={() => setTerms([...terms, ''])}
                  className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Clause</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTerms([
                    "The materials dispatched under this Challan / PO remain the exclusive property of Krupa Tools & Stampings Ltd. and are issued strictly for job work / outside processing under Section 143 of the CGST Act.",
                    "Goods must be inspected upon arrival. Delivery Challan / Gate Pass copy must be signed, stamped, and returned to the driver/delivery person.",
                    "All finished/processed components must be returned accompanied by vendor delivery challan and process test certificate (e.g. Hardness / Coating report).",
                    "Any rejection, dimensional distortion, cracking, or scrap during outside processing must be immediately reported to our Quality Department and returned with the batch.",
                    "Processing must strictly adhere to specified technical hardness (HRC), tolerances, and surface finish.",
                    "Delivery must be completed on or before the specified Expected Return Date.",
                  ])}
                  className="text-[10px] text-mute hover:text-ink flex items-center gap-1 cursor-pointer"
                  title="Reset to factory default clauses"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>
          )}

          {/* Numbered terms list — 2 Columns in print for compact vertical fit */}
          <div className={isEditingTerms ? 'hidden print:block' : ''}>
            <ol className="grid grid-cols-1 print:grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] print:text-[6.5px] text-zinc-700 leading-tight list-decimal list-inside">
              {terms.map((t, i) => (
                <li key={i} className="leading-tight">{t}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 4-Box Signature Block */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-4 text-center text-xs print:text-[7.5px] p-2 print:py-1 print:px-1 bg-white rounded-b-lg break-inside-avoid">
          <div className="border-r border-border-gray flex flex-col justify-between h-12 sm:h-16 print:h-9 pr-1">
            <div className="h-6 sm:h-9 print:h-4"></div>
            <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider">
              PREPARED BY (STORES)
            </span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-12 sm:h-16 print:h-9 px-1">
            <div className="h-6 sm:h-9 print:h-4"></div>
            <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider">
              CHECKED BY (QC / ENG)
            </span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-12 sm:h-16 print:h-9 px-1">
            <div className="h-6 sm:h-9 print:h-4"></div>
            <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider">
              FOR KRUPA TOOLS &amp; STAMPINGS
            </span>
          </div>

          <div className="flex flex-col justify-between h-12 sm:h-16 print:h-9 pl-1">
            <div className="h-6 sm:h-9 print:h-4"></div>
            <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider">
              VENDOR SIGN &amp; STAMP
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
