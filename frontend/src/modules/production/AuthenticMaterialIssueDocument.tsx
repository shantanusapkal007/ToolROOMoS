"use client";

import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { parseLwh } from '../procurement/MultiProjectPoWizard';
import { printIsolatedElement } from '@/utils/printDocument';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/formatters';

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
      {/* Printable Paper Sheet Target (A4 Vertical / Portrait)                      */}
      {/* ========================================================================= */}
      <div 
        id="authentic-material-issue-sheet"
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
                MATERIAL ISSUE SLIP &amp; SHOPFLOOR DISPATCH PASS
              </span>
              <span className="text-[9px] print:text-[6.5px] block text-zinc-600 font-semibold tracking-tight mt-0.5 print:mt-0">
                (Internal Stores Material Movement &amp; Work-In-Progress Transfer Voucher)
              </span>
            </div>
          </div>
        </div>

        {/* Issue Details Header */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Main Details (Left Col - 7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 space-y-1 print:space-y-0.5">
            <div className="flex gap-2">
              <span className="font-bold w-24 print:w-18 text-zinc-600 uppercase text-[10px] print:text-[7.5px]">SECTION:</span>
              <span className="font-bold text-ink uppercase text-xs sm:text-sm print:text-[9px] truncate">
                {data.productionSection || "GENERAL STORES / MACHINE SHOP"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] print:text-[7.5px] pt-1 print:pt-0.5 border-t border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600">PROJECT / TOOL: </span>
                <span className="font-bold text-ink">{data.project?.projectNumber || data.projectNumber || "GENERAL"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600">ISSUED TO: </span>
                <span className="font-semibold text-ink">{data.issuedTo || data.operatorName || "Shopfloor Operator"}</span>
              </div>
            </div>

            <div className="pt-1 print:pt-0.5 border-t border-border-gray text-[11px] print:text-[7.5px]">
              <span className="font-semibold text-zinc-600 uppercase text-[10px] print:text-[7.5px]">REMARKS / PURPOSE: </span>
              <span className="text-zinc-800">{data.remarks || "Raw stock issued for active machining operations."}</span>
            </div>
          </div>

          {/* Metadata (Right Col - 5 Cols) */}
          <div className="col-span-5 p-2.5 sm:p-3 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/40">
            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">ISSUE SLIP NO:</span>
                <span className="font-mono font-bold text-ink text-xs sm:text-sm print:text-[8.5px]">{data.slipNo || data.issueNumber || "MIS-2026-0001"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">DATE:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">{formatDate(data.createdAt || Date.now())}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">GATE PASS / REF:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">{data.referenceNumber || "INTERNAL-ISSUE"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">STATUS:</span>
                <span className="font-mono font-bold text-semantic-success-dark text-xs print:text-[8px] uppercase">APPROVED &amp; ISSUED</span>
              </div>
            </div>

            <div className="pt-0.5 print:pt-0">
              <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">ISSUING STORE:</span>
              <span className="font-semibold text-ink text-[11px] print:text-[8px] block truncate">
                Central Raw Material &amp; Tooling Crib
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="border-x-2 border-b-2 border-zinc-900 p-1.5 print:py-0.5 print:px-1 bg-zinc-100 text-center font-bold text-xs print:text-[7.5px] uppercase tracking-wider text-zinc-800 break-inside-avoid">
          PHYSICAL RAW MATERIAL ISSUED FROM CENTRAL STORES FOR PRODUCTION EXECUTION
        </div>

        {/* Main Line Items Table */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden break-inside-avoid">
          <table className="w-full border-collapse text-xs print:text-[8px]">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-900 font-bold text-zinc-800 text-[9.5px] print:text-[7.5px] uppercase tracking-wider">
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-8">SR.</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[140px]">MATERIAL GRADE &amp; DESCRIPTION</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-14">L (MM)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-14">W (MM)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-14">H (MM)</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[120px]">STORES BATCH &amp; HEAT NO</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">ISSUED QTY</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">UOM</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[100px]">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] print:text-[8px] font-sans">
              {items.map((item: any, idx: number) => {
                const batch = item.inventoryBatch || {};
                const mat = batch.material || {};
                
                const { lVal, wVal, hVal } = parseLwh(
                  mat.materialName || "", 
                  item.length || "", 
                  item.width || "", 
                  item.height || ""
                );

                return (
                  <tr key={item.id || idx} className="hover:bg-zinc-50/50 break-inside-avoid">
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 font-bold text-ink">
                      {mat.materialName || mat.materialGrade || 'Raw Material Component'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">
                      {lVal}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">
                      {wVal}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">
                      {hVal}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 font-mono text-[10px] print:text-[7.5px]">
                      <span className="font-semibold text-ink">{batch.batchNumber || '-'}</span>
                      {batch.heatNumber && <span className="text-cool-gray block text-[9px] print:text-[6.5px]">Heat: {batch.heatNumber}</span>}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-bold text-ink font-mono">
                      {Number(item.issuedQty)}
                    </td>
                    <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-600">
                      {mat.uom || 'NOS'}
                    </td>
                    <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 text-zinc-700 text-[10px] print:text-[7.5px] italic">
                      {item.remarks || 'Issued per BOM'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes Summary Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Left: Material Handling Policy (7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[9px] print:text-[7px] uppercase text-zinc-600">STORE ISSUANCE POLICY:</span>
              <p className="font-medium text-zinc-700 text-[10px] print:text-[7.5px] italic mt-0.5 leading-tight">
                Material issued to the shopfloor must be utilized exclusively for the designated project/section under strict FIFO inventory control. Any scrap, rejected pieces, or unused remnants must be returned to Stores with remnant weight logged via a Material Return Slip.
              </p>
            </div>
          </div>

          {/* Right: Totals Box (5 Cols) */}
          <div className="col-span-5 p-2 sm:p-2.5 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/80">
            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL LINE ITEMS:</span>
              <span className="font-mono font-bold text-ink">{items.length}</span>
            </div>

            {/* Total Issued Quantity Highlight Box */}
            <div className="pt-1 border-t border-primary/20 flex justify-between items-center bg-primary/10 border border-primary/30 text-ink p-1.5 print:py-0.5 print:px-1.5 rounded-[6px] mt-1 print:mt-0.5">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[7px] text-primary-dark">TOTAL PIECES ISSUED:</span>
              <span className="font-mono font-bold text-xs sm:text-sm print:text-[9px] text-primary">
                {totalIssuedQty} NOS
              </span>
            </div>
          </div>
        </div>

        {/* 3-Box Signature Block matching physical factory sheet */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-3 text-center text-xs print:text-[7.5px] p-2 print:py-1 print:px-1 bg-white rounded-b-lg break-inside-avoid">
          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 pr-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                1. ISSUED BY (STORES / CRIB)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">Storekeeper Sign</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">DISPATCH SIGN &amp; DATE</span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 px-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                2. RECEIVED BY (OPERATOR)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">Production Sign</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">ACKNOWLEDGEMENT SIGN</span>
          </div>

          <div className="flex flex-col justify-between h-14 sm:h-18 print:h-10 pl-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                3. AUTHORIZED BY (WORKS MANAGER)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">Plant Supervisor</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">HOD APPROVAL STAMP</span>
          </div>
        </div>

      </div>
    </div>
  );
}
