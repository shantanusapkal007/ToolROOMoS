'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Truck, Box, Navigation, User } from 'lucide-react';

export default function DispatchDashboard() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDispatches = () => {
    setLoading(true);
    api.get('/dispatch/notes')
      .then(res => setDispatches(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDispatches(); }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Outbound Shipments</h2>
          <p className="text-zinc-400 mt-1">Delivery challans and executed logistics.</p>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
          <Truck className="w-4 h-4" /> New Dispatch Note
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-zinc-500 py-12">Loading dispatch logs...</div>
        ) : dispatches.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            No outbounds logged.
          </div>
        ) : (
          dispatches.map(dispatch => (
            <div key={dispatch.id} className="relative group bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all hover:border-orange-500/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{dispatch.dispatchNumber}</h3>
                  <div className="text-orange-400 text-xs font-mono mt-0.5">{new Date(dispatch.dispatchDate).toLocaleDateString()}</div>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {dispatch.status}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-zinc-300">
                  <User className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm line-clamp-1">{dispatch.customer?.name || 'Walk-in'}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Box className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">Total Qty: <strong className="text-white">{dispatch.dispatchQty}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-zinc-300">
                  <Navigation className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">Vehicle: {dispatch.vehicleNumber || 'Pending Logistics'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2">
                {dispatch.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-zinc-400 truncate max-w-[200px]">{item.partDescription}</span>
                    <span className="text-white font-mono">{item.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
