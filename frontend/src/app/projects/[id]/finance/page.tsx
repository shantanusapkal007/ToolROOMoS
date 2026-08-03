"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { 
  DollarSign, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  PieChart, 
  Wrench, 
  HardHat, 
  Truck, 
  TrendingUp, 
  Percent, 
  Lock, 
  Plus, 
  X, 
  Info, 
  Calendar, 
  Settings, 
  Download,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/components/ui/Toast";
import { useProject, useCloseProject } from "@/hooks/useProjects";
import { useCostEvents, useCreateInvoice, useRecordPayment } from "@/hooks/useFinance";
import { ProjectLaborTracking } from "@/components/finance/ProjectLaborTracking";
import { FinanceWaterfall, FinanceData } from "@/components/ui/charts/FinanceWaterfall";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

export default function ProjectFinancePage() {
  const params = useParams();
  const id = params?.id as string;

  const { success, error } = useToast();
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(id);
  const { data: costEventsRes = [] } = useCostEvents(id);
  const createInvoiceMutation = useCreateInvoice(id);
  const recordPaymentMutation = useRecordPayment(id);
  const closeProjectMutation = useCloseProject(id);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState<number | "">("");
  const [selectedDispatchId, setSelectedDispatchId] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");

  const [viewingInvoiceDetails, setViewingInvoiceDetails] = useState<any | null>(null);
  const [viewingCostEventDetails, setViewingCostEventDetails] = useState<any | null>(null);

  if (projectLoading || !project) {
    return <SkeletonBox className="h-96 w-full" />;
  }

  const costEvents = Array.isArray(costEventsRes) ? costEventsRes : (costEventsRes?.data || []);
  const costSummary = project.projectCostSummary || {};

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatchId) {
      error("Missing Dispatch Note", "Please select a dispatch note to generate an invoice.");
      return;
    }
    try {
      await createInvoiceMutation.mutateAsync({
        dispatchNoteId: selectedDispatchId,
        invoiceNumber: invNum || `INV-${Date.now().toString().slice(-4)}`,
        subtotal: Number(invAmount) || 0,
        taxAmount: (Number(invAmount) || 0) * 0.18,
        totalAmount: (Number(invAmount) || 0) * 1.18,
      });
      success("Invoice Generated", `Tax Invoice ${invNum} created successfully.`);
      setShowInvoiceModal(false);
      refetchProject();
      setInvNum("");
      setInvAmount("");
      setSelectedDispatchId("");
    } catch (err: any) {
      error("Failed to Create Invoice", err.message || "An error occurred");
    }
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
      success("Payment Recorded", `Payment of ₹${paymentAmount.toLocaleString()} recorded.`);
      setShowPaymentModal(false);
      refetchProject();
      setSelectedInvoiceId("");
      setPaymentAmount(0);
      setPaymentRef("");
      setPaymentRemarks("");
    } catch (err: any) {
      error("Failed to Record Payment", err.message || "An error occurred");
    }
  };

  const handleCloseProject = async () => {
    try {
      await closeProjectMutation.mutateAsync();
      success("Project Closed", "Project financial ledger has been locked and closed.");
      refetchProject();
    } catch (err: any) {
      error("Failed to Close Project", err.message || "An error occurred");
    }
  };

  const handleExportInvoice = (inv: any) => {
    if (!inv) return;
    const exportData = [{
      "Invoice Number": inv.invoiceNumber,
      "Date": new Date(inv.createdAt).toLocaleDateString('en-GB'),
      "Status": inv.status || 'ISSUED',
      "Subtotal (₹)": inv.subtotal,
      "Tax 18% (₹)": inv.taxAmount,
      "Total Amount (₹)": inv.totalAmount,
      "Payment Status": inv.paymentStatus || 'UNPAID',
      "Payment Reference": inv.paymentReference || '-',
    }];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    XLSX.writeFile(wb, `Invoice_${inv.invoiceNumber}.xlsx`);
  };

  const financeChartData: FinanceData[] = costEvents.map((evt: any) => ({
    category: evt.costType ? evt.costType.replace(/_/g, ' ') : (evt.createdAt ? new Date(evt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Event'),
    value: Number(evt.amount || evt.cost || 0),
    type: evt.costType === 'REVENUE' || evt.costType?.includes('INVOICE') ? 'revenue' : 'cost',
  }));

  const totalCost = Number(costSummary.totalCost || 0);
  const actualMaterialCost = Number(costSummary.actualMaterialCost || 0);
  const machineCost = Number(costSummary.machineCost || 0);
  const labourCost = Number(costSummary.labourCost || 0);
  const outsideProcessCost = Number(costSummary.outsideProcessCost || 0);
  const revenue = Number(costSummary.revenue || 0);
  const profitability = Number(costSummary.profitability || (revenue - totalCost));
  const marginPct = revenue > 0 ? ((profitability / revenue) * 100).toFixed(1) : "0";

  const kpis = [
    { title: "Total Cost", value: `₹${totalCost.toLocaleString('en-IN')}`, icon: PieChart, color: "text-zinc-700", bg: "bg-zinc-100 border-zinc-200" },
    { title: "Material", value: `₹${actualMaterialCost.toLocaleString('en-IN')}`, icon: Wrench, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { title: "Machine", value: `₹${machineCost.toLocaleString('en-IN')}`, icon: Settings, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
    { title: "Labour", value: `₹${labourCost.toLocaleString('en-IN')}`, icon: HardHat, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { title: "Subcontract", value: `₹${outsideProcessCost.toLocaleString('en-IN')}`, icon: Truck, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
    { title: "Revenue", value: `₹${revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300", highlight: true },
    { title: "Margin", value: `${marginPct}%`, icon: Percent, color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-400", highlight: true },
  ];

  const invoices = project.invoiceHeaders || [];

  return (
    <div className="space-y-6 font-sans text-zinc-900">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Finance & Commercial Costing</span>
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time financial audit trail, tax invoices, customer billing, and profitability analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {project.currentStage === 'INVOICED' && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleCloseProject}
              className="text-red-700 border-red-200 hover:bg-red-50 font-bold text-xs"
            >
              <Lock className="w-4 h-4 mr-1" />
              <span>Close Project</span>
            </Button>
          )}

          <Button 
            variant="primary" 
            size="md" 
            onClick={() => {
              setInvNum(`INV-${Date.now().toString().slice(-4)}`);
              setShowInvoiceModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Tax Invoice</span>
          </Button>
        </div>
      </div>

      {/* 7 KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.title} 
              className={`p-3.5 rounded-2xl border ${kpi.bg} shadow-2xs flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                  {kpi.title}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className={`text-base font-extrabold font-mono ${kpi.color}`}>
                {kpi.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Financial Cost Allocation & Variance Chart */}
      <div className="enterprise-card p-6 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-600" />
          <span>Financial Cost Allocation & Cost Variance</span>
        </h3>
        <FinanceWaterfall data={financeChartData} />
      </div>

      {/* Two Column Layout: Financial Audit Trail vs Generated Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Financial Audit Trail */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Financial Audit Trail</span>
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {costEvents.length} Events Logged
            </span>
          </div>

          {costEvents && costEvents.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {costEvents.map((evt: any) => {
                const isRevenue = evt.costType === 'REVENUE' || evt.costType?.includes('INVOICE');
                const isEstimate = evt.costType?.includes('ESTIMATED');

                return (
                  <div 
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                          isRevenue 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : isEstimate 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {evt.costType?.replace(/_/g, ' ') || 'COST EVENT'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(evt.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-800 line-clamp-1">{evt.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold font-mono flex items-center justify-end ${
                        isRevenue ? 'text-emerald-600' : 'text-zinc-900'
                      }`}>
                        {isRevenue ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-rose-500" />}
                        ₹{Number(evt.amount || evt.cost || 0).toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={() => setViewingCostEventDetails(evt)}
                        className="mt-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl">
              <Activity className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-medium">No financial audit events logged yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Generated Tax Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Tax Invoices & Billing</span>
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {invoices.length} Invoices
            </span>
          </div>

          {invoices && invoices.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {invoices.map((inv: any) => (
                <div 
                  key={inv.id}
                  className="p-3.5 rounded-xl border border-zinc-200/80 hover:border-emerald-300 bg-zinc-50/50 hover:bg-white transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono text-zinc-950">{inv.invoiceNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status || 'ISSUED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-zinc-400" />
                      <span>Ref Dispatch: {project.dispatchNotes?.find((d: any) => d.id === inv.dispatchNoteId)?.dispatchNumber || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-700">
                      ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingInvoiceDetails(inv)}
                        className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 underline"
                      >
                        Details
                      </button>
                      
                      {inv.paymentStatus === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase">
                          PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            const balance = Number(inv.totalAmount) - Number(inv.amountPaid || 0);
                            setPaymentAmount(balance > 0 ? balance : Number(inv.totalAmount));
                            setShowPaymentModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-zinc-200 rounded-xl">
              <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-medium">No tax invoices generated yet.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setInvNum(`INV-${Date.now().toString().slice(-4)}`);
                  setShowInvoiceModal(true);
                }}
                className="mt-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Generate Invoice
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Labor Tracking Section */}
      <ProjectLaborTracking projectId={id} />

      {/* Generate Tax Invoice Modal */}
      {showInvoiceModal && (
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          title="Generate Tax Invoice"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Link to Dispatch Note
              </label>
              <select
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 font-medium"
                value={selectedDispatchId}
                onChange={(e) => setSelectedDispatchId(e.target.value)}
              >
                <option value="">Select Dispatch Note...</option>
                {project.dispatchNotes?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
                ))}
              </select>
              {(!project.dispatchNotes || project.dispatchNotes.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">Note: No dispatch notes recorded yet. Select any or create a dispatch note first.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono text-zinc-900 focus:border-emerald-500"
                value={invNum}
                onChange={(e) => setInvNum(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Subtotal Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono text-zinc-900 focus:border-emerald-500"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            {invAmount !== "" && Number(invAmount) > 0 && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(invAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>GST (18%):</span>
                  <span>₹{(Number(invAmount) * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-900 pt-1 border-t border-zinc-200">
                  <span>Total Invoice Amount:</span>
                  <span>₹{(Number(invAmount) * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowInvoiceModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Generate Invoice
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Record Customer Payment"
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Select Invoice
              </label>
              <select
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900 font-medium"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                <option value="">Select Invoice...</option>
                {invoices.map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - Total: ₹{Number(inv.totalAmount).toLocaleString()} ({inv.paymentStatus || 'UNPAID'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono text-zinc-900"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Payment Reference (Cheque / UTR / Bank Ref)
              </label>
              <input
                type="text"
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono text-zinc-900"
                placeholder="e.g. UTR123456789"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Remarks
              </label>
              <input
                type="text"
                className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm text-zinc-900"
                placeholder="Optional notes"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cost Event Details Modal */}
      {viewingCostEventDetails && (
        <Modal
          isOpen={!!viewingCostEventDetails}
          onClose={() => setViewingCostEventDetails(null)}
          title="Financial Event Narrative"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Event Type:</span>
                <span className="font-bold text-zinc-900 uppercase">{viewingCostEventDetails.costType?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Recorded Amount:</span>
                <span className="font-bold text-emerald-700 text-sm">₹{Number(viewingCostEventDetails.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date:</span>
                <span>{new Date(viewingCostEventDetails.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <span className="font-bold text-zinc-600 block mb-1">Description:</span>
              <p className="text-zinc-800 italic bg-white p-3 rounded border border-zinc-200">{viewingCostEventDetails.description}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingCostEventDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Details Modal */}
      {viewingInvoiceDetails && (
        <Modal
          isOpen={!!viewingInvoiceDetails}
          onClose={() => setViewingInvoiceDetails(null)}
          title={`Tax Invoice: ${viewingInvoiceDetails.invoiceNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <span className="text-xs font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {viewingInvoiceDetails.status || 'ISSUED'}
              </span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleExportInvoice(viewingInvoiceDetails)}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export Excel
              </Button>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Invoice Number:</span>
                <span className="font-bold text-zinc-900">{viewingInvoiceDetails.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal:</span>
                <span>₹{Number(viewingInvoiceDetails.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">GST (18%):</span>
                <span>₹{Number(viewingInvoiceDetails.taxAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-700 pt-1 border-t border-zinc-200">
                <span>Total Bill Amount:</span>
                <span>₹{Number(viewingInvoiceDetails.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {viewingInvoiceDetails.paymentReference && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Reference:</span>
                  <span className="font-bold text-zinc-900">{viewingInvoiceDetails.paymentReference}</span>
                </div>
                {viewingInvoiceDetails.paymentRemarks && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Remarks:</span>
                    <span>{viewingInvoiceDetails.paymentRemarks}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setViewingInvoiceDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
