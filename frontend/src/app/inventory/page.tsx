"use client";

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { PageHeader } from '../../components/ui/PageHeader';
import { useInventoryLedger } from '../../hooks/useInventory';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../lib/formatters';

export default function InventoryPage() {
  const { data: ledger, isLoading } = useInventoryLedger();
  const [searchTerm, setSearchTerm] = useState('');
  
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
    <div className="flex h-screen bg-transparent relative w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem] pr-8 animate-fade-in py-8 overflow-y-auto hide-scrollbar">
        <PageHeader 
          title="Inventory Ledger" 
          subtitle="Real-time stock balances across all warehouses."
        />

        <div className="mt-8 flex justify-between items-center mb-6">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by material or batch..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-bold text-white uppercase tracking-wider flex items-center transition-colors">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
             
             <table className="w-full text-left border-collapse relative z-10">
               <thead>
                 <tr className="border-b border-white/10 bg-white/[0.02]">
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Material / Batch</th>
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Warehouse</th>
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Available Qty</th>
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Unit Value</th>
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Value</th>
                   <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredLedger?.map((batch: any) => {
                   const isLowStock = Number(batch.currentQty) <= Number(batch.material?.minStockLevel || 0);
                   return (
                     <tr key={batch.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                       <td className="p-4">
                         <div className="flex items-center">
                           <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mr-3">
                             <Package className="w-4 h-4 text-amber-400" />
                           </div>
                           <div>
                             <div className="font-bold text-white text-sm">{batch.material?.materialCode} <span className="text-slate-400 font-normal">· {batch.material?.materialGrade}</span></div>
                             <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center mt-0.5">
                               {batch.batchNumber} 
                               <span className="mx-2 border-r border-white/10 h-3" /> 
                               {formatDate(batch.createdAt)}
                             </div>
                           </div>
                         </div>
                       </td>
                       <td className="p-4">
                         <div className="text-sm font-medium text-slate-300">{batch.location?.warehouse?.warehouseName || '—'}</div>
                         <div className="text-[10px] text-slate-500 uppercase tracking-wider">{batch.location?.locationName || '—'}</div>
                       </td>
                       <td className="p-4 text-right">
                         <div className="flex items-center justify-end space-x-2">
                           {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                           <span className="font-mono text-white font-bold">{batch.currentQty}</span>
                           <span className="text-[10px] text-slate-500 uppercase">{batch.material?.defaultUom}</span>
                         </div>
                       </td>
                       <td className="p-4 text-right font-mono text-slate-300">
                         ₹{Number(batch.unitCost).toFixed(2)}
                       </td>
                       <td className="p-4 text-right font-mono font-bold text-amber-400">
                         ₹{(Number(batch.currentQty) * Number(batch.unitCost)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </td>
                       <td className="p-4">
                         <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                           batch.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                           batch.status === 'RESERVED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                           'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                         }`}>
                           {batch.status}
                         </span>
                       </td>
                     </tr>
                   )
                 })}
                 {(!filteredLedger || filteredLedger.length === 0) && (
                   <tr>
                     <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                       No inventory records found.
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
