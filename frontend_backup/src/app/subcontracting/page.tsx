'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowUpRight, ArrowDownLeft, FileCheck } from 'lucide-react';

export default function SubcontractingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subcontracting/orders')
      .then(res => setOrders(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Active Subcontract Orders</h2>
        <p className="text-zinc-400 mt-1">Manage WIP material sent outside for specialized processing.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Challan / Order #</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Vendor</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Status</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase text-right">Est. Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">Scanning active orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">No active subcontract orders.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-white group-hover:text-fuchsia-400 transition-colors">{order.challanNumber}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 font-mono">{order.project?.projectCode || 'No Project'}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-300">
                    {order.vendor?.vendorName || order.vendorId}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                      ${order.status === 'ISSUED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        order.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-white font-mono text-right">
                    ${Number(order.totalEstimatedCost || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
