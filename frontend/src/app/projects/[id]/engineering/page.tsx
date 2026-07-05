"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, Layers, GitMerge, CheckCircle, Lock, Cpu, Settings } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";
import { Modal } from "../../../../components/ui/Modal";
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
  const [routingOps, setRoutingOps] = useState([{ sequenceOrder: 10, operationId: "", machineId: "", estimatedSetupTime: 0, estimatedHours: 0 }]);

  if (projectLoading || !project) return null;

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

  const handleSubmitRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateRoutingMutation.mutateAsync({ operations: routingOps });
      setShowRoutingModal(false);
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

  if (!project) return <div className="p-6 text-slate-400">Loading Engineering Plan...</div>;

  const isDrawingComplete = project.drawings && project.drawings.length > 0;
  const isBomComplete = activeBom?.approvalStatus === 'APPROVED';
  const isRoutingComplete = activeRouting?.approvalStatus === 'APPROVED';
  const isFullyApproved = isDrawingComplete && isBomComplete && isRoutingComplete;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col px-6">
      <div className="flex justify-between items-center my-6">
        <div>
          <h2 className="text-h3 font-bold text-white flex items-center">
            <Settings className="h-6 w-6 mr-3 text-blue-400" />
            Manufacturing Planning Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">Define the immutable manufacturing plan and generate the cost baseline.</p>
        </div>
        {isFullyApproved && (
          <button onClick={handleReopenEngineering} className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-bold border border-red-500/30 transition-all">
            Revise Engineering Plan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Step 1: Drawing */}
        <div className={`p-6 rounded-xl border ${isDrawingComplete ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-blue-500/30 bg-blue-950/10'} relative`}>
          <h3 className="font-bold text-white mb-2 flex items-center">
            <span className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-xs mr-2">1</span>
            Customer Drawing
          </h3>
          {isDrawingComplete ? (
            <div className="text-sm text-emerald-400 flex items-center mt-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              Rev {project.drawings?.[0]?.revision} Approved
            </div>
          ) : (
            <button onClick={() => setShowDrawingModal(true)} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all">
              Upload Drawing
            </button>
          )}
        </div>

        {/* Step 2: BOM */}
        <div className={`p-6 rounded-xl border ${isBomComplete ? 'border-emerald-500/30 bg-emerald-950/10' : (!isDrawingComplete ? 'border-white/5 bg-white/5 opacity-50' : 'border-blue-500/30 bg-blue-950/10')} relative`}>
          {!isDrawingComplete && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] rounded-xl"><Lock className="text-white/30" /></div>}
          <h3 className="font-bold text-white mb-2 flex items-center">
            <span className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-xs mr-2">2</span>
            Material Plan
          </h3>
          {isBomComplete ? (
            <div className="text-sm text-emerald-400 flex items-center mt-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              BOM Locked
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {!activeBom ? (
                <button onClick={() => setShowBomModal(true)} className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all">Create BOM</button>
              ) : (
                <button onClick={handleApproveBom} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all">Approve BOM</button>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Routing */}
        <div className={`p-6 rounded-xl border ${isRoutingComplete ? 'border-emerald-500/30 bg-emerald-950/10' : (!isBomComplete ? 'border-white/5 bg-white/5 opacity-50' : 'border-blue-500/30 bg-blue-950/10')} relative`}>
          {!isBomComplete && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] rounded-xl"><Lock className="text-white/30" /></div>}
          <h3 className="font-bold text-white mb-2 flex items-center">
            <span className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-xs mr-2">3</span>
            Machine Routing
          </h3>
          {isRoutingComplete ? (
            <div className="text-sm text-emerald-400 flex items-center mt-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              Routing Locked
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {!activeRouting ? (
                <button onClick={() => setShowRoutingModal(true)} className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all">Plan Routing</button>
              ) : (
                <span className="text-sm text-orange-400">Draft Pending Approval</span>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Approval */}
        <div className={`p-6 rounded-xl border ${isFullyApproved ? 'border-emerald-500/30 bg-emerald-950/10' : (!activeRouting ? 'border-white/5 bg-white/5 opacity-50' : 'border-orange-500/30 bg-orange-950/10')} relative`}>
          {!activeRouting && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] rounded-xl"><Lock className="text-white/30" /></div>}
          <h3 className="font-bold text-white mb-2 flex items-center">
            <span className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-xs mr-2">4</span>
            Cost Baseline
          </h3>
          {isFullyApproved ? (
            <div className="text-sm text-emerald-400 flex items-center mt-4 font-bold">
              <CheckCircle className="w-4 h-4 mr-2" />
              Project Ready for Floor
            </div>
          ) : (
            <button onClick={handleApproveEngineering} className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)] rounded-lg text-sm font-bold transition-all animate-pulse">
              Freeze Plan & Baseline
            </button>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Routing View */}
          <div className="glass-panel p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Cpu className="mr-2 text-slate-400" /> Manufacturing Sequence</h3>
            {activeRouting ? (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase pb-2 border-b border-white/10">
                  <div className="col-span-2">Seq</div>
                  <div className="col-span-4">Operation</div>
                  <div className="col-span-4">Allocated Machine</div>
                  <div className="col-span-2 text-right">Est. Hrs</div>
                </div>
                {activeRouting.operations?.map((op: any) => (
                  <div key={op.id} className="grid grid-cols-12 gap-4 text-sm text-slate-300 py-2 border-b border-white/5 last:border-0">
                    <div className="col-span-2 font-mono text-blue-400">{op.sequenceOrder}</div>
                    <div className="col-span-4">{op.operation?.operationName}</div>
                    <div className="col-span-4">{op.machine?.machineName || <span className="text-red-400">Unassigned</span>}</div>
                    <div className="col-span-2 text-right font-mono">{op.estimatedHours}h</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-sm">No sequence defined.</p>
            )}
          </div>
        </div>

        {/* Cost Baseline View */}
        <div className="glass-panel p-6 border border-white/5 h-fit">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center"><GitMerge className="mr-2 text-slate-400" /> Cost Baseline</h3>
          {costSummary ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Est. Material</span>
                <span className="text-white font-mono">&#8377;{costSummary.estimatedMaterialCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Est. Machine</span>
                <span className="text-white font-mono">&#8377;{costSummary.estimatedMachineCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Est. Labour</span>
                <span className="text-white font-mono">&#8377;{costSummary.estimatedLabourCost}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between font-bold text-emerald-400">
                <span>Total Mfg Cost</span>
                <span className="font-mono">&#8377;{costSummary.estimatedManufacturingCost}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 italic text-sm">Baseline will generate upon approval.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showDrawingModal} onClose={() => setShowDrawingModal(false)} title="Import CAD Drawing">
        <form onSubmit={handleUploadDrawing} className="space-y-4">
          <Input label="Drawing Reference" value={drawingNum} onChange={(e) => setDrawingNum(e.target.value)} required />
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={() => setShowDrawingModal(false)} className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 font-bold text-white rounded-xl">Upload</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showBomModal} onClose={() => setShowBomModal(false)} title="Material Plan (BOM)" maxWidth="lg">
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
          <div className="flex space-x-3 pt-6 mt-6 border-t border-white/10">
            <button type="button" onClick={() => setShowBomModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-white">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold">Save BOM</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showRoutingModal} onClose={() => setShowRoutingModal(false)} title="Manufacturing Sequence Builder" maxWidth="2xl">
        <form onSubmit={handleSubmitRouting} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[60vh] pr-2">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400">
              <div className="col-span-1">Seq</div>
              <div className="col-span-3">Operation</div>
              <div className="col-span-3">Target Machine</div>
              <div className="col-span-2">Setup(h)</div>
              <div className="col-span-2">Cut(h)</div>
              <div className="col-span-1"></div>
            </div>
            {routingOps.map((op, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <input type="number" className="w-full bg-[#050A14] border border-white/10 rounded-lg p-2 text-white font-mono" value={op.sequenceOrder} onChange={(e) => { const a = [...routingOps]; a[idx].sequenceOrder = Number(e.target.value); setRoutingOps(a); }} />
                </div>
                <div className="col-span-3">
                  <select className="w-full bg-[#050A14] border border-white/10 rounded-lg p-2 text-white" required value={op.operationId} onChange={(e) => { const a = [...routingOps]; a[idx].operationId = e.target.value; setRoutingOps(a); }}>
                    <option value="">Select Process...</option>
                    {operationsList?.map((o: any) => <option key={o.id} value={o.id}>{o.operationName}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <select className="w-full bg-[#050A14] border border-white/10 rounded-lg p-2 text-white" required value={op.machineId} onChange={(e) => { const a = [...routingOps]; a[idx].machineId = e.target.value; setRoutingOps(a); }}>
                    <option value="">Select Work Center / Machine...</option>
                    {machines?.map((m: any) => <option key={m.id} value={m.id}>{m.machineName}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" className="w-full bg-[#050A14] border border-white/10 rounded-lg p-2 text-white font-mono" required placeholder="Setup" value={op.estimatedSetupTime} onChange={(e) => { const a = [...routingOps]; a[idx].estimatedSetupTime = Number(e.target.value); setRoutingOps(a); }} />
                </div>
                <div className="col-span-2">
                  <input type="number" className="w-full bg-[#050A14] border border-white/10 rounded-lg p-2 text-white font-mono" required placeholder="Cut" value={op.estimatedHours} onChange={(e) => { const a = [...routingOps]; a[idx].estimatedHours = Number(e.target.value); setRoutingOps(a); }} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => setRoutingOps(routingOps.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 font-bold p-2 bg-red-500/10 rounded-lg border border-red-500/20">X</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setRoutingOps([...routingOps, { sequenceOrder: (routingOps.length + 1) * 10, operationId: "", machineId: "", estimatedSetupTime: 0, estimatedHours: 0 }])} className="w-full py-2 border-2 border-dashed border-blue-500/30 text-blue-400 font-bold rounded-lg">+ Add Operation</button>
          </div>
          <div className="flex space-x-3 pt-6 mt-6 border-t border-white/10">
            <button type="button" onClick={() => setShowRoutingModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-white">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold">Save Plan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
