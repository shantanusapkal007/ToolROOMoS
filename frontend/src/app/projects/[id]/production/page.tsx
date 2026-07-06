"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Activity, Wrench, PackageMinus, Plus, Factory, CheckCircle, Clock, X, Info, Calendar } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { Modal } from "../../../../components/ui/Modal";
import { formatDate } from "../../../../lib/formatters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { useInventoryBatches } from "../../../../hooks/useInventory";
import { 
  useJobCards, useMSDRs, useMaterialIssues, 
  useGenerateJobCards, useUpdateJobCardStatus, useLogMSDR, useIssueMaterial, useReturnMaterial 
} from "../../../../hooks/useProduction";

const msdrSchema = z.object({
  machineId: z.string().min(1, "Machine is required"),
  employeeId: z.string().min(1, "Operator is required"),
  setupTime: z.number().min(0, "Setup time cannot be negative"),
  cuttingTime: z.number().min(0.01, "Cutting time must be > 0")
});

const issueSchema = z.object({
  issueNumber: z.string().min(1, "Issue number is required"),
  batchId: z.string().min(1, "Batch is required"),
  qty: z.number().min(0.01, "Quantity must be > 0")
});

export default function ProductionTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  
  const { data: machines } = useMasterData('machines');
  const { data: employees } = useMasterData('employees');
  const { data: availableBatches } = useInventoryBatches(resolvedParams.id);
  
  const { data: jobCards = [] } = useJobCards(resolvedParams.id);
  const { data: msdrs = [] } = useMSDRs(resolvedParams.id);
  const { data: issues = [] } = useMaterialIssues(resolvedParams.id);

  const generateJobCardsMutation = useGenerateJobCards(resolvedParams.id);
  const updateJobCardStatusMutation = useUpdateJobCardStatus(resolvedParams.id);
  const logMSDRMutation = useLogMSDR(resolvedParams.id);
  const issueMaterialMutation = useIssueMaterial(resolvedParams.id);
  const returnMaterialMutation = useReturnMaterial(resolvedParams.id);
  
  const [activeSubTab, setActiveSubTab] = useState<'JOB_CARDS' | 'MSDR' | 'ISSUES'>('JOB_CARDS');

  // Modals
  const [showMsdrModal, setShowMsdrModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Selected for modals
  const [selectedJobCard, setSelectedJobCard] = useState<any | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  
  // Details view states
  const [viewingJobCardDetails, setViewingJobCardDetails] = useState<any | null>(null);
  const [viewingMsdrDetails, setViewingMsdrDetails] = useState<any | null>(null);
  const [viewingIssueDetails, setViewingIssueDetails] = useState<any | null>(null);

  const msdrForm = useForm({
    resolver: zodResolver(msdrSchema),
    defaultValues: {
      machineId: "",
      employeeId: "",
      setupTime: 0,
      cuttingTime: 0
    }
  });

  const issueForm = useForm({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      issueNumber: `ISS-${Date.now().toString().slice(-6)}`,
      batchId: "",
      qty: 1
    }
  });

  const returnForm = useForm({
    defaultValues: {
      returnQty: 1,
      remarks: ""
    }
  });

  useEffect(() => {
    if (availableBatches && availableBatches.length > 0) {
      issueForm.setValue('batchId', availableBatches[0].id);
    }
  }, [availableBatches, issueForm]);

  if (projectLoading || !project) return null;

  const generateJobCards = async () => {
    try {
        await generateJobCardsMutation.mutateAsync();
    } catch (err: any) {}
  }

  const handleStartJob = async (jobCard: any) => {
    try {
        await updateJobCardStatusMutation.mutateAsync({ jobCardId: jobCard.id, status: 'IN_PROGRESS' });
    } catch(err: any) {}
  };

  const openMsdrForJob = (jobCard: any) => {
      setSelectedJobCard(jobCard);
      if (jobCard.routingOperation?.plannedMachineId) {
       msdrForm.setValue('machineId', jobCard.routingOperation.plannedMachineId);
      } else {
       msdrForm.setValue('machineId', '');
      }
      msdrForm.setValue('setupTime', jobCard.routingOperation?.estimatedSetupTime || 0);
      msdrForm.setValue('cuttingTime', jobCard.routingOperation?.estimatedHours || 0);
      msdrForm.setValue('employeeId', '');
      setShowMsdrModal(true);
  };

  const handleLogMsdr = async (data: any) => {
    if (!project) return;
    try {
      await logMSDRMutation.mutateAsync({
        jobCardId: selectedJobCard?.id,
        routingOperationId: selectedJobCard?.routingOperationId,
        machineId: data.machineId,
        employeeId: data.employeeId,
        reportDate: new Date().toISOString(),
        setupTime: data.setupTime,
        cuttingTime: data.cuttingTime,
        producedQty: 1, 
      });
      setShowMsdrModal(false);
      setSelectedJobCard(null);
    } catch (err: any) {}
  };

  const handleIssueMaterial = async (data: any) => {
    if (!project) return;
    try {
      await issueMaterialMutation.mutateAsync({
        issueNumber: data.issueNumber,
        items: [{
          inventoryBatchId: data.batchId,
          issuedQty: data.qty
        }]
      });
      setShowIssueModal(false);
    } catch (err: any) {}
  };

  const openReturnModal = (issue: any) => {
    setSelectedIssue(issue);
    const maxReturn = Number(issue.issuedQty) - Number(issue.returnedQty || 0);
    returnForm.setValue('returnQty', maxReturn);
    returnForm.setValue('remarks', '');
    setShowReturnModal(true);
  };

  const handleReturnMaterial = async (data: any) => {
    if (!project || !selectedIssue) return;
    try {
      await returnMaterialMutation.mutateAsync({
        issueId: selectedIssue.id,
        returnQty: data.returnQty,
        remarks: data.remarks
      });
      setShowReturnModal(false);
      setSelectedIssue(null);
    } catch (err: any) {}
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 mr-3 text-amber-400">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Manufacturing Execution</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Job Cards & Machine Logs</p>
          </div>
        </div>
        {activeSubTab === 'JOB_CARDS' && jobCards.length === 0 && project.currentStage !== 'CLOSED' && (
            <button onClick={generateJobCards} className="group relative px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(217,119,6,0.1)]">
                <span className="relative z-10 flex items-center text-amber-400 font-bold text-xs">Generate Job Cards</span>
            </button>
        )}
      </div>

      <div className="flex space-x-6 mb-4 border-b border-white/10 shrink-0">
        <button 
          onClick={() => setActiveSubTab('JOB_CARDS')} 
          className={`pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'JOB_CARDS' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Activity className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" /> Job Cards
        </button>
        <button 
          onClick={() => setActiveSubTab('MSDR')} 
          className={`pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'MSDR' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Wrench className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" /> Machine Logs
        </button>
        <button 
          onClick={() => setActiveSubTab('ISSUES')} 
          className={`pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'ISSUES' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <PackageMinus className="h-3.5 w-3.5 inline mr-1.5 mb-0.5" /> Material Issues
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        
        {activeSubTab === 'JOB_CARDS' && (
           <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col h-full min-h-0">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
               <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Job Cards</h3>
               </div>
               
               {jobCards.length === 0 ? (
                 <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed flex-1 flex flex-col items-center justify-center">
                   <Clock className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
                   <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No Job Cards generated.</p>
                 </div>
               ) : (
                 <div className="space-y-2 relative z-10 overflow-y-auto pr-2 hide-scrollbar flex-1">
                   {jobCards.map((job: any) => (
                     <div key={job.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center group">
                       <div>
                          <div className="flex items-center space-x-3 mb-1.5">
                              <span className="font-bold text-white text-sm">{job.routingOperation?.operation?.operationName || 'Operation'}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : job.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
                                  {job.status}
                              </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-4">
                              <span><span className="text-slate-500 font-bold">M/C:</span> {job.machine?.machineName}</span>
                              <span><span className="text-slate-500 font-bold">SET:</span> {job.routingOperation?.estimatedSetupTime}h</span>
                              <span><span className="text-slate-500 font-bold">CUT:</span> {job.routingOperation?.estimatedHours}h</span>
                          </div>
                       </div>
                       <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => setViewingJobCardDetails(job)} 
                             className="bg-white/5 hover:bg-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold border border-white/10 transition-all uppercase tracking-wider"
                           >
                             Details
                           </button>
                           {job.status === 'READY' && (
                               <button onClick={() => handleStartJob(job)} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500/20 transition-all uppercase tracking-wider">
                                   Start
                               </button>
                           )}
                           {job.status === 'IN_PROGRESS' && (
                               <button onClick={() => openMsdrForJob(job)} className="bg-green-600/10 text-green-400 hover:bg-green-600/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-green-500/20 transition-all uppercase tracking-wider flex items-center">
                                   Finish
                               </button>
                           )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
           </div>
        )}

        {activeSubTab === 'MSDR' && (
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col h-full min-h-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Machine Shop Daily Reports</h3>
              <button onClick={() => { setSelectedJobCard(null); setShowMsdrModal(true); }} className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 flex items-center text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Unplanned Log
              </button>
            </div>
            
            {msdrs.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed flex-1 flex flex-col items-center justify-center">
                <Wrench className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No machine logs recorded.</p>
              </div>
            ) : (
              <div className="space-y-2 relative z-10 overflow-y-auto pr-2 hide-scrollbar flex-1">
                {msdrs.map((m: any) => (
                  <div key={m.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center group">
                    <div>
                       <span className="font-bold text-white text-sm">M/C: {m.machine?.machineName || 'Unknown'}</span>
                       <span className="text-slate-400 text-xs ml-3 border-l border-white/10 pl-3">OP: {m.employee?.name || 'Unknown'}</span>
                       <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1 flex items-center space-x-3">
                           <span>{formatDate(m.reportDate)}</span>
                           {m.routingOperation && <span className="text-amber-400/70 border-l border-white/10 pl-3">Job Card Link</span>}
                       </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                       <button
                         onClick={() => setViewingMsdrDetails(m)}
                         className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                       >
                         Details
                       </button>
                       <div className="flex flex-col text-right pr-3 border-r border-white/10">
                         <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Actual</span>
                         <div className="flex space-x-1.5 mt-0.5">
                             <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">SET: {m.setupTime}h</span>
                             <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">CUT: {m.cuttingTime}h</span>
                         </div>
                       </div>
                       {m.variance !== undefined && (
                           <div className="flex flex-col text-right w-14">
                               <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Var</span>
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${m.variance > 0 ? 'bg-red-500/10 border border-red-500/20 text-red-400' : m.variance < 0 ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-slate-500/10 border border-slate-500/20 text-slate-400'}`}>
                                   {m.variance > 0 ? '+' : ''}{m.variance}h
                               </span>
                           </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'ISSUES' && (
          <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 relative overflow-hidden flex flex-col h-full min-h-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Material Issues</h3>
              <button onClick={() => setShowIssueModal(true)} className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 flex items-center text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all shadow-[0_0_10px_rgba(147,51,234,0.1)]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Issue Material
              </button>
            </div>
            
            {issues.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed flex-1 flex flex-col items-center justify-center">
                <PackageMinus className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No materials issued.</p>
              </div>
            ) : (
              <div className="space-y-2 relative z-10 overflow-y-auto pr-2 hide-scrollbar flex-1">
                {issues.map((i: any) => (
                  <div key={i.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                       <span className="font-bold text-white text-sm">{i.issueNumber}</span>
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => setViewingIssueDetails(i)}
                           className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded text-[9px] uppercase tracking-wider font-bold border border-white/10 transition-colors"
                         >
                           Details
                         </button>
                         <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{i.status}</span>
                       </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{formatDate(i.issueDate)}</div>
                    
                    <div className="pl-3 border-l border-white/10 space-y-1.5">
                      {i.items?.map((item: any) => {
                        const returnedQty = Number(item.returnedQty || 0);
                        const canReturn = item.issuedQty > returnedQty;
                        return (
                        <div key={item.id} className="flex justify-between items-center text-xs bg-black/20 p-1.5 rounded border border-white/5">
                           <span className="text-slate-300 font-semibold flex items-center">
                             {item.inventoryBatch?.material?.materialName} <span className="text-amber-500/70 text-[10px] ml-2 border border-amber-500/20 px-1 rounded">BATCH: {item.inventoryBatch?.batchNumber}</span>
                           </span>
                           <div className="flex items-center space-x-3">
                             <span className="font-mono text-purple-400 font-bold">{item.issuedQty} units</span>
                             {returnedQty > 0 && <span className="font-mono text-red-400 font-bold text-[10px] bg-red-500/10 px-1 rounded">- {returnedQty} ret</span>}
                             {canReturn && (
                               <button 
                                 onClick={() => openReturnModal(item)}
                                 className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                               >
                                 Return
                               </button>
                             )}
                           </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showMsdrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-cyan-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">{selectedJobCard ? 'Complete Job Card' : 'Log Machine Time'}</h3>
            <div className="relative z-10">
        {selectedJobCard && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 font-medium">
                Completing Operation: <span className="font-bold text-blue-200">{selectedJobCard.routingOperation?.operation?.operationName}</span>
            </div>
        )}
        <form onSubmit={msdrForm.handleSubmit(handleLogMsdr)} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Machine</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" {...msdrForm.register("machineId")}>
               <option value="">Select Machine...</option>
               {machines?.map((m: any) => <option key={m.id} value={m.id}>{m.machineName}</option>)}
            </select>
            {msdrForm.formState.errors.machineId && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.machineId.message?.toString()}</p>}
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operator</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" {...msdrForm.register("employeeId")}>
               <option value="">Select Operator...</option>
               {employees?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {msdrForm.formState.errors.employeeId && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.employeeId.message?.toString()}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actual Setup (hrs)</label>
              <input type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" {...msdrForm.register("setupTime", { valueAsNumber: true })} />
              {msdrForm.formState.errors.setupTime && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.setupTime.message?.toString()}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Actual Cut (hrs)</label>
              <input type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" {...msdrForm.register("cuttingTime", { valueAsNumber: true })} />
              {msdrForm.formState.errors.cuttingTime && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.cuttingTime.message?.toString()}</p>}
            </div>
          </div>
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setShowMsdrModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all">
                {selectedJobCard ? 'Submit & Finish' : 'Log Time'}
            </button>
          </div>
        </form>
        </div>
        </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 animate-slide-up border border-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">Issue Material</h3>
        <form onSubmit={issueForm.handleSubmit(handleIssueMaterial)} className="space-y-4 relative z-10">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Issue Slip Number</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" {...issueForm.register("issueNumber")} />
            {issueForm.formState.errors.issueNumber && <p className="text-red-400 text-xs mt-1">{issueForm.formState.errors.issueNumber.message?.toString()}</p>}
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Inventory Batch</label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
              {...issueForm.register("batchId")}
            >
              <option value="">Choose Batch...</option>
              {availableBatches?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.material?.materialName} - {b.batchNumber} (Qty: {b.currentQty})
                </option>
              ))}
            </select>
            {issueForm.formState.errors.batchId && <p className="text-red-400 text-xs mt-1">{issueForm.formState.errors.batchId.message?.toString()}</p>}
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qty to Issue</label>
            <input type="number" step="0.01" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" {...issueForm.register("qty", { valueAsNumber: true })} />
            {issueForm.formState.errors.qty && <p className="text-red-400 text-xs mt-1">{issueForm.formState.errors.qty.message?.toString()}</p>}
          </div>
          
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">Submit Issue</button>
          </div>
        </form>
        </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 animate-slide-up border border-red-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">Return Material</h3>
            <div className="relative z-10">
               <div className="mb-4 text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/10">
                 Returning: <span className="font-bold text-white">{selectedIssue?.inventoryBatch?.material?.materialName}</span>
                 <br />
                 Max Available to Return: <span className="font-mono text-amber-400">{Number(selectedIssue?.issuedQty) - Number(selectedIssue?.returnedQty || 0)}</span> units
               </div>
               
               <form onSubmit={returnForm.handleSubmit(handleReturnMaterial)} className="space-y-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Return Quantity</label>
                   <input 
                     type="number" 
                     step="0.01" 
                     max={Number(selectedIssue?.issuedQty) - Number(selectedIssue?.returnedQty || 0)}
                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50" 
                     {...returnForm.register("returnQty", { valueAsNumber: true })} 
                   />
                 </div>
                 
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks</label>
                   <textarea 
                     className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[60px]" 
                     placeholder="Reason for return..."
                     {...returnForm.register("remarks")} 
                   ></textarea>
                 </div>
                 
                 <div className="flex space-x-3 pt-4 border-t border-white/10">
                   <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">Confirm Return</button>
                 </div>
               </form>
            </div>
          </div>
        </div>
      )}
      {/* Job Card Details Modal */}
      {viewingJobCardDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-amber-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Job Card Details</h3>
                  <p className="text-[10px] text-slate-400">Routing sequence tracking</p>
                </div>
              </div>
              <button onClick={() => setViewingJobCardDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Routing Operation:</span>
                  <span className="text-white font-bold">{viewingJobCardDetails.routingOperation?.operation?.operationName || 'CNC milling'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operation Code:</span>
                  <span className="text-slate-300 font-mono">{viewingJobCardDetails.routingOperation?.operation?.operationCode || 'OP-10'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Job Status:</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/15 border border-amber-500/20 text-amber-400 font-mono">{viewingJobCardDetails.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Machine:</span>
                  <span className="text-slate-300 font-medium">{viewingJobCardDetails.machine?.machineName || 'VMC Machining Center'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Estimated Planning Rate
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Setup Time Estimate:</span>
                  <span className="text-slate-300 font-mono">{viewingJobCardDetails.routingOperation?.estimatedSetupTime || 0} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cutting Time Estimate:</span>
                  <span className="text-slate-300 font-mono">{viewingJobCardDetails.routingOperation?.estimatedHours || 0} hours</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingJobCardDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* MSDR Details Modal */}
      {viewingMsdrDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-cyan-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Machine Shop Daily Log</h3>
                  <p className="text-[10px] text-slate-400">Operator execution feedback</p>
                </div>
              </div>
              <button onClick={() => setViewingMsdrDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Allocated Machine:</span>
                  <span className="text-white font-bold">{viewingMsdrDetails.machine?.machineName || 'VMC #4'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operator Signoff:</span>
                  <span className="text-slate-300 font-bold">{viewingMsdrDetails.employee?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Report Date:</span>
                  <span className="text-slate-300 font-mono">{new Date(viewingMsdrDetails.reportDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Logged Shop Time
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actual Setup Time:</span>
                  <span className="text-slate-300 font-mono">{viewingMsdrDetails.setupTime} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Actual Cutting Time:</span>
                  <span className="text-slate-300 font-mono">{viewingMsdrDetails.cuttingTime} hours</span>
                </div>
                {viewingMsdrDetails.variance !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Log Variance vs Plan:</span>
                    <span className={`font-bold font-mono ${viewingMsdrDetails.variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {viewingMsdrDetails.variance > 0 ? '+' : ''}{viewingMsdrDetails.variance} hours
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingMsdrDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Material Issue Details Modal */}
      {viewingIssueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-purple-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <PackageMinus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Material Issue Slip</h3>
                  <p className="text-[10px] text-slate-400">Traceability audit ledger</p>
                </div>
              </div>
              <button onClick={() => setViewingIssueDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Issue Slip:</span>
                  <span className="text-white font-bold font-mono">{viewingIssueDetails.issueNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Issued:</span>
                  <span className="text-slate-300 font-mono">{new Date(viewingIssueDetails.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/20 uppercase font-mono">{viewingIssueDetails.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center mb-1">
                  <Info className="w-3.5 h-3.5 mr-1" /> Items Checklist
                </h4>
                <div className="divide-y divide-white/5">
                  {viewingIssueDetails.items?.map((item: any) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{item.inventoryBatch?.material?.materialName}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">BATCH: {item.inventoryBatch?.batchNumber}</span>
                      </div>
                      <div className="text-right flex flex-col font-mono text-purple-400 font-bold">
                        <span>{item.issuedQty} units issued</span>
                        {Number(item.returnedQty || 0) > 0 && (
                          <span className="text-[10px] text-red-400 mt-0.5">({item.returnedQty} units returned)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingIssueDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
