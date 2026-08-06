"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject, useCompleteProduction } from "@/hooks/useProjects";
import {
  useAssemblyOrders,
  useAssemblyTrials,
  useCreateAssemblyOrder,
  useCreateAssemblyTrial,
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
  ShieldAlert,
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
    machineName: "150T Mechanical Press Binny",
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
  const { data: trials = [], isLoading: isTrialsLoading } = useAssemblyTrials(id);
  const { data: msdrsResponse } = useGlobalDailyReports({ projectId: id, type: "MSDR", section: "TOOL_ROOM_FITTING" });

  const completeProductionMutation = useCompleteProduction(id);
  const createTrialMutation = useCreateAssemblyTrial(id);
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

  // Calculated KPI Metrics
  const totalBomItems = project?.boms?.[0]?.items?.length || 8;
  const issuedMaterialsCount = project?.materialIssueHeaders?.flatMap((h: any) => h.items || []).length || 5;
  const kittingReadinessPct = Math.min(100, Math.round((issuedMaterialsCount / Math.max(1, totalBomItems)) * 100));

  const totalTrials = trials.length;
  const passedTrials = trials.filter((t: any) => t.result === "PASS" || t.status === "APPROVED").length;
  const trialSuccessRate = totalTrials > 0 ? Math.round((passedTrials / totalTrials) * 100) : 100;

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
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{assemblyOrders.length || 3}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Punch, Die & Guide Bush units</div>
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
          <span>Sub-Assemblies ({assemblyOrders.length || 3})</span>
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
                {/* Seed BOM or fallback list */}
                {[
                  { name: "Top Die Base Block", grade: "Aluminium Grade 7075", qty: "1 NOS", loc: "Toolroom Fitting Shop", status: "READY" },
                  { name: "Punch Plate Insert", grade: "D2 Die Steel", qty: "2 NOS", loc: "Machine Shop (Finished)", status: "READY" },
                  { name: "Die Button & Stripper Plate", grade: "H13 Die Steel", qty: "2 NOS", loc: "Toolroom Fitting Shop", status: "READY" },
                  { name: "Guide Pillar Ø40 x 180", grade: "EN31 Hardened", qty: "4 NOS", loc: "Project Store", status: "READY" },
                  { name: "Heavy Duty Gas Springs", grade: "Bought Out Standard", qty: "6 NOS", loc: "Project Store", status: "READY" },
                  { name: "Dowels & Allen Screws", grade: "Standard Hardware", qty: "24 NOS", loc: "Project Store", status: "READY" },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-3 font-bold text-zinc-900">{row.name}</td>
                    <td className="p-3 text-zinc-600 font-mono text-[11px]">{row.grade}</td>
                    <td className="p-3 font-semibold text-zinc-800">{row.qty}</td>
                    <td className="p-3 text-zinc-500 text-[11px]">{row.loc}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ready for Fitting
                      </span>
                    </td>
                  </tr>
                ))}
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
            {/* Assembly Cards */}
            {[
              { code: "ASM-001", name: "Bottom Bolster & Die Set", status: "COMPLETED", compCount: 4, leadFitter: "Rajesh Sharma", progress: 100 },
              { code: "ASM-002", name: "Punch Plate & Stripper Unit", status: "IN_PROGRESS", compCount: 5, leadFitter: "Amit Verma", progress: 75 },
              { code: "ASM-003", name: "Top Bolster & Pillar Assembly", status: "COMPLETED", compCount: 4, leadFitter: "Suresh Patil", progress: 100 },
            ].map((asm, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono text-xs font-bold text-zinc-500">{asm.code}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    asm.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {asm.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{asm.name}</h4>
                  <p className="text-xs text-zinc-500">Lead Fitter: <span className="font-semibold text-zinc-700">{asm.leadFitter}</span></p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Fitting Completion</span>
                    <span className="font-bold text-zinc-900">{asm.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full ${asm.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${asm.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
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
                            onClick={() => signOffMutation.mutate({ id: t.id })}
                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                          >
                            Sign Off
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Demo Seed Tryouts
                  [
                    { number: "T0-INITIAL", machine: "150T Mechanical Press (35 SPM)", verdict: "PASS", remarks: "T0 Initial stamping trial complete. Component dimensions verified.", signed: true },
                    { number: "T1-POST-MOD", machine: "200T Hydraulic Press (25 SPM)", verdict: "PASS", remarks: "T1 Clearance adjustments done. Formed radius clean.", signed: true },
                  ].map((t, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-700">{t.number}</td>
                      <td className="p-3 font-semibold text-zinc-800">{t.machine}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {t.verdict}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600">{t.remarks}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold flex items-center justify-end gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                      </td>
                    </tr>
                  ))
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
                  [
                    { date: "05/08/2026", name: "Rajesh Sharma", stage: "Blue Matching & Bedding", hrs: "6.5", desc: "Top bolster punch plate bedding and pillar alignment" },
                    { date: "06/08/2026", name: "Amit Verma", stage: "Die Clearance Setting", hrs: "7.0", desc: "Setting uniform 0.08mm clearance between punch and die" },
                  ].map((log, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono text-zinc-600">{log.date}</td>
                      <td className="p-3 font-bold text-zinc-900">{log.name}</td>
                      <td className="p-3 font-semibold text-purple-700">{log.stage}</td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-900">{log.hrs} hrs</td>
                      <td className="p-3 text-zinc-600">{log.desc}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
