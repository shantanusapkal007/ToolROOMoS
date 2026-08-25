"use client";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx-js-style';
import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';
import { exportPremiumBOM } from '@/utils/exportPremiumBOM';
import { parseDimension, calculateMaterialWeight, formatCanonicalDimension } from '@/utils/dimensionParser';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2, 
  Eye, 
  Sliders, 
  X, 
  Maximize, 
  ShoppingCart, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Lock, 
  Tag, 
  RefreshCw, 
  Layers, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../ui/Toast';
import { useProjectBOM } from '@/hooks/useEngineering';
import { useMasterData, masterDataKeys } from '@/hooks/useMasterData';
import { MasterDataService } from '@/services/master-data.service';

interface BomConverterProps {
  projectId: string;
  project: any;
  materials?: any[];
  onSaveBOM?: (rows: any[]) => void;
  onProceedToPO?: (rows: any[]) => void;
}

export interface ConfirmedMaterialRate {
  materialName: string;
  matchedMaterialId: string | null;
  matchedMaterialName: string | null;
  masterRate: number | null;
  currentRate: number | null;
  defaultUom: string;
  density: number;
  gstPercent: number;
  hsnCode?: string | null;
  isNew: boolean;
  status: 'VALID' | 'CHANGED' | 'NEW' | 'MISSING';
  isConfirmed: boolean;
}

export interface ParsedBOMRow {
  id: string;
  toolNo?: string;
  srNo: string | number;
  partName: string;
  description: string;
  quantity: number;
  finishSize: string;
  finishL?: string | number;
  finishW?: string | number;
  finishH?: string | number;
  rawMaterialSize: string;
  materialInput: string;
  catalogSize: string;
  stockSize: string;
  length: number | string;
  width: number | string;
  height: number | string;
  matchedMaterialId?: string | null;
  matchedMaterialName?: string | null;
  density?: number | null;
  rate?: number | null;
  unitCost?: number | null;
  apWeight?: number | null;
  totalWeight?: number | null;
  basicCost?: number | null;
  hsnCode?: string | null;
  gstPercent?: number | null;
  isBoughtOut?: boolean;
  validationError?: string | null;
  remarks?: string;
}

