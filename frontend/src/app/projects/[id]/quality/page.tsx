"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { CheckSquare, AlertTriangle, FileText, ClipboardList, X, Info, Calendar, Activity } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useProjectRouting } from "../../../../hooks/useEngineering";
import { useLogInspection, useCloseNcr } from "../../../../hooks/useQuality";
import { useMasterData } from "../../../../hooks/useMasterData";

export default function QualityTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const { data: routingOps } = useProjectRouting(resolvedParams.id);
  const routingOperations = routingOps?.operations || [];
  
  const logInspectionMutation = useLogInspection(resolvedParams.id);
  
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [viewingInspectionDetails, setViewingInspectionDetails] = useState<any | null>(null);
  const [viewingNcrDetails, setViewingNcrDetails] = useState<any | null>(null);
  
  // Form State
  const [showModal, setShowModal] = useState(false);
  const [inspectionType, setInspectionType] = useState('IN_PROCESS');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [qty, setQty] = useState({ inspected: 0, passed: 0, rework: 0, scrap: 0 });
  const [remarks, setRemarks] = useState('');
  const [measurements, setMeasurements] = useState<{inspectionStandardId: string, nominalValue: number, upperTolerance: number, lowerTolerance: number, actualValue: number, result: string}[]>([]);

  const { data: inspectionStandards } = useMasterData('inspection-standards');

  // NCR Modal State
  const [showNcrModal, setShowNcrModal] = useState(false);
  const [ncrToClose, setNcrToClose] = useState('');
  const [ncrDisposition, setNcrDisposition] = useState('REWORK');
  const [ncrRootCause, setNcrRootCause] = useState('');
  const closeNcrMutation = useCloseNcr(resolvedParams.id);

  const handleCloseNcr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncrToClose) return;
    try {
      await closeNcrMutation.mutateAsync({
        ncrId: ncrToClose,
        data: { disposition: ncrDisposition, rootCause: ncrRootCause }
      });
      setShowNcrModal(false);
      setNcrToClose('');
      setNcrDisposition('REWORK');
      setNcrRootCause('');
    } catch (err: any) {}
  };

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
        remarks,
        measurements: measurements.length > 0 ? measurements : undefined
      });
      setShowModal(false);
      setMeasurements([]);
    } catch (err: any) {}
  };

  return (
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
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 text-right">Actions</th>
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
                  <td className="p-3 text-xs text-slate-400 text-right font-mono space-x-2">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">R: {ins.reworkQty}</span>
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">S: {ins.scrapQty}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setViewingInspectionDetails(ins)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                    >
                      Details
                    </button>
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

      {/* NCR History */}
      <div className="bg-white/[0.01] border border-white/5 rounded-2xl relative overflow-hidden flex flex-col mt-4 min-h-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="p-4 border-b border-white/5 flex justify-between items-center relative z-10 shrink-0">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Non-Conformance Reports (NCR)</h3>
        </div>
        <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] sticky top-0 backdrop-blur-md z-20">
              <tr>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Date</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">NCR Number</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Defect Type</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5">Status</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {project.ncrReports?.map((ncr: any) => (
                <tr key={ncr.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-3 text-xs text-slate-300 font-mono">{new Date(ncr.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-sm font-bold text-white font-mono">{ncr.ncrNumber}</td>
                  <td className="p-3 text-xs text-slate-300">{ncr.defectType}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${ncr.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {ncr.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => setViewingNcrDetails(ncr)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                    >
                      Details
                    </button>
                    {ncr.status === 'OPEN' && (
                      <button
                        onClick={() => {
                          setNcrToClose(ncr.id);
                          setShowNcrModal(true);
                        }}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-red-500/20 transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(!project.ncrReports || project.ncrReports.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8">
                    <div className="flex flex-col items-center justify-center text-slate-500 opacity-50">
                       <AlertTriangle className="h-8 w-8 mb-3" />
                       <span className="text-[11px] font-bold uppercase tracking-wider">No NCRs recorded</span>
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
                    {routingOperations.map((op: any) => (
                      <option key={op.id} value={op.id}>{op.operation?.operationCode} - {op.operation?.operationName}</option>
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Measurements (Optional)</label>
                  <button type="button" onClick={() => setMeasurements([...measurements, { inspectionStandardId: '', nominalValue: 0, upperTolerance: 0, lowerTolerance: 0, actualValue: 0, result: 'PASS' }])} className="text-emerald-400 text-[10px] font-bold hover:text-emerald-300 transition-colors">+ Add Measurement</button>
                </div>
                {measurements.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {measurements.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-white/[0.02] p-2 rounded border border-white/5">
                        <div className="col-span-3">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Standard</label>
                          <select className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white" value={m.inspectionStandardId} onChange={e => { const newM = [...measurements]; newM[idx].inspectionStandardId = e.target.value; setMeasurements(newM); }}>
                            <option value="">Select</option>
                            {inspectionStandards?.map((s:any) => <option key={s.id} value={s.id}>{s.standardName}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nominal</label>
                          <input type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-xs text-white" value={m.nominalValue} onChange={e => { const newM = [...measurements]; newM[idx].nominalValue = parseFloat(e.target.value); setMeasurements(newM); }} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tol (+/-)</label>
                          <div className="flex space-x-1">
                            <input type="number" step="0.01" placeholder="+" className="w-full bg-black/50 border border-white/10 rounded px-1 py-1.5 text-xs text-white" value={m.upperTolerance} onChange={e => { const newM = [...measurements]; newM[idx].upperTolerance = parseFloat(e.target.value); setMeasurements(newM); }} />
                            <input type="number" step="0.01" placeholder="-" className="w-full bg-black/50 border border-white/10 rounded px-1 py-1.5 text-xs text-white" value={m.lowerTolerance} onChange={e => { const newM = [...measurements]; newM[idx].lowerTolerance = parseFloat(e.target.value); setMeasurements(newM); }} />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Actual</label>
                          <input type="number" step="0.01" className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1.5 text-xs text-emerald-400" value={m.actualValue} onChange={e => { 
                            const newM = [...measurements]; 
                            const actual = parseFloat(e.target.value);
                            newM[idx].actualValue = actual; 
                            
                            // Auto-evaluate result
                            if (newM[idx].nominalValue) {
                              const upper = newM[idx].nominalValue + (newM[idx].upperTolerance || 0);
                              const lower = newM[idx].nominalValue - (newM[idx].lowerTolerance || 0);
                              newM[idx].result = (actual <= upper && actual >= lower) ? 'PASS' : 'FAIL';
                            }
                            setMeasurements(newM); 
                          }} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Result</label>
                          <select className={`w-full border rounded px-2 py-1.5 text-xs font-bold ${m.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`} value={m.result} onChange={e => { const newM = [...measurements]; newM[idx].result = e.target.value; setMeasurements(newM); }}>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                            <option value="REWORK">REWORK</option>
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-center pb-1.5">
                          <button type="button" onClick={() => setMeasurements(measurements.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 font-bold">&times;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      {showNcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-white/10 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-5 relative z-10 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              Close Non-Conformance Report
            </h3>
            
            <form onSubmit={handleCloseNcr} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Disposition</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  value={ncrDisposition} onChange={e => setNcrDisposition(e.target.value)} required>
                  <option value="REWORK">Rework</option>
                  <option value="SCRAP">Scrap</option>
                  <option value="USE_AS_IS">Use As Is</option>
                  <option value="RETURN_TO_VENDOR">Return to Vendor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Root Cause & Actions Taken</label>
                <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 min-h-[80px]"
                  value={ncrRootCause} onChange={e => setNcrRootCause(e.target.value)} placeholder="Describe what went wrong and how it was fixed..."></textarea>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-white/10">
                <button type="button" onClick={() => setShowNcrModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">Close NCR</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Inspection Details Modal */}
      {viewingInspectionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-xl p-6 animate-slide-up border border-emerald-500/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quality Inspection Log</h3>
                  <p className="text-[10px] text-slate-400">Dimensional CMM audit logs</p>
                </div>
              </div>
              <button onClick={() => setViewingInspectionDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10 overflow-y-auto hide-scrollbar flex-1 min-h-0">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Inspection Number:</span>
                  <span className="text-white font-bold font-mono">{viewingInspectionDetails.inspectionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inspection Type:</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase font-mono">
                    {viewingInspectionDetails.inspectionType?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inspected Qty:</span>
                  <span className="text-slate-200 font-bold font-mono">{viewingInspectionDetails.inspectedQty} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Verification Result:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                    viewingInspectionDetails.result === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>{viewingInspectionDetails.result}</span>
                </div>
              </div>

              {viewingInspectionDetails.measurements && viewingInspectionDetails.measurements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1" /> Dimensional Measurements
                  </h4>
                  <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden divide-y divide-white/5">
                    {viewingInspectionDetails.measurements.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{m.inspectionStandard?.standardName || 'Dimensional Tolerance'}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">NOM: {m.nominalValue}mm (+{m.upperTolerance}/-{m.lowerTolerance})</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="font-mono text-white font-bold">Act: {m.actualValue}mm</span>
                          <span className={`text-[9px] font-bold uppercase mt-0.5 ${m.result === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>{m.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingInspectionDetails.remarks && (
                <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-widest">Auditor Remarks</span>
                  <span className="text-slate-300 italic">"{viewingInspectionDetails.remarks}"</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingInspectionDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* NCR Details Modal */}
      {viewingNcrDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-red-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Non-Conformance Report</h3>
                  <p className="text-[10px] text-slate-400">Defect review & resolution log</p>
                </div>
              </div>
              <button onClick={() => setViewingNcrDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">NCR Code:</span>
                  <span className="text-white font-bold font-mono">{viewingNcrDetails.ncrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Defect Type:</span>
                  <span className="text-slate-300 font-bold">{viewingNcrDetails.defectType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/20 uppercase font-mono`}>{viewingNcrDetails.status}</span>
                </div>
              </div>

              {viewingNcrDetails.disposition && (
                <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                  <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                    <Info className="w-3.5 h-3.5 mr-1" /> Resolution Actions
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disposition Plan:</span>
                    <span className="text-amber-400 font-bold font-mono">{viewingNcrDetails.disposition}</span>
                  </div>
                  {viewingNcrDetails.rootCause && (
                    <div className="flex flex-col space-y-1 pt-1.5">
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Root Cause & Resolution Details:</span>
                      <span className="text-slate-300 italic bg-black/20 p-2 rounded border border-white/5 mt-0.5">"{viewingNcrDetails.rootCause}"</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingNcrDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
