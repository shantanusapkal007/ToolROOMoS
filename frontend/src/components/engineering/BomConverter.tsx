import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Trash2, 
  Eye,
  Sliders
} from 'lucide-react';
import { useToast } from '../ui/Toast';

interface BomConverterProps {
  projectId: string;
  project: any;
  materials: any[];
  onSaveBOM?: (rows: any[]) => void;
}

interface ParsedBOMRow {
  id: string;
  srNo: string;
  partName: string;
  quantity: number;
  finishSize: string;
  rawMaterialSize: string;
  materialInput: string;
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
  validationError: string | null;
}

export const BomConverter: React.FC<BomConverterProps> = ({ projectId, project, materials = [], onSaveBOM }) => {
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

  // --- Size Parser ---
  const parseDimensions = (sizeStr: string) => {
    if (!sizeStr) return { length: '', width: '', height: '', isValid: false };
    const cleaned = sizeStr.toString().trim();
    
    // Check for round bar (e.g. Ø20x110 or Dia20x110)
    const isRound = /^[Ø0O\s]*dia/i.test(cleaned) || /^Ø/i.test(cleaned);
    
    // Match numbers split by x, X, ×, *
    const parts = cleaned.split(/[\s]*[xX×\*][\s]*/);
    
    if (isRound && parts.length >= 2) {
      const dMatch = parts[0].match(/([\d\.]+)/);
      const lMatch = parts[1].match(/([\d\.]+)/);
      
      const d = dMatch ? parseFloat(dMatch[1]) : NaN;
      const l = lMatch ? parseFloat(lMatch[1]) : NaN;
      
      const isValid = !isNaN(d) && !isNaN(l) && d > 0 && l > 0;
      // Format: L=Ø, W=Dia, H=Length
      return { length: 'Ø', width: d, height: l, isValid };
    }

    if (parts.length < 3) {
      return { length: '', width: '', height: '', isValid: false };
    }
    
    // Pull numbers (including float decimals) from each part
    const lMatch = parts[0].match(/([\d\.]+)/);
    const wMatch = parts[1].match(/([\d\.]+)/);
    const hMatch = parts[2].match(/([\d\.]+)/);

    const l = lMatch ? parseFloat(lMatch[1]) : NaN;
    const w = wMatch ? parseFloat(wMatch[1]) : NaN;
    const h = hMatch ? parseFloat(hMatch[1]) : NaN;

    const isValid = !isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0;
    return { length: l, width: w, height: h, isValid };
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
    
    if (item.length && item.width && item.height) {
        if (item.length === 'Ø') {
           const d = Number(item.width);
           const l = Number(item.height);
           const vol = Math.PI * Math.pow(d / 2, 2) * l;
           item.apWeight = (vol * item.density) / 1000000;
        } else {
           const l = Number(item.length);
           const w = Number(item.width);
           const h = Number(item.height);
           const vol = l * w * h;
           item.apWeight = (vol * item.density) / 1000000;
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
    if (!row.rawMaterialSize || !row.rawMaterialSize.toString().trim()) {
      return `Row ${index + 1}: Raw Material Size is missing.`;
    }
    const size = parseDimensions(row.rawMaterialSize);
    if (!size.isValid) {
      return `Row ${index + 1}: Raw Material Size is invalid. Expected format like 280x235x50.`;
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
            
            if (cleanHeader === "sr no" || cleanHeader === "sr. no." || cleanHeader === "detail no" || cleanHeader === "detail.no") {
              tempMapping["srNo"] = c;
              matches++;
            } else if (cleanHeader.includes("part name") || cleanHeader.includes("description")) {
              tempMapping["partName"] = c;
              matches++;
            } else if (cleanHeader === "quantity" || cleanHeader === "qty") {
              tempMapping["quantity"] = c;
              matches++;
            } else if (cleanHeader.includes("finish size")) {
              tempMapping["finishSize"] = c;
              matches++;
            } else if (cleanHeader.includes("raw material size") || cleanHeader.includes("rm size")) {
              tempMapping["rawMaterialSize"] = c;
              matches++;
            } else if (cleanHeader === "material" || cleanHeader === "grade") {
              tempMapping["material"] = c;
              matches++;
            }
          });

          if (matches >= 3) {
            headerRowIndex = r;
            colMapping = tempMapping;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error("Could not find table headers. Make sure 'Sr No', 'Quantity', 'Raw Material Size', and 'Material' are present.");
        }

        if (colMapping["srNo"] === undefined || 
            colMapping["quantity"] === undefined || 
            colMapping["rawMaterialSize"] === undefined || 
            colMapping["material"] === undefined) {
          throw new Error("Missing required columns: 'Sr No', 'Quantity', 'Raw Material Size', or 'Material'.");
        }

        // 3. Map Data Rows
        const parsedItems: ParsedBOMRow[] = [];
        
        for (let r = headerRowIndex + 1; r < allRows.length; r++) {
          const row = allRows[r];
          const isBlank = row.every(cell => cell === undefined || cell === null || cell === '');
          if (isBlank) continue;

          // Skip footer summaries
          const firstCellStr = row[colMapping["srNo"]]?.toString().toLowerCase() || "";
          if (firstCellStr.includes("prepared") || firstCellStr.includes("approved") || firstCellStr.includes("total")) {
            continue;
          }

          const srVal = row[colMapping["srNo"]]?.toString().trim() || "";
          const nameVal = colMapping["partName"] !== undefined ? row[colMapping["partName"]]?.toString().trim() || "" : "";
          const qtyVal = parseInt(row[colMapping["quantity"]]?.toString().trim() || "0", 10);
          const finishVal = colMapping["finishSize"] !== undefined ? row[colMapping["finishSize"]]?.toString().trim() || "" : "";
          const rmVal = row[colMapping["rawMaterialSize"]]?.toString().trim() || "";
          const matVal = row[colMapping["material"]]?.toString().trim() || "";

          if (!srVal && !nameVal && !rmVal) continue; // Skip padding blank rows

          // Resolve dimensions
          const dimensions = parseDimensions(rmVal);

          const item: ParsedBOMRow = {
            id: `row-${r}-${Date.now()}`,
            srNo: srVal || (parsedItems.length + 1).toString(),
            partName: nameVal,
            quantity: qtyVal,
            finishSize: finishVal,
            rawMaterialSize: rmVal,
            materialInput: matVal,
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

    // Populate Rows
    let grandQty = 0;
    let grandTotalWt = 0;
    let grandTotalCost = 0;

    rows.forEach((row, idx) => {
      grandQty += row.quantity;
      grandTotalWt += row.totalWeight || 0;
      grandTotalCost += (row.basicCost || 0) * 1.18; // Includes GST

      documentData.push([
        idx + 1, // SR.NO
        parsedMetadata?.projectNumber || project.projectNumber, // TOOL NO
        row.srNo, // DET NO
        row.length, // L
        row.width, // W
        row.height, // H
        row.materialInput, // MATERIAL
        row.quantity, // QTY
        row.apWeight ? row.apWeight.toFixed(2) : "", // AP WT.
        row.totalWeight ? row.totalWeight.toFixed(2) : "", // TOTAL WT.
        row.rate ? row.rate.toFixed(2) : "", // RATE
        row.basicCost ? row.basicCost.toFixed(2) : "", // BASIC COST
        row.basicCost ? (row.basicCost * 0.18).toFixed(2) : "", // GST
        row.basicCost ? (row.basicCost * 1.18).toFixed(2) : ""  // TOTAL
      ]);
    });

    // Grand Totals Row
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
    
    // Merge cell ranges (A1-N1 for Company Header, A2-N2 for Title, A{total}-G{total} for GRAND TOTAL)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // Company Header
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Title
      // Merges for GRAND TOTAL cell label
      { s: { r: 6 + rows.length + 1, c: 0 }, e: { r: 6 + rows.length + 1, c: 6 } }
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
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 text-blue-400 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-white mb-1">Drag & Drop Engineering BOM Excel</h3>
            <p className="text-[11px] text-slate-400 mb-4">Compatible with standard structured .xlsx and .xls formats</p>
            
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
            <h3 className="text-xs font-bold text-white mb-4 tracking-widest uppercase flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-blue-400" />
              Converter Registry
            </h3>
            
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">Size: {(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
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
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all"
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
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Processed Rows</p>
              <p className="text-xl font-bold text-white font-mono mt-1">{totalItemsCount}</p>
            </div>
            <FileSpreadsheet className="w-8 h-8 text-blue-500 opacity-40" />
          </div>

          <div className={`glass-panel p-4 flex items-center justify-between border-l-4 ${invalidRowsCount > 0 ? 'border-red-500' : 'border-emerald-500'}`}>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Validation Status</p>
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
        <div className="glass-panel p-6 flex-1 min-h-0 flex flex-col relative overflow-hidden">
          
          {/* Section Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center tracking-widest uppercase">
                <Eye className="w-4 h-4 mr-2 text-indigo-400" />
                Purchase order mapping preview
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Configure, resolve errors, and double-check before generation</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-2">
              <div className="flex border border-white/10 rounded-lg p-0.5 bg-black/40">
                <button 
                  onClick={() => setActivePreviewTab('all')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({totalItemsCount})
                </button>
                <button 
                  onClick={() => setActivePreviewTab('errors')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'errors' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                >
                  Errors ({invalidRowsCount})
                </button>
                <button 
                  onClick={() => setActivePreviewTab('valid')} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activePreviewTab === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
                >
                  Valid ({validRowsCount})
                </button>
              </div>

              {isConverted && invalidRowsCount === 0 && (
                <>
                  <button 
                    onClick={handleExportExcel} 
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all ml-4"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PO Sheet</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (onSaveBOM) onSaveBOM(rows);
                    }} 
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all ml-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save to Database</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Core Table Grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto pr-2 min-h-0 border border-white/5 rounded-xl bg-black/30">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[1200px]">
              <thead className="bg-[#0B1018] text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-20 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-center w-12">SR.NO</th>
                  <th className="px-4 py-3">TOOL NO</th>
                  <th className="px-4 py-3">DET NO</th>
                  <th className="px-4 py-3 text-center w-48">L × W × H</th>
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
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* SR.NO */}
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* TOOL NO */}
                    <td className="px-4 py-2.5 font-mono text-slate-300">
                      {parsedMetadata?.projectNumber || project.projectNumber}
                    </td>

                    {/* DET NO */}
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-200">
                      {row.srNo}
                    </td>

                    {/* Raw size dimension fields (Editable: Length, Width, Height) */}
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center space-x-1.5 justify-center">
                        <input 
                          type="text" 
                          placeholder="L"
                          value={row.length || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'length', e.target.value)}
                          className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500/50"
                        />
                        <span className="text-slate-500">×</span>
                        <input 
                          type="number" 
                          placeholder="W"
                          value={row.width || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'width', parseFloat(e.target.value) || 0)}
                          className="w-14 bg-black/60 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500/50"
                        />
                        <span className="text-slate-500">×</span>
                        <input 
                          type="number" 
                          placeholder="H"
                          value={row.height || ''} 
                          onChange={(e) => handleCellEdit(row.id, 'height', parseFloat(e.target.value) || 0)}
                          className="w-12 bg-black/60 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500/50"
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
                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </td>

                    {/* QTY (Editable) */}
                    <td className="px-2 py-2 text-center">
                      <input 
                        type="number" 
                        value={row.quantity} 
                        onChange={(e) => handleCellEdit(row.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 bg-black/60 border border-white/10 rounded px-2 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500/50"
                        min="1"
                      />
                    </td>

                    {/* AP WT. */}
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                      {row.apWeight ? row.apWeight.toFixed(2) : '-'}
                    </td>

                    {/* TOTAL WT. */}
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-400 font-bold">
                      {row.totalWeight ? row.totalWeight.toFixed(2) : '-'}
                    </td>

                    {/* RATE */}
                    <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                      {row.rate ? row.rate.toFixed(2) : '-'}
                    </td>

                    {/* BASIC */}
                    <td className="px-4 py-2.5 text-right font-mono text-blue-400 font-bold">
                      {row.basicCost ? row.basicCost.toFixed(2) : '-'}
                    </td>

                    {/* GST (Estimated 18%) */}
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                      {row.basicCost ? (row.basicCost * 0.18).toFixed(2) : '-'}
                    </td>

                    {/* TOTAL */}
                    <td className="px-4 py-2.5 text-right font-mono text-white font-bold">
                      {row.basicCost ? (row.basicCost * 1.18).toFixed(2) : '-'}
                    </td>

                    {/* Row Deletion Action */}
                    <td className="px-4 py-2.5 text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
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
      )}

    </div>
  );
};
