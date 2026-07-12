'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProjectBOM, useProjectRouting } from '@/hooks/useEngineering';
import { useProjects } from '@/hooks/useProjects';
import { Clock, User, ArrowLeft, ArrowRight, RotateCcw, ShieldCheck, FileText, Settings, Sparkles } from 'lucide-react';

export default function HistoryPage({ overrideProjectId }: { overrideProjectId?: string }) {
  const searchParams = useSearchParams();
  const projectId = overrideProjectId || searchParams.get('project');

  const { data: projectsData } = useProjects();
  const projects = projectsData || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!projectId && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].projectNumber);
    }
  }, [projects, projectId, selectedProjectId]);

  const activeProjectId = projectId || selectedProjectId;

  const { data: bomRes } = useProjectBOM(activeProjectId || '');
  const { data: routingRes } = useProjectRouting(activeProjectId || '');

  const bom = bomRes?.data || null;
  const routing = routingRes?.data || null;

  const [historyItems, setHistoryItems] = useState([
    { id: '1', date: '2026-07-09 14:10', user: 'Shantanu (Lead Engineer)', type: 'Routing', action: 'Approved Machine Routing', revision: 'v2', desc: 'Released routing schema to shopfloor production' },
    { id: '2', date: '2026-07-09 10:45', user: 'Shantanu (Lead Engineer)', type: 'Routing', action: 'Modified Operation 20 setup time', revision: 'v1.1', desc: 'Increased Setup Time on VMC-01 from 1.0 Hr to 1.5 Hr' },
    { id: '3', date: '2026-07-08 16:30', user: 'Shantanu (Lead Engineer)', type: 'BOM', action: 'Approved Bill of Materials', revision: 'v1', desc: 'Finalized drawing specifications and material allocations' },
    { id: '4', date: '2026-07-08 12:15', user: 'System (Automated)', type: 'BOM', action: 'Imported Initial BOM from CAD', revision: 'v0.1', desc: 'Parsed BOM excel file automatically from SolidWorks release' }
  ]);

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      
      {/* Project Selector for Global View */}
      {!projectId && projects.length > 0 && (
        <div className="flex justify-end shrink-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revision Context Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Workbench Status</h3>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded bg-white/[0.01] border border-white/5 space-y-2">
                <div className="flex justify-between items-center font-semibold text-zinc-200">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> BOM Release
                  </span>
                  <span className="text-emerald-400">v{bom?.revision || 1}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <span>Status</span>
                  <span>{bom?.approvalStatus || 'DRAFT'}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-white/[0.01] border border-white/5 space-y-2">
                <div className="flex justify-between items-center font-semibold text-zinc-200">
                  <span className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-emerald-400" /> Routing Release
                  </span>
                  <span className="text-emerald-400">v{routing?.revision || 1}</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                  <span>Status</span>
                  <span>{routing?.approvalStatus || 'DRAFT'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 flex flex-col h-full">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6">Revision Timeline</h3>

            {/* Timeline Stream */}
            <div className="relative pl-6 border-l border-white/10 space-y-8 custom-scrollbar max-h-[500px]">
              {historyItems.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Bullet */}
                  <span className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/10 group-hover:bg-emerald-300 transition-all" />
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-zinc-500 font-mono">{item.date}</span>
                      <span className="text-zinc-700">|</span>
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-500" /> {item.user}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {item.action}
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-white/[0.04] border border-white/5 text-zinc-400">
                        {item.revision}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-white/[0.01] border border-white/5 p-2 rounded">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
