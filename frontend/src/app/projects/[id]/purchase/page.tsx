"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { ShoppingCart } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { usePurchaseOrders, useCreatePurchaseOrder, useProcessGRN } from "../../../../hooks/useProcurement";

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
    warehouseId: "",
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
      
      // Reset form
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
      warehouseId: "DEFAULT-WH", // Hardcoded default for now
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

  const addPoItemRow = () => {
    setPoItems([...poItems, { materialId: "", orderedQty: 1, agreedRate: 0 }]);
  };

  const removePoItemRow = (index: number) => {
    const newItems = [...poItems];
    newItems.splice(index, 1);
    setPoItems(newItems);
  };

  const updatePoItem = (index: number, field: string, value: any) => {
    const newItems = [...poItems] as any[];
    newItems[index][field] = value;
    setPoItems(newItems);
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col h-full">
      <div className="glass-panel p-6 mb-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center">
              <ShoppingCart className="h-6 w-6 mr-3 text-amber-400" />
              Purchase & Procurement
            </h2>
            <p className="text-slate-400 mt-1">Manage Vendor POs, RFQs, and Material Sourcing.</p>
          </div>
          <button onClick={() => setShowPoModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all">
            Generate Vendor PO
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {project.purchaseOrderHeaders && project.purchaseOrderHeaders.length > 0 ? (
          <div className="space-y-4">
            {project.purchaseOrderHeaders.map((po: any) => (
              <div key={po.id} className="glass-panel p-5 border border-white/5 hover:border-amber-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-all" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-white">{po.poNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        po.status === 'CLOSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1 flex items-center">
                      <span className="text-slate-500">Vendor:</span> <span className="ml-2 font-medium">{po.vendor?.vendorName || 'Unknown Vendor'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Total Value</div>
                    <div className="text-amber-400 font-bold">&#8377;{po.totalAmount}</div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 relative z-10">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {po.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded bg-black/20">
                        <div className="text-slate-300">
                          {item.material?.materialName} <span className="text-slate-500 text-xs ml-2">({item.orderedQty} units)</span>
                        </div>
                        <div className="text-slate-400 font-mono">
                          @ &#8377;{item.agreedRate} = &#8377;{item.lineTotal}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {po.status !== 'CLOSED' && po.status !== 'CANCELLED' && (
                  <div className="mt-4 flex justify-end relative z-10">
                    <button
                      onClick={() => openGrnModal(po)}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center bg-emerald-400/10 px-4 py-2 rounded-lg transition-colors"
                    >
                      Process Goods Receipt (GRN)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel border border-dashed border-white/10 rounded-2xl">
            <ShoppingCart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Purchase Orders</h3>
            <p className="text-slate-400">Generate a PO to procure raw materials or standard parts.</p>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-panel w-full max-w-3xl p-8 animate-slide-up border border-amber-500/20 max-h-[90vh] flex flex-col">
            <h2 className="text-h4 font-bold mb-6 text-white shrink-0">Create Purchase Order</h2>
            
            <form onSubmit={handleCreatePo} className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4 shrink-0">
                <Input
                  label="PO Number"
                  value={poNum}
                  onChange={(e) => setPoNum(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Vendor</label>
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
              
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 bg-white/5 p-4 rounded-xl border border-white/10 mt-4">
                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Material</div>
                  <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</div>
                  <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Rate (&#8377;)</div>
                  <div className="col-span-1"></div>
                </div>
                
                {poItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
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
                        className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 transition-colors"
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
                        className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500/50 transition-colors"
                        value={item.agreedRate}
                        onChange={(e) => updatePoItem(index, 'agreedRate', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button 
                        type="button" 
                        onClick={() => removePoItemRow(index)}
                        className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        disabled={poItems.length === 1}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addPoItemRow}
                  className="w-full py-3 mt-4 border-2 border-dashed border-amber-500/30 text-amber-400 rounded-lg font-bold text-sm hover:bg-amber-500/10 hover:border-amber-500/50 transition-all"
                >
                  + Add Item
                </button>
              </div>

              <div className="flex space-x-3 pt-4 shrink-0 border-t border-white/10">
                <button type="button" onClick={() => setShowPoModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white shadow-[0_0_15px_rgba(217,119,6,0.3)] transition-all">Generate PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN Modal */}
      {showGrnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-panel w-full max-w-4xl p-8 animate-slide-up border border-emerald-500/20 max-h-[90vh] flex flex-col">
            <h2 className="text-h4 font-bold mb-2 text-white shrink-0">Goods Receipt Note (GRN)</h2>
            <p className="text-sm text-slate-400 mb-6">Processing receipt for PO: <span className="font-bold text-white">{selectedPo?.poNumber}</span></p>
            
            <form onSubmit={handleProcessGrn} className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4 shrink-0">
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
              
              <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="space-y-6">
                  {grnData.items.map((item, index) => {
                    const poItem = selectedPo?.items.find((i: any) => i.id === item.poItemId);
                    return (
                      <div key={index} className="grid grid-cols-6 gap-4 items-end bg-black/20 p-4 rounded-lg">
                        <div className="col-span-6 border-b border-white/10 pb-2 mb-2">
                          <span className="font-bold text-emerald-400 text-sm">Item {index + 1}:</span>
                          <span className="ml-2 text-white text-sm">{poItem?.material?.materialName}</span>
                          <span className="ml-4 text-xs text-slate-500">Ordered: {poItem?.orderedQty} @ &#8377;{poItem?.agreedRate}</span>
                        </div>
                        
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Heat Number <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="MTC / Batch No."
                            className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                            value={item.heatNumber}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].heatNumber = e.target.value;
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-slate-400 mb-1">Incoming</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                            value={item.receivedQty}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].receivedQty = Number(e.target.value);
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-slate-400 mb-1">Accepted</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                            value={item.acceptedQty}
                            onChange={(e) => {
                              const newItems = [...grnData.items];
                              newItems[index].acceptedQty = Number(e.target.value);
                              setGrnData({ ...grnData, items: newItems });
                            }}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-400 mb-1">Actual Rate</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
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

              <div className="flex space-x-3 pt-4 shrink-0 border-t border-white/10">
                <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all">Process GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
