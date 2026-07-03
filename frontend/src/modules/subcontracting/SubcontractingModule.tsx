"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Truck, Plus, CheckCircle2, Factory } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

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

  // Form State
  const [vendors, setVendors] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vendorId: "",
    documentNumber: "",
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

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`projects/${projectId}/subcontract-orders`);
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      const vRes = await api.get('master-data/vendors');
      // Filter for subcontract vendors if we want, or show all
      setVendors((vRes.data || []).filter((v: any) => v.vendorType !== 'MATERIAL_SUPPLIER'));

      const oRes = await api.get('master-data/operations');
      setOperations(oRes.data || []);
    } catch (err) {
      console.error(err);
      // Fallback operations since endpoint doesn't exist yet
      setOperations([
        { id: 'op-ht', operationName: 'Heat Treatment' },
        { id: 'op-plt', operationName: 'Plating' },
        { id: 'op-gr', operationName: 'Grinding' },
      ]);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`projects/${projectId}/subcontract-orders`, formData);
      setIsOrderModalOpen(false);
      success("Challan Generated", "The Subcontract Challan was created successfully.");
      loadData();
    } catch (err) {
      console.error(err);
      error("Action Failed", "Failed to create subcontract order. Please try again.");
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`projects/${projectId}/subcontract-receipts`, {
        subcontractOrderId: selectedOrder.id,
        ...receiptData
      });
      setIsReceiptModalOpen(false);
      success("Receipt Processed", "The Subcontract Receipt was processed and cost has been added to ledger.");
      loadData();
    } catch (err) {
      console.error(err);
      error("Action Failed", "Failed to process receipt. Please verify quantities.");
    }
  };

  const openReceiptModal = (order: any) => {
    setSelectedOrder(order);
    setReceiptData({
      documentNumber: "",
      remarks: "",
      items: order.items.map((i: any) => ({
        orderItemId: i.id,
        receivedQty: i.sentQty,
        acceptedQty: i.sentQty,
        rejectedQty: 0,
        actualRate: i.rate,
        remarks: ""
      }))
    });
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col relative z-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-h3 font-bold text-white flex items-center">
            <Truck className="h-6 w-6 mr-3 text-orange-400" />
            Subcontracting Operations
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage outside processing challans and material receipts
          </p>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="btn-primary bg-orange-500 hover:bg-orange-400 text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Challan
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {loading ? (
          <div className="text-slate-400 text-center py-8">Loading Subcontracting data...</div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-12 w-12 text-slate-500" />}
            title="No Subcontract Orders Found"
            description="Generate a challan to send materials out for processing."
            actionLabel="Create Challan"
            onAction={() => setIsOrderModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-panel p-5 border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/20 transition-all" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-white">{order.challanNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        order.status === 'CLOSED' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1 flex items-center">
                      <Factory className="h-4 w-4 mr-1 text-slate-500" />
                      {order.vendor?.vendorName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Total Estimated</div>
                    <div className="text-orange-400 font-bold">₹{Number(order.totalEstimatedCost).toLocaleString()}</div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 relative z-10">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Items Sent</h4>
                  <div className="space-y-2">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded bg-white/5">
                        <div className="text-slate-300">
                          {item.operation?.operationName} - {item.sentQty} pcs
                        </div>
                        <div className="text-slate-400">
                          @ ₹{Number(item.rate)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status !== 'CLOSED' && order.status !== 'CANCELLED' && (
                  <div className="mt-4 flex justify-end relative z-10">
                    <button
                      onClick={() => openReceiptModal(order)}
                      className="text-sm font-medium text-orange-400 hover:text-orange-300 flex items-center bg-orange-400/10 px-3 py-1.5 rounded transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Process Receipt
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create Subcontract Challan">
        <form onSubmit={handleCreateOrder} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Vendor</label>
              <select
                required
                className="input-field w-full"
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              >
                <option value="">Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.vendorName} ({v.vendorType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expected Return Date</label>
              <input
                type="date"
                className="input-field w-full"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Document/Ref Number</label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            />
          </div>
          
          <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-4">
            <h4 className="text-sm font-bold text-white">Challan Items</h4>
            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Operation</label>
                  <select
                    required
                    className="input-field w-full"
                    value={item.operationId}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].operationId = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }}
                  >
                    <option value="">Select...</option>
                    {operations.map(o => (
                      <option key={o.id} value={o.id}>{o.operationName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field w-full"
                    value={item.sentQty}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].sentQty = Number(e.target.value);
                      setFormData({ ...formData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Agreed Rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="input-field w-full"
                    value={item.rate}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].rate = Number(e.target.value);
                      setFormData({ ...formData, items: newItems });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary bg-orange-500 hover:bg-orange-400 border-none text-white">Generate Challan</button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title={`Process Receipt - ${selectedOrder?.challanNumber}`}>
        <form onSubmit={handleCreateReceipt} className="space-y-5">
           <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-4">
            {receiptData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-3 items-end">
                <div className="col-span-4 text-xs font-bold text-orange-400 mb-2">Item {idx + 1}</div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rcvd Qty</label>
                  <input
                    type="number"
                    required
                    className="input-field w-full"
                    value={item.receivedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].receivedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Accpt Qty</label>
                  <input
                    type="number"
                    required
                    className="input-field w-full"
                    value={item.acceptedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].acceptedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Rej Qty</label>
                  <input
                    type="number"
                    required
                    className="input-field w-full"
                    value={item.rejectedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].rejectedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Actual Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-field w-full"
                    value={item.actualRate}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].actualRate = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary bg-orange-500 hover:bg-orange-400 border-none text-white">Process Receipt & Costing</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
