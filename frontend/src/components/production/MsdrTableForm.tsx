import React, { useState } from 'react';
import { X, Plus, Save, Trash2, Calendar, User, Factory, Clock } from 'lucide-react';
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
}

export function MsdrTableForm({ projectId, onClose, onSuccess }: MsdrTableFormProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
      <div className="bg-[#0f1117] border border-white/10 w-full max-w-[1400px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.1)]">
        
        {/* Top Header */}
        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50"></div>
          <div className="relative">
            <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
              <Factory className="text-indigo-400 w-6 h-6" />
              Machine Shop Daily Report
            </h2>
            <p className="text-sm text-slate-400 mt-1">Bulk entry sheet for operator shifts</p>
          </div>
          <button onClick={onClose} className="relative p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Details (Machine, Operator, Date) */}
        <div className="p-6 bg-black/20 border-b border-white/5 flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Factory className="w-3 h-3" /> Machine Name
            </label>
            <Select value={header.machineId} onChange={e => setHeader({...header, machineId: e.target.value})} className="bg-[#151821]">
              <option value="" disabled className="bg-[#0B1018] text-slate-500">Select Machine...</option>
              {machines?.map((m: any) => <option key={m.id} value={m.id} className="bg-[#0B1018] text-white">{m.machineName}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Operator Name
            </label>
            <Select value={header.employeeId} onChange={e => setHeader({...header, employeeId: e.target.value})} className="bg-[#151821]">
              <option value="" disabled className="bg-[#0B1018] text-slate-500">Select Operator...</option>
              {employees?.map((emp: any) => <option key={emp.id} value={emp.id} className="bg-[#0B1018] text-white">{emp.firstName} {emp.lastName}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Date
            </label>
            <Input type="date" value={header.reportDate} onChange={e => setHeader({...header, reportDate: e.target.value})} className="bg-[#151821]" />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 text-xs uppercase tracking-wider font-semibold">
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
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-2 text-slate-500">{index + 1}</td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500" value={item.toolNo} onChange={e => handleItemChange(index, 'toolNo', e.target.value)} placeholder="Tool..." />
                  </td>
                  <td className="py-2 px-1">
                    <select className="w-36 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white [color-scheme:dark]" value={item.detNo} onChange={e => handleItemChange(index, 'detNo', e.target.value)}>
                      <option value="" className="bg-[#151821]">Select Det...</option>
                      {jobCards?.map((jc: any) => (
                        <option key={jc.id} value={jc.id} className="bg-[#151821]">
                          {jc.id.slice(-6).toUpperCase()} - {jc.routingOperation?.operation?.operationName || 'Operation'}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-full min-w-[150px] bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Operation..." />
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500" value={item.rawMatlSize} onChange={e => handleItemChange(index, 'rawMatlSize', e.target.value)} placeholder="Size..." />
                  </td>
                  <td className="py-2 px-1">
                    <select className="w-32 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white [color-scheme:dark]" value={item.materialId} onChange={e => handleItemChange(index, 'materialId', e.target.value)}>
                      <option value="" className="bg-[#151821]">Select Mat...</option>
                      {materials?.map((mat: any) => (
                        <option key={mat.id} value={mat.id} className="bg-[#151821]">
                          {mat.materialCode} {mat.materialGrade ? `- ${mat.materialGrade}` : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-1">
                    <input type="text" className="w-24 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500" value={item.finishMatlSize} onChange={e => handleItemChange(index, 'finishMatlSize', e.target.value)} placeholder="Size..." />
                  </td>
                  <td className="py-2 px-1">
                    <input type="number" className="w-16 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} />
                  </td>
                  <td className="py-2 px-1">
                    <input type="time" className="w-28 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500 [color-scheme:dark]" value={item.startTime} onChange={e => handleItemChange(index, 'startTime', e.target.value)} />
                  </td>
                  <td className="py-2 px-1">
                    <input type="time" className="w-28 bg-black/20 border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1.5 outline-none transition-all text-white placeholder:text-slate-500 [color-scheme:dark]" value={item.endTime} onChange={e => handleItemChange(index, 'endTime', e.target.value)} />
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
          
          <div className="mt-4">
            <button onClick={addRow} className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20">
              <Plus className="w-4 h-4 mr-2" /> Add Row
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-slate-300 font-medium border border-transparent hover:border-white/10">
            Cancel
          </button>
          <button onClick={handleSave} disabled={logMSDRMutation.isPending} className="flex items-center px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] font-medium transition-all">
            {logMSDRMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save MSDR</>}
          </button>
        </div>

      </div>
    </div>
  );
}
