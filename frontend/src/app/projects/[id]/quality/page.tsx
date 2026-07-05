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



  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in relative">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Quality Assurance</h2>
            <p className="text-slate-400 mt-1">Manage Quality Inspections and NCRs.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">Log Inspection</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <ClipboardList className="h-6 w-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white">In-Process Inspections</h3>
            <p className="text-sm text-slate-500 mt-1">{project.inspectionHeaders?.filter((i:any) => i.inspectionType === 'IN_PROCESS').length || 0} inspections logged</p>
          </div>
          
          <div className="bg-[#050A14] border border-blue-500/20 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <CheckSquare className="h-6 w-6 text-blue-400 mb-3" />
            <h3 className="font-semibold text-white">Pre-Dispatch Inspections</h3>
            <p className="text-sm text-slate-500 mt-1">{project.inspectionHeaders?.filter((i:any) => i.inspectionType === 'FINAL_PDI').length || 0} final PDIs</p>
          </div>
        </div>

        {/* Inspection History */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-white mb-6">Inspection History</h3>
          <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black/40 border-b border-white/5">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty Inspected</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Result</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rework / Scrap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {project.inspectionHeaders?.map((ins: any) => (
                  <tr key={ins.id} className="hover:bg-white/5">
                    <td className="p-4 text-sm text-slate-300">{new Date(ins.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${ins.inspectionType === 'FINAL_PDI' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {ins.inspectionType?.replace('_', ' ') || 'IN PROCESS'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-white">{ins.inspectedQty}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${ins.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : ins.result === 'REWORK' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ins.result}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      R: {ins.reworkQty} | S: {ins.scrapQty}
                    </td>
                  </tr>
                ))}
                {(!project.inspectionHeaders || project.inspectionHeaders.length === 0) && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No inspections logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-emerald-400" />
                Log Quality Inspection
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleLogInspection} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Inspection Type</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
                  value={inspectionType} onChange={e => setInspectionType(e.target.value)} required>
                  <option value="IN_PROCESS">In-Process Inspection</option>
                  <option value="FINAL_PDI">Final Pre-Dispatch Inspection (PDI)</option>
                </select>
              </div>

              {inspectionType === 'IN_PROCESS' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Routing Operation</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
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
                  <label className="block text-sm font-medium text-slate-400 mb-1">Inspected Qty</label>
                  <input type="number" min="1" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
                    value={qty.inspected} onChange={e => setQty({...qty, inspected: parseInt(e.target.value) || 0})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-500 mb-1">Passed Qty</label>
                  <input type="number" min="0" className="w-full bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-4 py-2 text-emerald-400 font-bold"
                    value={qty.passed} onChange={e => setQty({...qty, passed: parseInt(e.target.value) || 0})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-500 mb-1">Rework Qty</label>
                  <input type="number" min="0" className="w-full bg-amber-900/20 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-400"
                    value={qty.rework} onChange={e => setQty({...qty, rework: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-500 mb-1">Scrap Qty</label>
                  <input type="number" min="0" className="w-full bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-400"
                    value={qty.scrap} onChange={e => setQty({...qty, scrap: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Remarks</label>
                <textarea className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                  value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Measurements, deviations, or NCR details..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg">Save Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
