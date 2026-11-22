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
  Check
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { printIsolatedElement } from '@/utils/printDocument';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface AuthenticSubcontractPoDocumentProps {
  order: any;
  project?: any;
  onBack: () => void;
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

export function AuthenticSubcontractPoDocument({ order, project, onBack }: AuthenticSubcontractPoDocumentProps) {
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
      orientation: 'landscape',
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
        orientation: 'landscape',
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
      <div className="flex items-center justify-between bg-zinc-900 text-white p-4 rounded-[12px] shadow-subtle hide-on-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Back to Register"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <span>Subcontract Job Work PO & Delivery Challan</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Official Factory Document
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Challan #: <strong className="text-white font-mono">{order.challanNumber}</strong> | Vendor: <strong className="text-white">{order.vendor?.vendorName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingTerms(!isEditingTerms)}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-[10px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title={isEditingTerms ? "Finish editing terms" : "Edit terms and conditions"}
          >
            {isEditingTerms ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-300">Done Editing</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                <span>Edit Terms</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-[10px] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-[10px] text-xs font-semibold flex items-center gap-2 shadow-subtle transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print PO / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Printable Paper Sheet Target                                              */}
      {/* ========================================================================= */}
      <div
        id="authentic-subcontract-po-sheet"
        data-print-target="true"
        className="printable-sheet bg-white p-8 rounded-[12px] shadow-level-4 border border-border-gray text-ink max-w-[1050px] mx-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none font-sans"
      >
        {/* Document Header */}
        <div className="border-2 border-zinc-900 p-4 rounded-t-lg flex items-center justify-between gap-4 bg-white">
          <div className="w-36 shrink-0 flex items-center justify-center p-2 border border-border-gray rounded bg-white">
            <img src="/Krupa_Logo.png" alt="Krupa Logo" className="h-16 w-auto object-contain" />
          </div>
          
          <div className="flex-1 text-center pr-4">
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-[#ee1d36]">
              KRUPA TOOLS & STAMPINGS LTD.
            </h1>
            <p className="text-xs font-semibold text-ink mt-1 uppercase tracking-tight">
              GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136
            </p>
            <p className="text-xs font-semibold text-ink uppercase tracking-tight">
              GST NO : 27AAKCK1751B1ZS | STATE: MAHARASHTRA (27)
            </p>
            <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-tight mt-0.5">
              Manufacturers of Press Tools, Jig Fixtures, Moulds, Precision Tooling & Outside Job Work
            </p>
            <div className="mt-1 pt-1 border-t border-zinc-900/20">
              <span className="font-bold text-sm uppercase tracking-widest text-ink underline">
                SUBCONTRACT JOB WORK PURCHASE ORDER & DELIVERY CHALLAN
              </span>
              <span className="text-[10px] block text-zinc-600 font-semibold tracking-tight mt-0.5">
                (Issued under Rule 55 / Section 143 of CGST Act for Outside Job Work Processing)
              </span>
            </div>
          </div>
        </div>

        {/* Vendor & Challan Meta Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
          
          {/* Vendor Details (Left Col) */}
          <div className="col-span-7 p-3 border-r-2 border-zinc-900 space-y-1.5">
            <div className="flex gap-2">
              <span className="font-bold w-24 text-zinc-600 uppercase">JOB WORK VENDOR:</span>
              <span className="font-bold text-ink uppercase text-sm">{order.vendor?.vendorName || "OUTSOURCE VENDOR"}</span>
            </div>

            <div className="flex gap-2 text-[11px]">
              <span className="font-semibold w-24 text-zinc-600 uppercase">ADDRESS:</span>
              <span className="text-zinc-800">{order.vendor?.address || "MIDC Waluj Industrial Area, Chhatrapati Sambhajinagar - 431136"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border-gray">
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
          <div className="col-span-5 p-3 space-y-1.5 bg-canvas/40">
            <div className="grid grid-cols-2 gap-2 pb-1 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[10px] uppercase">CHALLAN / PO NO:</span>
                <span className="font-mono font-bold text-ink text-sm">{order.challanNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[10px] uppercase">DATE:</span>
                <span className="font-mono font-semibold text-ink">{formatDate(order.createdAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-1 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[10px] uppercase">REF / GATE PASS:</span>
                <span className="font-mono font-semibold text-ink">{order.documentNumber || order.challanNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[10px] uppercase">EXPECTED RETURN:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {order.expectedReturnDate ? formatDate(order.expectedReturnDate) : "Within 7 Days"}
                </span>
              </div>
            </div>

            <div className="pt-0.5">
              <span className="font-semibold text-zinc-600 block text-[10px] uppercase">PROJECT / TOOLING:</span>
              <span className="font-semibold text-ink text-[11px] truncate block">
                {project?.projectNumber || 'KTD-2'} — {project?.name || 'Tooling Project'}
              </span>
              {project?.customer?.customerName && (
                <span className="text-micro text-cool-gray block">
                  Customer: {project.customer.customerName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Table of Job Work Operations & Material                                   */}
        {/* ========================================================================= */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-900 font-bold text-zinc-800 text-[10px] uppercase tracking-wider">
                <th className="p-2 border-r border-zinc-400 text-center w-8">SR.</th>
                <th className="p-2 border-r border-zinc-400 text-left">OUTSOURCE OPERATION</th>
                <th className="p-2 border-r border-zinc-400 text-left">MATERIAL GRADE / DETAILS</th>
                <th className="p-2 border-r border-zinc-400 text-left">STORES BATCH & HEAT NO.</th>
                <th className="p-2 border-r border-zinc-400 text-center w-24">MATERIAL SOURCE</th>
                <th className="p-2 border-r border-zinc-400 text-right w-14">QTY</th>
                <th className="p-2 border-r border-zinc-400 text-right w-14">HRS/PC</th>
                <th className="p-2 border-r border-zinc-400 text-right w-16">TOTAL HRS</th>
                <th className="p-2 border-r border-zinc-400 text-right w-20">RATE/HR (₹)</th>
                <th className="p-2 border-r border-zinc-400 text-right w-20">BASIC (₹)</th>
                <th className="p-2 border-r border-zinc-400 text-right w-18">GST (18%)</th>
                <th className="p-2 border-r border-zinc-400 text-right w-20">TOTAL (₹)</th>
                <th className="p-2 text-left min-w-[100px]">SPECS / REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] font-sans">
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
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="p-2 border-r border-zinc-300 text-center font-mono text-zinc-500">{idx + 1}</td>
                    
                    {/* Operation */}
                    <td className="p-2 border-r border-zinc-300 font-bold text-ink">
                      {item.operation?.operationName || 'Subcontract Operation'}
                    </td>

                    {/* Material */}
                    <td className="p-2 border-r border-zinc-300 font-mono text-zinc-800">
                      {item.inventoryBatch?.material?.materialGrade || 
                       item.inventoryBatch?.material?.materialName || 
                       (isMaterial ? 'Factory Raw Material' : 'N/A')}
                    </td>

                    {/* Stores Batch & Heat */}
                    <td className="p-2 border-r border-zinc-300 font-mono text-zinc-700">
                      {isMaterial ? (
                        <div>
                          <span className="font-semibold text-ink">{item.inventoryBatch?.batchNumber}</span>
                          <span className="block text-[10px] text-zinc-500">Heat: {item.inventoryBatch?.heatNumber || 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">No Store Lineage</span>
                      )}
                    </td>

                    {/* Material Source */}
                    <td className="p-2 border-r border-zinc-300 text-center">
                      {isMaterial ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Factory Material
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          Service Only
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      {qty} {item.inventoryBatch?.material?.uom || 'NOS'}
                    </td>

                    {/* Hours/Pc */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono text-zinc-800">
                      {hoursPerPc}
                    </td>

                    {/* Total Hours */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      {lineHours.toFixed(1)}
                    </td>

                    {/* Rate / Hour */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono text-zinc-800">
                      ₹{rate.toFixed(2)}
                    </td>

                    {/* Basic */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono font-semibold text-ink">
                      ₹{basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* GST */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono text-zinc-700">
                      ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total */}
                    <td className="p-2 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Remarks */}
                    <td className="p-2 text-zinc-700 text-[10px]">
                      {item.remarks || order.remarks || 'Standard job work specs'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in Words & Totals Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
          
          {/* Terms & Notes (Left 7 Cols) */}
          <div className="col-span-7 p-3 border-r-2 border-zinc-900 space-y-2">
            <div>
              <span className="font-bold text-[10px] uppercase text-zinc-600">AMOUNT IN WORDS:</span>
              <p className="font-semibold text-ink text-[11px] italic mt-0.5">
                {numberToWordsINR(totalCost)}
              </p>
            </div>

            <div className="pt-2 border-t border-border-gray">
              <div className="flex items-center justify-between pb-1 border-b border-border-gray mb-1.5">
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-700">
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

              {/* Numbered terms list (Always shown when not editing, and always printed) */}
              <div className={isEditingTerms ? 'hidden print:block' : 'space-y-1'}>
                <ol className="list-decimal list-inside space-y-1 text-[10px] text-zinc-700 leading-tight">
                  {terms.map((t, i) => (
                    <li key={i} className="leading-snug">{t}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Totals Box (Right 5 Cols) */}
          <div className="col-span-5 p-4 space-y-2 bg-canvas/80">
            <div className="flex justify-between border-b border-border-gray pb-1 font-semibold text-xs">
              <span className="text-zinc-600">TOTAL PIECES SENT:</span>
              <span className="font-mono font-bold text-ink">{totalQty} NOS</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-1 font-semibold text-xs">
              <span className="text-zinc-600">TOTAL MACHINING HOURS:</span>
              <span className="font-mono font-bold text-ink">{totalHours.toFixed(1)} HRS</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-1 font-semibold text-xs">
              <span className="text-zinc-600">BASIC JOB WORK VALUE:</span>
              <span className="font-mono font-semibold text-ink">
                ₹{totalBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-1 font-semibold text-xs">
              <span className="text-zinc-600">EST. GST (18%):</span>
              <span className="font-mono font-semibold text-zinc-800">
                ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Total Subcontract PO Value */}
            <div className="pt-2 border-t-2 border-zinc-900 flex justify-between items-center bg-zinc-900 text-white p-3 rounded-[10px] mt-2">
              <span className="font-bold uppercase tracking-wider text-xs">EST. OUTSOURCE VALUE:</span>
              <span className="font-mono font-bold text-base text-amber-400">
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Box Signature Block */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-4 text-center text-xs p-4 bg-white rounded-b-lg">
          
          <div className="border-r border-border-gray flex flex-col justify-between h-20 pr-2">
            <div className="h-12"></div>
            <span className="font-bold text-zinc-800 uppercase text-[10px] tracking-wider">
              PREPARED BY (STORES)
            </span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-20 px-2">
            <div className="h-12"></div>
            <span className="font-bold text-zinc-800 uppercase text-[10px] tracking-wider">
              CHECKED BY (QC / ENG)
            </span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-20 px-2">
            <div className="h-12"></div>
            <span className="font-bold text-zinc-800 uppercase text-[10px] tracking-wider">
              FOR KRUPA TOOLS &amp; STAMPINGS
            </span>
          </div>

          <div className="flex flex-col justify-between h-20 pl-2">
            <div className="h-12"></div>
            <span className="font-bold text-zinc-800 uppercase text-[10px] tracking-wider">
              VENDOR SIGN &amp; STAMP
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
