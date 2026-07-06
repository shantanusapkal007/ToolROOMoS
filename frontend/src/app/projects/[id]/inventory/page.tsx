"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Package, Factory, Activity, Plus, PackageMinus, X, Info, Calendar } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useInventoryBatches } from "../../../../hooks/useInventory";
import { useIssueMaterial } from "../../../../hooks/useProduction";

export default function InventoryTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const { data: availableBatches } = useInventoryBatches(resolvedParams.id);
  const issueMaterialMutation = useIssueMaterial(resolvedParams.id);
  
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [viewingTxDetails, setViewingTxDetails] = useState<any>(null);
  const [issueNum, setIssueNum] = useState("");
  const [issueItems, setIssueItems] = useState([{ inventoryBatchId: "", issuedQty: 1, remarks: "" }]);

  const loadAvailableBatches = async () => {
    if (!project) return;
    setIssueNum(`ISS-${Date.now().toString().slice(-6)}`);
    setIssueItems([{ inventoryBatchId: "", issuedQty: 1, remarks: "" }]);
    setShowIssueModal(true);
  };

  if (projectLoading || !project) return null;

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (issueItems.some(i => !i.inventoryBatchId || i.issuedQty <= 0)) {
      return error("Validation Error", "Please select a batch and enter a valid quantity.");
    }

    try {
      await issueMaterialMutation.mutateAsync({
        issueNumber: issueNum,
        items: issueItems
      });
      setShowIssueModal(false);
    } catch (err: any) { 
      // Handled by hook
    }
  };

  const addIssueItemRow = () => {
    setIssueItems([...issueItems, { inventoryBatchId: "", issuedQty: 1, remarks: "" }]);
  };

  const removeIssueItemRow = (index: number) => {
    const newItems = [...issueItems];
    newItems.splice(index, 1);
    setIssueItems(newItems);
  };

  const updateIssueItem = (index: number, field: string, value: any) => {
    const newItems = [...issueItems] as any[];
    newItems[index][field] = value;
    setIssueItems(newItems);
  };



  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 mr-3 text-purple-400">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Inventory & Material Control</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Material Issues & Ledger</p>
          </div>
        </div>
        <button onClick={loadAvailableBatches} className="group relative px-4 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
          <span className="relative z-10 flex items-center text-purple-400 font-bold text-xs">
            Issue Material
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 shrink-0">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl -mr-5 -mt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Goods Receipts (GRN)</h3>
          <p className="text-xl font-black text-emerald-400 font-mono">{project.goodsReceiptHeaders?.length || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total inbound material shipments</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl -mr-5 -mt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">Material Issues</h3>
          <p className="text-xl font-black text-purple-400 font-mono">{project.materialIssueHeaders?.length || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Total shop-floor consumptions</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 shrink-0 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-purple-400" />
          Live Inventory Ledger
        </h3>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 pb-12 pr-2">
          {(project.inventoryTransactions && project.inventoryTransactions.length > 0) ? (
            project.inventoryTransactions.map((tx: any, idx: number) => (
              <div 
                key={tx.id} 
                className="bg-white/[0.01] p-3 rounded-xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden"
                style={{ animation: `slideUp 0.3s ease-out ${idx * 0.05}s forwards`, opacity: 0 }}
              >
                {/* Background glow on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${tx.movementType === 'GRN_RECEIPT' ? 'bg-emerald-500' : 'bg-purple-500'}`} />

                {/* Left: Type & Date */}
                <div className="flex items-center w-[25%] relative z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-inner ${
                    tx.movementType === 'GRN_RECEIPT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {tx.movementType === 'GRN_RECEIPT' ? <Plus className="w-5 h-5" /> : <PackageMinus className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="block text-sm font-black text-white tracking-wide">{tx.movementType.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Middle: Material & Batch */}
                <div className="flex-1 px-4 relative z-10">
                  <p className="text-white font-bold text-base">{tx.inventoryBatch?.material?.materialName || tx.inventoryBatch?.material?.materialCode}</p>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <span className="text-[10px] uppercase font-black tracking-widest bg-white/10 px-2 py-1 rounded border border-white/5 text-amber-400 shadow-inner">
                      BATCH: {tx.inventoryBatch?.batchNumber}
                    </span>
                    {tx.inventoryBatch?.heatNumber && (
                      <span className="text-[10px] uppercase font-black tracking-widest bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 text-blue-400 shadow-inner">
                        HEAT: {tx.inventoryBatch.heatNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Quantity & Ref */}
                <div className="flex items-center justify-end w-[40%] relative z-10 text-right space-x-6">
                  <div>
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1 text-center">Ref Doc</span>
                    <span className="text-xs font-mono text-slate-300 bg-black/40 px-2 py-1 rounded border border-white/5">{tx.referenceDocType}</span>
                  </div>
                  
                  <div className="min-w-[80px]">
                    <span className={`block text-xl font-black tabular-nums tracking-tight ${tx.movementType === 'GRN_RECEIPT' ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]'}`}>
                      {tx.movementType === 'GRN_RECEIPT' ? '+' : '-'}{Number(tx.quantity).toFixed(2)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mt-0.5 block">Quantity</span>
                  </div>

                  <div>
                    <button
                      onClick={() => setViewingTxDetails(tx)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-white/5 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-4 shadow-inner">
                <Activity className="h-10 w-10 text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">No Transactions Yet</h4>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">Issue material to the floor or receive new goods to see the live ledger populate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Material Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-4xl p-6 animate-slide-up border border-purple-500/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-xl font-bold text-white mb-2 relative z-10 shrink-0">Issue Material to Shop Floor</h3>
            <p className="text-sm text-slate-400 mb-6">Select available inventory batches and specify issue quantities based on BOM requirements.</p>
            
            <form onSubmit={handleIssueMaterial} className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4 shrink-0 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Slip Number</label>
                  <input
                    type="text"
                    value={issueNum}
                    onChange={(e) => setIssueNum(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Batch (Material)</div>
                  <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</div>
                  <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks</div>
                  <div className="col-span-1"></div>
                </div>
                
                {issueItems.map((item, index) => {
                  const batches = availableBatches || [];
                  const selectedBatch = batches.find((b: any) => b.id === item.inventoryBatchId);
                  const availableQty = selectedBatch ? Number(selectedBatch.availableQty) : 0;
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6">
                        <select
                          required
                          className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 transition-colors"
                          value={item.inventoryBatchId}
                          onChange={(e) => updateIssueItem(index, 'inventoryBatchId', e.target.value)}
                        >
                          <option value="">Select Traceable Batch...</option>
                          {batches.map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.material?.materialCode} ({b.material?.materialGrade}) | {b.batchNumber} | Heat: {b.heatNumber} (Avail: {b.availableQty})
                            </option>
                          ))}
                        </select>
                        {selectedBatch && (
                          <div className="text-xs text-emerald-400 mt-1 font-mono">
                            Available to Issue: {availableQty} units
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          max={availableQty || undefined}
                          step="0.01"
                          required
                          className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 transition-colors"
                          value={item.issuedQty}
                          onChange={(e) => updateIssueItem(index, 'issuedQty', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="e.g. for Operation 10"
                          className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 transition-colors"
                          value={item.remarks}
                          onChange={(e) => updateIssueItem(index, 'remarks', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          type="button" 
                          onClick={() => removeIssueItemRow(index)}
                          className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                          disabled={issueItems.length === 1}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  type="button" 
                  onClick={addIssueItemRow}
                  className="w-full py-3 mt-4 border-2 border-dashed border-purple-500/30 text-purple-400 rounded-lg font-bold text-sm hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                >
                  + Add Material
                </button>
              </div>

              <div className="flex space-x-3 pt-4 shrink-0 border-t border-white/10 mt-4">
                <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 font-bold text-sm text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">Approve Issue Slip</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Transaction Details Modal */}
      {viewingTxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-purple-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  viewingTxDetails.movementType === 'GRN_RECEIPT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {viewingTxDetails.movementType === 'GRN_RECEIPT' ? <Plus className="w-4 h-4" /> : <PackageMinus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{viewingTxDetails.movementType.replace('_', ' ')}</h3>
                  <p className="text-[10px] text-slate-400">Inventory Ledger Audit Entry</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingTxDetails(null)} 
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Material Item:</span>
                  <span className="text-white font-bold">{viewingTxDetails.inventoryBatch?.material?.materialName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material Code:</span>
                  <span className="text-slate-300 font-mono">{viewingTxDetails.inventoryBatch?.material?.materialCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity Transacted:</span>
                  <span className={`font-bold font-mono ${viewingTxDetails.movementType === 'GRN_RECEIPT' ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {viewingTxDetails.movementType === 'GRN_RECEIPT' ? '+' : '-'}{Number(viewingTxDetails.quantity).toFixed(2)} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Warehouse:</span>
                  <span className="text-slate-300">{viewingTxDetails.inventoryBatch?.warehouse?.warehouseName || 'Main Raw Material Stores'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Traceability Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Number:</span>
                  <span className="text-amber-400 font-bold font-mono">{viewingTxDetails.inventoryBatch?.batchNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heat/Melt Number:</span>
                  <span className="text-blue-400 font-bold font-mono">{viewingTxDetails.inventoryBatch?.heatNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference Doc:</span>
                  <span className="text-slate-300 font-medium">{viewingTxDetails.referenceDocType}</span>
                </div>
                {viewingTxDetails.remarks && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remarks:</span>
                    <span className="text-slate-300 italic">"{viewingTxDetails.remarks}"</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Timestamp & Signoff
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Date:</span>
                  <span className="text-slate-300">{new Date(viewingTxDetails.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Time:</span>
                  <span className="text-slate-300">{new Date(viewingTxDetails.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recorded By:</span>
                  <span className="text-slate-300 font-bold uppercase">{viewingTxDetails.createdBy || 'SYSTEM'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button 
                type="button" 
                onClick={() => setViewingTxDetails(null)} 
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
