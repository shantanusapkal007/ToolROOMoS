"use client";

import React, { useState, useEffect } from "react";
import { 
  PackageCheck, 
  Plus, 
  Trash2, 
  Layers, 
  Building2, 
  User, 
  Hash, 
  Sparkles,
  AlertCircle,
  FileText,
  Boxes,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useMasterData } from "@/hooks/useMasterData";
import { api } from "@/lib/api";

interface MaterialIssueFormProps {
  projectId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function MaterialIssueForm({ projectId, onClose, onSuccess }: MaterialIssueFormProps) {
  const { success, error } = useToast();
  const { data: employees = [] } = useMasterData('employees');
  
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

        // Auto-add first item row if batches are available
        if (validBatches.length > 0 && items.length === 0) {
          const firstBatch = validBatches[0];
          setItems([
            { 
              id: Date.now().toString(), 
              inventoryBatchId: firstBatch.id, 
              issuedQty: Number(firstBatch.availableQty), 
              remarks: '' 
            }
          ]);
        }
      } catch (err: any) {
        error("Failed to load inventory", err.message || "Could not fetch inventory batches");
      } finally {
        setIsLoadingBatches(false);
      }
    };
    fetchBatches();
  }, [projectId, error]);

  const handleAddItem = () => {
    // Pick the next unselected batch if possible
    const unselectedBatch = availableBatches.find(
      b => !items.some(i => i.inventoryBatchId === b.id)
    );
    const initialBatchId = unselectedBatch ? unselectedBatch.id : (availableBatches[0]?.id || '');
    const initialBatch = availableBatches.find(b => b.id === initialBatchId);

    setItems(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        inventoryBatchId: initialBatchId, 
        issuedQty: initialBatch ? Number(initialBatch.availableQty) : ('' as any), 
        remarks: '' 
      }
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
          updatedItem.issuedQty = Number(batch.availableQty);
        }
      }
      return updatedItem;
    }));
  };

  // Calculations for summary pills
  const totalIssueQty = items.reduce((sum, item) => sum + (Number(item.issuedQty) || 0), 0);
  const totalEstimatedCost = items.reduce((sum, item) => {
    const batch = availableBatches.find(b => b.id === item.inventoryBatchId);
    const unitCost = Number(batch?.unitCost || 0);
    const qty = Number(item.issuedQty) || 0;
    return sum + (unitCost * qty);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(i => i.inventoryBatchId && Number(i.issuedQty) > 0);
    if (validItems.length === 0) {
      error("No Items", "Please add at least one valid material line with a quantity greater than 0.");
      return;
    }

    // Validate quantities against available stock
    for (const item of validItems) {
      const batch = availableBatches.find(b => b.id === item.inventoryBatchId);
      if (batch && Number(item.issuedQty) > Number(batch.availableQty)) {
        const matName = batch.material?.materialName || batch.material?.materialGrade || 'Selected material';
        error("Insufficient Stock", `You requested ${item.issuedQty} but only ${batch.availableQty} is available for ${matName}.`);
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
      success("Material Issue Created", `Successfully dispatched items to ${productionSection.replace(/_/g, ' ')}.`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      error("Failed to create issue", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBatches) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm font-medium text-cool-gray">Loading live project stock & inventory batches...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {availableBatches.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-[12px] bg-[rgba(245,158,11,0.06)] border border-semantic-warning/20">
          <div className="w-14 h-14 bg-semantic-warning/10 text-semantic-warning rounded-full flex items-center justify-center mx-auto mb-3 shadow-micro">
            <Boxes className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-ink">No Project Stock Available</h3>
          <p className="text-sm text-cool-gray mt-1.5 max-w-md mx-auto">
            There is currently no received inventory batch stock available for this project. Please generate and receive a Goods Receipt Note (GRN) first.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-4 py-2 bg-white border border-border-gray text-ink hover:bg-[rgba(148,151,169,0.08)] rounded-[10px] text-xs font-medium transition-colors shadow-micro"
            >
              Close Window
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Header Card: Requisition Details */}
          <div className="rounded-[12px] border border-border-gray bg-[rgba(148,151,169,0.03)] p-4.5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Requisition Parameters
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-subtle text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                Project: {projectId}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Issue Number */}
              <div>
                <label className="block text-[11px] font-medium text-cool-gray mb-1.5">
                  Issue Slip #
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-silver-blue text-xs font-mono">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    value={issueNumber}
                    onChange={e => setIssueNumber(e.target.value)}
                    className="w-full bg-white border border-border-gray rounded-[10px] pl-7 pr-3 py-2 text-xs font-mono font-medium text-ink placeholder:text-silver-blue focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro"
                  />
                </div>
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-[11px] font-medium text-cool-gray mb-1.5">
                  Target Production Section
                </label>
                <div className="relative">
                  <select
                    value={productionSection}
                    onChange={e => setProductionSection(e.target.value)}
                    className="w-full bg-white border border-border-gray rounded-[10px] px-3 py-2 text-xs font-medium text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                  >
                    <option value="MACHINE_SHOP">Machine Shop</option>
                    <option value="TOOL_ROOM_FITTING">Toolroom Fitting & Assembly</option>
                    <option value="PRESS_SHOP">Press Shop & Tryout</option>
                    <option value="FABRICATION_INDIAN">Fabrication (Domestic / India)</option>
                    <option value="FABRICATION_EXPORT">Fabrication (Foreign / Export)</option>
                  </select>
                </div>
              </div>

              {/* Issued To / Operator */}
              <div>
                <label className="block text-[11px] font-medium text-cool-gray mb-1.5">
                  Assigned / Issued To
                </label>
                <select
                  value={issuedTo}
                  onChange={e => setIssuedTo(e.target.value)}
                  className="w-full bg-white border border-border-gray rounded-[10px] px-3 py-2 text-xs font-medium text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                >
                  <option value="">Select Operator / Fitter...</option>
                  {employees?.map((emp: any) => {
                    const displayName = emp.name || emp.employeeName || emp.code;
                    const deptStr = typeof emp.department === 'object' ? emp.department?.departmentName || '' : (emp.department || '');
                    const subtitle = emp.designation || deptStr;
                    return (
                      <option key={emp.id} value={displayName}>
                        {displayName} {subtitle ? `(${subtitle})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Expected Output Qty */}
              <div>
                <label className="block text-[11px] font-medium text-cool-gray mb-1.5">
                  Expected Output Qty (pcs)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={expectedManufactureQty}
                    onChange={e => setExpectedManufactureQty(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 100"
                    className="w-full bg-white border border-border-gray rounded-[10px] px-3 py-2 text-xs font-mono text-ink placeholder:text-silver-blue focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-silver-blue text-[11px]">
                    pcs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Material Batches to Issue
                </span>
                <span className="text-[11px] font-medium text-cool-gray bg-[rgba(148,151,169,0.12)] px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? 'batch' : 'batches'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-subtle hover:bg-primary/15 text-primary text-xs font-semibold rounded-[8px] transition-all cursor-pointer shadow-micro"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material Line
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border-gray rounded-[12px] bg-[rgba(148,151,169,0.02)]">
                <div className="w-10 h-10 bg-primary-subtle text-primary rounded-full flex items-center justify-center mx-auto mb-2.5">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-cool-gray mb-3">No material lines added to this requisition slip yet.</p>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-border-gray rounded-[10px] text-xs font-semibold text-ink shadow-micro hover:bg-[rgba(148,151,169,0.08)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-primary" /> Add First Material Line
                </button>
              </div>
            ) : (
              <div className="border border-border-gray rounded-[12px] overflow-hidden bg-white shadow-micro">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-[rgba(148,151,169,0.06)] text-cool-gray font-semibold text-[11px] uppercase tracking-wider border-b border-border-gray">
                      <tr>
                        <th className="px-4 py-3 min-w-[280px]">Material & Batch (Available Stock)</th>
                        <th className="px-3 py-3 w-[120px]">Issue Qty</th>
                        <th className="px-3 py-3 w-[120px] text-right">Est. Cost</th>
                        <th className="px-3 py-3 min-w-[160px]">Remarks / Notes</th>
                        <th className="px-3 py-3 w-[50px] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-gray/60">
                      {items.map((item, idx) => {
                        const selectedBatch = availableBatches.find(b => b.id === item.inventoryBatchId);
                        const unitCost = Number(selectedBatch?.unitCost || 0);
                        const lineCost = unitCost * (Number(item.issuedQty) || 0);
                        
                        return (
                          <tr key={item.id} className="hover:bg-[rgba(148,151,169,0.02)] transition-colors">
                            {/* Material & Batch Selector */}
                            <td className="px-4 py-3 align-top">
                              <select
                                value={item.inventoryBatchId}
                                onChange={e => updateItem(item.id, 'inventoryBatchId', e.target.value)}
                                className="w-full bg-white border border-border-gray rounded-[8px] px-3 py-2 text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                              >
                                <option value="" disabled>-- Select Material Batch --</option>
                                {availableBatches.map(b => {
                                  const partName = b.grnItem?.remarks || b.grnItem?.poItem?.remarks || '';
                                  const matName = b.material?.materialName || b.material?.materialGrade || 'Raw Material';
                                  const label = partName ? `${partName} (${matName})` : matName;
                                  return (
                                    <option key={b.id} value={b.id}>
                                      {label} — {b.availableQty} avail ({b.batchNumber})
                                    </option>
                                  );
                                })}
                              </select>

                              {selectedBatch && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-cool-gray">
                                  <span className="inline-flex items-center gap-1 bg-[rgba(148,151,169,0.08)] px-2 py-0.5 rounded-[6px] font-mono text-[10px]">
                                    Batch: {selectedBatch.batchNumber}
                                  </span>
                                  <span className="inline-flex items-center gap-1 bg-[rgba(148,151,169,0.08)] px-2 py-0.5 rounded-[6px] font-mono text-[10px]">
                                    Rate: ₹{unitCost.toLocaleString('en-IN')}/unit
                                  </span>
                                  <span className="inline-flex items-center gap-1 bg-semantic-success-subtle text-semantic-success-dark px-2 py-0.5 rounded-[6px] font-medium text-[10px]">
                                    Max: {selectedBatch.availableQty} available
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Issue Qty */}
                            <td className="px-3 py-3 align-top">
                              <input
                                type="number"
                                min="0"
                                max={selectedBatch ? selectedBatch.availableQty : undefined}
                                step="any"
                                value={item.issuedQty}
                                onChange={e => updateItem(item.id, 'issuedQty', e.target.value)}
                                placeholder="Qty"
                                className="w-full bg-white border border-border-gray rounded-[8px] px-3 py-2 text-xs font-mono font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro text-center"
                              />
                            </td>

                            {/* Estimated Cost */}
                            <td className="px-3 py-3 align-top text-right font-mono text-xs font-semibold text-ink pt-4">
                              ₹{lineCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>

                            {/* Remarks */}
                            <td className="px-3 py-3 align-top">
                              <input
                                type="text"
                                value={item.remarks}
                                onChange={e => updateItem(item.id, 'remarks', e.target.value)}
                                placeholder="Cutting instructions / notes..."
                                className="w-full bg-white border border-border-gray rounded-[8px] px-3 py-2 text-xs text-ink placeholder:text-silver-blue focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro"
                              />
                            </td>

                            {/* Action / Delete */}
                            <td className="px-3 py-3 align-top text-center pt-3.5">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-silver-blue hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded-[6px] transition-colors cursor-pointer"
                                title="Remove Line"
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
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="pt-2 border-t border-border-gray flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Live Metrics Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-[rgba(148,151,169,0.08)] border border-border-gray text-cool-gray px-3 py-1.5 rounded-[8px] font-medium">
                Total Qty: <strong className="text-ink font-mono">{totalIssueQty}</strong>
              </span>
              <span className="bg-primary-subtle border border-primary/20 text-primary px-3 py-1.5 rounded-[8px] font-medium">
                Total Value: <strong className="font-mono">₹{totalEstimatedCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-border-gray text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] rounded-[10px] text-xs font-semibold transition-all shadow-micro cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover active:bg-primary-deep text-white text-xs font-semibold rounded-[10px] shadow-subtle flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Issue...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Issue Material</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

    </form>
  );
}
