"use client";

import React from 'react';
import { 
  Download, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Package, 
  Layers, 
  Calendar, 
  User, 
  ShieldCheck 
} from 'lucide-react';
import { exportPrnToExcel } from './prnExcelExporter';
import { PurchaseRequisition } from '@/services/purchase-requisitions.service';
import { Button } from '@/components/ui/Button';
import { printIsolatedElement } from '@/utils/printDocument';
import { formatDate } from '@/lib/formatters';

interface AuthenticPrnDocumentProps {
  prn: PurchaseRequisition;
  onBack?: () => void;
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

export function AuthenticPrnDocument({ prn, onBack }: AuthenticPrnDocumentProps) {
  const handlePrint = () => {
    printIsolatedElement('authentic-prn-sheet', {
      orientation: 'portrait',
      title: `PRN_${prn.prNumber || 'Voucher'}`,
    });
  };

  const handleExportExcel = () => {
    exportPrnToExcel(prn);
  };

  const totalEstimated = prn.items?.reduce((sum, item) => {
    const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
    return sum + lineTotal;
  }, 0) || 0;

  const totalQuantity = prn.items?.reduce((sum, item) => sum + Number(item.requiredQuantity || 0), 0) || 0;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151824] p-4 sm:p-5 rounded-[14px] border border-border-gray shadow-subtle hide-on-print">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBack}
              title="Back to Purchase Requisitions"
            >
              Back to List
            </Button>
          )}
          <div>
            <h2 className="text-body font-bold text-ink flex items-center flex-wrap gap-2.5">
              <span>Purchase Requisition Note (PRN) Voucher</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                prn.status === 'APPROVED' ? 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/30' :
                prn.status === 'REJECTED' ? 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30' :
                prn.status === 'PO_CREATED' ? 'bg-primary-subtle text-primary border border-primary/30' :
                'bg-semantic-warning-subtle text-semantic-warning-dark border-semantic-warning/30'
              }`}>
                {prn.status}
              </span>
            </h2>
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-caption text-cool-gray mt-1">
              <span>PRN #: <strong className="font-mono font-bold text-ink">{prn.prNumber}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Dept: <strong className="font-semibold text-ink">{prn.department || 'Stores / Tool Crib'}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Date: <strong className="font-mono font-medium text-ink">{prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
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
            Print PRN / Save PDF
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Printable Paper Sheet Target (A4 Vertical / Portrait)                      */}
      {/* ========================================================================= */}
      <div 
        id="authentic-prn-sheet" 
        data-print-target="true"
        className="printable-sheet bg-white p-6 sm:p-8 print:p-0 rounded-[12px] shadow-level-4 border border-border-gray text-ink max-w-[210mm] mx-auto print:max-w-none print:w-full print:border-none print:shadow-none font-sans"
      >
        
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
                PURCHASE REQUISITION NOTE (PRN)
              </span>
              <span className="text-[9px] print:text-[6.5px] block text-zinc-600 font-semibold tracking-tight mt-0.5 print:mt-0">
                (Internal Factory Material Indent &amp; Procurement Authorization Voucher)
              </span>
            </div>
          </div>
        </div>

        {/* Requisition Meta Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Left Col (7 Cols): Project, Department, Indentor */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 space-y-1 print:space-y-0.5">
            <div className="flex gap-2">
              <span className="font-bold w-26 print:w-20 text-zinc-600 uppercase text-[10px] print:text-[7.5px]">PROJECT / TOOL:</span>
              <span className="font-bold text-ink uppercase text-xs sm:text-sm print:text-[9px] truncate">
                {prn.project?.projectNumber || 'GENERAL / TOOL CRIB'}
                {prn.project?.partName ? ` — ${prn.project.partName}` : (prn.project?.customer?.companyName ? ` — ${prn.project.customer.companyName}` : '')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] print:text-[7.5px] pt-1 print:pt-0.5 border-t border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600">DEPT: </span>
                <span className="font-semibold text-ink">{prn.department || 'Stores / Tool Crib'}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600">CATEGORY: </span>
                <span className="font-mono font-semibold text-ink">{prn.category || 'RAW_MATERIAL'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] print:text-[7.5px] pt-1 print:pt-0.5 border-t border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600">INDENTOR: </span>
                <span className="font-semibold text-ink">{prn.requestedBy || 'Supervisor'}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600">REQ. DATE: </span>
                <span className="font-mono text-ink">
                  {prn.requiredDate ? new Date(prn.requiredDate).toLocaleDateString('en-GB') : 'Immediate'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Col (5 Cols): PRN #, Date, Priority, Approval Status */}
          <div className="col-span-5 p-2.5 sm:p-3 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/40">
            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">PRN VOUCHER #:</span>
                <span className="font-mono font-bold text-ink text-xs sm:text-sm print:text-[8.5px]">{prn.prNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">DATE:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">
                  {prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">PRIORITY:</span>
                <span className={`font-mono font-bold text-xs print:text-[8px] uppercase ${
                  prn.priority === 'CRITICAL' ? 'text-semantic-danger-dark' :
                  prn.priority === 'URGENT' ? 'text-semantic-warning-dark' :
                  'text-ink'
                }`}>
                  {prn.priority || 'NORMAL'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">PR STATUS:</span>
                <span className="font-mono font-bold text-primary text-xs print:text-[8px] uppercase">{prn.status}</span>
              </div>
            </div>

            <div className="pt-0.5 print:pt-0">
              <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">APPROVAL STATUS:</span>
              <span className="font-semibold text-ink text-[11px] print:text-[8px] block truncate">
                {prn.approvalStatus === 'APPROVED' ? `Approved by ${prn.approvedBy || 'HOD'}` : prn.approvalStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Requisition Table */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden break-inside-avoid">
          <table className="w-full border-collapse text-xs print:text-[8px]">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-900 font-bold text-zinc-800 text-[9.5px] print:text-[7.5px] uppercase tracking-wider">
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-8">SR.</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">DET #</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[140px]">ITEM / PART DESCRIPTION</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-center min-w-[90px]">GRADE / SPEC</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-center min-w-[100px]">DIMENSIONS (L×W×H)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-14">QTY</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">UOM</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-20">EST. RATE (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-22">EST. TOTAL (₹)</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[120px]">SUGGESTED VENDOR / REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] print:text-[8px] font-sans">
              {prn.items?.map((item, index) => {
                const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
                return (
                  <tr key={item.id || index} className="hover:bg-zinc-50/50 break-inside-avoid">
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-500">{index + 1}</td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono font-bold text-zinc-800">{item.detNo || '-'}</td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 font-bold text-ink">
                      {item.itemName || item.material?.materialGrade || 'Material Component'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 text-center font-mono text-zinc-800">
                      {item.materialGrade || item.material?.materialGrade || '-'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 text-center font-mono text-zinc-800">
                      {item.dimensions || item.rawSize || '-'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      {Number(item.requiredQuantity)}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center text-zinc-600 font-mono">
                      {item.uom || 'PCS'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-800">
                      ₹{Number(item.estimatedRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 text-[10.5px] print:text-[7.5px] text-zinc-700">
                      {item.suggestedVendor && (
                        <span className="font-semibold text-ink block">Rec: {item.suggestedVendor}</span>
                      )}
                      {item.remarks && <span className="text-zinc-600">{item.remarks}</span>}
                      {!item.suggestedVendor && !item.remarks && <span className="text-zinc-400 italic">Standard indent</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in Words & Totals Summary Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Left: Amount in Words & Purpose / Justification (7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[9px] print:text-[7px] uppercase text-zinc-600">ESTIMATED VALUE IN WORDS:</span>
              <p className="font-semibold text-ink text-[11px] print:text-[8px] italic mt-0.5 print:mt-0 leading-tight">
                {numberToWordsINR(totalEstimated)}
              </p>
            </div>

            {prn.purpose && (
              <div className="mt-1 pt-1 border-t border-border-gray">
                <span className="font-bold text-[9px] print:text-[6.5px] uppercase text-zinc-500">INDENT PURPOSE / JUSTIFICATION:</span>
                <p className="text-[10px] print:text-[7px] text-zinc-700 mt-0.5 leading-tight">
                  {prn.purpose}
                </p>
              </div>
            )}
          </div>

          {/* Right: Totals Box (5 Cols) */}
          <div className="col-span-5 p-2 sm:p-2.5 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/80">
            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL LINE ITEMS:</span>
              <span className="font-mono font-bold text-ink">{prn.items?.length || 0}</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL QUANTITY:</span>
              <span className="font-mono font-bold text-ink">{totalQuantity}</span>
            </div>

            {/* Total Estimated Value Highlight Box */}
            <div className="pt-1 border-t border-primary/20 flex justify-between items-center bg-primary/10 border border-primary/30 text-ink p-1.5 print:py-0.5 print:px-1.5 rounded-[6px] mt-1 print:mt-0.5">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[7px] text-primary-dark">TOTAL ESTIMATED COST:</span>
              <span className="font-mono font-bold text-xs sm:text-sm print:text-[9px] text-primary">
                ₹{totalEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Generated Purchase Orders (if any) */}
        {prn.purchaseOrders && prn.purchaseOrders.length > 0 && (
          <div className="border-x-2 border-b-2 border-zinc-900 p-2 sm:p-2.5 print:py-1 print:px-2 bg-canvas/40 break-inside-avoid">
            <div className="flex items-center gap-1.5 pb-1 border-b border-border-gray text-[10px] print:text-[7px] font-bold uppercase text-primary tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LINKED PURCHASE ORDERS (POS) ISSUED FROM THIS PRN:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
              {prn.purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white p-2 rounded-[6px] border border-border-gray flex items-center justify-between text-caption font-mono">
                  <div>
                    <span className="font-bold text-ink">{po.poNumber}</span>
                    <span className="text-[10px] print:text-[7px] text-cool-gray block">{po.vendor?.vendorName || 'Vendor'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-ink">₹{Number(po.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[9px] print:text-[6.5px] font-semibold text-semantic-success-dark bg-semantic-success-subtle px-1.5 py-0.2 rounded border border-semantic-success/20 block mt-0.5">
                      {po.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-Box Signature Block */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-3 text-center text-xs print:text-[7.5px] p-2 print:py-1 print:px-1 bg-white rounded-b-lg break-inside-avoid">
          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 pr-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                1. INDENTED BY (STORES / DEPT)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">{prn.requestedBy || 'Storekeeper'}</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">SIGN &amp; DATE</span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 px-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                2. VERIFIED &amp; APPROVED (HOD / PLANT)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">
                {prn.approvedBy || (prn.status === 'APPROVED' ? 'Plant Manager' : 'Pending Review')}
              </span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">HOD SIGNATURE</span>
          </div>

          <div className="flex flex-col justify-between h-14 sm:h-18 print:h-10 pl-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                3. PURCHASE ACTION (COMMERCIAL)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">
                {prn.purchaseOrders && prn.purchaseOrders.length > 0 ? `${prn.purchaseOrders.length} PO(s) Generated` : 'Pending PO'}
              </span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">PURCHASE OFFICER SIGN &amp; STAMP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
