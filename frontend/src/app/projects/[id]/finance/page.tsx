"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { DollarSign } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";

export default function FinanceTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState(0);
  const [selectedDispatchId, setSelectedDispatchId] = useState("");

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedDispatchId) return;
    
    try {
      await api.post(`projects/${project.id}/invoices`, {
        dispatchNoteId: selectedDispatchId,
        invoiceNumber: invNum,
        subtotal: invAmount,
        taxAmount: invAmount * 0.18,
        totalAmount: invAmount * 1.18,
      });
      setShowInvoiceModal(false);
      success("Invoice Generated", `Tax Invoice ${invNum} created successfully.`);
      loadProjectDetails(project.id);
      
      // Reset form
      setInvNum("");
      setInvAmount(0);
      setSelectedDispatchId("");
    } catch (err: any) { error("Invoice Failed", err.message); }
  };

  if (!project) return null;

  const cost = project.projectCostSummary || {};

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col h-full">
      <div className="glass-panel p-6 mb-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center">
              <DollarSign className="h-6 w-6 mr-3 text-green-400" />
              Finance & Billing
            </h2>
            <p className="text-slate-400 mt-1">Manage Invoices, Payments, and Cost Analysis.</p>
          </div>
          <button onClick={() => {
            setInvNum(`INV-${Date.now().toString().slice(-4)}`);
            setShowInvoiceModal(true);
          }} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(22,163,74,0.3)] transition-all">
            Generate Tax Invoice
          </button>
        </div>

        {/* Cost Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 pt-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Total Cost</div>
            <div className="text-xl font-bold font-mono text-white">₹{cost.totalCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Material Cost</div>
            <div className="text-xl font-bold font-mono text-amber-400">₹{cost.actualMaterialCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Labour Cost</div>
            <div className="text-xl font-bold font-mono text-blue-400">₹{cost.actualLabourCost || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-white/5">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Subcontract Cost</div>
            <div className="text-xl font-bold font-mono text-orange-400">₹{cost.actualSubcontractCost || 0}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {project.invoiceHeaders && project.invoiceHeaders.length > 0 ? (
          <div className="space-y-4">
            {project.invoiceHeaders.map((inv: any) => (
              <div key={inv.id} className="glass-panel p-5 border border-white/5 hover:border-green-500/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
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
                    <div className="text-sm text-slate-400">Total Billed (inc. Tax)</div>
                    <div className="text-green-400 font-bold text-lg font-mono">₹{inv.totalAmount}</div>
                    <div className="text-xs text-slate-500 mt-1">Sub: ₹{inv.subtotal} | Tax: ₹{inv.taxAmount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel border border-dashed border-white/10 rounded-2xl">
            <DollarSign className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Invoices Generated</h3>
            <p className="text-slate-400">Create an invoice against a completed dispatch note.</p>
          </div>
        )}
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Subtotal Amount (₹)</label>
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
                  <span className="text-white font-mono">₹{invAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax (18% GST)</span>
                  <span className="text-white font-mono">₹{(invAmount * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-white/10 mt-2">
                  <span className="text-white">Total Amount</span>
                  <span className="text-green-400 font-mono">₹{(invAmount * 1.18).toFixed(2)}</span>
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
