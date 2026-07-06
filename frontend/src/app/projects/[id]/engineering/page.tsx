"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, Layers, GitMerge, CheckCircle, Lock, Cpu, Settings } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";
import { Modal } from "../../../../components/ui/Modal";
import { RoutingNodeEditor } from "../../../../components/engineering/RoutingNodeEditor";
import { BomConverter } from "../../../../components/engineering/BomConverter";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { 
  useProjectBOM, useProjectRouting, useUpdateBOM, useUpdateRouting, 
  useApproveBOM, useApproveRouting, useUploadDrawing 
} from "../../../../hooks/useEngineering";

export default function EngineeringTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error, warning } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const costSummary = project?.projectCostSummary;
  
  // Master Data
  const { data: materials } = useMasterData('materials');
  const { data: machines } = useMasterData('machines');
  const { data: operationsList } = useMasterData('operations');
  
  // Engineering Data
  const { data: activeBom, refetch: refetchBOM } = useProjectBOM(resolvedParams.id);
  const { data: activeRouting, refetch: refetchRouting } = useProjectRouting(resolvedParams.id);
  
  // Mutations
  const updateBOMMutation = useUpdateBOM(resolvedParams.id);
  const updateRoutingMutation = useUpdateRouting(resolvedParams.id);
  const approveBOMMutation = useApproveBOM(resolvedParams.id);
  const approveRoutingMutation = useApproveRouting(resolvedParams.id);
  const uploadDrawingMutation = useUploadDrawing(resolvedParams.id);

  // Modals & States
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingNum, setDrawingNum] = useState("");

  const [showBomModal, setShowBomModal] = useState(false);
  const [bomItems, setBomItems] = useState([{ materialId: "", requiredQty: 1, estimatedCost: 0 }]);

  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'sequence' | 'converter'>('sequence');

  if (projectLoading || !project) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  // --- Actions ---
  const handleUploadDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await uploadDrawingMutation.mutateAsync({
        drawingNumber: drawingNum,
        fileUrl: `s3://toolroomos/drawings/${drawingNum.toLowerCase()}.dxf`,
      });
      setShowDrawingModal(false);
      refetchProject();
    } catch (err: any) {}
  };

  const handleSubmitBom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateBOMMutation.mutateAsync({ items: bomItems });
      setShowBomModal(false);
    } catch (err: any) {}
  };

  const handleApproveBom = async () => {
    try {
      await approveBOMMutation.mutateAsync(activeBom.id);
    } catch (err: any) {}
  };

  const handleApproveEngineering = async () => {
    if (!activeRouting) return;
    try {
      await api.put(`projects/${project.id}/routing/${activeRouting.id}/approve`);
      success("Engineering Approved", "Manufacturing Plan Frozen. Baseline Costs Generated.");
      refetchProject();
      refetchBOM();
      refetchRouting();
    } catch (err: any) {
      error("Approval Failed", err.response?.data?.message || err.message);
    }
  };

  const handleReopenEngineering = async () => {
    try {
      await api.post(`projects/${project.id}/reopen-engineering`);
      warning("Engineering Reopened", "Previous plan obsoleted. Downstream POs are on hold.");
      refetchProject();
      refetchBOM();
      refetchRouting();
    } catch (err: any) {
      error("Action Failed", err.response?.data?.message || err.message);
    }
  };

  const isDrawingComplete = project.drawings && project.drawings.length > 0;
  const isBomComplete = activeBom?.approvalStatus === 'APPROVED';
  const isRoutingComplete = activeRouting?.approvalStatus === 'APPROVED';
  const isFullyApproved = isDrawingComplete && isBomComplete && isRoutingComplete;

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      
      {/* Dense Toolbar Header */}
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 mr-3 text-blue-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Manufacturing Planning Engine</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Immutable Manufacturing Plan & Baseline</p>
          </div>
        </div>
        
        {isFullyApproved && (
          <button onClick={handleReopenEngineering} className="group relative px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-300">
            <span className="relative z-10 flex items-center text-red-400 font-bold text-xs">Revise Engineering Plan</span>
          </button>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-white/5 pb-2 shrink-0">
        <button 
          onClick={() => setActiveTab('sequence')} 
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'sequence' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.02]'
          }`}
        >
          Planning Sequence
        </button>
        <button 
          onClick={() => setActiveTab('converter')} 
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'converter' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.02]'
          }`}
        >
          BOM Converter
        </button>
      </div>

      {activeTab === 'sequence' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            {/* Step 1: Drawing */}
            <div className={`p-4 rounded-xl border ${isDrawingComplete ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-blue-500/30 bg-blue-950/10'} relative flex flex-col justify-between`}>
              <h3 className="text-xs font-bold text-white mb-2 flex items-center tracking-widest uppercase">
                <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center text-[10px] mr-2 text-slate-300">1</span>
                Customer Drawing
              </h3>
              {isDrawingComplete ? (
                <div className="text-[11px] font-bold text-emerald-400 flex items-center mt-2">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Rev {project.drawings?.[0]?.revision} Approved
                </div>
              ) : (
                <button onClick={() => setShowDrawingModal(true)} className="mt-2 w-full py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold transition-all">
                  Upload Drawing
                </button>
              )}
            </div>

            {/* Step 2: BOM */}
            <div className={`p-4 rounded-xl border ${isBomComplete ? 'border-emerald-500/30 bg-emerald-950/10' : (!isDrawingComplete ? 'border-white/5 bg-white/5 opacity-50' : 'border-blue-500/30 bg-blue-950/10')} relative flex flex-col justify-between`}>
              {!isDrawingComplete && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] rounded-xl"><Lock className="text-white/30 w-4 h-4" /></div>}
              <h3 className="text-xs font-bold text-white mb-2 flex items-center tracking-widest uppercase">
                <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center text-[10px] mr-2 text-slate-300">2</span>
                Material Plan
              </h3>
              {isBomComplete ? (
                <div className="text-[11px] font-bold text-emerald-400 flex items-center mt-2">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  BOM Locked
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {!activeBom ? (
                    <button onClick={() => setShowBomModal(true)} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold transition-all">Create BOM</button>
                  ) : (
                    <button onClick={handleApproveBom} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(5,150,105,0.3)]">Approve BOM</button>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Routing */}
            <div className={`p-4 rounded-xl border ${isRoutingComplete ? 'border-emerald-500/30 bg-emerald-950/10' : (!isBomComplete ? 'border-white/5 bg-white/5 opacity-50' : 'border-blue-500/30 bg-blue-950/10')} relative flex flex-col justify-between`}>
              {!isBomComplete && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] rounded-xl"><Lock className="text-white/30 w-4 h-4" /></div>}
              <h3 className="text-xs font-bold text-white mb-2 flex items-center tracking-widest uppercase">
                <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center text-[10px] mr-2 text-slate-300">3</span>
                Machine Routing
              </h3>
              {isRoutingComplete ? (
                <div className="text-[11px] font-bold text-emerald-400 flex items-center mt-2">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Routing Locked
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <button onClick={() => setShowRoutingModal(true)} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold transition-all">
                    {activeRouting ? 'Edit Routing' : 'Plan Routing'}
                  </button>
                </div>
              )}
            </div>

            {/* Step 4: Approval */}
            <div className={`p-4 rounded-xl border ${isFullyApproved ? 'border-emerald-500/30 bg-emerald-950/10' : (!activeRouting ? 'border-white/5 bg-white/5 opacity-50' : 'border-orange-500/30 bg-orange-950/10')} relative flex flex-col justify-between`}>
              {!activeRouting && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] rounded-xl"><Lock className="text-white/30 w-4 h-4" /></div>}
              <h3 className="text-xs font-bold text-white mb-2 flex items-center tracking-widest uppercase">
                <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center text-[10px] mr-2 text-slate-300">4</span>
                Cost Baseline
              </h3>
              {isFullyApproved ? (
                <div className="text-[11px] text-emerald-400 flex items-center mt-2 font-bold">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Ready for Floor
                </div>
              ) : (
                <button onClick={handleApproveEngineering} className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)] rounded-lg text-xs font-bold transition-all animate-pulse">
                  Freeze Plan & Baseline
                </button>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            <div className="lg:col-span-2 space-y-4 h-full flex flex-col min-h-0">
              {/* Active Routing View */}
              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex-1 flex flex-col min-h-0">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center tracking-widest uppercase"><Cpu className="mr-2 text-blue-400 w-4 h-4" /> Manufacturing Sequence</h3>
                {activeRouting ? (
                  <div className="space-y-2 overflow-y-auto hide-scrollbar pr-2 flex-1">
                    <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-500 uppercase pb-2 border-b border-white/10 sticky top-0 bg-[#0B1018]/90 backdrop-blur z-10">
                      <div className="col-span-2">Seq</div>
                      <div className="col-span-4">Operation</div>
                      <div className="col-span-4">Allocated Machine</div>
                      <div className="col-span-2 text-right">Est. Hrs</div>
                    </div>
                    {activeRouting.operations?.map((op: any) => (
                      <div key={op.id} className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-300 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1 rounded">
                        <div className="col-span-2 font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit">{op.sequenceOrder}</div>
                        <div className="col-span-4 flex items-center">{op.operation?.operationName}</div>
                        <div className="col-span-4 flex items-center">{op.machine?.machineName || <span className="text-red-400 px-2 py-0.5 bg-red-500/10 rounded">Unassigned</span>}</div>
                        <div className="col-span-2 text-right font-mono flex items-center justify-end">{op.estimatedHours}h</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-xs">
                    <Cpu className="w-8 h-8 mb-2 opacity-20" />
                    No sequence defined.
                  </div>
                )}
              </div>
            </div>

            {/* Cost Baseline View */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 h-fit">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center tracking-widest uppercase"><GitMerge className="mr-2 text-emerald-400 w-4 h-4" /> Cost Baseline</h3>
              {costSummary ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Est. Material</span>
                    <span className="text-white font-mono">{formatCurrency(costSummary.estimatedMaterialCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Est. Machine</span>
                    <span className="text-white font-mono">{formatCurrency(costSummary.estimatedMachineCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Est. Labour</span>
                    <span className="text-white font-mono">{formatCurrency(costSummary.estimatedLabourCost)}</span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-emerald-400 text-sm">
                    <span className="uppercase tracking-widest text-[10px]">Total Mfg Cost</span>
                    <span className="font-mono">{formatCurrency(costSummary.estimatedManufacturingCost)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 italic text-xs py-8">
                  Baseline will generate upon approval.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <BomConverter 
          projectId={resolvedParams.id} 
          project={project} 
          materials={materials || []} 
        />
      )}

      {/* Modals */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-sm p-6 animate-slide-up border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10">Import CAD Drawing</h3>
            <form onSubmit={handleUploadDrawing} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Drawing Reference</label>
                <input type="text" value={drawingNum} onChange={(e) => setDrawingNum(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowDrawingModal(false)} className="flex-1 px-4 py-2 bg-white/5 text-white rounded-xl text-sm font-bold">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] font-bold text-white rounded-xl text-sm">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-2xl p-6 animate-slide-up border border-blue-500/20 flex flex-col max-h-[90vh]">
            <h3 className="text-lg font-bold text-white mb-5">Material Plan (BOM)</h3>
            <form onSubmit={handleSubmitBom} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[60vh] pr-2">
                {bomItems.map((item, idx) => (
                  <div key={idx} className="flex space-x-4 items-center">
                    <select className="flex-1 bg-[#050A14] border border-white/10 rounded-lg p-2 text-white" required value={item.materialId} onChange={(e) => { const a = [...bomItems]; a[idx].materialId = e.target.value; setBomItems(a); }}>
                      <option value="">Select Material...</option>
                      {materials?.map((m: any) => <option key={m.id} value={m.id}>{m.materialName}</option>)}
                    </select>
                    <input type="number" className="w-24 bg-[#050A14] border border-white/10 rounded-lg p-2 text-white" required placeholder="Qty" value={item.requiredQty} onChange={(e) => { const a = [...bomItems]; a[idx].requiredQty = Number(e.target.value); setBomItems(a); }} />
                  </div>
                ))}
                <button type="button" onClick={() => setBomItems([...bomItems, { materialId: "", requiredQty: 1, estimatedCost: 0 }])} className="w-full py-2 border-2 border-dashed border-blue-500/30 text-blue-400 font-bold rounded-lg">+ Add Material</button>
              </div>
              <div className="flex space-x-3 pt-4 mt-4 border-t border-white/10 shrink-0">
                <button type="button" onClick={() => setShowBomModal(false)} className="flex-1 py-2 bg-white/5 rounded-xl text-white font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)] rounded-xl text-white font-bold text-sm">Save BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Routing Node Editor */}
      {showRoutingModal && (
        <RoutingNodeEditor 
          onClose={() => setShowRoutingModal(false)}
          onSave={(nodes, edges) => {
            console.log('Saved Routing:', { nodes, edges });
            setShowRoutingModal(false);
            updateRoutingMutation.mutate({ 
              operations: nodes.filter((n: any) => n.type === 'operationNode').map((n: any, idx: number) => ({
                sequenceOrder: (idx + 1) * 10,
                operationId: n.data.opCode,
                machineId: '1',
                estimatedSetupTime: n.data.setupTime,
                estimatedHours: n.data.runTime
              }))
            });
            success('Routing Saved', 'Visual routing graph deployed successfully.');
          }}
        />
      )}
    </div>
  );
}
