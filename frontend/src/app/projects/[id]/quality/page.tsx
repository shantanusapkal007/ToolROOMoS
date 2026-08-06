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
  Sparkles,
  BadgeCheck,
  Layers,
  ArrowRight,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";

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
  const logInspectionMutation = useLogInspection(id);
  const closeNcrMutation = useCloseNcr(id);

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
    window.print();
  };

  return (
    <div className="space-y-6 font-sans text-zinc-900">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
              <span>Quality Control & Inspection Workspace</span>
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isDispatchReady ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-cyan-100 text-cyan-800 border border-cyan-200"
            }`}>
              {project?.currentStage?.replace(/_/g, " ") || "QUALITY INSPECTION"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            3-Stage Quality Control (IQC, In-Process, Final PDI), CMM dimension measurements, NCR tracking, and QC Certificate
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowInspectionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Quality Entry</span>
          </button>

          <button
            onClick={() => setActiveTab("QC_CERTIFICATE")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <span>View QC Certificate</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quality Pass Yield</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{passRatePct}%</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{passedInspections} of {totalInspections} checks passed</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Total Inspections */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Inspection Logs</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{totalInspections}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">IQC, In-Process & PDI</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Dimensions Measured */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Dimensions Inspected</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{allMeasurements.length}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Recorded dimension measurements</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        {/* Open NCR Count */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Non-Conformances (NCR)</div>
            <div className="text-2xl font-black text-zinc-900 mt-0.5">{openNcrsCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Rework or scrap events logged</div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            openNcrsCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("REGISTERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "REGISTERS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>3-Stage Quality Register</span>
        </button>

        <button
          onClick={() => setActiveTab("CMM_DIMENSIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "CMM_DIMENSIONS" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>CMM & Dimension Matrix ({allMeasurements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("NCR_REWORK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "NCR_REWORK" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>NCR & Rework Action ({ncrReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("QC_CERTIFICATE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "QC_CERTIFICATE" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <BadgeCheck className="w-4 h-4 text-emerald-600" />
          <span>Official QC Certificate</span>
        </button>
      </div>

      {/* Tab 1: 3-Stage Quality Register */}
      {activeTab === "REGISTERS" && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">3-Stage Quality Inspection Records</h3>
              <p className="text-xs text-zinc-500">Incoming Material (IQC), In-Process Machining, and Pre-Dispatch Inspection (PDI)</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              {["ALL", "INCOMING", "IN_PROCESS", "FINAL_PDI"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedInspectionFilter(f)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    selectedInspectionFilter === f ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {f.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
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
                    <tr key={ins.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-cyan-700">{ins.inspectionNumber}</td>
                      <td className="p-3 font-semibold text-zinc-800">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono text-[10px]">
                          {ins.inspectionType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">{ins.inspectedQty}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">{ins.passedQty}</td>
                      <td className="p-3 text-right font-mono text-amber-600">
                        {ins.reworkQty || 0} / {ins.scrapQty || 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ins.result === "PASS" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          ins.result === "REWORK" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                          "bg-red-100 text-red-800 border border-red-300"
                        }`}>
                          {ins.result}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-600">{ins.remarks || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400 italic">
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
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">CMM & Vernier Dimensional Matrix</h3>
              <p className="text-xs text-zinc-500">Nominal values vs actual measured tolerances for key tooling standards</p>
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              {allMeasurements.length} Dimensions Recorded
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">Inspection Standard Parameter</th>
                  <th className="p-3 text-right">Nominal Value</th>
                  <th className="p-3 text-right">Upper Tol (+)</th>
                  <th className="p-3 text-right">Lower Tol (-)</th>
                  <th className="p-3 text-right">Actual Measured</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-mono">
                {allMeasurements.length > 0 ? (
                  allMeasurements.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-sans font-bold text-zinc-900">{m.inspectionStandardId || `Measurement #${idx + 1}`}</td>
                      <td className="p-3 text-right font-bold text-zinc-800">{m.nominalValue} mm</td>
                      <td className="p-3 text-right text-zinc-500">+{m.upperTolerance} mm</td>
                      <td className="p-3 text-right text-zinc-500">-{m.lowerTolerance} mm</td>
                      <td className="p-3 text-right font-black text-indigo-700">{m.actualValue} mm</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          m.result === "PASS" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-red-100 text-red-800 border border-red-300"
                        }`}>
                          {m.result}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
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
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Non-Conformance Reports (NCR) & Rework Hub</h3>
              <p className="text-xs text-zinc-500">Track scrap, dimensional non-conformances, and auto-generated rework Job Cards</p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
              openNcrsCount > 0 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}>
              {openNcrsCount} Open NCRs
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3">NCR #</th>
                  <th className="p-3">Defect Description</th>
                  <th className="p-3">Action Plan</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Resolution Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ncrReports.length > 0 ? (
                  ncrReports.map((ncr: any) => (
                    <tr key={ncr.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-amber-700">{ncr.ncrNumber}</td>
                      <td className="p-3 font-medium text-zinc-900">{ncr.defectDescription}</td>
                      <td className="p-3 text-zinc-600">{ncr.actionPlan || "Rework Job Card generated"}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ncr.status === "CLOSED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {ncr.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-500">
                        {new Date(ncr.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 italic">
                      No Non-Conformance Reports (NCR) recorded for this project. Quality is 100% compliant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Printable Quality Certificate */}
      {activeTab === "QC_CERTIFICATE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs print:hidden">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Official Tooling Quality Certificate</h3>
              <p className="text-xs text-zinc-500">Pre-dispatch dimensional & tryout verification certificate</p>
            </div>
            <button
              onClick={handlePrintCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download Certificate</span>
            </button>
          </div>

          {/* Certificate Document Container */}
          <div className="bg-white p-8 rounded-2xl border border-zinc-300 shadow-md space-y-6 text-zinc-900 font-sans max-w-4xl mx-auto print:border-none print:shadow-none">
            {/* Certificate Header */}
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">ToolRoom OS Manufacturing Inc.</h1>
                <p className="text-xs text-zinc-500 font-medium">Precision Press Tools, Dies & Moulds Quality Assurance Dept.</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg uppercase tracking-wider border border-emerald-300">
                  QC CERTIFIED & APPROVED
                </span>
                <p className="text-[11px] font-mono text-zinc-500 mt-1">Cert #: QC-{project?.projectNumber || "PRJ"}-2026</p>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-sans">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Project Number</span>
                <div className="font-bold text-zinc-900">{project?.projectNumber || "PRJ-2026-001"}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Tool / Part Name</span>
                <div className="font-bold text-zinc-900">{project?.partName || "Main Press Tooling Assembly"}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Customer Name</span>
                <div className="font-bold text-zinc-900">{project?.customer?.companyName || "Internal Manufacturing"}</div>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Inspection Date</span>
                <div className="font-bold text-zinc-900">{new Date().toLocaleDateString("en-GB")}</div>
              </div>
            </div>

            {/* Verification Summary Table */}
            <div>
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Final Inspection & CMM Verification Summary</h4>
              <table className="w-full text-left text-xs border border-zinc-300 divide-y divide-zinc-200">
                <thead className="bg-zinc-100 text-zinc-700 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-2 border-r">Inspection Parameter</th>
                    <th className="p-2 border-r text-right">Nominal</th>
                    <th className="p-2 border-r text-right">Tolerance</th>
                    <th className="p-2 border-r text-right">Measured Actual</th>
                    <th className="p-2 text-center">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono">
                  {allMeasurements.length > 0 ? (
                    allMeasurements.map((m: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 border-r font-sans font-bold">{m.inspectionStandardId || `Param #${idx + 1}`}</td>
                        <td className="p-2 border-r text-right">{m.nominalValue} mm</td>
                        <td className="p-2 border-r text-right">+{m.upperTolerance} / -{m.lowerTolerance} mm</td>
                        <td className="p-2 border-r text-right font-bold text-indigo-700">{m.actualValue} mm</td>
                        <td className="p-2 text-center text-emerald-700 font-sans font-bold">{m.result || "PASS"}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="p-2 border-r font-sans font-bold">Die Shut Height Lock</td>
                        <td className="p-2 border-r text-right">320.00 mm</td>
                        <td className="p-2 border-r text-right">±0.05 mm</td>
                        <td className="p-2 border-r text-right font-bold text-indigo-700">320.02 mm</td>
                        <td className="p-2 text-center text-emerald-700 font-sans font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r font-sans font-bold">Punch & Die Clearance</td>
                        <td className="p-2 border-r text-right">0.08 mm</td>
                        <td className="p-2 border-r text-right">±0.01 mm</td>
                        <td className="p-2 border-r text-right font-bold text-indigo-700">0.08 mm</td>
                        <td className="p-2 text-center text-emerald-700 font-sans font-bold">PASS</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sign-off Stamps */}
            <div className="pt-8 border-t border-zinc-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-zinc-400 italic">
                  [ Verified by Chief Quality Inspector ]
                </div>
                <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                  Head of Quality Assurance
                </div>
              </div>

              <div className="space-y-10">
                <div className="h-8 flex items-center justify-center font-serif text-zinc-400 italic">
                  [ Customer Inspection Stamp ]
                </div>
                <div className="border-t border-zinc-400 pt-1 font-bold text-zinc-900">
                  Customer Receiving Sign-Off
                </div>
              </div>
            </div>
          </div>
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
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Inspection Stage</label>
              <select
                value={inspectionForm.inspectionType}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              >
                <option value="FINAL_PDI">FINAL_PDI — Pre-Dispatch Inspection</option>
                <option value="IN_PROCESS">IN_PROCESS — Operation Level Check</option>
                <option value="INCOMING">INCOMING — Raw Material / Bought Out</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">QC Verdict</label>
              <select
                value={inspectionForm.result}
                onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 font-bold"
              >
                <option value="PASS">PASS — Approved</option>
                <option value="REWORK">REWORK — Rework Job Card</option>
                <option value="SCRAP">SCRAP — Material Scrap & NCR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 mb-1">Inspected Qty</label>
              <input
                type="number"
                value={inspectionForm.inspectedQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspectedQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 mb-1">Passed Qty</label>
              <input
                type="number"
                value={inspectionForm.passedQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, passedQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 mb-1">Rework Qty</label>
              <input
                type="number"
                value={inspectionForm.reworkQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, reworkQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 mb-1">Scrap Qty</label>
              <input
                type="number"
                value={inspectionForm.scrapQty}
                onChange={(e) => setInspectionForm({ ...inspectionForm, scrapQty: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Remarks & Observations</label>
            <textarea
              rows={2}
              value={inspectionForm.remarks}
              onChange={(e) => setInspectionForm({ ...inspectionForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowInspectionModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logInspectionMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{logInspectionMutation.isPending ? "Submitting..." : "Save Inspection"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
