"use client";

import React, { useState, useMemo } from "react";
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
  ArrowRight,
  RotateCcw,
  ExternalLink,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Box,
} from "lucide-react";
import Link from "next/link";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { Modal } from "@/components/ui/Modal";
import { ReworkPartModal } from "@/components/modals/ReworkPartModal";

type AssemblyTab = "PRODUCT_TREE" | "KITTING" | "SUB_ASSEMBLIES" | "TRIALS" | "FITTER_LOGS";

// --- Product Tree Types & Helpers ---
interface AssemblyTreeNode {
  item: any;
  children: AssemblyTreeNode[];
  level: number;
}

function buildAssemblyTree(items: any[]): AssemblyTreeNode[] {
  if (!items || items.length === 0) return [];

  // Try parentItemId-based hierarchy first (DB-level)
  const hasParentIds = items.some((item: any) => item.parentItemId);

  if (hasParentIds) {
    const nodeMap = new Map<string, AssemblyTreeNode>();
    const roots: AssemblyTreeNode[] = [];

    items.forEach((item: any) => {
      nodeMap.set(item.id, { item, children: [], level: 0 });
    });

    items.forEach((item: any) => {
      const node = nodeMap.get(item.id)!;
      if (item.parentItemId && nodeMap.has(item.parentItemId)) {
        const parent = nodeMap.get(item.parentItemId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  // Fallback: srNo dot-notation hierarchy (1, 1.1, 1.1.1)
  const nodes: AssemblyTreeNode[] = items.map((item: any) => ({
    item,
    children: [],
    level: 0,
  }));

  const nodeMap = new Map<string, AssemblyTreeNode>();
  nodes.forEach((node) => {
    const srNo = String(node.item.srNo || node.item.id || "").trim();
    nodeMap.set(srNo, node);
  });

  const roots: AssemblyTreeNode[] = [];
  nodes.forEach((node) => {
    const srNo = String(node.item.srNo || node.item.id || "").trim();
    const dotIndex = srNo.lastIndexOf(".");
    if (dotIndex === -1) {
      node.level = 0;
      roots.push(node);
    } else {
      const parentSrNo = srNo.substring(0, dotIndex);
      const parent = nodeMap.get(parentSrNo);
      if (parent) {
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        node.level = 0;
        roots.push(node);
      }
    }
  });

  return roots;
}

function flattenTree(
  nodes: AssemblyTreeNode[],
  expanded: Record<string, boolean>
): { node: AssemblyTreeNode; isVisible: boolean }[] {
  const list: { node: AssemblyTreeNode; isVisible: boolean }[] = [];
  const recurse = (nodeList: AssemblyTreeNode[], parentVisible: boolean) => {
    nodeList.forEach((node) => {
      list.push({ node, isVisible: parentVisible });
      const key = node.item.id || String(node.item.srNo || "").trim();
      const isExpanded = expanded[key] !== false; // default expanded
      recurse(node.children, parentVisible && isExpanded);
    });
  };
  recurse(nodes, true);
  return list;
}

export default function ProjectAssemblyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<AssemblyTab>("PRODUCT_TREE");

  // Product Tree state
  const [treeExpandedNodes, setTreeExpandedNodes] = useState<Record<string, boolean>>({});
  const [treeViewMode, setTreeViewMode] = useState<'tree' | 'flat'>('tree');

  // Part Rework Modal State
  const [reworkModalOpen, setReworkModalOpen] = useState(false);
  const [reworkTargetPart, setReworkTargetPart] = useState<{
    partName?: string;
    partNumber?: string;
    description?: string;
  } | null>(null);

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
  const { data: msdrsResponse } = useGlobalDailyReports({ projectId: id, type: "MSDR" });

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

  const rawLogs = extractMSDRs(msdrsResponse);
  const fittingMsdrLogs = rawLogs.filter((log: any) => 
    !log.section || 
    log.section === "TOOL_ROOM_FITTING" || 
    log.section === "ASSEMBLY_SHOP" || 
    log.section === "ASSEMBLY" ||
    log.section === "TOOL_ROOM_FITTING_SHOP" ||
    log.section === "ALL"
  );

  if (isProjectLoading) return <SkeletonBox className="h-96 w-full" />;

  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

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
    <div className="space-y-6 font-sans text-ink">
      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">Toolroom Assembly & Tryout Workspace</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              isAssemblyCompleted ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" : "bg-primary-subtle text-primary border border-primary/20"
            }`}>
              {project?.currentStage?.replace(/_/g, " ") || "ASSEMBLY & FITTING"}
            </span>
          </div>
          <p className="text-xs text-mute mt-1 ml-[42px]">
            BOM component kitting verification, sub-assembly work orders, press tryouts (T0/T1/T2), and fitter time logs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowTrialModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
          >
            <Gauge className="w-4 h-4" />
            <span>Record Press Trial</span>
          </button>

          {isAssemblyCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-semantic-success-subtle border border-semantic-success/20 text-semantic-success-dark text-xs font-semibold shadow-subtle">
              <CheckCircle2 className="w-4 h-4 text-semantic-success-dark" />
              <span>Handed Over to Quality</span>
            </div>
          ) : (
            <button
              onClick={() => setShowHandoverModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
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
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Kitting Readiness</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{kittingReadinessPct}%</div>
            <div className="text-[10px] text-mute mt-0.5">{issuedMaterialsCount} of {totalBomItems} components in store</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Active Sub-Assemblies */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Sub-Assemblies</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{assemblyOrders.length}</div>
            <div className="text-[10px] text-mute mt-0.5">Sub-assembly work orders</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Trial Success Rate */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Press Tryout Pass Rate</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{trialSuccessRate}%</div>
            <div className="text-[10px] text-mute mt-0.5">{trials.length} total tryout runs logged</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Fitter Hours */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Fitter Hours Logged</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalFitterHours.toFixed(1)} hrs</div>
            <div className="text-[10px] text-mute mt-0.5">Toolroom fitting & bedding logs</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-semantic-warning-subtle flex items-center justify-center text-semantic-warning-dark">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center p-1 bg-canvas rounded-[12px] border border-border-gray overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("PRODUCT_TREE")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRODUCT_TREE" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <GitBranch className="w-4 h-4 text-indigo-600" />
          <span>Product Tree</span>
        </button>

        <button
          onClick={() => setActiveTab("KITTING")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "KITTING" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <CheckSquare className="w-4 h-4 text-purple-600" />
          <span>BOM Kitting Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab("SUB_ASSEMBLIES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SUB_ASSEMBLIES" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Layers className="w-4 h-4 text-primary" />
          <span>Sub-Assemblies ({assemblyOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TRIALS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TRIALS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Gauge className="w-4 h-4 text-emerald-600" />
          <span>Press Tryout Log (T0/T1/T2)</span>
        </button>

        <button
          onClick={() => setActiveTab("FITTER_LOGS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "FITTER_LOGS" ? "bg-white text-ink shadow-subtle" : "text-mute hover:text-ink"
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Fitter Daily Reports</span>
        </button>
      </div>

      {/* Tab 0: Product Tree */}
      {activeTab === "PRODUCT_TREE" && (() => {
        const tree = buildAssemblyTree(bomItems);
        const flatNodes = flattenTree(tree, treeExpandedNodes);
        const visibleNodes = flatNodes.filter((n) => n.isVisible);

        const toggleExpanded = (key: string) => {
          setTreeExpandedNodes((prev) => ({
            ...prev,
            [key]: prev[key] === false ? true : false,
          }));
        };

        const collapseAll = () => {
          const collapsed: Record<string, boolean> = {};
          flatNodes.forEach(({ node }) => {
            if (node.children.length > 0) {
              const key = node.item.id || String(node.item.srNo || "").trim();
              collapsed[key] = false;
            }
          });
          setTreeExpandedNodes(collapsed);
        };

        const expandAll = () => setTreeExpandedNodes({});

        return (
          <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-border-gray flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-600" />
                  Assembly Product Tree
                </h3>
                <p className="text-xs text-mute mt-0.5">Hierarchical breakdown of all BOM components and sub-assemblies for this tool</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Expand / Collapse All */}
                <button
                  onClick={collapseAll}
                  className="text-[10px] font-semibold text-cool-gray hover:text-ink px-2 py-1 rounded-[8px] hover:bg-canvas transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
                <button
                  onClick={expandAll}
                  className="text-[10px] font-semibold text-cool-gray hover:text-ink px-2 py-1 rounded-[8px] hover:bg-canvas transition-colors cursor-pointer"
                >
                  Expand All
                </button>

                {/* Tree / Flat Toggle */}
                <div className="flex bg-canvas border border-border-gray rounded-[10px] p-0.5 shadow-subtle">
                  <button
                    onClick={() => setTreeViewMode('tree')}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all cursor-pointer ${
                      treeViewMode === 'tree' ? 'bg-white text-ink shadow-subtle' : 'text-cool-gray hover:text-ink'
                    }`}
                  >
                    Tree View
                  </button>
                  <button
                    onClick={() => setTreeViewMode('flat')}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all cursor-pointer ${
                      treeViewMode === 'flat' ? 'bg-white text-ink shadow-subtle' : 'text-cool-gray hover:text-ink'
                    }`}
                  >
                    Flat List
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-border-gray/80 text-mute uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="p-3 w-10">#</th>
                    <th className="p-3">Part / Component Name</th>
                    <th className="p-3">Material Grade</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3 text-center">Kitting Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {bomItems.length > 0 ? (
                    treeViewMode === 'tree' ? (
                      visibleNodes.map(({ node }) => {
                        const item = node.item;
                        const hasChildren = node.children.length > 0;
                        const key = item.id || String(item.srNo || "").trim();
                        const isExpanded = treeExpandedNodes[key] !== false;
                        const isAssemblyItem = item.isAssembly || hasChildren;
                        const isIssued = materialIssues.some(
                          (m: any) => m.inventoryBatch?.materialId === item.materialId || m.materialName?.includes(item.partName)
                        );

                        return (
                          <tr key={key} className="hover:bg-canvas/80 transition-colors group">
                            <td className="p-3 font-mono text-cool-gray text-[10px]">
                              {item.srNo || "—"}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center" style={{ paddingLeft: `${node.level * 20}px` }}>
                                {hasChildren ? (
                                  <button
                                    onClick={() => toggleExpanded(key)}
                                    className="p-0.5 mr-1.5 text-primary hover:text-primary-hover rounded transition-colors cursor-pointer"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                    )}
                                  </button>
                                ) : node.level > 0 ? (
                                  <span className="text-zinc-300 font-mono text-[10px] mr-1.5 shrink-0">└</span>
                                ) : (
                                  <span className="w-[22px] shrink-0" />
                                )}
                                <span className={`font-semibold ${
                                  isAssemblyItem ? 'text-indigo-700' : 'text-ink'
                                }`}>
                                  {item.partName || item.partNumber || item.material?.materialName || `Item`}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-cool-gray font-mono text-[11px]">
                              {item.materialGrade || item.material?.materialGrade || "—"}
                            </td>
                            <td className="p-3 text-center font-semibold text-ink">
                              {item.requiredQty || item.quantity || 1}
                            </td>
                            <td className="p-3 text-center">
                              {isAssemblyItem ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Layers className="w-3 h-3" />
                                  Assembly
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                                  <Box className="w-3 h-3" />
                                  Component
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                isIssued
                                  ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20"
                                  : "bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20"
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {isIssued ? "Issued" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      /* Flat list mode */
                      bomItems.map((item: any, idx: number) => {
                        const isIssued = materialIssues.some(
                          (m: any) => m.inventoryBatch?.materialId === item.materialId || m.materialName?.includes(item.partName)
                        );
                        const isAssemblyItem = item.isAssembly;
                        return (
                          <tr key={item.id || idx} className="hover:bg-canvas/80 transition-colors">
                            <td className="p-3 font-mono text-cool-gray text-[10px]">{idx + 1}</td>
                            <td className="p-3 font-semibold text-ink">
                              {item.partName || item.partNumber || item.material?.materialName || `Item #${idx + 1}`}
                            </td>
                            <td className="p-3 text-cool-gray font-mono text-[11px]">
                              {item.materialGrade || item.material?.materialGrade || "—"}
                            </td>
                            <td className="p-3 text-center font-semibold text-ink">
                              {item.requiredQty || item.quantity || 1}
                            </td>
                            <td className="p-3 text-center">
                              {isAssemblyItem ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Layers className="w-3 h-3" />
                                  Assembly
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
                                  <Box className="w-3 h-3" />
                                  Component
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                isIssued
                                  ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20"
                                  : "bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20"
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {isIssued ? "Issued" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <GitBranch className="w-8 h-8 text-cool-gray" />
                          <p className="text-xs font-semibold text-cool-gray">No BOM items available for this project.</p>
                          <p className="text-[10px] text-mute">Upload a BOM in the Engineering workspace to see the product tree here.</p>
                          <Link
                            href={`/projects/${id}/engineering`}
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors"
                          >
                            <span>Go to Engineering BOM</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tree summary footer */}
            {bomItems.length > 0 && (
              <div className="p-3 border-t border-border-gray bg-canvas flex items-center justify-between text-[10px] text-mute">
                <span>
                  {bomItems.filter((i: any) => i.isAssembly).length} assemblies · {bomItems.filter((i: any) => !i.isAssembly).length} components · {bomItems.length} total items
                </span>
                <Link
                  href={`/projects/${id}/engineering`}
                  className="text-primary font-semibold hover:underline"
                >
                  Edit in Engineering →
                </Link>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tab 1: Kitting Checklist */}
      {activeTab === "KITTING" && (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">BOM Component Kitting Status</h3>
              <p className="text-xs text-mute">Component readiness check before tool fitting & bench assembly</p>
            </div>
            <div className="text-xs font-semibold text-primary bg-primary-subtle px-3 py-1.5 rounded-[12px] border border-primary/20">
              Kitting Score: {kittingReadinessPct}% Ready
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray/80 text-mute uppercase text-[10px] font-semibold tracking-wider">
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
                      <tr key={idx} className="hover:bg-canvas/80 transition-colors">
                        <td className="p-3 font-semibold text-ink">{item.partName || item.partNumber || `Item #${idx + 1}`}</td>
                        <td className="p-3 text-cool-gray font-mono text-[11px]">{item.materialGrade || item.material?.materialGrade || "Standard Steel"}</td>
                        <td className="p-3 font-semibold text-ink">{item.quantity || item.requiredQty || 1} NOS</td>
                        <td className="p-3 text-mute text-[11px]">{isIssued ? "Toolroom Fitting Shop" : "Project Store"}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isIssued ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" : "bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20"
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-semantic-success-dark" />
                            {isIssued ? "Ready for Fitting" : "In Project Store"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : materialIssues.length > 0 ? (
                  materialIssues.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-semibold text-ink">{item.inventoryBatch?.material?.materialName || item.inventoryBatch?.material?.materialGrade || "Raw Material Block"}</td>
                      <td className="p-3 text-cool-gray font-mono text-[11px]">{item.inventoryBatch?.material?.materialGrade || "Tool Steel"}</td>
                      <td className="p-3 font-semibold text-ink">{item.issuedQty || 1} NOS</td>
                      <td className="p-3 text-mute text-[11px]">{formatSectionName(item.section)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                          <CheckCircle2 className="w-3 h-3 text-semantic-success-dark" />
                          Issued & Ready
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-cool-gray italic">
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
          <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle">
            <div>
              <h3 className="text-sm font-semibold text-ink">Sub-Assembly Breakdown</h3>
              <p className="text-xs text-mute">Group BOM components into fitting sub-assemblies for sequential trial</p>
            </div>
            {!isProjectClosed && (
              <button
                onClick={() => setShowOrderModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub-Assembly Work Order</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assemblyOrders.length > 0 ? (
              assemblyOrders.map((asm: any, idx: number) => (
                <div key={idx} className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="font-mono text-xs font-semibold text-mute">{asm.assemblyNumber || `ASM-${idx + 1}`}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      asm.status === "COMPLETED" ? "bg-semantic-success-subtle text-semantic-success-dark" : "bg-semantic-warning-subtle text-semantic-warning-dark"
                    }`}>
                      {asm.status || "IN_PROGRESS"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-ink">{asm.assemblyName}</h4>
                    <p className="text-xs text-mute">Target Date: <span className="font-semibold text-ink">{asm.targetDate ? new Date(asm.targetDate).toLocaleDateString() : "Ongoing"}</span></p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white p-8 rounded-[12px] border border-border-gray text-center text-mute space-y-2">
                <Layers className="w-8 h-8 text-cool-gray mx-auto" />
                <p className="font-semibold text-xs">No sub-assembly work orders created for this project yet.</p>
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-primary text-white text-xs font-semibold"
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
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden space-y-4 p-4">
          <div className="bg-primary/5 border border-primary/20 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Dedicated Toolroom Trials & Tryouts Workspace Available</h4>
              </div>
              <p className="text-xs text-cool-gray mt-0.5">
                Access full press parameters (SPM, tonnage, bolster/shut height, cushion pressure), sample defect logs, and customer buyoff in the primary Trials section.
              </p>
            </div>
            <Link
              href={`/projects/${id}/trials`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors shrink-0"
            >
              <span>Go to Trials Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between border-b border-border-gray pb-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Press Trial Log & Iterations</h3>
              <p className="text-xs text-mute">T0 to T3 press tryout iterations, stamping samples, and signoff history</p>
            </div>
            {!isProjectClosed && (
              <button
                onClick={() => setShowTrialModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
              >
                <Gauge className="w-4 h-4" />
                <span>Record Trial Run</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray/80 text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Trial #</th>
                  <th className="p-3">Press Machine & Tonnage</th>
                  <th className="p-3">Trial Verdict</th>
                  <th className="p-3">Observations / Remarks</th>
                  <th className="p-3 text-right">Sign-off & Rework</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {trials.length > 0 ? (
                  trials.map((t: any) => (
                    <tr key={t.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary">{t.trialNumber}</td>
                      <td className="p-3 font-semibold text-ink">{t.machineName}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          t.result === "PASS" ? "bg-semantic-success-subtle text-semantic-success-dark" : "bg-semantic-warning-subtle text-semantic-warning-dark"
                        }`}>
                          {t.result}
                        </span>
                      </td>
                      <td className="p-3 text-cool-gray">{t.remarks}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setReworkTargetPart({
                                partName: `${project?.partName || 'Component'} - Tryout Defect`,
                                description: `Rework requested from Trial ${t.trialNumber}. ${t.remarks || ''}`.trim(),
                              });
                              setReworkModalOpen(true);
                            }}
                            className="px-2 py-1 text-[10px] font-semibold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 rounded-[8px] transition-colors"
                          >
                            Rework Part
                          </button>

                          {t.status === "APPROVED" || t.customerSignoff || isProjectClosed ? (
                            <span className="text-semantic-success-dark font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Signed Off
                            </span>
                          ) : (
                            <button
                              onClick={() => signOffMutation.mutate(t.id)}
                              className="px-2.5 py-1 text-[10px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-[10px] shadow-subtle transition-colors"
                            >
                              Sign Off
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-cool-gray italic">
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
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Fitter Daily Shopfloor Logs</h3>
              <p className="text-xs text-mute">Daily shopfloor hours logged under Toolroom Fitting & Assembly section</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray/80 text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Fitter Name</th>
                  <th className="p-3">Work Stage / Operation</th>
                  <th className="p-3 text-right">Hours Logged</th>
                  <th className="p-3">Work Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {fittingMsdrLogs.length > 0 ? (
                  fittingMsdrLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-canvas/80 transition-colors">
                      <td className="p-3 font-mono text-cool-gray">{new Date(log.logDate).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-ink">{log.personName}</td>
                      <td className="p-3 font-semibold text-primary">{log.workStageOrOperation}</td>
                      <td className="p-3 text-right font-mono font-semibold text-ink">
                        {(Number(log.hoursSpent) || Number(log.cuttingHours) || 0).toFixed(1)} hrs
                      </td>
                      <td className="p-3 text-cool-gray">{log.workDescription || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-cool-gray italic">
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
            <label className="block text-xs font-semibold text-ink mb-1">Sub-Assembly Name</label>
            <input
              type="text"
              required
              value={orderForm.assemblyName}
              onChange={(e) => setOrderForm({ ...orderForm, assemblyName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Remarks / Scope</label>
            <textarea
              rows={3}
              value={orderForm.remarks}
              onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowOrderModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-[12px] shadow-sm cursor-pointer"
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
              <label className="block text-xs font-semibold text-ink mb-1">Trial Phase</label>
              <select
                value={trialForm.trialNumber}
                onChange={(e) => setTrialForm({ ...trialForm, trialNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              >
                <option value="T0-INITIAL">T0 — Initial Tryout</option>
                <option value="T1-POST-MOD">T1 — Post Tool Modification</option>
                <option value="T2-FINAL">T2 — Final Sample Tryout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Trial Verdict</label>
              <select
                value={trialForm.result}
                onChange={(e) => setTrialForm({ ...trialForm, result: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink font-semibold bg-canvas"
              >
                <option value="PASS">PASS — Samples Accepted</option>
                <option value="REWORK_REQUIRED">REWORK REQUIRED — Tool Adjustment</option>
                <option value="RE_TRIAL">RE-TRIAL — Schedule Second Tryout</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-ink mb-1">Press Machine Used</label>
              <input
                type="text"
                value={trialForm.machineName}
                onChange={(e) => setTrialForm({ ...trialForm, machineName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Sample Qty (Pcs)</label>
              <input
                type="number"
                value={trialForm.sampleQty}
                onChange={(e) => setTrialForm({ ...trialForm, sampleQty: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Tryout Observations & Remarks</label>
            <textarea
              rows={3}
              value={trialForm.remarks}
              onChange={(e) => setTrialForm({ ...trialForm, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowTrialModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTrialMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-[12px] shadow-sm cursor-pointer"
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
          <div className="p-3.5 bg-semantic-success-subtle rounded-[12px] border border-semantic-success/20 text-xs text-ink space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-semantic-success-dark">
              <CheckCircle2 className="w-4 h-4 text-semantic-success-dark" />
              <span>Quality Inspection Milestone</span>
            </div>
            <p className="text-cool-gray">
              This action confirms toolroom fitting & press tryouts are completed. The project stage will advance to <strong>QUALITY INSPECTION</strong> for CMM and PDI clearance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">Handover Remarks</label>
            <textarea
              rows={3}
              placeholder="e.g. Die bedding completed, shut height locked at 320mm, T0 samples stamped cleanly."
              value={handoverRemarks}
              onChange={(e) => setHandoverRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-gray rounded-[12px] text-ink bg-canvas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <button
              type="button"
              onClick={() => setShowHandoverModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-cool-gray hover:text-ink rounded-[12px] hover:bg-canvas transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completeProductionMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-semantic-success-dark hover:bg-semantic-success-dark/90 rounded-[12px] shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{completeProductionMutation.isPending ? "Submitting..." : "Confirm & Handover"}</span>
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
          initialSourceStage="FITTING"
          initialDescription={reworkTargetPart?.description}
        />
      )}
    </div>
  );
}
