"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
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
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/formatters";

type DispatchTab = "CHALLANS" | "INVOICES" | "PRINTABLE_DC";

export default function ProjectDispatchPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<DispatchTab>("CHALLANS");
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Form States
  const [challanForm, setChallanForm] = useState({
    vehicleNumber: "MH-12-PQ-8842",
    driverName: "Ramesh Pawar",
    driverPhone: "+91 98234 56789",
    transporterName: "VRL Logistics Ltd",
    itemDescription: "Main Press Tooling Die Set Assembly & Tryout Samples",
    quantity: "1 NOS",
    grossWeight: "450 KG",
    remarks: "Outward delivery to Mahindra & Mahindra Chakan Plant",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    basicValue: 220000,
    gstPercent: 18,
    remarks: "Final billing against Taxable Tooling Supply Order",
  });

  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <SkeletonBox className="h-96 w-full" />;

  const dispatchNotes = project?.dispatchNotes || [];
  const invoices = project?.invoiceHeaders || [];

  const totalDispatches = dispatchNotes.length;
  const totalInvoices = invoices.length;
  const invoicedRevenue = invoices.reduce((acc: number, inv: any) => acc + (Number(inv.totalValue) || Number(inv.subtotal) || 0), 0);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowChallanModal(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowInvoiceModal(false);
  };

  const handlePrintChallan = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-zinc-900">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              <span>Dispatch & Logistics Command Center</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              {project?.currentStage?.replace(/_/g, " ") || "DISPATCH"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Outward Delivery Challans (DC), vehicle logistics gate passes, and GST Customer Tax Invoicing
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowChallanModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Delivery Challan</span>
          </button>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Issue Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dispatches */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Delivery Challans</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{totalDispatches}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Outward gate passes generated</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Weight Dispatched */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Outward Tool Weight</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">450 KG</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Die set & tryout samples</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Invoices Issued */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tax Invoices Issued</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{totalInvoices}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">GST Tax Invoice records</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoiced Value */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Invoiced Revenue</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{formatCurrency(invoicedRevenue || 220000)}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Total billed to customer</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("CHALLANS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "CHALLANS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Truck className="w-4 h-4 text-orange-600" />
          <span>Delivery Challans ({dispatchNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("INVOICES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "INVOICES" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Customer Tax Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PRINTABLE_DC")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRINTABLE_DC" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Printer className="w-4 h-4 text-zinc-700" />
          <span>Printable Outward DC</span>
        </button>
      </div>

      {/* Tab 1: Delivery Challans */}
      {activeTab === "CHALLANS" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Outward Delivery Challan Register</h3>
              <p className="text-xs text-zinc-500">Log of gate passes and vehicle transport details for customer delivery</p>
            </div>
            <button
              onClick={() => setShowChallanModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Delivery Challan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Challan #</th>
                  <th className="p-3">Vehicle Number</th>
                  <th className="p-3">Driver & Transporter</th>
                  <th className="p-3">Gross Weight</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Dispatch Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {dispatchNotes.length > 0 ? (
                  dispatchNotes.map((dc: any) => (
                    <tr key={dc.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-700">{dc.dispatchNumber}</td>
                      <td className="p-3 font-bold text-zinc-900">{dc.vehicleNumber}</td>
                      <td className="p-3 text-zinc-600">{dc.driverName || "VRL Logistics"}</td>
                      <td className="p-3 font-mono font-bold text-zinc-800">{dc.grossWeight || "450 KG"}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {dc.status || "DISPATCHED"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-500">
                        {new Date(dc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
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
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Customer GST Tax Invoices</h3>
              <p className="text-xs text-zinc-500">Billed tax invoices and payment status against customer PO</p>
            </div>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Issue Tax Invoice</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3 text-right">Basic Value (₹)</th>
                  <th className="p-3 text-right">GST 18% (₹)</th>
                  <th className="p-3 text-right">Total Invoice (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {invoices.length > 0 ? (
                  invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-bold text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="p-3 font-sans font-bold text-zinc-900">{project?.customer?.companyName || "Mahindra & Mahindra"}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(inv.subtotal || inv.basicValue)}</td>
                      <td className="p-3 text-right text-zinc-500">{formatCurrency((inv.subtotal || inv.basicValue) * 0.18)}</td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatCurrency(inv.totalValue || inv.subtotal * 1.18)}</td>
                      <td className="p-3 text-center font-sans">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {inv.status || "ISSUED"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 italic font-sans">
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
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs print:hidden">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Official Outward Delivery Challan (DC)</h3>
              <p className="text-xs text-zinc-500">Printable Gate Pass document for goods dispatch</p>
            </div>
            <button
              onClick={handlePrintChallan}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Challan</span>
            </button>
          </div>

          {/* Challan Document Container */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-300 shadow-md space-y-6 text-zinc-900 font-sans max-w-4xl mx-auto print:border-none print:shadow-none">
            {/* Challan Header */}
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">ToolRoom OS Manufacturing Inc.</h1>
                <p className="text-xs text-zinc-500 font-medium">Precision Press Tools, Dies & Moulds Manufacturing Unit</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-black rounded-lg uppercase tracking-wider border border-orange-300">
                  OUTWARD DELIVERY CHALLAN
                </span>
                <p className="text-[11px] font-mono text-zinc-500 mt-1">DC #: DC-{project?.projectNumber || "PRJ"}-01</p>
              </div>
            </div>

            {/* Consignee & Vehicle Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Consignee / Customer</span>
                <div className="font-bold text-zinc-900 text-sm">{project?.customer?.companyName || "Mahindra & Mahindra Ltd."}</div>
                <div className="text-zinc-500">Chakan Industrial Area, Pune - 410501</div>
              </div>
              <div className="space-y-1">
                <div><span className="text-zinc-500 text-[10px] uppercase font-bold">Vehicle No:</span> <span className="font-bold font-mono text-zinc-900">MH-12-PQ-8842</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-bold">Driver Name:</span> <span className="font-bold text-zinc-900">Ramesh Pawar</span></div>
                <div><span className="text-zinc-500 text-[10px] uppercase font-bold">Transporter:</span> <span className="font-bold text-zinc-900">VRL Logistics Ltd.</span></div>
              </div>
            </div>

            {/* Item Table */}
            <div>
              <table className="w-full text-left text-xs border border-zinc-300 divide-y divide-zinc-200">
                <thead className="bg-zinc-100 text-zinc-700 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border-r">Item Description</th>
                    <th className="p-2 border-r text-right">Quantity</th>
                    <th className="p-2 border-r text-right">Gross Weight</th>
                    <th className="p-2">Remarks / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="p-2 border-r font-bold text-zinc-900">{project?.partName || "Main Press Tooling Die Set Assembly"}</td>
                    <td className="p-2 border-r text-right font-mono font-bold">1 NOS</td>
                    <td className="p-2 border-r text-right font-mono font-bold">450 KG</td>
                    <td className="p-2 text-zinc-600">Final Tool Delivery against Customer PO</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r font-bold text-zinc-900">Stamped Component Samples (T0 / T1 Tryout)</td>
                    <td className="p-2 border-r text-right font-mono font-bold">25 NOS</td>
                    <td className="p-2 border-r text-right font-mono font-bold">12 KG</td>
                    <td className="p-2 text-zinc-600">Initial Tryout Samples for CMM Approval</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sign-off Stamps */}
            <div className="pt-8 border-t border-zinc-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-zinc-400 italic">
                  [ Dispatch Officer Signature ]
                </div>
                <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                  ToolRoom OS Stores & Logistics
                </div>
              </div>

              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-zinc-400 italic">
                  [ Security Gate Stamp & Signature ]
                </div>
                <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                required
                value={challanForm.vehicleNumber}
                onChange={(e) => setChallanForm({ ...challanForm, vehicleNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Driver Name & Contact</label>
              <input
                type="text"
                value={challanForm.driverName}
                onChange={(e) => setChallanForm({ ...challanForm, driverName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Item Description</label>
              <input
                type="text"
                value={challanForm.itemDescription}
                onChange={(e) => setChallanForm({ ...challanForm, itemDescription: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Gross Weight (KG)</label>
              <input
                type="text"
                value={challanForm.grossWeight}
                onChange={(e) => setChallanForm({ ...challanForm, grossWeight: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Dispatch Remarks</label>
            <textarea
              rows={2}
              value={challanForm.remarks}
              onChange={(e) => setChallanForm({ ...challanForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowChallanModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Basic Taxable Value (₹)</label>
              <input
                type="number"
                value={invoiceForm.basicValue}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, basicValue: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                value={invoiceForm.gstPercent}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, gstPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1 font-mono">
            <div className="flex justify-between"><span>Basic Value:</span> <span>{formatCurrency(invoiceForm.basicValue)}</span></div>
            <div className="flex justify-between text-zinc-500"><span>GST (18%):</span> <span>{formatCurrency(invoiceForm.basicValue * (invoiceForm.gstPercent / 100))}</span></div>
            <div className="flex justify-between font-bold text-emerald-900 text-sm border-t border-emerald-200 pt-1">
              <span>Total Invoice Bill:</span>
              <span>{formatCurrency(invoiceForm.basicValue * (1 + invoiceForm.gstPercent / 100))}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowInvoiceModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              <DollarSign className="w-4 h-4 text-white" />
              <span>Issue GST Tax Invoice</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
