"use client";

import React, { useState } from 'react';
import { api } from "../../../../lib/api";
import { ShoppingCart, Plus, FileText, Package, ArrowRight, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { usePurchaseOrders, useCreatePurchaseOrder, useProcessGRN } from "../../../../hooks/useProcurement";
import { motion } from 'framer-motion';

export default function PurchaseTab({ params }: { params: Promise<{ id: string }> }) {
  const { error, success } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const { data: vendors } = useMasterData('vendors');
  const { data: materials } = useMasterData('materials');
  const { data: purchaseOrders } = usePurchaseOrders(resolvedParams.id);

  const createPOMutation = useCreatePurchaseOrder(resolvedParams.id);
  const processGRNMutation = useProcessGRN(resolvedParams.id);

  const [showPoModal, setShowPoModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  
  const [poNum, setPoNum] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [poItems, setPoItems] = useState([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
  
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [grnData, setGrnData] = useState({
    grnNumber: "",
    supplierChallan: "",
    warehouseId: "DEFAULT-WH",
    remarks: "",
    items: [{ poItemId: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, actualRate: 0, heatNumber: "", remarks: "" }]
  });

  const filteredVendors = (vendors || []).filter((v: any) => v.vendorType === 'MATERIAL_SUPPLIER');

  if (projectLoading || !project) return null;

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (poItems.some(i => !i.materialId || i.orderedQty <= 0 || i.agreedRate <= 0)) {
      return error("Validation Error", "All items must have a material, quantity, and rate > 0.");
    }

    try {
      await createPOMutation.mutateAsync({
        vendorId: selectedVendorId,
        poNumber: poNum,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
        items: poItems
      });
      setShowPoModal(false);
      refetchProject();
      
      setPoNum("");
      setSelectedVendorId("");
      setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
    } catch (err: any) {}
  };

  const openGrnModal = (po: any) => {
    setSelectedPo(po);
    setGrnData({
      grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
      supplierChallan: "",
      warehouseId: "DEFAULT-WH",
      remarks: "",
      items: po.items.map((i: any) => ({
        poItemId: i.id,
        receivedQty: i.orderedQty - (i.receivedQty || 0),
        acceptedQty: i.orderedQty - (i.receivedQty || 0),
        rejectedQty: 0,
        heatNumber: "",
        actualRate: i.agreedRate,
        remarks: ""
      }))
    });
    setShowGrnModal(true);
  };

  const handleProcessGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedPo) return;
    
    try {
      await processGRNMutation.mutateAsync({
        poHeaderId: selectedPo.id,
        grnNumber: grnData.grnNumber,
        supplierChallan: grnData.supplierChallan,
        warehouseId: grnData.warehouseId,
        remarks: grnData.remarks,
        items: grnData.items
      });
      setShowGrnModal(false);
      refetchProject();
    } catch (err: any) {}
  };

  const addPoItemRow = () => setPoItems([...poItems, { materialId: "", orderedQty: 1, agreedRate: 0 }]);
  const removePoItemRow = (index: number) => setPoItems(poItems.filter((_, i) => i !== index));
  const updatePoItem = (index: number, field: string, value: any) => {
    const newItems = [...poItems] as any[];
    newItems[index][field] = value;
    setPoItems(newItems);
  };

  return (
    <div className="flex-1 h-full flex flex-col animate-fade-in min-h-0">
      
      <div className="flex justify-between items-center shrink-0 mb-6 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 mr-3 text-amber-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Procurement & Sourcing</h2>
        </div>
        <button 
          onClick={() => setShowPoModal(true)} 
          className="group relative px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <span className="relative z-10 flex items-center text-amber-400 font-bold text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Generate Vendor PO
          </span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-12">
        {project.purchaseOrderHeaders && project.purchaseOrderHeaders.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {project.purchaseOrderHeaders.map((po: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key={po.id} 
                className="group relative rounded-2xl bg-white/[0.01] border border-white/5 p-4 backdrop-blur-xl flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-0.5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-1.5">
                      <h3 className="text-sm font-bold text-white tracking-tight">{po.poNumber}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest ${
                        po.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {po.status === 'CLOSED' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {po.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs flex items-center">
                      <Package className="w-3 h-3 mr-1.5 opacity-50" />
                      {po.vendor?.vendorName || 'Unknown Vendor'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Value</div>
                    <div className="text-lg text-amber-400 font-bold tracking-tight font-mono">&#8377;{Number(po.totalAmount).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5 mb-4 relative z-10">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                    <FileText className="w-3 h-3 mr-1.5" />
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {po.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center group/item bg-white/[0.01] p-2 rounded-lg border border-white/[0.02]">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-200">{item.material?.materialName}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">{item.orderedQty} units ordered</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="text-xs text-slate-300 font-mono font-bold">&#8377;{Number(item.lineTotal).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">@ &#8377;{item.agreedRate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {po.status !== 'CLOSED' && po.status !== 'CANCELLED' && (
                  <div className="mt-auto pt-4 border-t border-white/5 relative z-10">
                    <button
                      onClick={() => openGrnModal(po)}
                      className="w-full group/btn relative flex items-center justify-center space-x-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-3 rounded-xl transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/30"
                    >
                      <span className="font-semibold text-sm">Process Goods Receipt</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-4 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 border border-amber-500/20 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-amber-400 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No Purchase Orders Yet</h3>
            <p className="text-slate-400 max-w-md text-center mb-8">Generate a purchase order to begin procuring raw materials and components for this project.</p>
            <button 
              onClick={() => setShowPoModal(true)}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              Create First PO
            </button>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in p-4">
          <div className="glass-modal w-full max-w-4xl p-8 animate-slide-up border border-amber-500/20 max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
            
            <h2 className="text-3xl font-bold mb-8 text-white shrink-0 tracking-tight relative z-10">Create Purchase Order</h2>
            
            <form onSubmit={handleCreatePo} className="flex-1 min-h-0 flex flex-col space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-6 shrink-0 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <Input
                  label="PO Number"
                  value={poNum}
                  onChange={(e) => setPoNum(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Vendor</label>
                  <Select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    options={filteredVendors.map((v: any) => ({ value: v.id, label: v.vendorName }))}
                  />
                </div>
                <Input
                  label="Expected Delivery Date"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar bg-black/40 p-6 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Order Lines</h4>
                <div className="grid grid-cols-12 gap-4 mb-3">
                  <div className="col-span-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</div>
                  <div className="col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</div>
                  <div className="col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate (&#8377;)</div>
                  <div className="col-span-1"></div>
                </div>
                
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <div className="col-span-5">
                        <Select
                          value={item.materialId}
                          onChange={(e) => updatePoItem(index, 'materialId', e.target.value)}
                          options={(materials || []).map((m: any) => ({ value: m.id, label: `${m.materialName} (${m.materialGrade})` }))}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          required
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-500/50 transition-colors"
                          value={item.orderedQty}
                          onChange={(e) => updatePoItem(index, 'orderedQty', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-500/50 transition-colors"
                          value={item.agreedRate}
                          onChange={(e) => updatePoItem(index, 'agreedRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          type="button" 
                          onClick={() => removePoItemRow(index)}
                          className="w-10 h-10 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          disabled={poItems.length === 1}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  type="button" 
                  onClick={addPoItemRow}
                  className="w-full py-4 mt-6 border-2 border-dashed border-amber-500/20 text-amber-500 rounded-xl font-bold text-sm hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                >
                  + Add Another Item
                </button>
              </div>

              <div className="flex space-x-4 pt-6 shrink-0 border-t border-white/10">
                <button type="button" onClick={() => setShowPoModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-bold text-white shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all">Generate Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {showGrnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in p-4">
          <div className="glass-modal w-full max-w-5xl p-8 animate-slide-up border border-emerald-500/20 max-h-[90vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />

            <div className="shrink-0 mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Goods Receipt Note (GRN)</h2>
              <p className="text-slate-400">Processing receipt for PO: <span className="font-bold text-emerald-400">{selectedPo?.poNumber}</span></p>
            </div>
            
            <form onSubmit={handleProcessGrn} className="flex-1 min-h-0 flex flex-col space-y-6 relative z-10">
              <div className="grid grid-cols-3 gap-6 shrink-0 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <Input
                  label="GRN Number"
                  value={grnData.grnNumber}
                  onChange={(e) => setGrnData({...grnData, grnNumber: e.target.value})}
                  required
                />
                <Input
                  label="Supplier Challan"
                  value={grnData.supplierChallan}
                  onChange={(e) => setGrnData({...grnData, supplierChallan: e.target.value})}
                  required
                />
                <Input
                  label="Remarks (Optional)"
                  value={grnData.remarks}
                  onChange={(e) => setGrnData({...grnData, remarks: e.target.value})}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar bg-black/40 p-6 rounded-2xl border border-white/5">
                <div className="space-y-6">
                  {grnData.items.map((item, index) => {
                    const poItem = selectedPo?.items.find((i: any) => i.id === item.poItemId);
                    return (
                      <div key={index} className="grid grid-cols-6 gap-6 items-end bg-white/[0.02] p-6 rounded-xl border border-white/5">
                        <div className="col-span-6 border-b border-white/5 pb-3 mb-1 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs mr-3">ITEM {index + 1}</span>
                            <span className="font-bold text-white text-lg">{poItem?.material?.materialName}</span>
                          </div>
                          <div className="text-sm text-slate-400 bg-black/50 px-3 py-1.5 rounded-lg">
                            Ordered: <strong className="text-white">{poItem?.orderedQty}</strong> <span className="mx-2 opacity-50">|</span> Rate: <strong className="text-white">&#8377;{poItem?.agreedRate}</strong>
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Heat / Batch Number <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="MTC / Batch No."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-emerald-500/50 transition-colors"
                            value={item.heatNumber}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].heatNumber = e.target.value;
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Incoming</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-emerald-500/50 transition-colors"
                            value={item.receivedQty}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].receivedQty = Number(e.target.value);
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Accepted</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-100 focus:border-emerald-500/50 transition-colors"
                            value={item.acceptedQty}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].acceptedQty = Number(e.target.value);
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actual Rate (&#8377;)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-emerald-500/50 transition-colors"
                            value={item.actualRate}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].actualRate = Number(e.target.value);
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-4 pt-6 shrink-0 border-t border-white/10">
                <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">Complete Goods Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
