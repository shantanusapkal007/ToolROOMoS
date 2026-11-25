"use client";

import React, { useState } from 'react';
import { Download, Printer, ArrowLeft, CheckCircle, Edit2, Plus, Trash2, Check, RotateCcw } from 'lucide-react';
import { exportPoToExcel, PoExportData } from './poExcelExporter';
import { parseLwh } from './MultiProjectPoWizard';
import { normalizePoTerms } from './poTermsPresets';
import { printIsolatedElement } from '@/utils/printDocument';
import { Button } from '@/components/ui/Button';

interface AuthenticPoDocumentProps {
  data: PoExportData;
  onBack?: () => void;
  onSave?: (updatedTerms?: string[]) => void;
  isSaving?: boolean;
  saved?: boolean;
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
      {/* Physical Paper Document Sheet (Print Target - A4 Portrait)                */}
      {/* ========================================================================= */}
      <div 
        id="authentic-po-sheet"
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
                PURCHASE ORDER (PO)
              </span>
              <span className="text-[9px] print:text-[6.5px] block text-zinc-600 font-semibold tracking-tight mt-0.5 print:mt-0">
                (Issued under Section 31 of CGST Act for Procurement of Raw Materials &amp; Tooling Components)
              </span>
            </div>
          </div>
        </div>

