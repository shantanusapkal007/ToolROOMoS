'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useProjectBOM, useProjectRouting } from '@/hooks/useEngineering';
import { useProjects } from '@/hooks/useProjects';
import { Cpu, FileText, Settings, ArrowUpRight, Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function EngineeringDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');

  const { data: projectsData } = useProjects();
  const projects = projectsData || [];

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!projectIdParam && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].projectNumber);
    }
  }, [projects, projectIdParam, selectedProjectId]);

  const activeProjectId = projectIdParam || selectedProjectId;

  const { data: bomRes } = useProjectBOM(activeProjectId || '');
  const { data: routingRes } = useProjectRouting(activeProjectId || '');

  const bom = bomRes?.data || null;
  const routing = routingRes?.data || null;

  const totalCost = useMemo(() => {
    if (!bom?.items) return 0;
    return bom.items.reduce((sum: number, item: any) => sum + (parseFloat(item.estimatedCost) || 0), 0);
  }, [bom]);

  const progress = useMemo(() => {
    let p = 0;
    if (bom) {
      if (bom.approvalStatus === 'APPROVED') p += 50;
      else if (bom.approvalStatus === 'PENDING') p += 30;
      else p += 15;
    }
    if (routing) {
      if (routing.approvalStatus === 'APPROVED') p += 50;
      else if (routing.approvalStatus === 'PENDING') p += 30;
      else p += 15;
    }
    return p;
  }, [bom, routing]);

  const approvalStatusColors: Record<string, string> = {
    APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    DRAFT: 'text-zinc-400 bg-white/[0.04] border-white/[0.08]',
  };

  return (
    <div className="h-full flex flex-col min-h-0 relative overflow-y-auto custom-scrollbar">
      {/* Project selector dropdown for global view */}
      {!projectIdParam && projects.length > 0 && (
        <div className="flex justify-end mb-4 shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5 backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Project:</span>
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
        </div>
      )}

      <div className="space-y-6 pb-6 animate-fade-in">
        
        {/* Top Row: Gauge + KPI Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Release completion gauge */}
          <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Cpu className="w-32 h-32" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Release Readiness</h3>
              <p className="text-xs text-zinc-500 mt-1">Engineering validation metrics</p>
              <div className="mt-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-2xl font-black text-white">{progress}% Released</span>
              </div>
            </div>
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="38" className="stroke-white/[0.03] fill-none" strokeWidth="6" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="38" 
                  className="stroke-emerald-400 fill-none transition-all duration-1000 ease-out" 
                  strokeWidth="6" 
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - progress / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-mono font-bold text-white">{progress}%</span>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Est. Material Cost</span>
                <span className="text-emerald-400 text-xs font-bold">BOM Summary</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">₹ {totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <p className="text-[11px] text-zinc-500 mt-1">Based on standard resource rates</p>
              </div>
            </div>

            <div className="glass-panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Scope Density</span>
                <span className="text-blue-400 text-xs font-bold">Workbench</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">
                  {bom?.items?.length || 0} Parts / {routing?.operations?.length || 0} Ops
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Foundational manufacturing nodes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document States Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all border border-white/[0.04]">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-zinc-200">Bill of Materials (BOM)</h4>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${approvalStatusColors[bom?.approvalStatus || 'DRAFT']}`}>
                  {bom?.approvalStatus || 'DRAFT'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {bom ? `BOM Document No: ${bom.documentNumber}` : 'BOM is not initialized for this project.'}
              </p>
              {bom?.items && (
                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Structured Parts</span>
                    <span className="font-bold text-white">{bom.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latest Revision</span>
                    <span className="font-bold text-white">v{bom.revision || 1}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  if (bom) {
                    router.push(`/engineering/bom?project=${activeProjectId}&bomId=${bom.id}`);
                  } else {
                    router.push(`/engineering/bom?project=${activeProjectId}&bomId=new`);
                  }
                }}
                className="text-xs text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1"
              >
                Open Workbench <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all border border-white/[0.04]">
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-zinc-200">Machine Routing</h4>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${approvalStatusColors[routing?.approvalStatus || 'DRAFT']}`}>
                  {routing?.approvalStatus || 'DRAFT'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {routing ? `Routing Document No: ${routing.routingNumber}` : 'Routing is not initialized for this project.'}
              </p>
              {routing?.operations && (
                <div className="mt-4 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Routing Operations</span>
                    <span className="font-bold text-white">{routing.operations.length} Steps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Lead Time</span>
                    <span className="font-bold text-white">
                      {(routing.operations.reduce((sum: number, op: any) => sum + (parseFloat(op.setupTime) || 0) + (parseFloat(op.machineTime) || 0), 0)).toFixed(1)} Hrs
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => {
                  if (routing) {
                    router.push(`/engineering/routing?project=${activeProjectId}&routingId=${routing.id}`);
                  } else {
                    router.push(`/engineering/routing?project=${activeProjectId}&routingId=new`);
                  }
                }}
                className="text-xs text-emerald-400 font-bold hover:text-emerald-300 flex items-center gap-1"
              >
                Open Workbench <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function EngineeringPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <EngineeringDashboardContent />
    </Suspense>
  );
}
