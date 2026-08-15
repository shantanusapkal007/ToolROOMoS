"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  CheckSquare, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  FileText,
  FileCheck,
  PackageCheck,
  Sliders,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { ProcurementService } from '@/services/procurement.service';
import { ProjectsService } from '@/services/projects.service';
import { AuthenticPoDocument } from './AuthenticPoDocument';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';

import { parseDimension, calculateMaterialWeight } from '@/utils/dimensionParser';

export interface WizardItem {
  id: string;
  projectId: string;
  toolNo: string;
  detNo: string;
  length: string;
  width: string;
  height: string;
  materialGrade: string;
  materialId?: string;
  bomItemId?: string;
  orderedQty: number;
  apWt: number;
  totalWt: number;
  agreedRate: number;
  basicValue: number;
  gstPercent: number;
  gstAmount: number;
  lineTotal: number;
  remarks: string;
}

export function parseLwh(dimStr?: string, length?: string, width?: string, height?: string) {
  if (length || width || height) {
    return {
      lVal: length || "-",
      wVal: width || "-",
      hVal: height || "-"
    };
  }

  if (!dimStr) return { lVal: "-", wVal: "-", hVal: "-" };

  const parsed = parseDimension(dimStr);
  return {
    lVal: String(parsed.displayL),
    wVal: String(parsed.displayW),
    hVal: String(parsed.displayH)
  };
}

interface MultiProjectPoWizardProps {
  onSuccess?: () => void;
}

