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
  
  const estimatedCost = Number(cost.estimatedProjectCost || 0);
  const actualCost = Number(cost.totalCost || 0);
  
  const materialCost = Number(cost.actualMaterialCost || 0);
  const machineCost = Number(cost.machineCost || 0);
  const labourCost = Number(cost.labourCost || 0);
  const outsideCost = Number(cost.outsideProcessCost || 0);

  // If revenue is 0, fallback to total invoice amount
  const revenue = Number(cost.revenue || invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalAmount) || 0), 0));
  
  const profitMargin = revenue > 0 ? ((revenue - actualCost) / revenue) * 100 : 0;
  const isProfitable = profitMargin >= 0;

  const costVariance = actualCost - estimatedCost;
  const isOverBudget = actualCost > estimatedCost && estimatedCost > 0;

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
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center">
            <DollarSign className="w-6 h-6 mr-3 text-rose-400 drop-shadow-sm" /> 
            Financial Dashboard
          </h2>
          <p className="text-zinc-500 mt-1">Real-time costing, revenue margins, and billing</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={() => { setInvoiceForm({ dispatchNoteId: "", invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, amount: "" }); setDrawerMode('INVOICE'); }} 
            className="!bg-rose-600 hover:!bg-rose-500 shadow-elevation transition-all"
          >
            <FileText className="w-4 h-4 mr-2" /> Generate Invoice
          </Button>
          <Button 
            variant="glass" 
            onClick={() => { setPaymentForm({ invoiceId: "", amount: "", reference: "", remarks: "" }); setDrawerMode('PAYMENT'); }}
            className="border-black/10 hover:bg-black/5 backdrop-blur-md transition-all"
          >
            <CreditCard className="w-4 h-4 mr-2 text-rose-400" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Premium KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Revenue</p>
              <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">₹{revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Based on issued invoices</span>
          </div>
        </div>

        {/* Actual Cost Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] group-hover:bg-amber-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Actual Cost</p>
              <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">₹{actualCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Est. Cost: <span className="text-zinc-900">₹{estimatedCost.toLocaleString()}</span></span>
            {isOverBudget ? (
              <span className="text-rose-400 flex items-center"><TrendingUp className="w-3 h-3 mr-1"/> Over Budget</span>
            ) : (
              <span className="text-emerald-400 flex items-center"><TrendingDown className="w-3 h-3 mr-1"/> Under Budget</span>
            )}
          </div>
        </div>

        {/* Profit Margin Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[40px] transition-all duration-700 pointer-events-none ${isProfitable ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'}`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Profit Margin</p>
              <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">{profitMargin.toFixed(1)}%</h3>
            </div>
            <div className={`p-3 rounded-xl border ${isProfitable ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              <PieChart className={`w-5 h-5 ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Gross Profit</span>
            <span className={`font-medium ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              ₹{(revenue - actualCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Variance Card */}
        <div className="glass-panel p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Cost Variance</p>
              <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">
                {costVariance > 0 ? '+' : ''}₹{costVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Actual vs Estimated</span>
          </div>
        </div>

      </div>

      {/* Cost Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cost Distribution Bars */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-rose-400" /> Cost Breakdown Analysis
          </h3>
          
          <div className="space-y-6">
            {/* Material */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900">Material Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900">₹{materialCost.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500 ml-2">/ ₹{Number(cost.estimatedMaterialCost || 0).toLocaleString()} est</span>
                </div>
              </div>
              <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-elevation" 
                  style={{ width: `${Math.min((materialCost / (Number(cost.estimatedMaterialCost) || 1)) * 100, 100)}%` }} 
                />
              </div>
            </div>

            {/* Machine */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900">Machine Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900">₹{machineCost.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500 ml-2">/ ₹{Number(cost.estimatedMachineCost || 0).toLocaleString()} est</span>
                </div>
              </div>
              <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full shadow-elevation" 
                  style={{ width: `${Math.min((machineCost / (Number(cost.estimatedMachineCost) || 1)) * 100, 100)}%` }} 
                />
              </div>
            </div>

            {/* Labour */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900">Labour Cost</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900">₹{labourCost.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500 ml-2">/ ₹{Number(cost.estimatedLabourCost || 0).toLocaleString()} est</span>
                </div>
              </div>
              <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full shadow-elevation" 
                  style={{ width: `${Math.min((labourCost / (Number(cost.estimatedLabourCost) || 1)) * 100, 100)}%` }} 
                />
              </div>
            </div>

            {/* Outside Process / Subcontract */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-sm font-medium text-zinc-900">Subcontract / Outsource</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900">₹{outsideCost.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500 ml-2">/ ₹{Number(cost.estimatedOutsideProcessCost || 0).toLocaleString()} est</span>
                </div>
              </div>
              <div className="h-2.5 bg-black/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-elevation" 
                  style={{ width: `${Math.min((outsideCost / (Number(cost.estimatedOutsideProcessCost) || 1)) * 100, 100)}%` }} 
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* Summary Mini-chart / Status (Placeholder for visual balance) */}
        <div className="glass-panel p-6 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <div className="w-48 h-48 rounded-full border-8 border-black/5 flex items-center justify-center relative mb-6 mx-auto">
              {/* Dynamic circular indicator could go here, simulating a donut chart visually */}
              <div className="absolute inset-0 rounded-full border-8 border-rose-500/40" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)' }} />
              <div className="absolute inset-2 rounded-full border-4 border-black/10" />
              
              <div className="text-center">
                <span className="block text-3xl font-black text-zinc-900">{actualCost > 0 ? Math.round((actualCost / (estimatedCost || actualCost)) * 100) : 0}%</span>
                <span className="block text-xs text-zinc-500 uppercase tracking-widest mt-1">Budget<br/>Consumed</span>
              </div>
            </div>
            
            <p className="text-zinc-600 text-sm max-w-xs mx-auto leading-relaxed">
              {isOverBudget 
                ? "The project is currently tracking over the estimated budget limit. Review material or machine utilization."
                : "The project is tracking within healthy financial margins and remains under budget constraints."}
            </p>
          </div>
        </div>

      </div>

      {/* Invoice & Payments Management */}
      <div className="glass-panel p-6">
        <div className="flex gap-6 border-b border-black/10 mb-6 pb-px">
          {['INVOICES', 'PAYMENTS'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab as any)} 
              className={`pb-3 text-sm font-medium border-b-2 transition-all duration-300 ${activeTab === tab ? 'border-rose-500 text-rose-400' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
            >
              {tab === 'INVOICES' ? 'Invoices' : 'Payments'}
            </button>
          ))}
        </div>

        <div className="bg-black/20 border border-black/5 rounded-xl overflow-hidden backdrop-blur-md">
          {activeTab === 'INVOICES' && (
            <SmartTable 
              data={invoices}
              isLoading={false}
              columns={[
                { key: 'invoiceNumber', label: 'Invoice No' },
                { key: 'status', label: 'Status' },
                { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
                { key: 'totalAmount', label: 'Total Amount', render: (v) => <span className="text-zinc-900 font-medium">₹{(Number(v) || 0).toLocaleString()}</span> },
                { key: 'paymentStatus', label: 'Payment' }
              ]}
            />
          )}
          {activeTab === 'PAYMENTS' && (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-zinc-900/20 mx-auto mb-4" />
              <h4 className="text-zinc-900 font-medium mb-1">Payment Ledger</h4>
              <p className="text-sm text-zinc-500">Recorded payments will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <PremiumDrawer isOpen={drawerMode === 'INVOICE'} onClose={() => setDrawerMode(null)} title="Generate Invoice" subtitle="Create a tax invoice against a dispatch note">
        <div className="space-y-4 p-1">
          <Select label="Select Dispatch Note" value={invoiceForm.dispatchNoteId} onChange={e => setInvoiceForm({...invoiceForm, dispatchNoteId: e.target.value})}>
            <option value="">Select dispatch note...</option>
            {dispatches.map((d: any) => (
              <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
            ))}
          </Select>
          <Input label="Invoice Number" value={invoiceForm.invoiceNumber} onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})} />
          <Input label="Subtotal Amount" type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} />
          <div className="pt-6">
            <Button variant="primary" onClick={handleCreateInvoice} className="w-full !bg-rose-600 hover:!bg-rose-500 shadow-lg shadow-rose-500/20">Generate Invoice</Button>
          </div>
        </div>
      </PremiumDrawer>

      <PremiumDrawer isOpen={drawerMode === 'PAYMENT'} onClose={() => setDrawerMode(null)} title="Record Payment" subtitle="Log payment received against an invoice">
        <div className="space-y-4 p-1">
          <Select label="Select Invoice" value={paymentForm.invoiceId} onChange={e => setPaymentForm({...paymentForm, invoiceId: e.target.value})}>
            <option value="">Select invoice...</option>
            {invoices.map((inv: any) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - Total: ₹{(Number(inv.totalAmount) || 0).toLocaleString()} ({inv.paymentStatus})</option>
            ))}
          </Select>
          <Input label="Payment Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          <Input label="Reference (Cheque/UTR)" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
          <Input label="Remarks" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
          <div className="pt-6">
            <Button variant="primary" onClick={handleRecordPayment} className="w-full">Record Payment</Button>
          </div>
        </div>
      </PremiumDrawer>
    </div>
  );
}
