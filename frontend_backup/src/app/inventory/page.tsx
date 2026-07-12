'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layers, Database, ArrowRight } from 'lucide-react';

export default function InventoryDashboard() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventory/stock')
      .then(res => setStock(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Global Stock Ledger</h2>
        <p className="text-zinc-400 mt-1">Real-time visibility into all warehouse inventory locations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Total SKUs in Stock</h3>
          </div>
          <p className="text-3xl font-bold font-mono text-white">{stock.length}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Total Units</h3>
          </div>
          <p className="text-3xl font-bold font-mono text-white">
            {stock.reduce((sum, s) => sum + Number(s.availableQuantity || s.availableQty || s.currentQuantity || 0), 0)}
          </p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Material / Grade</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Warehouse</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Total Qty</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase text-right">Available Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">Loading ledger...</td></tr>
            ) : stock.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">No stock found in ledger.</td></tr>
            ) : (
              stock.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{s.material?.materialCode || 'Unknown'}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{s.material?.materialGrade}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {s.warehouse?.name || 'Main WH'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-300 font-mono">{s.currentQuantity || s.currentQty || 0}</td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-400 font-mono text-right">{s.availableQuantity || s.availableQty || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
