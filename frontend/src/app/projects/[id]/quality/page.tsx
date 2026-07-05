"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { CheckSquare, AlertTriangle, FileText, ClipboardList } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useProjectRouting } from "../../../../hooks/useEngineering";
import { useLogInspection } from "../../../../hooks/useQuality";

export default function QualityTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const { data: routingOps } = useProjectRouting(resolvedParams.id);
  const routingOperations = routingOps?.operations || [];
  
  const logInspectionMutation = useLogInspection(resolvedParams.id);
  
  const [ncrs, setNcrs] = useState<any[]>([]);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [inspectionType, setInspectionType] = useState('IN_PROCESS');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [qty, setQty] = useState({ inspected: 0, passed: 0, rework: 0, scrap: 0 });
  const [remarks, setRemarks] = useState('');

  // No manual loadData needed, React Query handles it

  if (projectLoading || !project) return null;

  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    // Auto-determine result
    let result = 'PASS';
    if (qty.scrap > 0) result = 'SCRAP';
    else if (qty.rework > 0) result = 'REWORK';
    
    try {
      await logInspectionMutation.mutateAsync({ 
        inspectionType,
        routingOperationId: inspectionType === 'IN_PROCESS' ? selectedOperation : undefined,
        inspectedQty: qty.inspected, 
        passedQty: qty.passed,
        reworkQty: qty.rework,
        scrapQty: qty.scrap,
        result, 
        remarks 
      });
      setShowModal(false);
    } catch (err: any) {}
  };



    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mr-3 text-emerald-400">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Quality Assurance</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Inspections & NCRs</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="group relative px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="relative z-10 flex items-center text-emerald-400 font-bold text-xs">Log Inspection</span>
        </button>
      </div>
        
      <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl relative overflow-hidden flex items-center">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <ClipboardList className="h-8 w-8 text-emerald-400 mr-4 opacity-80" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">In-Process Inspections</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{project.inspectionHeaders?.filter((i:any) => i.inspectionType === 'IN_PROCESS').length || 0} LOGGED</p>
          </div>
        </div>
        
        <div className="bg-white/[0.02] border border-blue-500/10 p-4 rounded-xl relative overflow-hidden flex items-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
          <CheckSquare className="h-8 w-8 text-blue-400 mr-4 opacity-80" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pre-Dispatch Inspections</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{project.inspectionHeaders?.filter((i:any) => i.inspectionType === 'FINAL_PDI').length || 0} FINAL PDIS</p>
          </div>
        </div>
      </div>

      {/* Inspection History */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="p-4 border-b border-white/5 flex justify-between items-center relative z-10 shrink-0">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Inspection History</h3>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] sticky top-0 backdrop-blur-md z-20">
              <tr>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Date</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Type</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 text-center">Qty Inspected</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Result</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 text-right">Rework / Scrap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {project.inspectionHeaders?.map((ins: any) => (
                <tr key={ins.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-3 text-xs text-slate-300 font-mono">{new Date(ins.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${ins.inspectionType === 'FINAL_PDI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {ins.inspectionType?.replace('_', ' ') || 'IN PROCESS'}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-bold text-white font-mono text-center">{ins.inspectedQty}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${ins.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ins.result === 'REWORK' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {ins.result}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-400 text-right font-mono flex items-center justify-end space-x-2">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">R: {ins.reworkQty}</span>
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">S: {ins.scrapQty}</span>
                  </td>
                </tr>
              ))}
              {(!project.inspectionHeaders || project.inspectionHeaders.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8">
                    <div className="flex flex-col items-center justify-center text-slate-500 opacity-50">
                       <CheckSquare className="h-8 w-8 mb-3" />
                       <span className="text-[11px] font-bold uppercase tracking-wider">No inspections logged</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white mb-5 relative z-10 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-emerald-400" />
              Log Quality Inspection
            </h3>
            
            <form onSubmit={handleLogInspection} className="space-y-4 relative z-10">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Inspection Type</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  value={inspectionType} onChange={e => setInspectionType(e.target.value)} required>
                  <option value="IN_PROCESS">In-Process Inspection</option>
                  <option value="FINAL_PDI">Final Pre-Dispatch Inspection (PDI)</option>
                </select>
              </div>

              {inspectionType === 'IN_PROCESS' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Routing Operation</label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    value={selectedOperation} onChange={e => setSelectedOperation(e.target.value)} required>
                    <option value="">-- Select Operation --</option>
                    {routingOperations.map(op => (
                      <option key={op.id} value={op.id}>OP{op.operation?.operationNumber} - {op.operation?.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Inspected Qty</label>
                  <input type="number" min="1" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                    value={qty.inspected} onChange={e => setQty({...qty, inspected: parseInt(e.target.value) || 0})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Passed Qty</label>
                  <input type="number" min="0" className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    value={qty.passed} onChange={e => setQty({...qty, passed: parseInt(e.target.value) || 0})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Rework Qty</label>
                  <input type="number" min="0" className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                    value={qty.rework} onChange={e => setQty({...qty, rework: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Scrap Qty</label>
                  <input type="number" min="0" className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-400 font-mono focus:outline-none focus:border-red-500"
                    value={qty.scrap} onChange={e => setQty({...qty, scrap: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks</label>
                <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 min-h-[80px]"
                  value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Measurements, deviations, or NCR details..."></textarea>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">Save Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
