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
  const costSummary: any = project.projectCostSummary || {};

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
    { title: "Total Cost", value: `₹${totalCost.toLocaleString('en-IN')}`, icon: PieChart, color: "text-ink", bg: "bg-canvas border-border-gray" },
    { title: "Material", value: `₹${actualMaterialCost.toLocaleString('en-IN')}`, icon: Wrench, color: "text-semantic-warning-dark", bg: "bg-semantic-warning-subtle border-semantic-warning/20" },
    { title: "Machine", value: `₹${machineCost.toLocaleString('en-IN')}`, icon: Settings, color: "text-primary", bg: "bg-primary-subtle border-primary/20" },
    { title: "Labour", value: `₹${labourCost.toLocaleString('en-IN')}`, icon: HardHat, color: "text-primary", bg: "bg-primary-subtle border-primary/20" },
    { title: "Subcontract", value: `₹${outsideProcessCost.toLocaleString('en-IN')}`, icon: Truck, color: "text-primary", bg: "bg-primary-subtle border-primary/20" },
    { title: "Revenue", value: `₹${revenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-semantic-success-dark", bg: "bg-semantic-success-subtle border-semantic-success/20", highlight: true },
    { title: "Margin", value: `${marginPct}%`, icon: Percent, color: "text-semantic-success-dark", bg: "bg-semantic-success-subtle border-semantic-success/20", highlight: true },
  ];

  const invoices = project.invoiceHeaders || [];
  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  return (
    <div className="space-y-6 font-sans text-ink">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Finance & Commercial Costing</h1>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Real-time financial audit trail, tax invoices, customer billing, and profitability analytics.
          </p>
        </div>

        {!isProjectClosed && (
          <div className="flex items-center gap-2">
            {project.currentStage === 'INVOICED' && (
              <Button
                variant="white"
                size="md"
                onClick={handleCloseProject}
                className="text-semantic-danger-dark border-semantic-danger/20 hover:bg-semantic-danger-subtle font-semibold text-xs"
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
              className="bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white font-semibold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Tax Invoice</span>
            </Button>
          </div>
        )}
      </div>

      {/* 7 KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={kpi.title} 
              className={`p-3.5 rounded-[12px] border ${kpi.bg} shadow-subtle flex flex-col justify-between`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-mute">
                  {kpi.title}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className={`text-base font-semibold font-mono ${kpi.color}`}>
                {kpi.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Financial Cost Allocation & Variance Chart */}
      <div className="enterprise-card p-6 bg-white border border-border-gray rounded-[12px] shadow-subtle">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          <span>Financial Cost Allocation & Cost Variance</span>
        </h3>
        <FinanceWaterfall data={financeChartData} />
      </div>

      {/* Two Column Layout: Financial Audit Trail vs Generated Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Financial Audit Trail */}
        <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-gray">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Financial Audit Trail</span>
            </h3>
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-widest">
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
                    className="p-3.5 rounded-[12px] border border-border-gray hover:border-border-gray bg-canvas/50 hover:bg-white transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${
                          isRevenue 
                            ? 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/20' 
                            : isEstimate 
                            ? 'bg-semantic-warning-subtle text-semantic-warning-dark border-semantic-warning/20' 
                            : 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/20'
                        }`}>
                          {evt.costType?.replace(/_/g, ' ') || 'COST EVENT'}
                        </span>
                        <span className="text-[10px] text-cool-gray font-mono">
                          {new Date(evt.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink line-clamp-1">{evt.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-semibold font-mono flex items-center justify-end ${
                        isRevenue ? 'text-semantic-success-dark' : 'text-ink'
                      }`}>
                        {isRevenue ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 text-semantic-success-dark" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-semantic-danger-dark" />}
                        ₹{Number(evt.amount || evt.cost || 0).toLocaleString('en-IN')}
                      </div>
                      <button
                        onClick={() => setViewingCostEventDetails(evt)}
                        className="mt-1 text-[10px] font-semibold text-mute hover:text-ink underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-border-gray rounded-[12px]">
              <Activity className="w-8 h-8 text-cool-gray mx-auto mb-2" />
              <p className="text-xs text-mute font-medium">No financial audit events logged yet.</p>
            </div>
          )}
        </div>

        {/* Right Column: Generated Tax Invoices */}
        <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-gray">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-semantic-success-dark" />
              <span>Tax Invoices & Billing</span>
            </h3>
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-widest">
              {invoices.length} Invoices
            </span>
          </div>

          {invoices && invoices.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {invoices.map((inv: any) => (
                <div 
                  key={inv.id}
                  className="p-3.5 rounded-[12px] border border-border-gray hover:border-primary/50 bg-canvas/50 hover:bg-white transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold font-mono text-ink">{inv.invoiceNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                        {inv.status || 'ISSUED'}
                      </span>
                    </div>
                    <div className="text-[10px] text-mute flex items-center gap-1">
                      <Truck className="w-3 h-3 text-cool-gray" />
                      <span>Ref Dispatch: {project.dispatchNotes?.find((d: any) => d.id === inv.dispatchNoteId)?.dispatchNumber || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold font-mono text-semantic-success-dark">
                      ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingInvoiceDetails(inv)}
                        className="text-[10px] font-semibold text-cool-gray hover:text-ink underline"
                      >
                        Details
                      </button>
                      
                      {inv.paymentStatus === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-semantic-success-subtle text-semantic-success-dark uppercase">
                          PAID
                        </span>
                      ) : !isProjectClosed ? (
                        <button
                          onClick={() => {
                            setSelectedInvoiceId(inv.id);
                            const balance = Number(inv.totalAmount) - Number(inv.amountPaid || 0);
                            setPaymentAmount(balance > 0 ? balance : Number(inv.totalAmount));
                            setShowPaymentModal(true);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
                        >
                          Record Payment
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-border-gray rounded-[12px]">
              <FileText className="w-8 h-8 text-cool-gray mx-auto mb-2" />
              <p className="text-xs text-mute font-medium">No tax invoices generated yet.</p>
              <Button
                variant="white"
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
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Link to Dispatch Note
              </label>
              <select
                required
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm text-ink focus:border-primary font-medium"
                value={selectedDispatchId}
                onChange={(e) => setSelectedDispatchId(e.target.value)}
              >
                <option value="">Select Dispatch Note...</option>
                {project.dispatchNotes?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.dispatchNumber} (Qty: {d.dispatchQty})</option>
                ))}
              </select>
              {(!project.dispatchNotes || project.dispatchNotes.length === 0) && (
                <p className="text-xs text-semantic-warning-dark mt-1">Note: No dispatch notes recorded yet. Select any or create a dispatch note first.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                required
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm font-mono text-ink focus:border-primary"
                value={invNum}
                onChange={(e) => setInvNum(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Subtotal Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm font-mono text-ink focus:border-primary"
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value ? Number(e.target.value) : "")}
              />
            </div>

            {invAmount !== "" && Number(invAmount) > 0 && (
              <div className="p-3 bg-canvas rounded-[12px] border border-border-gray text-xs space-y-1 font-mono">
                <div className="flex justify-between text-cool-gray">
                  <span>Subtotal:</span>
                  <span>₹{Number(invAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-cool-gray">
                  <span>GST (18%):</span>
                  <span>₹{(Number(invAmount) * 0.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-semibold text-semantic-success-dark pt-1 border-t border-border-gray">
                  <span>Total Invoice Amount:</span>
                  <span>₹{(Number(invAmount) * 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="white" onClick={() => setShowInvoiceModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white font-semibold">
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
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Select Invoice
              </label>
              <select
                required
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm text-ink font-medium"
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
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm font-mono text-ink"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Payment Reference (Cheque / UTR / Bank Ref)
              </label>
              <input
                type="text"
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm font-mono text-ink"
                placeholder="e.g. UTR123456789"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Remarks
              </label>
              <input
                type="text"
                className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-2 text-sm text-ink"
                placeholder="Optional notes"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="white" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white font-semibold">
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
            <div className="p-4 bg-canvas rounded-[12px] border border-border-gray space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-mute">Event Type:</span>
                <span className="font-semibold text-ink uppercase">{viewingCostEventDetails.costType?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Recorded Amount:</span>
                <span className="font-semibold text-semantic-success-dark text-sm">₹{Number(viewingCostEventDetails.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Date:</span>
                <span>{new Date(viewingCostEventDetails.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            <div className="p-4 bg-canvas rounded-[12px] border border-border-gray text-xs">
              <span className="font-semibold text-cool-gray block mb-1">Description:</span>
              <p className="text-ink italic bg-white p-3 rounded border border-border-gray">{viewingCostEventDetails.description}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="white" onClick={() => setViewingCostEventDetails(null)}>
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
            <div className="flex justify-between items-center pb-2 border-b border-border-gray">
              <span className="text-xs font-semibold uppercase text-semantic-success-dark bg-semantic-success-subtle px-2 py-0.5 rounded border border-semantic-success/20">
                {viewingInvoiceDetails.status || 'ISSUED'}
              </span>
              <Button 
                variant="white" 
                size="sm" 
                onClick={() => handleExportInvoice(viewingInvoiceDetails)}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export Excel
              </Button>
            </div>

            <div className="p-4 bg-canvas rounded-[12px] border border-border-gray space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-mute">Invoice Number:</span>
                <span className="font-semibold text-ink">{viewingInvoiceDetails.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Subtotal:</span>
                <span>₹{Number(viewingInvoiceDetails.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">GST (18%):</span>
                <span>₹{Number(viewingInvoiceDetails.taxAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-semantic-success-dark pt-1 border-t border-border-gray">
                <span>Total Bill Amount:</span>
                <span>₹{Number(viewingInvoiceDetails.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>

            {viewingInvoiceDetails.paymentReference && (
              <div className="p-3 bg-canvas rounded-[12px] border border-border-gray text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-mute">Payment Reference:</span>
                  <span className="font-semibold text-ink">{viewingInvoiceDetails.paymentReference}</span>
                </div>
                {viewingInvoiceDetails.paymentRemarks && (
                  <div className="flex justify-between">
                    <span className="text-mute">Remarks:</span>
                    <span>{viewingInvoiceDetails.paymentRemarks}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="white" onClick={() => setViewingInvoiceDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
