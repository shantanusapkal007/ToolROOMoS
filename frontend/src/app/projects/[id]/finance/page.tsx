"use client";

import React, { useState } from 'react';
import { DollarSign, Plus, CheckSquare } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
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
  const closeProjectMutation = useCloseProject(projectId);
  
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
  const [invoiceForm, setInvoiceForm] = useState({ dispatchNoteId: "", invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, amount: "" });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: "", amount: "", reference: "", remarks: "" });

  if (projectLoading || !project) return null;

  const invoices = project.invoiceHeaders || [];
  const dispatches = project.dispatchNotes || [];

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-rose-400" /> Finance & Commercial
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage billing, invoices, and payments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setInvoiceForm({ dispatchNoteId: "", invoiceNumber: `INV-${Date.now().toString().slice(-4)}`, amount: "" }); setDrawerMode('INVOICE'); }} className="flex items-center px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" /> Generate Invoice
          </button>
          <button onClick={() => { setPaymentForm({ invoiceId: "", amount: "", reference: "", remarks: "" }); setDrawerMode('PAYMENT'); }} className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm font-medium">
            <DollarSign className="w-4 h-4 mr-2" /> Record Payment
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-px">
        {['INVOICES', 'PAYMENTS'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {tab === 'INVOICES' ? 'Invoices' : 'Payments'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        {activeTab === 'INVOICES' && (
          <SmartTable 
            data={invoices}
            isLoading={false}
            columns={[
              { key: 'invoiceNumber', label: 'Invoice No' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
              { key: 'totalAmount', label: 'Total Amount', render: (v) => `₹${v.toFixed(2)}` },
              { key: 'paymentStatus', label: 'Payment' }
            ]}
          />
        )}
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
            <button onClick={handleCreateInvoice} className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium shadow-lg shadow-rose-500/20 hover:bg-rose-500 transition-colors">Generate Invoice</button>
          </div>
        </div>
      </PremiumDrawer>

      <PremiumDrawer isOpen={drawerMode === 'PAYMENT'} onClose={() => setDrawerMode(null)} title="Record Payment" subtitle="Log payment received against an invoice">
        <div className="space-y-4 p-1">
          <Select label="Select Invoice" value={paymentForm.invoiceId} onChange={e => setPaymentForm({...paymentForm, invoiceId: e.target.value})}>
            <option value="">Select invoice...</option>
            {invoices.map((inv: any) => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - Total: ₹{inv.totalAmount} ({inv.paymentStatus})</option>
            ))}
          </Select>
          <Input label="Payment Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
          <Input label="Reference (Cheque/UTR)" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
          <Input label="Remarks" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />
          <div className="pt-6">
            <button onClick={handleRecordPayment} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-colors">Record Payment</button>
          </div>
        </div>
      </PremiumDrawer>
    </div>
  );
}
