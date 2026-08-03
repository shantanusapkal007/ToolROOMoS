"use client";

import React, { useState } from "react";
import { PackageCheck, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ProcurementService } from "@/services/procurement.service";
import { api } from "@/lib/api";

interface ReceiveGrnModalProps {
  projectId: string;
  po: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReceiveGrnModal({ projectId, po, onClose, onSuccess }: ReceiveGrnModalProps) {
  const { success, error } = useToast();
  
  const [grnNumber, setGrnNumber] = useState(`GRN-${Date.now().toString().slice(-6)}`);
  const [supplierChallan, setSupplierChallan] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form state for each item in the PO
  const [items, setItems] = useState(() => {
    return (po.items || []).map((item: any) => {
      const custom = item.customFields || {};
      const remainingQty = Number(item.orderedQty || 0) - Number(item.receivedQty || 0);
      return {
        poItemId: item.id,
        orderedQty: Number(item.orderedQty || 0),
        remainingQty,
        acceptedQty: remainingQty > 0 ? remainingQty : 0, // default to receiving the remaining amount
        rejectedQty: 0,
        heatNumber: "HEAT-" + Math.floor(1000 + Math.random() * 9000), // Mock standard heat number
        actualRate: Number(item.agreedRate || 0),
        toolNo: custom.toolNo || "TOOL",
        detNo: custom.detNo || "",
        length: custom.length || "",
        width: custom.width || "",
        height: custom.height || "",
        apWeight: Number(custom.apWt || 0),
        totalWeight: Number(custom.totalWt || 0),
        basicCost: Number(item.basicValue || 0),
        gst: Number(custom.gstAmount || 0),
        total: Number(item.lineTotal || 0),
        remarks: item.remarks || "",
        partName: custom.materialGrade || item.material?.materialGrade || "Material"
      };
    });
  });

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev: any[]) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out items that are not being received
    const itemsToReceive = items.filter((i: any) => i.acceptedQty > 0 || i.rejectedQty > 0);
    
    if (itemsToReceive.length === 0) {
      error("No Items", "Please specify a received quantity greater than 0 for at least one item.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        poHeaderId: po.id,
        grnNumber,
        supplierChallan,
        remarks,
        items: itemsToReceive.map((i: any) => ({
          poItemId: i.poItemId,
          receivedQty: i.acceptedQty + i.rejectedQty,
          acceptedQty: i.acceptedQty,
          rejectedQty: i.rejectedQty,
          heatNumber: i.heatNumber,
          actualRate: i.actualRate,
          toolNo: i.toolNo,
          detNo: i.detNo,
          length: i.length,
          width: i.width,
          height: i.height,
          apWeight: i.apWeight,
          totalWeight: i.totalWeight,
          basicCost: i.basicCost,
          gst: i.gst,
          total: i.total,
          remarks: i.remarks
        }))
      };

      await api.post(`/projects/${projectId}/goods-receipts`, payload);
      
      success("GRN Created Successfully", `Received material under ${grnNumber} and updated live inventory stock.`);
      onSuccess();
    } catch (err: any) {
      error("Failed to Create GRN", err.message || "An error occurred during GRN creation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allFulfilled = items.every((i: any) => i.remainingQty <= 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              Goods Receipt Note (GRN)
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Receiving against PO: <span className="font-mono font-bold text-zinc-700">{po.poNumber}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {allFulfilled ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <PackageCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">PO Fully Received</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-md">
                All items in this Purchase Order have already been fully received into inventory. No further GRN can be created.
              </p>
            </div>
          ) : (
            <form id="grn-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">GRN Number *</label>
                  <input
                    type="text"
                    required
                    value={grnNumber}
                    onChange={(e) => setGrnNumber(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Supplier Challan No.</label>
                  <input
                    type="text"
                    value={supplierChallan}
                    onChange={(e) => setSupplierChallan(e.target.value)}
                    placeholder="e.g. CH-2024"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Condition notes..."
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-sm font-bold text-zinc-900 mb-3">Line Items Pending Receipt</h3>
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-3 py-2.5">Material</th>
                        <th className="px-3 py-2.5 text-center">Pending Qty</th>
                        <th className="px-3 py-2.5">Receive Qty</th>
                        <th className="px-3 py-2.5">Heat Number *</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {items.map((item: any, idx: number) => {
                        if (item.remainingQty <= 0) return null; // Skip fulfilled items
                        
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50">
                            <td className="px-3 py-3">
                              <div className="font-semibold text-zinc-900">{item.partName}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.length}×{item.width}×{item.height}</div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                {item.remainingQty}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max={item.remainingQty}
                                step="any"
                                value={item.acceptedQty}
                                onChange={(e) => updateItem(idx, 'acceptedQty', Number(e.target.value))}
                                className="w-24 bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-sm font-bold text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="text"
                                required
                                value={item.heatNumber}
                                onChange={(e) => updateItem(idx, 'heatNumber', e.target.value)}
                                placeholder="Mill Test Cert No."
                                className="w-32 bg-white border border-zinc-300 rounded-lg px-2 py-1.5 text-sm font-mono text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 font-semibold text-sm rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          {!allFulfilled && (
            <button
              type="submit"
              form="grn-form"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  Approve & Create GRN
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
