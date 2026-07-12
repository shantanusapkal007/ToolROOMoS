'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, IndianRupee } from 'lucide-react';

export default function CostEngineDashboard() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cost-engine/summary')
      .then(res => setSummaries(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getVarianceIndicator = (variance: number) => {
    if (variance > 0) return { icon: TrendingUp, color: 'text-rose-400', label: 'Over Budget' };
    if (variance < 0) return { icon: TrendingDown, color: 'text-emerald-400', label: 'Under Budget' };
    return { icon: Minus, color: 'text-zinc-400', label: 'On Target' };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Project Cost Summary</h2>
        <p className="text-zinc-400 mt-1">Estimated vs Actual cost comparison across all projects.</p>
      </div>

      {/* Cost Summary Table */}
      <div className="bg-zinc-900/30 backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Project</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estimated</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Actual</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Variance</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Deviation %</th>
              <th className="text-center px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Computing cost analysis...</td></tr>
            ) : summaries.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No projects with cost data found.</td></tr>
            ) : (
              summaries.map((s: any) => {
                const indicator = getVarianceIndicator(s.variance?.total || 0);
                const Icon = indicator.icon;
                return (
                  <tr key={s.projectId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">{s.projectNumber}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{s.partName}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400 font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3" />{s.estimated?.total?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-white font-bold font-mono">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3" />{s.actual?.total?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${indicator.color}`}>
                      {s.variance?.total > 0 ? '+' : ''}{s.variance?.total?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono ${indicator.color}`}>
                      {s.variance?.percentDeviation > 0 ? '+' : ''}{s.variance?.percentDeviation || 0}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 ${indicator.color} text-[10px] font-bold uppercase tracking-wider`}>
                        <Icon className="w-3.5 h-3.5" /> {indicator.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
