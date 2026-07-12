'use client';

import React from 'react';
import { IndianRupee, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, Sparkles, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useProject } from '../../../hooks/useProjects';
import { useProjectBOM } from '../../../hooks/useEngineering';
import { formatCurrency } from '../../../lib/formatters';

export default function ProjectCosting() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const rawId = projectIdParam ? projectIdParam.replace('PRJ-', '') : '';
  
  const { data: project, isLoading } = useProject(rawId);
  const projectId = projectIdParam || '';
  const { data: bomRes } = useProjectBOM(projectId);

  if (!projectIdParam) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 h-full">
        Select a project to view detailed cost breakdowns.
      </div>
    );
  }

  if (isLoading || !project) return null;

  const cs = project.projectCostSummary;

  // Real data from ProjectCostSummary
  const estimatedMaterial = Number(cs?.estimatedMaterialCost || 0);
  const estimatedMachine = Number(cs?.estimatedMachineCost || 0);
  const estimatedLabour = Number(cs?.estimatedLabourCost || 0);
  const estimatedOutside = Number(cs?.estimatedOutsideProcessCost || 0);
  const estimatedTotal = Number(cs?.estimatedProjectCost || 0);

  const actualMaterial = Number(cs?.actualMaterialCost || 0);
  const materialConsumed = Number(cs?.materialConsumptionCost || 0);
  const machineCost = Number(cs?.machineCost || 0);
  const labourCost = Number(cs?.labourCost || 0);
  const outsideProcess = Number(cs?.outsideProcessCost || 0);
  const inspectionCost = Number(cs?.inspectionCost || 0);
  const packingCost = Number(cs?.packingCost || 0);
  const dispatchCost = Number(cs?.dispatchCost || 0);
  const totalCost = Number(cs?.totalCost || 0);
  const revenue = Number(cs?.revenue || 0);
  const profitability = Number(cs?.profitability || 0);

  const liveMargin = revenue - totalCost;
  const liveMarginPct = revenue > 0 ? (liveMargin / revenue) * 100 : 0;
  const estimatedMargin = revenue - estimatedTotal;
  const estimatedMarginPct = revenue > 0 ? (estimatedMargin / revenue) * 100 : 0;

  const costBreakdown = [
    { category: 'Material Procurement (GRN)', est: estimatedMaterial, act: actualMaterial, color: 'text-purple-400', source: 'GRN → Purchase Order material costs' },
    { category: 'Material Consumed (Issues)', est: estimatedMaterial, act: materialConsumed, color: 'text-violet-400', source: 'Material Issues × Material Rates' },
    { category: 'Machine Costs (Internal)', est: estimatedMachine, act: machineCost, color: 'text-blue-400', source: 'MSDR Logs × Machine Hourly Rates' },
    { category: 'Labour Costs', est: estimatedLabour, act: labourCost, color: 'text-amber-400', source: 'Operator Timesheets × Labour Rates' },
    { category: 'Outside Process / Subcontracting', est: estimatedOutside, act: outsideProcess, color: 'text-orange-400', source: 'Vendor Bills (Subcontract GRN)' },
    { category: 'Quality & Inspection', est: 0, act: inspectionCost, color: 'text-emerald-400', source: 'Inspection timesheets & test costs' },
    { category: 'Packing & Logistics', est: 0, act: packingCost + dispatchCost, color: 'text-pink-400', source: 'Dispatch challans & packing records' },
  ];

  const totalEst = costBreakdown.reduce((acc, row) => acc + row.est, 0);
  const totalAct = costBreakdown.reduce((acc, row) => acc + row.act, 0);

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-8 animate-fade-in">
      
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="glass-panel p-5 flex flex-col gap-1.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
            <IndianRupee className="w-20 h-20" />
          </div>
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Invoice / Revenue</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">₹ {revenue.toLocaleString()}</div>
          <p className="text-[10px] text-zinc-500 font-bold">Total billed to customer</p>
        </div>
        
        <div className="glass-panel p-5 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Estimated Cost</div>
          <div className="text-2xl font-black text-amber-400 mt-1">₹ {(estimatedTotal || totalEst).toLocaleString()}</div>
          <p className="text-[10px] text-zinc-500 font-bold">Engineering cost baseline</p>
        </div>
        
        <div className="glass-panel p-5 flex flex-col gap-1.5 border border-blue-500/20 bg-blue-500/[0.02]">
          <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Actual Cost (Live)</div>
          <div className="text-2xl font-black text-blue-400 mt-1">₹ {totalCost.toLocaleString()}</div>
          <p className="text-[10px] text-zinc-500 font-bold">Auto-aggregated from transactions</p>
        </div>
        
        <div className={`glass-panel p-5 flex flex-col gap-1.5 border ${liveMargin >= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'}`}>
          <div className={`text-[10px] uppercase font-black tracking-widest ${liveMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Live Margin</div>
          <div className={`text-2xl font-black mt-1 flex items-baseline gap-2 ${liveMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ₹ {liveMargin.toLocaleString()}
            <span className="text-sm font-bold opacity-80">({liveMarginPct.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
            {liveMargin >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
            {liveMargin >= 0 ? 'Healthy margin' : 'Over budget — review costs'}
          </div>
        </div>
      </div>

      {/* Cost Breakdown Table */}
      <div className="glass-panel flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" /> Real-time Cost Breakdown
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Auto-calculated from transactions
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] sticky top-0 backdrop-blur-md z-10 border-b border-white/5">
              <tr>
                <th className="py-3 px-4 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Cost Category</th>
                <th className="py-3 px-4 text-right font-bold text-[10px] uppercase tracking-wider text-zinc-500">Estimated</th>
                <th className="py-3 px-4 text-right font-bold text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/5">Actual (Live)</th>
                <th className="py-3 px-4 text-right font-bold text-[10px] uppercase tracking-wider text-zinc-500">Variance</th>
                <th className="py-3 px-4 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500 w-64">Calculation Source</th>
              </tr>
            </thead>
            <tbody>
              {costBreakdown.map((row, i) => {
                const variance = row.est - row.act;
                const overBudget = variance < 0;
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className={`py-3.5 px-4 font-bold ${row.color}`}>{row.category}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-zinc-400 font-mono">
                      {row.est > 0 ? `₹ ${row.est.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-zinc-100 bg-blue-500/5 group-hover:bg-blue-500/10 font-mono">
                      ₹ {row.act.toLocaleString()}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold font-mono ${overBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                      {row.est > 0 ? (
                        <>
                          {overBudget && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {overBudget ? '-' : '+'}₹ {Math.abs(variance).toLocaleString()}
                        </>
                      ) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500 font-medium">{row.source}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-white/[0.02] sticky bottom-0 border-t border-white/10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <tr>
                <td className="py-4 px-4 font-black text-white text-sm">TOTAL PROJECT COST</td>
                <td className="py-4 px-4 text-right font-black text-amber-400 font-mono">₹ {(estimatedTotal || totalEst).toLocaleString()}</td>
                <td className="py-4 px-4 text-right font-black text-blue-400 text-lg bg-blue-500/5 font-mono">₹ {totalCost.toLocaleString()}</td>
                <td className={`py-4 px-4 text-right font-black font-mono ${((estimatedTotal || totalEst) - totalCost) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {((estimatedTotal || totalEst) - totalCost) < 0 ? '-' : '+'}₹ {Math.abs((estimatedTotal || totalEst) - totalCost).toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