export const BomConverter: React.FC<BomConverterProps> = ({ projectId, project, materials = [], onSaveBOM, onProceedToPO }) => {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();
  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsedMetadata, setParsedMetadata] = useState<{
    projectNumber?: string;
    customer?: string;
    releaseDate?: string;
  } | null>(null);
  const [rows, setRows] = useState<ParsedBOMRow[]>([]);
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [validationRun, setValidationRun] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'all' | 'errors' | 'valid'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Material Rate Confirmation State
  const [materialRates, setMaterialRates] = useState<Record<string, ConfirmedMaterialRate>>({});
  const [isRatesConfirmed, setIsRatesConfirmed] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMaterialForm, setNewMaterialForm] = useState<{
    materialCode: string;
    materialGrade: string;
    standardCost: number | '';
    defaultUom: string;
    density: number;
    gstPercent: number;
    hsnCode: string;
    isSaving: boolean;
  }>({
    materialCode: '',
    materialGrade: '',
    standardCost: '',
    defaultUom: 'KG',
    density: 7.85,
    gstPercent: 18,
    hsnCode: '',
    isSaving: false,
  });

  // Sign-off / Approval fields
  const [verifiedByDesigner, setVerifiedByDesigner] = useState<string>('');
  const [preparedBy, setPreparedBy] = useState<string>('DESIGN TEAM');
  const [checkedBy, setCheckedBy] = useState<string>('');
  const [authorisedSignatory, setAuthorisedSignatory] = useState<string>('');

  const { data: existingBom } = useProjectBOM(projectId);
  const { data: masterMaterialsRes = [] } = useMasterData('materials');
  
  const allMaterials = useMemo(() => {
    const mm = Array.isArray(masterMaterialsRes) ? masterMaterialsRes : (masterMaterialsRes as any)?.data || [];
    return mm.length > 0 ? mm : (materials || []);
  }, [masterMaterialsRes, materials]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const uniqueMaterialsKey = useMemo(() => {
    return rows.map(r => (r.materialInput || '').trim()).filter(Boolean).sort().join(':::');
  }, [rows]);

  // Synchronize Material Rate Confirmation with Unique Materials from Active BOM rows
  useEffect(() => {
    const uniqueMats = Array.from(
      new Set(rows.map(r => (r.materialInput || '').trim()).filter(Boolean))
    );

    if (uniqueMats.length === 0) {
      setMaterialRates(prev => (Object.keys(prev).length === 0 ? prev : {}));
      setIsRatesConfirmed(false);
      return;
    }

    setMaterialRates(prev => {
      let changed = false;
      const next: Record<string, ConfirmedMaterialRate> = {};

      uniqueMats.forEach(matName => {
        const prevEntry = prev[matName];
        const search = matName.toLowerCase();

        // Match against allMaterials
        const matchedMat = allMaterials.find((m: any) => 
          (prevEntry?.matchedMaterialId && m.id === prevEntry.matchedMaterialId) ||
          `${m.materialCode || ''} - ${m.materialGrade || m.materialName || ''}`.toLowerCase() === search ||
          m.materialCode?.toLowerCase() === search || 
          m.materialGrade?.toLowerCase() === search ||
          m.materialCode?.toLowerCase().includes(search) || 
          m.materialGrade?.toLowerCase().includes(search) ||
          (m.materialCode && search.includes(m.materialCode.toLowerCase()))
        ) || null;

        const masterRate = matchedMat && matchedMat.standardCost !== undefined && matchedMat.standardCost !== null
          ? Number(matchedMat.standardCost)
          : null;

        let currentRate: number | null = null;
        if (prevEntry && prevEntry.currentRate !== undefined && prevEntry.currentRate !== null && !isNaN(prevEntry.currentRate)) {
          currentRate = prevEntry.currentRate;
        } else if (masterRate !== null) {
          currentRate = masterRate;
        }

        const isNew = !matchedMat;
        let status: 'VALID' | 'CHANGED' | 'NEW' | 'MISSING' = 'VALID';

        if (currentRate === null || currentRate <= 0 || isNaN(currentRate)) {
          status = 'MISSING';
        } else if (isNew) {
          status = 'NEW';
        } else if (masterRate !== null && currentRate !== masterRate) {
          status = 'CHANGED';
        } else {
          status = 'VALID';
        }

        const entry: ConfirmedMaterialRate = {
          materialName: matName,
          matchedMaterialId: matchedMat ? matchedMat.id : (prevEntry?.matchedMaterialId || null),
          matchedMaterialName: matchedMat ? `${matchedMat.materialCode} - ${matchedMat.materialGrade}` : null,
          masterRate,
          currentRate,
          defaultUom: matchedMat?.defaultUom || prevEntry?.defaultUom || 'KG',
          density: matchedMat?.density ? Number(matchedMat.density) : (prevEntry?.density || 7.85),
          gstPercent: matchedMat?.gstPercent ? Number(matchedMat.gstPercent) : (prevEntry?.gstPercent || 18),
          hsnCode: matchedMat?.hsnCode || prevEntry?.hsnCode || null,
          isNew,
          status,
          isConfirmed: prevEntry?.isConfirmed || false,
        };

        next[matName] = entry;

        if (!prevEntry || prevEntry.currentRate !== entry.currentRate || prevEntry.status !== entry.status || prevEntry.matchedMaterialId !== entry.matchedMaterialId) {
          changed = true;
        }
      });

      if (Object.keys(prev).length !== Object.keys(next).length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [uniqueMaterialsKey, allMaterials]);

  useEffect(() => {
    if (existingBom?.items && existingBom.items.length > 0 && rows.length === 0 && !isConverted) {
      const loadedRows: ParsedBOMRow[] = existingBom.items.map((item: any, idx: number) => {
        const cf = item.customFields || {};
        const rmVal = item.rawSize || cf.rawMaterialSize || item.dimensions || '';
        const finishVal = cf.finishSize || '';
        const dimensions = parseDimension(rmVal);
        const fDimensions = parseDimension(finishVal);
        const defaultPartName = project?.partName || project?.name || '';
        const nameVal = cf.partName || item.partName || defaultPartName;

        const isBoughtOut = cf.isBoughtOut === true || 
                            item.material?.materialCode === 'STD' || 
                            (cf.materialInput && cf.materialInput.toString().toUpperCase().includes('STD')) ||
                            (!fDimensions.isValid && !dimensions.isValid && !item.rawSize && !cf.rawMaterialSize);

        const materialDisplay = isBoughtOut 
          ? (cf.materialInput || 'STD') 
          : (item.material && item.material.materialCode !== 'STD' ? `${item.material.materialCode} - ${item.material.materialGrade || item.material.materialName}` : (cf.materialInput || nameVal));

        const stdRate = cf.rate !== undefined && cf.rate !== null 
          ? Number(cf.rate) 
          : (cf.unitCost !== undefined && cf.unitCost !== null 
              ? Number(cf.unitCost) 
              : (item.estimatedCost && item.requiredQty ? Number(item.estimatedCost) / Number(item.requiredQty) : null));

        const rmRate = cf.rate !== undefined && cf.rate !== null
          ? Number(cf.rate)
          : (item.estimatedCost && item.calculatedWeight ? Number(item.estimatedCost) / Number(item.calculatedWeight) : null);

        const parsedItem: ParsedBOMRow = {
          id: item.id || `db-row-${idx}`,
          toolNo: cf.toolNo || project?.projectNumber || '',
          srNo: cf.srNo || (idx + 1).toString(),
          partName: nameVal,
          description: item.remarks || cf.description || '',
          quantity: Number(item.requiredQty) || 1,
          finishSize: fDimensions.isValid ? fDimensions.formatted : finishVal,
          finishL: fDimensions.displayL as any,
          finishW: fDimensions.displayW as any,
          finishH: fDimensions.displayH as any,
          rawMaterialSize: dimensions.isValid ? dimensions.formatted : rmVal,
          materialInput: materialDisplay,
          catalogSize: item.catalogSize || cf.catalogSize || '',
          stockSize: item.stockSize || cf.stockSize || '',
          length: cf.length || (dimensions.displayL as any),
          width: cf.width || (dimensions.displayW as any),
          height: cf.height || (dimensions.displayH as any),
          matchedMaterialId: isBoughtOut ? null : (item.materialId || null),
          matchedMaterialName: isBoughtOut ? 'STD - Standard Bought-out Component' : (item.material ? `${item.material.materialCode} - ${item.material.materialGrade}` : null),
          density: isBoughtOut ? null : (cf.density || null),
          rate: isBoughtOut ? stdRate : rmRate,
          unitCost: isBoughtOut ? stdRate : null,
          apWeight: isBoughtOut ? null : (cf.apWeight || item.calculatedWeight || null),
          totalWeight: isBoughtOut ? null : (item.calculatedWeight || cf.totalWeight || null),
          basicCost: Number(item.estimatedCost) || cf.basicCost || null,
          hsnCode: item.hsnCode || null,
          gstPercent: cf.gstPercent || 18,
          isBoughtOut: isBoughtOut,
          validationError: null
        };
        return populateCalculations(parsedItem);
      });
      setRows(loadedRows);
      setIsConverted(true);
    }
  }, [existingBom, project]);

  const handleCreateNewManualBOM = () => {
    const defaultPartName = project?.partName || project?.name || '';
    const initialRows: ParsedBOMRow[] = Array.from({ length: 3 }).map((_, idx) => ({
      id: `manual_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      srNo: idx + 1,
      toolNo: project?.projectNumber || '',
      partName: defaultPartName,
      description: '',
      quantity: '' as any,
      finishSize: '',
      rawMaterialSize: '',
      materialInput: '',
      catalogSize: '',
      stockSize: '',
      length: '' as any,
      width: '' as any,
      height: '' as any,
      finishL: '',
      finishW: '',
      finishH: '',
      unitCost: '' as any,
      apWeight: '' as any,
      rate: '' as any,
      gstPercent: '' as any,
      remarks: '',
    }));
    setRows(initialRows);
    setFile(null);
    setParsedMetadata(null);
    setIsConverted(true);
    setValidationRun(false);
    setActivePreviewTab('all');
    success("New BOM Sheet Initialized", "Started a fresh blank Bill of Materials sheet.");
  };

  const handleAddManualRow = () => {
    const defaultPartName = project?.partName || project?.name || '';
    const newRow: ParsedBOMRow = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      srNo: rows.length + 1,
      toolNo: project?.projectNumber || '',
      partName: defaultPartName,
      description: '',
      quantity: '' as any,
      finishSize: '',
      rawMaterialSize: '',
      materialInput: '',
      catalogSize: '',
      stockSize: '',
      length: '' as any,
      width: '' as any,
      height: '' as any,
      finishL: '',
      finishW: '',
      finishH: '',
      unitCost: '' as any,
      apWeight: '' as any,
      rate: '' as any,
      gstPercent: '' as any,
      remarks: '',
    };
    setRows(prev => [...prev, newRow]);
    setIsConverted(true);
  };

  interface TreeNode {
    row: ParsedBOMRow;
    children: TreeNode[];
    level: number;
  }

  const buildTree = (flatRows: ParsedBOMRow[]): TreeNode[] => {
    const treeNodes: TreeNode[] = flatRows.map(row => ({
      row,
      children: [],
      level: 0
    }));

    const nodeMap = new Map<string, TreeNode>();
    treeNodes.forEach(node => {
      nodeMap.set(String(node.row.srNo).trim(), node);
    });

    const roots: TreeNode[] = [];

    treeNodes.forEach(node => {
      const srNoStr = String(node.row.srNo).trim();
      const dotIndex = srNoStr.lastIndexOf('.');
      
      if (dotIndex === -1) {
        node.level = 0;
        roots.push(node);
      } else {
        const parentSrNo = srNoStr.substring(0, dotIndex);
        const parentNode = nodeMap.get(parentSrNo);
        
        if (parentNode) {
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
        } else {
          node.level = 0;
          roots.push(node);
        }
      }
    });

    return roots;
  };

  const getFlatVisibleNodes = (nodes: TreeNode[], expanded: Record<string, boolean>): { node: TreeNode; isVisible: boolean }[] => {
    const list: { node: TreeNode; isVisible: boolean }[] = [];
    
    const recurse = (nodeList: TreeNode[], isParentVisible: boolean) => {
      nodeList.forEach(node => {
        list.push({ node, isVisible: isParentVisible });
        const srNo = String(node.row.srNo).trim();
        const isExpanded = expanded[srNo] !== false; // default expanded
        recurse(node.children, isParentVisible && isExpanded);
      });
    };

    recurse(nodes, true);
    return list;
  };

  const toggleNodeExpanded = (srNo: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [srNo]: prev[srNo] === false ? true : false
    }));
  };

  // --- Size Parser (Canonical Wrapper) ---
  const parseDimensions = (sizeStr: string) => {
    return parseDimension(sizeStr);
  };

  // --- Calculations ---
  const populateCalculations = (item: ParsedBOMRow, confirmedRateMap?: Record<string, ConfirmedMaterialRate>): ParsedBOMRow => {
    let matchedMat = null;
    if (item.materialInput && !item.isBoughtOut) {
       const search = item.materialInput.toLowerCase();
       matchedMat = allMaterials.find((m: any) => 
          (item.matchedMaterialId && m.id === item.matchedMaterialId) ||
          `${m.materialCode || ''} - ${m.materialGrade || m.materialName || ''}`.toLowerCase() === search ||
          m.materialCode?.toLowerCase() === search || 
          m.materialGrade?.toLowerCase() === search ||
          m.materialCode?.toLowerCase().includes(search) || 
          m.materialGrade?.toLowerCase().includes(search)
       ) || null;
    }

    const rateMap = confirmedRateMap || materialRates;
    const conf = item.materialInput ? rateMap[item.materialInput.trim()] : undefined;

    item.matchedMaterialId = conf?.matchedMaterialId || (matchedMat ? matchedMat.id : (item.matchedMaterialId || null));
    item.matchedMaterialName = conf?.matchedMaterialName || (matchedMat ? `${matchedMat.materialCode} - ${matchedMat.materialGrade}` : (item.matchedMaterialName || null));
    item.hsnCode = conf?.hsnCode || matchedMat?.hsnCode || item.hsnCode || null;
    item.gstPercent = conf?.gstPercent || (matchedMat?.gstPercent ? Number(matchedMat.gstPercent) : (item.gstPercent || 18));
    
    if (item.isBoughtOut) {
      // Standard Bought-out items: Unit Rate (₹/pc) × Quantity model
      const stdMat = allMaterials.find((m: any) => m.materialCode === 'STD');
      if (stdMat && !item.matchedMaterialId) {
        item.matchedMaterialId = stdMat.id;
        item.matchedMaterialName = `${stdMat.materialCode} - ${stdMat.materialGrade || stdMat.materialName}`;
      }
      item.density = null;
      item.apWeight = null;
      item.totalWeight = null;

      const effectiveRate = conf?.currentRate !== undefined && conf?.currentRate !== null
        ? conf.currentRate
        : (item.rate !== undefined && item.rate !== null && !isNaN(Number(item.rate)) && item.rate !== ('' as any)
            ? Number(item.rate)
            : (item.unitCost !== undefined && item.unitCost !== null && !isNaN(Number(item.unitCost)) && item.unitCost !== ('' as any) ? Number(item.unitCost) : null));

      item.rate = effectiveRate;
      item.unitCost = effectiveRate;
      item.basicCost = effectiveRate !== null ? Number((effectiveRate * (Number(item.quantity) || 1)).toFixed(2)) : null;

      if (!item.materialInput || !item.materialInput.trim()) {
        item.materialInput = 'STD';
      }
    } else {
      // Raw Material items: Weight × Rate model
      const effectiveDensity = conf?.density || (matchedMat ? Number(matchedMat.density || 7.85) : (item.density || 7.85));
      item.density = effectiveDensity;
      
      const effectiveRate = conf?.currentRate !== undefined && conf?.currentRate !== null
        ? conf.currentRate
        : (item.rate !== undefined && item.rate !== null && !isNaN(Number(item.rate)) && Number(item.rate) > 0
            ? Number(item.rate)
            : (matchedMat ? Number(matchedMat.standardCost || matchedMat.ratePerKg || 0) : null));

      item.rate = effectiveRate;
      item.unitCost = null;
      
      // Resolve canonical dimension from rawMaterialSize or length/width/height
      let dimObj = null;
      if (item.length === 'Ø' && item.width && item.height && item.width !== '-' && item.height !== '-') {
        dimObj = parseDimension(`Ø${item.width}X${item.height}`);
      } else if (item.rawMaterialSize && item.rawMaterialSize !== '-') {
        dimObj = parseDimension(item.rawMaterialSize);
      } else if (item.length && item.width && item.height && item.length !== '-' && item.width !== '-' && item.height !== '-') {
        dimObj = parseDimension(`${item.length}X${item.width}X${item.height}`);
      }

      if (dimObj && dimObj.isValid) {
        const { unitWeight } = calculateMaterialWeight(dimObj, effectiveDensity, 1);
        item.apWeight = unitWeight;
      } else {
        item.apWeight = 0;
      }
      
      item.totalWeight = Number(((Number(item.apWeight) || 0) * (Number(item.quantity) || 0)).toFixed(2));
      item.basicCost = effectiveRate !== null ? Number(((Number(item.totalWeight) || 0) * effectiveRate).toFixed(2)) : null;
    }
    return item;
  };

  // --- Validate Row Data ---
  const validateRow = (row: Partial<ParsedBOMRow>, index: number): string | null => {
    const rowNum = index + 1;
    if (!row.srNo || !row.srNo.toString().trim()) {
      return `Row ${rowNum}: Sr No / Detail No is missing.`;
    }
    if (!row.partName || !row.partName.toString().trim()) {
      return `Row ${rowNum}: Part Name is required.`;
    }
    if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) <= 0) {
      return `Row ${rowNum}: Quantity must be greater than 0.`;
    }

    if (row.isBoughtOut) {
      // Standard Material / Bought-Out Item (STD)
      const unitRate = row.rate !== undefined && row.rate !== null && !isNaN(Number(row.rate))
        ? Number(row.rate)
        : (row.unitCost !== undefined && row.unitCost !== null && !isNaN(Number(row.unitCost)) ? Number(row.unitCost) : null);

      if (unitRate === null || unitRate <= 0) {
        return `Row ${rowNum}: Unit Rate (₹/pc) is missing for standard item.`;
      }
      if (!row.basicCost || isNaN(Number(row.basicCost)) || Number(row.basicCost) <= 0) {
        return `Row ${rowNum}: Total cost calculation is missing.`;
      }
    } else {
      // Raw Material Item (RM)
      if (!row.materialInput || !row.materialInput.toString().trim()) {
        return `Row ${rowNum}: Material description is missing.`;
      }
      if (!row.length || !row.width || !row.height || row.length === '-' || row.width === '-' || row.height === '-') {
        return `Row ${rowNum}: Raw material dimensions (L×W×H) are missing.`;
      }
      if (row.rate === null || row.rate === undefined || isNaN(Number(row.rate)) || Number(row.rate) <= 0) {
        return `Row ${rowNum}: Material rate (₹/kg) is missing. Verify in Rate Confirmation.`;
      }
      if (!row.basicCost || isNaN(Number(row.basicCost)) || Number(row.basicCost) <= 0) {
        return `Row ${rowNum}: Total basic cost calculation is missing.`;
      }
    }

    return null;
  };

  // --- Material Rate Confirmation Handlers ---
  const handleMaterialRateChange = (matName: string, rateVal: string | number) => {
    const parsed = rateVal === '' || isNaN(Number(rateVal)) ? null : Number(rateVal);

    setMaterialRates(prev => {
      const entry = prev[matName];
      if (!entry) return prev;

      let status: 'VALID' | 'CHANGED' | 'NEW' | 'MISSING' = 'VALID';
      if (parsed === null || parsed <= 0) {
        status = 'MISSING';
      } else if (entry.isNew) {
        status = 'NEW';
      } else if (entry.masterRate !== null && parsed !== entry.masterRate) {
        status = 'CHANGED';
      } else {
        status = 'VALID';
      }

      return {
        ...prev,
        [matName]: {
          ...entry,
          currentRate: parsed,
          status,
          isConfirmed: false,
        },
      };
    });
  };

  const handleResetRateToMaster = (matName: string) => {
    setMaterialRates(prev => {
      const entry = prev[matName];
      if (!entry || entry.masterRate === null) return prev;

      return {
        ...prev,
        [matName]: {
          ...entry,
          currentRate: entry.masterRate,
          status: 'VALID',
          isConfirmed: false,
        }
      };
    });
  };

  const handleConfirmRatesAndContinue = () => {
    const rateEntries = Object.values(materialRates);
    const missing = rateEntries.filter(r => r.currentRate === null || r.currentRate <= 0 || isNaN(r.currentRate));

    if (missing.length > 0) {
      error(
        "Missing Rates",
        `Please enter a valid rate for: ${missing.map(m => m.materialName).join(', ')}`
      );
      return;
    }

    // Apply confirmed rates across all active BOM rows
    setRows(prevRows => {
      return prevRows.map((row, idx) => {
        const matName = (row.materialInput || '').trim();
        const conf = materialRates[matName];
        if (!conf) return row;

        const updatedRow: ParsedBOMRow = {
          ...row,
          rate: conf.currentRate,
          unitCost: row.isBoughtOut ? conf.currentRate : null,
          matchedMaterialId: conf.matchedMaterialId || row.matchedMaterialId,
          matchedMaterialName: conf.matchedMaterialName || row.matchedMaterialName,
          density: row.isBoughtOut ? null : conf.density,
          gstPercent: conf.gstPercent,
          hsnCode: conf.hsnCode || row.hsnCode,
        };

        const recalculated = populateCalculations(updatedRow, materialRates);
        recalculated.validationError = validateRow(recalculated, idx);
        return recalculated;
      });
    });

    setMaterialRates(prev => {
      const confirmed: Record<string, ConfirmedMaterialRate> = {};
      Object.entries(prev).forEach(([k, v]) => {
        confirmed[k] = { ...v, isConfirmed: true };
      });
      return confirmed;
    });

    setIsRatesConfirmed(true);
    success("Rates Confirmed", "Current BOM rates applied successfully to all items.");
  };

  const handleOpenAddMaterialModal = (matName: string, currentRateVal?: number | null) => {
    setNewMaterialForm({
      materialCode: matName,
      materialGrade: matName,
      standardCost: currentRateVal && currentRateVal > 0 ? currentRateVal : '',
      defaultUom: 'KG',
      density: 7.85,
      gstPercent: 18,
      hsnCode: '',
      isSaving: false,
    });
    setShowAddModal(true);
  };

  const handleSaveNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialForm.materialCode.trim() || !newMaterialForm.materialGrade.trim()) {
      error("Missing Fields", "Material Code and Grade are required.");
      return;
    }

    const rateNum = Number(newMaterialForm.standardCost) || 0;
    if (rateNum <= 0) {
      error("Invalid Rate", "Please enter a valid standard rate (> 0).");
      return;
    }

    setNewMaterialForm(prev => ({ ...prev, isSaving: true }));

    try {
      const payload = {
        materialCode: newMaterialForm.materialCode.trim(),
        materialGrade: newMaterialForm.materialGrade.trim(),
        materialCategory: 'RAW_MATERIAL',
        standardCost: rateNum,
        defaultUom: newMaterialForm.defaultUom,
        density: Number(newMaterialForm.density) || 7.85,
        gstPercent: Number(newMaterialForm.gstPercent) || 18,
        hsnCode: newMaterialForm.hsnCode.trim() || undefined,
        status: 'ACTIVE',
      };

      const created = await MasterDataService.createItem<any>('materials', payload);
      
      // Invalidate master data query cache to refresh allMaterials
      await queryClient.invalidateQueries({ queryKey: masterDataKeys.registry('materials') });

      // Update local material rate state
      const matKey = newMaterialForm.materialCode.trim();
      setMaterialRates(prev => ({
        ...prev,
        [matKey]: {
          materialName: matKey,
          matchedMaterialId: created?.id || null,
          matchedMaterialName: `${created?.materialCode || matKey} - ${created?.materialGrade || matKey}`,
          masterRate: rateNum,
          currentRate: rateNum,
          defaultUom: newMaterialForm.defaultUom,
          density: Number(newMaterialForm.density) || 7.85,
          gstPercent: Number(newMaterialForm.gstPercent) || 18,
          hsnCode: newMaterialForm.hsnCode.trim() || null,
          isNew: false,
          status: 'VALID',
          isConfirmed: true,
        }
      }));

      // Update any matching rows in the current BOM
      setRows(prevRows => {
        return prevRows.map((row, idx) => {
          if ((row.materialInput || '').trim().toLowerCase() === matKey.toLowerCase()) {
            const updatedRow: ParsedBOMRow = {
              ...row,
              matchedMaterialId: created?.id || row.matchedMaterialId,
              matchedMaterialName: `${created?.materialCode || matKey} - ${created?.materialGrade || matKey}`,
              rate: rateNum,
              density: Number(newMaterialForm.density) || 7.85,
              gstPercent: Number(newMaterialForm.gstPercent) || 18,
              hsnCode: newMaterialForm.hsnCode.trim() || row.hsnCode,
            };
            const recalc = populateCalculations(updatedRow);
            recalc.validationError = validateRow(recalc, idx);
            return recalc;
          }
          return row;
        });
      });

      setShowAddModal(false);
      success("Material Saved", `Created ${payload.materialCode} in Material Master with standard rate ₹${rateNum}/${payload.defaultUom}.`);
    } catch (err: any) {
      error("Save Failed", err.message || "Failed to save new material to master data.");
    } finally {
      setNewMaterialForm(prev => ({ ...prev, isSaving: false }));
    }
  };

  // --- Handle Excel Parsing ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles[0]) {
      processFile(selectedFiles[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      error("Unsupported Format", "Only Excel workbooks (.xlsx, .xls) are supported.");
      return;
    }

    setFile(selectedFile);
    setIsConverted(false);
    setValidationRun(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const allRows: any[][] = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (allRows.length === 0) {
          throw new Error("The selected Excel sheet appears to be empty.");
        }

        // 1. Scan for Metadata Header
        let docProjectNum = "";
        let docCustomer = "";
        let docReleaseDate = "";

        allRows.forEach(row => {
          row.forEach((cell, cellIdx) => {
            if (!cell) return;
            const strCell = cell.toString().trim().toLowerCase();
            
            if (strCell.includes("project number") || strCell.includes("tool no")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docProjectNum = val.toString().trim();
            }
            if (strCell.includes("customer")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docCustomer = val.toString().trim();
            }
            if (strCell.includes("release date")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docReleaseDate = val.toString().trim();
            }
          });
        });

        // Fallback to active project context if headers not parsed
        if (!docProjectNum) docProjectNum = project.projectNumber || "";
        if (!docCustomer) docCustomer = project.customer?.companyName || "N/A";

        setParsedMetadata({
          projectNumber: docProjectNum,
          customer: docCustomer,
          releaseDate: docReleaseDate
        });

        // 2. Identify Table Header
        let headerRowIndex = -1;
        let colMapping: { [key: string]: number } = {};

        for (let r = 0; r < allRows.length; r++) {
          const row = allRows[r];
          let matches = 0;
          let tempMapping: { [key: string]: number } = {};

          row.forEach((cell, c) => {
            if (!cell) return;
            const cleanHeader = cell.toString().trim().toLowerCase();
            
            const clean = cleanHeader.replace(/[^a-z0-9]/g, ''); // strip spaces and punctuation for matching
            
            // IMPORTANT: "description" must be matched BEFORE "partName" to prevent
            // the 'desc' pattern from misclassifying the DESCRIPTION column as PART NAME.
            if (clean === "description" || clean === "remark" || clean === "remarks" || clean === "note" || clean === "notes" || clean === "process") {
              tempMapping["description"] = c;
            } else if (clean.includes("srno") || clean.includes("serial") || clean.includes("detailno") || clean.includes("itemno") || clean === "no" || clean === "sn" || clean === "detno" || clean === "sr") {
              tempMapping["srNo"] = c;
              matches++;
            } else if (clean.includes("partname") || clean.includes("nameofpart") || clean.includes("partdesc") || clean.includes("component") || clean.includes("itemname") || clean === "part" || clean === "desc") {
              tempMapping["partName"] = c;
              matches++;
            } else if (clean.includes("qty") || clean.includes("quantity") || clean.includes("reqqty") || clean === "nos" || clean.includes("required")) {
              tempMapping["quantity"] = c;
              matches++;
            } else if (clean.includes("finishsize") || clean.includes("finalsize") || clean.includes("fsize")) {
              tempMapping["finishSize"] = c;
              matches++;
            } else if (clean.includes("rawmaterialsize") || clean.includes("rmsize") || clean.includes("dim") || clean.includes("size") || clean.includes("blanksize") || clean.includes("cutsize") || clean.includes("stocksize") || clean.includes("lxbxh")) {
              tempMapping["rawMaterialSize"] = c;
              matches++;
            } else if (clean.includes("material") || clean.includes("grade") || clean.includes("matl") || clean.includes("mat") || clean.includes("spec")) {
              tempMapping["material"] = c;
              matches++;
            } else if (clean.includes("supplier") || clean.includes("vendor") || clean.includes("make") || clean.includes("brand")) {
              tempMapping["supplier"] = c;
            } else if (clean.includes("toolno") || clean.includes("projectno")) {
              tempMapping["toolNo"] = c;
            } else if (clean.includes("catalogsize") || clean.includes("catsize") || clean.includes("standard")) {
              tempMapping["catalogSize"] = c;
            } else if (clean.includes("stocksize") || clean.includes("stock")) {
              tempMapping["stockSize"] = c;
            }
          });

          if (matches >= 2) {
            headerRowIndex = r;
            colMapping = tempMapping;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Could not detect table headers automatically. Ensure you have columns like 'Qty', 'Material', 'Size', and 'Part Name'.");
        }

        if (colMapping["quantity"] === undefined || 
            colMapping["material"] === undefined) {
          throw new Error("Missing required columns: We need at least 'Quantity' and 'Material'. We found: " + Object.keys(colMapping).join(", "));
        }
        
        // If SrNo or Size aren't strictly found, just warn but allow import to continue (it will leave them blank)
        if (colMapping["srNo"] === undefined) colMapping["srNo"] = -1; // -1 means we'll auto-generate
        if (colMapping["rawMaterialSize"] === undefined) colMapping["rawMaterialSize"] = -1; // -1 means blank size

        // 3. Map Data Rows
        const parsedItems: ParsedBOMRow[] = [];
        let lastToolNo = "";
        
        for (let r = headerRowIndex + 1; r < allRows.length; r++) {
          const row = allRows[r];
          const isBlank = row.every(cell => cell === undefined || cell === null || cell === '');
          if (isBlank) continue;

          // Skip footer summaries
          const firstCellStr = row[colMapping["srNo"]]?.toString().toLowerCase() || "";
          if (firstCellStr.includes("prepared") || firstCellStr.includes("approved") || firstCellStr.includes("total") || firstCellStr.includes("release") || firstCellStr.includes("checked")) {
            continue;
          }

          let srVal = colMapping["srNo"] !== -1 ? row[colMapping["srNo"]]?.toString().trim() || "" : "";
          const nameVal = colMapping["partName"] !== undefined ? row[colMapping["partName"]]?.toString().trim() || "" : "";
          const qtyVal = colMapping["quantity"] !== -1 ? (parseInt(row[colMapping["quantity"]]?.toString().trim() || "0", 10) || 0) : 0;
          const finishVal = colMapping["finishSize"] !== undefined ? row[colMapping["finishSize"]]?.toString().trim() || "" : "";
          let rmVal = colMapping["rawMaterialSize"] !== -1 ? row[colMapping["rawMaterialSize"]]?.toString().trim() || "" : "";
          let matVal = colMapping["material"] !== -1 ? row[colMapping["material"]]?.toString().trim() || "" : "";
          const supVal = colMapping["supplier"] !== undefined ? row[colMapping["supplier"]]?.toString().trim() || "" : "";
          const catVal = colMapping["catalogSize"] !== undefined ? row[colMapping["catalogSize"]]?.toString().trim() || "" : "";
          const stockVal = colMapping["stockSize"] !== undefined ? row[colMapping["stockSize"]]?.toString().trim() || "" : "";
          const descVal = colMapping["description"] !== undefined ? row[colMapping["description"]]?.toString().trim() || "" : "";

          // Check for Tool No column (Fill down if exists, else global tool no)
          if (colMapping["toolNo"] !== undefined) {
             const t = row[colMapping["toolNo"]]?.toString().trim();
             if (t) lastToolNo = t;
          }

          if (!matVal && supVal) matVal = supVal;
          
          if (!rmVal && finishVal) rmVal = finishVal;

          if (!srVal && !nameVal && !rmVal && !catVal) continue; // Skip padding blank rows

          // Resolve dimensions
          const dimensions = parseDimension(rmVal);
          const fDimensions = parseDimension(finishVal);

          // If there is NO FINISH (L×W×H or ØD×L) and NO RM in imported sheet -> consider it as standard material (STD)
          const hasFinishDims = !!(finishVal && finishVal.trim() && finishVal !== '-' && fDimensions.isValid);
          const hasRmDims = !!(rmVal && rmVal.trim() && rmVal !== '-' && dimensions.isValid);

          const isBoughtOut = !hasFinishDims && !hasRmDims;

          // Preserve exact material value as written in Excel without renaming or appending (STD)
          let resolvedMaterial = matVal || nameVal || (isBoughtOut ? 'STD' : '');

          const item: ParsedBOMRow = {
            id: `row-${r}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            toolNo: lastToolNo || docProjectNum || project?.projectNumber || '',
            srNo: srVal || (parsedItems.length + 1).toString(),
            partName: nameVal || project?.partName || project?.name || '',
            description: descVal,
            quantity: qtyVal,
            finishSize: fDimensions.isValid ? fDimensions.formatted : finishVal,
            finishL: fDimensions.displayL as any,
            finishW: fDimensions.displayW as any,
            finishH: fDimensions.displayH as any,
            rawMaterialSize: dimensions.isValid ? dimensions.formatted : rmVal,
            materialInput: resolvedMaterial,
            catalogSize: catVal,
            stockSize: stockVal,
            length: dimensions.displayL as any,
            width: dimensions.displayW as any,
            height: dimensions.displayH as any,
            matchedMaterialId: null,
            matchedMaterialName: null,
            density: null,
            rate: null,
            unitCost: null,
            apWeight: null,
            totalWeight: null,
            basicCost: null,
            hsnCode: null,
            gstPercent: null,
            isBoughtOut,
            validationError: null
          };

          populateCalculations(item);
          item.validationError = validateRow(item, parsedItems.length);
          parsedItems.push(item);
        }

        setRows(parsedItems);
        success("File Loaded", `Imported ${parsedItems.length} items from Engineering BOM.`);

      } catch (err: any) {
        error("Parsing Failed", err.message || "An error occurred while reading the file.");
        setFile(null);
        setRows([]);
        setParsedMetadata(null);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // --- Handle Validation Run ---
  const handleValidate = () => {
    if (rows.length === 0) return;

    let errorCount = 0;
    const validated = rows.map((row, idx) => {
      const err = validateRow(row, idx);
      if (err) errorCount++;
      return { ...row, validationError: err };
    });

    if (!parsedMetadata?.projectNumber) {
      error("Project Number Missing", "Project Number (Tool No) is missing.");
      errorCount++;
    }

    setRows(validated);
    setValidationRun(true);

    if (errorCount > 0) {
      error("Validation Errors", `Found ${errorCount} incomplete rows. Please fill missing material, rate, or dimensions.`);
      setActivePreviewTab('errors');
    } else {
      success("Validation Successful", "All items are verified and ready for conversion.");
      setActivePreviewTab('all');
    }
  };

  // --- Inline Grid Edits & Shape Toggles ---

  const toggleFinishShape = (rowId: string) => {
    setRows(prev => prev.map((row) => {
      if (row.id !== rowId) return row;
      const isCurrentlyRound = row.finishL === 'Ø' || String(row.finishSize).startsWith('Ø');
      const updated = { ...row };
      if (isCurrentlyRound) {
        // Toggle to Rectangular
        updated.finishL = row.finishW && row.finishW !== '-' ? row.finishW : '50';
        updated.finishW = row.finishH && row.finishH !== '-' ? row.finishH : '25';
        updated.finishH = '10';
        updated.finishSize = `${updated.finishL}X${updated.finishW}X${updated.finishH}`;
      } else {
        // Toggle to Round
        updated.finishL = 'Ø';
        updated.finishW = row.finishW && row.finishW !== '-' ? row.finishW : (row.finishL && row.finishL !== '-' ? row.finishL : '25');
        updated.finishH = row.finishH && row.finishH !== '-' ? row.finishH : '50';
        updated.finishSize = `Ø${updated.finishW}X${updated.finishH}`;
      }
      return updated;
    }));
  };

  const toggleRmShape = (rowId: string) => {
    setRows(prev => prev.map((row, idx) => {
      if (row.id !== rowId) return row;
      const isCurrentlyRound = row.length === 'Ø' || String(row.rawMaterialSize).startsWith('Ø');
      const updated = { ...row };
      if (isCurrentlyRound) {
        // Toggle to Rectangular
        updated.length = row.width && row.width !== '-' ? row.width : '50';
        updated.width = row.height && row.height !== '-' ? row.height : '25';
        updated.height = '10';
        updated.rawMaterialSize = `${updated.length}X${updated.width}X${updated.height}`;
      } else {
        // Toggle to Round
        updated.length = 'Ø';
        updated.width = row.width && row.width !== '-' ? row.width : (row.length && row.length !== '-' ? row.length : '25');
        updated.height = row.height && row.height !== '-' ? row.height : '50';
        updated.rawMaterialSize = `Ø${updated.width}X${updated.height}`;
      }
      populateCalculations(updated);
      updated.validationError = validateRow(updated, idx);
      return updated;
    }));
  };

  const handleCellEdit = (rowId: string, field: keyof ParsedBOMRow, val: any) => {
    setRows(prev => prev.map((row, idx) => {
      if (row.id !== rowId) return row;

      const updated = { ...row, [field]: val };

      if (field === 'finishSize') {
        const dims = parseDimension(val);
        updated.finishL = dims.displayL as any;
        updated.finishW = dims.displayW as any;
        updated.finishH = dims.displayH as any;
        if (dims.isValid) {
          updated.finishSize = dims.formatted;
        }
      }

      if (field === 'finishL' || field === 'finishW' || field === 'finishH') {
        if (updated.finishL === 'Ø') {
          updated.finishSize = `Ø${updated.finishW}X${updated.finishH}`;
        } else {
          updated.finishSize = `${updated.finishL}X${updated.finishW}X${updated.finishH}`;
        }
      }

      if (field === 'rawMaterialSize') {
        const dims = parseDimension(val);
        updated.length = dims.displayL as any;
        updated.width = dims.displayW as any;
        updated.height = dims.displayH as any;
        if (dims.isValid) {
          updated.rawMaterialSize = dims.formatted;
        }
      }

      if (field === 'length' || field === 'width' || field === 'height') {
        if (updated.length === 'Ø') {
          updated.rawMaterialSize = `Ø${updated.width}X${updated.height}`;
        } else {
          updated.rawMaterialSize = `${updated.length}X${updated.width}X${updated.height}`;
        }
      }

      if (field === 'matchedMaterialId') {
        const matched = allMaterials.find((m: any) => m.id === val || m.materialCode === val);
        if (matched) {
          updated.matchedMaterialId = matched.id;
          updated.matchedMaterialName = `${matched.materialCode} - ${matched.materialGrade || matched.materialName}`;
          if (matched.materialCode === 'STD' || matched.materialCategory === 'STANDARD_PART') {
            updated.isBoughtOut = true;
            updated.materialInput = 'STD';
          } else {
            updated.isBoughtOut = false;
            updated.materialInput = updated.matchedMaterialName;
            updated.rate = Number(matched.standardCost || matched.ratePerKg || 0);
            updated.density = Number(matched.density || 7.85);
            updated.gstPercent = matched.gstPercent ? Number(matched.gstPercent) : 18;
          }
        } else {
          updated.matchedMaterialId = null;
          updated.matchedMaterialName = null;
          updated.materialInput = '';
          updated.rate = 0;
        }
        populateCalculations(updated);
      } else if (field === 'isBoughtOut') {
        updated.isBoughtOut = !!val;
        if (val) {
          const stdMat = allMaterials.find((m: any) => m.materialCode === 'STD');
          if (stdMat) {
            updated.matchedMaterialId = stdMat.id;
            updated.matchedMaterialName = `${stdMat.materialCode} - ${stdMat.materialGrade}`;
          }
          if (!updated.materialInput || !updated.materialInput.toUpperCase().includes('STD')) {
            updated.materialInput = updated.materialInput && updated.materialInput !== '-- Select Material --' 
              ? `${updated.materialInput} (STD)` 
              : 'STD';
          }
        } else {
          updated.materialInput = (updated.materialInput || '').replace(/\s*\(STD\)/gi, '').replace(/^STD$/gi, '');
        }
        populateCalculations(updated);
      } else if (field === 'materialInput') {
        populateCalculations(updated);
      } else if (field === 'rawMaterialSize' || field === 'length' || field === 'width' || field === 'height' || field === 'quantity') {
        populateCalculations(updated);
      } else if (field === 'unitCost' || field === 'rate') {
        const parsedVal = val === '' || isNaN(Number(val)) ? null : Number(val);
        if (updated.isBoughtOut) {
          updated.rate = parsedVal;
          updated.unitCost = parsedVal;
          updated.basicCost = parsedVal !== null ? Number((parsedVal * (Number(updated.quantity) || 1)).toFixed(2)) : null;
        } else {
          updated.rate = parsedVal;
          updated.basicCost = Number(((Number(updated.totalWeight) || 0) * (Number(updated.rate) || 0)).toFixed(2));
        }
      } else if (field === 'apWeight' || field === 'gstPercent') {
        if (!updated.isBoughtOut) {
          updated.totalWeight = Number(((Number(updated.apWeight) || 0) * (Number(updated.quantity) || 0)).toFixed(2));
          updated.basicCost = Number(((Number(updated.totalWeight) || 0) * (Number(updated.rate) || 0)).toFixed(2));
        }
      }

      // Re-validate row
      updated.validationError = validateRow(updated, idx);

      return updated;
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    setRows(prev => {
      const remaining = prev.filter(r => r.id !== rowId);
      return remaining.map((r, idx) => ({
        ...r,
        srNo: (idx + 1).toString(),
      }));
    });
    success("Row Removed", "Item removed and serial numbers re-sequenced.");
  };

  const handleConvert = () => {
    // Run validation if not done yet
    let errorCount = rows.filter(r => validateRow(r, 0) !== null).length;
    if (!parsedMetadata?.projectNumber) {
      errorCount++;
    }

    if (errorCount > 0) {
      error("Conversion Blocked", "Please resolve all highlighted row errors first.");
      setValidationRun(true);
      setActivePreviewTab('errors');
      return;
    }

    setIsConverted(true);
    success("Conversion Complete", "Purchase Material Order preview populated successfully.");
  };

  // --- Export & Styled Template Generation ---
  // --- Export & Styled Template Generation ---
  const handleExportExcel = async () => {
    if (rows.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KRUPA TOOLS & STAMPING LTD.';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('BOM Purchase Order', {
      views: [{ showGridLines: true }],
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
      },
    });

    // Apply Official Krupa Header
    let r = await applyKrupaHeader(workbook, sheet, 'PURCHASE MATERIAL ORDER (BOM)', 'A', 'N');

    const borderStyle: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD4D4D8' } };

    // Metadata Block
    r += 1;
    const metaStart = r;

    sheet.getRow(r).height = 22;
    sheet.mergeCells(`A${r}:C${r}`);
    sheet.getCell(`A${r}`).value = 'TOOL NO (PROJECT):';
    sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
    sheet.mergeCells(`D${r}:F${r}`);
    sheet.getCell(`D${r}`).value = parsedMetadata?.projectNumber || project.projectNumber;
    sheet.getCell(`D${r}`).font = { bold: true, size: 10, color: { argb: 'FF1E40AF' } };

    sheet.mergeCells(`H${r}:I${r}`);
    sheet.getCell(`H${r}`).value = 'CUSTOMER:';
    sheet.getCell(`H${r}`).font = { bold: true, size: 10 };
    sheet.mergeCells(`J${r}:N${r}`);
    sheet.getCell(`J${r}`).value = parsedMetadata?.customer || project.customer?.companyName || 'N/A';
    sheet.getCell(`J${r}`).font = { bold: true, size: 10 };

    r++;
    sheet.getRow(r).height = 22;
    sheet.mergeCells(`A${r}:C${r}`);
    sheet.getCell(`A${r}`).value = 'PREPARED BY:';
    sheet.getCell(`A${r}`).font = { bold: true, size: 10 };
    sheet.mergeCells(`D${r}:F${r}`);
    sheet.getCell(`D${r}`).value = 'Manufacturing Engineering Team';

    sheet.mergeCells(`H${r}:I${r}`);
    sheet.getCell(`H${r}`).value = 'DATE:';
    sheet.getCell(`H${r}`).font = { bold: true, size: 10 };
    sheet.mergeCells(`J${r}:N${r}`);
    sheet.getCell(`J${r}`).value = new Date().toLocaleDateString('en-GB');

    for (let rowIdx = metaStart; rowIdx <= r; rowIdx++) {
      const row = sheet.getRow(rowIdx);
      for (let c = 1; c <= 14; c++) {
        row.getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
      }
    }

    r += 2;

    // Table Headers
    const headers = [
      'SR.NO', 'TOOL NO', 'DET NO', 'L', 'W', 'H', 'MATERIAL', 'QTY',
      'AP WT.', 'TOTAL WT.', 'RATE (₹)', 'BASIC COST (₹)', 'GST (₹)', 'TOTAL (₹)'
    ];

    sheet.getRow(r).height = 24;
    headers.forEach((h, idx) => {
      const cell = sheet.getRow(r).getCell(idx + 1);
      cell.value = h;
      cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    });

    let grandQty = 0;
    let grandTotalWt = 0;
    let grandTotalCost = 0;

    r++;
    rows.forEach((row, idx) => {
      sheet.getRow(r).height = 22;
      const qty = row.quantity || 0;
      const apWt = row.apWeight || 0;
      const tw = row.totalWeight || 0;
      const rate = row.rate || 0;
      const basic = row.basicCost || 0;
      const gstPct = row.gstPercent || 18;
      const gstAmt = basic * (gstPct / 100);
      const total = basic + gstAmt;

      grandQty += qty;
      grandTotalWt += tw;
      grandTotalCost += total;

      const rowValues = [
        idx + 1,
        row.toolNo || parsedMetadata?.projectNumber || project.projectNumber || 'TOOL',
        row.srNo,
        row.isBoughtOut ? '' : row.length,
        row.isBoughtOut ? '' : row.width,
        row.isBoughtOut ? '' : row.height,
        row.isBoughtOut ? `${row.partName} (STD)` : row.materialInput,
        qty,
        apWt || 0,
        tw || 0,
        rate || 0,
        basic || 0,
        gstAmt || 0,
        total || 0
      ];

      rowValues.forEach((val, cIdx) => {
        const cell = sheet.getRow(r).getCell(cIdx + 1);
        cell.value = val;
        cell.font = { size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: cIdx >= 7 && cIdx <= 13 ? 'right' : 'center' };
        if (cIdx >= 8 && cIdx <= 13) cell.numFmt = '#,##0.00';
        cell.border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
      });

      r++;
    });

    // Grand Total Row
    sheet.getRow(r).height = 26;
    sheet.mergeCells(`A${r}:G${r}`);
    const gtCell = sheet.getCell(`A${r}`);
    gtCell.value = 'GRAND TOTAL';
    gtCell.font = { bold: true, size: 10 };
    gtCell.alignment = { vertical: 'middle', horizontal: 'right' };

    sheet.getRow(r).getCell(8).value = grandQty;
    sheet.getRow(r).getCell(10).value = grandTotalWt;
    sheet.getRow(r).getCell(14).value = grandTotalCost;

    [8, 10, 14].forEach(c => {
      const cell = sheet.getRow(r).getCell(c);
      cell.font = { bold: true, size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      if (c >= 10) cell.numFmt = '#,##0.00';
    });

    for (let c = 1; c <= 14; c++) {
      sheet.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
    }

    r += 3;

    // 4-Column Signature Block (VERIFIED BY DESIGNER | PREPARED BY | CHECKED BY | AUTHORISED SIGNATORY)
    // Row 1: Signature / Name Space (Height 40)
    sheet.getRow(r).height = 40;
    const signBoxes = [
      { startCol: 1, endCol: 3, label: 'VERIFIED BY DESIGNER', val: verifiedByDesigner || '' },
      { startCol: 4, endCol: 6, label: 'PREPARED BY', val: preparedBy || 'DESIGN TEAM' },
      { startCol: 7, endCol: 9, label: 'CHECKED BY', val: checkedBy || '' },
      { startCol: 10, endCol: 14, label: 'AUTHORISED SIGNATORY', val: authorisedSignatory || '' },
    ];

    signBoxes.forEach(box => {
      sheet.mergeCells(r, box.startCol, r, box.endCol);
      const cell = sheet.getRow(r).getCell(box.startCol);
      cell.value = box.val;
      cell.font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'bottom', horizontal: 'center' };
      for (let c = box.startCol; c <= box.endCol; c++) {
        sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
      }
    });

    // Row 2: Label Row (Height 22)
    r++;
    sheet.getRow(r).height = 22;
    signBoxes.forEach(box => {
      sheet.mergeCells(r, box.startCol, r, box.endCol);
      const cell = sheet.getRow(r).getCell(box.startCol);
      cell.value = box.label;
      cell.font = { bold: true, size: 9, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      for (let c = box.startCol; c <= box.endCol; c++) {
        sheet.getRow(r).getCell(c).border = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };
      }
    });

    // Set Column Widths
    sheet.columns = [
      { width: 8 },   // SR.NO
      { width: 14 },  // TOOL NO
      { width: 10 },  // DET NO
      { width: 8 },   // L
      { width: 8 },   // W
      { width: 8 },   // H
      { width: 22 },  // MATERIAL
      { width: 10 },  // QTY
      { width: 12 },  // AP WT
      { width: 12 },  // TOTAL WT
      { width: 12 },  // RATE
      { width: 15 },  // BASIC COST
      { width: 12 },  // GST
      { width: 16 },  // TOTAL
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `${parsedMetadata?.projectNumber || project.projectNumber}_Purchase_Material_Order.xlsx`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    success("Downloaded Successfully", `PO file saved as ${fileName}`);
  };

  // Calculations for Summary Cards
  const totalItemsCount = rows.length;
  const invalidRowsCount = rows.filter(r => r.validationError !== null).length;
  const validRowsCount = totalItemsCount - invalidRowsCount;

  // Filter items for preview grid
  const filteredRows = rows.filter(r => {
    if (activePreviewTab === 'errors') return r.validationError !== null;
    if (activePreviewTab === 'valid') return r.validationError === null;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0 space-y-6">
      
      {/* Upload & Dropzone Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* Left Upload Card */}
        <div className="lg:col-span-2 bg-white border border-border-gray rounded-[12px] shadow-subtle p-6 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-subtle/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div 
            className={`border-2 border-dashed rounded-[12px] p-8 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-primary bg-primary-subtle/50 shadow-elevation' 
                : 'border-border-gray bg-canvas hover:border-primary/40 hover:bg-primary-subtle/20 shadow-sm'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-primary mb-3 animate-pulse" />
            <h3 className="text-sm font-semibold text-ink mb-1">Drag & Drop Engineering BOM Excel</h3>
            <p className="text-[11px] text-mute mb-4">Compatible with standard structured .xlsx and .xls formats</p>
            
            {!isProjectClosed && (
              <>
                <input 
                  id="bom-excel-upload"
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label 
                    htmlFor="bom-excel-upload"
                    className="bg-white hover:bg-canvas text-ink border border-border-gray font-semibold text-xs px-4.5 py-2 rounded-[12px] shadow-subtle transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Browse Local File
                  </label>

                  <button
                    type="button"
                    onClick={handleCreateNewManualBOM}
                    className="bg-primary hover:bg-primary-hover active:scale-[0.98] px-4.5 py-2 rounded-[12px] text-xs font-semibold text-white shadow-subtle transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Manual BOM Sheet</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-ink mb-4 tracking-widest uppercase flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-cool-gray" />
              Converter Registry
            </h3>
            
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white border border-border-gray rounded-[12px] shadow-sm">
                  <FileSpreadsheet className="w-8 h-8 text-semantic-success-dark shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{file.name}</p>
                    <p className="text-[10px] text-mute">Size: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-cool-gray">
                  <div className="flex justify-between">
                    <span>Parsed Project (Tool No):</span>
                    <span className={`font-semibold font-mono ${parsedMetadata?.projectNumber ? 'text-semantic-success-dark' : 'text-semantic-danger-dark'}`}>
                      {parsedMetadata?.projectNumber || 'Missing Project Number'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parsed Customer:</span>
                    <span className="font-semibold text-ink">{parsedMetadata?.customer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BOM Release Date:</span>
                    <span className="font-semibold font-mono text-ink">{parsedMetadata?.releaseDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-canvas border border-border-gray rounded-[12px] flex flex-col items-center justify-center text-center space-y-2 my-2">
                <div className="w-9 h-9 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">No BOM Document Uploaded</p>
                  <p className="text-[11px] text-cool-gray mt-0.5">Upload a .xlsx file or initialize a manual BOM sheet to parse details.</p>
                </div>
              </div>
            )}
          </div>

          {file && (
            <div className="flex space-x-3 mt-4 shrink-0">
              <button 
                onClick={handleValidate} 
                className="flex-1 py-2 rounded-[12px] bg-white hover:bg-canvas text-ink border border-border-gray text-xs font-semibold shadow-subtle transition-all cursor-pointer"
              >
                Validate Data
              </button>
              <button 
                onClick={handleConvert} 
                className="flex-1 py-2 rounded-[12px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all cursor-pointer"
              >
                Convert Rows
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Rows & Validation Stats Panel */}
      {rows.length > 0 && (
        <div className="space-y-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-4 flex items-center justify-between border-l-4 border-primary">
              <div>
                <p className="text-[10px] text-mute uppercase tracking-widest font-semibold">Total Processed Rows</p>
                <p className="text-xl font-semibold text-ink font-mono mt-1">{totalItemsCount}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-cool-gray opacity-40" />
            </div>

            <div className={`bg-white border border-border-gray rounded-[12px] shadow-subtle p-4 flex items-center justify-between border-l-4 ${invalidRowsCount > 0 ? 'border-semantic-danger' : 'border-semantic-success'}`}>
              <div>
                <p className="text-[10px] text-mute uppercase tracking-widest font-semibold">Validation Status</p>
                <p className={`text-xl font-semibold font-mono mt-1 ${invalidRowsCount > 0 ? 'text-semantic-danger-dark' : 'text-semantic-success-dark'}`}>
                  {invalidRowsCount > 0 ? `${invalidRowsCount} Incomplete / Action Required` : '✓ All Clean'}
                </p>
              </div>
              {invalidRowsCount > 0 ? (
                <AlertCircle className="w-8 h-8 text-semantic-danger opacity-40" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-semantic-success opacity-40" />
              )}
            </div>
          </div>

          {/* BOM Sign-off & Authorization Signatories Bar */}
          <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-ink tracking-wider uppercase flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                BOM Approval Sign-off Signatories
              </h4>
              <span className="text-[10px] font-semibold text-cool-gray">Included on Excel Export & Documentation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* VERIFIED BY DESIGNER */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                  Verified By Designer
                </label>
                <input 
                  type="text"
                  value={verifiedByDesigner}
                  onChange={(e) => setVerifiedByDesigner(e.target.value)}
                  placeholder="Designer / Engineer Name"
                  className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* PREPARED BY */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                  Prepared By
                </label>
                <input 
                  type="text"
                  value={preparedBy}
                  onChange={(e) => setPreparedBy(e.target.value)}
                  placeholder="Design / Engineering Team"
                  className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* CHECKED BY */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                  Checked By
                </label>
                <input 
                  type="text"
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  placeholder="Checker / Lead Name"
                  className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* AUTHORISED SIGNATORY */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                  Authorised Signatory
                </label>
                <input 
                  type="text"
                  value={authorisedSignatory}
                  onChange={(e) => setAuthorisedSignatory(e.target.value)}
                  placeholder="Manager / Authority Name"
                  className="w-full bg-canvas border border-border-gray rounded-[12px] px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MATERIAL RATE CONFIRMATION SECTION ── */}
      {rows.length > 0 && Object.keys(materialRates).length > 0 && (
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5 space-y-4 shrink-0 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-gray">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-[8px] bg-primary/10 text-primary">
                  <Tag className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                  Material Rate Confirmation
                </h3>
                {isRatesConfirmed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Rates Confirmed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-mute mt-0.5">
                Verify current material rates before calculating the BOM
              </p>
            </div>

            {/* Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-[8px] bg-canvas border border-border-gray text-cool-gray font-medium text-[11px]">
                {Object.keys(materialRates).length} Unique Materials
              </span>
              {Object.values(materialRates).filter(r => r.status === 'CHANGED').length > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
                  {Object.values(materialRates).filter(r => r.status === 'CHANGED').length} Changed
                </span>
              )}
              {Object.values(materialRates).filter(r => r.status === 'NEW').length > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-blue-50 border border-blue-200 text-blue-800 font-semibold text-[11px]">
                  {Object.values(materialRates).filter(r => r.status === 'NEW').length} New Material
                </span>
              )}
              {Object.values(materialRates).filter(r => r.status === 'MISSING').length > 0 && (
                <span className="px-2.5 py-1 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-[11px]">
                  {Object.values(materialRates).filter(r => r.status === 'MISSING').length} Rate Missing
                </span>
              )}
            </div>
          </div>

          {/* Rates Table */}
          <div className="overflow-x-auto border border-border-gray rounded-[10px] bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas text-ink/70 font-semibold text-[10px] uppercase tracking-wider border-b border-border-gray">
                <tr>
                  <th className="px-4 py-2.5">Material</th>
                  <th className="px-4 py-2.5 text-center">Master Rate</th>
                  <th className="px-4 py-2.5 text-center">Current BOM Rate</th>
                  <th className="px-3 py-2.5 text-center">Unit</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {Object.values(materialRates).map(rateItem => {
                  const isMissing = rateItem.status === 'MISSING';
                  const isChanged = rateItem.status === 'CHANGED';
                  const isNew = rateItem.status === 'NEW';
                  const isValid = rateItem.status === 'VALID';

                  return (
                    <tr key={rateItem.materialName} className="hover:bg-slate-50/70 transition-colors">
                      {/* Material Name */}
                      <td className="px-4 py-2.5 font-semibold text-ink font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span>{rateItem.materialName}</span>
                          {rateItem.matchedMaterialName && rateItem.matchedMaterialName !== rateItem.materialName && (
                            <span className="text-[9px] text-mute font-sans font-normal">
                              ({rateItem.matchedMaterialName})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Master Reference Rate */}
                      <td className="px-4 py-2.5 text-center font-mono text-[11px] text-cool-gray">
                        {rateItem.masterRate !== null ? (
                          <span>₹{rateItem.masterRate.toFixed(2)} / {rateItem.defaultUom}</span>
                        ) : (
                          <span className="text-mute italic text-[10px]">Not Found</span>
                        )}
                      </td>

                      {/* Current BOM Rate (Editable) */}
                      <td className="px-4 py-2.5 text-center">
                        <div className="inline-flex items-center gap-1 max-w-[150px] mx-auto">
                          <span className="text-cool-gray text-xs">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={rateItem.currentRate !== null && rateItem.currentRate !== undefined ? rateItem.currentRate : ''}
                            onChange={(e) => handleMaterialRateChange(rateItem.materialName, e.target.value)}
                            placeholder="Enter Rate"
                            className={`w-28 text-center font-mono font-semibold text-xs rounded-[8px] px-2 py-1 transition-all focus:outline-none focus:ring-1 ${
                              isMissing
                                ? 'bg-rose-50 border border-rose-400 text-rose-700 placeholder:text-rose-400 focus:ring-rose-500'
                                : isChanged
                                ? 'bg-amber-50 border border-amber-300 text-amber-900 focus:ring-amber-500'
                                : 'bg-canvas border border-border-gray text-ink focus:ring-primary'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Base Unit */}
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-cool-gray">
                        {rateItem.defaultUom}
                      </td>

                      {/* Status Badge */}
                      <td className="px-3 py-2.5 text-center">
                        {isValid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </span>
                        )}
                        {isChanged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Custom rate applied for this BOM transaction">
                            <RefreshCw className="w-3 h-3" /> Changed
                          </span>
                        )}
                        {isNew && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Plus className="w-3 h-3" /> New Material
                          </span>
                        )}
                        {isMissing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Rate Missing
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-2.5 text-center">
                        {isNew ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAddMaterialModal(rateItem.materialName, rateItem.currentRate)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold transition-all shadow-subtle cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Material</span>
                          </button>
                        ) : isChanged ? (
                          <button
                            type="button"
                            onClick={() => handleResetRateToMaster(rateItem.materialName)}
                            className="text-[10px] font-medium text-cool-gray hover:text-ink underline transition-colors cursor-pointer"
                            title="Reset to Master Reference Rate"
                          >
                            Reset to Master
                          </button>
                        ) : (
                          <span className="text-[10px] text-mute">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Form Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-cool-gray">
              <Lock className="w-3.5 h-3.5 text-cool-gray shrink-0" />
              <span>
                Confirmed rates are applied directly to this BOM/PO. Master Data reference standard costs are preserved.
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmRatesAndContinue}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-[12px] font-semibold text-xs shadow-subtle transition-all cursor-pointer ${
                Object.values(materialRates).some(r => r.currentRate === null || r.currentRate <= 0)
                  ? 'bg-canvas border border-border-gray text-mute cursor-not-allowed opacity-70'
                  : 'bg-primary hover:bg-primary-hover active:scale-[0.98] text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Confirm Rates & Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview & Correction Workspace */}
      {rows.length > 0 && (
        (() => {
          const content = (
            <div className={isFullscreen 
              ? "fixed inset-0 z-[99999] bg-white/95 backdrop-blur-3xl p-4 md:p-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
              : "bg-white border border-border-gray rounded-[12px] shadow-subtle p-6 flex-1 min-h-0 flex flex-col relative overflow-hidden transition-all duration-300"
            }>
              
              {/* Section Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink flex items-center tracking-widest uppercase">
                    <Eye className="w-4 h-4 mr-2 text-cool-gray" />
                    BOM mapping preview
                  </h3>
                  <p className="text-[10px] text-mute mt-0.5 uppercase tracking-wider">Configure, resolve errors, and double-check before generation</p>
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAddManualRow}
                    className="flex items-center space-x-1.5 bg-white hover:bg-canvas text-ink border border-border-gray font-semibold text-xs px-3.5 py-1.5 rounded-[12px] shadow-subtle transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-cool-gray" />
                    <span>Add Component Row</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center space-x-1.5 bg-white hover:bg-canvas border border-border-gray text-ink font-semibold text-xs px-3 py-1.5 rounded-[12px] shadow-subtle transition-all cursor-pointer"
                  >
                    {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? 'Exit Details' : 'View Details'}</span>
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex bg-canvas border border-border-gray rounded-[12px] p-0.5 shadow-subtle">
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'tree' ? 'bg-white text-ink shadow-subtle' : 'text-cool-gray hover:text-ink'
                      }`}
                    >
                      Tree View
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                        viewMode === 'grid' ? 'bg-white text-ink shadow-subtle' : 'text-cool-gray hover:text-ink'
                      }`}
                    >
                      Flat Grid
                    </button>
                  </div>

                  {/* Filter Pill Tabs */}
                  <div className="flex bg-canvas border border-border-gray rounded-[12px] p-0.5 shadow-subtle">
                    <button
                      onClick={() => setActivePreviewTab('all')}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                        activePreviewTab === 'all' ? 'bg-white text-ink shadow-subtle' : 'text-cool-gray hover:text-ink'
                      }`}
                    >
                      All ({totalItemsCount})
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('errors')}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                        activePreviewTab === 'errors' ? 'bg-white text-semantic-danger-dark shadow-subtle' : 'text-cool-gray hover:text-semantic-danger'
                      }`}
                    >
                      Errors ({invalidRowsCount})
                    </button>
                    <button
                      onClick={() => setActivePreviewTab('valid')}
                      className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                        activePreviewTab === 'valid' ? 'bg-white text-semantic-success-dark shadow-subtle' : 'text-cool-gray hover:text-semantic-success'
                      }`}
                    >
                      Valid ({validRowsCount})
                    </button>
                  </div>

                  {rows.length > 0 && (
                    <div className="flex items-center gap-2 ml-1">
                      <button 
                        onClick={() => exportPremiumBOM(project, rows, allMaterials, { verifiedByDesigner, preparedBy, checkedBy, authorisedSignatory })} 
                        className="flex items-center space-x-1.5 bg-semantic-success-subtle hover:bg-semantic-success/20 text-semantic-success-dark border border-semantic-success/20 font-semibold text-xs px-3.5 py-1.5 rounded-[12px] shadow-subtle transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-semantic-success-dark" />
                        <span>Export Premium BOM</span>
                      </button>

                      {!isProjectClosed && (
                        <>
                          <button 
                            onClick={() => {
                              if (invalidRowsCount > 0) {
                                error("Incomplete BOM", `Please resolve ${invalidRowsCount} missing material/rate/cost fields before saving.`);
                                setValidationRun(true);
                                setActivePreviewTab('errors');
                                return;
                              }
                              if (onSaveBOM) onSaveBOM(rows);
                            }} 
                            className="flex items-center space-x-1.5 bg-white hover:bg-canvas text-ink border border-border-gray font-semibold text-xs px-3.5 py-1.5 rounded-[12px] shadow-subtle transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            <span>Save to Database</span>
                          </button>

                          <button 
                            onClick={() => {
                              if (invalidRowsCount > 0) {
                                error("Incomplete BOM", `Please resolve ${invalidRowsCount} missing material/rate/cost fields before proceeding to PO.`);
                                setValidationRun(true);
                                setActivePreviewTab('errors');
                                return;
                              }
                              if (onProceedToPO) {
                                onProceedToPO(rows);
                              } else if (onSaveBOM) {
                                onSaveBOM(rows);
                              }
                            }} 
                            className="flex items-center space-x-1.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-semibold text-xs px-4 py-1.5 rounded-[12px] shadow-subtle transition-all cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Save & Proceed to PO</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

          {/* Core Table Grid - 100% Fit Without Horizontal Scroll */}
          <div className="flex-1 overflow-y-auto min-h-0 border border-border-gray rounded-[12px] bg-white shadow-subtle">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-canvas text-ink/70 font-semibold tracking-tight sticky top-0 z-20 border-b border-border-gray text-[10px]">
                <tr>
                  <th className="px-1.5 py-2.5 text-center w-7 uppercase text-cool-gray">SR</th>
                  <th className="px-1.5 py-2.5 text-center w-14 uppercase text-cool-gray">TOOL NO</th>
                  <th className="px-1.5 py-2.5 text-center w-10 uppercase text-cool-gray">DET</th>
                  <th className="px-2 py-2.5 text-left w-24 uppercase text-cool-gray">PART NAME</th>
                  <th className="px-1.5 py-2.5 text-center w-36 uppercase text-cool-gray">FINISH <span className="text-[8.5px] font-normal lowercase text-cool-gray/60">(mm)</span></th>
                  <th className="px-1.5 py-2.5 text-center w-36 uppercase text-cool-gray">RM SIZE <span className="text-[8.5px] font-normal lowercase text-cool-gray/60">(mm)</span></th>
                  <th className="px-2 py-2.5 text-left w-28 uppercase text-cool-gray">MATERIAL</th>
                  <th className="px-1 py-2.5 text-center w-10 uppercase text-cool-gray">TYPE</th>
                  <th className="px-1.5 py-2.5 text-center w-10 uppercase text-cool-gray">QTY</th>
                  <th className="px-1.5 py-2.5 text-center w-14 uppercase text-cool-gray whitespace-nowrap">UNIT WT <span className="text-[8.5px] font-normal lowercase text-cool-gray/60">(kg)</span></th>
                  <th className="px-1.5 py-2.5 text-center w-14 uppercase text-cool-gray whitespace-nowrap">TOT WT <span className="text-[8.5px] font-normal lowercase text-cool-gray/60">(kg)</span></th>
                  <th className="px-1.5 py-2.5 text-center w-16 uppercase text-cool-gray whitespace-nowrap">RATE <span className="text-[8.5px] font-normal text-cool-gray/60">₹</span></th>
                  <th className="px-1.5 py-2.5 text-center w-14 uppercase text-cool-gray whitespace-nowrap">BASIC <span className="text-[8.5px] font-normal text-cool-gray/60">₹</span></th>
                  <th className="px-1 py-2.5 text-center w-9 uppercase text-cool-gray">GST <span className="text-[8.5px] font-normal text-cool-gray/60">%</span></th>
                  <th className="px-1.5 py-2.5 text-center w-14 uppercase text-cool-gray whitespace-nowrap">TOTAL <span className="text-[8.5px] font-normal text-cool-gray/60">₹</span></th>
                  <th className="px-1 py-2.5 text-center w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {(() => {
                  const renderRow = (row: ParsedBOMRow, idxOrTree: number | boolean = false, level = 0, isParent = false, isExpanded = false) => {
                    const isMissingMat = !row.materialInput || !row.materialInput.trim();
                    const isMissingRate = (!row.rate || Number(row.rate) <= 0 || isNaN(Number(row.rate)));
                    const isMissingBasic = (!row.basicCost || Number(row.basicCost) <= 0 || isNaN(Number(row.basicCost)));
                    const gstPctVal = Number(row.gstPercent !== undefined && row.gstPercent !== null ? row.gstPercent : 18);

                    return (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          row.validationError ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* SR NO */}
                        <td className="px-1 py-1.5 text-center font-mono text-cool-gray text-[10px]">
                          {typeof idxOrTree === 'number' ? idxOrTree + 1 : row.srNo}
                        </td>

                        {/* TOOL NO */}
                        <td className="px-1 py-1.5 text-center">
                          <input 
                            type="text" 
                            value={row.toolNo || ''} 
                            onChange={(e) => handleCellEdit(row.id, 'toolNo', e.target.value)}
                            className="w-full bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* DET NO / TREE TOGGLE */}
                        <td className="px-1 py-1.5 text-center font-mono text-ink font-semibold text-[10px]">
                          <div className="flex items-center justify-center space-x-0.5">
                            {isParent ? (
                              <button 
                                onClick={() => toggleNodeExpanded(String(row.srNo))}
                                className="p-0.5 text-primary hover:text-primary-hover focus:outline-none cursor-pointer"
                                title={isExpanded ? "Collapse Assembly" : "Expand Assembly"}
                              >
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" /> : <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </button>
                            ) : level > 0 ? (
                              <span className="text-zinc-400 font-mono text-[10px] shrink-0">└</span>
                            ) : null}
                            <span>{row.srNo}</span>
                          </div>
                        </td>

                        {/* PART NAME */}
                        <td className="px-2 py-1.5 text-ink font-semibold text-[11px] truncate max-w-[130px]" title={row.partName}>
                          <input 
                            type="text" 
                            value={row.partName || ''} 
                            onChange={(e) => handleCellEdit(row.id, 'partName', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-border-gray focus:border-blue-500 focus:bg-canvas rounded px-1 py-0.5 text-ink font-semibold text-[11px] focus:outline-none transition-colors"
                          />
                        </td>

                        {/* FINISH (L x W x H or Ø Dia x Len) */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <span className="text-zinc-400 text-[10px] font-mono">-</span>
                          ) : row.finishL === 'Ø' || String(row.finishSize).startsWith('Ø') ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleFinishShape(row.id)}
                                className="px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold font-mono text-[10px] cursor-pointer transition-colors shadow-xs"
                                title="Cylindrical Round Bar (Ø Dia × Len). Click to switch to Rectangular (L × W × H)"
                              >
                                Ø
                              </button>
                              <input 
                                type="text" 
                                value={row.finishW || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'finishW', e.target.value)}
                                placeholder="Dia"
                                title="Finished Diameter (mm)"
                                className="w-11 bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px] font-semibold">×</span>
                              <input 
                                type="text" 
                                value={row.finishH || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'finishH', e.target.value)}
                                placeholder="Len"
                                title="Finished Length (mm)"
                                className="w-11 bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-0.5">
                              <input 
                                type="text" 
                                value={row.finishL || ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Ø' || val.toLowerCase() === 'dia') {
                                    handleCellEdit(row.id, 'finishL', 'Ø');
                                  } else {
                                    handleCellEdit(row.id, 'finishL', val);
                                  }
                                }}
                                placeholder="L"
                                title="Finished Length (mm) — or type Ø for Round"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px]">×</span>
                              <input 
                                type="text" 
                                value={row.finishW || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'finishW', e.target.value)}
                                placeholder="W"
                                title="Finished Width (mm)"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px]">×</span>
                              <input 
                                type="text" 
                                value={row.finishH || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'finishH', e.target.value)}
                                placeholder="H"
                                title="Finished Height / Thickness (mm)"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </td>

                        {/* RM SIZE (L x W x H or Ø Dia x Len) */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <span className="text-zinc-400 text-[10px] font-mono">-</span>
                          ) : row.length === 'Ø' || String(row.rawMaterialSize).startsWith('Ø') ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleRmShape(row.id)}
                                className="px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold font-mono text-[10px] cursor-pointer transition-colors shadow-xs"
                                title="Cylindrical Round Bar (Ø Dia × Len). Click to switch to Rectangular (L × W × H)"
                              >
                                Ø
                              </button>
                              <input 
                                type="text" 
                                value={row.width || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'width', e.target.value)}
                                placeholder="Dia"
                                title="Raw Material Diameter (mm)"
                                className="w-11 bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px] font-semibold">×</span>
                              <input 
                                type="text" 
                                value={row.height || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'height', e.target.value)}
                                placeholder="Len"
                                title="Raw Material Length (mm)"
                                className="w-11 bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-0.5">
                              <input 
                                type="text" 
                                value={row.length || ''} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Ø' || val.toLowerCase() === 'dia') {
                                    handleCellEdit(row.id, 'length', 'Ø');
                                  } else {
                                    handleCellEdit(row.id, 'length', val);
                                  }
                                }}
                                placeholder="L"
                                title="Raw Material Length (mm) — or type Ø for Round"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px]">×</span>
                              <input 
                                type="text" 
                                value={row.width || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'width', e.target.value)}
                                placeholder="W"
                                title="Raw Material Width (mm)"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <span className="text-cool-gray text-[9px]">×</span>
                              <input 
                                type="text" 
                                value={row.height || ''} 
                                onChange={(e) => handleCellEdit(row.id, 'height', e.target.value)}
                                placeholder="H"
                                title="Raw Material Height / Thickness (mm)"
                                className="w-9 bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-ink text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </td>

                        {/* MATERIAL */}
                        <td className="px-1.5 py-1.5 text-left">
                          <input 
                            type="text" 
                            value={row.materialInput || ''} 
                            onChange={(e) => handleCellEdit(row.id, 'materialInput', e.target.value)}
                            placeholder="Material from Excel"
                            className={`w-full text-[10px] rounded px-1.5 py-0.5 focus:outline-none font-medium border font-mono ${
                              row.isBoughtOut
                                ? 'bg-amber-50/50 border-amber-300 text-amber-900 font-semibold'
                                : isMissingMat 
                                  ? 'bg-rose-50 border-rose-400 text-rose-700 placeholder:text-rose-400' 
                                  : 'bg-canvas border-border-gray text-ink focus:ring-1 focus:ring-primary'
                            }`}
                            title={row.matchedMaterialName ? `Matched Master: ${row.matchedMaterialName}` : (row.materialInput || 'Enter material')}
                          />
                        </td>

                        {/* TYPE */}
                        <td className="px-1 py-1.5 text-center">
                          <span 
                            onClick={() => handleCellEdit(row.id, 'isBoughtOut', !row.isBoughtOut)}
                            className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded cursor-pointer select-none transition-all ${
                              row.isBoughtOut 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            }`}
                            title="Click to toggle between RM (Raw Material) and STD (Standard Bought-out Item)"
                          >
                            {row.isBoughtOut ? 'STD' : 'RM'}
                          </span>
                        </td>

                        {/* QTY */}
                        <td className="px-1 py-1.5 text-center">
                          <input type="number" value={Number.isNaN(row.quantity) ? '' : (row.quantity || '')} onChange={(e) => handleCellEdit(row.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-ink text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>

                        {/* AP WT */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <span className="text-zinc-400 text-[10px] font-mono">-</span>
                          ) : (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.apWeight) || row.apWeight === null ? '' : (row.apWeight || '')} 
                              onChange={(e) => handleCellEdit(row.id, 'apWeight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-canvas border border-border-gray rounded px-1 py-0.5 text-center font-mono text-emerald-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              step="0.01"
                            />
                          )}
                        </td>

                        {/* TOTAL WT */}
                        <td className="px-1 py-1.5 text-center font-mono text-emerald-600 font-semibold text-[10px]">
                          {row.isBoughtOut ? '-' : (row.totalWeight ? Number(row.totalWeight).toFixed(2) : '-')}
                        </td>

                        {/* RATE */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.rate) || row.rate === null ? '' : (row.rate ?? '')} 
                              onChange={(e) => handleCellEdit(row.id, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder="Req ₹/pc"
                              className={`w-full rounded px-1 py-0.5 text-center font-mono text-[11px] focus:outline-none focus:ring-1 ${
                                isMissingRate 
                                  ? 'bg-rose-50 border border-rose-400 text-rose-700 placeholder:text-rose-400 focus:ring-rose-500' 
                                  : 'bg-amber-50 border border-amber-300 text-amber-800 font-semibold focus:ring-amber-500'
                              }`}
                              step="0.01"
                              title="Standard Item Unit Price per piece (₹/pc)"
                            />
                          ) : (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.rate) || row.rate === null ? '' : (row.rate ?? '')} 
                              onChange={(e) => handleCellEdit(row.id, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder="₹/kg"
                              className={`w-full rounded px-1 py-0.5 text-center font-mono text-[11px] focus:outline-none focus:ring-1 ${
                                isMissingRate 
                                  ? 'bg-rose-50 border border-rose-400 text-rose-700 placeholder:text-rose-400 focus:ring-rose-500' 
                                  : 'bg-canvas border border-border-gray text-ink focus:ring-blue-500'
                              }`}
                              step="0.01"
                              title="Raw Material Rate (₹/kg)"
                            />
                          )}
                        </td>

                        {/* BASIC COST */}
                        <td className="px-1 py-1.5 text-center font-mono font-semibold text-[10px]">
                          {isMissingBasic ? (
                            <span className="text-rose-500" title="Missing basic cost calculation">-</span>
                          ) : (
                            <span className="text-primary">{Number(row.basicCost).toFixed(2)}</span>
                          )}
                        </td>

                        {/* GST */}
                        <td className="px-1 py-1.5 text-center">
                          <input type="number" value={Number.isNaN(row.gstPercent) ? '' : (row.gstPercent || '')} onChange={(e) => handleCellEdit(row.id, 'gstPercent', e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-canvas border border-border-gray rounded px-0.5 py-0.5 text-center font-mono text-zinc-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500" step="1" />
                        </td>

                        {/* TOTAL */}
                        <td className="px-1 py-1.5 text-center font-mono font-semibold text-[10px]">
                          {isMissingBasic ? (
                            <span className="text-rose-500" title="Missing total calculation">-</span>
                          ) : (
                            <span className="text-ink">{(Number(row.basicCost) * (1 + gstPctVal / 100)).toFixed(2)}</span>
                          )}
                        </td>

                        {/* DELETE */}
                        <td className="px-1 py-1.5 text-center">
                          <button onClick={() => handleDeleteRow(row.id)} className="p-0.5 hover:bg-red-100 text-zinc-400 hover:text-red-500 rounded transition-colors" title="Delete Item">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  };

                  if (viewMode === 'tree' && activePreviewTab === 'all') {
                    const tree = buildTree(filteredRows);
                    const flatNodes = getFlatVisibleNodes(tree, expandedNodes);
                    return flatNodes.filter(n => n.isVisible).map(({ node }) => {
                      const hasChildren = node.children.length > 0;
                      const isExpanded = expandedNodes[String(node.row.srNo).trim()] !== false;
                      return renderRow(node.row, true, node.level, hasChildren, isExpanded);
                    });
                  }

                  return filteredRows.map((row, idx) => renderRow(row, idx));
                })()}
              </tbody>
            </table>
          </div>

          {/* Floating Validation Error Display */}
          {validationRun && (invalidRowsCount > 0 || !parsedMetadata?.projectNumber) && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[12px] shrink-0">
              <h4 className="text-xs font-semibold text-red-400 flex items-center uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Mapping Invariants / Core Failures
              </h4>
              <ul className="text-[10px] text-red-300/80 font-semibold space-y-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                {!parsedMetadata?.projectNumber && (
                  <li className="flex items-start">
                    <span className="font-mono text-red-400/70 mr-2 shrink-0">Global:</span>
                    <span>Project Number (Tool No) is missing from file headers.</span>
                  </li>
                )}
                {rows.filter(r => r.validationError !== null).map((r, i) => (
                  <li key={i} className="flex items-start">
                    <span className="font-mono text-red-400/70 mr-2 shrink-0">Row {r.srNo}:</span>
                    <span>{r.validationError}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

            </div>
          );

          if (isFullscreen && mounted) {
            return createPortal(content, document.body);
          }
          return content;
        })()
      )}

      {/* ── QUICK ADD NEW MATERIAL MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-border-gray rounded-[16px] shadow-2xl max-w-md w-full p-6 space-y-4 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border-gray pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-primary/10 text-primary">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink uppercase tracking-wide">ADD NEW MATERIAL</h3>
                  <p className="text-[11px] text-cool-gray">Register material in Material Master & confirm BOM rate</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-cool-gray hover:text-ink rounded-lg hover:bg-canvas transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMaterial} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    Material Code / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterialForm.materialCode}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, materialCode: e.target.value }))}
                    placeholder="e.g. SPECIAL-XYZ"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    Material Grade *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterialForm.materialGrade}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, materialGrade: e.target.value }))}
                    placeholder="e.g. Special Tool Steel"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newMaterialForm.standardCost}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, standardCost: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                    placeholder="e.g. 350"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    Base Unit (UOM) *
                  </label>
                  <select
                    value={newMaterialForm.defaultUom}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, defaultUom: e.target.value }))}
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="KG">Kilograms (KG)</option>
                    <option value="NOS">Numbers (NOS)</option>
                    <option value="MTR">Meters (MTR)</option>
                    <option value="LTR">Liters (LTR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    Density (g/cm³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMaterialForm.density}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, density: parseFloat(e.target.value) || 7.85 }))}
                    placeholder="7.85"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    GST %
                  </label>
                  <input
                    type="number"
                    value={newMaterialForm.gstPercent}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, gstPercent: parseFloat(e.target.value) || 18 }))}
                    placeholder="18"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-cool-gray tracking-wider uppercase">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={newMaterialForm.hsnCode}
                    onChange={(e) => setNewMaterialForm(prev => ({ ...prev, hsnCode: e.target.value }))}
                    placeholder="e.g. 7228"
                    className="w-full bg-canvas border border-border-gray rounded-[10px] px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-gray">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-[10px] bg-canvas hover:bg-slate-100 border border-border-gray text-xs font-semibold text-cool-gray transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newMaterialForm.isSaving}
                  className="px-4.5 py-2 rounded-[10px] bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-subtle transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {newMaterialForm.isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
