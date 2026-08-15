"use client";

import React from 'react';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { parseLwh } from '../procurement/MultiProjectPoWizard';

interface AuthenticMaterialIssueDocumentProps {
  data: any;
  onBack?: () => void;
}

export function AuthenticMaterialIssueDocument({ data, onBack }: AuthenticMaterialIssueDocumentProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-200 py-8 px-4 font-sans print:bg-white print:py-0 print:px-0">
      
      {/* Screen-only Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-zinc-600 hover:text-ink bg-white px-4 py-2 rounded-[12px] shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">Back to Inventory</span>
        </button>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2 rounded-[12px] shadow-sm transition-colors font-semibold text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-level-4 print:shadow-none print:w-full">
        
        {/* Document Header */}
        <div className="border-2 border-zinc-900 p-4 rounded-t-lg flex items-center justify-between gap-4 bg-white">
          <div className="w-36 shrink-0 flex items-center justify-center p-2 border border-border-gray rounded bg-white">
            <img src="/Krupa_Logo.png" alt="Krupa Logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="flex-1 text-center pr-4">
            <h1 className="text-xl md:text-2xl font-semibold uppercase tracking-wider text-[#ee1d36]">
              KRUPA TOOLS & STAMPINGS LTD.
            </h1>
            <p className="text-xs font-semibold text-ink mt-1 uppercase tracking-tight">
              GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136
            </p>
            <p className="text-xs font-semibold text-ink uppercase tracking-tight">
              GST NO : 27AAKCK1751B1ZS
            </p>
            <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-tight mt-0.5">
              Manufacturers of Press Tools,Jig Fixtures,Die sets, Gauge,All Types of Engineering Works
            </p>
          </div>
        </div>

        {/* Issue Details Header */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
          {/* Main Details */}
          <div className="col-span-8 p-3 border-r-2 border-zinc-900 space-y-1 bg-canvas/50">
            <div className="flex gap-2 pb-1 border-b border-border-gray">
              <span className="font-semibold w-24 text-zinc-600 uppercase">SECTION:</span>
              <span className="font-semibold text-ink uppercase text-sm">{data.productionSection || "GENERAL"}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <span className="font-semibold w-24 text-zinc-600 uppercase">REMARKS:</span>
              <span className="font-semibold text-zinc-800 uppercase">{data.remarks || "N/A"}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="col-span-4 p-3 space-y-1 bg-zinc-100/80">
            <div className="flex justify-between border-b border-border-gray pb-1">
              <span className="font-semibold text-zinc-600 uppercase">ISSUE NO:</span>
              <span className="font-mono font-semibold text-ink">{data.issueNumber}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold text-zinc-600 uppercase">DATE:</span>
              <span className="font-mono font-semibold text-ink">{new Date(data.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        <div className="border-x-2 border-b-2 border-zinc-900 p-2 text-center font-semibold text-sm uppercase tracking-widest text-ink bg-zinc-200">
          MATERIAL ISSUE / DISPATCH SLIP
        </div>

        {/* Main Line Items Table */}
        <div className="border-x-2 border-b-2 border-zinc-900">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-zinc-100 text-ink font-semibold border-b-2 border-zinc-900 text-[10px] uppercase tracking-tighter">
                <th className="p-2 border-r border-zinc-400 text-center w-12">SR.NO</th>
                <th className="p-2 border-r border-zinc-400">MATERIAL DETAILS</th>
                <th className="p-2 border-r border-zinc-400 text-center w-16">L</th>
                <th className="p-2 border-r border-zinc-400 text-center w-16">W</th>
                <th className="p-2 border-r border-zinc-400 text-center w-16">H</th>
                <th className="p-2 border-r border-zinc-400 text-center w-24">BATCH NO</th>
                <th className="p-2 border-r border-zinc-400 text-center w-16">ISSUED QTY</th>
                <th className="p-2 text-left w-32">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] font-sans">
              {data.items?.map((item: any, idx: number) => {
                const batch = item.inventoryBatch || {};
                const mat = batch.material || {};
                
                const { lVal, wVal, hVal } = parseLwh(
                  mat.materialName || "", 
                  "", 
                  "", 
                  ""
                );

                return (
                  <tr key={item.id} className="hover:bg-canvas">
                    <td className="p-2 border-r border-border-gray text-center font-semibold text-ink">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-border-gray font-semibold text-ink">
                      {mat.materialName || mat.materialGrade || 'Raw Material'}
                    </td>
                    <td className="p-2 border-r border-border-gray text-center font-mono text-zinc-700">
                      {lVal}
                    </td>
                    <td className="p-2 border-r border-border-gray text-center font-mono text-zinc-700">
                      {wVal}
                    </td>
                    <td className="p-2 border-r border-border-gray text-center font-mono text-zinc-700">
                      {hVal}
                    </td>
                    <td className="p-2 border-r border-border-gray text-center font-mono text-[9px] font-semibold text-zinc-600">
                      {batch.batchNumber || '-'}
                    </td>
                    <td className="p-2 border-r border-border-gray text-center font-semibold text-ink font-mono text-sm">
                      {Number(item.issuedQty)}
                    </td>
                    <td className="p-2 text-zinc-700 text-[10px]">
                      {item.remarks || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Signature Block */}
        <div className="border-x-2 border-b-2 border-zinc-900 flex flex-col min-h-[120px]">
          <div className="flex-1 p-3 text-[10px] text-zinc-600 italic border-b border-border-gray">
            Note: Material issued to the shop floor must be utilized for the specified project/section only. Any excess must be returned to the Stores department via a Material Return Slip.
          </div>
          
          <div className="grid grid-cols-3 divide-x-2 divide-zinc-900 text-xs font-semibold uppercase tracking-wider text-center bg-canvas">
            <div className="p-8 pb-3 flex flex-col justify-end h-24">
              <div className="border-t border-dashed border-zinc-400 pt-2 w-3/4 mx-auto text-[10px]">
                ISSUED BY (STORES)
              </div>
            </div>
            <div className="p-8 pb-3 flex flex-col justify-end h-24">
              <div className="border-t border-dashed border-zinc-400 pt-2 w-3/4 mx-auto text-[10px]">
                RECEIVED BY (OPERATOR)
              </div>
            </div>
            <div className="p-8 pb-3 flex flex-col justify-end h-24">
              <div className="border-t border-dashed border-zinc-400 pt-2 w-3/4 mx-auto text-[10px]">
                AUTHORIZED BY (HOD)
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
