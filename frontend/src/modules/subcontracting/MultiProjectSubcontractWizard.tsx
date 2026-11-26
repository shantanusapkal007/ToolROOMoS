"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Briefcase,
  Wrench,
  Package,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { ProjectsService } from "@/services/projects.service";
import { SubcontractingService } from "@/services/subcontracting.service";
import { AuthenticSubcontractPoDocument } from "./AuthenticSubcontractPoDocument";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/formatters";

interface WizardLineItem {
  id: string;
  operationId: string;
  sentQty: number;
  hoursPerPc: number;
  rate: number;
  remarks: string;
  sendMaterial: boolean;
  inventoryBatchId: string;
}

interface MultiProjectSubcontractWizardProps {
  onSuccess?: () => void;
}

function getBatchDisplayName(batch: any): string {
  if (!batch) return "Raw Material";
  const poItem = batch.grnItem?.poItem;
  const custom = (poItem?.customFields as any) || {};
  const partName = custom.partName || custom.description || poItem?.remarks;
  const grade = batch.material?.materialGrade || batch.material?.materialName;
  if (partName && grade && partName.toLowerCase() !== grade.toLowerCase()) {
    return `${partName} (${grade})`;
  }
  return partName || grade || "Raw Material";
}

function formatBatchOption(batch: any): string {
  if (!batch) return "";
  const label = getBatchDisplayName(batch);
  let num = batch.batchNumber || "";
  if (num.length > 20 && num.includes("-")) {
    const parts = num.split("-");
    num = parts.slice(0, 3).join("-");
  }
  const heat = batch.heatNumber && batch.heatNumber !== "N/A" ? ` • Heat: ${batch.heatNumber}` : "";
  const projTag = batch.grnItem?.grnHeader?.project?.projectNumber
    ? ` • ${batch.grnItem.grnHeader.project.projectNumber}`
    : "";
  const uom = batch.material?.uom || "NOS";
  return `${label} [${num}${heat}${projTag}] — ${batch.availableQty} ${uom} Avail`;
}

function extractArray(res: any): any[] {
  const body = res?.data;
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  if (body && body.data && Array.isArray(body.data.data)) return body.data.data;
  return [];
}

function addDaysToToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function MultiProjectSubcontractWizard({ onSuccess }: MultiProjectSubcontractWizardProps) {
  const { success, error } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Master Data
  const [projects, setProjects] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Step 1 Header Form State
  const [vendorId, setVendorId] = useState("");
  const [documentNumber, setDocumentNumber] = useState(() => `CHL-${Date.now().toString().slice(-4)}`);
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Step 1 Project Selection & Filters
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRODUCTION" | "ENGINEERING">("ALL");

  // Step 2 Project-Grouped Line Items
  const [projectItemsMap, setProjectItemsMap] = useState<Record<string, WizardLineItem[]>>({});
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  // Step 3 Submission State
  const [isSaving, setIsSaving] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoadingMaster(true);
    try {
      const [projList, vRes, oRes, bList] = await Promise.all([
        ProjectsService.getAllProjects().catch(() => []),
        api.get("master-data/vendors").catch(() => ({ data: [] })),
        api.get("master-data/operations").catch(() => ({ data: [] })),
        SubcontractingService.getAvailableBatches().catch(() => []),
      ]);

      const activeProjs = (Array.isArray(projList) ? projList : []).filter(
        (p: any) => p.currentStage !== "CLOSED" && p.currentStage !== "COMPLETED",
      );
      setProjects(activeProjs);

      const vList = extractArray(vRes);
      setVendors(vList.filter((v: any) => v.vendorType !== "MATERIAL_SUPPLIER"));

      const oList = extractArray(oRes);
      setOperations(oList);

      const validBatches = (Array.isArray(bList) ? bList : []).filter(
        (b: any) => Number(b.availableQty) > 0,
      );
      setAvailableBatches(validBatches);
    } catch (err) {
      console.error("Failed to load wizard master data:", err);
    } finally {
      setLoadingMaster(false);
    }
  };

  const createEmptyLineItem = (projId?: string): WizardLineItem => {
    // Prefer a batch linked to this project if available
    const projectBatch = projId
      ? availableBatches.find((b: any) => b.grnItem?.grnHeader?.projectId === projId)
      : undefined;
    const defaultBatch = projectBatch || availableBatches[0];

    return {
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      operationId: operations[0]?.id || "",
      sentQty: 1,
      hoursPerPc: 1,
      rate: 0,
      remarks: "",
      sendMaterial: !!defaultBatch,
      inventoryBatchId: defaultBatch?.id || "",
    };
  };

  // Filtered projects for Step 1
  const filteredProjects = useMemo(() => {
    return projects.filter((p: any) => {
      const matchesStage =
        stageFilter === "ALL" ||
        (stageFilter === "PRODUCTION" &&
          ["PRODUCTION", "MATERIAL_AVAILABLE", "INSPECTION"].includes(p.currentStage)) ||
        (stageFilter === "ENGINEERING" &&
          ["CREATED", "ENGINEERING", "MATERIAL_PLANNING", "PROCUREMENT"].includes(p.currentStage));

      if (!matchesStage) return false;
      if (!projectSearch.trim()) return true;

      const q = projectSearch.toLowerCase();
      return (
        p.projectNumber?.toLowerCase().includes(q) ||
        p.partName?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.customer?.companyName?.toLowerCase().includes(q) ||
        p.customer?.customerName?.toLowerCase().includes(q)
      );
    });
  }, [projects, projectSearch, stageFilter]);

  const toggleProject = (projId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredProjects.map((p: any) => p.id);
    const allSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedProjectIds.includes(id));

    if (allSelected) {
      setSelectedProjectIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Ensure every selected project has at least 1 line item when entering Step 2
  const handleProceedToStep2 = () => {
    if (!vendorId) {
      error("Vendor Required", "Please select the Job Work Vendor before proceeding.");
      return;
    }
    if (!documentNumber.trim()) {
      error("Gate Pass Required", "Please enter a Challan / Gate Pass number.");
      return;
    }
    if (selectedProjectIds.length === 0) {
      error("Select Projects", "Please select at least one project for this outsource challan.");
      return;
    }

    setProjectItemsMap((prev) => {
      const next: Record<string, WizardLineItem[]> = {};
      selectedProjectIds.forEach((projId) => {
        next[projId] =
          prev[projId] && prev[projId].length > 0
            ? prev[projId]
            : [createEmptyLineItem(projId)];
      });
      return next;
    });

    setStep(2);
  };

  const addProjectInStep2 = (projId: string) => {
    if (!projId || selectedProjectIds.includes(projId)) return;
    setSelectedProjectIds((prev) => [...prev, projId]);
    setProjectItemsMap((prev) => ({
      ...prev,
      [projId]: [createEmptyLineItem(projId)],
    }));
  };

  const removeProjectInStep2 = (projId: string) => {
    if (selectedProjectIds.length <= 1) {
      error("Cannot Remove", "At least one project is required in the challan.");
      return;
    }
    setSelectedProjectIds((prev) => prev.filter((id) => id !== projId));
    setProjectItemsMap((prev) => {
      const next = { ...prev };
      delete next[projId];
      return next;
    });
  };

  const addLineToProject = (projId: string) => {
    setProjectItemsMap((prev) => ({
      ...prev,
      [projId]: [...(prev[projId] || []), createEmptyLineItem(projId)],
    }));
  };

  const duplicateLineInProject = (projId: string, item: WizardLineItem) => {
    const clone: WizardLineItem = {
      ...item,
      id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setProjectItemsMap((prev) => ({
      ...prev,
      [projId]: [...(prev[projId] || []), clone],
    }));
  };

  const removeLineFromProject = (projId: string, lineId: string) => {
    setProjectItemsMap((prev) => {
      const current = prev[projId] || [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        [projId]: current.filter((l) => l.id !== lineId),
      };
    });
  };

  const updateLineInProject = (
    projId: string,
    lineId: string,
    field: keyof WizardLineItem,
    value: any,
  ) => {
    setProjectItemsMap((prev) => ({
      ...prev,
      [projId]: (prev[projId] || []).map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    }));
  };

  // Compute cumulative requested quantity per inventory batch across ALL projects & lines
  const batchRequestedTotals = useMemo(() => {
    const map = new Map<string, number>();
    selectedProjectIds.forEach((projId) => {
      (projectItemsMap[projId] || []).forEach((line) => {
        if (line.sendMaterial && line.inventoryBatchId) {
          const prevQty = map.get(line.inventoryBatchId) || 0;
          map.set(line.inventoryBatchId, prevQty + (Number(line.sentQty) || 0));
        }
      });
    });
    return map;
  }, [selectedProjectIds, projectItemsMap]);

  // Grand Totals Calculation
  const summaryStats = useMemo(() => {
    let totalLines = 0;
    let totalPieces = 0;
    let totalHours = 0;
    let totalBasicCost = 0;
    let materialLineCount = 0;

    selectedProjectIds.forEach((projId) => {
      (projectItemsMap[projId] || []).forEach((line) => {
        totalLines += 1;
        const qty = Number(line.sentQty) || 0;
        const hrs = Number(line.hoursPerPc) > 0 ? Number(line.hoursPerPc) : 1;
        const rate = Number(line.rate) || 0;
        totalPieces += qty;
        totalHours += qty * hrs;
        totalBasicCost += qty * hrs * rate;
        if (line.sendMaterial && line.inventoryBatchId) {
          materialLineCount += 1;
        }
      });
    });

    const totalGst = Math.round((totalBasicCost * 0.18 + Number.EPSILON) * 100) / 100;
    const totalWithGst = Math.round((totalBasicCost + totalGst + Number.EPSILON) * 100) / 100;

    return {
      projectCount: selectedProjectIds.length,
      totalLines,
      totalPieces,
      totalHours,
      totalBasicCost,
      totalGst,
      totalWithGst,
      materialLineCount,
    };
  }, [selectedProjectIds, projectItemsMap]);

  // Validate Step 2 before moving to Step 3 Document Preview
  const handleProceedToPreview = () => {
    if (!vendorId) {
      error("Vendor Required", "Please select an outsource job work vendor.");
      return;
    }

    for (const projId of selectedProjectIds) {
      const proj = projects.find((p) => p.id === projId);
      const projLabel = proj?.projectNumber || "Project";
      const lines = projectItemsMap[projId] || [];

      if (lines.length === 0) {
        error("Empty Project", `${projLabel}: Add at least one outsource operation line.`);
        return;
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.operationId) {
          error("Operation Required", `${projLabel} — Line #${i + 1}: Please select an outsource operation.`);
          return;
        }
        if (!line.sentQty || Number(line.sentQty) <= 0) {
          error("Invalid Quantity", `${projLabel} — Line #${i + 1}: Sent quantity must be greater than 0.`);
          return;
        }
        if (line.sendMaterial && !line.inventoryBatchId) {
          error(
            "Missing Material Batch",
            `${projLabel} — Line #${i + 1}: Select an inventory batch or switch to 'Service / Vendor Material'.`,
          );
          return;
        }
      }
    }

    // Check cross-line batch stock limits
    for (const [batchId, totalReq] of batchRequestedTotals.entries()) {
      const batch = availableBatches.find((b) => b.id === batchId);
      if (batch && totalReq > Number(batch.availableQty)) {
        error(
          "Stock Exceeded",
          `${getBatchDisplayName(batch)}: Total requested across challan (${totalReq}) exceeds available stores stock (${batch.availableQty}).`,
        );
        return;
      }
    }

    setStep(3);
  };

  // Build preview order objects matching AuthenticSubcontractPoDocument schema
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const previewOrders = useMemo(() => {
    if (createdResult?.orders && Array.isArray(createdResult.orders)) {
      return createdResult.orders;
    }

    return selectedProjectIds.map((projId) => {
      const proj = projects.find((p) => p.id === projId);
      const lines = projectItemsMap[projId] || [];

      const mappedItems = lines.map((line) => {
        const op = operations.find((o) => o.id === line.operationId);
        const batch = line.sendMaterial
          ? availableBatches.find((b) => b.id === line.inventoryBatchId)
          : null;
        const hrs = Number(line.hoursPerPc) > 0 ? Number(line.hoursPerPc) : 1;
        const qty = Number(line.sentQty) || 0;
        const rate = Number(line.rate) || 0;

        return {
          project: proj,
          operation: op || { operationName: "Subcontract Operation" },
          inventoryBatch: batch || null,
          sentQty: qty,
          hoursPerPc: hrs,
          rate,
          lineEstimatedCost: qty * hrs * rate,
          remarks: line.remarks,
        };
      });

      return {
        challanNumber: documentNumber,
        documentNumber,
        expectedReturnDate: expectedReturnDate || undefined,
        remarks,
        createdAt: new Date().toISOString(),
        vendor: selectedVendor || { vendorName: "Outsource Vendor" },
        project: proj,
        items: mappedItems,
      };
    });
  }, [
    createdResult,
    selectedProjectIds,
    projects,
    projectItemsMap,
    operations,
    availableBatches,
    documentNumber,
    expectedReturnDate,
    remarks,
    selectedVendor,
  ]);

  const handleConfirmIssue = async () => {
    if (!vendorId) return;
    setIsSaving(true);
    try {
      const flatItems = selectedProjectIds.flatMap((projId) =>
        (projectItemsMap[projId] || []).map((line) => ({
          projectId: projId,
          operationId: line.operationId,
          sentQty: Number(line.sentQty) || 1,
          hoursPerPc: Number(line.hoursPerPc) > 0 ? Number(line.hoursPerPc) : 1,
          rate: Number(line.rate) || 0,
          remarks: line.remarks?.trim() || undefined,
          inventoryBatchId:
            line.sendMaterial && line.inventoryBatchId ? line.inventoryBatchId : undefined,
        })),
      );

      const res = await SubcontractingService.createMultiProjectOrders({
        vendorId,
        documentNumber: documentNumber.trim() || undefined,
        expectedReturnDate: expectedReturnDate.trim() || undefined,
        remarks: remarks.trim() || undefined,
        items: flatItems,
      });

      setCreatedResult(res);
      success(
        "Multi-Project Challan Issued",
        `Generated ${res.projectCount || selectedProjectIds.length} linked subcontract order(s) under Gate Pass ${res.documentNumber || documentNumber}.`,
      );
      loadMasterData();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      error("Issue Failed", Array.isArray(msg) ? msg.join(", ") : msg || err?.message || "Failed to issue subcontract challan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetWizard = () => {
    setCreatedResult(null);
    setStep(1);
    setSelectedProjectIds([]);
    setProjectItemsMap({});
    setVendorId("");
    setDocumentNumber(`CHL-${Date.now().toString().slice(-4)}`);
    setExpectedReturnDate("");
    setRemarks("");
  };

  const unselectedProjects = projects.filter((p) => !selectedProjectIds.includes(p.id));

  return (
    <div className="space-y-5 text-ink font-sans pb-16">
      {/* 3-Step Wizard Progress Header */}
      <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-4 hide-on-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-body font-semibold text-ink">
              Multi-Project Outsource Challan Builder
            </h2>
            <p className="text-small text-cool-gray">
              Consolidate outside job work across multiple tools under a single vendor gate pass
            </p>
          </div>
        </div>

        {/* Stepper Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { num: 1, label: "Vendor & Projects" },
            { num: 2, label: "Operations & Material" },
            { num: 3, label: "Preview & Issue" },
          ].map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num || (s.num === 3 && !!createdResult);
            return (
              <React.Fragment key={s.num}>
                {idx > 0 && <ArrowRight className="w-3.5 h-3.5 text-cool-gray shrink-0" />}
                <button
                  type="button"
                  disabled={!!createdResult || (s.num > step)}
                  onClick={() => {
                    if (!createdResult && s.num < step) setStep(s.num as 1 | 2 | 3);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-caption font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-subtle"
                      : isCompleted
                      ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30 cursor-pointer"
                      : "bg-canvas text-cool-gray border border-border-gray"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-small font-bold ${
                      isActive
                        ? "bg-white text-primary"
                        : isCompleted
                        ? "bg-semantic-success-dark text-white"
                        : "bg-white text-cool-gray border border-border-gray"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* STEP 1: Vendor Details + Multi-Project Picker                       */}
      {/* =================================================================== */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Card 1: Challan & Vendor Details */}
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-gray">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="text-body font-semibold text-ink">
                  Challan &amp; Job Work Vendor Details
                </h3>
              </div>
              {selectedVendor && (
                <span className="text-small text-cool-gray bg-canvas px-3 py-1 rounded-[8px] border border-border-gray">
                  {selectedVendor.address || "Vendor Selected"}
                  {selectedVendor.gstNumber ? ` • GST: ${selectedVendor.gstNumber}` : ""}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Job Work Vendor *"
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="">Select Outsource Vendor...</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName}
                  </option>
                ))}
              </Select>

              <Input
                label="Challan / Gate Pass # *"
                required
                placeholder="e.g. CHL-7293"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />

              <div className="space-y-1.5">
                <Input
                  label="Expected Return Date"
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-small text-cool-gray">Quick set:</span>
                  {[
                    { label: "+3 Days", days: 3 },
                    { label: "+7 Days", days: 7 },
                    { label: "+14 Days", days: 14 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setExpectedReturnDate(addDaysToToday(preset.days))}
                      className="text-small px-2 py-0.5 rounded-[6px] bg-canvas hover:bg-primary-subtle hover:text-primary border border-border-gray text-cool-gray transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-ink mb-1.5">
                Gate Pass Notes / Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Maintain 58-62 HRC hardness, return with test certificate & signed delivery copy..."
                className="w-full px-3.5 py-2.5 bg-white border border-border-gray rounded-[10px] text-caption text-ink placeholder:text-cool-gray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Card 2: Select Projects to Include */}
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border-gray">
              <div>
                <h3 className="text-body font-semibold text-ink flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Select Tool Projects for This Challan</span>
                </h3>
                <p className="text-small text-cool-gray mt-0.5">
                  Click project cards below to include them. In the next step you will define operations &amp; materials per project.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <SearchInput
                  context="local"
                  placeholder="Search tool #, part name, customer..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  onClear={() => setProjectSearch("")}
                  containerClassName="w-full sm:w-64"
                />

                <div className="flex items-center gap-1 bg-canvas p-1 rounded-[10px] border border-border-gray">
                  {(
                    [
                      { id: "ALL", label: "All Active" },
                      { id: "PRODUCTION", label: "Production" },
                      { id: "ENGINEERING", label: "Engineering" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setStageFilter(f.id)}
                      className={`px-2.5 py-1 rounded-[8px] text-small font-medium transition-all cursor-pointer ${
                        stageFilter === f.id
                          ? "bg-white text-ink shadow-subtle border border-border-gray"
                          : "text-cool-gray hover:text-ink"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selection Helper Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas rounded-[10px] px-4 py-2.5 border border-border-gray">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-2 text-caption font-medium text-ink hover:text-primary transition-colors cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    filteredProjects.length > 0 &&
                    filteredProjects.every((p) => selectedProjectIds.includes(p.id))
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-border-gray"
                  }`}
                >
                  {filteredProjects.length > 0 &&
                    filteredProjects.every((p) => selectedProjectIds.includes(p.id)) && (
                      <Check className="w-3 h-3 stroke-[3]" />
                    )}
                </div>
                <span>Select All Visible ({filteredProjects.length} Projects)</span>
              </button>

              <div className="flex items-center gap-3">
                {selectedProjectIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProjectIds([])}
                    className="text-small text-cool-gray hover:text-semantic-danger underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-small font-semibold px-3 py-1 rounded-[8px] bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30">
                  {selectedProjectIds.length} Project{selectedProjectIds.length === 1 ? "" : "s"} Selected
                </span>
              </div>
            </div>

            {/* Project Grid */}
            {loadingMaster ? (
              <div className="py-12 text-center text-caption text-cool-gray">
                Loading active toolroom projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-12 text-center bg-canvas rounded-[12px] border border-border-gray">
                <Briefcase className="w-8 h-8 text-cool-gray mx-auto mb-2 opacity-60" />
                <p className="text-body font-semibold text-ink">No Matching Active Projects</p>
                <p className="text-small text-cool-gray mt-1">
                  Try clearing your search or switching stage filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredProjects.map((proj: any) => {
                  const isSelected = selectedProjectIds.includes(proj.id);
                  const customerName =
                    proj.customer?.companyName || proj.customer?.customerName || "Customer";

                  return (
                    <div
                      key={proj.id}
                      onClick={() => toggleProject(proj.id)}
                      className={`cursor-pointer rounded-[12px] p-4 border transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-primary bg-primary-subtle/25 shadow-subtle"
                          : "border-border-gray bg-[#f8f9fc] dark:bg-[#181b29] hover:border-cool-gray/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border-gray bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-caption font-bold text-ink bg-white px-2 py-0.5 rounded-[6px] border border-border-gray">
                            {proj.projectNumber}
                          </span>
                          <StatusBadge status={proj.currentStage || "PRODUCTION"} size="sm" />
                        </div>

                        <div className="text-caption font-semibold text-ink truncate">
                          {proj.partName || proj.name || "Tool Assembly"}
                        </div>

                        <div className="text-small text-cool-gray truncate">
                          Client: {customerName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 1 Sticky Footer CTA */}
          <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-caption text-cool-gray">
              <span>Selected:</span>
              {selectedProjectIds.length === 0 ? (
                <span className="text-small italic">No projects selected yet</span>
              ) : (
                selectedProjectIds.slice(0, 5).map((id) => {
                  const p = projects.find((pr) => pr.id === id);
                  return (
                    <span
                      key={id}
                      className="font-mono text-small font-semibold px-2.5 py-0.5 rounded-[6px] bg-primary-subtle text-primary border border-primary/20"
                    >
                      {p?.projectNumber || "PRJ"}
                    </span>
                  );
                })
              )}
              {selectedProjectIds.length > 5 && (
                <span className="text-small font-medium text-ink">
                  +{selectedProjectIds.length - 5} more
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleProceedToStep2}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Configure Operations ({selectedProjectIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: Configure Operations & Material per Project                 */}
      {/* =================================================================== */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Step 2 Control Bar */}
          <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="white"
                size="sm"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Projects
              </Button>
              <div className="text-caption text-cool-gray hidden sm:block">
                Vendor: <strong className="text-ink">{selectedVendor?.vendorName}</strong> • Gate Pass:{" "}
                <strong className="font-mono text-ink">{documentNumber}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {unselectedProjects.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) addProjectInStep2(e.target.value);
                  }}
                  className="bg-canvas border border-border-gray rounded-[10px] px-3 py-2 text-caption font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">+ Add Another Project...</option>
                  {unselectedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectNumber} — {p.partName || p.name}
                    </option>
                  ))}
                </select>
              )}

              <Button
                variant="white"
                size="sm"
                onClick={() => {
                  const anyExpanded = selectedProjectIds.some((id) => !collapsedProjects[id]);
                  const next: Record<string, boolean> = {};
                  selectedProjectIds.forEach((id) => {
                    next[id] = anyExpanded;
                  });
                  setCollapsedProjects(next);
                }}
              >
                {selectedProjectIds.some((id) => !collapsedProjects[id])
                  ? "Collapse All"
                  : "Expand All"}
              </Button>
            </div>
          </div>

          {/* Project Sections */}
          <div className="space-y-5">
            {selectedProjectIds.map((projId, projIdx) => {
              const proj = projects.find((p) => p.id === projId);
              const lines = projectItemsMap[projId] || [];
              const isCollapsed = !!collapsedProjects[projId];

              const projPieces = lines.reduce((sum, l) => sum + (Number(l.sentQty) || 0), 0);
              const projHours = lines.reduce(
                (sum, l) =>
                  sum + (Number(l.sentQty) || 0) * (Number(l.hoursPerPc) > 0 ? Number(l.hoursPerPc) : 1),
                0,
              );
              const projCost = lines.reduce(
                (sum, l) =>
                  sum +
                  (Number(l.sentQty) || 0) *
                    (Number(l.hoursPerPc) > 0 ? Number(l.hoursPerPc) : 1) *
                    (Number(l.rate) || 0),
                0,
              );

              return (
                <div
                  key={projId}
                  className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden"
                >
                  {/* Project Group Header */}
                  <div className="p-4 sm:p-5 bg-canvas border-b border-border-gray flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-white text-caption font-bold flex items-center justify-center shrink-0">
                        {projIdx + 1}
                      </span>
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-mono font-bold text-body text-ink">
                            {proj?.projectNumber}
                          </span>
                          <span className="text-caption font-semibold text-ink">
                            — {proj?.partName || proj?.name || "Tool Assembly"}
                          </span>
                          <StatusBadge status={proj?.currentStage || "PRODUCTION"} size="sm" />
                        </div>
                        <p className="text-small text-cool-gray mt-0.5">
                          {lines.length} operation{lines.length === 1 ? "" : "s"} • {projPieces} pcs •{" "}
                          {projHours.toFixed(1)} hrs • Subtotal:{" "}
                          <strong className="font-mono text-ink">{formatCurrency(projCost)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="white"
                        size="sm"
                        type="button"
                        onClick={() => addLineToProject(projId)}
                        leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
                      >
                        Add Operation Line
                      </Button>

                      {selectedProjectIds.length > 1 && (
                        <Button
                          variant="white"
                          size="sm"
                          type="button"
                          onClick={() => removeProjectInStep2(projId)}
                          className="text-cool-gray hover:text-semantic-danger"
                          title="Remove project from challan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }))
                        }
                        className="p-1.5 rounded-[8px] hover:bg-white border border-transparent hover:border-border-gray text-cool-gray cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Project Line Items List */}
                  {!isCollapsed && (
                    <div className="p-5 space-y-5">
                      {lines.map((line, lineIdx) => {
                        const selectedBatch = availableBatches.find(
                          (b: any) => b.id === line.inventoryBatchId,
                        );
                        const sentQty = Number(line.sentQty) || 0;
                        const hoursPerPc =
                          Number(line.hoursPerPc) > 0 ? Number(line.hoursPerPc) : 1;
                        const rate = Number(line.rate) || 0;
                        const totalLineHours = sentQty * hoursPerPc;
                        const lineEstimatedCost = totalLineHours * rate;

                        const totalBatchRequested = selectedBatch
                          ? batchRequestedTotals.get(selectedBatch.id) || 0
                          : 0;
                        const batchAvailable = selectedBatch
                          ? Number(selectedBatch.availableQty)
                          : 0;
                        const isBatchExceeded =
                          selectedBatch && totalBatchRequested > batchAvailable;
                        const selectedOpName = operations.find(
                          (o) => o.id === line.operationId,
                        )?.operationName;

                        return (
                          <div
                            key={line.id}
                            className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 shadow-subtle space-y-5"
                          >
                            {/* Line Item Card Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-border-gray">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-caption font-bold flex items-center justify-center">
                                  {lineIdx + 1}
                                </span>
                                <div>
                                  <span className="text-body font-semibold text-ink">
                                    {proj?.projectNumber} — Line #{lineIdx + 1}
                                  </span>
                                  {selectedOpName && (
                                    <span className="ml-2 text-small text-cool-gray">
                                      ({selectedOpName})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-small text-cool-gray block">
                                    Line Estimate
                                  </span>
                                  <span className="text-body font-mono font-bold text-ink">
                                    {formatCurrency(lineEstimatedCost)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => duplicateLineInProject(projId, line)}
                                  className="text-cool-gray hover:text-primary p-1.5 rounded-[8px] hover:bg-white transition-colors cursor-pointer"
                                  title="Duplicate this operation line"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {lines.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLineFromProject(projId, line.id)}
                                    className="text-cool-gray hover:text-semantic-danger p-1.5 rounded-[8px] hover:bg-white transition-colors cursor-pointer"
                                    title="Remove this line item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Material Source Segmented Toggle */}
                            <div className="space-y-2">
                              <label className="block text-caption font-medium text-ink">
                                Material Source for this Operation
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div
                                  onClick={() => {
                                    updateLineInProject(projId, line.id, "sendMaterial", true);
                                    if (availableBatches.length > 0 && !line.inventoryBatchId) {
                                      const projBatch = availableBatches.find(
                                        (b: any) => b.grnItem?.grnHeader?.projectId === projId,
                                      );
                                      updateLineInProject(
                                        projId,
                                        line.id,
                                        "inventoryBatchId",
                                        (projBatch || availableBatches[0]).id,
                                      );
                                    }
                                  }}
                                  className={`cursor-pointer rounded-[10px] p-3.5 border transition-all flex items-start gap-3 ${
                                    line.sendMaterial
                                      ? "border-primary bg-primary-subtle/20 shadow-subtle"
                                      : "border-border-gray bg-white dark:bg-[#151824] hover:border-cool-gray/40"
                                  }`}
                                >
                                  <div
                                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      line.sendMaterial
                                        ? "border-primary bg-primary text-white"
                                        : "border-border-gray bg-white"
                                    }`}
                                  >
                                    {line.sendMaterial && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-caption font-semibold text-ink">
                                      <Package className="w-4 h-4 text-semantic-success-dark" />
                                      <span>Factory Stores Material</span>
                                    </div>
                                    <p className="text-small text-cool-gray leading-relaxed">
                                      Issue parts from factory stock. Deducts quantity and tracks returned piece.
                                    </p>
                                  </div>
                                </div>

                                <div
                                  onClick={() => {
                                    updateLineInProject(projId, line.id, "sendMaterial", false);
                                    updateLineInProject(projId, line.id, "inventoryBatchId", "");
                                  }}
                                  className={`cursor-pointer rounded-[10px] p-3.5 border transition-all flex items-start gap-3 ${
                                    !line.sendMaterial
                                      ? "border-primary bg-primary-subtle/20 shadow-subtle"
                                      : "border-border-gray bg-white dark:bg-[#151824] hover:border-cool-gray/40"
                                  }`}
                                >
                                  <div
                                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      !line.sendMaterial
                                        ? "border-primary bg-primary text-white"
                                        : "border-border-gray bg-white"
                                    }`}
                                  >
                                    {!line.sendMaterial && (
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    )}
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-caption font-semibold text-ink">
                                      <Wrench className="w-4 h-4 text-cool-gray" />
                                      <span>Service / Vendor Material</span>
                                    </div>
                                    <p className="text-small text-cool-gray leading-relaxed">
                                      Labor or vendor-supplied stock. No factory inventory will be deducted.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stores Batch Picker */}
                            {line.sendMaterial && (
                              <div className="bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] p-4 space-y-3 shadow-subtle">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <span className="text-caption font-semibold text-ink flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-semantic-success-dark" />
                                    <span>Select Material Batch to Deduct</span>
                                  </span>

                                  {selectedBatch && (
                                    <span
                                      className={`text-small font-mono font-medium px-2.5 py-1 rounded-[6px] border ${
                                        isBatchExceeded
                                          ? "bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/30 font-semibold"
                                          : "bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/30"
                                      }`}
                                    >
                                      Available: {batchAvailable}{" "}
                                      {selectedBatch.material?.uom || "NOS"} • Allocated in Challan:{" "}
                                      {totalBatchRequested}
                                    </span>
                                  )}
                                </div>

                                <select
                                  value={line.inventoryBatchId || ""}
                                  onChange={(e) =>
                                    updateLineInProject(
                                      projId,
                                      line.id,
                                      "inventoryBatchId",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] px-3.5 py-2.5 text-caption text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-subtle"
                                >
                                  <option value="">Select inventory batch from stores...</option>
                                  {availableBatches.map((b: any) => (
                                    <option key={b.id} value={b.id}>
                                      {formatBatchOption(b)}
                                    </option>
                                  ))}
                                </select>

                                {availableBatches.length === 0 && (
                                  <div className="flex items-center gap-2 text-small text-semantic-warning-dark bg-semantic-warning-subtle/50 px-3 py-2 rounded-[8px] border border-semantic-warning/20">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>
                                      No available inventory batches in stores. Switch to Service / Vendor Material if vendor supplies material.
                                    </span>
                                  </div>
                                )}

                                {isBatchExceeded && (
                                  <div className="flex items-center gap-2 text-small text-semantic-danger-dark bg-semantic-danger-subtle/50 px-3 py-2 rounded-[8px] border border-semantic-danger/20 font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>
                                      Total requested across this challan ({totalBatchRequested}) exceeds available store stock ({batchAvailable}).
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Operational Details Grid */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Select
                                  label="Outsource Operation *"
                                  required
                                  value={line.operationId}
                                  onChange={(e) =>
                                    updateLineInProject(
                                      projId,
                                      line.id,
                                      "operationId",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Select Operation...</option>
                                  {operations.map((op: any) => (
                                    <option key={op.id} value={op.id}>
                                      {op.operationName}
                                    </option>
                                  ))}
                                </Select>

                                <Input
                                  label="Line Notes / Part Spec (Optional)"
                                  placeholder="e.g. Det #2 Punch Block, 58-62 HRC"
                                  value={line.remarks}
                                  onChange={(e) =>
                                    updateLineInProject(projId, line.id, "remarks", e.target.value)
                                  }
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Input
                                  label="Sent Qty (Pcs) *"
                                  type="number"
                                  min="1"
                                  required
                                  value={line.sentQty}
                                  onChange={(e) =>
                                    updateLineInProject(
                                      projId,
                                      line.id,
                                      "sentQty",
                                      e.target.value === "" ? ("" as any) : Number(e.target.value),
                                    )
                                  }
                                />

                                <Input
                                  label="Hours per Pc *"
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  required
                                  value={line.hoursPerPc}
                                  onChange={(e) =>
                                    updateLineInProject(
                                      projId,
                                      line.id,
                                      "hoursPerPc",
                                      e.target.value === "" ? ("" as any) : Number(e.target.value),
                                    )
                                  }
                                />

                                <Input
                                  label="Rate per Hour (₹) *"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                  value={line.rate}
                                  onChange={(e) =>
                                    updateLineInProject(
                                      projId,
                                      line.id,
                                      "rate",
                                      e.target.value === "" ? ("" as any) : Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Machining Scope Calculation Strip */}
                            <div className="bg-white dark:bg-[#151824] border border-border-gray rounded-[10px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-caption shadow-subtle">
                              <div className="flex items-center gap-2 text-cool-gray">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span>Machining Scope:</span>
                                <strong className="font-mono text-ink text-body font-bold">
                                  {totalLineHours.toFixed(1)} hrs
                                </strong>
                                <span className="text-small text-cool-gray">
                                  ({sentQty} pcs × {hoursPerPc} hrs/pc)
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-cool-gray">
                                <span>Line Basic:</span>
                                <strong className="font-mono text-ink text-body font-bold">
                                  {formatCurrency(lineEstimatedCost)}
                                </strong>
                                <span className="text-small text-cool-gray">(@ ₹{rate}/hr)</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grand Challan Summary & Proceed CTA */}
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <span className="text-small text-cool-gray block">Projects</span>
                <span className="text-body font-mono font-bold text-ink">
                  {summaryStats.projectCount} Tool{summaryStats.projectCount === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                <span className="text-small text-cool-gray block">Operations</span>
                <span className="text-body font-mono font-bold text-ink">
                  {summaryStats.totalLines} Line{summaryStats.totalLines === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                <span className="text-small text-cool-gray block">Total Pieces</span>
                <span className="text-body font-mono font-bold text-ink">
                  {summaryStats.totalPieces} pcs
                </span>
              </div>
              <div>
                <span className="text-small text-cool-gray block">Total Machining</span>
                <span className="text-body font-mono font-bold text-primary">
                  {summaryStats.totalHours.toFixed(1)} hrs
                </span>
              </div>
              <div>
                <span className="text-small text-cool-gray block">Stores Batches</span>
                <span
                  className={`text-body font-mono font-bold ${
                    summaryStats.materialLineCount > 0
                      ? "text-semantic-success-dark"
                      : "text-cool-gray"
                  }`}
                >
                  {summaryStats.materialLineCount} batch
                  {summaryStats.materialLineCount === 1 ? "" : "es"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-gray">
              <div className="sm:text-right">
                <span className="text-small text-cool-gray block">
                  Est. Total (Incl. 18% GST: {formatCurrency(summaryStats.totalGst)})
                </span>
                <span className="text-feature-title font-mono font-bold text-ink">
                  {formatCurrency(summaryStats.totalWithGst)}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToPreview}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Preview Official Challan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: Preview Official Challan & Issue                            */}
      {/* =================================================================== */}
      {step === 3 && (
        <div className="space-y-4">
          {createdResult && (
            <div className="bg-semantic-success-subtle border border-semantic-success/30 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hide-on-print">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-semantic-success-dark shrink-0" />
                <div>
                  <p className="text-caption font-semibold text-semantic-success-dark">
                    Multi-Project Subcontract Challan Issued Successfully!
                  </p>
                  <p className="text-small text-cool-gray">
                    Created {createdResult.projectCount} linked project order(s) under Gate Pass{" "}
                    <strong className="font-mono text-ink">{createdResult.documentNumber}</strong>. Store stock has been deducted atomically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="white" size="sm" onClick={handleResetWizard}>
                  Create Another
                </Button>
                {onSuccess && (
                  <Button variant="primary" size="sm" onClick={onSuccess}>
                    View Outsource Register
                  </Button>
                )}
              </div>
            </div>
          )}

          <AuthenticSubcontractPoDocument
            order={previewOrders[0]}
            orders={previewOrders}
            project={previewOrders[0]?.project}
            onBack={() => {
              if (createdResult && onSuccess) {
                onSuccess();
              } else {
                setStep(2);
              }
            }}
            onSave={createdResult ? undefined : handleConfirmIssue}
            isSaving={isSaving}
            saved={!!createdResult}
            saveLabel={`Confirm & Issue Challan (${selectedProjectIds.length} Project${selectedProjectIds.length === 1 ? "" : "s"})`}
          />
        </div>
      )}
    </div>
  );
}
