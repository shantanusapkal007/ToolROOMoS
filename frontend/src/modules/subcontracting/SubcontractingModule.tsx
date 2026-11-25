"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { 
  Truck, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Package, 
  Wrench, 
  Calendar, 
  Building2, 
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Check,
  Printer,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SmartTable } from "../../components/ui/SmartTable";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { useProject } from "@/hooks/useProjects";
import { AuthenticSubcontractPoDocument } from "./AuthenticSubcontractPoDocument";

interface SubcontractingModuleProps {
  projectId: string;
}

function formatBatchOption(batch: any): string {
  if (!batch) return '';
  const grade = batch.material?.materialGrade || batch.material?.materialName || 'Raw Material';
  let num = batch.batchNumber || '';
  if (num.length > 20 && num.includes('-')) {
    const parts = num.split('-');
    num = parts.slice(0, 3).join('-');
  }
  const heat = batch.heatNumber && batch.heatNumber !== 'N/A' ? ` • Heat: ${batch.heatNumber}` : '';
  const uom = batch.material?.uom || 'NOS';
  return `${grade} [${num}${heat}] — ${batch.availableQty} ${uom} Available`;
}

export function SubcontractingModule({ projectId }: SubcontractingModuleProps) {
  const { data: project } = useProject(projectId);
  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  const { success, error } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<any>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<any>(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Master Data
  const [vendors, setVendors] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<{
    vendorId: string;
    documentNumber: string;
    expectedReturnDate: string;
    remarks: string;
    items: {
      operationId: string;
      sentQty: number;
      rate: number;
      remarks: string;
      sendMaterial: boolean;
      inventoryBatchId: string;
      hoursPerPc?: number;
    }[];
  }>({
    vendorId: "",
    documentNumber: `CHL-${Date.now().toString().slice(-4)}`,
    expectedReturnDate: "",
    remarks: "",
    items: [
      {
        operationId: "",
        sentQty: 1,
        hoursPerPc: 1,
        rate: 0,
        remarks: "",
        sendMaterial: true,
        inventoryBatchId: "",
      }
    ],
  });

  const [receiptData, setReceiptData] = useState<{
    subcontractOrderId?: string;
    documentNumber: string;
    remarks: string;
    items: {
      orderItemId: string;
      operationName?: string;
      materialInfo?: string | null;
      heatNumber?: string | null;
      sentQty?: number;
      hoursPerPc?: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      actualRate: number;
      remarks: string;
    }[];
  }>({
    subcontractOrderId: "",
    documentNumber: "",
    remarks: "",
    items: [{ orderItemId: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, actualRate: 0, remarks: "" }],
  });

  useEffect(() => {
    loadData();
    loadMasterData();
  }, [projectId]);

  const extractArray = (res: any) => {
    const body = res?.data;
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && body.data && Array.isArray(body.data.data)) return body.data.data;
    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`projects/${projectId}/subcontract-orders`);
      setOrders(extractArray(res));
    } catch (err) {
      console.error('Failed to load subcontract orders', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const [vRes, oRes, bRes] = await Promise.all([
        api.get('master-data/vendors'),
        api.get('master-data/operations'),
        api.get(`projects/${projectId}/inventory-batches`).catch(() => api.get('production/inventory-batches')),
      ]);

      const vList = extractArray(vRes);
      setVendors(vList.filter((v: any) => v.vendorType !== 'MATERIAL_SUPPLIER'));

      const oList = extractArray(oRes);
      setOperations(oList);

      const bList = extractArray(bRes);
      const validBatches = bList.filter((b: any) => Number(b.availableQty) > 0);
      setAvailableBatches(validBatches);

      // Auto-select first batch if items have none
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(it => ({
          ...it,
          inventoryBatchId: it.inventoryBatchId || (validBatches[0]?.id || '')
        }))
      }));
    } catch (err) {
      console.error('Failed to load subcontracting master data', err);
    }
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          operationId: operations[0]?.id || "",
          sentQty: 1,
          hoursPerPc: 1,
          rate: 0,
          remarks: "",
          sendMaterial: true,
          inventoryBatchId: availableBatches[0]?.id || "",
        }
      ]
    }));
  };

  const removeItemRow = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.items];
      (updated[idx] as any)[field] = value;
      return { ...prev, items: updated };
    });
  };

  const openReceiptModal = (order: any) => {
    setSelectedOrder(order);
    setReceiptData({
      subcontractOrderId: order.id,
      documentNumber: `REC-${Date.now().toString().slice(-4)}`,
      remarks: "",
      items: order.items.map((item: any) => ({
        orderItemId: item.id,
        operationName: item.operation?.operationName || 'Subcontract Operation',
        materialInfo: item.inventoryBatch
          ? `${item.inventoryBatch.material?.materialGrade || item.inventoryBatch.material?.materialName || 'Material'} (Batch: ${item.inventoryBatch.batchNumber})`
          : null,
        heatNumber: item.inventoryBatch?.heatNumber || null,
        sentQty: Number(item.sentQty) || 1,
        hoursPerPc: Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1,
        receivedQty: Number(item.sentQty) || 1,
        acceptedQty: Number(item.sentQty) || 1,
        rejectedQty: 0,
        actualRate: Number(item.rate) || 0,
        remarks: ""
      }))
    });
    setIsReceiptModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId) {
      error("Vendor Required", "Please select an outsource job work vendor.");
      return;
    }

    if (formData.items.length === 0) {
      error("Items Required", "Please add at least one outsource operation line.");
      return;
    }

    // Validation for material issuance
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.operationId) {
        error("Operation Required", `Line #${i + 1}: Please select an outsource operation.`);
        return;
      }
      if (item.sendMaterial && !item.inventoryBatchId) {
        error("Missing Material", `Line #${i + 1}: Has 'Factory Material' selected but no inventory batch chosen.`);
        return;
      }
      if (item.sendMaterial && item.inventoryBatchId) {
        const batch = availableBatches.find((b: any) => b.id === item.inventoryBatchId);
        if (batch && Number(item.sentQty) > Number(batch.availableQty)) {
          error("Stock Exceeded", `Line #${i + 1}: Sent quantity (${item.sentQty}) exceeds available store stock (${batch.availableQty}).`);
          return;
        }
      }
    }

    try {
      const payload = {
        ...formData,
        expectedReturnDate: formData.expectedReturnDate?.trim() ? formData.expectedReturnDate : undefined,
        items: formData.items.map((item) => ({
          operationId: item.operationId,
          sentQty: Number(item.sentQty) || 0,
          hoursPerPc: Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1,
          rate: Number(item.rate) || 0,
          remarks: item.remarks || "",
          inventoryBatchId: item.sendMaterial && item.inventoryBatchId ? item.inventoryBatchId : undefined,
        })),
      };

      const res = await api.post(`projects/${projectId}/subcontract-orders`, payload);
      setIsOrderModalOpen(false);
      // Reset form
      setFormData({
        vendorId: "",
        documentNumber: `CHL-${Date.now().toString().slice(-4)}`,
        expectedReturnDate: "",
        remarks: "",
        items: [
          {
            operationId: operations[0]?.id || "",
            sentQty: 1,
            hoursPerPc: 1,
            rate: 0,
            remarks: "",
            sendMaterial: true,
            inventoryBatchId: availableBatches[0]?.id || "",
          }
        ],
      });
      loadData();
      loadMasterData();

      const createdOrder = res?.data?.data || res?.data;
      if (createdOrder) {
        setSelectedPrintOrder(createdOrder);
      }
      success("Challan Generated", "Outsource challan created. Opening PO document for printing.");
    } catch (err: any) {
      error("Create Failed", err.response?.data?.message || err.message);
    }
  };

  const handleProcessReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const payload = {
        ...receiptData,
        subcontractOrderId: selectedOrder.id,
        items: (receiptData.items || []).map((item: any) => ({
          orderItemId: item.orderItemId,
          receivedQty: Number(item.receivedQty) || 0,
          acceptedQty: Number(item.acceptedQty) || 0,
          rejectedQty: Number(item.rejectedQty) || 0,
          hoursPerPc: Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1,
          actualRate: Number(item.actualRate) || 0,
          remarks: item.remarks || ""
        }))
      };
      await api.post(`projects/${projectId}/subcontract-orders/${selectedOrder.id}/receipt`, payload);
      setIsReceiptModalOpen(false);
      loadData();
      loadMasterData();
      success("Receipt Completed", "Return receipt posted. Accepted parts replenished back into Stores.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Receipt Failed", Array.isArray(msg) ? msg.join(', ') : (msg || err.message));
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    try {
      setIsActionLoading(true);
      await api.post(`projects/${projectId}/subcontract-orders/${cancelModalOrder.id}/cancel`);
      success(
        "Challan Cancelled",
        `Subcontract Challan ${cancelModalOrder.challanNumber} cancelled. Issued store material restored to inventory.`
      );
      setCancelModalOrder(null);
      if (selectedPrintOrder?.id === cancelModalOrder.id) {
        setSelectedPrintOrder(null);
      }
      loadData();
      loadMasterData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Cancellation Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteModalOrder) return;
    try {
      setIsActionLoading(true);
      await api.delete(`projects/${projectId}/subcontract-orders/${deleteModalOrder.id}`);
      success(
        "Challan Deleted",
        `Subcontract Challan ${deleteModalOrder.challanNumber} has been permanently deleted.`
      );
      setDeleteModalOrder(null);
      if (selectedPrintOrder?.id === deleteModalOrder.id) {
        setSelectedPrintOrder(null);
      }
      loadData();
      loadMasterData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Deletion Failed", Array.isArray(msg) ? msg.join(", ") : (msg || err.message));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Calculations for Order Modal Summary
  const totalOrderUnits = formData.items.reduce((sum, item) => sum + (Number(item.sentQty) || 0), 0);
  const totalOrderHours = formData.items.reduce(
    (sum, item) => sum + ((Number(item.sentQty) || 0) * (Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1)),
    0
  );
  const totalOrderEstimatedCost = formData.items.reduce(
    (sum, item) =>
      sum +
      ((Number(item.sentQty) || 0) *
        (Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1) *
        (Number(item.rate) || 0)),
    0
  );
  const materialLinesCount = formData.items.filter(item => item.sendMaterial && item.inventoryBatchId).length;

  const columns = [
    {
      key: 'challanNumber',
      label: 'Challan #',
      render: (val: string, row: any) => (
        <div>
          <span className="font-mono font-semibold text-ink">{val || 'CHL-001'}</span>
          <div className="text-small font-mono text-cool-gray">{formatDate(row.createdAt)}</div>
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Job Work Vendor',
      render: (val: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cool-gray shrink-0" />
          <span className="font-semibold text-ink">{val?.vendorName || 'Outsource Vendor'}</span>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Operations & Material',
      render: (items: any[]) => {
        const hasMaterial = items?.some((it: any) => it.inventoryBatch);
        return (
          <div className="space-y-1">
            <div className="font-mono text-ink text-caption font-medium">
              {items?.length || 1} Outsource Line(s)
            </div>
            <div className="flex flex-wrap gap-1">
              {hasMaterial ? (
                items?.filter((it: any) => it.inventoryBatch).map((it: any, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-small font-mono px-2 py-0.5 rounded bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{it.inventoryBatch.material?.materialGrade || 'Material'} ({Number(it.sentQty)} pcs)</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 text-small font-mono px-2 py-0.5 rounded bg-canvas text-cool-gray border border-border-gray">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Service Only</span>
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'totalEstimatedCost',
      label: 'Est Cost',
      render: (val: number) => <span className="font-mono font-semibold text-ink">{formatCurrency(val || 0)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => {
        const isClosed = val === 'CLOSED';
        const isPartial = val === 'PARTIAL_RECEIPT';
        const isCancelled = val === 'CANCELLED';
        return (
          <span className={`text-small font-semibold px-2.5 py-0.5 rounded border ${
            isClosed 
              ? 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/30' 
              : isPartial
              ? 'bg-semantic-warning-subtle text-semantic-warning-dark border-semantic-warning/30'
              : isCancelled
              ? 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30'
              : 'bg-canvas text-ink border-border-gray'
          }`}>
            {val || 'OUTSOURCED'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => {
        const hasReceipts = (row.subcontractReceipts && row.subcontractReceipts.length > 0) || row.status === 'PARTIAL_RECEIPT' || row.status === 'CLOSED';
        const isCancelled = row.status === 'CANCELLED';

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button 
              variant="white" 
              size="sm" 
              onClick={() => setSelectedPrintOrder(row)}
              className="flex items-center gap-1.5"
              title="Print Subcontract Job Work PO & Delivery Challan"
            >
              <Printer className="w-3.5 h-3.5 text-cool-gray" />
              <span>Print PO</span>
            </Button>

            {!isProjectClosed && !hasReceipts && !isCancelled && (
              <Button 
                variant="white" 
                size="sm" 
                onClick={() => openReceiptModal(row)}
                className="flex items-center gap-1 text-semantic-success-dark hover:bg-semantic-success-subtle/40"
                title="Process returned parts from outside vendor"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success-dark" />
                <span>Receive</span>
              </Button>
            )}

            {!isProjectClosed && !hasReceipts && !isCancelled && (
              <Button 
                variant="white" 
                size="sm" 
                onClick={() => setCancelModalOrder(row)}
                className="flex items-center gap-1 text-semantic-warning-dark hover:bg-semantic-warning-subtle/50"
                title="Cancel Subcontract Challan & restore deducted store inventory"
              >
                <XCircle className="w-3.5 h-3.5 text-semantic-warning-dark" />
                <span>Cancel</span>
              </Button>
            )}

            {!isProjectClosed && !hasReceipts && (
              <Button 
                variant="white" 
                size="sm" 
                onClick={() => setDeleteModalOrder(row)}
                className="flex items-center gap-1 text-cool-gray hover:text-semantic-danger hover:bg-semantic-danger-subtle/40"
                title="Permanently delete this subcontract challan"
              >
                <Trash2 className="w-3.5 h-3.5 text-semantic-danger" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  if (selectedPrintOrder) {
    return (
      <>
        <AuthenticSubcontractPoDocument
          order={selectedPrintOrder}
          project={project}
          onBack={() => {
            setSelectedPrintOrder(null);
            loadData();
          }}
          onCancel={
            !isProjectClosed && 
            selectedPrintOrder.status !== 'CLOSED' && 
            selectedPrintOrder.status !== 'CANCELLED' && 
            (!selectedPrintOrder.subcontractReceipts || selectedPrintOrder.subcontractReceipts.length === 0)
              ? () => setCancelModalOrder(selectedPrintOrder)
              : undefined
          }
          onDelete={
            !isProjectClosed && 
            selectedPrintOrder.status !== 'CLOSED' && 
            selectedPrintOrder.status !== 'PARTIAL_RECEIPT' &&
            (!selectedPrintOrder.subcontractReceipts || selectedPrintOrder.subcontractReceipts.length === 0)
              ? () => setDeleteModalOrder(selectedPrintOrder)
              : undefined
          }
        />

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={!!cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          title="Cancel Subcontract Challan"
          subtitle={`Confirm cancellation of Challan ${cancelModalOrder?.challanNumber || ''}.`}
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
                  Challan <strong className="font-mono text-ink">{cancelModalOrder?.challanNumber}</strong> for vendor <strong className="text-ink">{cancelModalOrder?.vendor?.vendorName}</strong> will be marked as <strong>CANCELLED</strong>.
                </p>
                {cancelModalOrder?.items?.some((it: any) => it.inventoryBatchId) && (
                  <p className="text-small text-semantic-success-dark font-medium pt-1">
                    ✓ Any physical raw materials deducted from stores will be automatically restored back to available inventory.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
              <Button
                variant="white"
                onClick={() => setCancelModalOrder(null)}
                disabled={isActionLoading}
              >
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
          isOpen={!!deleteModalOrder}
          onClose={() => setDeleteModalOrder(null)}
          title="Delete Subcontract Challan"
          subtitle={`Permanently remove Challan ${deleteModalOrder?.challanNumber || ''}.`}
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
                  Challan <strong className="font-mono text-ink">{deleteModalOrder?.challanNumber}</strong> and all its item specifications will be permanently removed.
                </p>
                {deleteModalOrder?.items?.some((it: any) => it.inventoryBatchId) && deleteModalOrder?.status !== 'CANCELLED' && (
                  <p className="text-small text-semantic-success-dark font-medium pt-1">
                    ✓ Any physical materials issued from stores will be replenished back into warehouse stock.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
              <Button
                variant="white"
                onClick={() => setDeleteModalOrder(null)}
                disabled={isActionLoading}
              >
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
      </>
    );
  }

  const totalCost = orders.reduce((sum, o) => sum + Number(o.totalEstimatedCost || 0), 0);

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-12">
      
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle">
        <div>
          <h3 className="text-card-title font-semibold text-ink flex items-center gap-2">
            <Truck className="w-5 h-5 text-cool-gray" />
            <span>Subcontracting & Outside Job Work</span>
          </h3>
          <p className="text-caption text-mute mt-0.5">
            Manage vendor job work orders, outward gate passes, and track raw material issued and returned end-to-end.
          </p>
        </div>

        {!isProjectClosed && (
          <div className="flex items-center gap-2">
            <Button variant="primary" size="md" onClick={() => setIsOrderModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Create Outsource Challan</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stat Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <span className="text-small font-semibold uppercase tracking-wider text-cool-gray">Total Subcontract Cost</span>
          <div className="text-2xl font-semibold font-mono text-ink my-1">{formatCurrency(totalCost)}</div>
          <span className="text-small text-cool-gray">Outsourced Work Value</span>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <span className="text-small font-semibold uppercase tracking-wider text-cool-gray">Active Subcontract Orders</span>
          <div className="text-2xl font-semibold font-mono text-ink my-1">{orders.length}</div>
          <span className="text-small text-cool-gray">Issued Challans</span>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <span className="text-small font-semibold uppercase tracking-wider text-cool-gray">Completed Receipts</span>
          <div className="text-2xl font-semibold font-mono text-semantic-success-dark my-1">
            {orders.filter(o => o.status === 'CLOSED').length}
          </div>
          <span className="text-small text-cool-gray">Returned Store Lineage</span>
        </div>
      </div>

      {/* Hero Table */}
      <SmartTable 
        title="Subcontracting & Job Work Register"
        columns={columns}
        data={orders}
        isLoading={loading}
        exportFilename="Subcontract_Orders"
      />

      {/* ========================================================================= */}
      {/* Redesigned Clean & Intuitive Outsource Challan Modal                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Outsource Job Work Challan"
        subtitle="Issue vendor job work order for heat treatment, plating, or precision machining."
        maxWidth="4xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6">
          
          {/* Step 1: Challan Header Details */}
          <div className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 space-y-4 shadow-subtle">
            <div className="flex items-center gap-2 text-caption font-semibold text-ink">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Challan & Vendor Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Job Work Vendor"
                required
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              >
                <option value="">Select Vendor...</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.vendorName}</option>
                ))}
              </Select>

              <Input 
                label="Challan / Gate Pass #"
                required
                placeholder="e.g. CHL-7502"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              />

              <Input 
                label="Expected Return Date"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
              />
            </div>
          </div>

          {/* Step 2: Outsource Operation Lines & Material Tracking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-body font-semibold text-ink flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span>Outsource Items & Work Scope</span>
                </h4>
                <p className="text-caption text-cool-gray mt-0.5">
                  Define operations, machining hours, hourly rate, and material origin.
                </p>
              </div>
              <Button variant="white" size="sm" type="button" onClick={addItemRow}>
                <Plus className="w-4 h-4 text-ink" />
                <span>Add Another Item</span>
              </Button>
            </div>

            <div className="space-y-5">
              {formData.items.map((item, idx) => {
                const selectedBatch = availableBatches.find((b: any) => b.id === item.inventoryBatchId);
                const isStockExceeded = selectedBatch && Number(selectedBatch.availableQty) < Number(item.sentQty);
                const sentQty = Number(item.sentQty) || 0;
                const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
                const rate = Number(item.rate) || 0;
                const totalLineHours = sentQty * hoursPerPc;
                const lineEstimatedCost = totalLineHours * rate;

                return (
                  <div 
                    key={idx} 
                    className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 shadow-subtle space-y-5 transition-all"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border-gray">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-body font-semibold text-ink">
                          Line Item #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-small text-cool-gray block">Line Estimate</span>
                          <span className="text-body font-mono font-bold text-ink">
                            {formatCurrency(lineEstimatedCost)}
                          </span>
                        </div>

                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-cool-gray hover:text-semantic-danger p-1.5 rounded-[8px] hover:bg-canvas transition-colors cursor-pointer"
                            title="Remove this line item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Material Sending Decision: Clear Segmented Toggle */}
                    <div className="space-y-2">
                      <label className="block text-caption font-medium text-ink">
                        Material Source for this Operation
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option A: Factory Material */}
                        <div
                          onClick={() => {
                            updateItemRow(idx, 'sendMaterial', true);
                            if (availableBatches.length > 0 && !item.inventoryBatchId) {
                              updateItemRow(idx, 'inventoryBatchId', availableBatches[0].id);
                            }
                          }}
                          className={`cursor-pointer rounded-[10px] p-3.5 border transition-all flex items-start gap-3 ${
                            item.sendMaterial
                              ? 'border-primary bg-primary-subtle/20 shadow-subtle'
                              : 'border-border-gray bg-white hover:border-cool-gray/40'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            item.sendMaterial ? 'border-primary bg-primary text-white' : 'border-border-gray bg-white'
                          }`}>
                            {item.sendMaterial && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-caption font-semibold text-ink">
                              <Package className="w-4 h-4 text-semantic-success-dark" />
                              <span>Factory Stores Material</span>
                            </div>
                            <p className="text-small text-cool-gray leading-relaxed">
                              Issue parts from factory stock. Deducts quantity and tracks returned piece.
                            </p>
                          </div>
                        </div>

                        {/* Option B: Service Only */}
                        <div
                          onClick={() => {
                            updateItemRow(idx, 'sendMaterial', false);
                            updateItemRow(idx, 'inventoryBatchId', '');
                          }}
                          className={`cursor-pointer rounded-[10px] p-3.5 border transition-all flex items-start gap-3 ${
                            !item.sendMaterial
                              ? 'border-primary bg-primary-subtle/20 shadow-subtle'
                              : 'border-border-gray bg-white hover:border-cool-gray/40'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            !item.sendMaterial ? 'border-primary bg-primary text-white' : 'border-border-gray bg-white'
                          }`}>
                            {!item.sendMaterial && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-caption font-semibold text-ink">
                              <Wrench className="w-4 h-4 text-cool-gray" />
                              <span>Service / Vendor Material</span>
                            </div>
                            <p className="text-small text-cool-gray leading-relaxed">
                              Labor or vendor-supplied stock. No factory inventory will be deducted.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* If Factory Material: Show Stores Batch Picker Card */}
                    {item.sendMaterial && (
                      <div className="bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] p-4 space-y-3 shadow-subtle">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-caption font-semibold text-ink flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-semantic-success-dark" />
                            <span>Select Material Batch to Deduct</span>
                          </span>

                          {selectedBatch && (
                            <span className={`text-small font-mono font-medium px-2.5 py-1 rounded-[6px] border ${
                              isStockExceeded
                                ? 'bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30 font-semibold'
                                : 'bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/30'
                            }`}>
                              Available in Stores: {selectedBatch.availableQty} {selectedBatch.material?.uom || 'NOS'}
                            </span>
                          )}
                        </div>

                        <select
                          value={item.inventoryBatchId || ''}
                          onChange={(e) => updateItemRow(idx, 'inventoryBatchId', e.target.value)}
                          className="w-full bg-white border border-border-gray rounded-[10px] px-3.5 py-2.5 text-caption text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-subtle"
                        >
                          <option value="">Select inventory batch from stores...</option>
                          {availableBatches.map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {formatBatchOption(b)}
                            </option>
                          ))}
                        </select>

                        {availableBatches.length === 0 && (
                          <div className="flex items-center gap-2 text-small text-semantic-warning-dark bg-semantic-warning-subtle/50 px-3 py-2 rounded-[8px] border border-semantic-warning/20">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>No available inventory batches found in active stores for this project.</span>
                          </div>
                        )}

                        {isStockExceeded && (
                          <div className="flex items-center gap-2 text-small text-semantic-danger-dark bg-semantic-danger-subtle/50 px-3 py-2 rounded-[8px] border border-semantic-danger/20 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Sent quantity ({item.sentQty}) exceeds available store stock ({selectedBatch?.availableQty}).</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Operational Details Grid: Operation, Sent Qty, Hours/Pc, Rate/Hour */}
                    <div className="space-y-3">
                      <Select
                        label="Outsource Operation"
                        required
                        value={item.operationId}
                        onChange={(e) => updateItemRow(idx, 'operationId', e.target.value)}
                      >
                        <option value="">Select Operation...</option>
                        {operations.map((op: any) => (
                          <option key={op.id} value={op.id}>{op.operationName}</option>
                        ))}
                      </Select>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input 
                          label="Sent Qty (Pcs)"
                          type="number"
                          min="1"
                          required
                          value={item.sentQty}
                          onChange={(e) => updateItemRow(idx, 'sentQty', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                        />

                        <Input 
                          label="Hours per Pc"
                          type="number"
                          min="0.1"
                          step="0.1"
                          required
                          placeholder="e.g. 1.0"
                          value={item.hoursPerPc ?? 1}
                          onChange={(e) => updateItemRow(idx, 'hoursPerPc', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                        />

                        <Input 
                          label="Rate per Hour (₹)"
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 450"
                          value={item.rate}
                          onChange={(e) => updateItemRow(idx, 'rate', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Machining Hours Calculation Strip */}
                    <div className="bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption shadow-subtle">
                      <div className="flex items-center gap-2 text-cool-gray">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>Machining Scope:</span>
                        <strong className="font-mono text-ink text-body font-bold">{totalLineHours.toFixed(1)} hrs</strong>
                        <span className="text-small text-cool-gray">({sentQty} pcs × {hoursPerPc} hrs/pc)</span>
                      </div>

                      <div className="flex items-center gap-2 text-cool-gray">
                        <span>Line Basic:</span>
                        <strong className="font-mono text-ink text-body font-bold">{formatCurrency(lineEstimatedCost)}</strong>
                        <span className="text-small text-cool-gray">(@ ₹{rate}/hr)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 space-y-2 shadow-subtle">
            <label className="block text-caption font-medium text-ink flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>Gate Pass Notes / Special Instructions</span>
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Record hardness specs (e.g. 58-62 HRC), coating thickness, delivery challan instructions..."
              className="w-full bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] p-3 text-caption text-ink placeholder:text-silver-blue focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none shadow-subtle"
            />
          </div>

          {/* Live Order Summary Footer */}
          <div className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-subtle">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-small font-medium text-cool-gray block">Operations</span>
                <span className="text-body font-mono font-bold text-ink">{formData.items.length} Line{formData.items.length === 1 ? '' : 's'}</span>
              </div>
              <div>
                <span className="text-small font-medium text-cool-gray block">Total Pieces</span>
                <span className="text-body font-mono font-bold text-ink">{totalOrderUnits} pcs</span>
              </div>
              <div>
                <span className="text-small font-medium text-cool-gray block">Total Machining</span>
                <span className="text-body font-mono font-bold text-primary">{totalOrderHours.toFixed(1)} hrs</span>
              </div>
              <div>
                <span className="text-small font-medium text-cool-gray block">Stores Lineage</span>
                <span className={`text-body font-mono font-bold ${materialLinesCount > 0 ? 'text-semantic-success-dark' : 'text-cool-gray'}`}>
                  {materialLinesCount} batch{materialLinesCount === 1 ? '' : 'es'}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-border-gray">
              <span className="text-small font-semibold uppercase tracking-wider text-cool-gray block">
                Total Estimated Cost (Excl. GST)
              </span>
              <span className="text-heading-xl font-mono font-bold text-ink block mt-0.5">
                {formatCurrency(totalOrderEstimatedCost)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border-gray">
            <Button variant="white" size="lg" type="button" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit">
              Create Subcontract Challan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* Redesigned Return Receipt Modal with Stores Lineage                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Process Outsource Return Receipt"
        subtitle="Verify returned quantities, record QC inspection, and replenish stores inventory."
        maxWidth="4xl"
      >
        <form onSubmit={handleProcessReceipt} className="space-y-5">
          <div className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 space-y-4 shadow-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Receipt Document #"
                required
                value={receiptData.documentNumber}
                onChange={(e) => setReceiptData({ ...receiptData, documentNumber: e.target.value })}
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
              <span>Return Inspection & Quantities</span>
            </h4>

            <div className="space-y-4">
              {receiptData.items?.map((item: any, idx: number) => {
                const acceptedQty = Number(item.acceptedQty) || 0;
                const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
                const actualRate = Number(item.actualRate) || 0;
                const totalAcceptedHours = acceptedQty * hoursPerPc;
                const lineProcessCost = totalAcceptedHours * actualRate;

                return (
                  <div key={idx} className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 shadow-subtle space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-gray">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-small font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-ink text-body">{item.operationName}</span>
                      </div>

                      {item.materialInfo ? (
                        <span className="text-small font-mono px-3 py-1 rounded-[6px] bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20 flex items-center gap-1.5 font-medium">
                          <Package className="w-3.5 h-3.5" />
                          <span>Stores Lineage: {item.materialInfo} (Sent: {item.sentQty} pcs)</span>
                        </span>
                      ) : (
                        <span className="text-small font-mono px-3 py-1 rounded-[6px] bg-canvas text-cool-gray border border-border-gray">
                          Service Only
                        </span>
                      )}
                    </div>

                    {item.materialInfo && (
                      <p className="text-small text-cool-gray leading-relaxed">
                        Accepted pieces will be returned directly into factory stock as an updated processed batch with full traceability.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                      <Input 
                        label="Received Qty"
                        type="number"
                        value={item.receivedQty}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          const val = e.target.value === '' ? ('' as any) : Number(e.target.value);
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
                          updated[idx].acceptedQty = e.target.value === '' ? ('' as any) : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                      <Input 
                        label="Rejected Qty"
                        type="number"
                        value={item.rejectedQty}
                        onChange={(e) => {
                          const updated = [...receiptData.items];
                          updated[idx].rejectedQty = e.target.value === '' ? ('' as any) : Number(e.target.value);
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
                          updated[idx].hoursPerPc = e.target.value === '' ? ('' as any) : Number(e.target.value);
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
                          updated[idx].actualRate = e.target.value === '' ? ('' as any) : Number(e.target.value);
                          setReceiptData({ ...receiptData, items: updated });
                        }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-caption font-mono text-cool-gray pt-2 border-t border-border-gray">
                      <span>Machining: <strong className="text-ink font-bold">{totalAcceptedHours.toFixed(1)} hrs</strong> ({acceptedQty} pcs × {hoursPerPc} hrs/pc @ ₹{actualRate}/hr)</span>
                      <span>Line Process Cost: <strong className="text-ink font-bold text-body">{formatCurrency(lineProcessCost)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-gray">
            <Button variant="white" size="lg" type="button" onClick={() => setIsReceiptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit">
              Post Return Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        title="Cancel Subcontract Challan"
        subtitle={`Confirm cancellation of Challan ${cancelModalOrder?.challanNumber || ''}.`}
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
                Challan <strong className="font-mono text-ink">{cancelModalOrder?.challanNumber}</strong> for vendor <strong className="text-ink">{cancelModalOrder?.vendor?.vendorName}</strong> will be marked as <strong>CANCELLED</strong>.
              </p>
              {cancelModalOrder?.items?.some((it: any) => it.inventoryBatchId) && (
                <p className="text-small text-semantic-success-dark font-medium pt-1">
                  ✓ Any physical raw materials deducted from stores will be automatically restored back to available inventory.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
            <Button
              variant="white"
              onClick={() => setCancelModalOrder(null)}
              disabled={isActionLoading}
            >
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
        isOpen={!!deleteModalOrder}
        onClose={() => setDeleteModalOrder(null)}
        title="Delete Subcontract Challan"
        subtitle={`Permanently remove Challan ${deleteModalOrder?.challanNumber || ''}.`}
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
                Challan <strong className="font-mono text-ink">{deleteModalOrder?.challanNumber}</strong> and all its item specifications will be permanently removed.
              </p>
              {deleteModalOrder?.items?.some((it: any) => it.inventoryBatchId) && deleteModalOrder?.status !== 'CANCELLED' && (
                <p className="text-small text-semantic-success-dark font-medium pt-1">
                  ✓ Any physical materials issued from stores will be replenished back into warehouse stock.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-gray">
            <Button
              variant="white"
              onClick={() => setDeleteModalOrder(null)}
              disabled={isActionLoading}
            >
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
