"use client";

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { api } from "../../../../lib/api";
import { FileText, Layers, GitMerge, CheckCircle, Lock, Cpu, Settings } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";
import { Modal } from "../../../../components/ui/Modal";

import { BomConverter } from "../../../../components/engineering/BomConverter";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { formatCurrency } from "../../../../lib/formatters";
import { 
  useProjectBOM, useUpdateBOM, useApproveBOM 
} from "../../../../hooks/useEngineering";
import { PremiumDrawer } from "../../../../components/ui/PremiumDrawer";

export default function EngineeringTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error, warning } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const costSummary = project?.projectCostSummary;
  
  // Master Data
  const { data: materials } = useMasterData('materials');
  const { data: machines } = useMasterData('machines');
  const { data: operationsList } = useMasterData('operations');
  
  // Engineering Data
  const { data: activeBom, refetch: refetchBOM } = useProjectBOM(resolvedParams.id);
  const updateBOMMutation = useUpdateBOM(resolvedParams.id);
  const approveBOMMutation = useApproveBOM(resolvedParams.id);
  // Modals & States
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomItems, setBomItems] = useState([{ materialId: "", requiredQty: 1, finishL: "", finishW: "", finishH: "", rmL: "", rmW: "", rmH: "", hsnCode: "", partName: "", description: "" }]);
  const [bomHeader, setBomHeader] = useState({ releaseDate: "", designerBy: "", approvedBy: "" });

  const parseDimString = (str: string) => {
    if (!str) return { l: '', w: '', h: '' };
    const parts = str.split(/[*xX×]/);
    if (parts.length >= 3) return { l: parts[0], w: parts[1], h: parts[2] };
    return { l: str, w: '', h: '' };
  };

  useEffect(() => {
    if (activeBom) {
      if (activeBom.items && activeBom.items.length > 0) {
        setBomItems(activeBom.items.map((i: any) => {
          const fin = parseDimString(i.dimensions || "");
          const rm = parseDimString(i.rawSize || "");
          return {
            materialId: i.materialId,
            requiredQty: i.requiredQty,
            finishL: fin.l, finishW: fin.w, finishH: fin.h,
            rmL: rm.l, rmW: rm.w, rmH: rm.h,
            hsnCode: i.hsnCode || "",
            partName: i.customFields?.partName || "",
            description: i.customFields?.description || ""
          };
        }));
      } else {
        setBomItems([{ materialId: "", requiredQty: 1, finishL: "", finishW: "", finishH: "", rmL: "", rmW: "", rmH: "", hsnCode: "", partName: "", description: "" }]);
      }

      if (activeBom.remarks) {
        try {
          const parsed = JSON.parse(activeBom.remarks);
          setBomHeader({
            releaseDate: parsed.releaseDate || "",
            designerBy: parsed.designerBy || "",
            approvedBy: parsed.approvedBy || ""
          });
        } catch {
          // Fallback if remarks was just text
          setBomHeader({ releaseDate: "", designerBy: "", approvedBy: "" });
        }
      }
    }
  }, [activeBom, showBomModal]);

  const [activeTab, setActiveTab] = useState<'sequence' | 'converter'>('sequence');

  if (projectLoading || !project) return null;



  const handleExportBOM = () => {
    const documentData: any[][] = [];

    documentData.push(["                            KRUPA TOOLS & STAMPING LTD\r\n                            B O M Table"]);
    documentData.push(["CUSTOMER", null, project?.customer?.companyName || "", null, "PROJECT NUMBER", project?.projectNumber || "", "VERSION"]);
    
    const headers = ["NO.", "PART NAME", "QTY", "CATALOG/SIZE", "FINISH SIZES", "STOCK SIZES", "MATERIAL"];
    documentData.push(headers);

    bomItems.forEach((item, idx) => {
      const mat = materials?.find((m: any) => m.id === item.materialId);
      const matName = mat ? `${mat.materialCode}` : "";
      
      const finishSizes = item.finishL && item.finishW && item.finishH ? `${item.finishL}X${item.finishW}X${item.finishH}` : (item.finishL || "");
      const stockSizes = item.rmL && item.rmW && item.rmH ? `${item.rmL}X${item.rmW}X${item.rmH}` : (item.rmL || "");

      documentData.push([
        idx + 1,
        item.partName,
        item.requiredQty,
        item.description, // using description as catalog/size 
        finishSizes,
        stockSizes,
        matName
      ]);
    });

    documentData.push(["RELEASE DATE", null, `DATE :-${bomHeader.releaseDate || new Date().toLocaleDateString()}`, null, "DESIGNER BY", bomHeader.designerBy || "", "APPROVED BY", bomHeader.approvedBy || ""]);

    const worksheet = XLSX.utils.aoa_to_sheet(documentData);

    // Apply exact template merges
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Header Title
      
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // CUSTOMER label
      { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } }, // Customer Name value
      
      { s: { r: documentData.length - 1, c: 0 }, e: { r: documentData.length - 1, c: 1 } }, // RELEASE DATE label
      { s: { r: documentData.length - 1, c: 2 }, e: { r: documentData.length - 1, c: 3 } }, // DATE value
    ];

    const wscols = [
      { wch: 5 },  { wch: 30 }, { wch: 6 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PDW_BOM_TEMPLATE");
    XLSX.writeFile(workbook, `BOM_${project?.projectNumber || 'Form'}.xlsx`);
  };

  const handleSubmitBom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headerInfo = JSON.stringify(bomHeader);
      const payloadItems = bomItems.map((i: any) => ({
        materialId: i.materialId,
        requiredQty: Number(i.requiredQty),
        dimensions: i.finishL && i.finishW && i.finishH ? `${i.finishL}*${i.finishW}*${i.finishH}` : (i.finishL || ''),
        rawSize: i.rmL && i.rmW && i.rmH ? `${i.rmL}*${i.rmW}*${i.rmH}` : (i.rmL || ''),
        hsnCode: i.hsnCode,
        customFields: {
          partName: i.partName,
          description: i.description,
          length: i.rmL,
          width: i.rmW,
          height: i.rmH,
          finishL: i.finishL,
          finishW: i.finishW,
          finishH: i.finishH
        }
      }));

      await updateBOMMutation.mutateAsync({ remarks: headerInfo, items: payloadItems });
      setShowBomModal(false);
      refetchBOM();
      success("BOM Saved", "Bill of Materials successfully updated.");
    } catch (err: any) {
      error("BOM Save Failed", err.message);
    }
  };

  const handleSaveConvertedBom = async (rows: any[]) => {
    try {
      // Map ParsedBOMRow to CreateBomItemDto format
      const newItems = rows
        .filter(r => r.matchedMaterialId)
        .map(r => ({
          materialId: r.matchedMaterialId,
          requiredQty: Number(r.quantity),
          calculatedWeight: Number(r.totalWeight),
          estimatedCost: Number(r.basicCost),
          rawSize: r.rawMaterialSize,
          catalogSize: r.catalogSize,
          stockSize: r.stockSize
        }));
      
      if (newItems.length === 0) {
        warning("No Valid Items", "No matched materials found to save.");
        return;
      }

      // Merge with existing items so we append instead of overwrite
      const existingItems = activeBom?.items?.map((i: any) => ({
        materialId: i.materialId,
        requiredQty: i.requiredQty,
        calculatedWeight: i.calculatedWeight,
        estimatedCost: i.estimatedCost,
        rawSize: i.rawSize,
        catalogSize: i.catalogSize,
        stockSize: i.stockSize,
        dimensions: i.dimensions,
        hsnCode: i.hsnCode
      })) || [];

      const combinedItems = [...existingItems, ...newItems];

      await updateBOMMutation.mutateAsync({ items: combinedItems });
      success("BOM Saved", `Successfully imported ${newItems.length} items (Total: ${combinedItems.length}).`);
      setActiveTab('sequence');
      refetchBOM();
    } catch (err: any) {
      error("BOM Import Failed", err.message);
    }
  };

  const handleApproveBom = async () => {
    try {
      await approveBOMMutation.mutateAsync(activeBom.id);
    } catch (err: any) {}
  };

  const handleReopenEngineering = async () => {
    try {
      await api.patch(`projects/${project.id}/reopen-engineering`);
      warning("Engineering Reopened", "Previous plan obsoleted. Downstream POs are on hold.");
      refetchProject();
      refetchBOM();
    } catch (err: any) {
      error("Action Failed", err.response?.data?.message || err.message);
    }
  };

  const isBomComplete = activeBom?.approvalStatus === 'APPROVED';
  const isFullyApproved = isBomComplete;

  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      
      {/* Dense Toolbar Header */}
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 mr-3 text-blue-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Manufacturing Planning Engine</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Immutable Manufacturing Plan & Baseline</p>
          </div>
        </div>
        
        {isFullyApproved && (
          <button onClick={handleReopenEngineering} className="group relative px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-300">
            <span className="relative z-10 flex items-center text-red-400 font-bold text-xs">Revise Engineering Plan</span>
          </button>
        )}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex space-x-2 mb-4 border-b border-white/5 pb-2 shrink-0">
        <button 
          onClick={() => setActiveTab('sequence')} 
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'sequence' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.02]'
          }`}
        >
          Planning Sequence
        </button>
        <button 
          onClick={() => setActiveTab('converter')} 
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'converter' 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.02]'
          }`}
        >
          BOM Converter
        </button>
      </div>

      {activeTab === 'sequence' ? (
        <div className="max-w-2xl">
          {/* Step 1: BOM */}
          <div className={`p-4 rounded-xl border ${isBomComplete ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-blue-500/30 bg-blue-950/10'} relative flex flex-col justify-between`}>
            <h3 className="text-xs font-bold text-white mb-2 flex items-center tracking-widest uppercase">
              <span className="w-5 h-5 rounded bg-black/40 flex items-center justify-center text-[10px] mr-2 text-slate-300">1</span>
              Material Plan
            </h3>
            {isBomComplete && (
              <div className="text-[11px] font-bold text-emerald-400 flex items-center mt-2">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                BOM Approved
              </div>
            )}
            <div className="mt-2 space-y-2">
              <button onClick={() => setShowBomModal(true)} className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold transition-all">
                {activeBom ? 'Edit BOM' : 'Create BOM'}
              </button>
              {activeBom && !isBomComplete && (
                <button onClick={handleApproveBom} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(5,150,105,0.3)]">Approve BOM</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <BomConverter 
          projectId={resolvedParams.id} 
          project={project} 
          materials={materials || []} 
          onSaveBOM={handleSaveConvertedBom}
        />
      )}



      <PremiumDrawer
        isOpen={showBomModal}
        onClose={() => setShowBomModal(false)}
        title="Material Plan (BOM)"
        subtitle="Define required materials for this project"
        width="full"
      >
        <form onSubmit={handleSubmitBom} className="flex-1 min-h-0 flex flex-col p-6 bg-[#030712] print:bg-white text-white print:text-black">
          
          {/* Header Information (Document Style) */}
          <div className="grid grid-cols-4 gap-6 mb-6 pb-6 border-b border-white/10 print:border-black/20">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Customer</p>
              <p className="text-sm font-semibold">{project?.customer?.companyName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Project Number</p>
              <p className="text-sm font-semibold font-mono">{project?.projectNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Tool</p>
              <p className="text-sm font-semibold">{project?.partName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Date</p>
              <p className="text-sm font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
            {/* Table Headers */}
            <div className="grid grid-cols-[3rem_1.5fr_0.5fr_1fr_1fr_1.5fr_1.5fr] gap-3 px-4 py-2 bg-[#0B1018] rounded-xl border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 print:bg-slate-100 print:text-black print:border-black/20">
              <div className="text-center">No.</div>
              <div>Part Name</div>
              <div className="text-center">Qty</div>
              <div className="text-center">Finish Size (L×W×H)</div>
              <div className="text-center">RM Size (L×W×H)</div>
              <div>Material</div>
              <div>Description</div>
            </div>

            {bomItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[3rem_1.5fr_0.5fr_1fr_1fr_1.5fr_1.5fr] gap-3 items-center bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.05] hover:bg-white/[0.04] transition-colors shadow-[0_4px_10px_rgba(0,0,0,0.2)] print:bg-white print:border-black/20 print:shadow-none">
                
                {/* No. */}
                <div className="text-center font-mono text-slate-500 text-xs font-bold">{idx + 1}</div>
                
                {/* Part Name */}
                <input type="text" className="w-full bg-black/40 border border-white/[0.05] rounded-lg p-2 text-white text-xs focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="Part Name" value={item.partName} onChange={(e) => { const a = [...bomItems]; a[idx].partName = e.target.value; setBomItems(a); }} />
                
                {/* Qty */}
                <input type="number" className="w-full bg-black/40 border border-white/[0.05] rounded-lg p-2 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" required min="1" placeholder="Qty" value={item.requiredQty} onChange={(e) => { const a = [...bomItems]; a[idx].requiredQty = Number(e.target.value); setBomItems(a); }} />
                
                {/* Finish Size */}
                <div className="flex items-center space-x-1.5 bg-black/20 border border-white/[0.05] rounded-lg p-1">
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="L" value={item.finishL} onChange={(e) => { const a = [...bomItems]; a[idx].finishL = e.target.value; setBomItems(a); }} />
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="W" value={item.finishW} onChange={(e) => { const a = [...bomItems]; a[idx].finishW = e.target.value; setBomItems(a); }} />
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="H" value={item.finishH} onChange={(e) => { const a = [...bomItems]; a[idx].finishH = e.target.value; setBomItems(a); }} />
                </div>
                
                {/* RM Size */}
                <div className="flex items-center space-x-1.5 bg-black/20 border border-white/[0.05] rounded-lg p-1">
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="L" value={item.rmL} onChange={(e) => { const a = [...bomItems]; a[idx].rmL = e.target.value; setBomItems(a); }} />
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="W" value={item.rmW} onChange={(e) => { const a = [...bomItems]; a[idx].rmW = e.target.value; setBomItems(a); }} />
                  <input type="text" className="w-full min-w-[2rem] bg-black/60 rounded px-1 py-1 text-center text-white text-xs font-mono focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="H" value={item.rmH} onChange={(e) => { const a = [...bomItems]; a[idx].rmH = e.target.value; setBomItems(a); }} />
                </div>
                
                {/* Material */}
                <select className="w-full bg-black/40 border border-white/[0.05] rounded-lg p-2 text-white text-xs focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all appearance-none [color-scheme:dark] print:bg-transparent print:text-black print:border-none print:p-0 print:appearance-none" required value={item.materialId} onChange={(e) => { const a = [...bomItems]; a[idx].materialId = e.target.value; setBomItems(a); }}>
                  <option value="" className="bg-[#050A14] text-slate-500">Select Material...</option>
                  {materials?.map((m: any) => <option key={m.id} value={m.id} className="bg-[#050A14]">{m.materialCode} - {m.materialGrade}</option>)}
                </select>

                {/* Description */}
                <input type="text" className="w-full bg-black/40 border border-white/[0.05] rounded-lg p-2 text-white text-xs focus:border-indigo-500/50 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:p-0" placeholder="Remarks/Desc" value={item.description} onChange={(e) => { const a = [...bomItems]; a[idx].description = e.target.value; setBomItems(a); }} />
              </div>
            ))}
            
            <button type="button" onClick={() => setBomItems([...bomItems, { materialId: "", requiredQty: 1, finishL: "", finishW: "", finishH: "", rmL: "", rmW: "", rmH: "", hsnCode: "", partName: "", description: "" }])} className="w-full py-3 mt-4 border border-white/10 border-dashed bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-indigo-400 hover:text-indigo-300 font-bold rounded-xl transition-all hide-on-print">+ Add Material Row</button>
          </div>

          {/* Footer Information */}
          <div className="grid grid-cols-3 gap-6 pt-6 mt-6 border-t border-white/10 print:border-black/20">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Designer By</p>
              <input type="text" className="w-full bg-black/40 border border-white/[0.05] border-b-white/20 rounded-t-lg p-2 text-white text-sm focus:border-b-indigo-500 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:border-b print:border-b-black print:rounded-none print:p-0 print:pb-1" placeholder="Designer Signature" value={bomHeader.designerBy} onChange={(e) => setBomHeader({...bomHeader, designerBy: e.target.value})} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Approved By</p>
              <input type="text" className="w-full bg-black/40 border border-white/[0.05] border-b-white/20 rounded-t-lg p-2 text-white text-sm focus:border-b-indigo-500 focus:bg-white/[0.05] focus:outline-none transition-all print:bg-transparent print:text-black print:border-none print:border-b print:border-b-black print:rounded-none print:p-0 print:pb-1" placeholder="Approver Signature" value={bomHeader.approvedBy} onChange={(e) => setBomHeader({...bomHeader, approvedBy: e.target.value})} />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Release Date</p>
              <input type="date" className="w-full bg-black/40 border border-white/[0.05] border-b-white/20 rounded-t-lg p-2 text-white text-sm focus:border-b-indigo-500 focus:bg-white/[0.05] focus:outline-none transition-all [color-scheme:dark] print:bg-transparent print:text-black print:border-none print:border-b print:border-b-black print:rounded-none print:p-0 print:pb-1 print:appearance-none" value={bomHeader.releaseDate} onChange={(e) => setBomHeader({...bomHeader, releaseDate: e.target.value})} />
            </div>
          </div>

          <div className="flex space-x-3 pt-6 mt-8 border-t border-white/5 shrink-0 hide-on-print">
            <button type="button" onClick={() => setShowBomModal(false)} className="flex-1 py-3 bg-white/[0.05] hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white font-bold text-sm transition-all">Cancel</button>
            <button type="button" onClick={handleExportBOM} className="px-6 py-3 bg-white/[0.05] hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-white font-bold text-sm transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">Export Form (Excel)</button>
            <button type="submit" className="flex-1 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.2),_inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-xl text-indigo-300 hover:text-white font-bold text-sm transition-all">Save Material Plan</button>
          </div>
        </form>
      </PremiumDrawer>


    </div>
  );
}
