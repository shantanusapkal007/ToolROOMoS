"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Truck, Plus, CheckCircle2, Factory } from "lucide-react";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency } from "../../lib/formatters";

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
      {/* Dense Toolbar Header */}
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 mr-3 text-orange-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Subcontracting Operations</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Outside Processing & Receipts</p>
          </div>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="group relative px-4 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
        >
          <span className="relative z-10 flex items-center text-orange-400 font-bold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Challan
          </span>
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
          <div className="space-y-2 pr-2">
            {orders.map((order) => (
              <div key={order.id} className="bg-white/[0.01] p-4 rounded-xl flex flex-col border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/20 transition-all opacity-0 group-hover:opacity-100" />
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-sm font-bold text-white">{order.challanNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'CLOSED' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center font-bold tracking-wider uppercase">
                      <Factory className="h-3.5 w-3.5 mr-1 text-slate-500" />
                      {order.vendor?.vendorName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Estimated</div>
                    <div className="text-orange-400 font-mono font-bold text-sm">{formatCurrency(Number(order.totalEstimatedCost))}</div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2 mt-2 relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Items Sent:</h4>
                      <div className="flex space-x-2">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center text-xs bg-black/20 border border-white/5 px-2 py-1 rounded">
                            <span className="text-slate-300 font-semibold mr-2">
                              {item.operation?.operationName}
                            </span>
                            <span className="text-orange-400 font-mono font-bold mr-2">{item.sentQty} pcs</span>
                            <span className="text-slate-500 font-mono text-[10px]">@{formatCurrency(Number(item.rate))}</span>
                          </div>
                        ))}
                      </div>
                  </div>

                  {order.status !== 'CLOSED' && order.status !== 'CANCELLED' && (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openReceiptModal(order)}
                        className="text-[10px] font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 flex items-center bg-orange-500/10 border border-orange-500/20 px-2 py-1.5 rounded transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Process Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-2xl p-6 animate-slide-up border border-orange-500/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">Create Subcontract Challan</h3>
        <form onSubmit={handleCreateOrder} className="space-y-4 relative z-10 flex-1 min-h-0 flex flex-col">
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vendor</label>
              <select
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expected Return Date</label>
              <input
                type="date"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
              />
            </div>
          </div>
          <div className="shrink-0">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Document/Ref Number</label>
            <input
              type="text"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            />
          </div>
          
          <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] flex-1 overflow-y-auto hide-scrollbar space-y-4">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Challan Items</h4>
            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Operation</label>
                  <select
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
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
                  <label className="block text-[10px] text-slate-400 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    value={item.sentQty}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[idx].sentQty = Number(e.target.value);
                      setFormData({ ...formData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Agreed Rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono"
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

          <div className="flex space-x-3 pt-4 border-t border-white/10 shrink-0 mt-4">
            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">Generate Challan</button>
          </div>
        </form>
        </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-3xl p-6 animate-slide-up border border-orange-500/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">Process Receipt - {selectedOrder?.challanNumber}</h3>
        <form onSubmit={handleCreateReceipt} className="space-y-4 relative z-10 flex-1 min-h-0 flex flex-col">
           <div className="border border-white/10 rounded-xl p-4 bg-white/[0.02] flex-1 overflow-y-auto hide-scrollbar space-y-4">
            {receiptData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-3 items-end">
                <div className="col-span-4 text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1 border-b border-white/10 pb-1">Item {idx + 1}</div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rcvd Qty</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono"
                    value={item.receivedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].receivedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Accpt Qty</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono text-green-400"
                    value={item.acceptedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].acceptedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rej Qty</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono text-red-400"
                    value={item.rejectedQty}
                    onChange={(e) => {
                      const newItems = [...receiptData.items];
                      newItems[idx].rejectedQty = Number(e.target.value);
                      setReceiptData({ ...receiptData, items: newItems });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actual Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50 font-mono"
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

          <div className="flex space-x-3 pt-4 border-t border-white/10 shrink-0 mt-4">
            <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">Process Receipt & Costing</button>
          </div>
        </form>
        </div>
        </div>
      )}
    </div>
  );
}
