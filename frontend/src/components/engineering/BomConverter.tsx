"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx-js-style';
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
  ShoppingCart
} from 'lucide-react';
import { useToast } from '../ui/Toast';

interface BomConverterProps {
  projectId: string;
  project: any;
  materials: any[];
  onSaveBOM?: (rows: any[]) => void;
  onProceedToPO?: (rows: any[]) => void;
}

export interface ParsedBOMRow {
  id: string;
  toolNo?: string;
  srNo: string | number;
  partName: string;
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
  matchedMaterialId: string | null;
  matchedMaterialName: string | null;
  density: number | null;
  rate: number | null;
  apWeight: number | null;
  totalWeight: number | null;
  basicCost: number | null;
  hsnCode: string | null;
  gstPercent: number | null;
  validationError: string | null;
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (item.materialInput) {
       const search = item.materialInput.toLowerCase();
       matchedMat = materials.find(m => 
          m.materialCode?.toLowerCase().includes(search) || 
          m.materialGrade?.toLowerCase().includes(search)
       ) || null;
    }
    
    item.matchedMaterialId = matchedMat ? matchedMat.id : null;
    item.matchedMaterialName = matchedMat ? `${matchedMat.materialCode} - ${matchedMat.materialGrade}` : null;
    item.density = matchedMat ? Number(matchedMat.density || 7.85) : 7.85; // Default steel density
    item.rate = matchedMat ? Number(matchedMat.standardCost || 0) : 0;
    item.hsnCode = matchedMat?.hsnCode || null;
    item.gstPercent = matchedMat?.gstPercent ? Number(matchedMat.gstPercent) : 18; // Default GST 18% if not set
    
    if (item.length && item.width && item.height) {
        if (item.length === 'Ø') {
           const d = Number(item.width);
           const l = Number(item.height);
           const vol = Math.PI * Math.pow(d / 2, 2) * l;
           item.apWeight = (vol * item.density) / 1000000;
        } else if (item.length !== '-' && item.width !== '-' && item.height !== '-') {
           const l = Number(item.length);
           const w = Number(item.width);
           const h = Number(item.height);
           const vol = l * w * h;
           item.apWeight = (vol * item.density) / 1000000;
        } else {
           item.apWeight = 0;
        }
    } else {
        item.apWeight = 0;
    }
    
