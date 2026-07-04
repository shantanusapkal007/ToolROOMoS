"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, DollarSign, Activity, TrendingUp, Clock, Target, CalendarDays, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "../../../../lib/formatters";

export default function OverviewTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
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

  if (!project) return null;

  const totalCost = project.projectCostSummary?.totalActualCost || 0;
  const revenue = project.projectCostSummary?.invoicedRevenue || 0;
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-32 px-4 animate-fade-in">
      
      {/* Top KPI Row */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        
        <div className="glass-panel p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Net Profit</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{formatCurrency(profit)}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className={`text-sm font-semibold ${profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitMargin.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Total Cost</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{formatCurrency(totalCost)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
             <span className="text-sm text-slate-400 font-medium">Accumulated Expenses</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Stage</p>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1">{project.currentStage}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
             <span className="text-sm text-slate-400 font-medium">Current Production Phase</span>
          </div>
        </div>

        <div className="glass-panel p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-500">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">Delivery Date</p>
              <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                {formatDate(project.deliveryDate)}
              </h3>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
             <span className="text-sm text-slate-400 font-medium">Target Deadline</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-8">
        
        {/* Main Left Area */}
        <div className="col-span-2 space-y-8">
          
          {/* Engineering & Documents */}
          <div className="glass-panel p-8 relative overflow-hidden">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-2xl pointer-events-none"></div>
             
             <div className="flex justify-between items-end mb-6 relative z-10">
               <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-blue-400" />
                    Engineering Documents
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Drawings and technical specifications attached to this project.</p>
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
              {project.drawings?.length > 0 ? project.drawings.map((drw: any) => (
                <div key={drw.id} className="p-5 rounded-2xl bg-[#0B1018]/60 border border-white/10 hover:border-blue-500/40 hover:bg-white/5 transition-all cursor-pointer group">
                  <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <p className="font-semibold text-white tracking-wide">{drw.drawingNumber}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Rev {drw.revision}</span>
                    <span className="text-xs text-blue-400 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      View <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No engineering documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="glass-panel p-8 relative">
            <h3 className="text-lg font-bold text-white flex items-center mb-6">
              <Activity className="w-5 h-5 mr-3 text-emerald-400" />
              Live Activity Feed
            </h3>
            
            <div className="space-y-6 max-h-80 overflow-y-auto hide-scrollbar pr-4 relative">
              {/* Vertical line timeline */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/20 to-transparent"></div>

              {project.projectActivities?.length > 0 ? project.projectActivities.map((act: any, idx: number) => (
                <div key={act.id} className="relative pl-10 group" style={{ animation: `slideUp 0.3s ease-out ${idx * 0.1}s forwards`, opacity: mounted ? 1 : 0 }}>
                  <div className="absolute left-[-2px] top-1 h-6 w-6 rounded-full bg-[#0B1018] border-2 border-emerald-500/50 flex items-center justify-center group-hover:border-emerald-400 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl group-hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-white">{act.action}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-black/30 px-2 py-1 rounded">{new Date(act.performedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{act.description}</p>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 pl-10 italic">No activity recorded for this project.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Sidebar - Cost Ledger Pipeline */}
        <div className="col-span-1">
          <div className="glass-panel p-8 sticky top-6">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-white flex items-center">
                <BarChart2 className="w-5 h-5 mr-3 text-purple-400" />
                Cost Ledger
              </h3>
              <button 
                onClick={() => router.push(`/projects/${project.id}/finance`)}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center transition-colors"
              >
                Full Ledger <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              
              {/* Pipeline Nodes */}
              {[
                { label: 'Estimated Material', value: project.projectCostSummary?.estimatedMaterialCost, color: 'bg-slate-500', shadow: '' },
                { label: 'Sourced Cost', value: project.projectCostSummary?.actualMaterialCost, color: 'bg-blue-500', shadow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
                { label: 'Machine Prod.', value: project.projectCostSummary?.machineCost, color: 'bg-purple-500', shadow: 'shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
                { label: 'Outside Process', value: project.projectCostSummary?.subcontractCost, color: 'bg-orange-500', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.5)]' },
                { label: 'Logistics', value: project.projectCostSummary?.logisticsCost, color: 'bg-pink-500', shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.5)]' }
              ].map((node, i) => (
                <div key={i} className="relative flex items-center justify-between group">
                  <div className="flex items-center">
                    <div className={`h-6 w-6 rounded-full border-4 border-[#0B1018] ${node.color} ${node.shadow} mr-4 relative z-10 group-hover:scale-125 transition-transform`}></div>
                    <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{node.label}</span>
                  </div>
                  <span className="font-mono text-sm text-slate-400">{formatCurrency(Number(node.value || 0))}</span>
                </div>
              ))}
              
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden">
                 <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                 <p className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-1">Total Actual Cost</p>
                 <p className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                   {formatCurrency(totalCost)}
                 </p>
               </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
