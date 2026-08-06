"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGlobalDailyReports } from "@/hooks/useDailyReports";
import { useProject, useCompleteProduction } from "@/hooks/useProjects";
import {
  Wrench,
  Cpu,
  Factory,
  Flame,
  Truck,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

import { ToolroomSection } from "@/components/production/sections/ToolroomSection";
import { PressShopSection } from "@/components/production/sections/PressShopSection";
import { FabricationSection } from "@/components/production/sections/FabricationSection";
import { FabExportSection } from "@/components/production/sections/FabExportSection";
import { TransfersSection } from "@/components/production/sections/TransfersSection";
import { MoveToNextSectionModal } from "@/components/production/MoveToNextSectionModal";

type ProductionTab = "TOOLROOM" | "PRESS_SHOP" | "FABRICATION" | "FAB_EXPORT" | "TRANSFERS";

const TABS: { id: ProductionTab; label: string; icon: React.ElementType; activeColor: string }[] = [
  { id: "TOOLROOM", label: "Toolroom", icon: Cpu, activeColor: "bg-purple-600 text-white shadow-xs" },
  { id: "PRESS_SHOP", label: "Press Shop", icon: Factory, activeColor: "bg-amber-600 text-white shadow-xs" },
  { id: "FABRICATION", label: "Fabrication", icon: Flame, activeColor: "bg-blue-600 text-white shadow-xs" },
  { id: "FAB_EXPORT", label: "Fab Export", icon: Truck, activeColor: "bg-indigo-600 text-white shadow-xs" },
  { id: "TRANSFERS", label: "Transfers", icon: RefreshCw, activeColor: "bg-zinc-900 text-white shadow-xs" },
];

export default function ProjectProductionPage() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState<ProductionTab>("TOOLROOM");

  // "Complete → Move" modal state
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<any>(null);
  const [moveCurrentSection, setMoveCurrentSection] = useState<string>("");

  // Fetch ALL MSDR logs for this project (all sections)
  const { data: msdrsResponse, isLoading } = useGlobalDailyReports({
    projectId: id,
    type: "MSDR",
  });

  const { data: project } = useProject(id);

  const extractMSDRs = (res: any) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const allMsdrs = extractMSDRs(msdrsResponse);

  // Extract all Material Issues assigned to this project
  const allMaterialIssues = (project?.materialIssueHeaders || []).flatMap((header: any) => {
    return (header.items || []).map((item: any) => ({
      id: item.id || `${header.id}-${item.inventoryBatchId}`,
      issueNumber: header.issueNumber,
      section: header.productionSection,
      materialName: item.inventoryBatch?.material?.materialName || item.inventoryBatch?.material?.materialGrade || 'Raw Material',
      batchNumber: item.inventoryBatch?.batchNumber || '-',
      heatNumber: item.inventoryBatch?.heatNumber || '-',
      issuedQty: Number(item.issuedQty || 0),
      date: new Date(header.createdAt).toLocaleDateString('en-GB'),
      remarks: item.remarks || header.remarks || '-',
    }));
  });

  // Section counts for tab badges (MSDRs + Issued Materials)
  const toolroomCount = allMsdrs.filter(
    (m: any) => m.section === "MACHINE_SHOP" || m.section === "TOOL_ROOM_FITTING" || !m.section
  ).length + allMaterialIssues.filter(
    (m: any) => m.section === "MACHINE_SHOP" || m.section === "TOOL_ROOM_FITTING" || !m.section
  ).length;

  const pressCount = allMsdrs.filter((m: any) => m.section === "PRESS_SHOP").length +
    allMaterialIssues.filter((m: any) => m.section === "PRESS_SHOP").length;

  const fabCount = allMsdrs.filter(
    (m: any) => m.section === "FABRICATION_INDIAN" || m.section === "FABRICATION"
  ).length + allMaterialIssues.filter(
    (m: any) => m.section === "FABRICATION_INDIAN" || m.section === "FABRICATION"
  ).length;

  const fabExportCount = allMsdrs.filter((m: any) => m.section === "FABRICATION_EXPORT").length +
    allMaterialIssues.filter((m: any) => m.section === "FABRICATION_EXPORT").length;

  const tabCounts: Record<ProductionTab, number> = {
    TOOLROOM: toolroomCount,
    PRESS_SHOP: pressCount,
    FABRICATION: fabCount,
    FAB_EXPORT: fabExportCount,
    TRANSFERS: 0,
  };

  // Resolve currentSection for the move modal
  const getSectionKey = (tab: ProductionTab): string => {
    switch (tab) {
      case "TOOLROOM": return "MACHINE_SHOP";
      case "PRESS_SHOP": return "PRESS_SHOP";
      case "FABRICATION": return "FABRICATION_INDIAN";
      case "FAB_EXPORT": return "FABRICATION_EXPORT";
      default: return "MACHINE_SHOP";
    }
  };

  const handleMarkComplete = (item: any) => {
    setMoveItem(item);
    setMoveCurrentSection(item.section || getSectionKey(activeTab));
    setMoveModalOpen(true);
  };

  // Complete Production Phase state & mutation
  const completeProductionMutation = useCompleteProduction(id);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState("");

  const isProductionCompleted = project?.currentStage === "INSPECTION" || 
    project?.currentStage === "DISPATCH_READY" || 
    project?.currentStage === "DISPATCHED" || 
    project?.currentStage === "INVOICED" || 
    project?.currentStage === "CLOSED";

  const handleConfirmCompleteProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await completeProductionMutation.mutateAsync(completionRemarks);
      setShowCompleteConfirmModal(false);
      setCompletionRemarks("");
    } catch (err) {}
  };

  if (isLoading) {
    return <SkeletonBox className="h-96 w-full" />;
  }

  return (
    <div className="space-y-5 font-sans text-zinc-900">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-zinc-900" />
            <span>Production Workspace</span>
          </h2>
          <p className="text-xs text-zinc-500">
            All shopfloor operations sourced from Employee Daily Reports — Toolroom, Press Shop, Fabrication & Export
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isProductionCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Production Completed ({project?.currentStage?.replace(/_/g, ' ')})</span>
            </div>
          ) : (
            <button
              onClick={() => setShowCompleteConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Mark Production Completed</span>
            </button>
          )}

          <Link
            href="/employee-daily-report"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Log Daily Report</span>
          </Link>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 overflow-x-auto gap-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive ? tab.activeColor : "text-zinc-500 hover:text-zinc-900 hover:bg-white/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0 rounded-full text-[10px] font-extrabold ${
                    isActive ? "bg-white/25 text-white" : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Section Content — data sourced from Daily Reports & Issued Materials */}
      {activeTab === "TOOLROOM" && (
        <ToolroomSection data={allMsdrs} materialIssues={allMaterialIssues} isLoading={isLoading} onMarkComplete={handleMarkComplete} />
      )}
      {activeTab === "PRESS_SHOP" && (
        <PressShopSection data={allMsdrs} materialIssues={allMaterialIssues} isLoading={isLoading} onMarkComplete={handleMarkComplete} />
      )}
      {activeTab === "FABRICATION" && (
        <FabricationSection data={allMsdrs} materialIssues={allMaterialIssues} isLoading={isLoading} onMarkComplete={handleMarkComplete} />
      )}
      {activeTab === "FAB_EXPORT" && (
        <FabExportSection data={allMsdrs} materialIssues={allMaterialIssues} isLoading={isLoading} onMarkComplete={handleMarkComplete} />
      )}
      {activeTab === "TRANSFERS" && (
        <TransfersSection projectCode={project?.projectNumber || id} />
      )}

      {/* Move to Next Section Modal */}
      <MoveToNextSectionModal
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false);
          setMoveItem(null);
        }}
        item={moveItem}
        currentSection={moveCurrentSection}
        projectCode={project?.projectNumber || id}
      />

      {/* Mark Production Completed Confirmation Modal */}
      <Modal
        isOpen={showCompleteConfirmModal}
        onClose={() => setShowCompleteConfirmModal(false)}
        title="Complete Production Phase"
        subtitle={`Mark production phase as finished for ${project?.projectNumber || id} based on shopfloor daily reports.`}
      >
        <form onSubmit={handleConfirmCompleteProduction} className="space-y-4 font-sans">
          <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Production Stage Milestone</span>
            </div>
            <p className="text-emerald-800">
              This action will mark the production phase as <strong>COMPLETED</strong> ({allMsdrs.length} daily report log(s) recorded) and advance project <strong>{project?.projectNumber}</strong> from <strong>{project?.currentStage}</strong> to the <strong>QUALITY INSPECTION</strong> stage.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Completion Remarks / Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. All machining, fitting & shopfloor trials completed successfully. Ready for quality inspection."
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={() => setShowCompleteConfirmModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeProductionMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{completeProductionMutation.isPending ? "Submitting..." : "Confirm & Complete Production"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