    item.totalWeight = (item.apWeight || 0) * (item.quantity || 0);
    item.basicCost = (item.totalWeight || 0) * (item.rate || 0);
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
    if (!row.materialInput || !row.materialInput.toString().trim()) {
      return `Row ${index + 1}: Material description is empty.`;
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
            
            if (clean.includes("srno") || clean.includes("serial") || clean.includes("detailno") || clean.includes("itemno") || clean === "no" || clean === "sn" || clean === "detno" || clean === "sr") {
              tempMapping["srNo"] = c;
              matches++;
            } else if (clean.includes("partname") || clean.includes("nameofpart") || clean.includes("desc") || clean.includes("component") || clean.includes("itemname") || clean.includes("partdesc") || clean === "part") {
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

          // Check for Tool No column (Fill down if exists, else global tool no)
          if (colMapping["toolNo"] !== undefined) {
             const t = row[colMapping["toolNo"]]?.toString().trim();
             if (t) lastToolNo = t;
          }

          if (!matVal && supVal) matVal = supVal;
          if (!matVal && nameVal && !rmVal) matVal = nameVal;
          
          if (!rmVal && finishVal) rmVal = finishVal;

          if (!srVal && !nameVal && !rmVal && !catVal) continue; // Skip padding blank rows

          // Resolve dimensions
          const dimensions = parseDimensions(rmVal);
          const fDimensions = parseDimensions(finishVal);

          const item: ParsedBOMRow = {
            id: `row-${r}-${Date.now()}`,
            toolNo: lastToolNo || docProjectNum || project.projectNumber,
            srNo: srVal || (parsedItems.length + 1).toString(),
            partName: nameVal,
            quantity: qtyVal,
            finishSize: finishVal,
            finishL: fDimensions.length as any,
            finishW: fDimensions.width as any,
            finishH: fDimensions.height as any,
            rawMaterialSize: rmVal,
            materialInput: matVal,
            catalogSize: catVal,
            stockSize: stockVal,
            length: dimensions.length as any,
            width: dimensions.width as any,
            height: dimensions.height as any,
            matchedMaterialId: null,
            matchedMaterialName: null,
            density: null,
            rate: null,
            apWeight: null,
            totalWeight: null,
            basicCost: null,
            hsnCode: null,
            gstPercent: null,
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
      } else if (field === 'apWeight' || field === 'rate' || field === 'gstPercent') {
        // Manual override: Only recalculate downstream totals, do not wipe user inputs
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
  const handleExportExcel = () => {
    if (rows.length === 0) return;

    // Create a 2D Array representing the formatted template
    const documentData: any[][] = [];

    // Header Structure
    documentData.push(["GLOBAL STEEL SUPPLIERS CORP & TOOLROOMOS ENTERPRISE", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    documentData.push(["PURCHASE MATERIAL ORDER", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    documentData.push([]); // blank spacing
    
    // Metadata block
    documentData.push([
      "Tool No (Project):", parsedMetadata?.projectNumber || project.projectNumber, "", "", 
      "Prepared By:", "Manufacturing Engineering Team", "", "", 
      "Customer:", parsedMetadata?.customer || project.customer?.companyName || "N/A", "", "",
      "Date:", new Date().toLocaleDateString()
    ]);
    documentData.push([
      "Release Date:", parsedMetadata?.releaseDate || new Date().toLocaleDateString(), "", "",
      "", "", "", "",
      "", "", "", "",
      "", ""
    ]);
    documentData.push([]); // blank spacing

    // Table Headers (exactly 14 columns matching company specification)
    const headers = [
      "SR.NO", "TOOL NO", "DET NO", "L", "W", "H", "MATERIAL", "QTY", 
      "AP WT.", "TOTAL WT.", "RATE", "BASIC COST", "GST", "TOTAL"
    ];
    documentData.push(headers);

    // Group Rows by Tool No
    const groupedRows: { [key: string]: typeof rows } = {};
    rows.forEach(r => {
      const t = r.toolNo || parsedMetadata?.projectNumber || project.projectNumber || 'UNKNOWN';
      if (!groupedRows[t]) groupedRows[t] = [];
      groupedRows[t].push(r);
    });

    let grandQty = 0;
    let grandTotalWt = 0;
    let grandTotalCost = 0;

    let currentRowIndex = 7; // Headers are at index 6
    let groupIndex = 1;
    const dynamicMerges: any[] = [];

    Object.entries(groupedRows).forEach(([toolNo, items]) => {
      let groupQty = 0;
      let groupApWt = 0;
      let groupTotalWt = 0;
      let groupBasicCost = 0;
      let groupGst = 0;
      let groupTotalCost = 0;

      const startRowForGroup = currentRowIndex;

      items.forEach((row, idx) => {
        const qty = row.quantity || 0;
        const apWt = row.apWeight || 0;
        const tw = row.totalWeight || 0;
        const rate = row.rate || 0;
        const basic = row.basicCost || 0;
        const gstPct = row.gstPercent || 18;
        const gstAmt = basic * (gstPct / 100);
        const total = basic + gstAmt;

        groupQty += qty;
        groupApWt += apWt;
        groupTotalWt += tw;
        groupBasicCost += basic;
        groupGst += gstAmt;
        groupTotalCost += total;

        documentData.push([
          idx === 0 ? groupIndex : "", // SR.NO
          idx === 0 ? toolNo : "",     // TOOL NO
          row.srNo,                    // DET NO
          row.length,                  // L
          row.width,                   // W
          row.height,                  // H
          row.materialInput,           // MATERIAL
          qty,                         // QTY
          apWt > 0 ? apWt.toFixed(2) : "", // AP WT.
          tw > 0 ? tw.toFixed(2) : "",     // TOTAL WT.
          rate > 0 ? rate.toFixed(2) : "", // RATE
          basic > 0 ? basic.toFixed(2) : "", // BASIC COST
          gstAmt > 0 ? gstAmt.toFixed(2) : "", // GST
          total > 0 ? total.toFixed(2) : ""  // TOTAL
        ]);
        currentRowIndex++;
      });

      // Merge SR.NO and TOOL NO for the group if multiple items
      if (items.length > 1) {
        dynamicMerges.push({ s: { r: startRowForGroup, c: 0 }, e: { r: startRowForGroup + items.length - 1, c: 0 } });
        dynamicMerges.push({ s: { r: startRowForGroup, c: 1 }, e: { r: startRowForGroup + items.length - 1, c: 1 } });
      }

      // Group Subtotal Row
      documentData.push([
        "", "", "", "", "", "", "", // Skip to QTY
        groupQty,
        groupApWt > 0 ? groupApWt.toFixed(2) : "",
        groupTotalWt > 0 ? groupTotalWt.toFixed(2) : "",
        "", // RATE is blank for subtotal
        groupBasicCost > 0 ? groupBasicCost.toFixed(2) : "",
        groupGst > 0 ? groupGst.toFixed(2) : "",
        groupTotalCost > 0 ? groupTotalCost.toFixed(2) : ""
      ]);
      
      // We can also merge the blank cells of the subtotal row to make it cleaner
      dynamicMerges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: 6 } });
      currentRowIndex++;

      grandQty += groupQty;
      grandTotalWt += groupTotalWt;
      grandTotalCost += groupTotalCost;
      groupIndex++;
    });

    // Grand Totals Row
    const grandTotalRowIndex = currentRowIndex;
    documentData.push([
      "GRAND TOTAL", "", "", "", "", "", "",
      grandQty, 
      "", 
      grandTotalWt > 0 ? grandTotalWt.toFixed(2) : "", 
      "", 
      "", 
      "", 
      grandTotalCost > 0 ? grandTotalCost.toFixed(2) : ""
    ]);

    documentData.push([]); // spacing
    documentData.push([]); // spacing

    // Signatures Section
    documentData.push([
      "Prepared By", "", 
      "Approved By", "", 
      "Purchase Authority", "", 
      "Stores In-Charge", "", 
      "Accounts Audit"
    ]);

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(documentData);

    // Margins & Page setup
    ws['!pageSetup'] = { orientation: 'landscape', paperSize: 9 }; // Landscape, A4 Ready
    
    // Merge cell ranges
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Company Header
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Title
      // Merges for GRAND TOTAL cell label
      { s: { r: grandTotalRowIndex, c: 0 }, e: { r: grandTotalRowIndex, c: 6 } },
      ...dynamicMerges
    ];

    // Calculate Column Widths dynamically (Auto column widths)
    const maxCols = 14;
    const colWidths = Array(maxCols).fill(10);
    
    documentData.forEach(r => {
      r.forEach((cell, idx) => {
        if (cell !== undefined && cell !== null && idx < maxCols) {
          const len = cell.toString().length;
          if (len > colWidths[idx]) {
            colWidths[idx] = Math.min(len + 3, 30); // Max width boundary
          }
        }
      });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: w }));

    // Apply styling to all cells (Borders, Alignment, Font for Headers)
    Object.keys(ws).forEach(key => {
      if (key.startsWith('!')) return;
      
      const cell = ws[key];
      if (!cell.s) cell.s = {};
      
      // Default borders
      cell.s.border = {
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      };
      
      // Default center alignment
      cell.s.alignment = { vertical: "center", horizontal: "center", wrapText: true };

      // Optional: If you want to make the headers bold, we can check if it's row 6 (which is index 7)
      // but applying it universally first solves the layout problem!
    });

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");

    // Save Workbook
    const fileName = `${parsedMetadata?.projectNumber || project.projectNumber}_Purchase_Material_Order.xlsx`;
    XLSX.writeFile(wb, fileName);
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
            <label 
              htmlFor="bom-excel-upload"
              className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              Browse Local File
            </label>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-900 mb-4 tracking-widest uppercase flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-blue-400" />
              Converter Registry
            </h3>
            
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-sm">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-zinc-500">Size: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>Parsed Project (Tool No):</span>
                    <span className={`font-semibold font-mono ${parsedMetadata?.projectNumber ? 'text-emerald-400' : 'text-red-400'}`}>
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
              <div className="h-28 flex flex-col items-center justify-center text-slate-500 text-xs italic">
                No BOM document uploaded.
              </div>
            )}
          </div>

          {file && (
            <div className="flex space-x-3 mt-4 shrink-0">
              <button 
                onClick={handleValidate} 
                className="flex-1 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-zinc-900 border border-black/10 text-xs font-bold transition-all"
              >
                Validate Data
              </button>
              <button 
                onClick={handleConvert} 
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 text-white text-xs font-bold transition-all"
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
          <div className="glass-panel p-4 flex items-center justify-between border-l-4 border-blue-500">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Processed Rows</p>
              <p className="text-xl font-bold text-zinc-900 font-mono mt-1">{totalItemsCount}</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-blue-500 opacity-40" />
          </div>

          <div className={`glass-panel p-4 flex items-center justify-between border-l-4 ${invalidRowsCount > 0 ? 'border-red-500' : 'border-emerald-500'}`}>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Validation Status</p>
              <p className={`text-xl font-bold font-mono mt-1 ${invalidRowsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {invalidRowsCount > 0 ? `${invalidRowsCount} Errors` : '✓ All Clean'}
              </p>
            </div>
            {invalidRowsCount > 0 ? (
              <AlertCircle className="w-8 h-8 text-red-500 opacity-40" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-40" />
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
                    <Eye className="w-4 h-4 mr-2 text-indigo-400" />
                    BOM mapping preview
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Configure, resolve errors, and double-check before generation</p>
            </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center space-x-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? 'Exit Details' : 'View Details'}</span>
                  </button>
                  <div className="flex border border-black/10 rounded-lg p-0.5 bg-black/5">
                <button 
                  onClick={() => setActivePreviewTab('all')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'all' ? 'bg-black/10 text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  All ({totalItemsCount})
                </button>
                <button 
                  onClick={() => setActivePreviewTab('errors')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'errors' ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
                >
                  Errors ({invalidRowsCount})
                </button>
                <button 
                  onClick={() => setActivePreviewTab('valid')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}`}
                >
                  Valid ({validRowsCount})
                </button>
              </div>

                  {validationRun && invalidRowsCount === 0 && (
                    <>
                      <button 
                        onClick={handleExportExcel} 
                        className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Excel</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (onSaveBOM) onSaveBOM(rows);
                        }} 
                        className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save to Database</span>
                      </button>
                      <button 
                        onClick={() => {
                          if (onProceedToPO) onProceedToPO(rows);
                        }} 
                        className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Proceed to PO</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

          {/* Core Table Grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto pr-2 min-h-0 border border-zinc-200 rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1200px]">
              <thead className="bg-[#F4F4F6] text-zinc-500 font-bold uppercase tracking-wider sticky top-0 z-20 border-b border-black/10">
                <tr>
                  <th className="px-4 py-3 text-center w-12">SR.NO</th>
                  <th className="px-4 py-3">TOOL NO</th>
                  <th className="px-4 py-3">DET NO</th>
                  <th className="px-4 py-3 text-center w-40">FINISH (L×W×H)</th>
                  <th className="px-4 py-3 text-center w-40">RM (L×W×H)</th>
                  <th className="px-4 py-3">MATERIAL</th>
                  <th className="px-4 py-3 text-center w-20">QTY</th>
                  <th className="px-4 py-3 text-right">AP WT.</th>
                  <th className="px-4 py-3 text-right">TOTAL WT.</th>
                  <th className="px-4 py-3 text-right">RATE</th>
                  <th className="px-4 py-3 text-right">BASIC COST</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">TOTAL</th>
                  <th className="px-4 py-3 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRows.map((row, idx) => (
                  <tr 
                    key={row.id} 
                    className={`transition-colors ${
                      row.validationError 
                        ? 'bg-red-500/5 hover:bg-red-500/10' 
                        : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    {/* SR.NO */}
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-zinc-500">
                      {idx + 1}
                    </td>

                    {/* TOOL NO */}
                    <td className="px-4 py-2.5 font-mono text-zinc-600">
                      <input 
                        type="text" 
                        value={row.toolNo || ''} 
                        onChange={(e) => handleCellEdit(row.id, 'toolNo', e.target.value)}
                        className="w-24 bg-transparent border-none text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                    </td>

                    {/* DET NO */}
                    <td className="px-2 py-2">
                      <input 
                        type="text" 
                        value={row.srNo} 
                        onChange={(e) => handleCellEdit(row.id, 'srNo', e.target.value)}
                        className="w-16 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                      />
                    </td>

                    {/* Finish size dimension fields (Editable: Length, Width, Height) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center space-x-1.5 justify-center">
                        <input 
                          type="text" 
                          placeholder="L"
                          value={row.finishL || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'finishL', e.target.value)}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                        <input 
                          type="text" 
                          placeholder="W"
                          value={row.finishW || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'finishW', e.target.value)}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                        <input 
                          type="text" 
                          placeholder="H"
                          value={row.finishH || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'finishH', e.target.value)}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                      </div>
                    </td>

                    {/* Raw size dimension fields (Editable: Length, Width, Height) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center space-x-1.5 justify-center">
                        <input 
                          type="text" 
                          placeholder="L"
                          value={row.length || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'length', e.target.value)}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                        <input 
                          type="number" 
                          placeholder="W"
                          value={row.width || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'width', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                        <input 
                          type="number" 
                          placeholder="H"
                          value={row.height || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'height', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-12 bg-zinc-50 border border-zinc-200 rounded px-1.5 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        />
                      </div>
                    </td>

                    {/* MATERIAL (Editable) */}
                    <td className="px-2 py-2">
                      <input 
                        type="text" 
                        value={row.materialInput} 
                        onChange={(e) => handleCellEdit(row.id, 'materialInput', e.target.value)}
                        placeholder="Material details..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                      />
                    </td>

                    {/* QTY (Editable) */}
                    <td className="px-2 py-2 text-center">
                      <input 
                        type="number" 
                        value={Number.isNaN(row.quantity) ? '' : row.quantity} 
                        onChange={(e) => handleCellEdit(row.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-16 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-center font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        min="1"
                      />
                    </td>

                    {/* AP WT. (Editable) */}
                    <td className="px-2 py-2 text-right">
                      <input 
                        type="number" 
                        value={Number.isNaN(row.apWeight) ? '' : (row.apWeight || '')} 
                        onChange={(e) => handleCellEdit(row.id, 'apWeight', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-16 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-right font-mono text-emerald-600 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner"
                        step="0.01"
                      />
                    </td>

                    {/* TOTAL WT. */}
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-400 font-bold">
                      {row.totalWeight ? row.totalWeight.toFixed(2) : '-'}
                    </td>

                    {/* RATE (Editable) */}
                    <td className="px-2 py-2 text-right">
                      <input 
                        type="number" 
                        value={Number.isNaN(row.rate) ? '' : (row.rate || '')} 
                        onChange={(e) => handleCellEdit(row.id, 'rate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-16 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-right font-mono text-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                        step="0.01"
                      />
                    </td>

                    {/* BASIC */}
                    <td className="px-4 py-2.5 text-right font-mono text-blue-400 font-bold">
                      {row.basicCost ? row.basicCost.toFixed(2) : '-'}
                    </td>

                    {/* GST % (Editable) */}
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <input 
                          type="number" 
                          value={Number.isNaN(row.gstPercent) ? '' : (row.gstPercent || '')} 
                          onChange={(e) => handleCellEdit(row.id, 'gstPercent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-14 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-right font-mono text-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner"
                          step="0.1"
                        />
                        <span className="text-slate-500 text-[10px]">%</span>
                      </div>
                    </td>

                    {/* TOTAL */}
                    <td className="px-4 py-2.5 text-right font-mono text-zinc-900 font-bold">
                      {row.basicCost ? (row.basicCost * 1.18).toFixed(2) : '-'}
                    </td>

                    {/* Row Deletion Action */}
                    <td className="px-4 py-2.5 text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
