"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Truck, Plus, CheckCircle2, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SmartTable } from "../../components/ui/SmartTable";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency, formatDate } from "../../lib/formatters";

interface SubcontractingModuleProps {
  projectId: string;
}

export function SubcontractingModule({ projectId }: SubcontractingModuleProps) {
  const { success, error } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Master Data
  const [vendors, setVendors] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    vendorId: "",
    documentNumber: `CHL-${Date.now().toString().slice(-4)}`,
    expectedReturnDate: "",
    remarks: "",
    items: [{ operationId: "", sentQty: 1, rate: 0, remarks: "" }],
  });

  const [receiptData, setReceiptData] = useState({
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const vRes = await api.get('master-data/vendors');
      const vList = extractArray(vRes);
      setVendors(vList.filter((v: any) => v.vendorType !== 'MATERIAL_SUPPLIER'));

      const oRes = await api.get('master-data/operations');
      setOperations(extractArray(oRes));
    } catch (err) {
      console.error('Failed to load subcontracting master data', err);
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { operationId: "", sentQty: 1, rate: 0, remarks: "" }]
    });
  };

  const removeItemRow = (idx: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx)
    });
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    const updated = [...formData.items];
    (updated[idx] as any)[field] = value;
    setFormData({ ...formData, items: updated });
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
        receivedQty: item.sentQty || 1,
        acceptedQty: item.sentQty || 1,
        rejectedQty: 0,
        actualRate: item.rate || 0,
        remarks: ""
      }))
    });
    setIsReceiptModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`projects/${projectId}/subcontract-orders`, formData);
      setIsOrderModalOpen(false);
      loadData();
      success("Challan Created", "Subcontracting challan successfully generated.");
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
          actualRate: Number(item.actualRate) || 0,
          remarks: item.remarks || ""
        }))
      };
      await api.post(`projects/${projectId}/subcontract-orders/${selectedOrder.id}/receipt`, payload);
      setIsReceiptModalOpen(false);
      loadData();
      success("Receipt Processed", "Subcontract return receipt successfully posted.");
    } catch (err: any) {
      const msg = err.response?.data?.message;
      error("Receipt Failed", Array.isArray(msg) ? msg.join(', ') : (msg || err.message));
    }
  };

  const columns = [
    {
      key: 'challanNumber',
      label: 'Challan #',
      render: (val: string, row: any) => (
        <div>
          <span className="font-mono font-bold text-zinc-900">{val || 'CHL-001'}</span>
          <div className="text-micro font-mono text-zinc-400">{formatDate(row.createdAt)}</div>
        </div>
      )
    },
    {
      key: 'vendor',
      label: 'Outsource Job Work Vendor',
      render: (val: any) => <span className="font-semibold text-zinc-800">{val?.vendorName || 'Outsource Vendor'}</span>
    },
    {
      key: 'items',
      label: 'Outsource Operations',
      render: (val: any[]) => (
        <span className="font-mono text-zinc-900">{val?.length || 1} Outsource Line(s)</span>
      )
    },
    {
      key: 'totalEstimatedCost',
      label: 'Est Cost',
      render: (val: number) => <span className="font-mono font-bold text-orange-600">{formatCurrency(val || 0)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => (
        <span className={`text-micro font-bold px-2 py-0.5 rounded border ${
          val === 'CLOSED' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-orange-50 text-orange-700 border-orange-200'
        }`}>
          {val || 'OUTSOURCED'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        row.status !== 'CLOSED' && (
          <Button variant="secondary" size="sm" onClick={() => openReceiptModal(row)}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Process Return Receipt</span>
          </Button>
        )
      )
    }
  ];

  const totalCost = orders.reduce((sum, o) => sum + Number(o.totalEstimatedCost || 0), 0);

  return (
    <div className="flex-1 flex flex-col space-y-4 pb-12">
      
      {/* Header Banner */}
      <div className="flex justify-between items-center bg-white border border-zinc-200 rounded-lg p-4 shadow-xs">
        <div>
          <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-600" />
            <span>Subcontracting & Outside Job Work</span>
          </h3>
          <p className="text-caption text-zinc-500 mt-0.5">
            Manage job work challans, outsource vendor heat treatment / plating, and material return receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={() => setIsOrderModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Create Outsource Challan</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="enterprise-card p-3.5 flex flex-col justify-between">
          <span className="text-micro font-semibold uppercase text-zinc-500">Total Subcontract Cost</span>
          <div className="text-2xl font-bold font-mono text-orange-600 my-0.5">{formatCurrency(totalCost)}</div>
          <span className="text-micro text-zinc-500">Outsourced Work Value</span>
        </div>

        <div className="enterprise-card p-3.5 flex flex-col justify-between">
          <span className="text-micro font-semibold uppercase text-zinc-500">Active Subcontract Orders</span>
          <div className="text-2xl font-bold font-mono text-zinc-900 my-0.5">{orders.length}</div>
          <span className="text-micro text-zinc-500">Issued Challans</span>
        </div>

        <div className="enterprise-card p-3.5 flex flex-col justify-between">
          <span className="text-micro font-semibold uppercase text-zinc-500">Completed Receipts</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 my-0.5">
            {orders.filter(o => o.status === 'CLOSED').length}
          </div>
          <span className="text-micro text-zinc-500">Returned Store Lineage</span>
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

      {/* Full Multi-Item Create Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create Outsource Job Work Challan"
        subtitle="Issue vendor job work order for heat treatment, coating, or machining."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Challan Number *"
              required
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            />

            <Select
              label="Job Work Vendor *"
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
              label="Expected Return Date"
              type="date"
              value={formData.expectedReturnDate}
              onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
            />
          </div>

          {/* Items */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <span className="text-micro font-bold uppercase tracking-wider text-zinc-700">Outsource Operation Items</span>
              <Button variant="secondary" size="sm" type="button" onClick={addItemRow}>
                <Plus className="w-3.5 h-3.5" /> Add Operation Line
              </Button>
            </div>
            <div className="p-3 space-y-3">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3 border border-zinc-200 rounded-md bg-zinc-50/50 grid grid-cols-4 gap-3 items-end">
                  <Select
                    label="Operation *"
                    required
                    value={item.operationId}
                    onChange={(e) => updateItemRow(idx, 'operationId', e.target.value)}
                  >
                    <option value="">Select Operation...</option>
                    {operations.map((op: any) => (
                      <option key={op.id} value={op.id}>{op.operationName}</option>
                    ))}
                  </Select>

                  <Input 
                    label="Sent Qty *"
                    type="number"
                    min="1"
                    required
                    value={item.sentQty}
                    onChange={(e) => updateItemRow(idx, 'sentQty', e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  />

                  <Input 
                    label="Rate (INR) *"
                    type="number"
                    step="0.01"
                    required
                    value={item.rate}
                    onChange={(e) => updateItemRow(idx, 'rate', e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  />

                  <div className="flex justify-end">
                    {formData.items.length > 1 && (
                      <Button variant="ghost" size="sm" type="button" onClick={() => removeItemRow(idx)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-micro font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Challan Remarks / Gate Pass Notes
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Record special instructions, hardness specs, or return notes..."
              className="w-full bg-white border border-zinc-200 rounded-md p-3 text-caption text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 h-20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button variant="secondary" type="button" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Subcontract Challan</Button>
          </div>
        </form>
      </Modal>

      {/* Process Return Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Process Outsource Return Receipt"
        subtitle="Verify returned quantities, accepted/rejected pcs, and final actual rates."
        maxWidth="lg"
      >
        <form onSubmit={handleProcessReceipt} className="space-y-4">
          <Input 
            label="Receipt Document #"
            required
            value={receiptData.documentNumber}
            onChange={(e) => setReceiptData({ ...receiptData, documentNumber: e.target.value })}
          />

          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <div className="p-3 bg-zinc-50 border-b border-zinc-200 font-bold text-micro uppercase tracking-wider text-zinc-700">
              Return Line Items Inspection
            </div>
            <div className="p-3 space-y-3">
              {receiptData.items?.map((item: any, idx: number) => (
                <div key={idx} className="p-3 border border-zinc-200 rounded-md bg-zinc-50/50 space-y-3">
                  <div className="font-bold text-zinc-900">{item.operationName}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input 
                      label="Received Qty"
                      type="number"
                      value={item.receivedQty}
                      onChange={(e) => {
                        const updated = [...receiptData.items];
                        updated[idx].receivedQty = e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value));
                        updated[idx].acceptedQty = e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value));
                        setReceiptData({ ...receiptData, items: updated });
                      }}
                    />
                    <Input 
                      label="Accepted Qty"
                      type="number"
                      value={item.acceptedQty}
                      onChange={(e) => {
                        const updated = [...receiptData.items];
                        updated[idx].acceptedQty = e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value));
                        setReceiptData({ ...receiptData, items: updated });
                      }}
                    />
                    <Input 
                      label="Rejected Qty"
                      type="number"
                      value={item.rejectedQty}
                      onChange={(e) => {
                        const updated = [...receiptData.items];
                        updated[idx].rejectedQty = e.target.value === '' ? ('' as any) : (e.target.value === '' ? ('' as any) : Number(e.target.value));
                        setReceiptData({ ...receiptData, items: updated });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button variant="secondary" type="button" onClick={() => setIsReceiptModalOpen(false)}>Cancel</Button>
            <Button type="submit">Post Return Receipt</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
