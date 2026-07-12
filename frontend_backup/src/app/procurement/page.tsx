'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ShoppingCart, Clock, CheckCircle2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProcurementDashboard() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/procurement/purchase-orders').then(res => setPurchaseOrders(res?.data?.data || res?.data || [])).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Purchase Orders</h2>
        <p className="text-zinc-400 mt-1">Manage vendor financial commitments and deliveries.</p>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active POs', value: purchaseOrders.filter(p => p.status !== 'CLOSED').length, icon: <ShoppingCart className="w-5 h-5 text-blue-400" /> },
          { label: 'Pending Delivery', value: purchaseOrders.filter(p => p.status === 'SENT').length, icon: <Clock className="w-5 h-5 text-amber-400" /> },
          { label: 'Fulfilled', value: purchaseOrders.filter(p => p.status === 'CLOSED').length, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
          { label: 'Total Value Committed', value: `₹${purchaseOrders.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)}`, icon: <DollarSign className="w-5 h-5 text-purple-400" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:bg-white/[0.04] transition-colors cursor-default">
            <div className="flex items-center gap-3 mb-3">
              {stat.icon}
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* PO Listing */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">PO Number</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Project</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Vendor</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Value</th>
              <th className="px-5 py-4 text-xs font-medium tracking-wider text-zinc-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-zinc-500">
                  No Purchase Orders found.
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => (
                <tr 
                  key={po.id} 
                  onClick={() => router.push(`/procurement/po/${po.id}`)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">{po.poNumber}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{new Date(po.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-zinc-300">{po.project?.projectNumber || 'Unknown'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-zinc-300">{po.vendor?.vendorName || 'Unknown'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-mono text-zinc-300">₹{po.totalAmount}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      po.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      po.status === 'DRAFT' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {po.status}
                    </span>
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
