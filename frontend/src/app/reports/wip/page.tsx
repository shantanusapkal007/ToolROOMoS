"use client";

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { PackageSearch, CircleDollarSign, Factory, TrendingUp, Layers } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';

export default function WipDashboard() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ledgerRes, valRes] = await Promise.all([
          api.get('/api/v1/production/wip/ledger'),
          api.get('/api/v1/production/wip/valuation')
        ]);
        setLedger(ledgerRes.data.data);
        setValuation(valRes.data.data);
      } catch (err) {
        console.error('Failed to fetch WIP data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-cyan-400 font-mono animate-pulse">Loading WIP Ledger...</div>;

  const currentValuation = valuation.length > 0 ? valuation[0].totalWipValue : 0;
  const materialCost = valuation.length > 0 ? valuation[0].totalMaterialCost : 0;
  const machineCost = valuation.length > 0 ? valuation[0].totalMachineCost : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <PackageSearch className="w-8 h-8 text-cyan-400" />
            WIP Valuation Dashboard
          </h1>
          <p className="text-zinc-500 mt-2 font-mono text-sm">Real-time shop floor capital tracking</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/5 backdrop-blur-xl border border-black/10 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <CircleDollarSign className="w-16 h-16 text-cyan-400" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Total Capital in WIP</p>
          <p className="text-4xl font-black text-zinc-900">{formatCurrency(currentValuation)}</p>
        </div>
        <div className="bg-black/5 backdrop-blur-xl border border-black/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Layers className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Accrued Material Cost</p>
          <p className="text-4xl font-black text-zinc-900">{formatCurrency(materialCost)}</p>
        </div>
        <div className="bg-black/5 backdrop-blur-xl border border-black/10 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Factory className="w-16 h-16 text-orange-400" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Accrued Machine Value</p>
          <p className="text-4xl font-black text-zinc-900">{formatCurrency(machineCost)}</p>
        </div>
      </div>

      {/* Active Ledger */}
      <div className="bg-black/5 backdrop-blur-xl border border-black/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-black/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Active WIP Ledger
          </h2>
          <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold">
            {ledger.length} Active Batches
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/5">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Project / Part</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Material</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Location</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Qty</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Accrued Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.map((row: any) => (
                <tr key={row.id} className="hover:bg-black/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-zinc-900">{row.project?.projectNumber}</div>
                    <div className="text-zinc-500 text-xs truncate max-w-[200px]">{row.project?.partName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-zinc-700">{row.material?.materialCode}</div>
                    <div className="text-zinc-500 text-xs truncate max-w-[200px]">{row.material?.materialName}</div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                      <Factory className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-300 font-mono text-xs font-bold">
                        {row.machine?.machineName || 'Awaiting Routing'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-900">
                    {Number(row.qtyInWip).toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-bold text-emerald-400">
                      {formatCurrency(Number(row.accruedMaterialCost) + Number(row.accruedMachineCost) + Number(row.accruedLabourCost))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ledger.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-mono text-sm">
              No active WIP materials found on the floor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
