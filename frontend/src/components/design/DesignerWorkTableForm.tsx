import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  X,
  Plus,
  Save,
  Trash2,
  Calendar,
  User,
  Clock,
  Download,
  Upload,
  Layers,
  Sparkles,
  FileText,
  CheckCircle2,
  Timer,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useMasterData } from "@/hooks/useMasterData";
import { useProject } from "@/hooks/useProjects";
import { useCreateDesignLog, useUpdateDesignLog } from "@/hooks/useDesignLogs";
import { useToast } from "@/components/ui/Toast";

interface DesignerWorkTableFormProps {
  projectId: string;
  onClose?: () => void;
  onSuccess?: () => void;
  initialLog?: any | null;
}

const PRESET_WORK_STAGES = [
  '3D CAD Modeling',
  '2D Detailing & Drafting',
  'DFM Review',
  'Tool Layout Design',
  'BOM Generation',
  'Tolerance Stackup Analysis',
  'Die Assembly Design',
  'Revision Change / ECN',
  'FEA / Stress Simulation',
];

const CUSTOM_STAGE_OPTION = '+ Add Custom / Other Stage...';

const WORK_STAGES = [
  ...PRESET_WORK_STAGES,
  CUSTOM_STAGE_OPTION,
];

// Helper to estimate hours between start and end time string (e.g. "09:00 AM", "01:00 PM" or "09:00", "13:00")
function calculateHours(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  try {
    const parseTimeToMinutes = (t: string) => {
      const isPm = t.toUpperCase().includes('PM');
      const isAm = t.toUpperCase().includes('AM');
      let cleaned = t.replace(/AM|PM/i, '').trim();
      const parts = cleaned.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
      if (isNaN(hours)) return null;
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startMin = parseTimeToMinutes(startStr);
    const endMin = parseTimeToMinutes(endStr);

    if (startMin !== null && endMin !== null && endMin > startMin) {
      const diffHrs = (endMin - startMin) / 60;
      return Math.round(diffHrs * 2) / 2; // Round to nearest 0.5 hr
    }
  } catch (err) {
    // fallback
  }
  return 0;
}

export function DesignerWorkTableForm({ projectId, onClose, onSuccess, initialLog }: DesignerWorkTableFormProps) {
  const { data: project } = useProject(projectId);
  const { data: employees } = useMasterData('employees');

  const createLogMutation = useCreateDesignLog(projectId);
  const updateLogMutation = useUpdateDesignLog(projectId);
  const { success, error } = useToast();

  const [header, setHeader] = useState({
    designerName: initialLog?.designerName || '',
    workDate: initialLog?.workDate
      ? new Date(initialLog.workDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template download for Designer Daily Work Report
  const handleDownloadTemplate = () => {
    const headers = [
      'Part Name',
      'Drawing No',
      'Revision',
      'Work Stage',
      'Work Description',
      'Start Time',
      'End Time',
      'Hours Spent',
      'Status',
      'CAD File Link',
      'Remarks'
    ];
    const sampleRow = [
      project?.partName || 'Die Cavity Insert',
      'DWG-2026-001',
      'Rev 0.1',
      '3D CAD Modeling',
      'Modeled upper punch cavity and cooling channels',
      '09:00 AM',
      '01:00 PM',
      '4.0',
      'COMPLETED',
      'https://cad.internal/DWG-001.step',
      'Checked clearances'
    ];
    const csvContent = headers.join(',') + '\n' + sampleRow.map(val => `"${val}"`).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Designer_Shift_Work_Report_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const newItems = results.data.map((row: any, i: number) => {
            const rawStage = row['Work Stage'] || '3D CAD Modeling';
            const isPreset = PRESET_WORK_STAGES.includes(rawStage);

            return {
              id: Date.now() + i,
              partName: row['Part Name'] || project?.partName || '',
              drawingNumber: row['Drawing No'] || '',
              revision: row['Revision'] || 'Rev 0.1',
              workStage: isPreset ? rawStage : CUSTOM_STAGE_OPTION,
              customWorkStage: isPreset ? '' : rawStage,
              description: row['Work Description'] || '',
              startTime: row['Start Time'] || '09:00 AM',
              endTime: row['End Time'] || '01:00 PM',
              hoursSpent: Number(row['Hours Spent']) || calculateHours(row['Start Time'], row['End Time']) || 4,
              status: row['Status'] || 'COMPLETED',
              cadFileUrl: row['CAD File Link'] || '',
              remarks: row['Remarks'] || '',
            };
          });

          if (newItems.length > 0) {
            setItems(newItems);
            success("CSV Import Successful", `Loaded ${newItems.length} designer activity log entries.`);
          } else {
            error("Import Failed", "No valid activity rows found in CSV.");
          }
        } catch (err: any) {
          error("Import Error", "Could not parse the uploaded CSV file.");
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (err: any) => {
        error("Import Failed", `CSV Parsing error: ${err.message}`);
      }
    });
  };

  // Initial items array
  const createDefaultItem = (index: number) => {
    if (initialLog && index === 0) {
      const isPreset = PRESET_WORK_STAGES.includes(initialLog.workStage);
      return {
        id: initialLog.id || Date.now(),
        partName: initialLog.partName || project?.partName || '',
        drawingNumber: initialLog.drawingNumber || '',
        revision: initialLog.revision || 'Rev 0.1',
        workStage: isPreset ? (initialLog.workStage || '3D CAD Modeling') : CUSTOM_STAGE_OPTION,
        customWorkStage: isPreset ? '' : (initialLog.workStage || ''),
        description: initialLog.description || '',
        startTime: initialLog.startTime || '09:00 AM',
        endTime: initialLog.endTime || '01:00 PM',
        hoursSpent: Number(initialLog.hoursSpent) || 4,
        status: initialLog.status || 'COMPLETED',
        cadFileUrl: initialLog.cadFileUrl || '',
        remarks: initialLog.remarks || '',
      };
    }

    return {
      id: Date.now() + index,
      partName: project?.partName || '',
      drawingNumber: '',
      revision: 'Rev 0.1',
      workStage: '3D CAD Modeling',
      customWorkStage: '',
      description: '',
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      hoursSpent: 4,
      status: 'COMPLETED',
      cadFileUrl: '',
      remarks: '',
    };
  };

  const [items, setItems] = useState(() =>
    initialLog
      ? [createDefaultItem(0)]
      : Array(4).fill(null).map((_, i) => createDefaultItem(i))
  );

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    // Auto calculate hours when times change
    if (field === 'startTime' || field === 'endTime') {
      const computed = calculateHours(
        field === 'startTime' ? value : current.startTime,
        field === 'endTime' ? value : current.endTime
      );
      if (computed > 0) {
        current.hoursSpent = computed;
      }
    }

    newItems[index] = current;
    setItems(newItems);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        partName: project?.partName || '',
        drawingNumber: '',
        revision: 'Rev 0.1',
        workStage: '3D CAD Modeling',
        customWorkStage: '',
        description: '',
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        hoursSpent: 4,
        status: 'COMPLETED',
        cadFileUrl: '',
        remarks: '',
      }
    ]);
  };

  const removeRow = (index: number) => {
    if (items.length <= 1) {
      error("Cannot Remove", "At least one log entry row is required.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      if (!header.designerName.trim()) {
        error("Validation Error", "Please select or type Designer Name");
        return;
      }

      // Filter valid rows (where description is provided)
      const validItems = items.filter(item => item.description.trim().length > 0);

      if (validItems.length === 0) {
        error("Validation Error", "Please enter work description for at least one activity row.");
        return;
      }

      setIsSaving(true);

      if (initialLog && initialLog.id) {
        // Edit mode (single item)
        const item = validItems[0];
        const finalStage = item.workStage === CUSTOM_STAGE_OPTION
          ? (item.customWorkStage.trim() || 'Custom Activity')
          : item.workStage;

        await updateLogMutation.mutateAsync({
          logId: initialLog.id,
          data: {
            designerName: header.designerName,
            workDate: header.workDate,
            partName: item.partName,
            drawingNumber: item.drawingNumber,
            revision: item.revision,
            workStage: finalStage,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            hoursSpent: Number(item.hoursSpent) || 0,
            status: item.status,
            cadFileUrl: item.cadFileUrl,
            remarks: item.remarks,
          }
        });
      } else {
        // Bulk creation mode
        for (const item of validItems) {
          const finalStage = item.workStage === CUSTOM_STAGE_OPTION
            ? (item.customWorkStage.trim() || 'Custom Activity')
            : item.workStage;

          await createLogMutation.mutateAsync({
            designerName: header.designerName,
            workDate: header.workDate,
            partName: item.partName,
            drawingNumber: item.drawingNumber,
            revision: item.revision,
            workStage: finalStage,
            description: item.description,
            startTime: item.startTime,
            endTime: item.endTime,
            hoursSpent: Number(item.hoursSpent) || 0,
            status: item.status,
            cadFileUrl: item.cadFileUrl,
            remarks: item.remarks,
          });
        }
      }

      success(
        "Designer Work Saved",
        `Successfully logged ${validItems.length} designer activity entry(ies).`
      );
      onSuccess?.();
    } catch (err: any) {
      error("Error Saving Log", err?.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalShiftHours = items.reduce((acc, curr) => acc + (Number(curr.hoursSpent) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-[1450px] max-h-[92vh] rounded-[12px] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-subtle0/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-subtle shadow-blue-500/20 border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                Designer Daily Work Report (DSDR)
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-subtle0/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                  {project?.projectNumber || 'Project Work Log'}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Shift log sheet for 3D CAD design, 2D drafting, DFM analysis & engineering activities
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2.5 rounded-[12px] hover:bg-white/10 transition-colors text-zinc-400 hover:text-white border border-transparent hover:border-white/10"
            title="Close Sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Details Bar (Designer Name, Date, Project Details) */}
        <div className="p-4 sm:p-5 bg-white/[0.03] border-b border-white/10 flex flex-wrap gap-4 sm:gap-6 items-end shrink-0">
          <div className="flex-1 min-w-[240px]">
            <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-blue-400" /> Designer / Engineer Name *
            </label>
            <div className="relative">
              <input
                type="text"
                list="designer-employees-list"
                value={header.designerName}
                onChange={(e) => setHeader({ ...header, designerName: e.target.value })}
                placeholder="Type or select designer name..."
                className="w-full bg-zinc-800/80 border border-white/15 rounded-[12px] px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner font-medium"
              />
              <datalist id="designer-employees-list">
                {employees?.map((emp: any) => {
                  const deptStr = typeof emp.department === 'object' ? emp.department?.departmentName || '' : (emp.department || '');
                  return (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} {deptStr ? `(${deptStr})` : ''}
                    </option>
                  );
                })}
              </datalist>
            </div>
          </div>

          <div className="w-full sm:w-56">
            <label className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Work Date *
            </label>
            <input
              type="date"
              value={header.workDate}
              onChange={(e) => setHeader({ ...header, workDate: e.target.value })}
              className="w-full bg-zinc-800/80 border border-white/15 rounded-[12px] px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          <div className="flex-1 min-w-[200px] hidden md:flex items-center justify-end gap-3 bg-zinc-800/40 p-3 rounded-[12px] border border-white/5">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block">Total Shift Hours</span>
              <span className="text-lg font-semibold text-emerald-400 flex items-center justify-end gap-1">
                <Timer className="w-4 h-4 text-emerald-400" />
                {totalShiftHours} hrs logged
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Spreadsheet Data Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-950/40">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead>
              <tr className="text-zinc-400 border-b border-white/10 text-xs uppercase tracking-wider font-semibold bg-white/[0.02]">
                <th className="py-3 px-2 w-10 text-center">Sr.</th>
                <th className="py-3 px-2 min-w-[150px]">Part / Component</th>
                <th className="py-3 px-2 w-36">Drawing No.</th>
                <th className="py-3 px-2 w-24">Rev</th>
                <th className="py-3 px-2 w-48">Work Stage *</th>
                <th className="py-3 px-2 min-w-[280px]">Work Description *</th>
                <th className="py-3 px-2 w-28">Start</th>
                <th className="py-3 px-2 w-28">End</th>
                <th className="py-3 px-2 w-20 text-center">Hrs *</th>
                <th className="py-3 px-2 w-32">Status</th>
                <th className="py-3 px-2 w-36">CAD Link / URL</th>
                <th className="py-3 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item, index) => (
                <tr key={item.id} className="group hover:bg-white/[0.04] transition-colors">
                  {/* Sr. No */}
                  <td className="py-2 px-2 text-center text-mute font-mono text-xs">
                    {index + 1}
                  </td>

                  {/* Part Name */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.partName}
                      onChange={(e) => handleItemChange(index, 'partName', e.target.value)}
                      placeholder="e.g. Die Cavity..."
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                    />
                  </td>

                  {/* Drawing Number */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.drawingNumber}
                      onChange={(e) => handleItemChange(index, 'drawingNumber', e.target.value)}
                      placeholder="e.g. DWG-01..."
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none transition-all font-mono"
                    />
                  </td>

                  {/* Revision */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.revision}
                      onChange={(e) => handleItemChange(index, 'revision', e.target.value)}
                      placeholder="Rev 0.1"
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2 py-1.5 text-xs text-white placeholder-zinc-600 outline-none transition-all text-center"
                    />
                  </td>

                  {/* Work Stage */}
                  <td className="py-2 px-1">
                    <div className="space-y-1">
                      <select
                        value={item.workStage}
                        onChange={(e) => handleItemChange(index, 'workStage', e.target.value)}
                        className="w-full bg-zinc-800/80 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-[12px] px-2 py-1.5 text-xs text-white outline-none transition-all font-medium"
                      >
                        {WORK_STAGES.map((stg) => (
                          <option key={stg} value={stg} className="bg-zinc-900 text-white">
                            {stg}
                          </option>
                        ))}
                      </select>
                      {item.workStage === CUSTOM_STAGE_OPTION && (
                        <input
                          type="text"
                          value={item.customWorkStage}
                          onChange={(e) => handleItemChange(index, 'customWorkStage', e.target.value)}
                          placeholder="Type custom stage..."
                          className="w-full bg-blue-950/40 border border-blue-500/50 rounded px-2 py-1 text-xs text-blue-200 placeholder-blue-400/50 outline-none"
                        />
                      )}
                    </div>
                  </td>

                  {/* Work Description */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Detail task completed, CAD changes, or drafting notes..."
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                    />
                  </td>

                  {/* Start Time */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.startTime}
                      onChange={(e) => handleItemChange(index, 'startTime', e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2 py-1.5 text-xs text-white placeholder-zinc-600 outline-none transition-all text-center"
                    />
                  </td>

                  {/* End Time */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.endTime}
                      onChange={(e) => handleItemChange(index, 'endTime', e.target.value)}
                      placeholder="01:00 PM"
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 focus:bg-zinc-800 rounded-[12px] px-2 py-1.5 text-xs text-white placeholder-zinc-600 outline-none transition-all text-center"
                    />
                  </td>

                  {/* Hours Spent */}
                  <td className="py-2 px-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={item.hoursSpent}
                      onChange={(e) => handleItemChange(index, 'hoursSpent', e.target.value === '' ? ('' as any) : parseFloat(e.target.value))}
                      className="w-full bg-zinc-800/80 border border-white/15 hover:border-blue-400 focus:border-blue-500 rounded-[12px] px-1.5 py-1.5 text-xs text-emerald-400 font-semibold outline-none transition-all text-center"
                    />
                  </td>

                  {/* Status */}
                  <td className="py-2 px-1">
                    <select
                      value={item.status}
                      onChange={(e) => handleItemChange(index, 'status', e.target.value)}
                      className="w-full bg-zinc-800/80 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-[12px] px-2 py-1.5 text-xs text-white outline-none transition-all"
                    >
                      <option value="COMPLETED" className="bg-zinc-900 text-emerald-400">Completed</option>
                      <option value="IN_PROGRESS" className="bg-zinc-900 text-amber-400">In Progress</option>
                      <option value="REVIEW_PENDING" className="bg-zinc-900 text-blue-400">Review Pending</option>
                    </select>
                  </td>

                  {/* CAD Link */}
                  <td className="py-2 px-1">
                    <input
                      type="text"
                      value={item.cadFileUrl}
                      onChange={(e) => handleItemChange(index, 'cadFileUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-zinc-800/60 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-[12px] px-2 py-1.5 text-xs text-blue-300 placeholder-zinc-600 outline-none transition-all"
                    />
                  </td>

                  {/* Action Delete Row */}
                  <td className="py-2 px-1 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      className="p-1.5 rounded-[12px] hover:bg-red-500/20 text-mute hover:text-red-400 transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer Controls (Add Row, Template, Import) */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addRow}
                className="flex items-center text-xs font-semibold text-blue-400 hover:text-blue-300 bg-primary-subtle0/10 hover:bg-primary-subtle0/20 px-4 py-2.5 rounded-[12px] transition-all border border-blue-500/20 shadow-sm cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Activity Row
              </button>

              <button
                onClick={handleDownloadTemplate}
                className="flex items-center text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-[12px] transition-all border border-emerald-500/20 shadow-sm cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 mr-1.5" /> Download Template
              </button>

              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2.5 rounded-[12px] transition-all border border-purple-500/20 shadow-sm cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4 mr-1.5" /> Import CSV Sheet
              </button>
            </div>

            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-mute" />
              <span>Rows with valid task descriptions will be saved to the database.</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-zinc-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-zinc-400 font-medium">
            Shift logging {items.length} item(s) â€¢ <span className="text-emerald-400 font-semibold">{totalShiftHours} total hrs</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[12px] hover:bg-white/5 transition-colors text-zinc-400 hover:text-white font-semibold text-xs border border-white/10"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || createLogMutation.isPending || updateLogMutation.isPending}
              className="flex items-center px-7 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-[12px] shadow-subtle shadow-indigo-600/30 text-xs font-semibold tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                'Saving Reports...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Designer Work Log
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
