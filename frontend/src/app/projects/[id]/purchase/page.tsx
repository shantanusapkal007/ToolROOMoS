"use client";

import React, { useState } from 'react';
import { api } from "../../../../lib/api";
import { ShoppingCart, Plus, FileText, Package, ArrowRight, ChevronRight, CheckCircle2, Clock, X, Calendar, Activity, Info, Download, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { usePurchaseOrders, useCreatePurchaseOrder, useProcessGRN, useUpdatePurchaseOrder } from "../../../../hooks/useProcurement";
import { motion } from 'framer-motion';
import { PremiumDrawer } from '../../../../components/ui/PremiumDrawer';
import { Edit2 } from "lucide-react";

export default function PurchaseTab({ params }: { params: Promise<{ id: string }> }) {
  const { error, success } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const { data: vendors } = useMasterData('vendors');
  const { data: materials } = useMasterData('materials');
  const { data: warehouses } = useMasterData('warehouses');
  const { data: purchaseOrders, refetch: refetchPurchaseOrders } = usePurchaseOrders(resolvedParams.id);

  const createPOMutation = useCreatePurchaseOrder(resolvedParams.id);
  const updatePOMutation = useUpdatePurchaseOrder(resolvedParams.id);
  const processGRNMutation = useProcessGRN(resolvedParams.id);

  const [showPoModal, setShowPoModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [viewingPoDetails, setViewingPoDetails] = useState<any>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  
  const [poNum, setPoNum] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [poItems, setPoItems] = useState<any[]>([{ materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18 }]);
  
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

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (poItems.some(i => !i.materialId || i.orderedQty <= 0 || i.agreedRate <= 0)) {
      return error("Validation Error", "All items must have a material, quantity, and rate > 0.");
    }

    try {
      if (editingPoId) {
        await updatePOMutation.mutateAsync({
          poId: editingPoId,
          data: {
            vendorId: selectedVendorId,
            poNumber: poNum,
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
            items: poItems
          }
        });
      } else {
        await createPOMutation.mutateAsync({
          vendorId: selectedVendorId,
          poNumber: poNum,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
          items: poItems
        });
      }
      setShowPoModal(false);
      refetchProject();
      
      setPoNum("");
      setSelectedVendorId("");
      setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
      setEditingPoId(null);
    } catch (err: any) {}
  };

  const openEditPoModal = (po: any) => {
    setEditingPoId(po.id);
    setPoNum(po.poNumber);
    setSelectedVendorId(po.vendorId || "");
    setExpectedDeliveryDate(po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : "");
    setPoItems(po.items.map((i: any) => ({
      materialId: i.materialId,
      orderedQty: i.orderedQty,
      agreedRate: i.agreedRate,
      dimensions: i.dimensions || "",
      hsnCode: i.hsnCode || "",
      gstPercent: i.gstPercent || 18
    })));
    setShowPoModal(true);
    setViewingPoDetails(null);
  };

  const openGrnModal = (po: any) => {
    setSelectedPo(po);
    const defaultWH = warehouses && warehouses.length > 0 ? warehouses[0].id : "DEFAULT-WH";
    setGrnData({
      grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
      supplierChallan: "",
      warehouseId: defaultWH,
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

  const handleExportPO = (po: any) => {
    if (!po) return;
    
    // Create header data
    const exportData = po.items.map((item: any) => ({
      "PO Number": po.poNumber,
      "Supplier": po.vendor?.vendorName || '-',
      "Material": `${item.material?.materialCode || ''} - ${item.material?.materialGrade || ''}`,
      "Ordered Qty": item.orderedQty,
      "Agreed Rate": item.agreedRate,
      "Line Value": Number(item.orderedQty) * Number(item.agreedRate),
      "Received Qty": item.receivedQty,
      "Status": item.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");
    
    XLSX.writeFile(wb, `PO_${po.poNumber}.xlsx`);
  };

  const handleIssuePO = async (poId: string) => {
    try {
      await api.post(`/projects/${resolvedParams.id}/purchase-orders/${poId}/issue`);
      success('Purchase Order issued successfully.');
      setViewingPoDetails(null);
      refetchPurchaseOrders();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to issue purchase order.');
    }
  };

  const handleDeletePO = async (poId: string) => {
    if (!window.confirm('Are you sure you want to delete this Purchase Order? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${resolvedParams.id}/purchase-orders/${poId}`);
      success('Purchase Order deleted successfully.');
      refetchPurchaseOrders();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete purchase order.');
    }
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

  const addPoItemRow = () => setPoItems([...poItems, { materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18 }]);
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
          onClick={() => {
            setEditingPoId(null);
            setPoNum("");
            setSelectedVendorId("");
            setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
            setShowPoModal(true);
          }} 
          className="group relative px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
        >
          <span className="relative z-10 flex items-center text-amber-400 font-bold text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Generate Vendor PO
          </span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-12">
        {purchaseOrders && purchaseOrders.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {purchaseOrders.map((po: any, i: number) => (
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

                <div className="mt-auto pt-4 border-t border-white/5 relative z-10 flex gap-2">
                  <button
                    onClick={() => setViewingPoDetails(po)}
                    className={`font-bold text-xs py-2.5 rounded-xl transition-all duration-300 border border-white/10 hover:bg-white/5 hover:border-white/20 text-white flex-1`}
                  >
                    View Details
                  </button>
                  {po.status === 'DRAFT' && (
                    <button
                      onClick={() => handleIssuePO(po.id)}
                      className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2.5 rounded-xl transition-all duration-300 border border-blue-500/20 hover:border-blue-500/30 font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <span>Issue PO</span>
                    </button>
                  )}
                  {(po.status === 'ISSUED' || po.status === 'PARTIAL') && (
                    <button
                      onClick={() => openGrnModal(po)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2.5 rounded-xl transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/30 font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <span>Process GRN</span>
                    </button>
                  )}
                  {(po.status === 'DRAFT' || po.status === 'ON_HOLD') && (
                    <button
                      onClick={() => openEditPoModal(po)}
                      className="px-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 py-2.5 rounded-xl transition-all duration-300 border border-blue-500/20 hover:border-blue-500/30 flex items-center justify-center"
                      title="Edit Purchase Order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {(po.status === 'DRAFT' || po.status === 'ON_HOLD') && (
                    <button
                      onClick={() => handleDeletePO(po.id)}
                      className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-500/30 flex items-center justify-center"
                      title="Delete Purchase Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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

      {/* Create PO Drawer */}
      <PremiumDrawer
        isOpen={showPoModal}
        onClose={() => {
          setShowPoModal(false);
          setEditingPoId(null);
          setPoNum("");
          setSelectedVendorId("");
          setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
        }}
        title={editingPoId ? "Edit Purchase Order" : "Create Purchase Order"}
        subtitle={editingPoId ? "Modify PO details" : "Generate a new vendor PO for raw materials"}
        width="2xl"
        showToolbar={false}
      >
        <form onSubmit={handleSavePo} className="flex flex-col space-y-6 h-full p-6">
          <div className="grid grid-cols-2 gap-6 shrink-0 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
            <Input
              label="PO Number (Auto-generated if empty)"
              value={poNum}
              onChange={(e) => setPoNum(e.target.value)}
              placeholder="Leave blank to auto-generate"
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
              <div className="col-span-12 md:col-span-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</div>
              <div className="col-span-6 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Dimensions</div>
              <div className="col-span-6 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider">HSN Code</div>
              <div className="col-span-6 md:col-span-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</div>
              <div className="col-span-5 md:col-span-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Rate</div>
              <div className="col-span-5 md:col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider">GST %</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {poItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div className="col-span-12 md:col-span-3">
                    <Select
                      value={item.materialId}
                      onChange={(e) => {
                         const val = e.target.value;
                         const mat = materials?.find((m: any) => m.id === val);
                         const newItems = [...poItems];
                         newItems[index].materialId = val;
                         if (mat) {
                            newItems[index].hsnCode = mat.hsnCode || "";
                            newItems[index].gstPercent = mat.gstPercent ? Number(mat.gstPercent) : 18;
                         }
                         setPoItems(newItems);
                      }}
                      options={(materials || []).map((m: any) => ({ value: m.id, label: `${m.materialCode} (${m.materialGrade})` }))}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <input
                      type="text"
                      placeholder="Dim (LxWxH)"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
                      value={item.dimensions || ""}
                      onChange={(e) => updatePoItem(index, 'dimensions', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <input
                      type="text"
                      placeholder="HSN"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
                      value={item.hsnCode || ""}
                      onChange={(e) => updatePoItem(index, 'hsnCode', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      placeholder="Qty"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
                      value={item.orderedQty}
                      onChange={(e) => updatePoItem(index, 'orderedQty', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Rate"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
                      value={item.agreedRate}
                      onChange={(e) => updatePoItem(index, 'agreedRate', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="GST %"
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(245,158,11,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
                      value={item.gstPercent || ''}
                      onChange={(e) => updatePoItem(index, 'gstPercent', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button 
                      type="button" 
                      onClick={() => removePoItemRow(index)}
                      className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
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

          <div className="flex space-x-4 pt-4 shrink-0 border-t border-white/10 mt-auto">
            <button type="button" onClick={() => {
              setShowPoModal(false);
              setEditingPoId(null);
              setPoNum("");
              setSelectedVendorId("");
              setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18 }]);
            }} className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-bold text-white shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all">
              {editingPoId ? "Save Changes" : "Generate Purchase Order"}
            </button>
          </div>
        </form>
      </PremiumDrawer>

      {/* GRN Drawer */}
      <PremiumDrawer
        isOpen={showGrnModal}
        onClose={() => setShowGrnModal(false)}
        title="Goods Receipt Note (GRN)"
        subtitle={`Processing receipt for PO: ${selectedPo?.poNumber}`}
        width="3xl"
        showToolbar={false}
      >
        <form onSubmit={handleProcessGrn} className="flex flex-col space-y-6 h-full p-6">
          <div className="grid grid-cols-4 gap-6 shrink-0 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
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
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Warehouse</label>
              <select 
                className="w-full bg-[#050A14] border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none" 
                value={grnData.warehouseId}
                onChange={e => setGrnData({...grnData, warehouseId: e.target.value})}
                required
              >
                {warehouses?.map((w: any) => (
                  <option key={w.id} value={w.id} className="bg-[#0B1018] text-white">
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
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
                        <span className="font-bold text-white text-lg">{poItem?.material?.materialCode} - {poItem?.material?.materialGrade}</span>
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
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(16,185,129,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
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
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(16,185,129,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
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
                        className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-100 focus:border-emerald-500/50 focus:bg-emerald-500/20 focus:shadow-[0_0_20px_rgba(16,185,129,0.2),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-emerald-500/15"
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
                        className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/40 focus:bg-white/[0.04] focus:shadow-[0_0_20px_rgba(16,185,129,0.15),_inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-white/[0.03]"
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

          <div className="flex space-x-4 pt-4 shrink-0 border-t border-white/10 mt-auto">
            <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">Complete Goods Receipt</button>
          </div>
        </form>
      </PremiumDrawer>
      {/* View PO Details Modal */}
      {viewingPoDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-4xl p-6 animate-slide-up border border-white/10 relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[90px] -ml-32 -mb-32 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>Purchase Order Details</span>
                    <span className="text-xs text-slate-500 font-mono">({viewingPoDetails.poNumber})</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Detailed fulfillment ledger & audit logs</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {(viewingPoDetails.status === 'DRAFT' || viewingPoDetails.status === 'ON_HOLD') && (
                  <button 
                    onClick={() => openEditPoModal(viewingPoDetails)}
                    className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs transition-colors"
                  >
                    <span>Edit PO</span>
                  </button>
                )}
                {viewingPoDetails.status === 'ON_HOLD' && (
                  <button 
                    onClick={() => handleIssuePO(viewingPoDetails.id)}
                    className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs transition-colors"
                  >
                    <span>Issue PO</span>
                  </button>
                )}
                <button 
                  onClick={() => handleExportPO(viewingPoDetails)}
                  className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button 
                  onClick={() => setViewingPoDetails(null)} 
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-4 pr-1 relative z-10 hide-scrollbar">
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Vendor Card */}
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Supplier Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Supplier Name:</span>
                      <span className="text-white font-bold">{viewingPoDetails.vendor?.vendorName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Supplier Code:</span>
                      <span className="text-slate-300 font-mono">{viewingPoDetails.vendor?.vendorCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email Address:</span>
                      <span className="text-slate-300">{viewingPoDetails.vendor?.contactEmail || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact Number:</span>
                      <span className="text-slate-300">{viewingPoDetails.vendor?.contactPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* PO Stats Card */}
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    Order Status & Dates
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">PO Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                        viewingPoDetails.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {viewingPoDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Value:</span>
                      <span className="text-amber-400 font-bold font-mono">&#8377;{Number(viewingPoDetails.totalAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Delivery:</span>
                      <span className="text-slate-300 font-medium">
                        {viewingPoDetails.expectedDeliveryDate ? new Date(viewingPoDetails.expectedDeliveryDate).toLocaleDateString() : 'Immediate'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issued On:</span>
                      <span className="text-slate-300 font-medium">
                        {new Date(viewingPoDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Items Fulfillment Grid */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Line Items & Delivery Progress
                </h4>
                
                <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[9px] font-black text-slate-500 uppercase tracking-wider bg-black/40 border-b border-white/5">
                    <div className="col-span-4">Material Item</div>
                    <div className="col-span-2 text-right">Unit Rate</div>
                    <div className="col-span-1 text-right">GST %</div>
                    <div className="col-span-3 px-2">Fulfillment Progress</div>
                    <div className="col-span-2 text-right">Line Total</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {viewingPoDetails.items?.map((item: any) => {
                      const ordered = Number(item.orderedQty || 0);
                      const received = Number(item.receivedQty || 0);
                      const progress = Math.min(100, Math.max(0, (received / ordered) * 100));
                      
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-slate-300 hover:bg-white/[0.01] transition-colors items-center">
                          <div className="col-span-4 font-semibold text-white">
                            {item.material?.materialName || 'Raw Material'}
                          </div>
                          <div className="col-span-2 text-right font-mono font-medium">
                            &#8377;{Number(item.agreedRate).toLocaleString()}
                          </div>
                          <div className="col-span-1 text-right font-mono font-medium text-slate-400">
                            {item.gstPercent ? `${item.gstPercent}%` : '-'}
                          </div>
                          <div className="col-span-3 px-2 flex flex-col space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>{received} / {ordered} units</span>
                              <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-mono font-bold text-slate-200">
                            &#8377;{Number(item.lineTotal).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Goods Receipts Audit Timeline */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Goods Receipt Notes (GRN) History
                </h4>

                {viewingPoDetails.goodsReceiptHeaders && viewingPoDetails.goodsReceiptHeaders.length > 0 ? (
                  <div className="space-y-3">
                    {viewingPoDetails.goodsReceiptHeaders.map((grn: any) => (
                      <div key={grn.id} className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3 relative overflow-hidden group/grn">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-emerald-400 font-mono">{grn.grnNumber}</span>
                              <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-400 uppercase">Received</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Processed: {new Date(grn.receiptDate).toLocaleDateString()}</p>
                          </div>
                          {grn.remarks && (
                            <div className="text-[10px] bg-white/5 text-slate-400 px-2 py-1 rounded max-w-xs truncate border border-white/5">
                              {grn.remarks}
                            </div>
                          )}
                        </div>

                        {/* Received items checklist */}
                        <div className="space-y-1.5 pt-2 border-t border-white/[0.03]">
                          {grn.items?.map((gItem: any) => (
                            <div key={gItem.id} className="flex justify-between text-xs py-1 px-2 bg-white/[0.01] rounded">
                              <span className="text-slate-400">{gItem.poItem?.material?.materialName}</span>
                              <div className="space-x-3 font-semibold text-slate-300">
                                <span>Rcvd: <span className="font-mono text-white">{Number(gItem.receivedQty)}</span></span>
                                <span className="text-emerald-500">Accpt: <span className="font-mono text-emerald-400">{Number(gItem.acceptedQty)}</span></span>
                                {Number(gItem.rejectedQty) > 0 && (
                                  <span className="text-red-500">Rej: <span className="font-mono text-red-400">{Number(gItem.rejectedQty)}</span></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/[0.01] rounded-xl border border-white/5 border-dashed text-xs text-slate-500 italic">
                    No Goods Receipt Notes processed yet. Delivery is pending.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button 
                type="button" 
                onClick={() => setViewingPoDetails(null)} 
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
              >
                Close details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
