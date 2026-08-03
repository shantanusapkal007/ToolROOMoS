"use client";

import React from 'react';
import { Download, Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import { exportPoToExcel, PoExportData } from './poExcelExporter';
import { parseLwh } from './MultiProjectPoWizard';

interface AuthenticPoDocumentProps {
  data: PoExportData;
  onBack?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saved?: boolean;
}

export function AuthenticPoDocument({ data, onBack, onSave, isSaving, saved }: AuthenticPoDocumentProps) {
  // Group items by toolNo
  const grouped: { [key: string]: typeof data.items } = {};
  data.items.forEach(item => {
    const key = item.toolNo || "GENERAL";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  let grandTotalQty = 0;
  let grandTotalApWt = 0;
  let grandTotalWt = 0;
  let grandBasicCost = 0;
  let grandGst = 0;
  let grandTotalValue = 0;

  Object.values(grouped).forEach(items => {
    items.forEach(i => {
      grandTotalQty += Number(i.orderedQty || 0);
      grandTotalApWt += Number(i.apWt || 0);
      grandTotalWt += Number(i.totalWt || 0);
      grandBasicCost += Number(i.basicValue || 0);
      grandGst += Number(i.gstAmount || 0);
      grandTotalValue += Number(i.lineTotal || 0);
    });
  });

  // Helper for circled detail numbers (①, ②, ③, etc.)
  const formatCircledNum = (val: string | number) => {
    const num = parseInt(String(val), 10);
    if (!isNaN(num) && num >= 1 && num <= 20) {
      const circledUnicode = [
        '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
        '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑯'
      ];
      return circledUnicode[num - 1] || String(val);
    }
    return String(val);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-700/50 shadow-xl text-white hide-on-print">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <span>Authentic PO Sheet Preview</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2-Page Physical Sheet Format
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Exact layout matching shopfloor paper purchase orders</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportPoToExcel(data)}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving || saved}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                saved 
                  ? "bg-emerald-600 text-white" 
                  : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{saved ? "PO Saved & Issued" : isSaving ? "Saving..." : "Save PO to DB"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Physical Paper Document Sheet (Print Target) */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-zinc-200 text-zinc-900 max-w-[1050px] mx-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none font-sans">
        
        {/* Document Header */}
        <div className="border-2 border-zinc-900 p-4 rounded-t-lg flex items-center justify-between gap-4 bg-white">
          <div className="w-36 shrink-0 flex items-center justify-center p-2 border border-zinc-300 rounded bg-white">
            <img src="/Krupa_Logo.png" alt="Krupa Logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="flex-1 text-center pr-4">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-[#CC0000]">
              KRUPA TOOLS & STAMPINGS LTD.
            </h1>
            <p className="text-xs font-bold text-zinc-900 mt-1 uppercase tracking-tight">
              GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANGABAD - 431136
            </p>
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-tight">
              GST NO : 27AAKCK1751B1ZS
            </p>
            <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-tight mt-0.5">
              Manufacturers of Press Tools,Jig Fixtures,Die sets, Gauge,All Types of Engineering Works
            </p>
            <div className="mt-1 pt-1 border-t border-zinc-300">
              <span className="font-extrabold text-sm uppercase tracking-widest text-zinc-900 underline">
                PURCHASE ORDER
              </span>
            </div>
          </div>
        </div>

        {/* Vendor & PO Detail Grid Header */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
          {/* Vendor Details */}
          <div className="col-span-8 p-3 border-r-2 border-zinc-900 space-y-1">
            <div className="flex gap-2">
              <span className="font-bold w-24 text-zinc-600 uppercase">VENDOR NAME:</span>
              <span className="font-bold text-zinc-900 uppercase text-sm">{data.vendorName || "RAJDHANI PROFILE"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold w-24 text-zinc-600 uppercase">ADDRESS:</span>
              <span className="font-semibold text-zinc-800 uppercase">{data.vendorAddress || "CHAKAN PUNE"}</span>
            </div>
          </div>

          {/* PO Metadata */}
          <div className="col-span-4 p-3 space-y-1 bg-zinc-50/50">
            <div className="flex justify-between border-b border-zinc-200 pb-1">
              <span className="font-bold text-zinc-600 uppercase">RM SLIP NO:</span>
              <span className="font-mono font-bold text-zinc-900">{data.rmSlipNo || "PUR/26-27/0033"}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-bold text-zinc-600 uppercase">DATE:</span>
              <span className="font-mono font-bold text-zinc-900">{data.date || new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="border-x-2 border-b-2 border-zinc-900 p-2 bg-zinc-100 text-center font-bold text-xs uppercase tracking-wider text-zinc-800">
          KINDLY SUPPLY THE FOLLOWING ITEMS AS PER TERMS & CONDITIONS MENTIONED BELOW.
        </div>

        {/* Main Line Items Table */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-zinc-200 text-zinc-900 font-bold border-b-2 border-zinc-900 text-[10px] uppercase tracking-tighter">
                <th className="p-1.5 border-r border-zinc-400 text-center w-10">SR.NO</th>
                <th className="p-1.5 border-r border-zinc-400 w-24">TOOL NO</th>
                <th className="p-1.5 border-r border-zinc-400 text-center w-12">DET NO</th>
                <th className="p-1.5 border-r border-zinc-400 text-center w-14">L</th>
                <th className="p-1.5 border-r border-zinc-400 text-center w-14">W</th>
                <th className="p-1.5 border-r border-zinc-400 text-center w-14">H</th>
                <th className="p-1.5 border-r border-zinc-400 w-20">MATERIAL</th>
                <th className="p-1.5 border-r border-zinc-400 text-center w-12">QTY</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-16">AP WT.</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-18">TOTAL WT</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-14">RATE</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-20">BASIC COST</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-16">GST</th>
                <th className="p-1.5 border-r border-zinc-400 text-right w-20">TOTAL</th>
                <th className="p-1.5 text-left min-w-[120px]">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] font-sans">
              {Object.entries(grouped).map(([toolNo, items], groupIdx) => {
                let groupQty = 0;
                let groupApWtSum = 0;
                let groupTotalWtSum = 0;
                let groupBasicSum = 0;
                let groupGstSum = 0;
                let groupTotalSum = 0;

                return (
                  <React.Fragment key={toolNo}>
                    {items.map((item, itemIdx) => {
                      const qty = Number(item.orderedQty || 0);
                      const apWt = Number(item.apWt || 0);
                      const totalWt = Number(item.totalWt || (qty * apWt));
                      const rate = Number(item.agreedRate || 0);
                      const basicCost = Number(item.basicValue || (totalWt > 0 ? totalWt * rate : qty * rate));
                      const gst = Number(item.gstAmount || (basicCost * 0.18));
                      const total = Number(item.lineTotal || (basicCost + gst));

                      groupQty += qty;
                      groupApWtSum += apWt;
                      groupTotalWtSum += totalWt;
                      groupBasicSum += basicCost;
                      groupGstSum += gst;
                      groupTotalSum += total;

                      const { lVal, wVal, hVal } = parseLwh(
                        (item as any).dimensions || (item as any).rawSize,
                        item.length,
                        item.width,
                        item.height
                      );

                      return (
                        <tr key={`${toolNo}-${itemIdx}`} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-1.5 border-r border-zinc-300 text-center font-bold text-zinc-900">
                            {itemIdx === 0 ? groupIdx + 1 : ""}
                          </td>
                          <td className="p-1.5 border-r border-zinc-300 font-bold text-zinc-900 tracking-tight">
                            {itemIdx === 0 ? toolNo : ""}
                          </td>
                          <td className="p-1.5 border-r border-zinc-300 text-center">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 border border-zinc-800 font-bold text-zinc-900 text-[10px]">
                              {formatCircledNum(item.detNo || itemIdx + 1)}
                            </span>
                          </td>
                          <td className="p-1.5 border-r border-zinc-300 text-center font-mono font-bold text-zinc-900">{lVal}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-center font-mono font-bold text-zinc-900">{wVal}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-center font-mono font-bold text-zinc-900">{hVal}</td>
                          <td className="p-1.5 border-r border-zinc-300 font-semibold text-zinc-800">{item.materialGrade || "MS"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-center font-bold text-zinc-900 font-mono">{qty}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono">{apWt > 0 ? apWt.toFixed(2) : "-"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono font-bold">{totalWt > 0 ? totalWt.toFixed(2) : "-"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono">{rate > 0 ? rate.toFixed(0) : "-"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono font-semibold">{basicCost > 0 ? basicCost.toFixed(2) : "-"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-600">{gst > 0 ? gst.toFixed(2) : "-"}</td>
                          <td className="p-1.5 border-r border-zinc-300 text-right font-mono font-bold text-zinc-900">{total > 0 ? total.toFixed(2) : "-"}</td>
                          <td className="p-1.5 text-zinc-600 text-[10px] italic leading-tight">{item.remarks || ""}</td>
                        </tr>
                      );
                    })}

                    {/* Subtotal row for this Tool No */}
                    <tr className="bg-zinc-100/80 font-bold border-y-2 border-zinc-400 text-xs">
                      <td colSpan={7} className="p-1.5 border-r border-zinc-300 text-right uppercase tracking-wider text-[10px] text-zinc-700">
                        {toolNo} Subtotal ({items.length} Items):
                      </td>
                      <td className="p-1.5 border-r border-zinc-300 text-center font-mono text-zinc-900">{groupQty}</td>
                      <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-900">{groupApWtSum.toFixed(2)}</td>
                      <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-900">{groupTotalWtSum.toFixed(2)}</td>
                      <td className="p-1.5 border-r border-zinc-300"></td>
                      <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-900">{groupBasicSum.toFixed(2)}</td>
                      <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-700">{groupGstSum.toFixed(2)}</td>
                      <td className="p-1.5 border-r border-zinc-300 text-right font-mono text-zinc-950 font-black">{groupTotalSum.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer & Grand Total Section */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs">
          
          {/* Terms & Delivery Side */}
          <div className="col-span-6 p-4 border-r-2 border-zinc-900 flex flex-col justify-between space-y-4">
            <div>
              <span className="font-bold text-zinc-600 uppercase block mb-1">DELIVERY TIMELINE:</span>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded font-bold text-amber-900 text-sm">
                DELIVERY - {data.deliveryTerms || "WITHIN 1 DAYS"}
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-zinc-600">
              <p className="font-semibold text-zinc-800">Standard Terms & Conditions:</p>
              <p>1. Material must strictly conform to technical specification & dimensions.</p>
              <p>2. Test certificate / inspection report must accompany the delivery slip.</p>
              <p>3. Rejected items will be returned at supplier's expense.</p>
            </div>
          </div>

          {/* Grand Totals Box */}
          <div className="col-span-6 p-4 space-y-2 bg-zinc-50/80">
            <div className="flex justify-between border-b border-zinc-300 pb-1 font-semibold">
              <span className="text-zinc-600">TOTAL ORDER WEIGHT:</span>
              <span className="font-mono font-bold text-zinc-900">{grandTotalWt.toFixed(2)} KG</span>
            </div>
            <div className="flex justify-between border-b border-zinc-300 pb-1 font-semibold">
              <span className="text-zinc-600">BASIC VALUE:</span>
              <span className="font-mono font-bold text-zinc-900">₹{grandBasicCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-300 pb-1 font-semibold">
              <span className="text-zinc-600">TOTAL GST TAX (EST.):</span>
              <span className="font-mono font-bold text-zinc-800">₹{grandGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {/* Grand Total Value Highlight */}
            <div className="pt-2 border-t-2 border-zinc-900 flex justify-between items-center bg-zinc-900 text-white p-3 rounded-lg mt-2">
              <span className="font-black uppercase tracking-wider text-xs">PURCHASE ORDER VALUE (INR):</span>
              <span className="font-mono font-black text-lg text-amber-400">
                ₹{grandTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Block matching physical sheet */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-3 text-center text-xs p-6 bg-white rounded-b-lg">
          
          <div className="border-r border-zinc-300 flex flex-col justify-between h-24">
            <div className="h-16"></div>
            <span className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">PREPARED BY</span>
          </div>

          <div className="border-r border-zinc-300 flex flex-col justify-between h-24">
            <div className="h-16"></div>
            <span className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">CHECKED BY</span>
          </div>

          <div className="flex flex-col justify-between h-24">
            <div className="h-16"></div>
            <span className="font-bold text-zinc-800 uppercase text-[11px] tracking-wider">AUTHORIZED SIGNATORY</span>
          </div>

        </div>

      </div>
    </div>
  );
}
