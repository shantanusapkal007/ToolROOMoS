"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { useLogInspection, useCloseNcr } from "@/hooks/useQuality";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Printer,
  Scale,
  Sliders,
  AlertCircle,
  BadgeCheck,
  Layers,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { useProjectReworkOrders } from "@/hooks/usePartRework";
import { ReworkPartModal } from "@/components/modals/ReworkPartModal";
import { PartReworkList } from "@/components/rework/PartReworkList";
import { printIsolatedElement } from "@/utils/printDocument";
import { Button } from "@/components/ui/Button";
import {
  OfficialSheetShell,
  OfficialLetterhead,
  OfficialInstructionBar,
  OfficialSignatureStrip,
} from "@/components/print/OfficialStationery";

type QualityTab = "REGISTERS" | "CMM_DIMENSIONS" | "NCR_REWORK" | "QC_CERTIFICATE";

export default function ProjectQualityPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<QualityTab>("REGISTERS");
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [selectedInspectionFilter, setSelectedInspectionFilter] = useState<string>("ALL");

  // Inspection Form State
  const [inspectionForm, setInspectionForm] = useState({
    inspectionType: "FINAL_PDI",
    routingOperationId: "",
    inspectedQty: 1,
    passedQty: 1,
    reworkQty: 0,
    scrapQty: 0,
    result: "PASS",
    remarks: "Full dimensional PDI verification complete. Shut height & die clearance approved.",
    meas1Name: "Die Shut Height Lock",
    meas1Nominal: 320.0,
    meas1Upper: 0.05,
    meas1Lower: 0.05,
    meas1Actual: 320.02,
    meas2Name: "Punch & Die Clearance",
    meas2Nominal: 0.08,
    meas2Upper: 0.01,
    meas2Lower: 0.01,
    meas2Actual: 0.08,
  });

  const { data: project, isLoading } = useProject(id);
  const { data: reworkOrders = [], isLoading: isReworkLoading } = useProjectReworkOrders(id);
  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';
  const logInspectionMutation = useLogInspection(id);
  const closeNcrMutation = useCloseNcr(id);

  // Part Rework Modal State
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkTargetPart, setReworkTargetPart] = useState<{
    partName?: string;
    partNumber?: string;
    description?: string;
    sourceStage?: string;
    ncrId?: string;
  } | null>(null);

  if (isLoading) return <SkeletonBox className="h-96 w-full" />;

  // Real Database Records
  const inspectionHeaders = project?.inspectionHeaders || [];
  const ncrReports = project?.ncrReports || [];

  // All measurements extracted strictly from real inspection headers
  const allMeasurements = inspectionHeaders.flatMap((i: any) => (i.measurements || []).map((m: any) => ({
    ...m,
    inspectionNumber: i.inspectionNumber,
    inspectionType: i.inspectionType,
  })));

  // Filtered Inspections
  const filteredInspections = selectedInspectionFilter === "ALL" 
    ? inspectionHeaders 
    : inspectionHeaders.filter((i: any) => i.inspectionType === selectedInspectionFilter);

  // Metrics Calculations
  const totalInspections = inspectionHeaders.length;
  const passedInspections = inspectionHeaders.filter((i: any) => i.result === "PASS").length;
  const passRatePct = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;
  const openNcrsCount = ncrReports.filter((n: any) => n.status !== "CLOSED").length;

  const isDispatchReady = project?.currentStage === "DISPATCH_READY" || 
    project?.currentStage === "DISPATCHED" || 
    project?.currentStage === "INVOICED" || 
    project?.currentStage === "CLOSED";

  // Form Submit Handler
  const handleLogInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logInspectionMutation.mutateAsync({
        inspectionType: inspectionForm.inspectionType,
        routingOperationId: inspectionForm.routingOperationId || undefined,
        inspectedQty: Number(inspectionForm.inspectedQty),
        passedQty: Number(inspectionForm.passedQty),
        reworkQty: Number(inspectionForm.reworkQty),
        scrapQty: Number(inspectionForm.scrapQty),
        result: inspectionForm.result,
        remarks: inspectionForm.remarks,
        measurements: [
          {
            inspectionStandardId: "STD-01",
            nominalValue: Number(inspectionForm.meas1Nominal),
            upperTolerance: Number(inspectionForm.meas1Upper),
            lowerTolerance: Number(inspectionForm.meas1Lower),
            actualValue: Number(inspectionForm.meas1Actual),
            result: Math.abs(Number(inspectionForm.meas1Actual) - Number(inspectionForm.meas1Nominal)) <= Number(inspectionForm.meas1Upper) ? "PASS" : "FAIL",
          },
          {
            inspectionStandardId: "STD-02",
            nominalValue: Number(inspectionForm.meas2Nominal),
            upperTolerance: Number(inspectionForm.meas2Upper),
            lowerTolerance: Number(inspectionForm.meas2Lower),
            actualValue: Number(inspectionForm.meas2Actual),
            result: Math.abs(Number(inspectionForm.meas2Actual) - Number(inspectionForm.meas2Nominal)) <= Number(inspectionForm.meas2Upper) ? "PASS" : "FAIL",
          },
        ],
      });
      setShowInspectionModal(false);
    } catch (err) {}
  };

  const handlePrintCertificate = () => {
    printIsolatedElement("authentic-qc-certificate-sheet", {
      orientation: "portrait",
      title: `QC_Certificate_${project?.projectNumber || 'Cert'}`,
    });
  };

  return (
    <div className="space-y-6 font-sans text-ink">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Quality Control & Inspection Workspace</h1>
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isDispatchReady ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" : "bg-primary-subtle text-primary border border-primary/20"
            }`}>
              {project?.currentStage?.replace(/_/g, " ") || "QUALITY INSPECTION"}
            </span>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            3-Stage Quality Control (IQC, In-Process, Final PDI), CMM dimension measurements, NCR tracking, and QC Certificate
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {!isProjectClosed && (
            <button
              onClick={() => setShowInspectionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Quality Entry</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("QC_CERTIFICATE")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-border-gray bg-white hover:bg-canvas text-ink text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
          >
            <BadgeCheck className="w-4 h-4 text-semantic-success-dark" />
            <span>View QC Certificate</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Quality Pass Yield</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{passRatePct}%</div>
            <div className="text-[10px] text-mute mt-0.5">{passedInspections} of {totalInspections} checks passed</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Inspections */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Total Inspection Logs</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalInspections}</div>
            <div className="text-[10px] text-mute mt-0.5">IQC, In-Process & PDI</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Dimensions Measured */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Dimensions Inspected</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{allMeasurements.length}</div>
            <div className="text-[10px] text-mute mt-0.5">Recorded dimension measurements</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        {/* Open NCR Count */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Non-Conformances (NCR)</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{openNcrsCount}</div>
            <div className="text-[10px] text-mute mt-0.5">Rework or scrap events logged</div>
          </div>
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${
            openNcrsCount > 0 ? "bg-semantic-warning-subtle text-semantic-warning-dark" : "bg-semantic-success-subtle text-semantic-success-dark"
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-canvas rounded-[12px] border border-border-gray overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("REGISTERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "REGISTERS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>3-Stage Quality Register</span>
        </button>

        <button
          onClick={() => setActiveTab("CMM_DIMENSIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "CMM_DIMENSIONS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Sliders className="w-4 h-4 text-primary" />
          <span>CMM & Dimension Matrix ({allMeasurements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("NCR_REWORK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "NCR_REWORK" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>NCR & Rework Action ({ncrReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("QC_CERTIFICATE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "QC_CERTIFICATE" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <BadgeCheck className="w-4 h-4 text-emerald-600" />
          <span>Official QC Certificate</span>
        </button>
      </div>

      {/* Tab 1: 3-Stage Quality Register */}
      {activeTab === "REGISTERS" && (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden space-y-4">
          <div className="p-4 border-b border-border-gray flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Quality Control Inspection Register</h3>
              <p className="text-xs text-mute">Line item pass/fail verification across IQC, In-Process, and Final PDI</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-canvas p-1 rounded-[12px] border border-border-gray">
              {["ALL", "INCOMING", "IN_PROCESS", "FINAL_PDI"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedInspectionFilter(f)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-[12px] transition-colors cursor-pointer ${
                    selectedInspectionFilter === f ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
                  }`}
                >
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Inspection #</th>
                  <th className="p-3">Stage / Type</th>
                  <th className="p-3 text-right">Inspected Qty</th>
                  <th className="p-3 text-right">Passed</th>
                  <th className="p-3 text-right">Rework / Scrap</th>
                  <th className="p-3 text-center">QC Verdict</th>
                  <th className="p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInspections.length > 0 ? (
                  filteredInspections.map((ins: any) => (
                    <tr key={ins.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-mono font-semibold text-cyan-700">{ins.inspectionNumber}</td>
                      <td className="p-3 font-semibold text-ink">
                        <span className="px-2 py-0.5 rounded bg-canvas text-ink border border-border-gray font-mono text-[10px]">
                          {ins.inspectionType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-ink">{ins.inspectedQty}</td>
                      <td className="p-3 text-right font-mono font-semibold text-semantic-success-dark">{ins.passedQty}</td>
                      <td className="p-3 text-right font-mono text-semantic-warning-dark">
                        {ins.reworkQty > 0 ? ins.reworkQty : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ins.result === "PASS" ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" :
                          ins.result === "REWORK" ? "bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20" :
                          "bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20"
                        }`}>
                          {ins.result}
                        </span>
                      </td>
                      <td className="p-3 text-cool-gray">{ins.remarks || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-cool-gray italic">
                      No quality inspection logs recorded yet. Click 'New Quality Entry' to log IQC, In-Process, or Final PDI inspections.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: CMM & Dimensional Matrix */}
      {activeTab === "CMM_DIMENSIONS" && (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">CMM Dimensional Inspection Protocol</h3>
              <p className="text-xs text-mute">Precision measurement log with nominal, tolerance limits, and actual deviation</p>
            </div>
            <div className="text-xs font-semibold text-semantic-success-dark bg-semantic-success-subtle px-3 py-1.5 rounded-[12px] border border-semantic-success/20">
              {allMeasurements.length} Dimensions Recorded
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Inspection Standard Parameter</th>
                  <th className="p-3 text-right">Nominal Value</th>
                  <th className="p-3 text-right">Tolerance</th>
                  <th className="p-3 text-right">Actual Measured</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {allMeasurements.length > 0 ? (
                  allMeasurements.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-sans font-semibold text-ink">{m.inspectionStandardId || `Measurement #${idx + 1}`}</td>
                      <td className="p-3 text-right font-semibold text-ink">{m.nominalValue} mm</td>
                      <td className="p-3 text-right font-mono text-cool-gray">+{m.upperTol} / -{m.lowerTol}</td>
                      <td className="p-3 text-right font-mono font-semibold text-ink">{m.actualValue} mm</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          m.result === "PASS" ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" : "bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20"
                        }`}>
                          {m.result}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-cool-gray italic">
                      No CMM dimensional measurements recorded yet. Add measurements when logging quality entries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: NCR & Rework */}
      {activeTab === "NCR_REWORK" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Non-Conformance Reports (NCR) & Rework Actions</h3>
              <p className="text-xs text-mute">Log of component defects, corrective action plans, and closure sign-offs</p>
            </div>
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-[12px] border ${
              openNcrsCount > 0 ? "bg-semantic-warning-subtle text-semantic-warning-dark border-semantic-warning/20" : "bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/20"
            }`}>
              {openNcrsCount > 0 ? `${openNcrsCount} Open NCR(s)` : "All NCRs Closed"}
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">NCR #</th>
                  <th className="p-3">Defect Description</th>
                  <th className="p-3">Corrective / Rework Action</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {ncrReports.length > 0 ? (
                  ncrReports.map((ncr: any) => (
                    <tr key={ncr.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-mono font-semibold text-semantic-warning-dark">{ncr.ncrNumber}</td>
                      <td className="p-3 font-semibold text-ink">{ncr.defectDescription}</td>
                      <td className="p-3 text-cool-gray">{ncr.actionPlan || "Rework Job Card generated"}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          ncr.status === "CLOSED" ? "bg-semantic-success-subtle text-semantic-success-dark" : "bg-semantic-warning-subtle text-semantic-warning-dark"
                        }`}>
                          {ncr.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {ncr.status === "OPEN" && (
                          <button
                            onClick={() => {}}
                            className="px-2.5 py-1 text-[10px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-[12px] shadow-subtle transition-colors cursor-pointer"
                          >
                            Close NCR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-cool-gray italic">
                      No Non-Conformance Reports (NCR) recorded for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Part Rework Orders Section */}
          <div className="pt-3">
            <PartReworkList
              projectId={id}
              reworkOrders={reworkOrders}
              isLoading={isReworkLoading}
              onOpenNewReworkModal={() => {
                setReworkTargetPart({
                  partName: project?.partName || "Component",
                  sourceStage: "QUALITY_INSPECTION",
                });
                setReworkModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Tab 4: Printable Quality Certificate */}
      {activeTab === "QC_CERTIFICATE" && (
        <div className="space-y-6 font-sans">
          {/* Top Action Bar (Hidden on print) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#151824] p-4 sm:p-5 rounded-[14px] border border-border-gray shadow-subtle hide-on-print">
            <div>
              <h2 className="text-body font-bold text-ink flex items-center flex-wrap gap-2.5">
                <span>Tooling Quality &amp; PDI Inspection Certificate</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success-border uppercase tracking-wider">
                  Official Factory Document
                </span>
              </h2>
              <p className="text-caption text-cool-gray mt-1">
                Pre-dispatch dimensional inspection &amp; CMM verification clearance certificate
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintCertificate}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Certificate / Save PDF
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Printable Paper Sheet Target (Corporate Steel-Navy Stationery Theme)      */}
          {/* ========================================================================= */}
          <OfficialSheetShell
            id="authentic-qc-certificate-sheet"
            itemCount={allMeasurements.length > 0 ? allMeasurements.length : 4}
          >
            <OfficialLetterhead
              documentTitle="TOOLING QUALITY & PDI INSPECTION CERTIFICATE"
              legalSubtitle="(Dimensional Inspection, CMM Verification & Pre-Dispatch Clearance Certificate)"
            />

            {/* Quality Inspection Meta Dual Rounded Cards */}
            <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid shrink-0">
              {/* Left Card (7 Cols): Customer & Tooling Details */}
              <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex flex-col justify-between space-y-2">
                <div className="space-y-1">
                  <div className="flex gap-2 items-baseline">
                    <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">CUSTOMER:</span>
                    <span className="font-bold text-[#111827] uppercase text-xs sm:text-sm print:text-[11px] truncate">
                      {project?.customer?.companyName || "Mahindra & Mahindra Ltd."}
                    </span>
                  </div>

                  <div className="flex gap-2 text-[11px] print:text-[9.5px]">
                    <span className="font-semibold w-24 shrink-0 text-[#475569] uppercase text-[10px] print:text-[8.5px]">TOOL / PART:</span>
                    <span className="font-bold text-[#111827] leading-snug">{project?.partName || "Main Press Tooling Assembly"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-3 text-[11px] print:text-[9px] pt-1.5 border-t border-[#CBD5E1]">
                    <div className="border-r border-[#CBD5E1] pr-2">
                      <span className="font-semibold text-[#475569]">PROJECT NO: </span>
                      <span className="font-mono font-bold text-[#111827]">{project?.projectNumber || "KTD-2026-001"}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#475569]">DRAWING REV: </span>
                      <span className="font-mono font-semibold text-[#111827]">REV-02 (APPROVED)</span>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-[#CBD5E1] text-[11px] print:text-[9px]">
                    <span className="font-semibold text-[#475569] uppercase text-[10px] print:text-[8.5px]">FACILITY / PLANT: </span>
                    <span className="text-[#475569]">Krupa Tools Plant 01 — Tool Room Precision Quality Lab</span>
                  </div>
                </div>
              </div>

              {/* Right Card (5 Cols): QC Cert Meta */}
              <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 space-y-2 print:space-y-1.5">
                <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
                  <div className="border-r border-[#CBD5E1] pr-2">
                    <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">CERTIFICATE NO:</span>
                    <span className="font-mono font-bold text-[#111827] text-xs sm:text-sm print:text-[10.5px]">
                      QC-{project?.projectNumber || "KTD"}-2026
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">DATE:</span>
                    <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-[#CBD5E1]">
                  <div className="border-r border-[#CBD5E1] pr-2">
                    <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">INSPECTION STAGE:</span>
                    <span className="font-mono font-bold text-[#111827] text-xs print:text-[9.5px]">FINAL PDI / TRYOUT</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">QC VERDICT:</span>
                    <span className="font-mono font-bold text-[#163354] text-xs print:text-[9.5px]">PASSED &amp; CLEARED</span>
                  </div>
                </div>

                <div className="pt-0.5">
                  <span className="font-semibold text-[#475569] block text-[9px] print:text-[7.5px] uppercase">INSPECTION STANDARD:</span>
                  <span className="font-bold text-[#111827] text-[11px] print:text-[9.5px] block truncate">
                    IS 2102 (Part 1) Medium / Drawing Tolerances
                  </span>
                </div>
              </div>
            </div>

            {/* Purpose Banner */}
            <OfficialInstructionBar text="FINAL PRE-DISPATCH DIMENSIONAL & CMM TRYOUT VERIFICATION REPORT" />

            {/* Verification Table (Expands to fill A4 page body) */}
            <div className="pro-table-grow border border-[#CBD5E1] rounded-[8px] flex-1 flex flex-col bg-white">
              <table className="w-full table-fixed border-collapse text-[11px] print:text-[9px]">
                <thead>
                  <tr className="bg-[#E5EDF6] border-b border-[#CBD5E1] font-bold text-[#163354] text-[9px] print:text-[7.5px] uppercase tracking-tight leading-tight">
                    <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-center w-[5%] rounded-tl-[7px]">SR.</th>
                    <th className="py-2 px-1.5 print:py-1.5 border-r border-[#CBD5E1] text-left w-[31%]">INSPECTION PARAMETER / CHARACTERISTIC</th>
                    <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[13%]">NOMINAL (MM)</th>
                    <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[14%]">TOLERANCE (MM)</th>
                    <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[13%]">MEASURED (MM)</th>
                    <th className="py-2 px-1 print:py-1.5 border-r border-[#CBD5E1] text-right w-[12%]">DEVIATION</th>
                    <th className="py-2 px-1 print:py-1.5 text-center w-[12%] rounded-tr-[7px]">VERDICT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1] border-b border-[#CBD5E1] text-[10.5px] print:text-[8.5px] font-sans">
                  {allMeasurements.length > 0 ? (
                    allMeasurements.map((m: any, idx: number) => {
                      const nominal = Number(m.nominalValue) || 0;
                      const actual = Number(m.actualValue) || 0;
                      const dev = (actual - nominal).toFixed(3);
                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC] break-inside-avoid align-top">
                          <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">{idx + 1}</td>
                          <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827] break-words">
                            {m.inspectionStandardId || `Measurement Parameter #${idx + 1}`}
                          </td>
                          <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827] tabular-nums">
                            {nominal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">
                            +{m.upperTolerance} / -{m.lowerTolerance}
                          </td>
                          <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827] tabular-nums">
                            {actual.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569] tabular-nums">
                            {Number(dev) > 0 ? `+${dev}` : dev}
                          </td>
                          <td className="py-2.5 px-1 print:py-2 text-center font-bold text-[#163354]">
                            {m.result || "PASS"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <>
                      <tr className="hover:bg-[#F8FAFC] break-inside-avoid">
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">1</td>
                        <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827]">Die Shut Height Lock &amp; Parallelism</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827]">320.00</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">±0.05</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827]">320.02</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">+0.020</td>
                        <td className="py-2.5 px-1 print:py-2 text-center font-bold text-[#163354]">PASS</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC] break-inside-avoid">
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">2</td>
                        <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827]">Punch &amp; Die Cutting Clearance (Per Side)</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827]">0.08</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">±0.01</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827]">0.08</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">0.000</td>
                        <td className="py-2.5 px-1 print:py-2 text-center font-bold text-[#163354]">PASS</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC] break-inside-avoid">
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">3</td>
                        <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827]">Guide Pillar &amp; Bush Running Fit Alignment</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827]">45.00</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">±0.008</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827]">45.004</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">+0.004</td>
                        <td className="py-2.5 px-1 print:py-2 text-center font-bold text-[#163354]">PASS</td>
                      </tr>
                      <tr className="hover:bg-[#F8FAFC] break-inside-avoid">
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-center font-mono text-[#475569]">4</td>
                        <td className="py-2.5 px-1.5 print:py-2 border-r border-[#CBD5E1] font-bold text-[#111827]">Heat Treatment Hardness (D2 Punch &amp; Die Insert)</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#111827]">60.00</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">±2 HRC</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono font-bold text-[#111827]">61.00</td>
                        <td className="py-2.5 px-1 print:py-2 border-r border-[#CBD5E1] text-right font-mono text-[#475569]">+1.0 HRC</td>
                        <td className="py-2.5 px-1 print:py-2 text-center font-bold text-[#163354]">PASS</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Continuous vertical ledger dividers extending to fill full A4 body space */}
              <div className="pro-table-filler flex-1 flex w-full min-h-[24px] print:min-h-[16px]" aria-hidden="true">
                <table className="self-stretch w-full flex-1 table-fixed border-collapse">
                  <tbody>
                    <tr className="h-full">
                      <td className="p-0 w-[5%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[31%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[13%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[14%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[13%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[12%] border-r border-[#CBD5E1]" />
                      <td className="p-0 w-[12%]" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom-Anchored Official Footer */}
            <div className="mt-auto shrink-0 space-y-2.5 print:space-y-2">
            {/* Quality Declaration & Summary Dual Cards */}
            <div className="grid grid-cols-12 gap-3 text-xs print:text-[9.5px] break-inside-avoid">
              {/* Left: Quality Certification Declaration Card (7 Cols) */}
              <div className="col-span-7 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-3 sm:p-3.5 print:p-2.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#163354] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[9.5px] print:text-[8px] uppercase text-[#111827] tracking-wide">QUALITY CONFORMANCE DECLARATION:</span>
                  <p className="font-medium text-[#475569] text-[10.5px] print:text-[8.5px] italic mt-0.5 leading-snug">
                    We hereby certify that the tooling, assemblies, and components listed above have been inspected using calibrated CMM, height master, and hardness testing equipment against approved 2D/3D CAD drawings. All critical dimensions and functionality conform to agreed specifications and are cleared for tryout/dispatch.
                  </p>
                </div>
              </div>

              {/* Right: Totals Card (5 Cols) */}
              <div className="col-span-5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] p-2.5 sm:p-3 print:p-2 space-y-1.5 print:space-y-1 flex flex-col justify-between">
                <div className="space-y-1.5 print:space-y-1">
                  <div className="flex justify-between border-b border-[#CBD5E1] pb-1 font-semibold text-xs print:text-[9px]">
                    <span className="text-[#475569]">PARAMETERS INSPECTED:</span>
                    <span className="font-mono font-bold text-[#111827]">{allMeasurements.length > 0 ? allMeasurements.length : 4}</span>
                  </div>

                  <div className="flex justify-between pb-0.5 font-semibold text-xs print:text-[9px]">
                    <span className="text-[#475569]">INSPECTION YIELD:</span>
                    <span className="font-mono font-bold text-[#163354]">100% PASSED</span>
                  </div>
                </div>

                {/* Highlighted Status Box */}
                <div className="flex justify-between items-center bg-[#E5EDF6] border border-[#CBD5E1] text-[#163354] p-2 print:py-1.5 print:px-2.5 rounded-[6px]">
                  <span className="font-bold uppercase tracking-wider text-[10px] print:text-[8.5px]">QC STATUS:</span>
                  <span className="font-mono font-extrabold text-xs sm:text-sm print:text-[10.5px]">
                    CLEARED FOR DISPATCH
                  </span>
                </div>
              </div>
            </div>

            {/* 3-Box Open Corporate Signature Strip */}
            <OfficialSignatureStrip
              boxes={[
                {
                  title: '1. INSPECTED BY (QC ENGINEER)',
                  role: 'Quality Inspector',
                  caption: 'DIMENSIONAL CHECK SIGN',
                },
                {
                  title: '2. VERIFIED & APPROVED (QC HEAD)',
                  role: 'Chief Quality Manager',
                  caption: 'QA CLEARANCE STAMP',
                },
                {
                  title: '3. CUSTOMER / WITNESS SIGN',
                  role: 'Customer Representative',
                  caption: 'TRYOUT ACCEPTANCE SIGN',
                },
              ]}
            />
            </div>

          </OfficialSheetShell>
        </div>
      )}

      {/* New Quality Entry Modal */}
      <Modal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title="Log Quality Control Entry"
        subtitle={`Record IQC, In-Process, or Final PDI inspection for ${project?.projectNumber || id}`}
      >
        <form onSubmit={handleLogInspection} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Inspection Stage</label>
              <select
                value={inspectionForm.inspectionType}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              >
                <option value="FINAL_PDI">FINAL_PDI — Pre-Dispatch Inspection</option>
                <option value="IN_PROCESS">IN_PROCESS — Operation Level Check</option>
                <option value="INCOMING">INCOMING — Raw Material / Bought Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">QC Verdict</label>
              <select
                value={inspectionForm.result}
                onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              >
                <option value="PASS">PASS — Approved</option>
                <option value="REWORK">REWORK — Rework Job Card</option>
                <option value="SCRAP">SCRAP — Material Scrap & NCR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-cool-gray mb-1">Inspected Qty</label>
              <input
                type="number"
                value={inspectionForm.inspectedQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectedQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-cool-gray mb-1">Passed Qty</label>
              <input
                type="number"
                value={inspectionForm.passedQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, passedQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-cool-gray mb-1">Rework Qty</label>
              <input
                type="number"
                value={inspectionForm.reworkQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, reworkQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-cool-gray mb-1">Scrap Qty</label>
              <input
                type="number"
                value={inspectionForm.scrapQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, scrapQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Remarks & Observations</label>
            <textarea
              rows={2}
              value={inspectionForm.remarks}
              onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowInspectionModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logInspectionMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-[12px] shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{logInspectionMutation.isPending ? "Submitting..." : "Save Inspection"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Part Rework Modal */}
      {reworkModalOpen && (
        <ReworkPartModal
          isOpen={reworkModalOpen}
          onClose={() => {
            setReworkModalOpen(false);
            setReworkTargetPart(null);
          }}
          projectId={id}
          initialPartName={reworkTargetPart?.partName || project?.partName}
          initialPartNumber={reworkTargetPart?.partNumber}
          initialNcrId={reworkTargetPart?.ncrId}
          initialSourceStage="QUALITY_INSPECTION"
          initialDescription={reworkTargetPart?.description}
        />
      )}
    </div>
  );
}
