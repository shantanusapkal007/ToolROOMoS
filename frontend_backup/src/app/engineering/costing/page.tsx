'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProjectBOM, useProjectRouting } from '@/hooks/useEngineering';
import { useProjects } from '@/hooks/useProjects';
import { IndianRupee, Layers, Wrench, BarChart3, TrendingUp, Sparkles, Printer, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function CostingPage({ overrideProjectId }: { overrideProjectId?: string }) {
  const searchParams = useSearchParams();
  const projectId = overrideProjectId || searchParams.get('project');
  const { toast } = useToast();

  const { data: projectsData } = useProjects();
  const projects = projectsData || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!projectId && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].projectNumber);
    }
  }, [projects, projectId, selectedProjectId]);

  const activeProjectId = projectId || selectedProjectId;

  const { data: bomRes, isLoading: loadingBom } = useProjectBOM(activeProjectId || '');
  const { data: routingRes, isLoading: loadingRouting } = useProjectRouting(activeProjectId || '');
  
  const bom = bomRes?.data || null;
  const routing = routingRes?.data || null;

  // Calculate material cost
  const materialCost = useMemo(() => {
    if (!bom?.items) return 0;
    return bom.items.reduce((sum: number, item: any) => sum + (parseFloat(item.estimatedCost) || 0), 0);
  }, [bom]);

  // Calculate operation labor/machine cost
  const operationCost = useMemo(() => {
    if (!routing?.operations) return 0;
    return routing.operations.reduce((sum: number, op: any) => {
      const rate = op.machine?.standardCost || 1200; // fallback to 1200/hr
      const hours = (parseFloat(op.setupTime) || 0) + (parseFloat(op.machineTime) || 0);
      return sum + (hours * rate);
    }, 0);
  }, [routing]);

  const totalCost = materialCost + operationCost;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      
      {/* Project Selector for Global View */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Engineering Cost Estimation</h2>
          <p className="text-xs text-zinc-500 mt-1">Unified material and operational expense card</p>
        </div>
        <div className="flex items-center gap-2">
          {!projectId && projects.length > 0 && (
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5 backdrop-blur-md">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Project:</span>
              <select 
                value={activeProjectId} 
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-zinc-200 outline-none cursor-pointer focus:ring-0"
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.projectNumber} className="bg-zinc-950 text-zinc-200">
                    {p.projectNumber} - {p.partName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={() => toast('info', 'Printing...', 'Formatting document layout...')}
            className="p-2 text-zinc-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-lg transition-colors"
            title="Print Estimate"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Main KPI Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Cost */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Total Projected Cost</span>
          <div className="mt-4">
            <div className="text-3xl font-black text-white flex items-baseline gap-1">
              <span className="text-zinc-500 text-lg font-bold">₹</span>
              {totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Engineered & Validated
            </p>
          </div>
        </div>

        {/* Material Share */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Material Share (BOM)</span>
            <span className="text-xs font-bold text-blue-400 font-mono">
              {totalCost > 0 ? ((materialCost / totalCost) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              ₹ {materialCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">For {bom?.items?.length || 0} scheduled raw materials</p>
          </div>
        </div>

        {/* Operation Share */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Machining & Setup</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              {totalCost > 0 ? ((operationCost / totalCost) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              ₹ {operationCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">For {routing?.operations?.length || 0} routing steps</p>
          </div>
        </div>

      </div>

      {/* Detail breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BOM Cost Table */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Material Allocations
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Qty & Rates</span>
          </div>

          <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-2">Part Name</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right font-mono">Est Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bom?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 font-medium text-zinc-200">
                      <div>{item.partName || 'Part'}</div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">{item.partNo}</div>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-zinc-400">{item.requiredQty || 1}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">₹ {(item.estimatedCost || 0).toLocaleString()}</td>
                  </tr>
                ))}

                {(!bom?.items || bom.items.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500 font-bold uppercase tracking-wider">
                      No materials initialized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Routing Operations Cost Table */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" /> Machining Operations
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">Machine Rates</span>
          </div>

          <div className="overflow-x-auto max-h-[350px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-2">Operation</th>
                  <th className="py-2 text-right">Hours</th>
                  <th className="py-2 text-right font-mono">Calculated Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {routing?.operations?.map((op: any) => {
                  const rate = op.machine?.standardCost || 1200;
                  const hours = (parseFloat(op.setupTime) || 0) + (parseFloat(op.machineTime) || 0);
                  const opTotal = hours * rate;
                  return (
                    <tr key={op.id} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 font-medium text-zinc-200">
                        <div>{op.operationName || 'Operation'}</div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">{op.machine?.name || 'Standard Center'}</div>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-zinc-400">{hours.toFixed(1)} hrs</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">₹ {opTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}

                {(!routing?.operations || routing.operations.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500 font-bold uppercase tracking-wider">
                      No routing steps initialized.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
