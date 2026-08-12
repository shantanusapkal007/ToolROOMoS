"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject, useCompleteProject, projectKeys } from "@/hooks/useProjects";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import {
  Truck,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Package,
  DollarSign,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
  AlertTriangle,
  Sparkles,
  Lock,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/formatters";

type DispatchTab = "CHALLANS" | "INVOICES" | "PRINTABLE_DC";

export default function ProjectDispatchPage() {
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<DispatchTab>("CHALLANS");
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState("");

  // Form States
  const [challanForm, setChallanForm] = useState({
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    transporterName: "",
    itemDescription: "",
    quantity: "",
    grossWeight: "",
    remarks: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    basicValue: 0,
    gstPercent: 18,
    remarks: "",
  });

  const { data: project, isLoading } = useProject(id);
  const completeProjectMutation = useCompleteProject(id);

  if (isLoading) return <SkeletonBox className="h-96 w-full" />;

  const dispatchNotes = project?.dispatchNotes || [];
  const invoices = project?.invoiceHeaders || [];

  const totalDispatches = dispatchNotes.length;
  const totalInvoices = invoices.length;
  const invoicedRevenue = invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalValue) || Number(inv.subtotal) || 0), 0);
  const totalWeight = dispatchNotes.reduce((acc: number, dc: any) => acc + (Number(dc.grossWeight) || 0), 0);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`projects/${id}/dispatch-notes`, challanForm);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      setShowChallanModal(false);
      setChallanForm({
        vehicleNumber: "",
        driverName: "",
        driverPhone: "",
        transporterName: "",
        itemDescription: "",
        quantity: "",
        grossWeight: "",
        remarks: "",
      });
      success("Delivery Challan Created", "Outward dispatch note generated successfully.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Challan Creation Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'CANCELLED';
  const canCompleteProject = !isProjectClosed;

  const handleCompleteProject = () => {
    completeProjectMutation.mutate(completionRemarks || undefined, {
      onSuccess: () => {
        setShowCompleteModal(false);
        setCompletionRemarks("");
      },
    });
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`projects/${id}/invoices`, invoiceForm);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      setShowInvoiceModal(false);
      setInvoiceForm({
        basicValue: 0,
        gstPercent: 18,
        remarks: "",
      });
      success("Tax Invoice Issued", "Customer Tax Invoice created successfully.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Invoice Creation Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintChallan = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Dispatch & Logistics Command Center</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
              {project?.currentStage?.replace(/_/g, " ") || "DISPATCH"}
            </span>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Outward Delivery Challans (DC), vehicle logistics gate passes, and GST Customer Tax Invoicing
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!isProjectClosed && (
            <>
              <button
                onClick={() => setShowChallanModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Delivery Challan</span>
              </button>

              <button
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Issue Tax Invoice</span>
              </button>
            </>
          )}

          {canCompleteProject && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-semantic-warning-dark hover:bg-semantic-warning-dark/90 text-white text-xs font-semibold shadow-subtle transition-all cursor-pointer border border-semantic-warning/20 uppercase tracking-wider"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>Mark Project Completed</span>
            </button>
          )}

          {isProjectClosed && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-canvas text-mute text-xs font-semibold border border-border-gray">
              <Lock className="w-4 h-4" />
              <span>Project Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dispatches */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Delivery Challans</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalDispatches}</div>
            <div className="text-[10px] text-mute mt-0.5">Outward gate passes generated</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Weight Dispatched */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Outward Tool Weight</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalWeight > 0 ? `${totalWeight} KG` : '—'}</div>
            <div className="text-[10px] text-mute mt-0.5">Total dispatched weight</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Invoices Issued */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Tax Invoices Issued</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalInvoices}</div>
            <div className="text-[10px] text-mute mt-0.5">GST Tax Invoice records</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoiced Value */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Invoiced Revenue</div>
            <div className="text-2xl font-semibold text-semantic-success-dark mt-0.5">{formatCurrency(invoicedRevenue)}</div>
            <div className="text-[10px] text-mute mt-0.5">Total billed to customer</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-canvas rounded-[12px] border border-border-gray overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("CHALLANS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "CHALLANS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Truck className="w-4 h-4 text-primary" />
          <span>Delivery Challans ({dispatchNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("INVOICES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "INVOICES" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <DollarSign className="w-4 h-4 text-semantic-success-dark" />
          <span>Customer Tax Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PRINTABLE_DC")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRINTABLE_DC" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Printer className="w-4 h-4 text-cool-gray" />
          <span>Printable Outward DC</span>
        </button>
      </div>

      {/* Tab 1: Delivery Challans */}
      {activeTab === "CHALLANS" && (
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Outward Delivery Challan Register</h3>
              <p className="text-xs text-mute">Log of gate passes and vehicle transport details for customer delivery</p>
            </div>
            <button
              onClick={() => setShowChallanModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Delivery Challan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Challan #</th>
                  <th className="p-3">Vehicle Number</th>
                  <th className="p-3">Driver & Transporter</th>
                  <th className="p-3">Gross Weight</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {dispatchNotes.length > 0 ? (
                  dispatchNotes.map((dc: any) => (
                    <tr key={dc.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{dc.dispatchNumber}</td>
                      <td className="p-3 font-semibold text-ink">{dc.vehicleNumber}</td>
                      <td className="p-3 text-cool-gray">{dc.driverName || '—'}</td>
                      <td className="p-3 font-mono font-semibold text-ink">{dc.grossWeight ? `${dc.grossWeight} KG` : '—'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                          {dc.status || "DISPATCHED"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-mute">
                        {new Date(dc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cool-gray italic">
                      No delivery challans recorded for this project yet. Click 'Generate Delivery Challan' to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Customer Tax Invoices */}
      {activeTab === "INVOICES" && (
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Customer GST Tax Invoices</h3>
              <p className="text-xs text-mute">Billed tax invoices and payment status against customer PO</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-semantic-success-dark text-white text-xs font-semibold shadow-subtle cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Issue Tax Invoice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3 text-right">Basic Value (₹)</th>
                  <th className="p-3 text-right">GST 18% (₹)</th>
                  <th className="p-3 text-right">Total Invoice (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray font-mono">
                {invoices.length > 0 ? (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-semibold text-semantic-success-dark">{inv.invoiceNumber}</td>
                      <td className="p-3 font-sans font-semibold text-ink">{project?.customer?.companyName || "Mahindra & Mahindra"}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(inv.subtotal || inv.basicValue)}</td>
                      <td className="p-3 text-right text-mute">{formatCurrency((inv.subtotal || inv.basicValue) * 0.18)}</td>
                      <td className="p-3 text-right font-semibold text-semantic-success-dark">{formatCurrency(inv.totalValue || inv.subtotal * 1.18)}</td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                          {inv.status || "ISSUED"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cool-gray italic font-sans">
                      No tax invoices generated yet for this project. Click 'Issue Tax Invoice' to bill the customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Printable Delivery Challan (DC) */}
      {activeTab === "PRINTABLE_DC" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle print:hidden">
            <div>
              <h3 className="text-sm font-semibold text-ink">Official Outward Delivery Challan (DC)</h3>
              <p className="text-xs text-mute">Printable Gate Pass document for goods dispatch</p>
            </div>
            <button
              onClick={handlePrintChallan}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Challan</span>
            </button>
          </div>

          {/* Challan Document Container */}
          <div className="bg-white p-8 rounded-[12px] border border-border-gray shadow-subtle space-y-6 text-ink font-sans max-w-4xl mx-auto print:border-none print:shadow-none">
            {/* Challan Header */}
            <div className="flex items-center justify-between border-b-2 border-border-gray pb-4">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-ink uppercase">ToolRoom OS Manufacturing Inc.</h1>
                <p className="text-xs text-mute font-medium">Precision Press Tools, Dies & Moulds Manufacturing Unit</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-primary-subtle text-primary text-xs font-semibold rounded-[12px] uppercase tracking-wider border border-primary/20">
                  OUTWARD DELIVERY CHALLAN
                </span>
                <p className="text-[11px] font-mono text-mute mt-1">DC #: DC-{project?.projectNumber || "PRJ"}-01</p>
              </div>
            </div>

            {/* Consignee & Vehicle Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-canvas rounded-[12px] border border-border-gray text-xs">
              <div>
                <span className="text-mute text-[10px] uppercase font-semibold">Consignee / Customer</span>
                <div className="font-semibold text-ink text-sm">{project?.customer?.companyName || "Mahindra & Mahindra Ltd."}</div>
                <div className="text-mute">Chakan Industrial Area, Pune - 410501</div>
              </div>
              <div className="space-y-1">
                <div><span className="text-mute text-[10px] uppercase font-semibold">Vehicle No:</span> <span className="font-semibold font-mono text-ink">{challanForm.vehicleNumber || "N/A"}</span></div>
                <div><span className="text-mute text-[10px] uppercase font-semibold">Driver Name:</span> <span className="font-semibold text-ink">{challanForm.driverName || "N/A"}</span></div>
                <div><span className="text-mute text-[10px] uppercase font-semibold">Transporter:</span> <span className="font-semibold text-ink">{challanForm.transporterName || "N/A"}</span></div>
              </div>
            </div>

            {/* Item Table */}
            <div>
              <table className="w-full text-left text-xs border border-border-gray divide-y divide-border-gray">
                <thead className="bg-canvas text-cool-gray font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border-r border-border-gray">Item Description</th>
                    <th className="p-2 border-r border-border-gray text-right">Quantity</th>
                    <th className="p-2 border-r border-border-gray text-right">Gross Weight</th>
                    <th className="p-2">Remarks / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {dispatchNotes.length > 0 ? dispatchNotes.map((dc: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-border-gray font-semibold text-ink">{dc.itemDescription || project?.partName || '—'}</td>
                      <td className="p-2 border-r border-border-gray text-right font-mono font-semibold">{dc.quantity || '—'}</td>
                      <td className="p-2 border-r border-border-gray text-right font-mono font-semibold">{dc.grossWeight ? `${dc.grossWeight} KG` : '—'}</td>
                      <td className="p-2 text-cool-gray">{dc.remarks || '—'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-cool-gray italic">No dispatch records to display</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sign-off Stamps */}
            <div className="pt-8 border-t border-border-gray grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-cool-gray italic">
                  [ Dispatch Officer Signature ]
                </div>
                <div className="border-t border-border-gray pt-1 font-semibold text-ink">
                  ToolRoom OS Stores & Logistics
                </div>
              </div>

              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-cool-gray italic">
                  [ Security Gate Stamp & Signature ]
                </div>
                <div className="border-t border-border-gray pt-1 font-semibold text-ink">
                  Security Gate Outward Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Challan Modal */}
      <Modal
        isOpen={showChallanModal}
        onClose={() => setShowChallanModal(false)}
        title="Generate Outward Delivery Challan"
        subtitle={`Create delivery gate pass for ${project?.projectNumber || id}`}
      >
        <form onSubmit={handleCreateChallan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Vehicle Number</label>
              <input
                type="text"
                required
                value={challanForm.vehicleNumber}
                onChange={(e) => setChallanForm({ ...challanForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Driver Name & Contact</label>
              <input
                type="text"
                value={challanForm.driverName}
                onChange={(e) => setChallanForm({ ...challanForm, driverName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-ink mb-1">Item Description</label>
              <input
                type="text"
                value={challanForm.itemDescription}
                onChange={(e) => setChallanForm({ ...challanForm, itemDescription: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Gross Weight (KG)</label>
              <input
                type="text"
                value={challanForm.grossWeight}
                onChange={(e) => setChallanForm({ ...challanForm, grossWeight: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Dispatch Remarks</label>
            <textarea
              rows={2}
              value={challanForm.remarks}
              onChange={(e) => setChallanForm({ ...challanForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowChallanModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-[12px] shadow-sm cursor-pointer"
            >
              <Truck className="w-4 h-4 text-white" />
              <span>Generate Delivery Challan</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Tax Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title="Issue Customer GST Tax Invoice"
        subtitle={`Generate final tax billing for ${project?.projectNumber || id}`}
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Basic Taxable Value (₹)</label>
              <input
                type="number"
                value={invoiceForm.basicValue}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, basicValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                value={invoiceForm.gstPercent}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, gstPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              />
            </div>
          </div>

          <div className="p-3.5 bg-semantic-success-subtle rounded-[12px] border border-semantic-success/20 text-xs text-ink space-y-1 font-mono">
            <div className="flex justify-between"><span>Basic Value:</span> <span>{formatCurrency(invoiceForm.basicValue)}</span></div>
            <div className="flex justify-between text-mute"><span>GST (18%):</span> <span>{formatCurrency(invoiceForm.basicValue * (invoiceForm.gstPercent / 100))}</span></div>
            <div className="flex justify-between font-semibold text-semantic-success-dark text-sm border-t border-semantic-success/20 pt-1">
              <span>Total Invoice Bill:</span>
              <span>{formatCurrency(invoiceForm.basicValue * (1 + invoiceForm.gstPercent / 100))}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-semantic-success-dark hover:bg-semantic-success-dark/90 rounded-[12px] shadow-sm cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-white" />
              <span>Issue GST Tax Invoice</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Project Completed Confirmation Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Mark Project as Completed"
        subtitle={`Confirm completion for ${project?.projectNumber || id}`}
      >
        <div className="space-y-5">
          {/* Completion Summary Banner */}
          <div className="p-4 bg-semantic-warning-subtle rounded-[12px] border border-semantic-warning/20 space-y-3">
            <div className="flex items-center gap-2 text-semantic-warning-dark">
              <BadgeCheck className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Project Completion Summary</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-canvas p-3 rounded-[12px] border border-border-gray">
                <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Project</div>
                <div className="font-semibold text-ink mt-0.5">{project?.projectNumber}</div>
                <div className="text-mute text-[10px]">{project?.partName}</div>
              </div>
              <div className="bg-canvas p-3 rounded-[12px] border border-border-gray">
                <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Customer</div>
                <div className="font-semibold text-ink mt-0.5">{project?.customer?.companyName || "—"}</div>
              </div>
              <div className="bg-canvas p-3 rounded-[12px] border border-border-gray">
                <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Dispatch Challans</div>
                <div className="font-semibold text-ink mt-0.5 text-lg">{totalDispatches}</div>
              </div>
              <div className="bg-canvas p-3 rounded-[12px] border border-border-gray">
                <div className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Invoiced Revenue</div>
                <div className="font-semibold text-semantic-success-dark mt-0.5">{formatCurrency(invoicedRevenue || 0)}</div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-semantic-warning-subtle rounded-[12px] border border-semantic-warning/20 text-xs text-semantic-warning-dark">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">This action will close the project permanently.</span> The project stage will be set to CLOSED, actual delivery date will be recorded, and progress will be set to 100%. This action cannot be undone.
            </div>
          </div>

          {/* Completion Remarks */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Completion Remarks (Optional)</label>
            <textarea
              rows={2}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="e.g. All deliverables shipped and accepted by customer..."
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas placeholder:text-mute"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowCompleteModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteProject}
              disabled={completeProjectMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-semantic-warning-dark hover:bg-semantic-warning-dark/90 rounded-[12px] shadow-subtle hover:shadow-subtle transition-all cursor-pointer uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completeProjectMutation.isPending ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm & Complete Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
