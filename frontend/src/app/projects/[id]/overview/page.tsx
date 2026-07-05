"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, DollarSign, Activity, TrendingUp, Clock, Target, CalendarDays, CheckCircle2, ChevronRight, BarChart2, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "../../../../components/ui/Toast";
import { formatCurrency, formatDate } from "../../../../lib/formatters";
import { useProject, useAdvanceProjectStage } from "../../../../hooks/useProjects";

export default function OverviewTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: project, isLoading } = useProject(resolvedParams.id);
  const advanceStageMutation = useAdvanceProjectStage(resolvedParams.id);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusRemarks, setStatusRemarks] = useState("");

  const PROJECT_STAGES = [
    "CREATED", "ENGINEERING", "PROCUREMENT", "MATERIAL_AVAILABLE", 
    "PRODUCTION", "INSPECTION", "DISPATCH_READY", "DISPATCHED", 
    "INVOICED", "PAYMENT_PENDING", "CLOSED", "CANCELLED"
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading || !mounted) return null;
  if (!project) return null;

  const handleAdvanceStage = async () => {
    try {
      await advanceStageMutation.mutateAsync();
      setShowStatusModal(false);
    } catch (err: any) {
      // Handled by hook
    }
  };

  const totalCost = project.projectCostSummary?.totalActualCost || 0;
  const revenue = project.projectCostSummary?.invoicedRevenue || 0;
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col min-h-0">
      
      {/* Project Workflow Controller */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl mb-4 relative overflow-hidden group shrink-0" style={{ padding: '0' }}>
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/8 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/5 relative z-10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/30 to-blue-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Target className="w-3 h-3 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-widest uppercase">Project Workflow Controller</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Stage Gate Progression</p>
            </div>
          </div>
          <button 
            onClick={handleAdvanceStage}
            disabled={project.currentStage === 'CLOSED' || project.currentStage === 'CANCELLED'}
            className="group/btn relative inline-flex items-center gap-1.5 font-bold text-xs transition-all outline-none disabled:opacity-40 disabled:pointer-events-none px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white border border-purple-400/40 hover:border-purple-300/60 overflow-hidden"
            style={{ boxShadow: '0 0 14px rgba(168,85,247,0.3)' }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-150 pointer-events-none" />
            <span className="relative z-10 tracking-wide">Advance Stage</span>
            <ChevronRight className="w-3.5 h-3.5 relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Stage Rail */}
        <div className="relative px-5 pt-3 pb-4 overflow-x-auto hide-scrollbar">
          {/* Background track */}
          <div className="absolute left-5 right-5 top-[calc(0.75rem+10px)] h-0.5 bg-white/5 rounded-full" />
          
          <div className="relative flex items-start justify-between min-w-[800px]">
            {PROJECT_STAGES.map((stage, idx) => {
               const currentIdx = PROJECT_STAGES.indexOf(project.currentStage);
               const isPast = idx < currentIdx;
               const isCurrent = idx === currentIdx;
               
               // Stage-specific accent colors
               const stageColors: Record<string, { border: string; glow: string; text: string; bg: string; lineFrom: string; lineTo: string }> = {
                 'CREATED':          { border: '#6366f1', glow: 'rgba(99,102,241,0.7)',  text: '#a5b4fc', bg: 'rgba(99,102,241,0.15)',  lineFrom: '#6366f1', lineTo: '#818cf8' },
                 'ENGINEERING':      { border: '#3b82f6', glow: 'rgba(59,130,246,0.7)',  text: '#93c5fd', bg: 'rgba(59,130,246,0.15)',  lineFrom: '#3b82f6', lineTo: '#60a5fa' },
                 'PROCUREMENT':      { border: '#f59e0b', glow: 'rgba(245,158,11,0.7)',  text: '#fcd34d', bg: 'rgba(245,158,11,0.15)',  lineFrom: '#f59e0b', lineTo: '#fbbf24' },
                 'MATERIAL_AVAILABLE':{ border: '#10b981', glow: 'rgba(16,185,129,0.7)', text: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', lineFrom: '#10b981', lineTo: '#34d399' },
                 'PRODUCTION':       { border: '#8b5cf6', glow: 'rgba(139,92,246,0.7)',  text: '#c4b5fd', bg: 'rgba(139,92,246,0.15)',  lineFrom: '#8b5cf6', lineTo: '#a78bfa' },
                 'INSPECTION':       { border: '#06b6d4', glow: 'rgba(6,182,212,0.7)',   text: '#67e8f9', bg: 'rgba(6,182,212,0.15)',   lineFrom: '#06b6d4', lineTo: '#22d3ee' },
                 'DISPATCH_READY':   { border: '#f97316', glow: 'rgba(249,115,22,0.7)',  text: '#fdba74', bg: 'rgba(249,115,22,0.15)',  lineFrom: '#f97316', lineTo: '#fb923c' },
                 'DISPATCHED':       { border: '#ec4899', glow: 'rgba(236,72,153,0.7)',  text: '#f9a8d4', bg: 'rgba(236,72,153,0.15)',  lineFrom: '#ec4899', lineTo: '#f472b6' },
                 'INVOICED':         { border: '#22c55e', glow: 'rgba(34,197,94,0.7)',   text: '#86efac', bg: 'rgba(34,197,94,0.15)',   lineFrom: '#22c55e', lineTo: '#4ade80' },
                 'PAYMENT_PENDING':  { border: '#eab308', glow: 'rgba(234,179,8,0.7)',   text: '#fde047', bg: 'rgba(234,179,8,0.15)',   lineFrom: '#eab308', lineTo: '#facc15' },
                 'CLOSED':           { border: '#64748b', glow: 'rgba(100,116,139,0.5)', text: '#94a3b8', bg: 'rgba(100,116,139,0.1)',  lineFrom: '#64748b', lineTo: '#94a3b8' },
                 'CANCELLED':        { border: '#ef4444', glow: 'rgba(239,68,68,0.6)',   text: '#fca5a5', bg: 'rgba(239,68,68,0.1)',    lineFrom: '#ef4444', lineTo: '#f87171' },
               };
               const color = isCurrent || isPast ? stageColors[stage] || stageColors['CLOSED'] : null;
               const label = stage.replace(/_/g, '\n');
               
               return (
                 <div key={stage} className="flex flex-col items-center flex-1 relative" style={{ minWidth: 0 }}>
                   {/* Connector line to next stage */}
                   {idx < PROJECT_STAGES.length - 1 && (
                     <div 
                       className="absolute top-[13px] rounded-full overflow-hidden"
                       style={{
                         left: 'calc(50% + 13px)',
                         right: 'calc(-50% + 13px)',
                         height: '2px',
                         background: 'rgba(255,255,255,0.06)',
                         zIndex: 0
                       }}
                     >
                       <motion.div
                         initial={{ scaleX: 0, transformOrigin: 'left' }}
                         animate={{ scaleX: isPast ? 1 : 0 }}
                         transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.04 }}
                         className="absolute inset-0 h-full"
                         style={{
                           background: color ? `linear-gradient(90deg, ${color.lineFrom}, ${color.lineTo})` : 'transparent',
                           boxShadow: color ? `0 0 6px ${color.glow}` : 'none'
                         }}
                       />
                       {isCurrent && (
                         <motion.div
                           initial={{ x: '-100%' }}
                           animate={{ x: '200%' }}
                           transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                           className="absolute inset-0 w-1/3"
                           style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                         />
                       )}
                     </div>
                   )}
                   
                   {/* Node circle */}
                   <motion.div
                     whileHover={{ scale: 1.1 }}
                     transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                     className="relative z-10 flex items-center justify-center mb-2 cursor-default"
                     style={{
                       width: 20,
                       height: 20,
                       borderRadius: '50%',
                       border: `2px solid ${isCurrent || isPast ? color?.border : 'rgba(255,255,255,0.1)'}`,
                       background: isCurrent || isPast ? color?.bg : 'rgba(255,255,255,0.02)',
                       color: isCurrent || isPast ? color?.text : 'rgba(100,116,139,1)',
                       boxShadow: isCurrent ? `0 0 14px ${color?.glow}, inset 0 0 6px rgba(255,255,255,0.05)` : 'none',
                       transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                     }}
                   >
                     {isCurrent && (
                       <div
                         className="absolute inset-0 rounded-full animate-ping"
                         style={{ background: color?.border, opacity: 0.25 }}
                       />
                     )}
                     {isPast 
                       ? <CheckCircle2 className="w-3 h-3" />
                       : <span style={{ fontSize: '9px', fontWeight: 900, lineHeight: 1 }}>{idx + 1}</span>
                     }
                   </motion.div>
                   
                   {/* Stage label */}
                   <div
                     className="text-center leading-tight px-0.5"
                     style={{
                       fontSize: '8px',
                       fontWeight: isCurrent ? 800 : 600,
                       letterSpacing: '0.04em',
                       color: isCurrent ? color?.text : isPast ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,1)',
                       textTransform: 'uppercase',
                       textShadow: isCurrent ? `0 0 10px ${color?.glow}` : 'none',
                       whiteSpace: 'pre-line',
                     }}
                   >
                     {label}
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
        
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 tracking-wider uppercase mb-0.5">Net Profit</p>
              <h3 className="text-xl font-bold text-emerald-400 tracking-tight font-mono">{formatCurrency(profit)}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className={`text-xs font-bold ${profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitMargin.toFixed(1)}% Margin
            </span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">Total Cost</p>
              <h3 className="text-xl font-bold text-white tracking-tight font-mono">{formatCurrency(totalCost)}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
             <span className="text-xs text-slate-400 font-medium">Accumulated Expenses</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex justify-between items-start relative z-10 mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">Delivery Date</p>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                {formatDate(project.deliveryDate)}
              </h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-400">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
             <span className="text-xs text-slate-400 font-medium">Target Deadline</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-3 gap-4">
        
        {/* Main Left Area */}
        <div className="col-span-2 space-y-4">
          
          {/* Engineering & Documents */}
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-2xl pointer-events-none"></div>
             
             <div className="flex justify-between items-end mb-4 relative z-10">
               <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-400" />
                    Engineering Documents
                  </h3>
               </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
              {(project.drawings && project.drawings.length > 0) ? project.drawings.map((drw: any) => (
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
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 relative">
            <h3 className="text-base font-bold text-white flex items-center mb-4">
              <Activity className="w-4 h-4 mr-2 text-emerald-400" />
              Live Activity Feed
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto hide-scrollbar pr-2 relative">
              {/* Vertical line timeline */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 via-blue-500/20 to-transparent"></div>

              {(project.projectActivities && project.projectActivities.length > 0) ? project.projectActivities.map((act: any, idx: number) => (
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
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 sticky top-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-white flex items-center">
                <BarChart2 className="w-4 h-4 mr-2 text-purple-400" />
                Cost Ledger
              </h3>
              <button 
                onClick={() => router.push(`/projects/${project.id}/finance`)}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center transition-colors bg-purple-500/10 px-2 py-1 rounded"
              >
                Full Ledger <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>
            
            <div className="relative space-y-5 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              
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

            <div className="mt-6 pt-5 border-t border-white/5">
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl relative overflow-hidden shadow-inner">
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>
                 <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-0.5">Total Actual Cost</p>
                 <p className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
                   {formatCurrency(totalCost)}
                 </p>
               </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A0F1C] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-400" />
                Advance Project Stage
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action="/api/projects/advance-stage" method="POST" className="p-6 space-y-5">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Stage</label>
                <select 
                  name="stage"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none"
                  required
                >
                  {PROJECT_STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Advancing the stage unlocks downstream workflows (e.g., Procurement, Production).
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Transition Remarks (Optional)</label>
                <textarea 
                  name="remarks"
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 min-h-[80px]"
                  placeholder="e.g. BOM approved, ready for procurement"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-500/20"
                >
                  Update Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
