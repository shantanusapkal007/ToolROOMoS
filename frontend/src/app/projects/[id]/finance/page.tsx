"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  FileText,
  CreditCard,
  PieChart,
  Target
} from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useProject, useCloseProject } from "@/hooks/useProjects";
import { useCreateInvoice, useRecordPayment } from "@/hooks/useFinance";
import { formatDate } from "@/lib/formatters";

export default function FinanceTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const createInvoiceMutation = useCreateInvoice(projectId);
  const recordPaymentMutation = useRecordPayment(projectId);
  
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
  const [invoiceForm, setInvoiceForm] = useState({ dispatchNoteId: "", invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, amount: "" });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: "", amount: "", reference: "", remarks: "" });

  if (projectLoading || !project) return null;

  const invoices = project.invoiceHeaders || [];
  const dispatches = project.dispatchNotes || [];

  // Finance Calculations
  const cost = project.projectCostSummary || {};
  
  const actualCost = Number(cost.totalCost || 0);
  
  const materialCost = Number(cost.actualMaterialCost || 0);
  const machineCost = Number(cost.machineCost || 0);
  const labourCost = Number(cost.labourCost || 0);
  const outsideCost = Number(cost.outsideProcessCost || 0);

  // If revenue is 0, fallback to total invoice amount
  const revenue = Number(cost.revenue || invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalAmount) || 0), 0));
  
  const profitMargin = revenue > 0 ? ((revenue - actualCost) / revenue) * 100 : 0;
  const isProfitable = revenue >= actualCost;

  const totalInvoiced = invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalAmount) || 0), 0);
  const pendingBilling = Math.max(revenue - totalInvoiced, 0);

  const costToRevenueRatio = revenue > 0 ? (actualCost / revenue) * 100 : 0;
  const isLossMaking = actualCost > revenue && revenue > 0;

  const handleCreateInvoice = async () => {
    try {
      await createInvoiceMutation.mutateAsync({
        dispatchNoteId: invoiceForm.dispatchNoteId,
        invoiceNumber: invoiceForm.invoiceNumber,
        subtotal: Number(invoiceForm.amount),
        taxAmount: Number(invoiceForm.amount) * 0.18,
        totalAmount: Number(invoiceForm.amount) * 1.18,
      });
      setDrawerMode(null);
      success("Invoice Created", "Successfully generated invoice");
    } catch (err: any) {}
  };

  const handleRecordPayment = async () => {
    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: paymentForm.invoiceId,
        amount: Number(paymentForm.amount),
        paymentReference: paymentForm.reference,
        remarks: paymentForm.remarks
      });
      setDrawerMode(null);
      success("Payment Recorded", "Payment processed successfully");
    } catch (err: any) {}
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20 mr-4">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Financial Dashboard
          </h2>
          <p className="text-zinc-500 mt-2 font-medium">Real-time costing, revenue margins, and billing</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="glass" 
            onClick={() => { setPaymentForm({ invoiceId: "", amount: "", reference: "", remarks: "" }); setDrawerMode('PAYMENT'); }}
            className="border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white shadow-sm transition-all rounded-xl"
          >
            <CreditCard className="w-4 h-4 mr-2" /> Record Payment
          </Button>
          <Button 
            variant="primary" 
            onClick={() => { setInvoiceForm({ dispatchNoteId: "", invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, amount: "" }); setDrawerMode('INVOICE'); }} 
            className="!bg-zinc-900 hover:!bg-zinc-800 text-white shadow-xl shadow-black/10 transition-all rounded-xl"
          >
            <FileText className="w-4 h-4 mr-2" /> Generate Invoice
          </Button>
        </div>
      </div>

      {/* Premium KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Revenue (PO Value)</p>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">₹{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-sm relative z-10">
            <span className="text-zinc-500 font-medium">Total Project Value</span>
          </div>
        </div>

        {/* Actual Cost Card */}
        <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] group-hover:bg-amber-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Actual Cost</p>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">₹{actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-sm relative z-10">
            <span className="text-zinc-500 font-medium">Cost to Revenue Ratio</span>
            {isLossMaking ? (
              <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-bold text-xs flex items-center border border-rose-100"><TrendingUp className="w-3 h-3 mr-1"/> {costToRevenueRatio.toFixed(1)}% (LOSS)</span>
            ) : (
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-bold text-xs flex items-center border border-emerald-100"><TrendingDown className="w-3 h-3 mr-1"/> {costToRevenueRatio.toFixed(1)}% (PROFIT)</span>
            )}
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] transition-all duration-700 pointer-events-none ${isProfitable ? 'bg-blue-500/10 group-hover:bg-blue-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'}`} />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Profit Margin</p>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">{profitMargin.toFixed(1)}%</h3>
            </div>
            <div className={`p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300 border ${isProfitable ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
              <PieChart className={`w-5 h-5 ${isProfitable ? 'text-blue-600' : 'text-rose-600'}`} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-sm relative z-10">
            <span className="text-zinc-500 font-medium">Gross Profit</span>
            <span className={`font-bold ${isProfitable ? 'text-blue-600' : 'text-rose-600'}`}>
              ₹{(revenue - actualCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Pending Billing Card */}
        <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Pending Billing</p>
              <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">
                ₹{pendingBilling.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-sm relative z-10">
            <span className="text-zinc-500 font-medium">Total Invoiced:</span>
            <span className="font-bold text-zinc-900">₹{totalInvoiced.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Cost Breakdown Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Cost Distribution Bars */}
        <div className="xl:col-span-2 glass-panel p-8">
          <h3 className="text-lg font-bold text-zinc-900 mb-8 flex items-center">
            <Activity className="w-5 h-5 mr-3 text-zinc-400" /> Actual Cost Distribution
          </h3>
          
          <div className="space-y-8">
            {/* Material */}
            <div className="group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                     <div className="w-3 h-3 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Material Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-zinc-900 tracking-tight">₹{materialCost.toLocaleString()}</span>
                  <span className="text-xs font-medium text-zinc-500 ml-3">/ {actualCost > 0 ? Math.round((materialCost / actualCost) * 100) : 0}% of Total</span>
                </div>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                <div 
                  className="h-full bg-blue-500 rounded-full shadow-sm transition-all duration-1000 ease-out relative group-hover:bg-blue-400" 
                  style={{ width: `${actualCost > 0 ? (materialCost / actualCost) * 100 : 0}%` }} 
                />
              </div>
            </div>

            {/* Machine */}
            <div className="group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                     <div className="w-3 h-3 rounded-full bg-purple-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Machine Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-zinc-900 tracking-tight">₹{machineCost.toLocaleString()}</span>
                  <span className="text-xs font-medium text-zinc-500 ml-3">/ {actualCost > 0 ? Math.round((machineCost / actualCost) * 100) : 0}% of Total</span>
                </div>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                <div 
                  className="h-full bg-purple-500 rounded-full shadow-sm transition-all duration-1000 ease-out relative group-hover:bg-purple-400" 
                  style={{ width: `${actualCost > 0 ? (machineCost / actualCost) * 100 : 0}%` }} 
                />
              </div>
            </div>

            {/* Labour */}
            <div className="group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                     <div className="w-3 h-3 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Labour Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-zinc-900 tracking-tight">₹{labourCost.toLocaleString()}</span>
                  <span className="text-xs font-medium text-zinc-500 ml-3">/ {actualCost > 0 ? Math.round((labourCost / actualCost) * 100) : 0}% of Total</span>
                </div>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                <div 
                  className="h-full bg-amber-500 rounded-full shadow-sm transition-all duration-1000 ease-out relative group-hover:bg-amber-400" 
                  style={{ width: `${actualCost > 0 ? (labourCost / actualCost) * 100 : 0}%` }} 
                />
              </div>
            </div>

            {/* Outside Process / Subcontract */}
            <div className="group">
              <div className="flex justify-between items-end mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                     <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-sm font-bold text-zinc-900">Subcontract / Outsource</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-zinc-900 tracking-tight">₹{outsideCost.toLocaleString()}</span>
                  <span className="text-xs font-medium text-zinc-500 ml-3">/ {actualCost > 0 ? Math.round((outsideCost / actualCost) * 100) : 0}% of Total</span>
                </div>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                <div 
                  className="h-full bg-emerald-500 rounded-full shadow-sm transition-all duration-1000 ease-out relative group-hover:bg-emerald-400" 
                  style={{ width: `${actualCost > 0 ? (outsideCost / actualCost) * 100 : 0}%` }} 
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* Summary Mini-chart / Status (Placeholder for visual balance) */}
        <div className="glass-panel p-8 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-white to-zinc-50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/4 -translate-y-1/4" />
          
          <div className="relative z-10 text-center w-full">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-8">Cost vs Revenue Ratio</h3>
            
            <div className="w-56 h-56 rounded-full border-[12px] border-zinc-100 flex items-center justify-center relative mb-8 mx-auto shadow-sm">
              <div className={`absolute inset-[-12px] rounded-full border-[12px] ${isLossMaking ? 'border-rose-500' : 'border-emerald-500'}`} style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)' }} />
              
              <div className="text-center">
                <span className="block text-5xl font-black text-zinc-900 tracking-tighter">{costToRevenueRatio > 0 ? Math.round(costToRevenueRatio) : 0}%</span>
                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2">Consumed</span>
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl ${isLossMaking ? 'bg-rose-50 border border-rose-100 text-rose-700' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
              <p className="text-sm font-semibold leading-relaxed">
                {isLossMaking 
                  ? "Project costs have exceeded the total revenue. You are currently operating at a financial loss."
                  : "Project costs are within the revenue limit. You are currently operating at a profit."}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Invoice & Payments Management */}
      <div className="glass-panel p-6">
        <div className="flex gap-8 border-b border-zinc-200 mb-6 pb-px px-2">
          {['INVOICES', 'PAYMENTS'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all duration-300 relative ${activeTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              {tab === 'INVOICES' ? 'Invoices' : 'Payments'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
          {activeTab === 'INVOICES' && (
            <SmartTable 
              data={invoices}
              isLoading={false}
              columns={[
                { key: 'invoiceNumber', label: 'Invoice No' },
                { key: 'status', label: 'Status', render: (v) => (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700">{v}</span>
                )},
                { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
                { key: 'totalAmount', label: 'Total Amount', render: (v) => <span className="text-zinc-900 font-black tracking-tight">₹{(Number(v) || 0).toLocaleString()}</span> },
                { key: 'paymentStatus', label: 'Payment', render: (v) => (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${v === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{v}</span>
                )}
              ]}
            />
          )}
          {activeTab === 'PAYMENTS' && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-zinc-300" />
              </div>
              <h4 className="text-zinc-900 font-bold text-lg mb-2">Payment Ledger</h4>
              <p className="text-sm font-medium text-zinc-500">Recorded payments will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <PremiumDrawer isOpen={drawerMode === 'INVOICE'} onClose={() => setDrawerMode(null)} title="Generate Invoice" subtitle="Create a tax invoice against a dispatch note">
        <div className="space-y-6 p-2">
          <Select label="Select Dispatch Note" value={invoiceForm.dispatchNoteId} onChange={e => setInvoiceForm({...invoiceForm, dispatchNoteId: e.target.value})}>
            <option value="">Select dispatch note...</option>
            {dispatches.map((d: any) => (
              <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
            ))}
          </Select>
          <Input label="Invoice Number" value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} />
          <Input label="Subtotal Amount" type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} />
          <div className="pt-8">
            <Button variant="primary" onClick={handleCreateInvoice} className="w-full !bg-zinc-900 hover:!bg-zinc-800 text-white shadow-xl shadow-black/10 py-3 rounded-xl font-bold">Generate Invoice</Button>
          </div>
        </div>
      </PremiumDrawer>

      <PremiumDrawer isOpen={drawerMode === 'PAYMENT'} onClose={() => setDrawerMode(null)} title="Record Payment" subtitle="Log payment received against an invoice">
        <div className="space-y-6 p-2">
          <Select label="Select Invoice" value={paymentForm.invoiceId} onChange={e => setPaymentForm({...paymentForm, invoiceId: e.target.value})}>
            <option value="">Select invoice...</option>
            {invoices.map((inv: any) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - Total: ₹{(Number(inv.totalAmount) || 0).toLocaleString()} ({inv.paymentStatus})</option>
            ))}
          </Select>
          <Input label="Payment Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          <Input label="Reference (Cheque/UTR)" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
          <Input label="Remarks" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
          <div className="pt-8">
            <Button variant="primary" onClick={handleRecordPayment} className="w-full !bg-zinc-900 hover:!bg-zinc-800 text-white shadow-xl shadow-black/10 py-3 rounded-xl font-bold">Record Payment</Button>
          </div>
        </div>
      </PremiumDrawer>
    </div>
  );
}
