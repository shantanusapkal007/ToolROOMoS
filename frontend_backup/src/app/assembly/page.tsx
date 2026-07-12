'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Layers, Combine, Cpu, Wrench } from 'lucide-react';

export default function AssemblyDashboard() {
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssemblies = () => {
    setLoading(true);
    api.get('/assembly/pending')
      .then(res => setAssemblies(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAssemblies(); }, []);

  const handleExecute = async (id: string, qty: number) => {
    try {
      await api.post(`/assembly/${id}/execute`, { qty });
      alert('Assembly executed. Materials consumed and Finished Good generated.');
      loadAssemblies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to execute assembly');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Assembly Floor</h2>
        <p className="text-zinc-400 mt-1">Combine components into Finished Goods.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-zinc-500 py-12">Scanning pending assemblies...</div>
        ) : assemblies.length === 0 ? (
          <div className="col-span-full text-center text-zinc-500 py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            No pending assemblies.
          </div>
        ) : (
          assemblies.map(asm => (
            <div key={asm.id} className="relative group bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 transition-all hover:border-indigo-500/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Combine className="w-5 h-5 text-indigo-500" />
                    {asm.material?.materialName || 'Unknown Material'}
                  </h3>
                  <div className="text-indigo-400 text-xs font-mono mt-1">BOM NO: {asm.bomHeader?.bomNumber || 'N/A'}</div>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Target Qty: {asm.requiredQty}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Required Components</h4>
                <div className="space-y-2">
                  {asm.childItems?.map((child: any) => (
                    <div key={child.id} className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-300">{child.material?.materialName || 'Item'}</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-400 border border-white/10 px-2 py-0.5 rounded">
                        Qty: {child.requiredQty}
                      </span>
                    </div>
                  ))}
                  {(!asm.childItems || asm.childItems.length === 0) && (
                    <div className="text-xs text-zinc-600 italic">No components linked to this BOM item.</div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleExecute(asm.id, Number(asm.requiredQty))}
                disabled={!asm.childItems || asm.childItems.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:pointer-events-none text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                <Wrench className="w-4 h-4" /> Execute Assembly
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
