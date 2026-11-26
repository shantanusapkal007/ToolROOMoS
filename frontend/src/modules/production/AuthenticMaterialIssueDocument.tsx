"use client";

import React from 'react';
import { Printer, ArrowLeft, ShieldCheck, Package } from 'lucide-react';
import { parseLwh } from '../procurement/MultiProjectPoWizard';
import { printIsolatedElement } from '@/utils/printDocument';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';
import {
  OfficialSheetShell,
  OfficialLetterhead,
  OfficialInstructionBar,
  OfficialSignatureStrip,
} from '@/components/print/OfficialStationery';

interface AuthenticMaterialIssueDocumentProps {
  data: any;
  onBack?: () => void;
}

export function AuthenticMaterialIssueDocument({ data, onBack }: AuthenticMaterialIssueDocumentProps) {
  const handlePrint = () => {
    printIsolatedElement('authentic-material-issue-sheet', {
      orientation: 'portrait',
      title: `Material_Issue_${data?.slipNo || data?.issueNumber || 'Slip'}`,
    });
  };

  const items = data.items || [];
  const totalIssuedQty = items.reduce((sum: number, it: any) => sum + Number(it.issuedQty || 0), 0);

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
              title="Back to Inventory"
            >
              Back to Inventory
            </Button>
          )}
          <div>
            <h2 className="text-body font-bold text-ink flex items-center flex-wrap gap-2.5">
              <span>Material Issue Slip (MIS)</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success-border uppercase tracking-wider">
                Physical Stores Document
              </span>
            </h2>
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-caption text-cool-gray mt-1">
              <span>Slip #: <strong className="font-mono font-bold text-ink">{data?.slipNo || data?.issueNumber || 'Draft'}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Section: <strong className="font-semibold text-ink">{data.productionSection || "GENERAL STORES"}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Date: <strong className="font-mono font-medium text-ink">{formatDate(data.createdAt || Date.now())}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Slip / Save PDF
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Printable Paper Sheet Target (Corporate Steel-Navy Stationery Theme)      */}
      {/* ========================================================================= */}
      <OfficialSheetShell id="authentic-material-issue-sheet" itemCount={items.length}>
        <OfficialLetterhead
          documentTitle="MATERIAL ISSUE SLIP & SHOPFLOOR PASS"
          legalSubtitle="(Internal Stores Material Movement & Work-In-Progress Transfer Voucher)"
        />

        {/* Issue Details Dual Rounded Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid shrink-0">
          {/* Main Details (Left Card - 7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex flex-col justify-between space-y-2">
            <div className="flex gap-2 items-baseline">
              <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">SECTION:</span>
              <span className="font-bold text-[#111827] uppercase text-xs sm:text-sm print:text-[11px] truncate">
                {data.productionSection || data.operationName || "GENERAL STORES / MACHINE SHOP"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] pt-1.5 border-t border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569]">PROJECT / TOOL: </span>
                <span className="font-bold text-[#111827]">{data.project?.projectNumber || data.projectNumber || data.jobCardNumber || "GENERAL"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">ISSUED TO: </span>
                <span className="font-semibold text-[#111827]">{data.issuedTo || data.operatorName || "Shopfloor Operator"}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#CBD5E1] text-[11px] print:text-[9px]">
              <span className="font-semibold text-[#475569] uppercase text-[10px] print:text-[8.5px]">REMARKS / PURPOSE: </span>
              <span className="text-[#475569]">{data.remarks || "Raw stock issued for active machining operations."}</span>
            </div>
          </div>

          {/* Metadata (Right Card - 5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 space-y-2 print:space-y-1.5">
            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">ISSUE SLIP NO:</span>
                <span className="font-mono font-bold text-[#111827] text-xs sm:text-sm print:text-[10.5px]">{data.slipNo || data.issueNumber || "MIS-2026-0001"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{data.date || formatDate(data.createdAt || Date.now())}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">GATE PASS / REF:</span>
                <span className="font-mono font-semibold text-[#111827] text-xs print:text-[9.5px]">{data.referenceNumber || "INTERNAL-ISSUE"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">STATUS:</span>
                <span className="font-mono font-bold text-[#163354] text-xs print:text-[9.5px] uppercase">APPROVED &amp; ISSUED</span>
              </div>
            </div>

            <div className="pt-0.5">
              <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">ISSUING STORE:</span>
              <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] block truncate">
                Central Raw Material &amp; Tooling Crib
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <OfficialInstructionBar text="PHYSICAL RAW MATERIAL ISSUED FROM CENTRAL STORES FOR PRODUCTION EXECUTION" />

        {/* Main Line Items Table (Expands to fill A4 page body) */}
        <div className="pro-table-grow border border-[#CBD5E1] rounded-[8px] flex-1 flex flex-col bg-white">
          <table className="w-full table-fixed border-collapse text-[11px] print:text-[9px]">
            <thead>
              <tr className="bg-[#E5EDF6] border-b border-[#CBD5E1] font-bold text-[#163354] text-[9px] print:text-[7.5px] uppercase tracking-tight leading-tight">
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[4%] rounded-tl-[7px]">SR.</th>
                <th className="py-2 px-1.5 print:py-1.5 border-r border-[#CBD5E1] text-left w-[22%]">MATERIAL GRADE &amp; DESCRIPTION</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[7%]">L (MM)</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[7%]">W (MM)</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[7%]">H (MM)</th>
                <th className="py-2 px-1.5 print:py-1.5 border-r border-[#CBD5E1] text-left w-[21%]">STORES BATCH &amp; HEAT NO</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[9%]">ISSUED QTY</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[6%]">UOM</th>
                <th className="py-2 px-1.5 print:py-1.5 text-left w-[17%] rounded-tr-[7px]">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1] border-b border-[#CBD5E1] text-[10.5px] print:text-[8.5px] font-sans">
              {items.map((item: any, idx: number) => {
                const batch = item.inventoryBatch || {};
                const mat = batch.material || {};
                const displayMaterialName = mat.materialName || mat.materialGrade || item.materialName || 'Raw Material Component';
                const displayBatchNumber = batch.batchNumber || item.batchNumber || '-';
                const displayHeatNumber = batch.heatNumber || item.heatNumber;
                const displayUom = mat.uom || mat.defaultUom || item.uom || 'NOS';
                const dimSource =
                  item.dimensions ||
                  mat.dimensions ||
                  mat.rawSize ||
                  (/\d+\s*[x×*]\s*\d+/i.test(displayMaterialName) ? displayMaterialName : "");

                const { lVal, wVal, hVal } = parseLwh(
                  dimSource,
                  item.length || "",
                  item.width || "",
                  item.height || ""
                );

                return (
                  <tr key={item.id || idx} className="hover:bg-[#F8FAFC] break-inside-avoid align-top">
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827] break-words">
                      {displayMaterialName}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">
                      {lVal}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">
                      {wVal}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">
                      {hVal}
                    </td>
                    <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-mono text-[10px] print:text-[8px] break-words">
                      <span className="font-semibold text-[#111827]">{displayBatchNumber}</span>
                      {displayHeatNumber && <span className="text-[#475569] block text-[9px] print:text-[7.5px]">Heat: {displayHeatNumber}</span>}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-bold text-[#111827] font-mono tabular-nums">
                      {Number(item.issuedQty)}
                    </td>
                    <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">
                      {displayUom}
                    </td>
                    <td className="py-2.5 px-1.5 print:py-2 text-[#475569] text-[10px] print:text-[8px] italic break-words">
                      {item.remarks || 'Issued per BOM'}
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
                  <td className="p-0 w-[4%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[22%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[7%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[7%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[7%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[21%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[9%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[17%]" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom-Anchored Official Footer */}
        <div className="mt-auto shrink-0 space-y-2.5 print:space-y-2">
        {/* Totals & Notes Summary Dual Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid">
          {/* Left: Material Handling Policy Card (7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">STORE ISSUANCE POLICY:</span>
              <p className="font-medium text-[#475569] text-[10.5px] print:text-[8.5px] italic mt-0.5 leading-snug">
                Material issued to the shopfloor must be utilized exclusively for the designated project/section under strict FIFO inventory control. Any scrap, rejected pieces, or unused remnants must be returned to Stores with remnant weight logged via a Material Return Slip.
              </p>
            </div>
          </div>

          {/* Right: Totals Card (5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2.5 sm:p-3 print:p-2 space-y-1.5 print:space-y-1 flex flex-col justify-between">
            <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
              <span className="text-[#475569]">TOTAL LINE ITEMS:</span>
              <span className="font-mono font-bold text-[#111827]">{items.length}</span>
            </div>

            {/* Total Issued Quantity Highlight Box */}
            <div className="flex justify-between items-center bg-[#E5EDF6] border border-[#CBD5E1] text-[#163354] p-2 print:py-1.5 print:px-2.5 rounded-[6px]">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8.5px]">TOTAL PIECES ISSUED:</span>
              <span className="font-mono font-extrabold text-sm print:text-[11px]">
                {totalIssuedQty} NOS
              </span>
            </div>
          </div>
        </div>

        {/* 3-Box Open Corporate Signature Strip */}
        <OfficialSignatureStrip
          boxes={[
            {
              title: '1. ISSUED BY (STORES / CRIB)',
              role: 'Storekeeper Sign',
              caption: 'DISPATCH SIGN & DATE',
            },
            {
              title: '2. RECEIVED BY (OPERATOR)',
              role: 'Production Sign',
              caption: 'ACKNOWLEDGEMENT SIGN',
            },
            {
              title: '3. AUTHORIZED BY (WORKS MANAGER)',
              role: 'Plant Supervisor',
              caption: 'HOD APPROVAL STAMP',
            },
          ]}
        />
        </div>

      </OfficialSheetShell>
    </div>
  );
}
