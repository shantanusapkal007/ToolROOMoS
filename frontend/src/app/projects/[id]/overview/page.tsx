"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, DollarSign, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OverviewTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const refresh = () => loadProjectDetails(params.id);

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-8 pb-32">
      
      {/* Main Action Panel (Left 2 Columns) */}
      <div className="col-span-2 space-y-6">
        
        <div className="glass-panel p-8">
          <h2 className="text-h4 font-semibold mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-3 text-blue-500" />
            Quick Actions
          </h2>

          <div className="space-y-4">
            <p className="text-slate-400">
              Navigate to the specific tabs (Engineering, Purchase, etc.) above to execute stage-specific actions.
            </p>
          </div>
        </div>

        {/* Document Gallery */}
        <div className="glass-panel p-8">
          <h3 className="text-h6 font-medium mb-6 text-slate-300">Project Documents</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {project.drawings?.map((drw: any) => (
              <div key={drw.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                <FileText className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm truncate">{drw.drawingNumber}</p>
                <p className="text-xs text-slate-500 mt-1">Rev {drw.revision}</p>
              </div>
            ))}
            {project.projectCostSummary && (
              <div 
                onClick={() => router.push(`/projects/${project.id}/finance`)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <DollarSign className="h-8 w-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm">Cost Ledger</p>
                <p className="text-xs text-slate-500 mt-1">Auto-generated</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sidebar Panel (Right Column) */}
      <div className="col-span-1 space-y-6">
        
        {/* Financial Pipeline (Visual Flow) */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-6">COST PIPELINE</h3>
          
          <div className="relative border-l border-white/10 ml-3 space-y-6">
            
            <div className="relative pl-6">
              <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-slate-500"></div>
              <p className="text-xs text-slate-500">Estimated Material</p>
              <p className="font-semibold text-white">${project.projectCostSummary?.estimatedMaterialCost || 0}</p>
            </div>
            
            <div className="relative pl-6">
              <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-amber-500"></div>
              <p className="text-xs text-slate-500">Actual Sourced Cost</p>
              <p className="font-semibold text-white">${project.projectCostSummary?.actualMaterialCost || 0}</p>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-purple-500"></div>
              <p className="text-xs text-slate-500">Machine Production</p>
              <p className="font-semibold text-white">${project.projectCostSummary?.machineCost || 0}</p>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-orange-500"></div>
              <p className="text-xs text-slate-500">Logistics / Dispatch</p>
              <p className="font-semibold text-white">${project.projectCostSummary?.logisticsCost || 0}</p>
            </div>

            <div className="relative pl-6 mt-8 border-t border-white/10 pt-4">
              <div className="absolute left-[-5px] top-6 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
              <p className="text-xs text-green-400 font-bold tracking-widest uppercase">Net Profitability</p>
              <p className="text-h3 font-bold text-white drop-shadow-md">${
                (project.projectCostSummary?.invoicedRevenue || 0) - 
                (project.projectCostSummary?.totalActualCost || 0)
              }</p>
            </div>

          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-6">ACTIVITY FEED</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
            {project.projectActivities?.map((act: any) => (
              <div key={act.id} className="flex flex-col text-sm border-b border-white/5 pb-4 last:border-0">
                <span className="text-xs text-slate-500 mb-1">{new Date(act.performedAt).toLocaleTimeString()}</span>
                <span className="font-medium text-slate-200">{act.action}</span>
                <span className="text-slate-400">{act.description}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