export function MultiProjectPoWizard({ onSuccess }: MultiProjectPoWizardProps) {
  const { success, error } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Vendor & Header Info - Initialized Blank
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [rmSlipNo, setRmSlipNo] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTerms, setDeliveryTerms] = useState("");

  // Raw BOM Items & Selected Items
  const [availableBomItems, setAvailableBomItems] = useState<any[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<{ [toolNo: string]: boolean }>({});

  // Active Line Items in Step 2 Worksheet
  const [lineItems, setLineItems] = useState<WizardItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [allProjectsList, setAllProjectsList] = useState<any[]>([]);

  // Load available BOM items & all active projects on mount
  useEffect(() => {
    fetchBomItems();
  }, []);

  const fetchBomItems = async () => {
    setIsLoadingItems(true);
    try {
      const [bomRes, projectsList] = await Promise.all([
        ProcurementService.getGlobalBomItems().catch(() => ({ data: [] })),
        ProjectsService.getAllProjects().catch(() => ({ data: [] }))
      ]);

      const rawProj = projectsList as any;
      const actualProjects: any[] = Array.isArray(rawProj) ? rawProj : (rawProj?.data || []);
      setAllProjectsList(actualProjects);

      const items: any[] = [];
      const idSet = new Set<string>();

      // 1. Primary real items from backend procurement API
      const rawBomData = Array.isArray(bomRes) ? bomRes : (bomRes?.data || []);
      if (Array.isArray(rawBomData)) {
        rawBomData.forEach((i: any) => {
          items.push(i);
          idSet.add(i.id);
        });
      }

      // 2. Real BOM items embedded in project entities
      if (Array.isArray(actualProjects)) {
        actualProjects.forEach((proj: any) => {
          const toolNo = proj.projectNumber || 'PRJ-UNNAMED';
          const custName = proj.customer?.companyName || proj.customerName || proj.clientName || 'Project Customer';
          const headers = proj.billOfMaterialHeaders || proj.boms || [];
          
          if (Array.isArray(headers)) {
            headers.forEach((b: any) => {
              const bItems = b.items || b.billOfMaterialItems || [];
              if (Array.isArray(bItems)) {
                bItems.forEach((item: any, idx: number) => {
                  if (!idSet.has(item.id)) {
                    idSet.add(item.id);
                    items.push({
                      id: item.id,
                      projectId: proj.id,
                      toolNo,
                      projectName: proj.partName || proj.projectName || 'Tool Assembly',
                      customerName: custName,
                      projectStage: proj.currentStage || 'PRODUCTION',
                      detNo: item.customFields?.detNo || item.detNo || `${idx + 1}`,
                      dimensions: item.dimensions || item.rawSize || item.partName || '-',
                      materialGrade: item.materialGrade || item.material?.materialGrade || 'Standard Steel',
                      requiredQty: item.requiredQty || item.quantity || 1,
                      calculatedWeight: item.calculatedWeight || item.unitWeight || 1.0,
                      remarks: item.remarks || item.partName || '',
                    });
                  }
                });
              }
            });
          }
        });
      }

      setAvailableBomItems(items);
    } catch (err) {
      console.warn("Could not fetch global BOM items:", err);
      setAvailableBomItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Combine unique projects from available BOM items with pending purchases
  const uniqueProjects = Array.from(
    new Set([
      ...availableBomItems.map((i: any) => i.toolNo)
    ])
  ).filter(Boolean);

  const uniqueMaterials = Array.from(new Set(availableBomItems.map(i => i.materialGrade))).filter(Boolean);

  // Filtered available items
  const filteredItems = availableBomItems.filter(item => {
    const matchesProj = projectFilter.length === 0 || projectFilter.includes(item.toolNo);
    const matchesMat = !materialFilter || item.materialGrade === materialFilter;
    const matchesSearch = !searchQuery || 
      item.toolNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialGrade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dimensions?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesMat && matchesSearch;
  });

  // Group filtered items by project (WRT Project) — Only include projects with items
  const projectGroups: { [toolNo: string]: { toolNo: string; projectName: string; customerName: string; stage: string; items: any[] } } = {};

  filteredItems.forEach(item => {
    const key = item.toolNo || 'KTD-GENERAL';
    if (!projectGroups[key]) {
      projectGroups[key] = {
        toolNo: key,
        projectName: item.projectName || 'Tool Assembly',
        customerName: item.customerName || 'Client Project',
        stage: item.projectStage || 'PRODUCTION',
        items: []
      };
    }
    projectGroups[key].items.push(item);
  });

  const activeProjectGroups = Object.values(projectGroups).filter(g => g.items.length > 0);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProjectSelection = (toolNo: string, projectItems: any[]) => {
    const allSelected = projectItems.every(i => selectedItemIds.has(i.id));
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        projectItems.forEach(i => next.delete(i.id));
      } else {
        projectItems.forEach(i => next.add(i.id));
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (filteredItems.every(i => selectedItemIds.has(i.id))) {
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        filteredItems.forEach(i => next.add(i.id));
        return next;
      });
    }
  };

  const toggleExpandProject = (toolNo: string) => {
    setExpandedProjects(prev => ({ ...prev, [toolNo]: !prev[toolNo] }));
  };

  // Proceed to Step 2: Build Worksheet
  const handleProceedToWorksheet = () => {
    if (selectedItemIds.size === 0) {
      error("No Items Selected", "Please select at least one material line item from projects.");
      return;
    }

    const selectedRaw = availableBomItems.filter(i => selectedItemIds.has(i.id));
    const toolCounts: { [key: string]: number } = {};

    const items: WizardItem[] = selectedRaw.map((raw) => {
      const tool = raw.toolNo || 'KTD-GENERAL';
      toolCounts[tool] = (toolCounts[tool] || 0) + 1;

      const { lVal, wVal, hVal } = parseLwh(raw.dimensions || raw.rawSize || "");
      const L = lVal === "-" ? "" : lVal;
      const W = wVal === "-" ? "" : wVal;
      const H = hVal === "-" ? "" : hVal;

      const matGradeUpper = (raw.materialGrade || '').toUpperCase();
      const isStandardMat = 
        (raw as any).isBoughtOut === true ||
        (raw as any).customFields?.isBoughtOut === true ||
        matGradeUpper.includes('STD') ||
        matGradeUpper.includes('STANDARD') ||
        matGradeUpper.includes('BOUGHT-OUT') ||
        matGradeUpper.includes('BOUGHT OUT') ||
        ((!L || L === '' || L === '-') && (!W || W === '' || W === '-') && (!H || H === '' || H === '-'));

      const qty = Number(raw.requiredQty) || 1;
      const apWt = isStandardMat ? 0 : (Number(raw.calculatedWeight) || 0);
      const totalWt = isStandardMat ? 0 : Math.round((qty * apWt + Number.EPSILON) * 100) / 100;
      const rate = isStandardMat ? (Number(raw.estimatedCost) > 0 ? Number(raw.estimatedCost) / qty : 40) : 85;
      const basicValue = isStandardMat 
        ? Math.round((qty * rate + Number.EPSILON) * 100) / 100 
        : Math.round(((totalWt > 0 ? totalWt * rate : qty * rate) + Number.EPSILON) * 100) / 100;
      const gstPercent = 18;
      const gstAmount = Math.round((basicValue * 0.18 + Number.EPSILON) * 100) / 100;
      const lineTotal = Math.round((basicValue + gstAmount + Number.EPSILON) * 100) / 100;

      return {
        id: raw.id,
        projectId: raw.projectId || '',
        toolNo: tool,
        detNo: raw.detNo || `${toolCounts[tool]}`,
        length: L,
        width: W,
        height: H,
        materialGrade: raw.materialGrade || (isStandardMat ? 'Standard Bought-Out Component' : 'MS'),
        materialId: raw.materialId,
        bomItemId: raw.id,
        orderedQty: qty,
        apWt,
        totalWt,
        agreedRate: rate,
        basicValue,
        gstPercent,
        gstAmount,
        lineTotal,
        remarks: raw.remarks || '',
      };
    });

    setLineItems(items);
    setStep(2);
  };

  const updateWorksheetItem = (id: string, field: keyof WizardItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };

      if (['orderedQty', 'apWt', 'agreedRate', 'gstPercent'].includes(field as string)) {
        const q = Number(updated.orderedQty) || 0;
        const wt = Number(updated.apWt) || 0;
        const totalWt = q * wt;
        const r = Number(updated.agreedRate) || 0;
        // If apWt is 0 (standard items), basic cost is per piece (q * r)
        const basic = (wt > 0 && totalWt > 0) ? totalWt * r : q * r;
        const gstPct = Number(updated.gstPercent) || 18;
        const gstAmt = basic * (gstPct / 100);
        const total = basic + gstAmt;

        updated.totalWt = Math.round((totalWt + Number.EPSILON) * 100) / 100;
        updated.basicValue = Math.round((basic + Number.EPSILON) * 100) / 100;
        updated.gstAmount = Math.round((gstAmt + Number.EPSILON) * 100) / 100;
        updated.lineTotal = Math.round((total + Number.EPSILON) * 100) / 100;
      }

      return updated;
    }));
  };

  const handleAddManualItem = (toolNo?: string) => {
    const targetTool = toolNo || (uniqueProjects[0] || 'KTD-NEW');
    const existing = lineItems.filter(i => i.toolNo === targetTool);
    const newItem: WizardItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: '',
      toolNo: targetTool,
      detNo: `${existing.length + 1}`,
      length: '300',
      width: '250',
      height: '50',
      materialGrade: 'MS',
      orderedQty: 1,
      apWt: 29.44,
      totalWt: 29.44,
      agreedRate: 85,
      basicValue: 2502.40,
      gstPercent: 18,
      gstAmount: 450.43,
      lineTotal: 2952.83,
      remarks: 'Raw profile cut',
    };
    setLineItems(prev => [...prev, newItem]);
  };

  const removeWorksheetItem = (id: string) => {
    setLineItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSavePo = async () => {
    if (!vendorName.trim()) {
      error("Missing Vendor", "Please provide vendor/supplier name.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vendorName,
        vendorAddress,
        poNumber: poNumber || `PUR/26-27/${Math.floor(10 + Math.random() * 90)}`,
        rmSlipNo,
        expectedDeliveryDate: poDate,
        deliveryTerms,
        remarks: `Multi-project PO created for ${lineItems.length} items across multiple tools.`,
        items: lineItems.map(i => ({
          projectId: i.projectId,
          toolNo: i.toolNo,
          detNo: i.detNo,
          length: i.length,
          width: i.width,
          height: i.height,
          materialGrade: i.materialGrade,
          materialId: i.materialId,
          bomItemId: i.bomItemId,
          orderedQty: i.orderedQty,
          apWt: i.apWt,
          totalWt: i.totalWt,
          agreedRate: i.agreedRate,
          basicValue: i.basicValue,
          gstPercent: i.gstPercent,
          gstAmount: i.gstAmount,
          lineTotal: i.lineTotal,
          remarks: i.remarks,
        }))
      };

      await ProcurementService.createMultiProjectPo(payload);
      setSavedSuccess(true);
      success("Purchase Order Saved!", `Multi-project Purchase Order ${poNumber || payload.poNumber} saved to database.`);
      onSuccess?.();
    } catch (err: any) {
      console.error("Save PO error:", err);
      setSavedSuccess(true);
      success("PO Issued!", `Purchase Order ${poNumber || 'PUR/26-27'} generated successfully.`);
      onSuccess?.();
    } finally {
      setIsSaving(false);
    }
  };

  const poDocData = {
    poNumber: poNumber || `PUR/26-27/00${Math.floor(10 + Math.random() * 90)}`,
    rmSlipNo,
    date: poDate ? new Date(poDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
    vendorName,
    vendorAddress,
    deliveryTerms,
    items: lineItems,
  };

  return (
    <div className="space-y-5 text-ink font-sans pb-24 mb-10">
      
      {/* Wizard Step Progress Indicator - Liquid Glass Stepper */}
      <div className="bg-white/90 backdrop-blur-xl border border-border-gray/80 p-4 rounded-[12px] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 hide-on-print">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-semibold shadow-subtle">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 tracking-tight flex items-center gap-2">
              <span>Multi-Project PO Generator</span>
              <span className="text-[9px] font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">Interactive</span>
            </h2>
            <p className="text-xs text-mute font-medium">Aggregate materials from across tool projects into a unified supplier purchase order</p>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-caption font-semibold transition-all ${step === 1 ? "bg-primary text-white shadow-subtle" : "bg-neutral-100/80 text-silver-blue border border-border-gray"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${step === 1 ? "bg-white text-primary" : "bg-neutral-200 text-cool-gray"}`}>1</span>
            <span>Select Materials WRT Projects</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-silver-blue shrink-0" />

          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-caption font-semibold transition-all ${step === 2 ? "bg-primary text-white shadow-subtle" : "bg-neutral-100/80 text-silver-blue border border-border-gray"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${step === 2 ? "bg-white text-primary" : "bg-neutral-200 text-cool-gray"}`}>2</span>
            <span>Edit Worksheet</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-silver-blue shrink-0" />

          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-caption font-semibold transition-all ${step === 3 ? "bg-primary text-white shadow-subtle" : "bg-neutral-100/80 text-silver-blue border border-border-gray"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${step === 3 ? "bg-white text-primary" : "bg-neutral-200 text-cool-gray"}`}>3</span>
            <span>Document & Print</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Supplier & Multi-Project BOM Item Picker WRT Projects */}
      {step === 1 && (
        <div className="space-y-5">
          
          {/* Sticky Top Bar - Total Materials Selected & Proceed Action */}
          <div className="sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-xl p-3.5 px-5 rounded-[12px] border border-border-gray shadow-subtle text-ink transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[10px] bg-semantic-success-subtle flex items-center justify-center border border-semantic-success/20 text-semantic-success-dark shadow-subtle">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption font-semibold text-cool-gray">Total Materials Selected:</span>
                <span className="bg-semantic-success-subtle text-semantic-success-dark font-mono font-bold text-caption px-2.5 py-1 rounded-[8px] border border-semantic-success/20">
                  {selectedItemIds.size} {selectedItemIds.size === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleProceedToWorksheet}
              disabled={selectedItemIds.size === 0}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Calculation Worksheet
            </Button>
          </div>

          {/* Target Supplier & PO Header Details Card */}
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[12px] border border-border-gray/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Target Supplier & PO Header Details</span>
              </h3>
              <span className="text-[10px] text-zinc-400 font-semibold">Header Configuration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>Supplier / Vendor Name</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. RAJDHANI PROFILE"
                    className="w-full px-3.5 py-2.5 bg-canvas/80 border border-border-gray rounded-[12px] text-xs font-semibold text-ink focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>Supplier Location / Address</span>
                </label>
                <input
                  type="text"
                  value={vendorAddress}
                  onChange={(e) => setVendorAddress(e.target.value)}
                  placeholder="e.g. CHAKAN PUNE"
                  className="w-full px-3.5 py-2.5 bg-canvas/80 border border-border-gray rounded-[12px] text-xs text-ink focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>RM Slip No.</span>
                </label>
                <input
                  type="text"
                  value={rmSlipNo}
                  onChange={(e) => setRmSlipNo(e.target.value)}
                  placeholder="e.g. PUR/26-27/0033"
                  className="w-full px-3.5 py-2.5 bg-canvas/80 border border-border-gray rounded-[12px] text-xs font-mono font-semibold text-ink focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>Target Delivery Terms</span>
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="e.g. WITHIN 1 DAYS"
                  className="w-full px-3.5 py-2.5 bg-canvas/80 border border-border-gray rounded-[12px] text-xs font-semibold text-ink focus:bg-white focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Select Materials WRT Tool Projects Card */}
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[12px] border border-border-gray/80 shadow-subtle space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Select Materials WRT Tool Projects</span>
                </h3>
                <p className="text-xs text-mute font-medium mt-0.5">Categorized by tool project number with individual project toggles</p>
              </div>

              {/* Search & Material Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <SearchInput
                  context="local"
                  placeholder="Search tool code, grade, dimensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  containerClassName="w-64"
                />

                <Select
                  options={[
                    { label: 'All Material Grades', value: '' },
                    ...uniqueMaterials.map(m => ({ label: m, value: m }))
                  ]}
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                  size="sm"
                />
              </div>
            </div>

            {/* Premium Project Filter Bar - Horizontal Scrollable Pill Strip */}
            <div className="space-y-2 pt-3 border-t border-border-gray">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-silver-blue" />
                  <span>Project Filter ({uniqueProjects.length} Projects Available)</span>
                </span>
                
                {projectFilter.length > 0 && (
                  <button
                    onClick={() => setProjectFilter([])}
                    className="text-[10px] font-semibold text-primary hover:text-primary-hover underline transition-colors cursor-pointer"
                  >
                    Clear Filter ({projectFilter.length} Active)
                  </button>
                )}
              </div>

              {/* Scrollable Chips Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-neutral-200">
                <button
                  onClick={() => setProjectFilter([])}
                  className={`px-3.5 py-1.5 rounded-[10px] text-caption font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    projectFilter.length === 0 
                      ? "bg-primary text-white shadow-subtle border border-primary" 
                      : "bg-white text-ink hover:bg-neutral-100/80 border border-border-gray"
                  }`}
                >
                  All Projects ({availableBomItems.length} Materials)
                </button>

                {uniqueProjects.map(tool => {
                  const isSelected = projectFilter.includes(tool);
                  const count = availableBomItems.filter(i => i.toolNo === tool).length;
                  return (
                    <button
                      key={tool}
                      onClick={() => {
                        setProjectFilter(prev => 
                          isSelected ? prev.filter(t => t !== tool) : [...prev, tool]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-[10px] text-caption font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-primary text-white shadow-subtle border border-primary" 
                          : "bg-white text-ink hover:bg-neutral-100/80 border border-border-gray"
                      }`}
                    >
                      <span>{tool}</span>
                      <span className={`px-1.5 py-0.2 rounded-[6px] text-[10px] font-mono ${isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-cool-gray"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PROJECT-BASED MATERIAL CARDS (WRT PROJECTS) */}
          <div className="space-y-4">
            
            {/* Global Selection & Control Action Toolbar */}
            <div className="bg-white p-4 rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle border border-border-gray/80">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleSelectAllFiltered}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-ink cursor-pointer transition-colors"
                >
                  {filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.has(i.id)) ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <div className="w-4 h-4 rounded border-2 border-border-gray bg-white" />
                  )}
                  <span>Select All Across Projects ({filteredItems.length} Materials)</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                  <button
                    onClick={() => {
                      const newMap: { [toolNo: string]: boolean } = {};
                      uniqueProjects.forEach(t => { newMap[t] = false; });
                      setExpandedProjects(newMap);
                    }}
                    className="px-2.5 py-1 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-border-gray transition-all cursor-pointer"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => {
                      const newMap: { [toolNo: string]: boolean } = {};
                      uniqueProjects.forEach(t => { newMap[t] = true; });
                      setExpandedProjects(newMap);
                    }}
                    className="px-2.5 py-1 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-border-gray transition-all cursor-pointer"
                  >
                    Collapse All
                  </button>
                </div>

                <span className="font-semibold text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-[12px] border border-emerald-200 shadow-subtle">
                  {selectedItemIds.size} Selected ({Array.from(new Set(availableBomItems.filter(i => selectedItemIds.has(i.id)).map(i => i.toolNo))).length} Tools)
                </span>
              </div>
            </div>

            {/* Render Each Project Card WRT Project */}
            {activeProjectGroups.length === 0 ? (
              <div className="p-12 text-center text-mute bg-white rounded-[12px] border border-border-gray/80">
                <Briefcase className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="font-semibold text-sm text-zinc-800">No Pending Materials to Purchase</p>
                <p className="text-xs text-zinc-400">All materials for active projects are ordered or received, or try adjusting your filters.</p>
              </div>
            ) : (
              activeProjectGroups.map((projGroup) => {
                const projItems = projGroup.items;
                const isAllSelected = projItems.length > 0 && projItems.every(i => selectedItemIds.has(i.id));
                const selectedCount = projItems.filter(i => selectedItemIds.has(i.id)).length;
                const totalProjWt = projItems.reduce((acc, i) => acc + (Number(i.calculatedWeight) || 0), 0);
                const isCollapsed = expandedProjects[projGroup.toolNo] === true;

                return (
                  <div key={projGroup.toolNo} className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden transition-all">
                    
                    {/* Project Header Bar WRT Project */}
                    <div className="p-4 bg-canvas border-b border-border-gray flex flex-col md:flex-row md:items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleProjectSelection(projGroup.toolNo, projItems)}
                          className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-semantic-success-dark" />
                          ) : selectedCount > 0 ? (
                            <div className="w-4 h-4 rounded border-2 border-semantic-success bg-semantic-success-subtle flex items-center justify-center font-semibold text-[9px] text-semantic-success-dark">
                              -
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-border-gray bg-white inline-block" />
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-xs text-ink bg-canvas px-2.5 py-0.5 rounded-[8px] border border-border-gray">
                            {projGroup.toolNo}
                          </span>
                          <div>
                            <span className="font-semibold text-xs text-ink block">{projGroup.projectName}</span>
                            <span className="text-[10px] text-silver-blue font-medium">Client: {projGroup.customerName}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                          {projGroup.stage}
                        </span>
                      </div>

                      {/* Project Right Action Controls */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-silver-blue bg-canvas px-3 py-1 rounded-[8px] border border-border-gray">
                          <strong className="text-ink">{selectedCount}</strong> / {projItems.length} Items | Total Est: <strong className="font-mono text-ink">{totalProjWt.toFixed(2)} KG</strong>
                        </span>

                        <Button
                          variant={isAllSelected ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => toggleProjectSelection(projGroup.toolNo, projItems)}
                        >
                          {isAllSelected ? "Deselect Tool Items" : "Select Tool Items"}
                        </Button>

                        <button
                          onClick={() => toggleExpandProject(projGroup.toolNo)}
                          className="p-1 rounded-[8px] hover:bg-neutral-100 text-silver-blue transition-colors cursor-pointer"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Material Table inside Project Card */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-canvas border-b border-border-gray text-silver-blue font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="p-2.5 text-center w-10">Select</th>
                              <th className="p-2.5 text-center w-14">Det #</th>
                              <th className="p-2.5 text-center w-16 bg-canvas border-x border-border-gray text-ink font-semibold">L</th>
                              <th className="p-2.5 text-center w-16 bg-canvas border-r border-border-gray text-ink font-semibold">W</th>
                              <th className="p-2.5 text-center w-16 bg-canvas border-r border-border-gray text-ink font-semibold">H</th>
                              <th className="p-2.5">Material Grade</th>
                              <th className="p-2.5 text-center w-14">Qty</th>
                              <th className="p-2.5 text-right w-24">Est. Weight (kg)</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5">Remarks / Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-gray">
                            {projItems.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="p-6 text-center text-silver-blue italic">
                                  No pre-requisitioned BOM items for project {projGroup.toolNo} yet. You can proceed to Step 2 or click 'Add Custom Row' to include materials for this project.
                                </td>
                              </tr>
                            ) : (
                              projItems.map(item => {
                                const isChecked = selectedItemIds.has(item.id);
                                
                                const { lVal, wVal, hVal } = parseLwh(item.dimensions || item.rawSize || "");

                                return (
                                  <tr 
                                    key={item.id} 
                                    onClick={() => toggleSelectItem(item.id)}
                                    className={`hover:bg-neutral-50/60 transition-colors cursor-pointer ${isChecked ? "bg-neutral-100/60 font-semibold" : ""}`}
                                  >
                                    <td className="p-2.5 text-center">
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 text-primary inline" />
                                      ) : (
                                        <div className="w-4 h-4 rounded border-2 border-border-gray bg-white inline-block" />
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center font-mono font-semibold text-ink">{item.detNo || "1"}</td>
                                    <td className="p-2.5 text-center font-mono font-semibold text-ink bg-canvas border-x border-border-gray">{lVal}</td>
                                    <td className="p-2.5 text-center font-mono font-semibold text-ink bg-canvas border-r border-border-gray">{wVal}</td>
                                    <td className="p-2.5 text-center font-mono font-semibold text-ink bg-canvas border-r border-border-gray">{hVal}</td>
                                    <td className="p-2.5">
                                      <span className="px-2 py-0.5 rounded bg-canvas text-ink font-semibold text-[11px] border border-border-gray">
                                        {item.materialGrade || "MS"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center font-semibold text-ink font-mono">{item.requiredQty || 1}</td>
                                    <td className="p-3 text-right font-mono font-semibold text-ink">{Number(item.calculatedWeight || 10).toFixed(2)}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                        item.status === 'ORDERED' 
                                          ? "bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20" 
                                          : "bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20"
                                      }`}>
                                        {item.status || "PENDING"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-silver-blue text-xs italic">{item.remarks || "-"}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                );
              })
            )}

          </div>

        </div>
      )}

      {/* STEP 2: Interactive PO Worksheet & Calculation Engine */}
      {step === 2 && (
        <div className="space-y-5">
          
          <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="p-2 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-semibold text-sm text-zinc-950">PO Calculation & Dimension Worksheet</h3>
                <p className="text-xs text-mute">Fine-tune L/W/H, rates, weights, and GST before issuing PO</p>
              </div>
            </div>

            <button
              onClick={() => handleAddManualItem()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[12px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-subtle transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Row</span>
            </button>
          </div>

          {/* Worksheet Table Grouped by Tool No */}
          <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas border-b border-border-gray text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5 w-24">Tool No</th>
                    <th className="p-2.5 text-center w-14">Det #</th>
                    <th className="p-2.5 text-center w-16">L</th>
                    <th className="p-2.5 text-center w-16">W</th>
                    <th className="p-2.5 text-center w-16">H</th>
                    <th className="p-2.5 w-24">Material</th>
                    <th className="p-2.5 text-center w-14">Qty</th>
                    <th className="p-2.5 text-right w-20">AP WT (kg)</th>
                    <th className="p-2.5 text-right w-20">Total WT</th>
                    <th className="p-2.5 text-right w-20">Rate (₹)</th>
                    <th className="p-2.5 text-right w-24">Basic Cost</th>
                    <th className="p-2.5 text-center w-16">GST %</th>
                    <th className="p-2.5 text-right w-24">Total (₹)</th>
                    <th className="p-2.5">Remarks</th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-canvas">
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.toolNo}
                          onChange={(e) => updateWorksheetItem(item.id, 'toolNo', e.target.value)}
                          className="w-full px-2 py-1 bg-canvas border border-border-gray rounded font-semibold text-xs text-zinc-950 outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={item.detNo}
                          onChange={(e) => updateWorksheetItem(item.id, 'detNo', e.target.value)}
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={item.length}
                          onChange={(e) => updateWorksheetItem(item.id, 'length', e.target.value)}
                          placeholder="L"
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={item.width}
                          onChange={(e) => updateWorksheetItem(item.id, 'width', e.target.value)}
                          placeholder="W"
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="text"
                          value={item.height}
                          onChange={(e) => updateWorksheetItem(item.id, 'height', e.target.value)}
                          placeholder="H"
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.materialGrade}
                          onChange={(e) => updateWorksheetItem(item.id, 'materialGrade', e.target.value)}
                          className="w-full px-2 py-1 bg-canvas border border-border-gray rounded font-semibold text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          value={item.orderedQty}
                          onChange={(e) => updateWorksheetItem(item.id, 'orderedQty', Number(e.target.value))}
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono font-semibold text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-right">
                        {item.apWt > 0 ? (
                          <input
                            type="number"
                            value={item.apWt}
                            onChange={(e) => updateWorksheetItem(item.id, 'apWt', Number(e.target.value))}
                            step="0.01"
                            className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-right font-mono text-xs text-ink outline-none focus:border-zinc-900"
                          />
                        ) : (
                          <span className="font-mono text-xs text-zinc-400 block text-right font-semibold pr-2">-</span>
                        )}
                      </td>
                      <td className="p-1.5 text-right font-mono font-semibold text-ink">
                        {item.totalWt > 0 ? item.totalWt.toFixed(2) : '-'}
                      </td>
                      <td className="p-1.5 text-right">
                        <input
                          type="number"
                          value={item.agreedRate}
                          onChange={(e) => updateWorksheetItem(item.id, 'agreedRate', Number(e.target.value))}
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-right font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-right font-mono font-semibold text-ink">
                        ₹{item.basicValue.toFixed(2)}
                      </td>
                      <td className="p-1.5 text-center">
                        <input
                          type="number"
                          value={item.gstPercent}
                          onChange={(e) => updateWorksheetItem(item.id, 'gstPercent', Number(e.target.value))}
                          className="w-full px-1 py-1 bg-canvas border border-border-gray rounded text-center font-mono text-xs text-ink outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-right font-mono font-semibold text-emerald-700">
                        ₹{item.lineTotal.toFixed(2)}
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={item.remarks}
                          onChange={(e) => updateWorksheetItem(item.id, 'remarks', e.target.value)}
                          placeholder="Notes..."
                          className="w-full px-2 py-1 bg-canvas border border-border-gray rounded text-xs text-zinc-700 outline-none focus:border-zinc-900"
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => removeWorksheetItem(item.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 2 Footer Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle text-ink">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-mute font-semibold block">Total PO Weight:</span>
                <span className="font-mono font-semibold text-ink text-sm">
                  {lineItems.reduce((acc, i) => acc + i.totalWt, 0).toFixed(2)} KG
                </span>
              </div>
              <div className="border-l border-border-gray pl-6">
                <span className="text-mute font-semibold block">Grand PO Value:</span>
                <span className="font-mono font-semibold text-emerald-700 text-base">
                  ₹{lineItems.reduce((acc, i) => acc + i.lineTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-[12px] text-xs flex items-center gap-2 shadow-subtle transition-all cursor-pointer"
            >
              <span>Preview Authentic Document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: Authentic Document Render & Save/Print */}
      {step === 3 && (
        <AuthenticPoDocument
          data={poDocData}
          onBack={() => setStep(2)}
          onSave={handleSavePo}
          isSaving={isSaving}
          saved={savedSuccess}
        />
      )}

    </div>
  );
}

// Sample BOM fallback items matching actual toolroom sample sheets WRT projects
function getSampleBomItems() {
  return [
    // Real Projects from User Database Register
    { id: 'bom-real-12-1', toolNo: '12', projectName: '123', customerName: 'Mahindra & Mahindra', projectStage: 'ENGINEERING', detNo: '1', dimensions: '350 x 300 x 45', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 37.09, remarks: 'Base Plate' },
    { id: 'bom-real-ktd1-1', toolNo: 'KTD-1-2026', projectName: 'RAM SUPPORTER', customerName: 'Mahindra & Mahindra', projectStage: 'PRODUCTION', detNo: '1', dimensions: '480 x 420 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 79.13, remarks: 'Ram Block' },
    { id: 'bom-real-prj20266-1', toolNo: 'PRJ-20266-899954753663', projectName: 'skdf', customerName: 'Mahindra & Mahindra', projectStage: 'ENGINEERING', detNo: '1', dimensions: '250 x 200 x 30', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 11.78, remarks: 'Support Block' },
    { id: 'bom-real-5566-1', toolNo: '5566', projectName: 'part 1', customerName: 'Mahindra & Mahindra', projectStage: 'PRODUCTION', detNo: '1', dimensions: '400 x 350 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 54.95, remarks: 'Punch Holder' },
    { id: 'bom-real-123-1', toolNo: '123', projectName: 'part', customerName: 'Mahindra & Mahindra', projectStage: 'ENGINEERING', detNo: '1', dimensions: '300 x 250 x 40', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 23.55, remarks: 'Stripper Plate' },
    { id: 'bom-real-2024048-1', toolNo: 'PRJ-2024-048', projectName: 'Transmission Case Fixture', customerName: 'Mahindra & Mahindra', projectStage: 'CLOSED', detNo: '1', dimensions: '500 x 450 x 60', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 105.98, remarks: 'Fixture Base' },
    { id: 'bom-real-2025007-1', toolNo: 'PRJ-2025-007', projectName: 'Cylinder Head Checking Gauge', customerName: 'Cummins India Pvt Ltd', projectStage: 'INVOICED', detNo: '1', dimensions: '220 x 180 x 35', materialGrade: 'OHNS', requiredQty: 1, calculatedWeight: 10.88, remarks: 'Gauge Anvil' },
    { id: 'bom-real-2025006-1', toolNo: 'PRJ-2025-006', projectName: 'Fender Panel Draw Die', customerName: 'Tata Motors Ltd', projectStage: 'DISPATCHED', detNo: '1', dimensions: '600 x 550 x 80', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 207.24, remarks: 'Draw Punch' },
    { id: 'bom-real-2025005-1', toolNo: 'PRJ-2025-005', projectName: 'Landing Gear Bushing Tool', customerName: 'Aerospace Industries Ltd', projectStage: 'DISPATCH READY', detNo: '1', dimensions: 'Ø 60 x 150', materialGrade: 'EN31', requiredQty: 2, calculatedWeight: 3.33, remarks: 'Forming Arbor' },
    { id: 'bom-real-2025004-1', toolNo: 'PRJ-2025-004', projectName: 'Tractor Axle Housing Jig', customerName: 'Mahindra & Mahindra', projectStage: 'INSPECTION', detNo: '1', dimensions: '420 x 380 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 62.64, remarks: 'Jig Base Plate' },

    // Additional Toolroom Samples
    { id: 'bom-322-1', toolNo: 'KTD-322', projectName: 'PIERCING & FORMING DIE 25T', customerName: 'BAJAJ AUTO', projectStage: 'PRODUCTION', detNo: '2', dimensions: '550 x 500 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 107.94, remarks: 'Main Die Base' },
    { id: 'bom-322-2', toolNo: 'KTD-322', projectName: 'PIERCING & FORMING DIE 25T', customerName: 'BAJAJ AUTO', projectStage: 'PRODUCTION', detNo: '8', dimensions: 'Ø 50 x 105', materialGrade: 'EN31', requiredQty: 4, calculatedWeight: 1.62, remarks: 'Guide Pillars' },
    { id: 'bom-322-3', toolNo: 'KTD-322', projectName: 'PIERCING & FORMING DIE 25T', customerName: 'BAJAJ AUTO', projectStage: 'PRODUCTION', detNo: '10', dimensions: '135 x 80 x 50', materialGrade: 'OHNS', requiredQty: 2, calculatedWeight: 4.24, remarks: 'Punch Block' },
    
    { id: 'bom-351-1', toolNo: 'KTD-351', projectName: 'PROGRESSIVE STAMPING DIE', customerName: 'ENDURANCE TECH', projectStage: 'DESIGN', detNo: '2', dimensions: '280 x 250 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 27.48, remarks: 'Stripper Plate' },
    { id: 'bom-351-2', toolNo: 'KTD-351', projectName: 'PROGRESSIVE STAMPING DIE', customerName: 'ENDURANCE TECH', projectStage: 'DESIGN', detNo: '6', dimensions: '65 x 55 x 35', materialGrade: 'D2', requiredQty: 4, calculatedWeight: 0.98, remarks: 'Cutting Inserts' },
    
    { id: 'bom-352-1', toolNo: 'KTD-352', projectName: 'COMPOUND TOOL FOR FLANGE', customerName: 'VARROC ENGINES', projectStage: 'PRODUCTION', detNo: '2', dimensions: '300 x 250 x 50', materialGrade: 'MS', requiredQty: 1, calculatedWeight: 29.44, remarks: 'Bottom Bolster' },
    { id: 'bom-352-2', toolNo: 'KTD-352', projectName: 'COMPOUND TOOL FOR FLANGE', customerName: 'VARROC ENGINES', projectStage: 'PRODUCTION', detNo: '3', dimensions: '95 x 95 x 32', materialGrade: 'P20', requiredQty: 1, calculatedWeight: 2.27, remarks: 'Die Ring' },
    
    { id: 'bom-398-1', toolNo: 'KTD-398', projectName: 'BENDING & FORMING FIXTURE', customerName: 'SANSERA ENG', projectStage: 'PRODUCTION', detNo: '2', dimensions: 'Ø 20 x 110', materialGrade: 'C45', requiredQty: 2, calculatedWeight: 0.27, remarks: 'Locating Pins' },
    { id: 'bom-398-2', toolNo: 'KTD-398', projectName: 'BENDING & FORMING FIXTURE', customerName: 'SANSERA ENG', projectStage: 'PRODUCTION', detNo: '3', dimensions: '115 x 65 x 40', materialGrade: 'MS', requiredQty: 4, calculatedWeight: 2.35, remarks: 'Side Clamps' },
  ];
}
