import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, Plus, Save, Trash2, Calendar, User, Factory, Clock, Download, Upload } from 'lucide-react';
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useMasterData } from "@/hooks/useMasterData";
import { useProject } from "@/hooks/useProjects";
import { useJobCards, useLogMSDR } from "@/hooks/useProduction";
import { useToast } from "@/components/ui/Toast";

interface MsdrTableFormProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  productionSection?: string;
}

const SECTION_LABELS: Record<string, string> = {
  MACHINE_SHOP: 'Machine Shop',
  PRESS_SHOP: 'Press Shop',
  FABRICATION_INDIAN: 'Fabrication (Indian)',
  FABRICATION_EXPORT: 'Fabrication (Export)',
};

export function MsdrTableForm({ projectId, onClose, onSuccess, productionSection = 'MACHINE_SHOP' }: MsdrTableFormProps) {
  const { data: project } = useProject(projectId);
  const { data: machines } = useMasterData('machines');
  const { data: employees } = useMasterData('employees');
  const { data: materials } = useMasterData('materials');
  const { data: jobCards } = useJobCards(projectId);
  
  const logMSDRMutation = useLogMSDR(projectId);
  const { success, error } = useToast();

  const [header, setHeader] = useState({
    machineId: '',
    employeeId: '',
    reportDate: new Date().toISOString().split('T')[0]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = ['Tool No', 'Det No (Job Card ID)', 'Description', 'Raw Matl Size', 'Material Code', 'Finish Matl Size', 'Qty', 'Start Time', 'End Time'];
    const csvContent = headers.join(',') + '\n' + 'T-100,,Milling operation,10x10,MAT-1,9x9,1,09:00,10:30';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MSDR_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newItems = results.data.map((row: any, i: number) => {
            const materialCode = row['Material Code'] || '';
            const matchedMaterial = materials?.find((m: any) => m.materialCode === materialCode || m.materialName === materialCode);
            
            const detNoStr = row['Det No (Job Card ID)'] || '';
            const matchedJobCard = jobCards?.find((jc: any) => jc.id === detNoStr || jc.id.endsWith(detNoStr.toLowerCase()));

            return {
              id: Date.now() + i,
              toolNo: row['Tool No'] || project?.projectNumber || '',
              detNo: matchedJobCard ? matchedJobCard.id : detNoStr,
              description: row['Description'] || matchedJobCard?.routingOperation?.operation?.operationName || '',
              rawMatlSize: row['Raw Matl Size'] || '',
              materialId: matchedMaterial ? matchedMaterial.id : '',
              finishMatlSize: row['Finish Matl Size'] || '',
              qty: Number(row['Qty']) || 1,
              startTime: row['Start Time'] || '',
              endTime: row['End Time'] || ''
            };
          });
          
          if (newItems.length > 0) {
            setItems(newItems);
            success("Import Successful", `Imported ${newItems.length} rows.`);
          } else {
            error("Import Failed", "No valid data found in CSV.");
          }
        } catch (err: any) {
          error("Import Failed", "Could not parse CSV format correctly.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err: any) => {
        error("Import Failed", `CSV Parsing error: ${err.message}`);
      }
    });
  };

  const [items, setItems] = useState(
    Array(5).fill(null).map((_, i) => ({
      id: Date.now() + i,
      toolNo: project?.projectNumber || '',
      detNo: '',
      description: '',
      rawMatlSize: '',
      materialId: '',
      finishMatlSize: '',
      qty: 1,
      startTime: '',
      endTime: ''
    }))
  );

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill description based on Job Card / Det No selection
    if (field === 'detNo') {
      const jc = jobCards?.find((j: any) => j.id === value);
      if (jc) {
        newItems[index].description = jc.routingOperation?.operation?.operationName || '';
      }
    }

    setItems(newItems);
  };

  const addRow = () => {
    setItems([
      ...items, 
      {
        id: Date.now(),
        toolNo: project?.projectNumber || '',
        detNo: '',
        description: '',
        rawMatlSize: '',
        materialId: '',
        finishMatlSize: '',
        qty: 1,
        startTime: '',
        endTime: ''
      }
    ]);
  };

  const removeRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      if (!header.machineId || !header.employeeId) {
        error("Validation Error", "Machine and Operator are required");
        return;
      }

      // Filter out empty rows (where startTime and endTime are not provided)
      const validItems = items.filter(item => item.startTime && item.endTime);
      
      if (validItems.length === 0) {
        error("Validation Error", "Please fill at least one row with start and end times.");
        return;
      }

      await logMSDRMutation.mutateAsync({
        ...header,
        productionSection,
        startTime: validItems[0].startTime, // Dummy for legacy schema validation
        endTime: validItems[validItems.length - 1].endTime, // Dummy
        items: validItems.map(item => ({
          ...item,
          qty: Number(item.qty)
        }))
      });

      success("MSDR Saved", "Machine Shop Daily Report has been logged successfully.");
      onSuccess();
    } catch (err: any) {
      error("Error saving MSDR", err?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="bg-[#FBFBFC] border border-black/10 w-full max-w-[1400px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 border-b border-black/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-transparent opacity-50"></div>
          <div className="relative">
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight flex items-center gap-3">
              <Factory className="text-indigo-600 w-6 h-6" />
              {SECTION_LABELS[productionSection] || 'Production'} — Daily Report
            </h2>
            <p className="text-sm text-zinc-500 mt-1">Bulk entry sheet for {SECTION_LABELS[productionSection] || 'production'} operator shifts</p>
          </div>
          <button onClick={onClose} className="relative p-2 rounded-xl hover:bg-black/5 transition-colors text-zinc-500 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Details (Machine, Operator, Date) */}
        <div className="p-6 bg-black/5 border-b border-black/5 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Factory className="w-3 h-3" /> Machine Name
            </label>
            <Select value={header.machineId} onChange={e => setHeader({...header, machineId: e.target.value})} className="bg-white">
              <option value="" disabled className="bg-white text-slate-500">Select Machine...</option>
              {machines?.map((m: any) => <option key={m.id} value={m.id} className="bg-white text-zinc-900">{m.machineName}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Operator Name
            </label>
            <Select value={header.employeeId} onChange={e => setHeader({...header, employeeId: e.target.value})} className="bg-white">
              <option value="" disabled className="bg-white text-slate-500">Select Operator...</option>
              {employees?.map((emp: any) => <option key={emp.id} value={emp.id} className="bg-white text-zinc-900">{emp.name}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <Input type="date" value={header.reportDate} onChange={e => setHeader({...header, reportDate: e.target.value})} className="bg-white" />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-zinc-500 border-b border-black/10 text-xs uppercase tracking-wider font-semibold">
                <th className="pb-3 px-2">Sr.</th>
                <th className="pb-3 px-2">Tool No.</th>
                <th className="pb-3 px-2">Det. No (Job Card)</th>
                <th className="pb-3 px-2 min-w-[200px]">Description</th>
                <th className="pb-3 px-2">Raw Matl. Size</th>
                <th className="pb-3 px-2">Mate.</th>
                <th className="pb-3 px-2">Finish Matl. Size</th>
                <th className="pb-3 px-2 w-16">Qty.</th>
                <th className="pb-3 px-2">Start Time</th>
                <th className="pb-3 px-2">End Time</th>
                <th className="pb-3 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item, index) => (
                <tr key={item.id} className="group hover:bg-black/[0.02] transition-colors">
                  <td className="py-2 px-2 text-slate-500">{index + 1}</td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500" value={item.toolNo} onChange={e => handleItemChange(index, 'toolNo', e.target.value)} placeholder="Tool..." />
                  </td>
                  <td className="py-2 px-1">
                    <select className="w-36 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 " value={item.detNo} onChange={e => handleItemChange(index, 'detNo', e.target.value)}>
                      <option value="" className="bg-white text-slate-500">Select Det...</option>
                      {jobCards?.map((jc: any) => (
                        <option key={jc.id} value={jc.id} className="bg-white text-zinc-900">
                          {jc.id.slice(-6).toUpperCase()} - {jc.routingOperation?.operation?.operationName || 'Operation'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-full min-w-[150px] bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Operation..." />
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500" value={item.rawMatlSize} onChange={e => handleItemChange(index, 'rawMatlSize', e.target.value)} placeholder="Size..." />
                  </td>
                  <td className="py-2 px-1">
                    <select className="w-32 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 " value={item.materialId} onChange={e => handleItemChange(index, 'materialId', e.target.value)}>
                      <option value="" className="bg-white text-slate-500">Select Mat...</option>
                      {materials?.map((mat: any) => (
                        <option key={mat.id} value={mat.id} className="bg-white text-zinc-900">
                          {mat.materialCode} {mat.materialGrade ? `- ${mat.materialGrade}` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500" value={item.finishMatlSize} onChange={e => handleItemChange(index, 'finishMatlSize', e.target.value)} placeholder="Size..." />
                  </td>
                  <td className="py-2 px-1">
                    <input type="number" className="w-16 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} />
                  </td>
                  <td className="py-2 px-1">
                    <input type="time" className="w-28 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500 " value={item.startTime} onChange={e => handleItemChange(index, 'startTime', e.target.value)} />
                  </td>
                  <td className="py-2 px-1">
                    <input type="time" className="w-28 bg-white shadow-sm border border-zinc-200 border border-transparent hover:border-black/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-zinc-900 placeholder:text-slate-500 " value={item.endTime} onChange={e => handleItemChange(index, 'endTime', e.target.value)} />
                  </td>
                  <td className="py-2 px-1 text-right">
                    <button onClick={() => removeRow(index)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 flex gap-3">
            <button onClick={addRow} className="flex items-center text-sm text-indigo-600 hover:text-indigo-300 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20">
              <Plus className="w-4 h-4 mr-2" /> Add Row
            </button>
            <button onClick={handleDownloadTemplate} className="flex items-center text-sm text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-200 shadow-sm">
              <Download className="w-4 h-4 mr-2" /> Download Template
            </button>
            <input 
              type="file" 
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center text-sm text-blue-700 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors border border-blue-200 shadow-sm">
              <Upload className="w-4 h-4 mr-2" /> Import CSV
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-white/[0.01] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl hover:bg-black/5 transition-colors text-zinc-600 font-medium border border-transparent hover:border-black/10">
            Cancel
          </button>
          <button onClick={handleSave} disabled={logMSDRMutation.isPending} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold transition-all">
            {logMSDRMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save MSDR</>}
          </button>
        </div>

      </div>
    </div>
  );
}
