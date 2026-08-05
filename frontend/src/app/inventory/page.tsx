"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/layout/Sidebar';
import { useInventoryLedger } from '../../hooks/useInventory';
import { useMasterData } from '../../hooks/useMasterData';
import { useProjects } from '../../hooks/useProjects';
import { InventoryService } from '../../services/inventory.service';
import { ProductionService } from '../../services/production.service';
import { 
  Package, Search, Filter, AlertTriangle, Plus, ArrowRight, Wrench, 
  CheckCircle2, X, PackageMinus, AlertCircle, Trash2, Factory 
} from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTION_SHOPS, getProductionShopDetails } from '@/constants/productionShops';

export default function InventoryPage() {
  const { data: ledger, isLoading, refetch } = useInventoryLedger();
  const { data: materials = [] } = useMasterData('materials');
  const { data: employees = [] } = useMasterData('employees');
  const { data: projects = [] } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isIssueMaterialOpen, setIsIssueMaterialOpen] = useState(false);

  // Forms
  const [stockForm, setStockForm] = useState({
    materialId: '',
    batchNumber: '',
    heatNumber: '',
    currentQty: 1,
    unitCost: 0,
  });

  const [issueForm, setIssueForm] = useState({
    projectId: '',
    issueNumber: `ISS-${Date.now().toString().slice(-6)}`,
    productionSection: 'MACHINE_SHOP',
    issuedToEmployeeId: '',
    issuedTo: '',
    remarks: '',
    expectedManufactureQty: '' as string | number,
    items: [{ batchId: '', qty: 1, remarks: '' }]
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.materialId || stockForm.currentQty <= 0) {
      return showToast('error', 'Please select a material and enter quantity.');
    }
    try {
      await InventoryService.createBatch(stockForm);
      showToast('success', 'Stock batch added to Inventory Ledger!');
      setIsAddStockOpen(false);
      setStockForm({ materialId: '', batchNumber: '', heatNumber: '', currentQty: 1, unitCost: 0 });
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add stock batch.');
    }
  };

  const handleOpenIssueDrawer = (batch?: any) => {
    setIssueForm({
      projectId: projects[0]?.id || '',
      issueNumber: `ISS-${Date.now().toString().slice(-6)}`,
      productionSection: 'MACHINE_SHOP',
      issuedToEmployeeId: '',
      issuedTo: '',
      remarks: batch ? `Material issue from batch ${batch.batchNumber}` : '',
      expectedManufactureQty: '',
      items: [{ batchId: batch ? batch.id : '', qty: 1, remarks: '' }]
    });
    setIsIssueMaterialOpen(true);
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.projectId) {
      return showToast('error', 'Please select a target project for material issuing.');
    }

    if (!issueForm.productionSection) {
      return showToast('error', 'Please select the target Production Shop (e.g. Machine Shop, Fabrication, Press Shop).');
    }

    if (issueForm.productionSection === 'PRESS_SHOP') {
      const qty = Number(issueForm.expectedManufactureQty);
      if (!qty || !Number.isInteger(qty) || qty < 1) {
        return showToast('error', 'Press Shop requires a valid Expected Manufacture Quantity (must be a whole number â‰¥ 1).');
      }
    }

    for (const item of issueForm.items) {
      if (!item.batchId) {
        return showToast('error', 'Please select an inventory batch for all items.');
      }
      const targetBatch = ledger?.find((b: any) => b.id === item.batchId);
      const avail = Number(targetBatch?.availableQty ?? targetBatch?.currentQty ?? 0);
      if (item.qty <= 0) {
        return showToast('error', 'Issued quantity must be greater than 0.');
      }
      if (item.qty > avail) {
        return showToast('error', `Requested ${item.qty} units, but Batch ${targetBatch?.batchNumber || ''} only has ${avail} available.`);
      }
    }

    try {
      await ProductionService.issueMaterial(issueForm.projectId, {
        issueNumber: issueForm.issueNumber,
        productionSection: issueForm.productionSection,
        remarks: issueForm.remarks,
        ...(issueForm.productionSection === 'PRESS_SHOP' && issueForm.expectedManufactureQty
          ? { expectedManufactureQty: Number(issueForm.expectedManufactureQty) }
          : {}),
        items: issueForm.items.map(i => ({
          inventoryBatchId: i.batchId,
          issuedQty: Number(i.qty),
          remarks: i.remarks
        }))
      });
      showToast('success', 'Material issued successfully in inventory ledger!');
      setIsIssueMaterialOpen(false);
      refetch();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to issue material.');
    }
  };

  const filteredLedger = ledger?.filter((batch: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      batch.material?.materialCode?.toLowerCase().includes(term) ||
      batch.material?.materialGrade?.toLowerCase().includes(term) ||
      batch.batchNumber?.toLowerCase().includes(term) ||
      batch.heatNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-zinc-50 to-indigo-50/20 text-zinc-900 relative w-full overflow-hidden font-sans">
      <Sidebar />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center space-x-3 text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
                : 'bg-rose-50/90 text-rose-800 border-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <span>{toastMessage.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 h-full flex flex-col relative pl-[5.5rem] pr-8 py-8 overflow-y-auto hide-scrollbar">
        {/* Header & Global Module Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
              Inventory Ledger & Stock Control
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">
              Real-time raw material stock balances, partial material issuing, batch tracking, and tool management.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleOpenIssueDrawer()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold text-xs flex items-center space-x-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)] border border-purple-500/30 transition-all cursor-pointer"
            >
              <PackageMinus className="w-4 h-4 text-purple-200" />
              <span>Issue Material (Partial / Full)</span>
            </button>

            <button
              onClick={() => setIsAddStockOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-xs flex items-center space-x-2 shadow-[0_1px_3px_rgba(0,0,0,0.12),_inset_0_1px_0_rgba(255,255,255,0.15)] border border-zinc-700/80 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Stock Batch</span>
            </button>

            <Link
              href="/assets"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs flex items-center space-x-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)] border border-indigo-500/30 transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Global Assets & Tools</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by material code, grade, heat # or batch..."
              className="w-full bg-white/90 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-2xl border border-black/5 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 relative">
             <table className="w-full text-left border-collapse relative z-10">
               <thead>
                 <tr className="border-b border-black/5 bg-slate-100/50 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                   <th className="p-4">Material / Batch</th>
                   <th className="p-4">Warehouse & Location</th>
                   <th className="p-4 text-right">Available Qty</th>
                   <th className="p-4 text-right">Unit Value</th>
                   <th className="p-4 text-right">Total Value</th>
                   <th className="p-4">Status</th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-black/5 text-xs text-zinc-800 font-medium">
                 {filteredLedger?.map((batch: any) => {
                   const availQty = Number(batch.availableQty ?? batch.currentQty ?? 0);
                   const isLowStock = availQty <= Number(batch.material?.minStockLevel || 0);
                   return (
                     <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors group">
                       <td className="p-4">
                         <div className="flex items-center">
                           <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mr-3">
                             <Package className="w-4 h-4 text-amber-600" />
                           </div>
                           <div>
                             <div className="font-bold text-zinc-900 text-sm">{batch.material?.materialCode} <span className="text-zinc-500 font-normal">Â· {batch.material?.materialGrade}</span></div>
                             <div className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase flex items-center mt-0.5">
                               {batch.batchNumber} 
                               <span className="mx-2 border-r border-black/10 h-3" /> 
                               {formatDate(batch.createdAt)}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="p-4">
                         <div className="text-xs font-bold text-zinc-800">{batch.location?.warehouse?.warehouseName || 'Main Raw Material Stores'}</div>
                         <div className="text-[10px] text-zinc-400 uppercase font-semibold">{batch.location?.locationName || 'Bin A-1'}</div>
                       </td>
                       <td className="p-4 text-right">
                         <div className="flex items-center justify-end space-x-2">
                           {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                           <span className="font-mono text-zinc-900 font-black text-sm">{availQty}</span>
                           <span className="text-[10px] text-zinc-500 uppercase font-bold">{batch.material?.defaultUom || 'NOS'}</span>
                         </div>
                       </td>
                       <td className="p-4 text-right font-mono text-zinc-600">
                         â‚¹{Number(batch.unitCost).toFixed(2)}
                       </td>
                       <td className="p-4 text-right font-mono font-bold text-indigo-700 text-sm">
                         â‚¹{(availQty * Number(batch.unitCost)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className="p-4">
                         <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                           batch.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                           batch.status === 'RESERVED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                           'bg-slate-100 text-slate-700 border-slate-200'
                         }`}>
                           {batch.status}
                         </span>
                       </td>
                       <td className="p-4 text-right">
                         {batch.status === 'AVAILABLE' && availQty > 0 && (
                           <button
                             onClick={() => handleOpenIssueDrawer(batch)}
                             className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all inline-flex items-center space-x-1"
                           >
                             <PackageMinus className="w-3.5 h-3.5 mr-1 text-purple-600" />
                             <span>Issue Stock</span>
                           </button>
                         )}
                       </td>
                     </tr>
                   )
                 })}
                 {(!filteredLedger || filteredLedger.length === 0) && (
                   <tr>
                     <td colSpan={7} className="p-8 text-center text-zinc-500 text-sm italic">
                       No inventory records found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {/* MODAL: ISSUE MATERIAL (PARTIAL & FULL) */}
      <AnimatePresence>
        {isIssueMaterialOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-2xl bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-900 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-900 flex items-center gap-2.5 tracking-tight">
                    <div className="w-9 h-9 rounded-2xl bg-purple-600/10 text-purple-600 border border-purple-200 flex items-center justify-center">
                      <PackageMinus className="w-5 h-5" />
                    </div>
                    <span>Issue Material (Partial & Full)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Issue raw material stock in partial quantity to project shop floor.</p>
                </div>
                <button 
                  onClick={() => setIsIssueMaterialOpen(false)} 
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueMaterial} className="space-y-6 text-xs">
                <div className="p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-slate-500/5 border border-purple-500/20 rounded-2xl backdrop-blur-xl space-y-4 shadow-xs">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Target Project *</label>
                    <select
                      required
                      value={issueForm.projectId}
                      onChange={(e) => setIssueForm({ ...issueForm, projectId: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/90 border border-slate-200 text-zinc-900 font-semibold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs font-sans"
                    >
                      <option value="">Select Target Project...</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.projectNumber} â€” {p.projectName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Issue Slip Number</label>
                      <input
                        type="text"
                        required
                        value={issueForm.issueNumber}
                        onChange={(e) => setIssueForm({ ...issueForm, issueNumber: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white/90 border border-slate-200 text-zinc-900 font-mono font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Issued To (Employee / Operator) *</label>
                      <select
                        required
                        value={issueForm.issuedToEmployeeId || ''}
                        onChange={(e) => {
                          const empId = e.target.value;
                          const empObj = employees?.find((emp: any) => emp.id === empId);
                          const empName = empObj ? (empObj.name || empObj.employeeName || empObj.code) : '';
                          setIssueForm({ ...issueForm, issuedToEmployeeId: empId, issuedTo: empName });
                        }}
                        className="w-full p-3 rounded-xl bg-white/90 border border-slate-200 text-zinc-900 font-semibold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                      >
                        <option value="">Select Employee / Recipient...</option>
                        {employees?.map((emp: any) => {
                          const deptStr = typeof emp.department === 'object' ? emp.department?.departmentName || '' : (emp.department || '');
                          return (
                            <option key={emp.id} value={emp.id}>
                              {emp.name || emp.employeeName || emp.code} {emp.designation ? `(${emp.designation})` : deptStr ? `[${deptStr}]` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Target Production Shop Selection */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-purple-600" />
                        <span>Target Production Shop *</span>
                      </span>
                      <span className="text-[10px] normal-case font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        Which shop floor will consume this material?
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {PRODUCTION_SHOPS.map((shop) => {
                        const isSelected = issueForm.productionSection === shop.id;
                        return (
                          <button
                            key={shop.id}
                            type="button"
                            onClick={() => setIssueForm({ ...issueForm, productionSection: shop.id, ...(shop.id !== 'PRESS_SHOP' ? { expectedManufactureQty: '' } : {}) })}
                            className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-700 text-white border-purple-500 shadow-md shadow-purple-500/20 scale-[1.02]'
                                : 'bg-white/80 hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-purple-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                {shop.label}
                              </span>
                              {isSelected ? (
                                <span className="w-4 h-4 rounded-full bg-white text-purple-700 flex items-center justify-center font-bold text-[10px]">
                                  âœ“
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </div>
                            <p className={`text-[10px] line-clamp-2 leading-tight ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                              {shop.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expected Manufacture Quantity â€” Press Shop Only */}
                  <AnimatePresence>
                    {issueForm.productionSection === 'PRESS_SHOP' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-white/80 border border-amber-200/80 rounded-2xl backdrop-blur-xl shadow-xs space-y-2">
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-900 mb-1.5 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            Expected Quantity to Manufacture *
                          </label>
                          <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                            How many pieces/parts are expected to be manufactured (stamped/pressed) from this issued raw material?
                          </p>
                          <input
                            type="number"
                            step="1"
                            min={1}
                            required
                            placeholder="e.g. 500"
                            value={issueForm.expectedManufactureQty}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) {
                                setIssueForm({ ...issueForm, expectedManufactureQty: val === '' ? '' : parseInt(val, 10) });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                                e.preventDefault();
                              }
                            }}
                            className="w-full p-3 rounded-xl bg-white/95 border-2 border-amber-300 text-zinc-900 font-mono font-bold text-sm focus:outline-none focus:ring-4 focus:ring-amber-400/20 focus:border-amber-500 shadow-xs placeholder:text-amber-300 placeholder:font-normal transition-all"
                          />
                          <p className="text-[10px] text-amber-600/70 font-medium italic">Must be a whole number (integer). No decimals allowed.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">General Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Issued to operator for CNC setup"
                      value={issueForm.remarks}
                      onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/90 border border-slate-200 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span>Line Items to Issue</span>
                    </h4>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Partial issuing supported
                    </span>
                  </div>

                  {issueForm.items.map((item, idx) => {
                    const selectedBatch = ledger?.find((b: any) => b.id === item.batchId);
                    const avail = selectedBatch ? Number(selectedBatch.availableQty ?? selectedBatch.currentQty ?? 0) : 0;
                    const issuedVal = Number(item.qty || 0);
                    const remaining = Math.max(0, avail - issuedVal);
                    const isPartial = selectedBatch && issuedVal > 0 && issuedVal < avail;
                    const isExceeded = selectedBatch && issuedVal > avail;
                    const pct = avail > 0 ? Math.min(100, (issuedVal / avail) * 100) : 0;

                    return (
                      <div key={idx} className="relative group p-5 bg-gradient-to-b from-white/95 to-slate-50/90 border border-slate-200/90 hover:border-purple-300 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(147,51,234,0.08)] transition-all duration-300 backdrop-blur-xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100/80 text-purple-700 border border-purple-200/60 shadow-xs tracking-wide">
                              LINE ITEM #{idx + 1}
                            </span>
                          </div>
                          {issueForm.items.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = issueForm.items.filter((_, i) => i !== idx);
                                setIssueForm({...issueForm, items: updated});
                              }}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-xl transition-all cursor-pointer"
                              title="Remove line item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Select Stock Batch *</label>
                          <select
                            required
                            value={item.batchId}
                            onChange={(e) => {
                              const newItems = [...issueForm.items];
                              newItems[idx].batchId = e.target.value;
                              setIssueForm({ ...issueForm, items: newItems });
                            }}
                            className="w-full p-3 rounded-xl bg-white border border-slate-200 text-zinc-900 font-semibold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                          >
                            <option value="">Select Stock Batch from Available Ledger...</option>
                            {ledger?.filter((b: any) => b.status === 'AVAILABLE' && Number(b.availableQty ?? b.currentQty ?? 0) > 0).map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {b.material?.materialCode || 'Material'} ({b.material?.materialGrade || 'Grade'}) | Batch: {b.batchNumber} (Available: {b.availableQty ?? b.currentQty})
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedBatch && (
                          <div className="p-4 bg-gradient-to-br from-purple-900/5 via-indigo-900/5 to-slate-900/5 border border-purple-500/20 rounded-xl space-y-3 shadow-inner">
                            <div className="flex justify-between items-center text-xs pb-1 border-b border-purple-500/10">
                              <span className="text-slate-600 font-medium">Material: <strong className="text-slate-900 font-bold">{selectedBatch.material?.materialCode} ({selectedBatch.material?.materialGrade})</strong></span>
                              <span className="text-slate-500 font-mono text-[11px]">Batch: <strong className="text-purple-700 font-bold">{selectedBatch.batchNumber}</strong></span>
                            </div>

                            {/* 3-Pillar Stat Box */}
                            <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-white/90 backdrop-blur-md rounded-xl border border-purple-100 shadow-xs text-center">
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Available</p>
                                <p className="text-base font-extrabold text-slate-800 font-mono mt-0.5">{avail}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-purple-50/80 border border-purple-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Issue Qty</p>
                                <p className="text-base font-extrabold text-purple-700 font-mono mt-0.5">{issuedVal}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50/80">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining Stock</p>
                                <p className={`text-base font-extrabold font-mono mt-0.5 ${remaining === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>{remaining}</p>
                              </div>
                            </div>

                            {/* Consumption progress gauge */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Batch Consumption</span>
                                <span className="font-mono font-bold text-purple-700">{pct.toFixed(0)}% Issued</span>
                              </div>
                              <div className="w-full bg-slate-200/80 h-2.5 rounded-full p-0.5 overflow-hidden shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isExceeded 
                                      ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]' 
                                      : isPartial 
                                        ? 'bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]' 
                                        : 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex justify-between items-center pt-1 text-xs">
                              <span className="text-slate-500 text-[11px] font-medium">Issue Mode:</span>
                              {isExceeded ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> EXCEEDS AVAILABLE STOCK
                                </span>
                              ) : isPartial ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> PARTIAL ISSUE ({remaining} remaining in stock)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> FULL ISSUE (Batch Consumed)
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Quantity to Issue *</label>
                            <input
                              type="number"
                              step="0.001"
                              min={0.001}
                              required
                              value={item.qty}
                              onChange={(e) => {
                                const newItems = [...issueForm.items];
                                newItems[idx].qty = (e.target.value === '' ? ('' as any) : Number(e.target.value));
                                setIssueForm({ ...issueForm, items: newItems });
                              }}
                              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-zinc-900 font-mono font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">Item Remark (Optional)</label>
                            <input
                              type="text"
                              placeholder="Line remark"
                              value={item.remarks}
                              onChange={(e) => {
                                const newItems = [...issueForm.items];
                                newItems[idx].remarks = e.target.value;
                                setIssueForm({ ...issueForm, items: newItems });
                              }}
                              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIssueForm({ ...issueForm, items: [...issueForm.items, { batchId: '', qty: 1, remarks: '' }] })}
                    className="w-full py-3.5 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50/80 text-purple-700 font-bold text-xs rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span>Add Another Material Line</span>
                  </button>
                </div>

                <div className="pt-4 flex justify-end items-center gap-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsIssueMaterialOpen(false)} 
                    className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-zinc-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white font-extrabold text-xs shadow-[0_10px_25px_-5px_rgba(147,51,234,0.4),_inset_0_1px_0_rgba(255,255,255,0.3)] border border-purple-400/30 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                  >
                    <PackageMinus className="w-4 h-4" />
                    <span>Confirm & Issue Material</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD RAW MATERIAL STOCK BATCH */}
      <AnimatePresence>
        {isAddStockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white/95 border border-slate-200 rounded-3xl p-8 shadow-2xl text-zinc-900"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Add Raw Material Stock Batch</h3>
                  <p className="text-xs text-zinc-500">Record manual intake of raw material batch to Inventory Ledger.</p>
                </div>
                <button onClick={() => setIsAddStockOpen(false)} className="text-zinc-400 hover:text-zinc-900 p-2"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleAddStock} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-700 font-bold mb-1">Select Material *</label>
                  <select
                    required
                    value={stockForm.materialId}
                    onChange={(e) => setStockForm({ ...stockForm, materialId: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Select Material</option>
                    {materials.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.materialCode} â€” {m.materialName} ({m.materialGrade})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1">Batch Number</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={stockForm.batchNumber}
                      onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1">Heat Number</label>
                    <input
                      type="text"
                      placeholder="e.g. HT-99841"
                      value={stockForm.heatNumber}
                      onChange={(e) => setStockForm({ ...stockForm, heatNumber: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1">Received Quantity *</label>
                    <input
                      type="number"
                      step="0.001"
                      min={0.001}
                      required
                      value={stockForm.currentQty}
                      onChange={(e) => setStockForm({ ...stockForm, currentQty: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1">Unit Cost (â‚¹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={stockForm.unitCost}
                      onChange={(e) => setStockForm({ ...stockForm, unitCost: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                      className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-zinc-900 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddStockOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-zinc-700 font-bold">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-xs border border-zinc-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.12),_inset_0_1px_0_rgba(255,255,255,0.15)] cursor-pointer">
                    Save Stock Batch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
