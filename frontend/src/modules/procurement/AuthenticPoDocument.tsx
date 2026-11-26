"use client";

import React, { useState } from 'react';
import { Download, Printer, ArrowLeft, CheckCircle, Edit2, Plus, Trash2, Check, RotateCcw, Truck, FileText } from 'lucide-react';
import { exportPoToExcel, PoExportData } from './poExcelExporter';
import { parseLwh } from './MultiProjectPoWizard';
import { normalizePoTerms } from './poTermsPresets';
import { printIsolatedElement } from '@/utils/printDocument';
import { Button } from '@/components/ui/Button';
import {
  OfficialSheetShell,
  OfficialLetterhead,
  OfficialInstructionBar,
  OfficialSignatureStrip,
  CoinsStackIcon,
  numberToWordsINR,
} from '@/components/print/OfficialStationery';

interface AuthenticPoDocumentProps {
  data: PoExportData;
  onBack?: () => void;
  onSave?: (updatedTerms?: string[]) => void;
  isSaving?: boolean;
  saved?: boolean;
}

export function AuthenticPoDocument({ data, onBack, onSave, isSaving, saved }: AuthenticPoDocumentProps) {
  const [currentTerms, setCurrentTerms] = useState<string[]>(() =>
    normalizePoTerms(data.termsAndConditions ?? (data as any).customFields?.termsAndConditions)
  );
  const [isEditingTerms, setIsEditingTerms] = useState<boolean>(false);

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
    items.forEach(item => {
      const qty = Number(item.orderedQty || 0);
      const itemCustom = (item as any).customFields || {};
      let apWt = Number(item.apWt ?? itemCustom.apWt ?? (item as any).calculatedWeight ?? 0);
      let totalWt = Number(item.totalWt ?? itemCustom.totalWt ?? 0);
      
      const { lVal, wVal, hVal } = parseLwh(
        (item as any).dimensions || (item as any).rawSize || itemCustom.rawMaterialSize,
        item.length || itemCustom.length,
        item.width || itemCustom.width,
        item.height || itemCustom.height
      );

      const matGradeUpper = (item.materialGrade || (item as any).material?.materialGrade || '').toUpperCase();
      const isStd = matGradeUpper.includes('STD') || matGradeUpper.includes('STANDARD') || matGradeUpper.includes('BOUGHT') || (item as any).isBoughtOut;

      if (isStd) {
        apWt = 0;
        totalWt = 0;
      } else if (apWt === 0 && totalWt === 0) {
        const density = Number((item as any).material?.density || 7.85);
        if (lVal === 'Ø' || lVal.startsWith('Ø')) {
          const d = parseFloat(wVal);
          const l = parseFloat(hVal);
          if (!isNaN(d) && !isNaN(l) && d > 0 && l > 0) {
            const vol = Math.PI * Math.pow(d / 2, 2) * l;
            apWt = Number(((vol * density) / 1000000).toFixed(2));
            totalWt = Number((apWt * qty).toFixed(2));
          }
        } else {
          const l = parseFloat(lVal);
          const w = parseFloat(wVal);
          const h = parseFloat(hVal);
          if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
            apWt = Number(((l * w * h * density) / 1000000).toFixed(2));
            totalWt = Number((apWt * qty).toFixed(2));
          }
        }
      } else if (totalWt === 0 && apWt > 0) {
        totalWt = Number((qty * apWt).toFixed(2));
      } else if (apWt === 0 && totalWt > 0 && qty > 0) {
        apWt = Number((totalWt / qty).toFixed(2));
      }

      const rate = Number(item.agreedRate || 0);
      const basicCost = Number(item.basicValue || (totalWt > 0 ? totalWt * rate : qty * rate));
      const gstPct = Number((item as any).gstPercent || itemCustom.gstPercent || 18);
      const gst = Number((item as any).gstAmount || itemCustom.gstAmount || (basicCost * (gstPct / 100)));
      const total = Number((item as any).lineTotal || (basicCost + gst));

      grandTotalQty += qty;
      grandTotalApWt += apWt;
      grandTotalWt += totalWt;
      grandBasicCost += basicCost;
      grandGst += gst;
      grandTotalValue += total;
    });
  });

  grandBasicCost = Math.round((grandBasicCost + Number.EPSILON) * 100) / 100;
  grandGst = Math.round((grandGst + Number.EPSILON) * 100) / 100;
  grandTotalValue = Math.round((grandBasicCost + grandGst + Number.EPSILON) * 100) / 100;

  // Helper for circled detail numbers
  const formatCircledNum = (val: string | number) => {
    const num = parseInt(String(val), 10);
    if (!isNaN(num) && num >= 1 && num <= 20) {
      const circledUnicode = [
        '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
        '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'
      ];
      return circledUnicode[num - 1] || String(val);
    }
    return String(val);
  };

  const handlePrint = () => {
    printIsolatedElement('authentic-po-sheet', {
      orientation: 'portrait',
      title: data.poNumber || 'Purchase_Order',
    });
  };

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
              title="Back to Purchase Orders"
            >
              Back
            </Button>
          )}
          <div>
            <h2 className="text-body font-bold text-ink flex items-center flex-wrap gap-2.5">
              <span>Vendor Purchase Order (PO)</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success-border uppercase tracking-wider">
                Official Factory Document
              </span>
            </h2>
            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-caption text-cool-gray mt-1">
              <span>PO #: <strong className="font-mono font-bold text-ink">{data.poNumber || 'Draft'}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Vendor: <strong className="font-semibold text-ink">{data.vendorName}</strong></span>
              <span className="text-border-gray">•</span>
              <span>Date: <strong className="font-mono font-medium text-ink">{data.date || new Date().toLocaleDateString('en-GB')}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
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
            onClick={() => exportPoToExcel({ ...data, termsAndConditions: currentTerms })}
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

          {onSave && (
            <Button
              variant={saved ? "secondary" : "primary"}
              size="sm"
              onClick={() => onSave(currentTerms)}
              disabled={isSaving || saved}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {saved ? "PO Saved & Issued" : isSaving ? "Saving..." : "Save PO to DB"}
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Physical Paper Document Sheet (Print Target - Corporate Steel-Navy Theme) */}
      {/* ========================================================================= */}
      <OfficialSheetShell id="authentic-po-sheet" itemCount={data.items.length + Object.keys(grouped).length}>
        <OfficialLetterhead
          documentTitle="PURCHASE ORDER (PO)"
          legalSubtitle="(Issued under Section 31 of CGST Act for Procurement of Raw Materials & Tooling Components)"
        />

        {/* Vendor & PO Meta Dual Rounded Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid shrink-0">
          {/* Vendor Details (Left Card - 7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="p-3 sm:p-3.5 print:p-2.5 space-y-1.5">
              <div className="flex gap-2 items-baseline">
                <span className="font-semibold w-20 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">VENDOR:</span>
                <span className="font-bold text-[#111827] uppercase text-xs sm:text-sm print:text-[11px] truncate">
                  {data.vendorName || "RAJDHANI PROFILE"}
                </span>
              </div>

              <div className="flex gap-2 text-[11px] print:text-[9.5px]">
                <span className="font-semibold w-20 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">ADDRESS:</span>
                <span className="text-[#111827] leading-snug">{data.vendorAddress || "MIDC Waluj, Chhatrapati Sambhajinagar"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] px-3 sm:px-3.5 py-2 print:px-2.5 print:py-1.5 border-t border-[#CBD5E1]">
              <div className="border-r border-[#CBD5E1] pr-2">
                <span className="font-semibold text-[#475569]">GSTIN: </span>
                <span className="font-mono font-bold text-[#111827]">{(data as any).vendorGstin || "UNREGISTERED"}</span>
              </div>
              <div>
                <span className="font-semibold text-[#475569]">CONTACT: </span>
                <span className="font-mono font-semibold text-[#111827]">{(data as any).vendorPhone || (data as any).vendorEmail || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* PO Metadata (Right Card - 5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="grid grid-cols-2 border-b border-[#CBD5E1]">
              <div className="p-2.5 print:p-2 border-r border-[#CBD5E1]">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PO NUMBER:</span>
                <span className="font-mono font-bold text-[#111827] text-xs sm:text-sm print:text-[10.5px]">{data.poNumber || "PO-2026-0001"}</span>
              </div>
              <div className="p-2.5 print:p-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{data.date || new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-[#CBD5E1]">
              <div className="p-2.5 print:p-2 border-r border-[#CBD5E1]">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">RM SLIP NO:</span>
                <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{data.rmSlipNo || "PUR/26-27/0033"}</span>
              </div>
              <div className="p-2.5 print:p-2">
                <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">PAYMENT TERMS:</span>
                <span className="font-bold text-[#111827] text-xs print:text-[9.5px]">{(data as any).paymentTerms || "30 Days PDC"}</span>
              </div>
            </div>

            <div className="p-2.5 print:p-2">
              <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DELIVERY TIMELINE:</span>
              <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] block truncate">
                {data.deliveryTerms || "Within 7 Days of Order"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <OfficialInstructionBar text="KINDLY SUPPLY THE FOLLOWING ITEMS AS PER SPECIFICATIONS, QUALITY STANDARDS & TERMS MENTIONED BELOW." />

        {/* Main Line Items Table (Expands to fill A4 page body) */}
        <div className="pro-table-grow border border-[#CBD5E1] rounded-[8px] flex-1 flex flex-col bg-white">
          <table className="w-full table-fixed border-collapse text-[10.5px] print:text-[8.5px]">
            <thead>
              <tr className="bg-[#E5EDF6] border-b border-[#CBD5E1] font-bold text-[#163354] text-[8.5px] print:text-[7px] uppercase tracking-tight leading-tight">
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[3%] rounded-tl-[7px]">SR.</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-left w-[8.5%]">TOOL NO</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[4%]">DET #</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[4%]">L</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[4%]">W</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center w-[4%]">H</th>
                <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-left w-[13%]">MATERIAL</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[4.5%]">QTY</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[6%]">AP WT</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[6.5%]">TOT WT</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[6%]">RATE (₹)</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[9.5%]">BASIC (₹)</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[8%]">GST (₹)</th>
                <th className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right w-[10%]">TOTAL (₹)</th>
                <th className="py-2 px-1 print:py-1.5 text-left w-[9%] rounded-tr-[7px]">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1] border-b border-[#CBD5E1] text-[10px] print:text-[8px] font-sans">
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
                      const itemCustom = (item as any).customFields || {};
                      let apWt = Number(item.apWt ?? itemCustom.apWt ?? (item as any).calculatedWeight ?? 0);
                      let totalWt = Number(item.totalWt ?? itemCustom.totalWt ?? 0);
                      
                      const { lVal, wVal, hVal } = parseLwh(
                        (item as any).dimensions || (item as any).rawSize || itemCustom.rawMaterialSize,
                        item.length || itemCustom.length,
                        item.width || itemCustom.width,
                        item.height || itemCustom.height
                      );

                      if (apWt === 0 && totalWt === 0) {
                        const density = Number((item as any).material?.density || 7.85);
                        if (lVal === 'Ø' || lVal.startsWith('Ø')) {
                          const d = parseFloat(wVal);
                          const l = parseFloat(hVal);
                          if (!isNaN(d) && !isNaN(l) && d > 0 && l > 0) {
                            const vol = Math.PI * Math.pow(d / 2, 2) * l;
                            apWt = Number(((vol * density) / 1000000).toFixed(2));
                            totalWt = Number((apWt * qty).toFixed(2));
                          }
                        } else {
                          const l = parseFloat(lVal);
                          const w = parseFloat(wVal);
                          const h = parseFloat(hVal);
                          if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
                            apWt = Number(((l * w * h * density) / 1000000).toFixed(2));
                            totalWt = Number((apWt * qty).toFixed(2));
                          }
                        }
                      } else if (totalWt === 0 && apWt > 0) {
                        totalWt = Number((qty * apWt).toFixed(2));
                      } else if (apWt === 0 && totalWt > 0 && qty > 0) {
                        apWt = Number((totalWt / qty).toFixed(2));
                      }

                      const rate = Number(item.agreedRate || 0);
                      const basicCost = Number(item.basicValue || (totalWt > 0 ? totalWt * rate : qty * rate));
                      const gst = Number(item.gstAmount || itemCustom.gstAmount || (basicCost * 0.18));
                      const total = Number(item.lineTotal || (basicCost + gst));

                      groupQty += qty;
                      groupApWtSum += apWt;
                      groupTotalWtSum += totalWt;
                      groupBasicSum += basicCost;
                      groupGstSum += gst;
                      groupTotalSum += total;

                      return (
                        <tr key={`${toolNo}-${itemIdx}`} className="hover:bg-[#F8FAFC] break-inside-avoid">
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">
                            {itemIdx === 0 ? groupIdx + 1 : ""}
                          </td>
                          <td className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] font-bold text-[#111827] break-words">
                            {itemIdx === 0 ? toolNo : ""}
                          </td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center">
                            <span className="inline-flex items-center justify-center font-bold text-[#111827] text-[10px] print:text-[8px]">
                              {formatCircledNum(item.detNo || itemIdx + 1)}
                            </span>
                          </td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">{lVal}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">{wVal}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-center font-mono text-[#111827]">{hVal}</td>
                          <td className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] font-bold text-[#111827] break-words">{item.materialGrade || "—"}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">{qty}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">{apWt > 0 ? apWt.toFixed(2) : "-"}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">{totalWt > 0 ? totalWt.toFixed(2) : "-"}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">{rate > 0 ? `₹${rate.toFixed(0)}` : "-"}</td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono font-semibold text-[#111827] tabular-nums">
                            {basicCost > 0 ? `₹${basicCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">
                            {gst > 0 ? `₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-2 px-0.5 print:py-1.5 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                            {total > 0 ? `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="py-2 px-1 print:py-1.5 text-[#475569] text-[9.5px] print:text-[7.5px] italic leading-tight break-words">
                            {item.remarks || ""}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Subtotal row for this Tool No */}
                    <tr className="bg-[#E5EDF6] font-bold border-y border-[#CBD5E1] text-[10px] print:text-[8px] break-inside-avoid text-[#163354]">
                      <td colSpan={7} className="py-1.5 px-1.5 border-r border-[#CBD5E1] text-right uppercase tracking-wider text-[9.5px] print:text-[7.5px]">
                        {toolNo} SUBTOTAL ({items.length} ITEMS):
                      </td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold tabular-nums">{groupQty}</td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono tabular-nums">{groupApWtSum.toFixed(2)}</td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold tabular-nums">{groupTotalWtSum.toFixed(2)}</td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1]"></td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold tabular-nums">₹{groupBasicSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono tabular-nums">₹{groupGstSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-1.5 px-0.5 border-r border-[#CBD5E1] text-right font-mono font-bold tabular-nums">₹{groupTotalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Continuous vertical ledger dividers extending to fill full A4 body space */}
          <div className="pro-table-filler flex-1 flex w-full min-h-[24px] print:min-h-[16px]" aria-hidden="true">
            <table className="self-stretch w-full flex-1 table-fixed border-collapse">
              <tbody>
                <tr className="h-full">
                  <td className="p-0 w-[3%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[8.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[4%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[4%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[4%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[4%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[13%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[4.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[6%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[9.5%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[8%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[10%] border-r border-[#CBD5E1]" />
                  <td className="p-0 w-[9%]" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Bottom-Anchored Official Footer (Words, Totals, Terms & 3 Signatures)     */}
        {/* ========================================================================= */}
        <div className="mt-auto shrink-0 space-y-2.5 print:space-y-2 break-inside-avoid">
        {/* Amount in Words & Totals Summary Dual Cards */}
        <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid">
          {/* Left: Amount in Words & Delivery Instructions Card (7 Cols) */}
          <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] flex flex-col justify-between">
            <div className="p-3 sm:p-3.5 print:p-2.5 flex items-start gap-2.5">
              <CoinsStackIcon className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">AMOUNT IN WORDS:</span>
                <p className="font-semibold text-[#111827] text-xs print:text-[9.5px] italic mt-0.5 leading-snug">
                  {numberToWordsINR(grandTotalValue)}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 print:p-2.5 border-t border-[#CBD5E1] flex items-start gap-2.5">
              <Truck className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">DELIVERY &amp; SUPPLY INSTRUCTIONS:</span>
                <p className="text-[10.5px] print:text-[8.5px] text-[#475569] mt-0.5 leading-snug">
                  Delivery required to Krupa Stores, Waluj Aurangabad. Mill Test Certificate (MTC) and Heat Numbers are strictly mandatory upon supply.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Totals Card (5 Cols) */}
          <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2.5 sm:p-3 print:p-2 space-y-1.5 print:space-y-1 flex flex-col justify-between">
            <div className="space-y-1.5 print:space-y-1">
              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL QUANTITY:</span>
                <span className="font-mono font-bold text-[#111827]">{grandTotalQty} NOS</span>
              </div>

              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">TOTAL ORDER WEIGHT:</span>
                <span className="font-mono font-bold text-[#111827]">{grandTotalWt.toFixed(2)} KG</span>
              </div>

              <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">BASIC TAXABLE VALUE:</span>
                <span className="font-mono font-semibold text-[#111827]">₹{grandBasicCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between pb-0.5 font-semibold text-xs print:text-[9px]">
                <span className="text-[#475569]">EST. GST TAX:</span>
                <span className="font-mono font-semibold text-[#475569]">₹{grandGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            {/* Grand Total Value Highlight Box */}
            <div className="flex justify-between items-center bg-[#E5EDF6] border border-[#CBD5E1] text-[#163354] p-2 print:py-1.5 print:px-2.5 rounded-[6px]">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8.5px]">PURCHASE ORDER VALUE:</span>
              <span className="font-mono font-extrabold text-sm print:text-[11px]">
                ₹{grandTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions Card */}
        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 break-inside-avoid">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#CBD5E1] mb-2">
            <span className="font-bold text-[10px] print:text-[8.5px] uppercase tracking-wider text-[#163354] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#163354]" />
              <span>TERMS &amp; CONDITIONS OF PURCHASE ({currentTerms.length}):</span>
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
              {currentTerms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-semibold text-cool-gray w-4 text-right shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => {
                      const updated = [...currentTerms];
                      updated[idx] = e.target.value;
                      setCurrentTerms(updated);
                    }}
                    className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-border-gray rounded text-ink focus:outline-none focus:border-primary"
                    placeholder="Enter condition..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = currentTerms.filter((_, i) => i !== idx);
                      setCurrentTerms(updated.length > 0 ? updated : ['']);
                    }}
                    disabled={currentTerms.length <= 1}
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
                  onClick={() => setCurrentTerms([...currentTerms, ''])}
                  className="text-[10px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Clause</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTerms(normalizePoTerms(undefined))}
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
            <ol className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-5 gap-y-1 text-[10px] print:text-[8px] text-[#334155] leading-snug list-decimal list-inside">
              {currentTerms.map((t, i) => (
                <li key={i} className="leading-snug">{t}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 3-Box Open Corporate Signature Strip */}
        <OfficialSignatureStrip
          boxes={[
            {
              title: '1. PREPARED BY (PURCHASE)',
              role: 'Purchase Officer',
              caption: 'SIGN & DATE',
            },
            {
              title: '2. CHECKED BY (ACCOUNTS / QC)',
              role: 'Commercial Review',
              caption: 'CHECKED BY',
            },
            {
              title: '3. AUTHORIZED SIGNATORY',
              role: 'FOR KRUPA TOOLS & STAMPINGS',
              caption: 'AUTHORIZED STAMP & SIGN',
            },
          ]}
        />
        </div>

      </OfficialSheetShell>
    </div>
  );
}
