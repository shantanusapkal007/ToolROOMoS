"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import {
  useProjectTrials,
  useCreateProjectTrial,
  useUpdateTrialStatus,
  useSignOffTrial,
} from "@/hooks/useAssembly";
import { useProjectReworkOrders } from "@/hooks/usePartRework";
import {
  Gauge,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Wrench,
  RotateCcw,
  Sliders,
  Calendar,
  User,
  CheckSquare,
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
  Building2,
  Printer,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/formatters";
import { ReworkPartModal } from "@/components/modals/ReworkPartModal";
import { PartReworkList } from "@/components/rework/PartReworkList";

type TrialTab = "TRIALS_REGISTER" | "PRESS_SETUP" | "DEFECT_LOGS" | "PART_REWORK";

export default function ProjectTrialsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<TrialTab>("TRIALS_REGISTER");

  // Modals State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showSignoffModal, setShowSignoffModal] = useState(false);
  const [selectedTrialForSignoff, setSelectedTrialForSignoff] = useState<any>(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkModalProps, setReworkModalProps] = useState<{
    partName?: string;
    partNumber?: string;
    trialId?: string;
    sourceStage?: string;
    defectReason?: string;
    description?: string;
  }>({});

  // Trial Form State
  const [trialForm, setTrialForm] = useState({
    trialNumber: "",
    trialStage: "T0",
    trialDate: new Date().toISOString().split("T")[0],
    machineName: "250T Mechanical Press",
    pressTonnage: "250T",
    spmRate: "35",
    bolsterHeight: "480mm",
    cushionPressure: "4.5 bar",
    sampleQty: 10,
    result: "PASS",
    remarks: "Initial press tryout completed. Stamping profile validated with minor clearance adjustment required.",
    defectLog: "Burr height 0.04mm at pierce punch #2. Minor springback on flange edge.",
    inspectorName: "Tryout Lead Inspector",
  });

  const [signoffForm, setSignoffForm] = useState({
    signoffBy: "Customer Quality Lead",
    remarks: "Tooling sample accepted for pre-series run. Dies approved for dispatch.",
  });

  // Queries
  const { data: project, isLoading: isProjectLoading } = useProject(id);
  const { data: trials = [], isLoading: isTrialsLoading } = useProjectTrials(id);
  const { data: reworkOrders = [], isLoading: isReworkLoading } = useProjectReworkOrders(id);

  const createTrialMutation = useCreateProjectTrial(id);
  const updateTrialStatusMutation = useUpdateTrialStatus(id);
  const signOffMutation = useSignOffTrial(id);

  if (isProjectLoading || isTrialsLoading) {
    return <SkeletonBox className="h-96 w-full" />;
  }

  const isProjectClosed = project?.currentStage === "CLOSED" || project?.currentStage === "COMPLETED";

  // Metrics Calculations
  const totalTrials = trials.length;
  const passedTrials = trials.filter((t: any) => t.result === "PASS" || t.status === "PASSED" || t.status === "APPROVED").length;
  const trialPassYield = totalTrials > 0 ? Math.round((passedTrials / totalTrials) * 100) : 0;
  const activeReworks = reworkOrders.filter((r: any) => r.status !== "COMPLETED" && r.status !== "REJECTED_SCRAPPED");
  const hasCustomerBuyoff = trials.some((t: any) => t.customerSignoff);

  // Handlers
  const handleOpenNewTrial = () => {
    const nextSeq = totalTrials;
    const stageCode = nextSeq === 0 ? "T0" : nextSeq === 1 ? "T1" : nextSeq === 2 ? "T2" : `T${nextSeq}`;
    setTrialForm({
      ...trialForm,
      trialStage: stageCode,
      trialNumber: `TRL-${project?.projectNumber || "PRJ"}-${stageCode}-${(nextSeq + 1).toString().padStart(2, "0")}`,
    });
    setShowTrialModal(true);
  };

  const handleCreateTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrialMutation.mutateAsync({
        trialNumber: trialForm.trialNumber,
        trialStage: trialForm.trialStage,
        trialDate: trialForm.trialDate ? new Date(trialForm.trialDate) : new Date(),
        machineName: trialForm.machineName,
        pressTonnage: trialForm.pressTonnage,
        spmRate: trialForm.spmRate,
        bolsterHeight: trialForm.bolsterHeight,
        cushionPressure: trialForm.cushionPressure,
        sampleQty: Number(trialForm.sampleQty) || 10,
        result: trialForm.result,
        remarks: trialForm.remarks,
        defectLog: trialForm.defectLog,
        inspectorName: trialForm.inspectorName,
      });
      setShowTrialModal(false);
    } catch (err) {}
  };

  const handleOpenSignoffModal = (trial: any) => {
    setSelectedTrialForSignoff(trial);
    setSignoffForm({
      signoffBy: project?.customer?.companyName ? `${project.customer.companyName} Representative` : "Customer Quality Lead",
      remarks: "Samples approved without deviation. Tool accepted.",
    });
    setShowSignoffModal(true);
  };

  const handleConfirmSignoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrialForSignoff) return;
    try {
      await signOffMutation.mutateAsync(selectedTrialForSignoff.id);
      setShowSignoffModal(false);
      setSelectedTrialForSignoff(null);
    } catch (err) {}
  };

  const handleTriggerReworkFromTrial = (trial: any, partNameSuggestion?: string, defectSuggestion?: string) => {
    setReworkModalProps({
      partName: partNameSuggestion || `${project?.partName || "Die Component"} - Trial Correction`,
      trialId: trial.id,
      defectReason: "BURR_IN_TRIAL",
      description: defectSuggestion || trial.defectLog || `Corrective rework required following ${trial.trialNumber} (${trial.trialStage || 'T0'}) tryout observations.`,
    });
    setShowReworkModal(true);
  };

  const getStageBadge = (stage?: string) => {
    switch (stage) {
      case "T0": return { label: "T0 — Shop Tryout", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "T1": return { label: "T1 — Correction Tryout", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "T2": return { label: "T2 — Tuning Tryout", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "T3": return { label: "T3 — Sample Run", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "FINAL_BUYOFF": return { label: "Final Customer Buyoff", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      default: return { label: stage || "Press Trial", color: "bg-zinc-50 text-zinc-700 border-zinc-200" };
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case "PASS":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">Passed</span>;
      case "REWORK_REQUIRED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20">Rework Required</span>;
      case "PASSED_WITH_DEVIATION":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">Passed w/ Deviation</span>;
      case "FAIL":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20">Failed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-canvas text-mute border border-border-gray">{result || "Pending"}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Gauge className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Toolroom Press & Mold Trials Workspace</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              hasCustomerBuyoff
                ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20"
                : "bg-primary-subtle text-primary border border-primary/20"
            }`}>
              {hasCustomerBuyoff ? "Customer Buyoff Complete" : "Tryout Phase Active"}
            </span>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Log press trials (T0–T3, Final Buyoff), record machine parameters, inspect stamping defects, and trigger part rework tickets
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!isProjectClosed && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenNewTrial}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs font-semibold px-3.5 py-2 shadow-subtle"
            >
              Record Press Trial
            </Button>
          )}

          <Button
            variant="white"
            size="sm"
            onClick={() => {
              setReworkModalProps({
                partName: `${project?.partName || "Component"}`,
                sourceStage: "TRIAL",
              });
              setShowReworkModal(true);
            }}
            leftIcon={<RotateCcw className="w-4 h-4 text-amber-600" />}
            className="text-xs font-semibold px-3.5 py-2 shadow-subtle border-border-gray"
          >
            Rework A Part
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trials */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Total Trials Conducted</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalTrials}</div>
            <div className="text-[10px] text-mute mt-0.5">{passedTrials} passed or approved</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Trial Pass Yield */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Tryout Pass Yield</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{trialPassYield}%</div>
            <div className="text-[10px] text-mute mt-0.5">{passedTrials} of {totalTrials} trials passed</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Part Reworks */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Active Part Reworks</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{activeReworks.length}</div>
            <div className="text-[10px] text-mute mt-0.5">Corrective machining/fitting orders</div>
          </div>
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
            activeReworks.length > 0 ? "bg-semantic-warning-subtle text-semantic-warning-dark" : "bg-semantic-success-subtle text-semantic-success-dark"
          }`}>
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Buyoff Status */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Customer Buyoff</div>
            <div className={`text-lg font-bold mt-1 ${hasCustomerBuyoff ? "text-semantic-success-dark" : "text-amber-600"}`}>
              {hasCustomerBuyoff ? "Signed Off & Approved" : "Pending Buyoff"}
            </div>
            <div className="text-[10px] text-mute mt-0.5">{project?.customer?.companyName || "Client"} validation</div>
          </div>
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
            hasCustomerBuyoff ? "bg-semantic-success-subtle text-semantic-success-dark" : "bg-amber-50 text-amber-600"
          }`}>
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center p-1 bg-canvas rounded-[12px] border border-border-gray overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("TRIALS_REGISTER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TRIALS_REGISTER" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Gauge className="w-4 h-4 text-primary" />
          <span>Press Trial History ({trials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("PRESS_SETUP")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRESS_SETUP" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-600" />
          <span>Machine & Press Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab("DEFECT_LOGS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "DEFECT_LOGS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Sample Defects & Tryout Observations</span>
        </button>

        <button
          onClick={() => setActiveTab("PART_REWORK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PART_REWORK" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <RotateCcw className="w-4 h-4 text-red-500" />
          <span>Part Rework Hub ({reworkOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Press Trial History */}
      {activeTab === "TRIALS_REGISTER" && (
        <div className="space-y-4">
          <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
            {trials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                    <tr>
                      <th className="p-3.5">Trial # & Round</th>
                      <th className="p-3.5">Press / Machine</th>
                      <th className="p-3.5">Parameters (SPM / Tonnage)</th>
                      <th className="p-3.5 text-center">Sample Qty</th>
                      <th className="p-3.5">Result & Status</th>
                      <th className="p-3.5">Observations & Remarks</th>
                      <th className="p-3.5">Customer Buy-off</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {trials.map((trial: any) => {
                      const stageInfo = getStageBadge(trial.trialStage);
                      const reworkCount = trial.reworkOrders?.length || 0;
                      return (
                        <tr key={trial.id} className="hover:bg-canvas/50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-ink text-xs">{trial.trialNumber}</div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 ${stageInfo.color}`}>
                              {stageInfo.label}
                            </span>
                            <div className="text-[10px] text-mute mt-0.5">
                              {trial.trialDate ? formatDate(trial.trialDate) : "Recent"}
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-ink">{trial.machineName || "Press Shop Line 1"}</div>
                            <div className="text-[10px] text-mute">Inspector: {trial.inspectorName || "Tryout Lead"}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-mono font-medium text-ink">
                              {trial.pressTonnage || "150T"} | {trial.spmRate || "35"} SPM
                            </div>
                            <div className="text-[10px] text-cool-gray">
                              Bolster: {trial.bolsterHeight || "450mm"} | Cushion: {trial.cushionPressure || "4 bar"}
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className="font-mono font-semibold text-ink text-xs">{trial.sampleQty || 10}</span>
                            <span className="text-[10px] text-mute block">pcs</span>
                          </td>

                          <td className="p-3.5">
                            {getResultBadge(trial.result || trial.status)}
                            {reworkCount > 0 && (
                              <div className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                <span>{reworkCount} part rework(s)</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 max-w-[220px]">
                            <p className="text-[11px] text-ink font-medium line-clamp-2">{trial.remarks || "No remarks"}</p>
                            {trial.defectLog && (
                              <p className="text-[10px] text-semantic-warning-dark mt-0.5 line-clamp-1">
                                <strong>Defect:</strong> {trial.defectLog}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5">
                            {trial.customerSignoff ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-success-dark">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Signed Off</span>
                                </span>
                                <div className="text-[10px] text-mute mt-0.5">
                                  By: {trial.signoffBy || "Customer Lead"}
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="white"
                                size="sm"
                                onClick={() => handleOpenSignoffModal(trial)}
                                leftIcon={<FileCheck className="w-3.5 h-3.5 text-primary" />}
                                className="text-[10px] font-semibold px-2.5 py-1"
                              >
                                Sign Off
                              </Button>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="white"
                                size="sm"
                                onClick={() => handleTriggerReworkFromTrial(trial)}
                                leftIcon={<RotateCcw className="w-3 h-3 text-red-500" />}
                                className="text-[10px] font-semibold px-2.5 py-1 border-border-gray hover:border-red-300"
                              >
                                Rework Part
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center bg-canvas">
                <div className="w-12 h-12 rounded-[16px] bg-primary-subtle text-primary mx-auto flex items-center justify-center mb-3 shadow-subtle">
                  <Gauge className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-ink text-base">No Press Trials Recorded Yet</h3>
                <p className="text-xs text-mute mt-1 max-w-md mx-auto">
                  Begin tool validation by recording the initial T0 shop tryout. Capture stroke parameters, tonnage, sample inspection results, and defect logs.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenNewTrial}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="mt-4 text-xs font-semibold px-4 py-2"
                >
                  Record First Press Trial (T0)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Machine & Press Parameters */}
      {activeTab === "PRESS_SETUP" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Standard Press Setup Specification</span>
              </h3>
              <div className="space-y-2 text-xs divide-y divide-border-gray">
                <div className="pt-2 flex justify-between">
                  <span className="text-cool-gray font-medium">Recommended Press Type</span>
                  <span className="font-bold text-ink">250T – 400T Mechanical / Hydraulic Press</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-cool-gray font-medium">Operating Stroke Rate</span>
                  <span className="font-bold text-ink">30 – 45 SPM (Strokes Per Minute)</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-cool-gray font-medium">Standard Bolster / Shut Height</span>
                  <span className="font-bold text-ink">450.00 mm (Tolerance +/-0.05mm)</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-cool-gray font-medium">Hydraulic Cushion Pressure</span>
                  <span className="font-bold text-ink">4.0 – 6.0 Bar</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-cool-gray font-medium">Raw Material Grade</span>
                  <span className="font-bold text-ink">{project?.partName ? `${project.partName} Sheet Spec` : "CR4 / High Tensile Steel"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Tryout Iteration Milestones</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-canvas rounded-[10px] border border-border-gray">
                  <div className="font-bold text-ink">T0 — Initial Assembly & Dry Tryout</div>
                  <div className="text-cool-gray text-[11px] mt-0.5">Verification of shut height lock, blank alignment, and daylight clearances.</div>
                </div>
                <div className="p-3 bg-canvas rounded-[10px] border border-border-gray">
                  <div className="font-bold text-ink">T1 — Blank Forming & Corrective Machining</div>
                  <div className="text-cool-gray text-[11px] mt-0.5">First metal hit. Measure burr height, draw depth, and trigger part rework for tight punches.</div>
                </div>
                <div className="p-3 bg-canvas rounded-[10px] border border-border-gray">
                  <div className="font-bold text-ink">T2 / T3 — Customer 50-Piece Sample Run</div>
                  <div className="text-cool-gray text-[11px] mt-0.5">Continuous press cycling at nominal SPM. Final CMM dimensional buyoff.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Defect Logs & Observations */}
      {activeTab === "DEFECT_LOGS" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Stamping Defects & Tryout Observations Log</h3>
              <p className="text-xs text-mute">Defect logs captured during press trials. Directly trigger corrective part rework orders from each defect.</p>
            </div>
          </div>

          <div className="space-y-3">
            {trials.filter((t: any) => t.defectLog || t.remarks).length > 0 ? (
              trials
                .filter((t: any) => t.defectLog || t.remarks)
                .map((trial: any) => (
                  <div
                    key={trial.id}
                    className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-primary-subtle text-primary border border-primary/20">
                          {trial.trialNumber} ({trial.trialStage || "T0"})
                        </span>
                        <span className="text-xs text-mute">{trial.machineName || "Press"}</span>
                      </div>
                      <div className="text-xs font-semibold text-ink">{trial.defectLog || trial.remarks}</div>
                      <div className="text-[10px] text-cool-gray">
                        Inspector: {trial.inspectorName || "Tryout Lead"} • Date: {trial.trialDate ? formatDate(trial.trialDate) : "Recent"}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTriggerReworkFromTrial(trial, undefined, trial.defectLog)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        className="text-xs font-semibold"
                      >
                        Rework on this Part
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center bg-canvas rounded-[12px] border border-border-gray">
                <div className="text-xs text-mute">No stamping defects recorded. All trials running within tolerance.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Part Rework Hub */}
      {activeTab === "PART_REWORK" && (
        <PartReworkList
          projectId={id}
          reworkOrders={reworkOrders}
          isLoading={isReworkLoading}
          onOpenNewReworkModal={() => {
            setReworkModalProps({
              partName: `${project?.partName || "Component"}`,
              sourceStage: "TRIAL",
            });
            setShowReworkModal(true);
          }}
        />
      )}

      {/* Record Trial Modal */}
      {showTrialModal && (
        <Modal
          isOpen={showTrialModal}
          onClose={() => setShowTrialModal(false)}
          title="Record Press Trial / Tryout"
          subtitle={`Log press parameters and sample findings for ${project?.partName || "Tooling"}.`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCreateTrial} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Trial Round / Stage</label>
                <select
                  value={trialForm.trialStage}
                  onChange={(e) => setTrialForm({ ...trialForm, trialStage: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-semibold"
                >
                  <option value="T0">T0 — Initial Shop Tryout</option>
                  <option value="T1">T1 — Corrective Run</option>
                  <option value="T2">T2 — Dimensional Tuning</option>
                  <option value="T3">T3 — Customer Sample Run</option>
                  <option value="FINAL_BUYOFF">FINAL — Customer Buyoff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Trial Number</label>
                <input
                  type="text"
                  required
                  value={trialForm.trialNumber}
                  onChange={(e) => setTrialForm({ ...trialForm, trialNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Trial Date</label>
                <input
                  type="date"
                  required
                  value={trialForm.trialDate}
                  onChange={(e) => setTrialForm({ ...trialForm, trialDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Press / Machine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 250T Mechanical Press"
                  value={trialForm.machineName}
                  onChange={(e) => setTrialForm({ ...trialForm, machineName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Press Tonnage & SPM</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="250T"
                    value={trialForm.pressTonnage}
                    onChange={(e) => setTrialForm({ ...trialForm, pressTonnage: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                  />
                  <input
                    type="text"
                    placeholder="35 SPM"
                    value={trialForm.spmRate}
                    onChange={(e) => setTrialForm({ ...trialForm, spmRate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Bolster / Shut Height</label>
                <input
                  type="text"
                  placeholder="480mm"
                  value={trialForm.bolsterHeight}
                  onChange={(e) => setTrialForm({ ...trialForm, bolsterHeight: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Cushion Pressure</label>
                <input
                  type="text"
                  placeholder="4.5 bar"
                  value={trialForm.cushionPressure}
                  onChange={(e) => setTrialForm({ ...trialForm, cushionPressure: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Sample Quantity (pcs)</label>
                <input
                  type="number"
                  min="1"
                  value={trialForm.sampleQty}
                  onChange={(e) => setTrialForm({ ...trialForm, sampleQty: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Trial Result</label>
                <select
                  value={trialForm.result}
                  onChange={(e) => setTrialForm({ ...trialForm, result: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-semibold"
                >
                  <option value="PASS">PASS — Samples Meet All Specs</option>
                  <option value="REWORK_REQUIRED">REWORK REQUIRED — Tool Adjustment</option>
                  <option value="PASSED_WITH_DEVIATION">PASSED WITH DEVIATION</option>
                  <option value="FAIL">FAIL — Critical Defect</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Inspector / Tryout Lead</label>
                <input
                  type="text"
                  value={trialForm.inspectorName}
                  onChange={(e) => setTrialForm({ ...trialForm, inspectorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Defect Log / Stamping Observations</label>
              <input
                type="text"
                placeholder="e.g. Burr on edge #2 (0.04mm), punch clearance tight on right wing"
                value={trialForm.defectLog}
                onChange={(e) => setTrialForm({ ...trialForm, defectLog: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">General Tryout Remarks</label>
              <textarea
                rows={2}
                value={trialForm.remarks}
                onChange={(e) => setTrialForm({ ...trialForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-gray">
              <Button
                type="button"
                variant="white"
                size="sm"
                onClick={() => setShowTrialModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createTrialMutation.isPending}
                leftIcon={<Gauge className="w-3.5 h-3.5" />}
                className="text-xs font-semibold shadow-subtle"
              >
                Save Press Trial
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Customer Buyoff Signoff Modal */}
      {showSignoffModal && selectedTrialForSignoff && (
        <Modal
          isOpen={showSignoffModal}
          onClose={() => setShowSignoffModal(false)}
          title={`Customer Buy-off: ${selectedTrialForSignoff.trialNumber}`}
          subtitle="Record customer representative signoff and official tryout acceptance."
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmSignoff} className="space-y-4">
            <div className="bg-semantic-success-subtle border border-semantic-success/20 rounded-[10px] p-3 text-xs text-semantic-success-dark">
              Signing off will formally validate this tool trial as PASSED with Customer Buy-off approval.
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Authorized Customer Representative</label>
              <input
                type="text"
                required
                value={signoffForm.signoffBy}
                onChange={(e) => setSignoffForm({ ...signoffForm, signoffBy: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Buyoff Notes / Approval Remarks</label>
              <textarea
                rows={3}
                value={signoffForm.remarks}
                onChange={(e) => setSignoffForm({ ...signoffForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-gray">
              <Button
                type="button"
                variant="white"
                size="sm"
                onClick={() => setShowSignoffModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={signOffMutation.isPending}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="text-xs font-semibold bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white"
              >
                Confirm Customer Buy-off
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rework Modal */}
      <ReworkPartModal
        isOpen={showReworkModal}
        onClose={() => setShowReworkModal(false)}
        projectId={id}
        initialPartName={reworkModalProps.partName}
        initialPartNumber={reworkModalProps.partNumber}
        initialTrialId={reworkModalProps.trialId}
        initialSourceStage={reworkModalProps.sourceStage || "TRIAL"}
        initialDefectReason={reworkModalProps.defectReason}
        initialDescription={reworkModalProps.description}
      />
    </div>
  );
}
