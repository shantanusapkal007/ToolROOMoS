'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Package, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PurchasingTab() {
  const params = useParams();
  const projectIdRaw = params.id as string;
  const projectId = projectIdRaw.startsWith('PRJ-') ? projectIdRaw : `PRJ-${projectIdRaw.padStart(3, '0')}`;
  
  const [mrpRuns, setMrpRuns] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [isRunningMrp, setIsRunningMrp] = useState(false);

  const fetchPlanningData = async () => {
    try {
      const [mrpRes, prRes] = await Promise.all([
        api.get(`/planning/projects/${projectId}/mrp/runs`),
        api.get(`/planning/projects/${projectId}/purchase-requests`)
      ]);
      setMrpRuns(mrpRes?.data?.data || mrpRes?.data || []);
      setPurchaseRequests(prRes?.data?.data || prRes?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (projectId) fetchPlanningData();
  }, [projectId]);

  const handleRunMrp = async () => {
    setIsRunningMrp(true);
    try {
      await api.post(`/planning/projects/${projectId}/mrp/run`);
      await fetchPlanningData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningMrp(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Material Planning & Procurement</h2>
          <p className="text-sm text-zinc-400 mt-1">Explode BOM, analyze shortages, and track purchase requests.</p>
        </div>
        <button 
          onClick={handleRunMrp}
          disabled={isRunningMrp}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isRunningMrp ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
          }`}
        >
          <Activity className={`w-4 h-4 ${isRunningMrp ? 'animate-spin' : ''}`} />
          {isRunningMrp ? 'Running Engine...' : 'Run MRP Engine'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MRP Runs Column */}
        <div className="col-span-1 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Recent MRP Runs</h3>
          {mrpRuns.length === 0 ? (
            <div className="p-6 text-center border border-white/[0.05] rounded-xl bg-white/[0.02]">
              <Package className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No MRP runs detected.</p>
            </div>
          ) : (
            mrpRuns.map(run => (
              <div key={run.id} className="p-4 border border-white/[0.05] rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-zinc-500">{new Date(run.createdAt).toLocaleString()}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {run.status}
                  </span>
                </div>
                
                {run.exceptions?.length > 0 ? (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">Shortages Detected</span>
                    </div>
                    <ul className="space-y-1 mt-2">
                      {run.exceptions.map((ex: any) => (
                        <li key={ex.id} className="text-[11px] text-amber-200/70 truncate">
                          &bull; {ex.material?.materialCode || 'Unknown'}: {ex.exceptionMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">All materials fulfilled</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Purchase Requests Column */}
        <div className="col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Generated Purchase Requests</h3>
          {purchaseRequests.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center border border-white/[0.05] rounded-xl bg-white/[0.02]">
              <p className="text-sm text-zinc-500">Run MRP to automatically generate purchase requests for shortages.</p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">PR Number</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {purchaseRequests.map(pr => (
                    <tr key={pr.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">{pr.requestNumber}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{pr.items?.length || 0} line items</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">
                          {pr.items?.map((i:any) => i.material?.materialCode).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-400 font-mono">
                        {new Date(pr.requestDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          pr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          pr.status === 'DRAFT' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
