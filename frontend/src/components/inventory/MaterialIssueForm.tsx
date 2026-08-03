"use client";

import React, { useState, useEffect } from "react";
import { PackageCheck, Plus, Trash2, LayoutGrid, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

interface MaterialIssueFormProps {
  projectId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function MaterialIssueForm({ projectId, onClose, onSuccess }: MaterialIssueFormProps) {
  const { success, error } = useToast();
  
  const [issueNumber, setIssueNumber] = useState(`ISSUE-${Date.now().toString().slice(-6)}`);
  const [productionSection, setProductionSection] = useState("MACHINE_SHOP");
  const [issuedTo, setIssuedTo] = useState("");
  const [expectedManufactureQty, setExpectedManufactureQty] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/inventory-batches`);
        
        const extractBatches = (dataRes: any) => {
          if (Array.isArray(dataRes)) return dataRes;
          if (dataRes && Array.isArray(dataRes.data)) return dataRes.data;
          if (dataRes && dataRes.data && Array.isArray(dataRes.data.data)) return dataRes.data.data;
          return [];
        };

        const rawBatches = extractBatches(res);
        const validBatches = rawBatches.filter((b: any) => Number(b.availableQty) > 0);
        setAvailableBatches(validBatches);
      } catch (err: any) {
        error("Failed to load inventory", err.message || "Could not fetch inventory batches");
      } finally {
        setIsLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [projectId, error]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), inventoryBatchId: '', issuedQty: '' as any, remarks: '' }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      if (field === 'inventoryBatchId' && value) {
        const batch = availableBatches.find(b => b.id === value);
        if (batch) {
          // Default issue qty to available amount
          updatedItem.issuedQty = Number(batch.availableQty);
        }
      }
      return updatedItem;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(i => i.inventoryBatchId && Number(i.issuedQty) > 0);
    if (validItems.length === 0) {
      error("No Items", "Please add at least one valid material to issue.");
      return;
    }

    // Validate quantities against available stock
    for (const item of validItems) {
      const batch = availableBatches.find(b => b.id === item.inventoryBatchId);
      if (batch && Number(item.issuedQty) > Number(batch.availableQty)) {
        error("Insufficient Stock", `You requested ${item.issuedQty} but only ${batch.availableQty} is available for ${batch.material?.materialName}.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const fullRemarks = [
        issuedTo ? `Issued To: ${issuedTo}` : null,
        remarks || null
      ].filter(Boolean).join(" | ");

      const payload: any = {
        issueNumber,
        productionSection,
        remarks: fullRemarks || undefined,
        expectedManufactureQty: expectedManufactureQty !== "" ? Number(expectedManufactureQty) : undefined,
        items: validItems.map(i => ({
          inventoryBatchId: i.inventoryBatchId,
          issuedQty: Number(i.issuedQty),
          remarks: i.remarks
        }))
      };

      await api.post(`/projects/${projectId}/material-issues`, payload);
      success("Material Issue Created", `Successfully dispatched items to ${productionSection}.`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error("Failed to create issue", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBatches) {
    return <div className="p-8 text-center text-sm text-zinc-500">Loading live inventory stock...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      
      <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            Request Material Issue
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Dispatch raw materials from Stores to the Shop Floor.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {availableBatches.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-amber-50 border border-amber-100">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PackageCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-amber-900">No Inventory Available</h3>
            <p className="text-sm text-amber-700 mt-2 max-w-sm mx-auto">
              There is currently no received inventory stock available for this project. Please complete a GRN (Goods Receipt Note) first.
            </p>
          </div>
        ) : (
          <form id="issue-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Issue Number</label>
                <input
                  type="text"
                  required
                  value={issueNumber}
                  onChange={e => setIssueNumber(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Target Section</label>
                <select
                  value={productionSection}
                  onChange={e => setProductionSection(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                >
                  <option value="MACHINE_SHOP">Machine Shop (CNC / VMC / EDM)</option>
                  <option value="TOOL_ROOM_FITTING">Toolroom Fitting & Assembly</option>
                  <option value="PRESS_SHOP">Press Shop & Tryout</option>
                  <option value="FABRICATION_INDIAN">Fabrication (Domestic)</option>
                  <option value="FABRICATION_EXPORT">Fabrication (Export)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Assigned / Issued To</label>
                <input
                  type="text"
                  value={issuedTo}
                  onChange={e => setIssuedTo(e.target.value)}
                  placeholder="Operator / Fitter name"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${productionSection === 'PRESS_SHOP' ? 'text-amber-700 font-extrabold' : 'text-zinc-500'}`}>
                  {productionSection === 'PRESS_SHOP' ? 'Expected Press Output Qty (pcs) *' : 'Expected Output Qty (pcs)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={expectedManufactureQty}
                  onChange={e => setExpectedManufactureQty(e.target.value ? Number(e.target.value) : "")}
                  placeholder={productionSection === 'PRESS_SHOP' ? 'e.g. 5000 pcs' : 'e.g. 100 pcs'}
                  className={`w-full rounded-lg px-3 py-2 text-sm text-zinc-900 focus:ring-1 ${
                    productionSection === 'PRESS_SHOP'
                      ? 'bg-amber-50 border border-amber-300 font-bold focus:border-amber-600 focus:ring-amber-600'
                      : 'bg-white border border-zinc-300 focus:border-amber-500 focus:ring-amber-500 font-mono'
                  }`}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  Select Material Batches
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Material
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                  <p className="text-xs text-zinc-500 font-medium mb-3">No materials added to this issue slip yet.</p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                  >
                    <Plus className="w-4 h-4" /> Add Material Line
                  </button>
                </div>
              ) : (
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-zinc-100/50 text-zinc-500 font-bold text-[10px] uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3 w-7/12">Inventory Batch (Available)</th>
                        <th className="px-4 py-3 w-2/12">Issue Qty</th>
                        <th className="px-4 py-3 w-2/12">Remarks</th>
                        <th className="px-4 py-3 w-1/12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {items.map((item, idx) => {
                        const selectedBatch = availableBatches.find(b => b.id === item.inventoryBatchId);
                        
                        return (
                          <tr key={item.id} className="bg-white">
                            <td className="px-4 py-2.5">
                              <select
                                value={item.inventoryBatchId}
                                onChange={e => updateItem(item.id, 'inventoryBatchId', e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-amber-500 focus:bg-white"
                              >
                                <option value="" disabled>-- Select Material Batch --</option>
                                {availableBatches.map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.material?.materialName || b.material?.materialGrade || 'Raw Material'} (Heat: {b.heatNumber || 'N/A'}) - {b.availableQty} available
                                  </option>
                                ))}
                              </select>
                              {selectedBatch && (
                                <div className="mt-1 text-[10px] text-zinc-500 px-1 font-mono">
                                  Batch: {selectedBatch.batchNumber} | Cost: ₹{Number(selectedBatch.unitCost || 0).toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                min="0"
                                max={selectedBatch ? selectedBatch.availableQty : undefined}
                                step="any"
                                value={item.issuedQty}
                                onChange={e => updateItem(item.id, 'issuedQty', e.target.value)}
                                placeholder="Qty"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-zinc-900 focus:border-amber-500 focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={e => updateItem(item.id, 'remarks', e.target.value)}
                                placeholder="Notes..."
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-2 text-xs text-zinc-700 focus:border-amber-500 focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </form>
        )}
      </div>

      <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-white border border-zinc-300 text-zinc-700 font-semibold text-sm rounded-xl hover:bg-zinc-50 transition-colors shadow-2xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="issue-form"
          disabled={isSubmitting || items.length === 0}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <span className="flex items-center gap-2">Processing...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Approve & Issue Material
            </>
          )}
        </button>
      </div>

    </div>
  );
}
