"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Activity, Wrench, PackageMinus, Plus, Factory, CheckCircle, Clock } from "lucide-react";
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
  useGenerateJobCards, useUpdateJobCardStatus, useLogMSDR, useIssueMaterial 
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
  
  const [activeSubTab, setActiveSubTab] = useState<'JOB_CARDS' | 'MSDR' | 'ISSUES'>('JOB_CARDS');

  // Modals
  const [showMsdrModal, setShowMsdrModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Selected Job Card for MSDR
  const [selectedJobCard, setSelectedJobCard] = useState<any | null>(null);

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

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-h3 font-bold text-white flex items-center">
            <Factory className="h-6 w-6 mr-3 text-amber-400" />
            Manufacturing Execution
          </h2>
          <p className="text-sm text-slate-400 mt-1">Job Cards, Machine Status, and Material Consumption</p>
        </div>
        {activeSubTab === 'JOB_CARDS' && jobCards.length === 0 && project.currentStage !== 'CLOSED' && (
            <button onClick={generateJobCards} className="btn-primary bg-amber-600 hover:bg-amber-500 text-white border-none shadow-[0_0_15px_rgba(217,119,6,0.3)] flex items-center text-xs py-2 px-4">
                Generate Job Cards
            </button>
        )}
      </div>

      <div className="flex space-x-4 mb-6 border-b border-white/10 shrink-0">
        <button 
          onClick={() => setActiveSubTab('JOB_CARDS')} 
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeSubTab === 'JOB_CARDS' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Activity className="h-4 w-4 inline mr-2" /> Job Cards
        </button>
        <button 
          onClick={() => setActiveSubTab('MSDR')} 
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeSubTab === 'MSDR' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Wrench className="h-4 w-4 inline mr-2" /> Machine Logs
        </button>
        <button 
          onClick={() => setActiveSubTab('ISSUES')} 
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeSubTab === 'ISSUES' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <PackageMinus className="h-4 w-4 inline mr-2" /> Material Issues
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        
        {activeSubTab === 'JOB_CARDS' && (
           <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
               <div className="flex justify-between items-center mb-6 relative z-10">
                 <h3 className="text-lg font-bold text-white">Active Job Cards</h3>
               </div>
               
               {jobCards.length === 0 ? (
                 <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                   <Clock className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                   <p className="text-slate-400">No Job Cards generated. Ensure Routing is approved and material is issued.</p>
                 </div>
               ) : (
                 <div className="space-y-4 relative z-10">
                   {jobCards.map((job: any) => (
                     <div key={job.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center">
                       <div>
                          <div className="flex items-center space-x-3 mb-1">
                              <span className="font-bold text-white text-md">{job.routingOperation?.operation?.operationName || 'Operation'}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${job.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : job.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                  {job.status}
                              </span>
                          </div>
                          <div className="text-sm text-slate-400 mt-2 flex items-center space-x-4">
                              <span><span className="text-slate-500">Machine:</span> {job.machine?.machineName}</span>
                              <span><span className="text-slate-500">Est. Setup:</span> {job.routingOperation?.estimatedSetupTime}h</span>
                              <span><span className="text-slate-500">Est. Cut:</span> {job.routingOperation?.estimatedHours}h</span>
                          </div>
                       </div>
                       <div className="flex items-center space-x-2">
                           {job.status === 'READY' && (
                               <button onClick={() => handleStartJob(job)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/20 transition-all">
                                   Start Job
                               </button>
                           )}
                           {job.status === 'IN_PROGRESS' && (
                               <button onClick={() => openMsdrForJob(job)} className="bg-green-600/20 text-green-400 hover:bg-green-600/40 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-500/20 transition-all">
                                   <CheckCircle className="w-4 h-4 inline mr-1"/> Finish & Log
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
          <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-bold text-white">Machine Shop Daily Reports</h3>
              <button onClick={() => { setSelectedJobCard(null); setShowMsdrModal(true); }} className="btn-primary bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center text-xs py-2 px-4">
                <Plus className="h-4 w-4 mr-2" /> Unplanned Log
              </button>
            </div>
            
            {msdrs.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <Wrench className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No machine logs recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {msdrs.map((m: any) => (
                  <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center group">
                    <div>
                       <span className="font-bold text-white text-sm">Machine: {m.machine?.machineName || 'Unknown'}</span>
                       <span className="text-slate-400 text-xs ml-4 border-l border-slate-600 pl-4">Operator: {m.employee?.name || 'Unknown'}</span>
                       <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                           <span>Logged: {formatDate(m.reportDate)}</span>
                           {m.routingOperation && <span className="text-amber-400/70 border-l border-slate-700 pl-3">Job Card Link</span>}
                       </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                       <div className="flex flex-col text-right pr-4 border-r border-slate-700">
                         <span className="text-slate-400 text-[10px] uppercase">Actual</span>
                         <div className="flex space-x-2 mt-1">
                             <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-xs font-bold">Set: {m.setupTime}h</span>
                             <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">Cut: {m.cuttingTime}h</span>
                         </div>
                       </div>
                       {m.variance !== undefined && (
                           <div className="flex flex-col text-right w-16">
                               <span className="text-slate-400 text-[10px] uppercase">Variance</span>
                               <span className={`text-xs font-bold px-2 py-0.5 rounded mt-1 ${m.variance > 0 ? 'bg-red-500/20 text-red-400' : m.variance < 0 ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
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
          <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-bold text-white">Material Issues (Consumption)</h3>
              <button onClick={() => setShowIssueModal(true)} className="btn-primary bg-purple-600 hover:bg-purple-500 text-white border-none shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center text-xs py-2 px-4">
                <Plus className="h-4 w-4 mr-2" /> Issue Material
              </button>
            </div>
            
            {issues.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <PackageMinus className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No materials issued for this project.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {issues.map((i: any) => (
                  <div key={i.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-bold text-white text-sm">{i.issueNumber}</span>
                       <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">{i.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">{formatDate(i.issueDate)}</div>
                    
                    <div className="pl-4 border-l-2 border-purple-500/30 space-y-2">
                      {i.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm bg-black/20 p-2 rounded">
                           <span className="text-slate-300">
                             {item.inventoryBatch?.material?.materialName} <span className="text-slate-500 text-xs ml-2">(Batch: {item.inventoryBatch?.batchNumber})</span>
                           </span>
                           <span className="font-mono text-purple-400 font-bold">{item.issuedQty} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showMsdrModal} onClose={() => setShowMsdrModal(false)} title={selectedJobCard ? 'Complete Job Card' : 'Log Machine Time'}>
        {selectedJobCard && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                Completing Operation: <span className="font-bold">{selectedJobCard.routingOperation?.operation?.operationName}</span>
            </div>
        )}
        <form onSubmit={msdrForm.handleSubmit(handleLogMsdr)} className="space-y-4">
          <Select
            label="Machine"
            {...msdrForm.register("machineId")}
            options={machines?.map((m: any) => ({ label: m.machineName, value: m.id })) || []}
          />
          {msdrForm.formState.errors.machineId && <p className="text-red-400 text-xs">{msdrForm.formState.errors.machineId.message?.toString()}</p>}
          
          <Select
            label="Operator"
            {...msdrForm.register("employeeId")}
            options={employees?.map((e: any) => ({ label: e.name, value: e.id })) || []}
          />
          {msdrForm.formState.errors.employeeId && <p className="text-red-400 text-xs">{msdrForm.formState.errors.employeeId.message?.toString()}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Actual Setup Time (hrs)"
                type="number"
                step="0.01"
                {...msdrForm.register("setupTime", { valueAsNumber: true })}
              />
              {msdrForm.formState.errors.setupTime && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.setupTime.message?.toString()}</p>}
            </div>
            <div>
              <Input
                label="Actual Cutting Time (hrs)"
                type="number"
                step="0.01"
                {...msdrForm.register("cuttingTime", { valueAsNumber: true })}
              />
              {msdrForm.formState.errors.cuttingTime && <p className="text-red-400 text-xs mt-1">{msdrForm.formState.errors.cuttingTime.message?.toString()}</p>}
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setShowMsdrModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                {selectedJobCard ? 'Submit MSDR & Finish Job' : 'Log Time'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Material">
        <form onSubmit={issueForm.handleSubmit(handleIssueMaterial)} className="space-y-4">
          <Input
            label="Issue Slip Number"
            {...issueForm.register("issueNumber")}
          />
          {issueForm.formState.errors.issueNumber && <p className="text-red-400 text-xs">{issueForm.formState.errors.issueNumber.message?.toString()}</p>}
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Select Inventory Batch</label>
            <select
              className="input-field w-full"
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
            <Input
              label="Qty to Issue"
              type="number"
              step="0.01"
              {...issueForm.register("qty", { valueAsNumber: true })}
            />
            {issueForm.formState.errors.qty && <p className="text-red-400 text-xs mt-1">{issueForm.formState.errors.qty.message?.toString()}</p>}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium shadow-[0_0_15px_rgba(147,51,234,0.3)]">Submit Issue</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