        {/* Vendor & PO Meta Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Vendor Details (Left Col - 7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 space-y-1 print:space-y-0.5">
            <div className="flex gap-2">
              <span className="font-bold w-22 print:w-18 text-zinc-600 uppercase text-[10px] print:text-[7.5px]">VENDOR:</span>
              <span className="font-bold text-ink uppercase text-xs sm:text-sm print:text-[9px] truncate">
                {data.vendorName || "RAJDHANI PROFILE"}
              </span>
            </div>

            <div className="flex gap-2 text-[11px] print:text-[7.5px]">
              <span className="font-semibold w-22 print:w-18 text-zinc-600 uppercase text-[10px] print:text-[7.5px]">ADDRESS:</span>
              <span className="text-zinc-800 print:leading-tight">{data.vendorAddress || "MIDC Waluj, Chhatrapati Sambhajinagar"}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] print:text-[7.5px] pt-1 print:pt-0.5 border-t border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600">GSTIN: </span>
                <span className="font-mono font-semibold text-ink">{(data as any).vendorGstin || "UNREGISTERED"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600">CONTACT: </span>
                <span className="font-mono text-ink">{(data as any).vendorPhone || (data as any).vendorEmail || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* PO Metadata (Right Col - 5 Cols) */}
          <div className="col-span-5 p-2.5 sm:p-3 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/40">
            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">PO NUMBER:</span>
                <span className="font-mono font-bold text-ink text-xs sm:text-sm print:text-[8.5px]">{data.poNumber || "PO-2026-0001"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">DATE:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">{data.date || new Date().toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-0.5 print:pb-0 border-b border-border-gray">
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">RM SLIP NO:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">{data.rmSlipNo || "PUR/26-27/0033"}</span>
              </div>
              <div>
                <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">PAYMENT TERMS:</span>
                <span className="font-mono font-semibold text-ink text-xs print:text-[8px]">{(data as any).paymentTerms || "30 Days PDC"}</span>
              </div>
            </div>

            <div className="pt-0.5 print:pt-0">
              <span className="font-semibold text-zinc-600 block text-[9px] print:text-[7px] uppercase">DELIVERY TIMELINE:</span>
              <span className="font-semibold text-amber-700 text-[11px] print:text-[8px] block truncate">
                {data.deliveryTerms || "Within 7 Days of Order"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="border-x-2 border-b-2 border-zinc-900 p-1.5 print:py-0.5 print:px-1 bg-zinc-100 text-center font-bold text-xs print:text-[7.5px] uppercase tracking-wider text-zinc-800 break-inside-avoid">
          KINDLY SUPPLY THE FOLLOWING ITEMS AS PER SPECIFICATIONS, QUALITY STANDARDS &amp; TERMS MENTIONED BELOW.
        </div>

        {/* Main Line Items Table */}
        <div className="border-x-2 border-b-2 border-zinc-900 overflow-hidden break-inside-avoid">
          <table className="w-full border-collapse text-xs print:text-[8px]">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-900 font-bold text-zinc-800 text-[9.5px] print:text-[7.5px] uppercase tracking-wider">
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-8">SR.</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-left w-20">TOOL NO</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-10">DET #</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">L</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">W</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-center w-12">H</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[90px]">MATERIAL</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-12">QTY</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">AP WT (KG)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">TOT WT (KG)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">RATE (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-20">BASIC (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-16">GST (₹)</th>
                <th className="p-2 print:py-1 print:px-1 border-r border-zinc-400 text-right w-20">TOTAL (₹)</th>
                <th className="p-2 print:py-1 print:px-1.5 border-r border-zinc-400 text-left min-w-[100px]">REMARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300 text-[11px] print:text-[8px] font-sans">
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
                        <tr key={`${toolNo}-${itemIdx}`} className="hover:bg-zinc-50/50 break-inside-avoid">
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-500">
                            {itemIdx === 0 ? groupIdx + 1 : ""}
                          </td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 font-bold text-ink">
                            {itemIdx === 0 ? toolNo : ""}
                          </td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center">
                            <span className="inline-flex items-center justify-center font-bold text-zinc-800 text-[10px] print:text-[8px]">
                              {formatCircledNum(item.detNo || itemIdx + 1)}
                            </span>
                          </td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">{lVal}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">{wVal}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-center font-mono text-zinc-800">{hVal}</td>
                          <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 font-bold text-ink">{item.materialGrade || "—"}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">{qty}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-700">{apWt > 0 ? apWt.toFixed(2) : "-"}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">{totalWt > 0 ? totalWt.toFixed(2) : "-"}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-800">{rate > 0 ? `₹${rate.toFixed(0)}` : "-"}</td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-semibold text-ink">
                            {basicCost > 0 ? `₹${basicCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-700">
                            {gst > 0 ? `₹${gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="p-2 print:py-1 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">
                            {total > 0 ? `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className="p-2 print:py-1 print:px-1.5 border-r border-zinc-300 text-zinc-600 text-[10px] print:text-[7.5px] italic leading-tight">
                            {item.remarks || ""}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Subtotal row for this Tool No */}
                    <tr className="bg-zinc-100/80 font-bold border-y-2 border-zinc-400 text-xs print:text-[8px] break-inside-avoid">
                      <td colSpan={7} className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right uppercase tracking-wider text-[10px] print:text-[7.5px] text-zinc-700">
                        {toolNo} Subtotal ({items.length} Items):
                      </td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">{groupQty}</td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-700">{groupApWtSum.toFixed(2)}</td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">{groupTotalWtSum.toFixed(2)}</td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300"></td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono font-semibold text-ink">₹{groupBasicSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono text-zinc-700">₹{groupGstSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="p-1.5 print:py-0.5 print:px-1 border-r border-zinc-300 text-right font-mono font-bold text-ink">₹{groupTotalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in Words & Totals Summary Grid */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-12 text-xs print:text-[8px] break-inside-avoid">
          {/* Left: Amount in Words & Delivery / Instructions (7 Cols) */}
          <div className="col-span-7 p-2.5 sm:p-3 print:py-1 print:px-2 border-r-2 border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="font-bold text-[9px] print:text-[7px] uppercase text-zinc-600">AMOUNT IN WORDS:</span>
              <p className="font-semibold text-ink text-[11px] print:text-[8px] italic mt-0.5 print:mt-0 leading-tight">
                {numberToWordsINR(grandTotalValue)}
              </p>
            </div>

            <div className="mt-1 pt-1 border-t border-border-gray">
              <span className="font-bold text-[9px] print:text-[6.5px] uppercase text-zinc-500">DELIVERY &amp; SUPPLY INSTRUCTIONS:</span>
              <p className="text-[10px] print:text-[7px] text-zinc-700 mt-0.5 leading-tight">
                Delivery required to Krupa Stores, Waluj Aurangabad. Mill Test Certificate (MTC) and Heat Numbers are strictly mandatory upon supply.
              </p>
            </div>
          </div>

          {/* Right: Totals Box (5 Cols) */}
          <div className="col-span-5 p-2 sm:p-2.5 print:py-1 print:px-2 space-y-1 print:space-y-0.5 bg-canvas/80">
            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL QUANTITY:</span>
              <span className="font-mono font-bold text-ink">{grandTotalQty} NOS</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">TOTAL ORDER WEIGHT:</span>
              <span className="font-mono font-bold text-ink">{grandTotalWt.toFixed(2)} KG</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">BASIC TAXABLE VALUE:</span>
              <span className="font-mono font-semibold text-ink">₹{grandBasicCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between border-b border-border-gray pb-0.5 print:pb-0 font-semibold text-xs print:text-[7.5px]">
              <span className="text-zinc-600">EST. GST TAX:</span>
              <span className="font-mono font-semibold text-zinc-800">₹{grandGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {/* Grand Total Value Highlight Box */}
            <div className="pt-1 border-t border-primary/20 flex justify-between items-center bg-primary/10 border border-primary/30 text-ink p-1.5 print:py-0.5 print:px-1.5 rounded-[6px] mt-1 print:mt-0.5">
              <span className="font-bold uppercase tracking-wider text-[10px] print:text-[7px] text-primary-dark">PURCHASE ORDER VALUE:</span>
              <span className="font-mono font-bold text-xs sm:text-sm print:text-[9px] text-primary">
                ₹{grandTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions for Purchase Order */}
        <div className="border-x-2 border-b-2 border-zinc-900 p-2 sm:p-2.5 print:py-1 print:px-2 bg-white break-inside-avoid">
          <div className="flex items-center justify-between pb-0.5 border-b border-border-gray mb-1 print:mb-0.5">
            <span className="font-bold text-[9px] print:text-[7px] uppercase tracking-wider text-zinc-700">
              TERMS &amp; CONDITIONS OF PURCHASE ({currentTerms.length}):
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
            <ol className="grid grid-cols-1 print:grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] print:text-[6.5px] text-zinc-700 leading-tight list-decimal list-inside">
              {currentTerms.map((t, i) => (
                <li key={i} className="leading-tight">{t}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* 3-Box Signature Block matching physical factory sheet */}
        <div className="border-x-2 border-b-2 border-zinc-900 grid grid-cols-3 text-center text-xs print:text-[7.5px] p-2 print:py-1 print:px-1 bg-white rounded-b-lg break-inside-avoid">
          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 pr-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                1. PREPARED BY (PURCHASE)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">Purchase Officer</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">SIGN &amp; DATE</span>
          </div>

          <div className="border-r border-border-gray flex flex-col justify-between h-14 sm:h-18 print:h-10 px-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                2. CHECKED BY (ACCOUNTS / QC)
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">Commercial Review</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">CHECKED BY</span>
          </div>

          <div className="flex flex-col justify-between h-14 sm:h-18 print:h-10 pl-1">
            <div>
              <span className="font-bold text-zinc-800 uppercase text-[8.5px] print:text-[6.5px] tracking-wider block">
                3. AUTHORIZED SIGNATORY
              </span>
              <span className="text-[10px] print:text-[7px] text-zinc-600 mt-0.5 block font-medium">FOR KRUPA TOOLS &amp; STAMPINGS</span>
            </div>
            <div className="h-6 sm:h-8 print:h-4"></div>
            <span className="text-[8px] print:text-[6px] text-zinc-500 uppercase tracking-tight">AUTHORIZED STAMP &amp; SIGN</span>
          </div>
        </div>

      </div>
    </div>
  );
}
