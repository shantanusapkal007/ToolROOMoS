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
  XCircle,
  Truck,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { printIsolatedElement } from '@/utils/printDocument';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/Button';
import {
  OfficialSheetShell,
  OfficialLetterhead,
  OfficialInstructionBar,
  OfficialSignatureStrip,
  CoinsStackIcon,
  numberToWordsINR,
} from '@/components/print/OfficialStationery';

interface AuthenticSubcontractPoDocumentProps {
  order: any;
  orders?: any[];
  project?: any;
  onBack: () => void;
  onSave?: (terms: string[]) => void;
  isSaving?: boolean;
  saved?: boolean;
  saveLabel?: string;
  onCancel?: () => void;
  onDelete?: () => void;
}

export function AuthenticSubcontractPoDocument({
  order,
  orders,
  project,
  onBack,
  onSave,
  isSaving,
  saved,
  saveLabel,
  onCancel,
  onDelete,
}: AuthenticSubcontractPoDocumentProps) {
  const [isEditingTerms, setIsEditingTerms] = useState<boolean>(false);
  const [terms, setTerms] = useState<string[]>([
    "The materials dispatched under this Challan / PO remain the exclusive property of Krupa Tools & Stampings Ltd. and are issued strictly for job work / outside processing under Section 143 of the CGST Act.",
    "Goods must be inspected upon arrival. Delivery Challan / Gate Pass copy must be signed, stamped, and returned to the driver/delivery person.",
    "All finished/processed components must be returned accompanied by vendor delivery challan and process test certificate (e.g. Hardness / Coating report).",
    "Any rejection, dimensional distortion, cracking, or scrap during outside processing must be immediately reported to our Quality Department and returned with the batch.",
    "Processing must strictly adhere to specified technical hardness (HRC), tolerances, and surface finish.",
    "Delivery must be completed on or before the specified Expected Return Date.",
  ]);

  // Flatten items when `orders` (multi-project batch) is passed, tagging each item with its project info
  const sourceOrders = orders && orders.length > 0 ? orders : [order];
  const items = sourceOrders.flatMap((ord: any) =>
    (ord?.items || []).map((it: any) => ({
      ...it,
      _project: it.project || ord?.project || project,
      _challanNumber: ord?.challanNumber || order?.challanNumber,
    }))
  );

  // Determine unique projects across items
  const uniqueProjectMap = new Map<string, { number: string; name: string; customer?: string }>();
  items.forEach((it: any) => {
    const p = it._project;
    if (p) {
      const pNum = p.projectNumber || it.toolNo || 'KTD';
      if (!uniqueProjectMap.has(pNum)) {
        uniqueProjectMap.set(pNum, {
          number: pNum,
          name: p.partName || p.name || '',
          customer: p.customer?.companyName || p.customer?.customerName || '',
        });
      }
    }
  });
  const uniqueProjects = Array.from(uniqueProjectMap.values());
  const isMultiProject = uniqueProjects.length > 1 || (orders && orders.length > 1);
  const primaryProject = uniqueProjects[0] || {
    number: project?.projectNumber || order?.project?.projectNumber || 'KTD',
    name: project?.partName || project?.name || order?.project?.partName || 'Tooling Project',
    customer: project?.customer?.companyName || project?.customer?.customerName || order?.project?.customer?.companyName || '',
  };
  const displayChallanNo = isMultiProject
    ? (order?.documentNumber || sourceOrders.map((o: any) => o.challanNumber).filter(Boolean).join(', '))
    : (order?.challanNumber || order?.documentNumber || 'CHL-DRAFT');
  const displayGatePass = order?.documentNumber || order?.challanNumber || 'DRAFT';
  
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
    sheet.getCell('H5').value = displayChallanNo;
    sheet.getCell('G6').value = 'DATE:';
    sheet.getCell('H6').value = formatDate(order.createdAt || new Date());
    sheet.getCell('G7').value = 'RETURN DATE:';
    sheet.getCell('H7').value = order.expectedReturnDate ? formatDate(order.expectedReturnDate) : '7 Days';

    sheet.getCell('G8').value = 'PROJECT:';
    sheet.getCell('H8').value = isMultiProject
      ? `Multi-Project (${uniqueProjects.map((p) => p.number).join(', ')})`
      : `${primaryProject.number} - ${primaryProject.name}`;

    // Table Header
    const rowStart = 10;
    const headers = isMultiProject
      ? [
          'SR',
          'PROJECT / TOOL NO',
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
        ]
      : [
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
      const colOffset = isMultiProject ? 1 : 0;

      r.getCell(1).value = idx + 1;
      if (isMultiProject) {
        r.getCell(2).value = item._project?.projectNumber || item.toolNo || 'KTD';
      }
      r.getCell(2 + colOffset).value = item.operation?.operationName || 'Job Work Operation';
      r.getCell(3 + colOffset).value = item.inventoryBatch?.material?.materialGrade || item.inventoryBatch?.material?.materialName || 'N/A';
      r.getCell(4 + colOffset).value = isMat ? `${item.inventoryBatch?.batchNumber || ''} (Heat: ${item.inventoryBatch?.heatNumber || 'N/A'})` : 'N/A';
      r.getCell(5 + colOffset).value = isMat ? 'Factory Stores Issued' : 'Service Only';
      r.getCell(6 + colOffset).value = Number(item.sentQty || 0);
      r.getCell(7 + colOffset).value = hoursPerPc;
      r.getCell(8 + colOffset).value = totalHrs;
      r.getCell(9 + colOffset).value = rate;
      r.getCell(10 + colOffset).value = basic;
      r.getCell(11 + colOffset).value = gst;
      r.getCell(12 + colOffset).value = total;

      const totalCols = isMultiProject ? 13 : 12;
      for (let c = 1; c <= totalCols; c++) {
        r.getCell(c).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });

    const colOffset = isMultiProject ? 1 : 0;
    const totRow = sheet.getRow(rowStart + 1 + items.length);
    totRow.getCell(1).value = 'TOTAL';
    totRow.getCell(6 + colOffset).value = totalQty;
    totRow.getCell(8 + colOffset).value = totalHours;
    totRow.getCell(10 + colOffset).value = totalBasic;
    totRow.getCell(11 + colOffset).value = totalGst;
    totRow.getCell(12 + colOffset).value = totalCost;
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
              <span className={`text-small font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                order.status === 'CANCELLED'
                  ? 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30'
                  : isMultiProject
                  ? 'bg-primary-subtle text-primary border-primary/30'
                  : 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success-border'
              }`}>
                {order.status === 'CANCELLED'
                  ? 'CANCELLED / VOID'
                  : isMultiProject
                  ? `Multi-Project (${uniqueProjects.length} Tools)`
                  : 'Official Factory Document'}
              </span>
            </h2>
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-caption text-cool-gray mt-1">
              <span>Challan: <strong className="font-mono font-bold text-ink">{displayChallanNo}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Vendor: <strong className="font-semibold text-ink">{order.vendor?.vendorName || 'Outsource Vendor'}</strong></span>
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
          {onSave && !saved && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave(terms)}
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {saveLabel || 'Confirm & Issue Challan'}
            </Button>
          )}

          {saved && (
            <span className="inline-flex items-center gap-1.5 text-small font-semibold px-3 py-1.5 rounded-[8px] bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Challan Saved</span>
            </span>
          )}

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
      {/* Printable Paper Sheet Target (Corporate Steel-Navy Stationery Theme)      */}
      {/* ========================================================================= */}
      <OfficialSheetShell id="authentic-subcontract-po-sheet" itemCount={items.length} extraClassName="subcontract-sheet-flex">
        {order.status === 'CANCELLED' && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 font-bold text-center py-2 uppercase tracking-widest text-xs rounded-[6px] break-inside-avoid shrink-0">
            ⚠️ THIS SUBCONTRACT CHALLAN IS CANCELLED &amp; VOID — DO NOT DISPATCH GOODS
          </div>
        )}

        <OfficialLetterhead
          documentTitle="SUBCONTRACT JOB WORK PO & DELIVERY CHALLAN"
          legalSubtitle="(Issued under Rule 55 / Section 143 of CGST Act for Outside Job Work Processing)"
        />

        {/* Vendor & Challan Meta Dual Rounded Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid shrink-0">
          {/* Vendor Details (Left Card - 7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="p-3 sm:p-3.5 print:p-2.5 space-y-1.5">
              <div className="flex gap-2 items-baseline">
                <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">JOB WORK VENDOR:</span>
                <span className="font-bold text-[#111827] uppercase text-xs sm:text-sm print:text-[11px]">{order.vendor?.vendorName || "OUTSOURCE VENDOR"}</span>
              </div>

              <div className="flex gap-2 text-[11px] print:text-[9.5px]">
                <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">ADDRESS:</span>
                <span className="text-[#111827] leading-snug">{order.vendor?.address || "MIDC Waluj Industrial Area, Chhatrapati Sambhajinagar - 431136"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] px-3 sm:px-3.5 py-2 print:px-2.5 print:py-1.5 border-t border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569]">GSTIN: </span>
                <span className="font-mono font-bold text-[#111827]">{order.vendor?.gstNumber || "UNREGISTERED"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">CONTACT: </span>
                <span className="font-mono font-semibold text-[#111827]">{order.vendor?.contactPhone || order.vendor?.contactEmail || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Challan & Project Details (Right Card - 5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="grid grid-cols-2 border-b border-[#CBD5E1]">
              <div className="p-2.5 print:p-2 border-r border-[#CBD5E1]">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">CHALLAN / PO NO:</span>
                <span className="font-mono font-bold text-[#111827] text-xs sm:text-sm print:text-[10.5px] break-all">{displayChallanNo}</span>
              </div>
              <div className="p-2.5 print:p-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{formatDate(order.createdAt || new Date())}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-[#CBD5E1]">
              <div className="p-2.5 print:p-2 border-r border-[#CBD5E1]">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">REF / GATE PASS:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{displayGatePass}</span>
              </div>
              <div className="p-2.5 print:p-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">EXPECTED RETURN:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">
                  {order.expectedReturnDate ? formatDate(order.expectedReturnDate) : "Within 7 Days"}
                </span>
              </div>
            </div>

            <div className="p-2.5 print:p-2">
              <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PROJECT / TOOLING:</span>
              {isMultiProject ? (
                <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] block leading-snug">
                  Multi-Project ({uniqueProjects.map((p) => p.number).join(', ')})
                </span>
              ) : (
                <>
                  <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] truncate block">
                    {primaryProject.number} — {primaryProject.name || 'Tooling Project'}
                  </span>
                  {primaryProject.customer && (
                    <span className="text-[10px] print:text-[8.5px] text-[#475569] block">
                      Customer: {primaryProject.customer}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <OfficialInstructionBar text="KINDLY PROCESS & RETURN THE FOLLOWING ITEMS STRICTLY AS PER DRAWING TOLERANCES, METALLURGICAL SPECS & TERMS BELOW." />

        {/* ========================================================================= */}
        {/* Table of Job Work Operations & Material (Expands to fill A4 page body)   */}
        {/* ========================================================================= */}
        <div className="subcontract-table-grow pro-table-grow border border-[#CBD5E1] rounded-[8px] flex-1 flex flex-col bg-white">
          <table className="w-full table-fixed border-collapse text-[11px] print:text-[9px]">
            <thead>
              <tr className="bg-[#E5EDF6] border-b border-[#CBD5E1] font-bold text-[#163354] text-[9px] print:text-[7.5px] uppercase tracking-tight leading-tight">
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-center w-[3.5%] rounded-tl-[7px]">SR.</th>
                {isMultiProject && (
                  <th className="py-2 px-1.5 print:py-1.5 print:px-1 border-r border-[#CBD5E1] text-left w-[11%]">TOOL / PROJ</th>
                )}
                <th className={`py-2 px-1.5 print:py-1.5 print:px-1 border-r border-[#CBD5E1] text-left ${isMultiProject ? 'w-[15%]' : 'w-[22%]'}`}>OPERATION &amp; SPECS</th>
                <th className={`py-2 px-1.5 print:py-1.5 print:px-1 border-r border-[#CBD5E1] text-left ${isMultiProject ? 'w-[18.5%]' : 'w-[22.5%]'}`}>MATERIAL &amp; BATCH</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[6%]">QTY</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[5.5%]">HRS/PC</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[6.5%]">TOT HRS</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[8%]">RATE (₹)</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[9%]">BASIC (₹)</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 border-r border-[#CBD5E1] text-right w-[7.5%]">GST 18%</th>
                <th className="py-2 px-1 print:py-1.5 print:px-0.5 text-right w-[9.5%] rounded-tr-[7px]">TOTAL (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1] border-b border-[#CBD5E1] text-[10.5px] print:text-[8.5px] font-sans">
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
                  <tr key={idx} className="hover:bg-[#F8FAFC] break-inside-avoid align-top">
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">{idx + 1}</td>

                    {isMultiProject && (
                      <td className="py-2.5 px-1.5 print:py-2 print:px-1 border-r border-[#CBD5E1] break-words">
                        <div className="font-mono font-bold text-[#111827] text-[10.5px] print:text-[8.5px]">
                          {item._project?.projectNumber || item.toolNo || 'KTD'}
                        </div>
                        {(item._project?.partName || item._project?.name) && (
                          <div className="text-[9.5px] print:text-[7.5px] text-[#475569] leading-tight line-clamp-2 mt-0.5">
                            {item._project?.partName || item._project?.name}
                          </div>
                        )}
                      </td>
                    )}
                    
                    {/* Operation & Specs */}
                    <td className="py-2.5 px-1.5 print:py-2 print:px-1 border-r border-[#CBD5E1] break-words">
                      <div className="font-bold text-[#111827] text-[10.5px] print:text-[8.5px] leading-tight">
                        {item.operation?.operationName || 'Subcontract Operation'}
                      </div>
                      <div className="text-[9.5px] print:text-[7.5px] font-normal text-[#475569] mt-0.5 leading-tight">
                        {item.remarks || order.remarks || 'Standard job work specs'}
                      </div>
                    </td>

                    {/* Material Grade & Stores Batch */}
                    <td className="py-2.5 px-1.5 print:py-2 print:px-1 border-r border-[#CBD5E1] font-mono break-words">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-[#111827] text-[10px] print:text-[8.5px]">
                          {item.inventoryBatch?.material?.materialGrade || 
                           item.inventoryBatch?.material?.materialName || 
                           (isMaterial ? 'Factory Raw Material' : 'N/A')}
                        </span>
                        {isMaterial ? (
                          <span className="inline-flex items-center text-[8.5px] print:text-[7px] font-semibold text-[#163354] bg-[#E5EDF6] px-1 rounded border border-[#CBD5E1]">
                            Factory Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[8.5px] print:text-[7px] font-semibold text-[#475569] bg-[#F8FAFC] px-1 rounded border border-[#CBD5E1]">
                            Service Only
                          </span>
                        )}
                      </div>
                      {isMaterial ? (
                        <div className="text-[9px] print:text-[7.5px] text-[#475569] mt-0.5 leading-tight">
                          <span>Batch: <strong className="font-semibold text-[#111827]">{item.inventoryBatch?.batchNumber?.length > 16 ? `${item.inventoryBatch.batchNumber.slice(0, 8)}..${item.inventoryBatch.batchNumber.slice(-4)}` : item.inventoryBatch?.batchNumber}</strong></span>
                          <span className="ml-1 text-[#94A3B8]">•</span>
                          <span className="ml-1">Heat: {item.inventoryBatch?.heatNumber || 'N/A'}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] print:text-[7.5px] text-[#475569] italic mt-0.5">No Store Stock Issued</div>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                      <div>{qty}</div>
                      <div className="text-[8.5px] print:text-[7px] font-normal text-[#475569]">{item.inventoryBatch?.material?.uom || 'NOS'}</div>
                    </td>

                    {/* Hours/Pc */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono text-[#111827] tabular-nums">
                      {hoursPerPc}
                    </td>

                    {/* Total Hours */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                      {lineHours.toFixed(1)}
                    </td>

                    {/* Rate / Hour */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">
                      ₹{rate.toFixed(2)}
                    </td>

                    {/* Basic */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono font-semibold text-[#111827] tabular-nums">
                      ₹{basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* GST */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">
                      ₹{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-1 print:py-2 print:px-0.5 text-right font-mono font-bold text-[#111827] tabular-nums">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Continuous vertical ledger dividers extending to fill full A4 body space */}
          <div className="subcontract-table-filler pro-table-filler flex-1 flex w-full min-h-[24px] print:min-h-[16px]" aria-hidden="true">
            <table className="self-stretch w-full flex-1 table-fixed border-collapse">
              <tbody>
                <tr className="h-full">
                  <td className="p-0 w-[3.5%] border-r border-[#CBD5E1]" />
                  {isMultiProject && <td className="p-0 w-[11%] border-r border-[#CBD5E1]" />}
                  <td className={`p-0 ${isMultiProject ? 'w-[15%]' : 'w-[22%]'} border-r border-[#CBD5E1]`} />
                  <td className={`p-0 ${isMultiProject ? 'w-[18.5%]' : 'w-[22.5%]'} border-r border-[#CBD5E1]`} />
                  <td className="p-0 w-[6%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[5.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[8%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[9%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[7.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[9.5%]" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Bottom-Anchored Official Footer (Totals, Terms & 4 Signatures)            */}
        {/* ========================================================================= */}
        <div className="mt-auto shrink-0 space-y-2.5 print:space-y-2 break-inside-avoid">
        {/* Amount in Words & Totals Summary Dual Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid">
          {/* Left: Amount in Words & Instructions Card (7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="p-3 sm:p-3.5 print:p-2.5 flex items-start gap-2.5">
              <CoinsStackIcon className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">AMOUNT IN WORDS:</span>
                <p className="font-semibold text-[#111827] text-xs print:text-[9.5px] italic mt-0.5 leading-snug">
                  {numberToWordsINR(totalCost)}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 print:p-2.5 border-t border-[#CBD5E1] flex items-start gap-2.5">
              <Truck className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">GATE PASS NOTES / INSTRUCTIONS:</span>
                <p className="text-[10.5px] print:text-[8.5px] text-[#475569] mt-0.5 leading-snug">
                  {order.remarks || 'Job work issued strictly per drawing tolerances and metallurgical specification.'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Totals Card (5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2.5 sm:p-3 print:p-2 space-y-1.5 print:space-y-1 flex flex-col justify-between">
            <div className="space-y-1.5 print:space-y-1">
              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL PIECES SENT:</span>
                <span className="font-mono font-bold text-[#111827]">{totalQty} NOS</span>
              </div>

              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL MACHINING:</span>
                <span className="font-mono font-bold text-[#111827]">{totalHours.toFixed(1)} HRS</span>
              </div>

              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">BASIC JOB WORK:</span>
                <span className="font-mono font-semibold text-[#111827]">
                  ₹{totalBasic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between pb-0.5 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">EST. GST (18%):</span>
                <span className="font-mono font-semibold text-[#475569]">
                  ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total Subcontract PO Value */}
            <div className="flex justify-between items-center bg-[#E5EDF6] border border-[#CBD5E1] text-[#163354] p-2 print:py-1.5 print:px-2.5 rounded-[6px]">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8.5px]">EST. OUTSOURCE VALUE:</span>
              <span className="font-mono font-extrabold text-sm print:text-[11px]">
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Terms & Conditions Card */}
        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 break-inside-avoid">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#CBD5E1] mb-2">
            <span className="font-bold text-[10px] print:text-[8.5px] uppercase tracking-wider text-[#163354] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#163354]" />
              <span>TERMS &amp; CONDITIONS FOR JOB WORK ({terms.length}):</span>
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
            <div className="space-y-1.5 hide-on-print bg-white p-2.5 rounded-[8px] border border-[#C5D3E2] my-1.5 shadow-subtle">
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

          {/* Numbered terms list — 2 Columns in print for balanced full-width official presentation */}
          <div className={isEditingTerms ? 'hidden print:block' : ''}>
            <ol className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-5 gap-y-1 text-[10px] print:text-[8px] text-[#334155] leading-snug list-decimal list-inside">
              {terms.map((t, i) => (
                <li key={i} className="leading-snug">{t}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 4-Box Open Corporate Signature Strip */}
        <OfficialSignatureStrip
          boxes={[
            { title: 'PREPARED BY (STORES)', caption: 'SIGN & DATE' },
            { title: 'CHECKED BY (QC / ENG)', caption: 'CHECKED BY' },
            { title: 'FOR KRUPA TOOLS & STAMPINGS', caption: 'AUTHORIZED SIGNATORY' },
            { title: 'VENDOR SIGN & STAMP', caption: 'ACKNOWLEDGED BY' },
          ]}
        />
        </div>

      </OfficialSheetShell>
    </div>
  );
}
