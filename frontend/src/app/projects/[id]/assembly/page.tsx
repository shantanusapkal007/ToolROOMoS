"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject, useCompleteProduction } from "@/hooks/useProjects";
import {
  useAssemblyOrders,
  useProjectTrials,
  useCreateAssemblyOrder,
  useCreateProjectTrial,
  useSignOffTrial,
} from "@/hooks/useAssembly";
import { useGlobalDailyReports } from "@/hooks/useDailyReports";
import {
  Activity,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  Wrench,
  Clock,
  CheckSquare,
  FileSpreadsheet,
  Gauge,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";

type AssemblyTab = "KITTING" | "SUB_ASSEMBLIES" | "TRIALS" | "FITTER_LOGS";

export default function ProjectAssemblyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<AssemblyTab>("KITTING");

  // Modals
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Form States
  const [trialForm, setTrialForm] = useState({
    trialNumber: "T0-INITIAL",
    machineName: "150T Mechanical Press",
    spmRate: "35",
    tonnage: "120",
    sampleQty: "10",
    result: "PASS",
    remarks: "Initial press tryout completed cleanly. Burrs within tolerance.",
  });

  const [orderForm, setOrderForm] = useState({
    assemblyName: "Die Base & Sub-Assembly",
    remarks: "Fitting & alignment of guide pillars and punch plate",
  });

  const [handoverRemarks, setHandoverRemarks] = useState("");

  // Data Queries
  const { data: project, isLoading: isProjectLoading } = useProject(id);
  const { data: assemblyOrders = [], isLoading: isOrdersLoading } = useAssemblyOrders(id);
  const { data: trials = [], isLoading: isTrialsLoading } = useProjectTrials(id);
  const { data: msdrsResponse } = useGlobalDailyReports({ projectId: id, type: "MSDR", section: "TOOL_ROOM_FITTING" });

  const completeProductionMutation = useCompleteProduction(id);
  const createTrialMutation = useCreateProjectTrial(id);
  const createOrderMutation = useCreateAssemblyOrder(id);
  const signOffMutation = useSignOffTrial(id);

  const extractMSDRs = (res: any) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const fittingMsdrLogs = extractMSDRs(msdrsResponse);

  if (isProjectLoading) return <SkeletonBox className="h-96 w-full" />;

  // Real BOM items & issued materials
  const bomItems = project?.boms?.[0]?.items || [];
  const materialIssues = (project?.materialIssueHeaders || []).flatMap((h: any) => (h.items || []).map((item: any) => ({
    ...item,
    section: h.productionSection,
    issueNumber: h.issueNumber,
  })));

  const totalBomItems = bomItems.length || materialIssues.length;
  const issuedMaterialsCount = materialIssues.length;
  const kittingReadinessPct = totalBomItems > 0 ? Math.min(100, Math.round((issuedMaterialsCount / totalBomItems) * 100)) : 0;

  const totalTrials = trials.length;
  const passedTrials = trials.filter((t: any) => t.result === "PASS" || t.status === "APPROVED").length;
  const trialSuccessRate = totalTrials > 0 ? Math.round((passedTrials / totalTrials) * 100) : 0;

  const totalFitterHours = fittingMsdrLogs.reduce((acc: number, log: any) => {
    return acc + (Number(log.hoursSpent) || Number(log.cuttingHours) || 0) + (Number(log.setupHours) || 0);
  }, 0);

  const isAssemblyCompleted = project?.currentStage === "INSPECTION" || 
    project?.currentStage === "DISPATCH_READY" || 
    project?.currentStage === "DISPATCHED" || 
    project?.currentStage === "INVOICED" || 
    project?.currentStage === "CLOSED";

  // Handlers
  const handleCreateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrialMutation.mutateAsync({
        trialNumber: trialForm.trialNumber,
        machineName: `${trialForm.machineName} (${trialForm.spmRate} SPM, ${trialForm.tonnage}T)`,
        result: trialForm.result,
        remarks: `${trialForm.remarks} | Sample Qty: ${trialForm.sampleQty} pcs`,
      });
      setShowTrialModal(false);
    } catch (err) {}
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrderMutation.mutateAsync(orderForm);
      setShowOrderModal(false);
    } catch (err) {}
  };

  const handleHandoverToQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await completeProductionMutation.mutateAsync(handoverRemarks || "Assembly & tryout completed. Handed over for Quality Control Inspection.");
      setShowHandoverModal(false);
    } catch (err) {}
  };

  const formatSectionName = (sec?: string) => {
    if (!sec) return "Toolroom Fitting Shop";
    switch (sec) {
      case "MACHINE_SHOP": return "Machine Shop";
      case "TOOL_ROOM_FITTING": return "Toolroom Fitting Shop";
      case "PRESS_SHOP": return "Press Shop";
      case "FABRICATION_INDIAN":
      case "FABRICATION": return "Fabrication Shop";
      case "FABRICATION_EXPORT": return "Fab Export Shop";
      case "PROJECT_STORE": return "Project Store";
      default: return sec.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6 font-sans text-zinc-900">
      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600" />
              <span>Toolroom Assembly & Tryout Workspace</span>
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isAssemblyCompleted ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-purple-100 text-purple-800 border border-purple-200"
            }`}>
              {project?.currentStage?.replace(/_/g, " ") || "ASSEMBLY & FITTING"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            BOM component kitting verification, sub-assembly work orders, press tryouts (T0/T1/T2), and fitter time logs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowTrialModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Gauge className="w-4 h-4" />
            <span>Record Press Trial</span>
          </button>

          {isAssemblyCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Handed Over to Quality</span>
            </div>
          ) : (
            <button
              onClick={() => setShowHandoverModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Handover to Quality</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kitting Readiness */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Kitting Readiness</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{kittingReadinessPct}%</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{issuedMaterialsCount} of {totalBomItems} components in store</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Active Sub-Assemblies */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Sub-Assemblies</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{assemblyOrders.length}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Sub-assembly work orders</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Trial Success Rate */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Press Tryout Pass Rate</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{trialSuccessRate}%</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{trials.length} total tryout runs logged</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Fitter Hours */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Fitter Hours Logged</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{totalFitterHours.toFixed(1)} hrs</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Toolroom fitting & bedding logs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("KITTING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "KITTING" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-600" />
          <span>BOM Kitting Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab("SUB_ASSEMBLIES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SUB_ASSEMBLIES" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Sub-Assemblies ({assemblyOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TRIALS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TRIALS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Gauge className="w-4 h-4 text-emerald-600" />
          <span>Press Tryout Log (T0/T1/T2)</span>
        </button>

        <button
          onClick={() => setActiveTab("FITTER_LOGS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "FITTER_LOGS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Fitter Daily Reports</span>
        </button>
      </div>

      {/* Tab 1: Kitting Checklist */}
      {activeTab === "KITTING" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">BOM Component Kitting Status</h3>
              <p className="text-xs text-zinc-500">Component readiness check before tool fitting & bench assembly</p>
            </div>
            <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
              Kitting Score: {kittingReadinessPct}% Ready
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Component / Part</th>
                  <th className="p-3">Material Grade</th>
                  <th className="p-3">Required Qty</th>
                  <th className="p-3">Issue Location</th>
                  <th className="p-3 text-center">Fitting Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {bomItems.length > 0 ? (
                  bomItems.map((item: any, idx: number) => {
                    const isIssued = materialIssues.some((m: any) => m.inventoryBatch?.materialId === item.materialId || m.materialName?.includes(item.partName));
                    return (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3 font-bold text-zinc-900">{item.partName || item.partNumber || `Item #${idx + 1}`}</td>
                        <td className="p-3 text-zinc-600 font-mono text-[11px]">{item.materialGrade || item.material?.materialGrade || "Standard Steel"}</td>
                        <td className="p-3 font-semibold text-zinc-800">{item.quantity || item.requiredQty || 1} NOS</td>
                        <td className="p-3 text-zinc-500 text-[11px]">{isIssued ? "Toolroom Fitting Shop" : "Project Store"}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isIssued ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {isIssued ? "Ready for Fitting" : "In Project Store"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : materialIssues.length > 0 ? (
                  materialIssues.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-bold text-zinc-900">{item.inventoryBatch?.material?.materialName || item.inventoryBatch?.material?.materialGrade || "Raw Material Block"}</td>
                      <td className="p-3 text-zinc-600 font-mono text-[11px]">{item.inventoryBatch?.material?.materialGrade || "Tool Steel"}</td>
                      <td className="p-3 font-semibold text-zinc-800">{item.issuedQty || 1} NOS</td>
                      <td className="p-3 text-zinc-500 text-[11px]">{formatSectionName(item.section)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Issued & Ready
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                      No BOM items or material issues recorded for this project yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sub-Assemblies */}
      {activeTab === "SUB_ASSEMBLIES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Sub-Assembly Breakdown</h3>
              <p className="text-xs text-zinc-500">Group BOM components into fitting sub-assemblies for sequential trial</p>
            </div>
            <button
              onClick={() => setShowOrderModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-Assembly Work Order</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assemblyOrders.length > 0 ? (
              assemblyOrders.map((asm: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono text-xs font-bold text-zinc-500">{asm.assemblyNumber || `ASM-${idx + 1}`}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      asm.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {asm.status || "IN_PROGRESS"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{asm.assemblyName}</h4>
                    <p className="text-xs text-zinc-500">Target Date: <span className="font-semibold text-zinc-700">{asm.targetDate ? new Date(asm.targetDate).toLocaleDateString() : "Ongoing"}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white p-8 rounded-2xl border border-zinc-200/80 text-center text-zinc-500 space-y-2">
                <Layers className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="font-semibold text-xs">No sub-assembly work orders created for this project yet.</p>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Sub-Assembly Work Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Press Tryouts */}
      {activeTab === "TRIALS" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Press Tryout Performance Register</h3>
              <p className="text-xs text-zinc-500">Official log of T0 (Initial), T1 (Post-Mod), T2 (Final) press tryouts</p>
            </div>
            <button
              onClick={() => setShowTrialModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              <span>Record Trial Run</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Trial #</th>
                  <th className="p-3">Press Machine & Tonnage</th>
                  <th className="p-3">Trial Verdict</th>
                  <th className="p-3">Observations / Remarks</th>
                  <th className="p-3 text-right">Sign-off Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trials.length > 0 ? (
                  trials.map((t: any) => (
                    <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-700">{t.trialNumber}</td>
                      <td className="p-3 font-semibold text-zinc-800">{t.machineName}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.result === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.result}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600">{t.remarks}</td>
                      <td className="p-3 text-right">
                        {t.status === "APPROVED" ? (
                          <span className="text-emerald-700 font-bold flex items-center justify-end gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                          </span>
                        ) : (
                          <button
                            onClick={() => signOffMutation.mutate(t.id)}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                          >
                            Sign Off
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                      No press tryouts recorded yet for this project. Click 'Record Trial Run' to log tryouts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Fitter Daily Logs */}
      {activeTab === "FITTER_LOGS" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Fitter Daily Shopfloor Logs</h3>
              <p className="text-xs text-zinc-500">Daily shopfloor hours logged under Toolroom Fitting & Assembly section</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fitter Name</th>
                  <th className="p-3">Work Stage / Operation</th>
                  <th className="p-3 text-right">Hours Logged</th>
                  <th className="p-3">Work Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {fittingMsdrLogs.length > 0 ? (
                  fittingMsdrLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono text-zinc-600">{new Date(log.logDate).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-zinc-900">{log.personName}</td>
                      <td className="p-3 font-semibold text-purple-700">{log.workStageOrOperation}</td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-900">
                        {(Number(log.hoursSpent) || Number(log.cuttingHours) || 0).toFixed(1)} hrs
                      </td>
                      <td className="p-3 text-zinc-600">{log.workDescription || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                      No fitting shopfloor logs recorded yet for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Sub-Assembly Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="Create Sub-Assembly Work Order"
        subtitle={`Define a fitting sub-assembly for project ${project?.projectNumber || id}`}
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Sub-Assembly Name</label>
            <input
              type="text"
              required
              value={orderForm.assemblyName}
              onChange={(e) => setOrderForm({ ...orderForm, assemblyName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Remarks / Scope</label>
            <textarea
              rows={3}
              value={orderForm.remarks}
              onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>{createOrderMutation.isPending ? "Creating..." : "Create Work Order"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Press Trial Modal */}
      <Modal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        title="Record Press Tryout Run"
        subtitle={`Log T0/T1/T2 press tryout performance parameters for ${project?.projectNumber || id}`}
      >
        <form onSubmit={handleCreateTrial} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Trial Phase</label>
              <select
                value={trialForm.trialNumber}
                onChange={(e) => setTrialForm({ ...trialForm, trialNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              >
                <option value="T0-INITIAL">T0 — Initial Tryout</option>
                <option value="T1-POST-MOD">T1 — Post Tool Modification</option>
                <option value="T2-FINAL">T2 — Final Sample Tryout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Trial Verdict</label>
              <select
                value={trialForm.result}
                onChange={(e) => setTrialForm({ ...trialForm, result: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              >
                <option value="PASS">PASS — Samples Accepted</option>
                <option value="REWORK_REQUIRED">REWORK REQUIRED — Tool Adjustment</option>
                <option value="RE_TRIAL">RE-TRIAL — Schedule Second Tryout</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Press Machine Used</label>
              <input
                type="text"
                value={trialForm.machineName}
                onChange={(e) => setTrialForm({ ...trialForm, machineName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Sample Qty (Pcs)</label>
              <input
                type="number"
                value={trialForm.sampleQty}
                onChange={(e) => setTrialForm({ ...trialForm, sampleQty: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Tryout Observations & Remarks</label>
            <textarea
              rows={3}
              value={trialForm.remarks}
              onChange={(e) => setTrialForm({ ...trialForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowTrialModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTrialMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
            >
              <Gauge className="w-4 h-4 text-white" />
              <span>{createTrialMutation.isPending ? "Logging..." : "Save Trial Record"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Handover to Quality Confirmation Modal */}
      <Modal
        isOpen={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        title="Complete Assembly & Handover to Quality"
        subtitle={`Advance project ${project?.projectNumber || id} to Quality Inspection stage`}
      >
        <form onSubmit={handleHandoverToQuality} className="space-y-4">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Quality Inspection Milestone</span>
            </div>
            <p className="text-emerald-800">
              This action confirms toolroom fitting & press tryouts are completed. The project stage will advance to <strong>QUALITY INSPECTION</strong> for CMM and PDI clearance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Handover Remarks</label>
            <textarea
              rows={3}
              placeholder="e.g. Die bedding completed, shut height locked at 320mm, T0 samples stamped cleanly."
              value={handoverRemarks}
              onChange={(e) => setHandoverRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowHandoverModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeProductionMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{completeProductionMutation.isPending ? "Submitting..." : "Confirm & Handover"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
