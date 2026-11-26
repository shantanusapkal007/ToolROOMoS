"use client";

import React from 'react';
import { 
  Download, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  FileText, 
} from 'lucide-react';
import { exportPrnToExcel } from './prnExcelExporter';
import { PurchaseRequisition } from '@/services/purchase-requisitions.service';
import { Button } from '@/components/ui/Button';
import { printIsolatedElement } from '@/utils/printDocument';
import { formatDate } from '@/lib/formatters';
import {
  OfficialSheetShell,
  OfficialLetterhead,
  OfficialInstructionBar,
  CoinsStackIcon,
  OfficialSignatureStrip,
  numberToWordsINR,
} from '@/components/print/OfficialStationery';

interface AuthenticPrnDocumentProps {
  prn: PurchaseRequisition;
  onBack?: () => void;
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
      {/* Printable Paper Sheet Target (Corporate Steel-Navy Stationery Theme)      */}
      {/* ========================================================================= */}
      <OfficialSheetShell id="authentic-prn-sheet" itemCount={prn.items?.length || 0}>
        <OfficialLetterhead
          documentTitle="PURCHASE REQUISITION NOTE (PRN)"
          legalSubtitle="(Internal Factory Material Indent & Procurement Authorization Voucher)"
        />

        {/* Requisition Meta Dual Rounded Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid shrink-0">
          {/* Left Card (7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex flex-col justify-between space-y-2">
            <div className="flex gap-2 items-baseline">
              <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">PROJECT / TOOL:</span>
              <span className="font-bold text-[#111827] uppercase text-xs sm:text-sm print:text-[11px] truncate">
                {prn.project?.projectNumber || 'GENERAL / TOOL CRIB'}
                {prn.project?.partName ? ` — ${prn.project.partName}` : (prn.project?.customer?.companyName ? ` — ${prn.project.customer.companyName}` : '')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] pt-1.5 border-t border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569]">DEPT: </span>
                <span className="font-bold text-[#111827]">{prn.department || 'Stores / Tool Crib'}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">CATEGORY: </span>
                <span className="font-mono font-semibold text-[#111827]">{prn.category || 'RAW_MATERIAL'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] pt-1.5 border-t border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569]">INDENTOR: </span>
                <span className="font-semibold text-[#111827]">{prn.requestedBy || 'Supervisor'}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">REQ. DATE: </span>
                <span className="font-mono font-semibold text-[#111827]">
                  {prn.requiredDate ? new Date(prn.requiredDate).toLocaleDateString('en-GB') : 'Immediate'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card (5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 space-y-2 print:space-y-1.5">
            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PRN VOUCHER #:</span>
                <span className="font-mono font-bold text-[#111827] text-xs sm:text-sm print:text-[10.5px]">{prn.prNumber}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">
                  {prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PRIORITY:</span>
                <span className="font-mono font-bold text-xs print:text-[9.5px] uppercase text-[#163354]">
                  {prn.priority || 'NORMAL'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PR STATUS:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px] uppercase">{prn.status}</span>
              </div>
            </div>

            <div className="pt-0.5">
              <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">APPROVAL STATUS:</span>
              <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] block truncate">
                {prn.approvalStatus === 'APPROVED' ? `Approved by ${prn.approvedBy || 'HOD'}` : prn.approvalStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <OfficialInstructionBar text="MATERIAL & TOOLING INDENT SCHEDULE FOR PROCUREMENT APPROVAL" />

        {/* Itemized Requisition Table (Expands to fill A4 page body) */}
        <div className="pro-table-grow border border-[#CBD5E1] rounded-[8px] flex-1 flex flex-col bg-white">
          <table className="w-full table-fixed border-collapse text-[11px] print:text-[9px]">
            <thead>
              <tr className="bg-[#E5EDF6] border-b border-[#CBD5E1] font-bold text-[#163354] text-[9px] print:text-[7.5px] uppercase tracking-tight leading-tight">
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[3.5%] rounded-tl-[7px]">SR.</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[5%]">DET #</th>
                <th className="py-2 px-1.5 print:py-1.5 border-r border-[#CBD5E1] text-left w-[18%]">ITEM / DESCRIPTION</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[11%]">GRADE / SPEC</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[12.5%]">DIMENSIONS</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[6%]">QTY</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[5.5%]">UOM</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[10%]">EST. RATE (₹)</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[11%]">EST. TOTAL (₹)</th>
                <th className="py-2 px-1.5 print:py-1.5 text-left w-[17.5%] rounded-tr-[7px]">SUGGESTED VENDOR / REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1] border-b border-[#CBD5E1] text-[10.5px] print:text-[8.5px] font-sans">
              {prn.items?.map((item, index) => {
                const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
                return (
                  <tr key={item.id || index} className="hover:bg-[#F8FAFC] break-inside-avoid align-top">
                    <td className="py-2.5 px-0.5 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">{index + 1}</td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono font-bold text-[#111827]">{item.detNo || '-'}</td>
                    <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827] break-words">
                      {item.itemName || item.material?.materialGrade || 'Material Component'}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#111827] break-words">
                      {item.materialGrade || item.material?.materialGrade || '-'}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#111827] break-words">
                      {item.dimensions || item.rawSize || '-'}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                      {Number(item.requiredQuantity)}
                    </td>
                    <td className="py-2.5 px-0.5 print:py-2 border-r border-[#CBD5E1] text-center text-[#475569] font-mono">
                      {item.uom || 'PCS'}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827] tabular-nums">
                      ₹{Number(item.estimatedRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-1.5 print:py-2 text-[10px] print:text-[8px] text-[#475569] break-words">
                      {item.suggestedVendor && (
                        <span className="font-semibold text-[#111827] block">Rec: {item.suggestedVendor}</span>
                      )}
                      {item.remarks && <span className="text-[#475569]">{item.remarks}</span>}
                      {!item.suggestedVendor && !item.remarks && <span className="text-[#475569] italic">Standard indent</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Continuous vertical ledger dividers extending to fill full A4 body space */}
          <div className="pro-table-filler flex-1 flex w-full min-h-[24px] print:min-h-[16px]" aria-hidden="true">
            <table className="self-stretch w-full flex-1 table-fixed border-collapse">
              <tbody>
                <tr className="h-full">
                  <td className="p-0 w-[3.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[18%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[11%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[12.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[5.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[10%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[11%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[17.5%]" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom-Anchored Official Footer */}
        <div className="mt-auto shrink-0 space-y-2.5 print:space-y-2">
        {/* Amount in Words & Totals Summary Dual Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid">
          {/* Left: Amount in Words & Purpose Card (7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex flex-col justify-between space-y-2">
            <div className="flex items-start gap-2.5">
              <CoinsStackIcon className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">ESTIMATED VALUE IN WORDS:</span>
                <p className="font-semibold text-[#111827] text-xs print:text-[9.5px] italic mt-0.5 leading-snug">
                  {numberToWordsINR(totalEstimated)}
                </p>
              </div>
            </div>

            {prn.purpose && (
              <div className="pt-2 border-t border-[#CBD5E1] flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">INDENT PURPOSE / JUSTIFICATION:</span>
                  <p className="text-[10.5px] print:text-[8.5px] text-[#475569] mt-0.5 leading-snug">
                    {prn.purpose}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Totals Card (5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2.5 sm:p-3 print:p-2 space-y-1.5 print:space-y-1 flex flex-col justify-between">
            <div className="space-y-1.5 print:space-y-1">
              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL LINE ITEMS:</span>
                <span className="font-mono font-bold text-[#111827]">{prn.items?.length || 0}</span>
              </div>

              <div className="flex justify-between pb-0.5 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL QUANTITY:</span>
                <span className="font-mono font-bold text-[#111827]">{totalQuantity}</span>
              </div>
            </div>

            {/* Total Estimated Value Highlight Box */}
            <div className="flex justify-between items-center bg-[#E5EDF6] border border-[#CBD5E1] text-[#163354] p-2 print:py-1.5 print:px-2.5 rounded-[6px]">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8.5px]">TOTAL ESTIMATED COST:</span>
              <span className="font-mono font-extrabold text-sm print:text-[11px]">
                ₹{totalEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Generated Purchase Orders (if any) */}
        {prn.purchaseOrders && prn.purchaseOrders.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 print:p-2 break-inside-avoid">
            <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#CBD5E1] text-[10px] print:text-[8px] font-bold uppercase text-[#163354] tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#163354]" />
              <span>LINKED PURCHASE ORDERS (POS) ISSUED FROM THIS PRN:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {prn.purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white p-2 rounded-[6px] border border-[#CBD5E1] flex items-center justify-between text-caption font-mono">
                  <div>
                    <span className="font-bold text-[#111827]">{po.poNumber}</span>
                    <span className="text-[10px] print:text-[8px] text-[#475569] block">{po.vendor?.vendorName || 'Vendor'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#111827]">₹{Number(po.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[9px] print:text-[7.5px] font-semibold text-[#163354] bg-[#E5EDF6] px-1.5 py-0.5 rounded border border-[#CBD5E1] block mt-0.5">
                      {po.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-Box Open Corporate Signature Strip */}
        <OfficialSignatureStrip
          boxes={[
            {
              title: '1. INDENTED BY (STORES / DEPT)',
              role: prn.requestedBy || 'Storekeeper',
              caption: 'SIGN & DATE',
            },
            {
              title: '2. VERIFIED & APPROVED (HOD / PLANT)',
              role: prn.approvedBy || (prn.status === 'APPROVED' ? 'Plant Manager' : 'Pending Review'),
              caption: 'HOD SIGNATURE',
            },
            {
              title: '3. PURCHASE ACTION (COMMERCIAL)',
              role: prn.purchaseOrders && prn.purchaseOrders.length > 0 ? `${prn.purchaseOrders.length} PO(s) Generated` : 'Pending PO',
              caption: 'PURCHASE OFFICER SIGN & STAMP',
            },
          ]}
        />
        </div>

      </OfficialSheetShell>
    </div>
  );
}
