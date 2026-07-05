"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, Activity, PieChart, Wrench, HardHat, Truck, TrendingUp, Percent, Lock } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast";
import { useProject, useCloseProject } from "../../../../hooks/useProjects";
import { useCostEvents, useCreateInvoice } from "../../../../hooks/useFinance";

export default function FinanceTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const { data: costEvents } = useCostEvents(resolvedParams.id);
  const createInvoiceMutation = useCreateInvoice(resolvedParams.id);
  const closeProjectMutation = useCloseProject(resolvedParams.id);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState(0);
  const [selectedDispatchId, setSelectedDispatchId] = useState("");

  // Hooks handle fetching

  if (projectLoading || !project) return null;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedDispatchId) return;
    
    try {
      await createInvoiceMutation.mutateAsync({
        dispatchNoteId: selectedDispatchId,
        invoiceNumber: invNum,
        subtotal: invAmount,
        taxAmount: invAmount * 0.18,
        totalAmount: invAmount * 1.18,
      });
      setShowInvoiceModal(false);
      
      // Reset form
      setInvNum("");
      setInvAmount(0);
      setSelectedDispatchId("");
    } catch (err: any) {}
  };

  const handleCloseProject = async () => {
    try {
      await closeProjectMutation.mutateAsync();
    } catch (err: any) {}
  };



  const cost = project.projectCostSummary || {};

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col h-full">
      <div className="glass-panel p-6 mb-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center">
              <DollarSign className="h-6 w-6 mr-3 text-green-400" />
              Finance & Costing Dashboard
            </h2>
            <p className="text-slate-400 mt-1">End-to-End Financial Tracking from BOM to Invoice.</p>
          </div>
          <div className="flex space-x-3">
            {project.currentStage === 'INVOICED' && (
              <button onClick={handleCloseProject} className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Close Project
              </button>
            )}
            {project.currentStage === 'DISPATCHED' && (
              <button onClick={() => {
                setInvNum(`INV-${Date.now().toString().slice(-4)}`);
                setShowInvoiceModal(true);
              }} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all">
                Generate Tax Invoice
              </button>
            )}
          </div>
        </div>

        {/* Cost Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10 pt-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Total Cost</div>
              <PieChart className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">&#8377;{cost.totalCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Material</div>
              <Wrench className="w-4 h-4 text-amber-500/70" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">&#8377;{cost.actualMaterialCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Labour</div>
              <HardHat className="w-4 h-4 text-blue-500/70" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-400">&#8377;{cost.actualLabourCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase">Subcontract</div>
              <Truck className="w-4 h-4 text-orange-500/70" />
            </div>
            <div className="text-xl font-bold font-mono text-orange-400">&#8377;{cost.actualSubcontractCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-green-500 uppercase">Total Revenue</div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl font-bold font-mono text-green-400">&#8377;{cost.revenue || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-bold text-emerald-500 uppercase">Margin</div>
              <Percent className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {cost.revenue > 0 ? ((Number(cost.profitability) / Number(cost.revenue)) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Financial Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center mb-4">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Financial Audit Trail
            </h3>
            
            {costEvents && costEvents.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-white/10 space-y-6">
                {costEvents.map((evt: any, idx: number) => {
                  const isRevenue = evt.costType === 'REVENUE';
                  const isEstimate = evt.costType === 'ESTIMATED_MATERIAL' || evt.costType === 'ESTIMATED_LABOUR';
                  
                  return (
                    <div key={evt.id} className="relative">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border-4 border-[#050A14] ${
                        isRevenue ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : isEstimate ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                      }`} />
                      
                      <div className="glass-panel p-4 border border-white/5 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-sm font-bold ${
                                isRevenue ? 'text-green-400' : isEstimate ? 'text-amber-400' : 'text-red-400'
                              }`}>
                                {evt.costType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(evt.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">{evt.description}</p>
                          </div>
                          
                          <div className={`text-lg font-bold font-mono flex items-center ${
                            isRevenue ? 'text-green-400' : 'text-white'
                          }`}>
                            {isRevenue ? <ArrowUpRight className="h-4 w-4 mr-1 text-green-400" /> : <ArrowDownRight className="h-4 w-4 mr-1 text-red-400" />}
                            &#8377;{evt.amount}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 glass-panel border border-dashed border-white/10 rounded-xl">
                <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No financial events recorded yet.</p>
              </div>
            )}
          </div>

          {/* Right Column: Invoices */}
          <div>
            <h3 className="text-lg font-bold text-white flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2 text-green-400" />
              Generated Invoices
            </h3>
            
            {project.invoiceHeaders && project.invoiceHeaders.length > 0 ? (
              <div className="space-y-4">
                {project.invoiceHeaders.map((inv: any) => (
                  <div key={inv.id} className="glass-panel p-5 border border-white/5 hover:border-green-500/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="text-lg font-bold text-white">{inv.invoiceNumber}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                            {inv.status || 'ISSUED'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Ref Dispatch: <span className="text-white font-medium">{project.dispatchNotes?.find((d: any) => d.id === inv.dispatchNoteId)?.dispatchNumber || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Total Billed</div>
                        <div className="text-green-400 font-bold text-lg font-mono">&#8377;{inv.totalAmount}</div>
                        {inv.profit && (
                          <div className="text-xs font-bold text-emerald-500 mt-1">Profit: &#8377;{inv.profit}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 glass-panel border border-dashed border-white/10 rounded-xl">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No Invoices Generated.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up border border-green-500/20">
            <h2 className="text-h4 font-bold mb-6 text-white">Create Tax Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-5">
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Link to Dispatch Note</label>
                <select
                  required
                  className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50"
                  value={selectedDispatchId}
                  onChange={(e) => setSelectedDispatchId(e.target.value)}
                >
                  <option value="">Select Dispatch...</option>
                  {project.dispatchNotes?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
                  ))}
                </select>
                {(!project.dispatchNotes || project.dispatchNotes.length === 0) && (
                  <p className="text-xs text-red-400 mt-1">No dispatch notes available. Create one first.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50"
                  value={invNum}
                  onChange={(e) => setInvNum(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Subtotal Amount (&#8377;)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50"
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                />
              </div>

              <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-mono">&#8377;{invAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax (18% GST)</span>
                  <span className="text-white font-mono">&#8377;{(invAmount * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10 mt-2">
                  <span className="text-white">Total Amount</span>
                  <span className="text-green-400 font-mono">&#8377;{(invAmount * 1.18).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!selectedDispatchId}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold text-white shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
