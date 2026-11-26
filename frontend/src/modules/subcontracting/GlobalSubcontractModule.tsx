"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Trash2,
  Building2,
  Package,
  Wrench,
  Clock,
  Layers,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { SubcontractingService } from "@/services/subcontracting.service";
import { MultiProjectSubcontractWizard } from "./MultiProjectSubcontractWizard";
import { AuthenticSubcontractPoDocument } from "./AuthenticSubcontractPoDocument";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/formatters";

export function GlobalSubcontractModule() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Print Document State (single order OR multi-project batch under same documentNumber + vendorId)
  const [printSelection, setPrintSelection] = useState<{
    order: any;
    orders?: any[];
  } | null>(null);

  // Action Modals State
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>({
    subcontractOrderId: "",
    documentNumber: "",
    remarks: "",
    items: [],
  });
  const [cancelOrder, setCancelOrder] = useState<any>(null);
  const [deleteOrder, setDeleteOrder] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const list = await SubcontractingService.getAllGlobalOrders();
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch global subcontract orders:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group count by gate pass documentNumber + vendorId so we can tag Multi-Project batches
  const batchGroupMap = useMemo(() => {
    const map = new Map<string, any[]>();
    orders.forEach((o) => {
      if (o.documentNumber && o.vendorId) {
        const key = `${o.documentNumber}::${o.vendorId}`;
        const list = map.get(key) || [];
        list.push(o);
        map.set(key, list);
      }
    });
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.challanNumber?.toLowerCase().includes(q) ||
        o.documentNumber?.toLowerCase().includes(q) ||
        o.vendor?.vendorName?.toLowerCase().includes(q) ||
        o.project?.projectNumber?.toLowerCase().includes(q) ||
        o.project?.partName?.toLowerCase().includes(q) ||
        o.items?.some((it: any) =>
          it.operation?.operationName?.toLowerCase().includes(q),
        )
      );
    });
  }, [orders, statusFilter, searchQuery]);

  // KPI Metrics
  const totalOrders = orders.length;
  const totalValue = orders.reduce(
    (sum, o) => sum + Number(o.totalEstimatedCost || 0),
    0,
  );
  const pendingReturns = orders.filter(
    (o) => o.status === "ISSUED" || o.status === "PARTIAL_RECEIPT",
  ).length;

  const openReceiptModal = (order: any) => {
    setReceiptOrder(order);
    setReceiptData({
      subcontractOrderId: order.id,
      documentNumber: `REC-${Date.now().toString().slice(-4)}`,
      remarks: "",
      items: (order.items || []).map((item: any) => ({
        orderItemId: item.id,
        operationName: item.operation?.operationName || "Subcontract Operation",
        materialInfo: item.inventoryBatch
          ? `${item.inventoryBatch.material?.materialGrade || item.inventoryBatch.material?.materialName || "Material"} (Batch: ${item.inventoryBatch.batchNumber})`
          : null,
        sentQty: Number(item.sentQty) || 1,
        hoursPerPc: Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1,
        receivedQty: Number(item.sentQty) || 1,
        acceptedQty: Number(item.sentQty) || 1,
        rejectedQty: 0,
        actualRate: Number(item.rate) || 0,
        remarks: "",
      })),
    });
  };

  const handleProcessReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptOrder) return;
    try {
      setIsActionLoading(true);
      await SubcontractingService.createReceipt(receiptOrder.projectId, receiptOrder.id, {
        ...receiptData,
        subcontractOrderId: receiptOrder.id,
        items: (receiptData.items || []).map((item: any) => ({
          orderItemId: item.orderItemId,
          receivedQty: Number(item.receivedQty) || 0,
          acceptedQty: Number(item.acceptedQty) || 0,
          rejectedQty: Number(item.rejectedQty) || 0,
          hoursPerPc: Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1,
          actualRate: Number(item.actualRate) || 0,
          remarks: item.remarks || "",
        })),
      });
      setReceiptOrder(null);
      fetchOrders();
      success(
        "Receipt Completed",
        "Return receipt posted. Accepted parts replenished back into Stores.",
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      error("Receipt Failed", Array.isArray(msg) ? msg.join(", ") : msg || err?.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder) return;
    try {
      setIsActionLoading(true);
      await SubcontractingService.cancelOrder(cancelOrder.projectId, cancelOrder.id);
      success(
        "Challan Cancelled",
        `Challan ${cancelOrder.challanNumber} cancelled and deducted stores inventory restored.`,
      );
      setCancelOrder(null);
      setPrintSelection(null);
      fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      error("Cancellation Failed", Array.isArray(msg) ? msg.join(", ") : msg || err?.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrder) return;
    try {
      setIsActionLoading(true);
      await SubcontractingService.deleteOrder(deleteOrder.projectId, deleteOrder.id);
      success(
        "Challan Deleted",
        `Subcontract Challan ${deleteOrder.challanNumber} permanently deleted.`,
      );
      setDeleteOrder(null);
      setPrintSelection(null);
      fetchOrders();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      error("Deletion Failed", Array.isArray(msg) ? msg.join(", ") : msg || err?.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-ink font-sans pb-24 mb-10">
      {/* Page Header */}
      <PageHeader
        title="Outsource Job Work & Subcontracting"
        description="Issue multi-project vendor job work challans, track factory material lineage, and process returns"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Subcontracting", href: "/outsource-orders" },
          { label: "Outsource Challans" },
        ]}
        icon={<Truck className="w-5 h-5 text-primary" />}
        actions={
          <Tabs
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab as "create" | "history");
              setPrintSelection(null);
            }}
            tabs={[
              {
                id: "create",
                label: "Create Multi-Project Challan",
                icon: <Plus className="w-3.5 h-3.5" />,
              },
              {
                id: "history",
                label: `Outsource Register (${totalOrders})`,
                icon: <FileText className="w-3.5 h-3.5" />,
              },
            ]}
          />
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 hide-on-print">
        <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-small font-semibold text-cool-gray uppercase tracking-wider">
              Issued Challans
            </div>
            <div className="text-heading-xl font-mono font-bold text-ink mt-1">
              {totalOrders}
            </div>
            <div className="text-small text-cool-gray mt-0.5">
              Project job work orders
            </div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle flex items-center justify-center text-primary">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-small font-semibold text-cool-gray uppercase tracking-wider">
              Total Outsource Value
            </div>
            <div className="text-heading-xl font-mono font-bold text-semantic-success-dark mt-1">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-small text-cool-gray mt-0.5">
              Estimated job work cost (Excl. GST)
            </div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-small font-semibold text-cool-gray uppercase tracking-wider">
              Pending Returns
            </div>
            <div className="text-heading-xl font-mono font-bold text-semantic-warning-dark mt-1">
              {pendingReturns}
            </div>
            <div className="text-small text-cool-gray mt-0.5">
              Awaiting vendor return receipt
            </div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-warning-subtle flex items-center justify-center text-semantic-warning-dark">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {printSelection ? (
        <AuthenticSubcontractPoDocument
          order={printSelection.order}
          orders={printSelection.orders}
          project={printSelection.order?.project}
          onBack={() => {
            setPrintSelection(null);
            fetchOrders();
          }}
          onCancel={
            !printSelection.orders &&
            printSelection.order.status !== "CLOSED" &&
            printSelection.order.status !== "CANCELLED" &&
            (!printSelection.order.subcontractReceipts ||
              printSelection.order.subcontractReceipts.length === 0)
              ? () => setCancelOrder(printSelection.order)
              : undefined
          }
          onDelete={
            !printSelection.orders &&
            printSelection.order.status !== "CLOSED" &&
            printSelection.order.status !== "PARTIAL_RECEIPT" &&
            (!printSelection.order.subcontractReceipts ||
              printSelection.order.subcontractReceipts.length === 0)
              ? () => setDeleteOrder(printSelection.order)
              : undefined
          }
        />
      ) : activeTab === "create" ? (
        <MultiProjectSubcontractWizard
          onSuccess={() => {
            fetchOrders();
            setActiveTab("history");
          }}
        />
      ) : (
        /* Outsource Register Tab */
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden space-y-4 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-body font-semibold text-ink">
                Outsource Job Work Register
              </h3>
              <p className="text-small text-cool-gray">
                Track all single &amp; multi-project vendor challans, stores stock lineage, and inward receipts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-canvas p-1 rounded-[10px] border border-border-gray">
                {[
                  { id: "ALL", label: "All" },
                  { id: "ISSUED", label: "Outsourced" },
                  { id: "PARTIAL_RECEIPT", label: "Partial" },
                  { id: "CLOSED", label: "Closed" },
                  { id: "CANCELLED", label: "Cancelled" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-[8px] text-small font-medium transition-all cursor-pointer ${
                      statusFilter === st.id
                        ? "bg-white text-ink shadow-subtle border border-border-gray"
                        : "text-cool-gray hover:text-ink"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <SearchInput
                context="local"
                placeholder="Search challan, gate pass, vendor, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                containerClassName="w-full sm:w-72"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-border-gray rounded-[12px]">
            <table className="w-full text-left text-caption">
              <thead className="bg-canvas border-b border-border-gray text-cool-gray uppercase text-small font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Challan / Gate Pass</th>
                  <th className="py-3 px-4 whitespace-nowrap">Project / Tool</th>
                  <th className="py-3 px-4 whitespace-nowrap">Job Work Vendor</th>
                  <th className="py-3 px-4 whitespace-nowrap">Operations &amp; Material</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Est. Cost</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <SkeletonBox className="h-10 w-full" />
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((row) => {
                    const batchKey =
                      row.documentNumber && row.vendorId
                        ? `${row.documentNumber}::${row.vendorId}`
                        : "";
                    const batchOrders = batchKey ? batchGroupMap.get(batchKey) || [] : [];
                    const isPartOfBatch = batchOrders.length > 1;
                    const hasReceipts =
                      (row.subcontractReceipts && row.subcontractReceipts.length > 0) ||
                      row.status === "PARTIAL_RECEIPT" ||
                      row.status === "CLOSED";
                    const isCancelled = row.status === "CANCELLED";

                    const hasMaterial = row.items?.some((it: any) => it.inventoryBatch);

                    return (
                      <tr key={row.id} className="hover:bg-canvas/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-ink">
                            {row.challanNumber}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {row.documentNumber && (
                              <span className="text-small font-mono text-cool-gray">
                                GP: {row.documentNumber}
                              </span>
                            )}
                            {isPartOfBatch && (
                              <span className="inline-flex items-center gap-1 text-small font-medium px-1.5 py-0.2 rounded bg-primary-subtle text-primary border border-primary/20">
                                <Layers className="w-3 h-3" />
                                <span>{batchOrders.length} Tools</span>
                              </span>
                            )}
                          </div>
                          <div className="text-small font-mono text-cool-gray mt-0.5">
                            {formatDate(row.createdAt)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {row.project ? (
                            <Link
                              href={`/projects/${row.project.id}/subcontract`}
                              className="group block"
                            >
                              <span className="font-mono font-semibold text-primary group-hover:underline">
                                {row.project.projectNumber}
                              </span>
                              <span className="block text-small text-cool-gray truncate max-w-[180px]">
                                {row.project.partName || row.project.name}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-cool-gray">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-cool-gray shrink-0" />
                            <span className="font-semibold text-ink">
                              {row.vendor?.vendorName || "Outsource Vendor"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="text-caption font-medium text-ink">
                              {row.items
                                ?.map((it: any) => it.operation?.operationName || "Operation")
                                .join(", ")}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {hasMaterial ? (
                                row.items
                                  ?.filter((it: any) => it.inventoryBatch)
                                  .map((it: any, i: number) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 text-small font-mono px-2 py-0.5 rounded bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20 whitespace-nowrap"
                                    >
                                      <Package className="w-3 h-3" />
                                      <span>
                                        {it.inventoryBatch.material?.materialGrade || "Material"} (
                                        {Number(it.sentQty)} pcs)
                                      </span>
                                    </span>
                                  ))
                              ) : (
                                <span className="inline-flex items-center gap-1 text-small font-mono px-2 py-0.5 rounded bg-canvas text-cool-gray border border-border-gray whitespace-nowrap">
                                  <Wrench className="w-3 h-3" />
                                  <span>Service Only</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-ink whitespace-nowrap">
                          {formatCurrency(row.totalEstimatedCost || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <StatusBadge status={row.status || "ISSUED"} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPartOfBatch && (
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Layers className="w-3.5 h-3.5 text-primary" />}
                                onClick={() =>
                                  setPrintSelection({
                                    order: row,
                                    orders: batchOrders,
                                  })
                                }
                                title="Print combined Multi-Project Challan for all projects in this Gate Pass"
                              >
                                Batch PO
                              </Button>
                            )}

                            <Button
                              variant="white"
                              size="sm"
                              leftIcon={<Printer className="w-3.5 h-3.5 text-cool-gray" />}
                              onClick={() => setPrintSelection({ order: row })}
                            >
                              Print
                            </Button>

                            {!hasReceipts && !isCancelled && (
                              <Button
                                variant="white"
                                size="sm"
                                leftIcon={
                                  <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success-dark" />
                                }
                                className="text-semantic-success-dark"
                                onClick={() => openReceiptModal(row)}
                              >
                                Receive
                              </Button>
                            )}

                            {!hasReceipts && !isCancelled && (
                              <Button
                                variant="white"
                                size="sm"
                                leftIcon={
                                  <XCircle className="w-3.5 h-3.5 text-semantic-warning-dark" />
                                }
                                className="text-semantic-warning-dark"
                                onClick={() => setCancelOrder(row)}
                              >
                                Cancel
                              </Button>
                            )}

                            {!hasReceipts && (
                              <Button
                                variant="white"
                                size="sm"
                                leftIcon={<Trash2 className="w-3.5 h-3.5 text-semantic-danger" />}
                                className="text-cool-gray hover:text-semantic-danger"
                                onClick={() => setDeleteOrder(row)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-cool-gray">
                      No outsource challans found. Switch to &ldquo;Create Multi-Project Challan&rdquo; to issue one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Receipt Modal */}
      <Modal
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        title="Process Outsource Return Receipt"
        subtitle={`Verify returned quantities for ${receiptOrder?.project?.projectNumber || ""} (${receiptOrder?.challanNumber || ""}).`}
        maxWidth="4xl"
      >
        <form onSubmit={handleProcessReceipt} className="space-y-5">
          <div className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 space-y-4 shadow-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Receipt Document #"
                required
                value={receiptData.documentNumber}
                onChange={(e) =>
                  setReceiptData({ ...receiptData, documentNumber: e.target.value })
                }
              />

              <Input
                label="Inspection / Receipt Remarks"
                placeholder="e.g. Hardness verified OK, surface finish accepted..."
                value={receiptData.remarks}
                onChange={(e) => setReceiptData({ ...receiptData, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-body font-semibold text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Return Inspection &amp; Quantities</span>
            </h4>

            <div className="space-y-4">
              {receiptData.items?.map((item: any, idx: number) => {
                const acceptedQty = Number(item.acceptedQty) || 0;
                const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
                const actualRate = Number(item.actualRate) || 0;
                const totalAcceptedHours = acceptedQty * hoursPerPc;
                const lineProcessCost = totalAcceptedHours * actualRate;

                return (
                  <div
                    key={idx}
                    className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 shadow-subtle space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-gray">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-small font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-ink text-body">
                          {item.operationName}
                        </span>
                      </div>

                      {item.materialInfo ? (
                        <span className="text-small font-mono px-3 py-1 rounded-[6px] bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20 flex items-center gap-1.5 font-medium">
                          <Package className="w-3.5 h-3.5" />
                          <span>
                            Stores Lineage: {item.materialInfo} (Sent: {item.sentQty} pcs)
                          </span>
                        </span>
                      ) : (
                        <span className="text-small font-mono px-3 py-1 rounded-[6px] bg-canvas text-cool-gray border border-border-gray">
                          Service Only
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                      <Input
                        label="Received Qty"
                        type="number"
                        value={item.receivedQty}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          updated[idx].receivedQty = val;
                          updated[idx].acceptedQty = val;
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                      <Input
                        label="Accepted Qty"
                        type="number"
                        value={item.acceptedQty}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          updated[idx].acceptedQty =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                      <Input
                        label="Rejected Qty"
                        type="number"
                        value={item.rejectedQty}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          updated[idx].rejectedQty =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                      <Input
                        label="Hours / Pc"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={item.hoursPerPc ?? 1}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          updated[idx].hoursPerPc =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                      <Input
                        label="Rate / Hr (₹)"
                        type="number"
                        step="0.01"
                        value={item.actualRate}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          updated[idx].actualRate =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-caption font-mono text-cool-gray pt-2 border-t border-border-gray">
                      <span>
                        Machining:{" "}
                        <strong className="text-ink font-bold">
                          {totalAcceptedHours.toFixed(1)} hrs
                        </strong>{" "}
                        ({acceptedQty} pcs × {hoursPerPc} hrs/pc @ ₹{actualRate}/hr)
                      </span>
                      <span>
                        Line Process Cost:{" "}
                        <strong className="text-ink font-bold text-body">
                          {formatCurrency(lineProcessCost)}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-gray">
            <Button
              variant="white"
              size="lg"
              type="button"
              onClick={() => setReceiptOrder(null)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit" isLoading={isActionLoading}>
              Post Return Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelOrder}
        onClose={() => setCancelOrder(null)}
        title="Cancel Subcontract Challan"
        subtitle={`Confirm cancellation of Challan ${cancelOrder?.challanNumber || ""}.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="bg-semantic-warning-subtle/40 border border-semantic-warning/30 rounded-[12px] p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-semantic-warning-dark shrink-0 mt-0.5" />
            <div className="space-y-1 text-caption text-ink">
              <p className="font-semibold text-semantic-warning-dark">
                Are you sure you want to cancel this Subcontract Challan?
              </p>
              <p className="text-small text-cool-gray leading-relaxed">
                Challan <strong className="font-mono text-ink">{cancelOrder?.challanNumber}</strong>{" "}
                for vendor <strong className="text-ink">{cancelOrder?.vendor?.vendorName}</strong>{" "}
                will be marked as <strong>CANCELLED</strong>.
              </p>
              {cancelOrder?.items?.some((it: any) => it.inventoryBatchId) && (
                <p className="text-small text-semantic-success-dark font-medium pt-1">
                  ✓ Any physical raw materials deducted from stores will be automatically restored back to available inventory.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setCancelOrder(null)} disabled={isActionLoading}>
              Keep Order
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelOrder}
              isLoading={isActionLoading}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Cancel Subcontract Challan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        title="Delete Subcontract Challan"
        subtitle={`Permanently remove Challan ${deleteOrder?.challanNumber || ""}.`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="bg-semantic-danger-subtle/40 border border-semantic-danger/30 rounded-[12px] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-semantic-danger-dark shrink-0 mt-0.5" />
            <div className="space-y-1 text-caption text-ink">
              <p className="font-semibold text-semantic-danger-dark">
                Are you sure you want to permanently delete this Subcontract Challan?
              </p>
              <p className="text-small text-cool-gray leading-relaxed">
                Challan <strong className="font-mono text-ink">{deleteOrder?.challanNumber}</strong>{" "}
                and all its item specifications will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setDeleteOrder(null)} disabled={isActionLoading}>
              No, Keep
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteOrder}
              isLoading={isActionLoading}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
