"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx-js-style';
import ExcelJS from 'exceljs';
import { applyKrupaHeader } from '@/utils/excelHeaderTemplate';
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
  Plus
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useProjectBOM } from '@/hooks/useEngineering';
import { useMasterData } from '@/hooks/useMasterData';

interface BomConverterProps {
  projectId: string;
  project: any;
  materials?: any[];
  onSaveBOM?: (rows: any[]) => void;
  onProceedToPO?: (rows: any[]) => void;
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
  const { success, error, warning } = useToast();

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

  const { data: existingBom } = useProjectBOM(projectId);
  const { data: masterMaterialsRes = [] } = useMasterData('materials');
  
  const masterMaterials = Array.isArray(masterMaterialsRes) ? masterMaterialsRes : (masterMaterialsRes as any)?.data || [];
  const allMaterials = masterMaterials.length > 0 ? masterMaterials : (materials || []);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    if (existingBom?.items && existingBom.items.length > 0 && rows.length === 0 && !isConverted) {
      const loadedRows: ParsedBOMRow[] = existingBom.items.map((item: any, idx: number) => {
        const cf = item.customFields || {};
        const rmVal = item.rawSize || cf.rawMaterialSize || item.dimensions || '';
        const finishVal = cf.finishSize || '';
        const dimensions = parseDimensions(rmVal);
        const fDimensions = parseDimensions(finishVal);
        const defaultPartName = project?.partName || project?.name || '';
        const nameVal = cf.partName || item.partName || defaultPartName;

        const parsedItem: ParsedBOMRow = {
          id: item.id || `db-row-${idx}`,
          toolNo: cf.toolNo || project?.projectNumber || '',
          srNo: cf.srNo || (idx + 1).toString(),
          partName: nameVal,
          description: item.remarks || cf.description || '',
          quantity: item.requiredQty || 1,
          finishSize: finishVal,
          finishL: fDimensions.length as any,
          finishW: fDimensions.width as any,
          finishH: fDimensions.height as any,
          rawMaterialSize: rmVal,
          materialInput: item.material ? `${item.material.materialCode} - ${item.material.materialGrade}` : (cf.materialInput || nameVal),
          catalogSize: item.catalogSize || cf.catalogSize || '',
          stockSize: item.stockSize || cf.stockSize || '',
          length: cf.length || dimensions.length as any,
          width: cf.width || dimensions.width as any,
          height: cf.height || dimensions.height as any,
          matchedMaterialId: item.materialId || null,
          matchedMaterialName: item.material ? `${item.material.materialCode} - ${item.material.materialGrade}` : null,
          density: cf.density || null,
          rate: item.estimatedCost && item.calculatedWeight ? item.estimatedCost / item.calculatedWeight : null,
          unitCost: cf.unitCost || null,
          apWeight: cf.apWeight || item.calculatedWeight || null,
          totalWeight: item.calculatedWeight || cf.totalWeight || null,
          basicCost: item.estimatedCost || cf.basicCost || null,
          hsnCode: item.hsnCode || null,
          gstPercent: cf.gstPercent || 18,
          isBoughtOut: cf.isBoughtOut || false,
          validationError: null
        };
        return populateCalculations(parsedItem);
      });
      setRows(loadedRows);
      setIsConverted(true);
    }
  }, [existingBom, project]);

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

  // --- Size Parser ---
  const parseDimensions = (sizeStr: string) => {
    if (!sizeStr) return { length: '-', width: '-', height: '-', isValid: true };
    let cleaned = sizeStr.toString().trim();
    
    // Check for round bar
    const isRound = /^[Ø0O\s]*dia/i.test(cleaned) || /^Ø/i.test(cleaned);
    
    if (isRound) {
       cleaned = cleaned.replace(/^[Ø0O\s]*dia/i, '').replace(/^Ø/i, '').trim();
       const parts = cleaned.split(/[\s]*[xX×\*][\s]*/);
       const dMatch = parts[0]?.match(/([\d\.]+)/);
       const lMatch = parts[1]?.match(/([\d\.]+)/);
       
       const d = dMatch ? parseFloat(dMatch[1]) : NaN;
       const l = lMatch ? parseFloat(lMatch[1]) : NaN;
       const isValid = !isNaN(d) && !isNaN(l) && d > 0 && l > 0;
       
       if (!isValid) return { length: '-', width: '-', height: '-', isValid: true };
       return { length: 'Ø', width: d, height: l, isValid: true };
    }

    const parts = cleaned.split(/[\s]*[xX×\*][\s]*/);
    if (parts.length < 3) {
      return { length: '-', width: '-', height: '-', isValid: true };
    }
    
    const lMatch = parts[0]?.match(/([\d\.]+)/);
    const wMatch = parts[1]?.match(/([\d\.]+)/);
    const hMatch = parts[2]?.match(/([\d\.]+)/);

    const l = lMatch ? parseFloat(lMatch[1]) : NaN;
    const w = wMatch ? parseFloat(wMatch[1]) : NaN;
    const h = hMatch ? parseFloat(hMatch[1]) : NaN;

    const isValid = !isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0;
    if (!isValid) return { length: '-', width: '-', height: '-', isValid: true };
    
    return { length: l, width: w, height: h, isValid: true };
  };

  // --- Calculations ---
  const populateCalculations = (item: ParsedBOMRow): ParsedBOMRow => {
    let matchedMat = null;
    if (item.materialInput && !item.isBoughtOut) {
       const search = item.materialInput.toLowerCase();
       matchedMat = allMaterials.find((m: any) => 
          (item.matchedMaterialId && m.id === item.matchedMaterialId) ||
          `${m.materialCode || ''} - ${m.materialGrade || m.materialName || ''}`.toLowerCase() === search ||
          m.materialCode?.toLowerCase().includes(search) || 
          m.materialGrade?.toLowerCase().includes(search)
       ) || null;
    }

    
    item.matchedMaterialId = matchedMat ? matchedMat.id : null;
    item.matchedMaterialName = matchedMat ? `${matchedMat.materialCode} - ${matchedMat.materialGrade}` : null;
    item.hsnCode = matchedMat?.hsnCode || null;
    item.gstPercent = matchedMat?.gstPercent ? Number(matchedMat.gstPercent) : 18; // Default GST 18% if not set
    
    if (item.isBoughtOut) {
      // Bought-out / Standard items: Unit Cost × Quantity model
      // Weight fields are N/A for bought-out items
      item.density = null;
      item.rate = null;
      item.apWeight = null;
      item.totalWeight = null;
      // Preserve user-entered unitCost, don't reset it
      if (item.unitCost === undefined) item.unitCost = 0;
      item.basicCost = (item.unitCost || 0) * (item.quantity || 0);
    } else {
      // Raw Material items: Weight × Rate model
      item.density = matchedMat ? Number(matchedMat.density || 7.85) : 7.85;
      item.rate = matchedMat ? Number(matchedMat.standardCost || 0) : 0;
      item.unitCost = null;
      
      if (item.length && item.width && item.height) {
          if (item.length === 'Ø') {
             const d = Number(item.width);
             const l = Number(item.height);
             const vol = Math.PI * Math.pow(d / 2, 2) * l;
             item.apWeight = Number(((vol * 0.785) / 100000).toFixed(2));
          } else if (item.length !== '-' && item.width !== '-' && item.height !== '-') {
             const l = Number(item.length);
             const w = Number(item.width);
             const h = Number(item.height);
             const vol = l * w * h;
             item.apWeight = Number(((vol * 0.785) / 100000).toFixed(2));
          } else {
             item.apWeight = 0;
          }
      } else {
          item.apWeight = 0;
      }
      
      item.totalWeight = Number(((item.apWeight || 0) * (item.quantity || 0)).toFixed(2));
      item.basicCost = Number(((item.totalWeight || 0) * (item.rate || 0)).toFixed(2));
    }
    return item;
  };

  // --- Validate Row Data ---
  const validateRow = (row: Partial<ParsedBOMRow>, index: number): string | null => {
    if (!row.srNo || !row.srNo.toString().trim()) {
      return `Row ${index + 1}: Sr No / Detail No is missing.`;
    }
    if (!row.quantity || isNaN(row.quantity) || row.quantity <= 0) {
      return `Row ${index + 1}: Quantity must be greater than 0.`;
    }
    // Bought-out / standard parts (e.g. LIFTER, MYP-25 X 130) don't need material —
    // they are purchased by part name. Only require material if the item has RM dimensions.
    if (!row.isBoughtOut && (!row.materialInput || !row.materialInput.toString().trim())) {
      return `Row ${index + 1}: Material description is empty.`;
    }
    // Even bought-out items must have a part name for identification
    if (row.isBoughtOut && (!row.partName || !row.partName.toString().trim())) {
      return `Row ${index + 1}: Part name is required for bought-out items.`;
    }
    return null;
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

          // Determine if this is a bought-out / standard part:
          // Items with a part name but no material (from MATERIAL column), no RM size, and no finish size
          // are standard/bought-out items purchased as-is (e.g. LIFTER, MYP-25 X 130)
          const isBoughtOut = !!(nameVal && !matVal && !rmVal && !finishVal);

          // For non-bought-out items with no material but a part name and no RM size, 
          // use part name as material fallback
          if (!isBoughtOut && !matVal && nameVal && !rmVal) matVal = nameVal;

          // Resolve dimensions
          const dimensions = parseDimensions(rmVal);
          const fDimensions = parseDimensions(finishVal);

          const item: ParsedBOMRow = {
            id: `row-${r}-${Date.now()}`,
            toolNo: lastToolNo || docProjectNum || project?.projectNumber || '',
            srNo: srVal || (parsedItems.length + 1).toString(),
            partName: nameVal || project?.partName || project?.name || '',
            description: descVal,
            quantity: qtyVal,
            finishSize: finishVal,
            finishL: fDimensions.length as any,
            finishW: fDimensions.width as any,
            finishH: fDimensions.height as any,
            rawMaterialSize: rmVal,
            materialInput: isBoughtOut ? nameVal : matVal,
            catalogSize: catVal,
            stockSize: stockVal,
            length: dimensions.length as any,
            width: dimensions.width as any,
            height: dimensions.height as any,
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
      error("Validation Errors", `Found ${errorCount} errors. Please resolve them before converting.`);
      setActivePreviewTab('errors');
    } else {
      success("Validation Successful", "All items are verified and ready for conversion.");
      setActivePreviewTab('all');
    }
  };

  // --- Inline Grid Edits ---

  const handleCellEdit = (rowId: string, field: keyof ParsedBOMRow, val: any) => {
    setRows(prev => prev.map((row, idx) => {
      if (row.id !== rowId) return row;

      const updated = { ...row, [field]: val };

      if (field === 'rawMaterialSize') {
        const dims = parseDimensions(val);
        updated.length = dims.length as any;
        updated.width = dims.width as any;
        updated.height = dims.height as any;
      }

      if (field === 'length' || field === 'width' || field === 'height') {
        updated.rawMaterialSize = `${updated.length}x${updated.width}x${updated.height}`;
      }

      if (field === 'materialInput') {
        populateCalculations(updated);
      } else if (field === 'rawMaterialSize' || field === 'length' || field === 'width' || field === 'height' || field === 'quantity') {
        populateCalculations(updated);
      } else if (field === 'unitCost') {
        // Bought-out item: recalculate basicCost = unitCost × qty
        updated.basicCost = (updated.unitCost || 0) * (updated.quantity || 0);
      } else if (field === 'apWeight' || field === 'rate' || field === 'gstPercent') {
        // Manual override for RM items: Only recalculate downstream totals
        updated.totalWeight = (updated.apWeight || 0) * (updated.quantity || 0);
        updated.basicCost = (updated.totalWeight || 0) * (updated.rate || 0);
      }

      // Re-validate row
      updated.validationError = validateRow(updated, idx);

      return updated;
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    success("Row Removed", "Item removed from the conversion queue.");
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

    // Signatures
    sheet.getRow(r).height = 24;
    sheet.mergeCells(`A${r}:C${r}`);
    sheet.getCell(`A${r}`).value = 'PREPARED BY (ENGINEERING)';
    sheet.getCell(`A${r}`).font = { bold: true, size: 9 };
    sheet.getCell(`A${r}`).alignment = { horizontal: 'center' };

    sheet.mergeCells(`E${r}:G${r}`);
    sheet.getCell(`E${r}`).value = 'APPROVED BY (HOD)';
    sheet.getCell(`E${r}`).font = { bold: true, size: 9 };
    sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };

    sheet.mergeCells(`I${r}:K${r}`);
    sheet.getCell(`I${r}`).value = 'PURCHASE AUTHORITY';
    sheet.getCell(`I${r}`).font = { bold: true, size: 9 };
    sheet.getCell(`I${r}`).alignment = { horizontal: 'center' };

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
        <div className="lg:col-span-2 glass-panel p-6 relative overflow-hidden flex flex-col justify-center min-h-[220px]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 shadow-elevation' 
                : 'border-zinc-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 shadow-sm'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-blue-400 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-900 mb-1">Drag & Drop Engineering BOM Excel</h3>
            <p className="text-[11px] text-zinc-500 mb-4">Compatible with standard structured .xlsx and .xls formats</p>
            
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
                className="bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 font-semibold text-xs px-4.5 py-2 rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Browse Local File
              </label>

              <button
                type="button"
                onClick={handleAddManualRow}
                className="bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] px-4.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Manual BOM Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 mb-4 tracking-widest uppercase flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-zinc-600" />
              Converter Registry
            </h3>
            
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-sm">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">Size: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Parsed Project (Tool No):</span>
                    <span className={`font-semibold font-mono ${parsedMetadata?.projectNumber ? 'text-emerald-700' : 'text-red-600'}`}>
                      {parsedMetadata?.projectNumber || 'Missing Project Number'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parsed Customer:</span>
                    <span className="font-semibold">{parsedMetadata?.customer || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BOM Release Date:</span>
                    <span className="font-semibold font-mono">{parsedMetadata?.releaseDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-zinc-400 text-xs italic">
                No BOM document uploaded.
              </div>
            )}
          </div>

          {file && (
            <div className="flex space-x-3 mt-4 shrink-0">
              <button 
                onClick={handleValidate} 
                className="flex-1 py-2 rounded-xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Validate Data
              </button>
              <button 
                onClick={handleConvert} 
                className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Convert Rows
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Rows & Validation Stats Panel */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-zinc-900">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Processed Rows</p>
              <p className="text-xl font-bold text-zinc-900 font-mono mt-1">{totalItemsCount}</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-zinc-400 opacity-40" />
          </div>

          <div className={`glass-panel p-4 flex items-center justify-between border-l-4 ${invalidRowsCount > 0 ? 'border-red-500' : 'border-emerald-600'}`}>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Validation Status</p>
              <p className={`text-xl font-bold font-mono mt-1 ${invalidRowsCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {invalidRowsCount > 0 ? `${invalidRowsCount} Errors` : '✓ All Clean'}
              </p>
            </div>
            {invalidRowsCount > 0 ? (
              <AlertCircle className="w-8 h-8 text-red-500 opacity-40" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-40" />
            )}
          </div>
        </div>
      )}

      {/* Preview & Correction Workspace */}
      {rows.length > 0 && (
        (() => {
          const content = (
            <div className={isFullscreen 
              ? "fixed inset-0 z-[99999] bg-white/95 backdrop-blur-3xl p-4 md:p-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
              : "glass-panel p-6 flex-1 min-h-0 flex flex-col relative overflow-hidden transition-all duration-300"
            }>
              
              {/* Section Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center tracking-widest uppercase">
                    <Eye className="w-4 h-4 mr-2 text-zinc-700" />
                    BOM mapping preview
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">Configure, resolve errors, and double-check before generation</p>
                </div>

                {/* Filter & Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAddManualRow}
                    className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Add Component Row</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 font-semibold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? 'Exit Details' : 'View Details'}</span>
                  </button>

                  {activePreviewTab === 'all' && (
                    <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 items-center">
                      <button 
                        onClick={() => setViewMode('tree')} 
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${viewMode === 'tree' ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}
                      >
                        Tree View
                      </button>
                      <button 
                        onClick={() => setViewMode('grid')} 
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-zinc-950 shadow-2xs border border-zinc-200/60 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}
                      >
                        Flat Grid
                      </button>
                    </div>
                  )}

                  <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 items-center">
                    <button 
                      onClick={() => setActivePreviewTab('all')} 
                      className={`px-3 py-1 text-xs transition-all ${activePreviewTab === 'all' ? 'bg-white text-zinc-950 font-bold shadow-2xs rounded-lg border border-zinc-200/60' : 'text-zinc-500 hover:text-zinc-900 font-semibold'}`}
                    >
                      All ({totalItemsCount})
                    </button>
                    <button 
                      onClick={() => setActivePreviewTab('errors')} 
                      className={`px-3 py-1 text-xs transition-all ${activePreviewTab === 'errors' ? 'bg-red-50 text-red-700 font-bold shadow-2xs rounded-lg border border-red-200' : 'text-zinc-500 hover:text-red-600 font-semibold'}`}
                    >
                      Errors ({invalidRowsCount})
                    </button>
                    <button 
                      onClick={() => setActivePreviewTab('valid')} 
                      className={`px-3 py-1 text-xs transition-all ${activePreviewTab === 'valid' ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs rounded-lg border border-emerald-200' : 'text-zinc-500 hover:text-emerald-700 font-semibold'}`}
                    >
                      Valid ({validRowsCount})
                    </button>
                  </div>

                  {rows.length > 0 && (
                    <div className="flex items-center gap-2 ml-1">
                      <button 
                        onClick={handleExportExcel} 
                        className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Download Excel</span>
                      </button>

                      <button 
                        onClick={handleExportExcel} 
                        className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Excel</span>
                      </button>

                      <button 
                        onClick={() => {
                          if (onSaveBOM) onSaveBOM(rows);
                        }} 
                        className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Save to Database</span>
                      </button>

                      <button 
                        onClick={() => {
                          if (onProceedToPO) {
                            onProceedToPO(rows);
                          } else if (onSaveBOM) {
                            onSaveBOM(rows);
                          }
                        }} 
                        className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Save & Proceed to PO</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

          {/* Core Table Grid - 100% Fit Without Horizontal Scroll */}

          <div className="flex-1 overflow-y-auto min-h-0 border border-zinc-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-zinc-100/90 text-zinc-600 font-bold uppercase tracking-tighter sticky top-0 z-20 border-b border-zinc-200 text-[10px]">
                <tr>
                  <th className="px-1 py-2 text-center w-7">SR</th>
                  <th className="px-1 py-2 text-center w-14">TOOL NO</th>
                  <th className="px-1 py-2 text-center w-10">DET NO</th>
                  <th className="px-1 py-2 text-left w-20">PART NAME</th>
                  <th className="px-1 py-2 text-center w-36">FINISH (L×W×H)</th>
                  <th className="px-1 py-2 text-center w-36">RM (L×W×H)</th>
                  <th className="px-1 py-2 text-left w-24">MATERIAL</th>
                  <th className="px-1 py-2 text-center w-10">TYPE</th>
                  <th className="px-1 py-2 text-center w-10">QTY</th>
                  <th className="px-1 py-2 text-center w-16">AP WT / UNIT ₹</th>
                  <th className="px-1 py-2 text-center w-14">TOT WT</th>
                  <th className="px-1 py-2 text-center w-14">RATE</th>
                  <th className="px-1 py-2 text-center w-16">BASIC</th>
                  <th className="px-1 py-2 text-center w-12">GST</th>
                  <th className="px-1 py-2 text-center w-16">TOTAL</th>
                  <th className="px-1 py-2 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(() => {
                  const renderRow = (row: ParsedBOMRow, isTree: boolean, level: number = 0, hasChildren = false, isExpanded = false) => {
                    const gstPctVal = (row.gstPercent === undefined || row.gstPercent === null || Number.isNaN(row.gstPercent)) ? 18 : row.gstPercent;
                    return (
                      <tr 
                        key={row.id} 
                        className={`transition-colors ${
                          row.validationError 
                            ? 'bg-red-500/5 hover:bg-red-500/10' 
                            : 'hover:bg-black/[0.02]'
                        }`}
                      >
                        {/* SR.NO */}
                        <td className="px-1 py-1.5 font-mono font-bold text-zinc-500 text-center">
                          {isTree ? (
                            <div className="flex items-center justify-center" style={{ paddingLeft: `${level * 8}px` }}>
                              {hasChildren ? (
                                <button 
                                  onClick={() => toggleNodeExpanded(String(row.srNo).trim())}
                                  className="mr-0.5 p-0.5 rounded hover:bg-black/5 transition-colors text-zinc-600 focus:outline-none shrink-0"
                                >
                                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                              ) : null}
                              <span className="text-zinc-800 font-bold">{row.srNo}</span>
                            </div>
                          ) : (
                            row.srNo
                          )}
                        </td>

                        {/* TOOL NO */}
                        <td className="px-1 py-1.5 font-mono text-zinc-600 text-center">
                          <input 
                            type="text" 
                            value={row.toolNo || ''} 
                            onChange={(e) => handleCellEdit(row.id, 'toolNo', e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-center text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* DET NO */}
                        <td className="px-1 py-1.5 text-center">
                          <input 
                            type="text" 
                            value={row.srNo} 
                            onChange={(e) => handleCellEdit(row.id, 'srNo', e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-center font-mono text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* PART NAME */}
                        <td className="px-1 py-1.5">
                          <input 
                            type="text" 
                            value={row.partName || ''} 
                            onChange={(e) => handleCellEdit(row.id, 'partName', e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-[11px] text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={project?.partName || project?.name || "Part..."}
                          />
                        </td>

                        {/* Finish size dimension fields (Editable: Length, Width, Height) */}
                        <td className="px-1 py-1.5 text-center">
                          <div className="grid grid-cols-3 gap-0.5 w-full">
                            <input 
                              type="text" 
                              placeholder="L"
                              value={row.finishL || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'finishL', e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="W"
                              value={row.finishW || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'finishW', e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input 
                              type="text" 
                              placeholder="H"
                              value={row.finishH || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'finishH', e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </td>

                        {/* Raw size dimension fields (Editable: Length, Width, Height) */}
                        <td className="px-1 py-1.5 text-center">
                          <div className="grid grid-cols-3 gap-0.5 w-full">
                            <input 
                              type="text" 
                              placeholder="L"
                              value={row.length || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'length', e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input 
                              type="number" 
                              placeholder="W"
                              value={row.width || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'width', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input 
                              type="number" 
                              placeholder="H"
                              value={row.height || ''} 
                              onChange={(e) => handleCellEdit(row.id, 'height', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-900 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </td>

                        {/* MATERIAL (Explicit Master Data Dropdown Select) */}
                        <td className="px-1 py-1.5">
                          <select 
                            value={
                              row.matchedMaterialId || 
                              allMaterials.find((m: any) => {
                                const label = `${m.materialCode || ''} - ${m.materialGrade || m.materialName || ''}`.trim();
                                return label.toLowerCase() === (row.materialInput || '').toLowerCase() ||
                                       m.materialCode?.toLowerCase() === (row.materialInput || '').toLowerCase();
                              })?.id || ''
                            } 
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const matched = allMaterials.find((m: any) => m.id === selectedId);
                              if (matched) {
                                handleCellEdit(row.id, 'matchedMaterialId', matched.id);
                                handleCellEdit(row.id, 'materialInput', `${matched.materialCode} - ${matched.materialGrade || matched.materialName}`);
                              } else {
                                handleCellEdit(row.id, 'matchedMaterialId', null);
                                handleCellEdit(row.id, 'materialInput', selectedId);
                              }
                            }}
                            className={`w-full bg-white border border-zinc-300 rounded px-1.5 py-1 text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs ${
                              row.isBoughtOut ? 'text-amber-600 italic' : 'text-zinc-900 font-bold'
                            }`}
                          >
                            <option value="">-- Select Material --</option>
                            {allMaterials.map((m: any) => {
                              const code = m.materialCode || '';
                              const grade = m.materialGrade || m.materialName || '';
                              const label = grade ? `${code} - ${grade}` : code;
                              const rate = m.standardCost || m.ratePerKg ? ` (₹${m.standardCost || m.ratePerKg}/kg)` : '';
                              return (
                                <option key={m.id || code} value={m.id}>
                                  {label}{rate}
                                </option>
                              );
                            })}
                          </select>
                        </td>



                        {/* TYPE (Bought-out / Raw Material) */}
                        <td className="px-1 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleCellEdit(row.id, 'isBoughtOut', !row.isBoughtOut)}
                            className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer select-none border ${
                              row.isBoughtOut 
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            }`}
                            title="Click to toggle between RM (Raw Material) and STD (Standard Bought-out Item)"
                          >
                            {row.isBoughtOut ? 'STD' : 'RM'}
                          </button>
                        </td>

                        {/* QTY (Editable) */}
                        <td className="px-1 py-1.5 text-center">
                          <input 
                            type="number" 
                            value={Number.isNaN(row.quantity) ? '' : (row.quantity || '')} 
                            onChange={(e) => handleCellEdit(row.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-center font-mono text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* AP WT. / UNIT COST */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.unitCost) ? '' : (row.unitCost || '')} 
                              onChange={(e) => handleCellEdit(row.id, 'unitCost', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              placeholder="Unit ₹"
                              className="w-full bg-amber-50 border border-amber-200 rounded px-1 py-0.5 text-center font-mono text-amber-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                              step="0.01"
                            />
                          ) : (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.apWeight) ? '' : (row.apWeight || '')} 
                              onChange={(e) => handleCellEdit(row.id, 'apWeight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-center font-mono text-emerald-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              step="0.01"
                            />
                          )}
                        </td>

                        {/* TOTAL WT. */}
                        <td className="px-1 py-1.5 text-center font-mono text-emerald-600 font-bold text-[10px]">
                          {row.isBoughtOut ? '-' : (row.totalWeight ? Number(row.totalWeight).toFixed(2) : '-')}
                        </td>

                        {/* RATE */}
                        <td className="px-1 py-1.5 text-center">
                          {row.isBoughtOut ? (
                            <span className="text-zinc-400 text-[10px]">-</span>
                          ) : (
                            <input 
                              type="number" 
                              value={Number.isNaN(row.rate) ? '' : (row.rate || '')} 
                              onChange={(e) => handleCellEdit(row.id, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded px-1 py-0.5 text-center font-mono text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                              step="0.01"
                            />
                          )}
                        </td>

                        {/* BASIC COST */}
                        <td className="px-1 py-1.5 text-center font-mono text-blue-600 font-bold text-[10px]">
                          {row.basicCost ? Number(row.basicCost).toFixed(2) : '-'}
                        </td>

                        {/* GST % */}
                        <td className="px-1 py-1.5 text-center">
                          <input 
                            type="number" 
                            value={Number.isNaN(row.gstPercent) ? '' : (row.gstPercent || '')} 
                            onChange={(e) => handleCellEdit(row.id, 'gstPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded px-0.5 py-0.5 text-center font-mono text-zinc-600 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            step="1"
                          />
                        </td>

                        {/* TOTAL */}
                        <td className="px-1 py-1.5 text-center font-mono text-zinc-900 font-bold text-[10px]">
                          {row.basicCost ? (Number(row.basicCost) * (1 + gstPctVal / 100)).toFixed(2) : '-'}
                        </td>

                        {/* Row Deletion Action */}
                        <td className="px-1 py-1.5 text-center">
                          <button 
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-0.5 hover:bg-red-100 text-zinc-400 hover:text-red-500 rounded transition-colors"
                            title="Delete Item"
                          >
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

                  return filteredRows.map((row) => renderRow(row, false));
                })()}
              </tbody>
            </table>
          </div>

          {/* Floating Validation Error Display */}
          {validationRun && (invalidRowsCount > 0 || !parsedMetadata?.projectNumber) && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
              <h4 className="text-xs font-bold text-red-400 flex items-center uppercase tracking-wider mb-2">
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

    </div>
  );
};
