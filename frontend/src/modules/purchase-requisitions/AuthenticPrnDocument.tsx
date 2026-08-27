"use client";

import React from 'react';
import { Download, Printer, ArrowLeft, CheckCircle2, Building, Layers, Calendar, User, ShieldCheck } from 'lucide-react';
import { exportPrnToExcel } from './prnExcelExporter';
import { PurchaseRequisition } from '@/services/purchase-requisitions.service';
import { Button } from '@/components/ui/Button';

interface AuthenticPrnDocumentProps {
  prn: PurchaseRequisition;
  onBack?: () => void;
}

export function AuthenticPrnDocument({ prn, onBack }: AuthenticPrnDocumentProps) {
  const handlePrint = () => {
    window.print();
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
    <div className="space-y-6">
      {/* Control Bar (hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle hide-on-print">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
              Back to List
            </Button>
          )}
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <span>{prn.prNumber}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                prn.status === 'APPROVED' ? 'bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30' :
                prn.status === 'REJECTED' ? 'bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/30' :
                prn.status === 'PO_CREATED' ? 'bg-primary-subtle text-primary border border-primary/30' :
                'bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/30'
              }`}>
                {prn.status}
              </span>
            </h2>
            <p className="text-xs text-mute">Official Purchase Requisition Note Voucher</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print PRN Voucher
          </Button>
        </div>
      </div>

      {/* Printable Authentic PRN Document */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-[12px] shadow-sm p-8 max-w-5xl mx-auto font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        
        {/* Company Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-lg">K</div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">KRUPA TOOLS &amp; STAMPING LTD.</h1>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">High-Precision Press Tools, Dies &amp; Automotive Tooling</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 max-w-md mt-1">
              Plot No. A-45, Phase II, MIDC Chakan Industrial Area, Pune - 410501 | GSTIN: 27AABCK1234F1Z8
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-900 text-white px-3 py-1 text-xs font-black tracking-wider uppercase rounded-sm mb-1">
              PURCHASE REQUISITION NOTE
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">{prn.prNumber}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Date: {prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-[8px] mb-6 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Project / Tool No:</span>
            <span className="font-semibold text-slate-900 font-mono text-sm">
              {prn.project?.projectNumber || 'GENERAL / CRIB'}
            </span>
            <span className="text-[11px] text-slate-600 block truncate">
              {prn.project?.partName || prn.project?.customer?.companyName || 'General Stores Replenishment'}
            </span>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Originating Dept:</span>
            <span className="font-semibold text-slate-900 text-sm">{prn.department || 'Stores / Tool Crib'}</span>
            <span className="text-[11px] text-slate-600 block">Category: {prn.category}</span>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Requested By:</span>
            <span className="font-semibold text-slate-900 text-sm">{prn.requestedBy || 'Supervisor'}</span>
            <span className="text-[11px] text-slate-600 block font-mono">
              Req Date: {prn.requiredDate ? new Date(prn.requiredDate).toLocaleDateString('en-GB') : 'Immediate'}
            </span>
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">Priority &amp; Status:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                prn.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                prn.priority === 'URGENT' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-200 text-slate-700'
              }`}>
                {prn.priority}
              </span>
              <span className="font-semibold text-slate-900 font-mono text-xs">{prn.status}</span>
            </div>
          </div>
        </div>

        {prn.purpose && (
          <div className="mb-5 p-3 bg-amber-50/50 border border-amber-200/60 rounded-[8px] text-xs">
            <span className="font-bold text-amber-900 mr-2">Purpose / Justification:</span>
            <span className="text-amber-800">{prn.purpose}</span>
          </div>
        )}

        {/* Itemized Specification Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 border border-slate-900 text-center w-10">Sr.</th>
                <th className="py-2.5 px-3 border border-slate-900 text-center w-16">Det #</th>
                <th className="py-2.5 px-3 border border-slate-900">Item / Part Description</th>
                <th className="py-2.5 px-3 border border-slate-900 text-center">Grade / Spec</th>
                <th className="py-2.5 px-3 border border-slate-900 text-center">Dimensions (L×W×H)</th>
                <th className="py-2.5 px-3 border border-slate-900 text-right w-16">Qty</th>
                <th className="py-2.5 px-3 border border-slate-900 text-center w-14">UOM</th>
                <th className="py-2.5 px-3 border border-slate-900 text-right w-24">Est. Rate</th>
                <th className="py-2.5 px-3 border border-slate-900 text-right w-28">Est. Total</th>
                <th className="py-2.5 px-3 border border-slate-900">Remarks / Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prn.items?.map((item, index) => {
                const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
                return (
                  <tr key={item.id || index} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono font-bold text-slate-700">{item.detNo || '-'}</td>
                    <td className="py-2 px-3 border border-slate-300 font-semibold text-slate-900">
                      {item.itemName || item.material?.materialGrade || 'Material Component'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono text-slate-700">
                      {item.materialGrade || item.material?.materialGrade || '-'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono text-slate-700">
                      {item.dimensions || item.rawSize || '-'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono font-bold text-slate-900">
                      {Number(item.requiredQuantity)}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center text-slate-600 font-mono">
                      {item.uom || 'PCS'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono text-slate-700">
                      ₹{Number(item.estimatedRate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono font-bold text-slate-900">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-[11px] text-slate-600">
                      {item.suggestedVendor ? (
                        <span className="font-medium text-slate-800">Rec: {item.suggestedVendor}</span>
                      ) : null}
                      {item.remarks ? <span className="block text-slate-500">{item.remarks}</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                <td colSpan={5} className="py-2.5 px-3 border border-slate-300 text-right uppercase tracking-wider text-slate-700">
                  Total Items: {prn.items?.length || 0} (Total Qty: {totalQuantity})
                </td>
                <td className="py-2.5 px-3 border border-slate-300 text-right font-mono text-slate-900 font-bold">
                  {totalQuantity}
                </td>
                <td colSpan={2} className="py-2.5 px-3 border border-slate-300 text-right uppercase tracking-wider text-slate-700">
                  Total Estimated Value:
                </td>
                <td className="py-2.5 px-3 border border-slate-300 text-right font-mono font-black text-slate-900 text-sm">
                  ₹{totalEstimated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 border border-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Linked Purchase Orders (if already converted) */}
        {prn.purchaseOrders && prn.purchaseOrders.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50/60 border border-blue-200 rounded-[8px] text-xs">
            <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              Generated Purchase Orders (POs)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prn.purchaseOrders.map((po) => (
                <div key={po.id} className="bg-white p-2.5 rounded border border-blue-200 flex items-center justify-between font-mono">
                  <div>
                    <span className="font-bold text-blue-900">{po.poNumber}</span>
                    <span className="text-[11px] text-slate-500 block">{po.vendor?.vendorName || 'Supplier'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">₹{Number(po.totalAmount || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-sans block mt-0.5">{po.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign-off & Signatures Block */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs">
          <div className="space-y-12">
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px]">1. Requested / Prepared By</span>
              <span className="font-semibold text-slate-900 text-sm mt-1 block">{prn.requestedBy || 'Storekeeper'}</span>
              <span className="text-[10px] text-slate-500 block">{prn.department}</span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Signature &amp; Date
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px]">2. Verified &amp; Approved By</span>
              <span className="font-semibold text-slate-900 text-sm mt-1 block">
                {prn.approvedBy || (prn.status === 'APPROVED' ? 'Plant Manager' : 'Pending Review')}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {prn.approvedAt ? `Approved on: ${new Date(prn.approvedAt).toLocaleDateString('en-GB')}` : 'Approval Status: ' + prn.approvalStatus}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Department Head / Plant Manager
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px]">3. Purchase Department Action</span>
              <span className="font-semibold text-slate-900 text-sm mt-1 block">
                {prn.purchaseOrders && prn.purchaseOrders.length > 0 ? 'PO Issued' : 'Pending Procurement'}
              </span>
              <span className="text-[10px] text-slate-500 block">Commercial Review &amp; Ordering</span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
              Purchase Officer Sign &amp; PO Stamp
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
