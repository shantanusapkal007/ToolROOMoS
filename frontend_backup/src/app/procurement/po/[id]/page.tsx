'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2, FileText, Truck, DollarSign } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PurchaseOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;
  const [po, setPo] = useState<any>(null);

  useEffect(() => {
    if (poId) {
      // For a real app, you'd add a dedicated GET /procurement/purchase-orders/:id endpoint
      // Here we just fetch all and filter for the demo
      api.get('/procurement/purchase-orders').then(res => {
        const data = res?.data?.data || res?.data || [];
        const found = data.find((p: any) => p.id === poId);
        if (found) setPo(found);
      }).catch(console.error);
    }
  }, [poId]);

  if (!po) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/procurement')}
          className="p-2 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-colors border border-white/[0.04]"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{po.poNumber}</h2>
          <p className="text-zinc-400 mt-1">Vendor: {po.vendor?.vendorName} | Project: {po.project?.projectNumber}</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase border ${
            po.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            po.status === 'DRAFT' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
            'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {po.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Line Items */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="px-5 py-4 border-b border-white/[0.05] bg-white/[0.01]">
            <h3 className="text-sm font-semibold text-white">Line Items</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-5 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Material</th>
                <th className="px-5 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Ordered</th>
                <th className="px-5 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Received</th>
                <th className="px-5 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Rate</th>
                <th className="px-5 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {po.items?.map((item: any) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-sm text-white font-medium">{item.material?.materialCode || 'Unknown'}</td>
                  <td className="px-5 py-4 text-sm text-zinc-300 font-mono">{item.orderedQty}</td>
                  <td className="px-5 py-4 text-sm text-blue-400 font-mono">{item.receivedQty}</td>
                  <td className="px-5 py-4 text-sm text-zinc-300 font-mono">₹{item.agreedRate}</td>
                  <td className="px-5 py-4 text-sm text-zinc-300 font-mono">₹{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar Actions */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-white font-mono">₹{po.totalAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Discount</span>
                <span className="text-emerald-400 font-mono">-₹{po.discount}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/[0.05] pt-3 mt-3">
                <span className="text-white font-medium">Total Payable</span>
                <span className="text-blue-400 font-bold font-mono">₹{po.totalAmount - po.discount + po.freight}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button className="flex items-center gap-3 w-full p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/[0.05] transition-colors text-sm text-zinc-300">
                <Truck className="w-4 h-4 text-blue-400" /> Verify Goods Receipt
              </button>
              <button className="flex items-center gap-3 w-full p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg border border-white/[0.05] transition-colors text-sm text-zinc-300">
                <FileText className="w-4 h-4 text-amber-400" /> Register Vendor Bill
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
