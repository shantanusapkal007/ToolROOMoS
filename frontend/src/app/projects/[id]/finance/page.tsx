"use client";

import React, { useState } from 'react';
import { api } from "../../../../lib/api";
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight, Activity, PieChart, Wrench, HardHat, Truck, TrendingUp, Percent, Lock, Plus, X, Info, Calendar, Settings } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast";
import { useProject, useCloseProject } from "../../../../hooks/useProjects";
import { useCostEvents, useCreateInvoice, useRecordPayment } from "../../../../hooks/useFinance";
import { motion } from 'framer-motion';

export default function FinanceTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const { data: costEvents } = useCostEvents(resolvedParams.id);
  const createInvoiceMutation = useCreateInvoice(resolvedParams.id);
  const closeProjectMutation = useCloseProject(resolvedParams.id);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState(0);
  const [selectedDispatchId, setSelectedDispatchId] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  
  const recordPaymentMutation = useRecordPayment(resolvedParams.id);
  
  const [viewingInvoiceDetails, setViewingInvoiceDetails] = useState<any | null>(null);
  const [viewingCostEventDetails, setViewingCostEventDetails] = useState<any | null>(null);

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
      refetchProject();
      
      // Reset form
      setInvNum("");
      setInvAmount(0);
      setSelectedDispatchId("");
    } catch (err: any) {}
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        paymentReference: paymentRef,
        remarks: paymentRemarks
      });
      setShowPaymentModal(false);
      refetchProject();
      
      setSelectedInvoiceId("");
      setPaymentAmount(0);
      setPaymentRef("");
      setPaymentRemarks("");
    } catch (err: any) {}
  };

  const handleCloseProject = async () => {
    try {
      await closeProjectMutation.mutateAsync();
      refetchProject();
    } catch (err: any) {}
  };

  const cost = project.projectCostSummary || {};

  const KPICard = ({ title, value, icon: Icon, colorClass, highlight = false, delay = 0 }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative p-4 rounded-xl border ${highlight ? 'bg-green-900/20 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'} backdrop-blur-xl overflow-hidden group transition-all duration-300`}
    >
      {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-2xl -mr-10 -mt-10" />}
      {!highlight && <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />}
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className={`text-[10px] font-bold ${highlight ? 'text-green-400' : 'text-slate-400'} uppercase tracking-widest`}>{title}</div>
        <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      </div>
      <div className={`text-xl font-bold font-mono tracking-tight relative z-10 ${highlight ? 'text-green-400' : 'text-white'}`}>
        {value}
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 h-full flex flex-col animate-fade-in min-h-0">
      
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 mr-3 text-green-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Finance & Costing</h2>
        </div>
        <div className="flex space-x-3">
          {project.currentStage === 'INVOICED' && (
            <button 
              onClick={handleCloseProject} 
              className="group relative px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            >
              <span className="relative z-10 flex items-center text-red-400 font-bold text-xs">
                <Lock className="w-3 h-3 mr-1.5" />
                Close Project
              </span>
            </button>
          )}
          {project.currentStage === 'DISPATCHED' && (
            <button 
              onClick={() => {
                setInvNum(`INV-${Date.now().toString().slice(-4)}`);
                setShowInvoiceModal(true);
              }} 
              className="group relative px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(22,163,74,0.2)]"
            >
              <span className="relative z-10 flex items-center text-green-400 font-bold text-xs">
                <Plus className="w-3 h-3 mr-1.5" />
                Generate Tax Invoice
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 shrink-0 mb-4 relative z-10">
        <KPICard title="Total Cost" value={`₹${Number(cost.totalCost || 0).toLocaleString()}`} icon={PieChart} colorClass="text-slate-400" delay={0.0} />
        <KPICard title="Material" value={`₹${Number(cost.actualMaterialCost || 0).toLocaleString()}`} icon={Wrench} colorClass="text-amber-500" delay={0.05} />
        <KPICard title="Machine" value={`₹${Number(cost.machineCost || 0).toLocaleString()}`} icon={Settings} colorClass="text-purple-500" delay={0.1} />
        <KPICard title="Labour" value={`₹${Number(cost.labourCost || 0).toLocaleString()}`} icon={HardHat} colorClass="text-blue-500" delay={0.15} />
        <KPICard title="Subcontract" value={`₹${Number(cost.outsideProcessCost || 0).toLocaleString()}`} icon={Truck} colorClass="text-orange-500" delay={0.2} />
        <KPICard title="Revenue" value={`₹${Number(cost.revenue || 0).toLocaleString()}`} icon={TrendingUp} colorClass="text-green-400" highlight={true} delay={0.25} />
        <KPICard title="Margin" value={`${cost.revenue > 0 ? ((Number(cost.profitability) / Number(cost.revenue)) * 100).toFixed(1) : 0}%`} icon={Percent} colorClass="text-emerald-400" highlight={true} delay={0.3} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          
          {/* Left Column: Financial Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-400" />
              Financial Audit Trail
            </h3>
            
            {costEvents && costEvents.length > 0 ? (
              <div className="relative pl-6 border-l border-white/10 space-y-4">
                {costEvents.map((evt: any, idx: number) => {
                  const isRevenue = evt.costType === 'REVENUE';
                  const isEstimate = evt.costType === 'ESTIMATED_MATERIAL' || evt.costType === 'ESTIMATED_LABOUR';
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 + 0.3 }}
                      key={evt.id} 
                      className="relative"
                    >
                      <div className={`absolute -left-[30px] top-5 w-3 h-3 rounded-full border-2 border-[#050A14] z-10 ${
                        isRevenue ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : isEstimate ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                      }`} />
                      
                      <div className="group bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2 mb-1.5">
                              <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${
                                isRevenue ? 'bg-green-500/10 text-green-400 border border-green-500/20' : isEstimate ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {evt.costType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {new Date(evt.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300">{evt.description}</p>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <div className={`text-base font-bold font-mono flex items-center ${
                              isRevenue ? 'text-green-400' : 'text-slate-200'
                            }`}>
                              {isRevenue ? <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-green-400" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-1 text-red-400" />}
                              &#8377;{Number(evt.amount).toLocaleString()}
                            </div>
                            <button
                              onClick={() => setViewingCostEventDetails(evt)}
                              className="mt-2 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors animate-fade-in"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
                <Activity className="h-10 w-10 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm">No financial events recorded yet.</p>
              </div>
            )}
          </div>

          {/* Right Column: Invoices */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
              <FileText className="h-4 w-4 mr-2 text-green-400" />
              Generated Invoices
            </h3>
            
            {project.invoiceHeaders && project.invoiceHeaders.length > 0 ? (
              <div className="space-y-3">
                {project.invoiceHeaders.map((inv: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.2 }}
                    key={inv.id} 
                    className="group relative bg-white/[0.01] border border-white/5 hover:border-green-500/30 rounded-xl p-4 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:-translate-y-0.5"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-green-500/20 transition-all duration-500" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="flex items-center space-x-3 mb-1.5">
                          <span className="text-sm font-bold text-white tracking-tight">{inv.invoiceNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest">
                            {inv.status || 'ISSUED'}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                          <Truck className="w-3 h-3 mr-1.5 opacity-50" />
                          Ref Dispatch: <span className="text-slate-300 ml-1">{project.dispatchNotes?.find((d: any) => d.id === inv.dispatchNoteId)?.dispatchNumber || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Billed</div>
                        <div className="text-green-400 font-bold text-lg font-mono tracking-tight">&#8377;{Number(inv.totalAmount).toLocaleString()}</div>
                        
                        <div className="mt-3 flex items-center space-x-2">
                          <button
                            onClick={() => setViewingInvoiceDetails(inv)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 transition-colors animate-fade-in"
                          >
                            Details
                          </button>
                          {inv.paymentStatus === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest">
                              PAID
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedInvoiceId(inv.id);
                                setPaymentAmount(Number(inv.totalAmount));
                                setShowPaymentModal(true);
                              }}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 transition-colors"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-green-500/50" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">No Invoices</h4>
                <p className="text-slate-400 text-sm text-center">Invoices can be generated once goods are dispatched.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in p-4">
          <div className="glass-modal w-full max-w-lg p-8 animate-slide-up border border-green-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight relative z-10">Generate Tax Invoice</h2>
            
            <form onSubmit={handleCreateInvoice} className="space-y-5 relative z-10">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Link to Dispatch Note</label>
                <select
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500/50 transition-colors"
                  value={selectedDispatchId}
                  onChange={(e) => setSelectedDispatchId(e.target.value)}
                >
                  <option value="">Select Dispatch...</option>
                  {project.dispatchNotes?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
                  ))}
                </select>
                {(!project.dispatchNotes || project.dispatchNotes.length === 0) && (
                  <p className="text-xs text-red-400 mt-2 font-medium">No dispatch notes available. Create one first.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoice Number</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500/50 transition-colors"
                  value={invNum}
                  onChange={(e) => setInvNum(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subtotal Amount (&#8377;)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500/50 transition-colors"
                  value={invAmount}
                  onChange={(e) => setInvAmount(Number(e.target.value))}
                />
              </div>

              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-mono font-medium">&#8377;{invAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax (18% GST)</span>
                  <span className="text-white font-mono font-medium">&#8377;{(invAmount * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-white/10 mt-3">
                  <span className="text-white">Total Amount</span>
                  <span className="text-green-400 font-mono">&#8377;{(invAmount * 1.18).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!selectedDispatchId}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 font-bold text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in p-4">
          <div className="glass-modal w-full max-w-md p-8 animate-slide-up border border-green-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight relative z-10 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-400" />
              Record Payment
            </h2>
            
            <form onSubmit={handleRecordPayment} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount Received (&#8377;)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-green-500/50 transition-colors"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reference Number (Txn/Cheque)</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500/50 transition-colors"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR123456789"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks</label>
                <textarea
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-green-500/50 transition-colors min-h-[80px]"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                  placeholder="Optional notes..."
                ></textarea>
              </div>

              <div className="flex space-x-4 pt-4 border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 font-bold text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cost Event Details Modal */}
      {viewingCostEventDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-green-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ledger Entry Details</h3>
                  <p className="text-[10px] text-slate-400">Auditable transaction log</p>
                </div>
              </div>
              <button onClick={() => setViewingCostEventDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Type:</span>
                  <span className="text-white font-bold uppercase tracking-wider">{viewingCostEventDetails.costType?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recorded Amount:</span>
                  <span className="text-green-400 font-bold font-mono text-sm">&#8377;{Number(viewingCostEventDetails.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entry Date:</span>
                  <span className="text-slate-300 font-mono">{new Date(viewingCostEventDetails.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Ledger Narrative
                </h4>
                <div className="flex flex-col space-y-1">
                  <span className="text-slate-400">Description:</span>
                  <span className="text-slate-200 leading-relaxed bg-black/20 p-2.5 rounded border border-white/5 italic">"{viewingCostEventDetails.description}"</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingCostEventDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {viewingInvoiceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-green-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tax Invoice Details</h3>
                  <p className="text-[10px] text-slate-400">Billed customer statement</p>
                </div>
              </div>
              <button onClick={() => setViewingInvoiceDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Code:</span>
                  <span className="text-white font-bold font-mono">{viewingInvoiceDetails.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax Invoice Date:</span>
                  <span className="text-slate-300 font-mono">{new Date(viewingInvoiceDetails.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-green-500/20 text-green-400 border border-green-500/20 uppercase font-mono">{viewingInvoiceDetails.paymentStatus || 'ISSUED'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Bill Summary (INR)
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-slate-300 font-mono">&#8377;{Number(viewingInvoiceDetails.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GST Tax (18%):</span>
                  <span className="text-slate-300 font-mono">&#8377;{Number(viewingInvoiceDetails.taxAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-white/5">
                  <span className="text-slate-400 font-bold">Total Bill Value:</span>
                  <span className="text-green-400 font-bold font-mono text-sm">&#8377;{Number(viewingInvoiceDetails.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              {viewingInvoiceDetails.paymentReference && (
                <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Payment Clearing Details
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank TX Ref:</span>
                    <span className="text-slate-300 font-mono">{viewingInvoiceDetails.paymentReference}</span>
                  </div>
                  {viewingInvoiceDetails.paymentRemarks && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remarks:</span>
                      <span className="text-slate-300 italic">"{viewingInvoiceDetails.paymentRemarks}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingInvoiceDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
