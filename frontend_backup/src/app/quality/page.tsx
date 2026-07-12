'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FileCheck2, Fingerprint, Activity, ClipboardCheck } from 'lucide-react';

export default function QualityDashboard() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInspections = () => {
    setLoading(true);
    api.get('/quality/inspections/pending')
      .then(res => setInspections(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInspections(); }, []);

  const handleApprove = async (id: string, qty: number) => {
    try {
      await api.post(`/quality/inspections/${id}/complete`, {
        passedQty: qty,
        reworkQty: 0,
        scrapQty: 0,
        result: 'PASS'
      });
      alert('Inspection cleared successfully.');
      loadInspections();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to clear inspection');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pending Inspections</h2>
          <p className="text-zinc-400 mt-1">Review incoming material and shop floor output.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-zinc-500 py-12">Loading inspections...</div>
        ) : inspections.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            No pending inspections. Quality queue is clear.
          </div>
        ) : (
          inspections.map(inspection => (
            <div key={inspection.id} className="relative group bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all hover:border-cyan-500/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{inspection.inspectionNumber}</h3>
                  <div className="text-cyan-400 text-xs font-mono mt-0.5">{inspection.project?.projectCode || 'General'}</div>
                </div>
                <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {inspection.inspectionType.replace('_', ' ')}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Fingerprint className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">Qty: <strong className="text-white">{inspection.inspectedQty} units</strong></span>
                </div>
                {inspection.routingOperation && (
                  <div className="flex items-center gap-3 text-zinc-300">
                    <Activity className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm">Operation: {inspection.routingOperation.operationName}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button 
                  onClick={() => handleApprove(inspection.id, Number(inspection.inspectedQty))}
                  className="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl py-2.5 text-sm font-bold transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" /> Pass All
                </button>
                <button className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl py-2.5 text-sm font-bold transition-colors">
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
