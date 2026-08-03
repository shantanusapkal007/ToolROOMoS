"use client";

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Sparkles,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Grid,
} from 'lucide-react';
import Papa from 'papaparse';
import { useActiveRunningProjects, useCreateGlobalDesignerLog } from '../../hooks/useDailyReports';
import { useMasterData } from '../../hooks/useMasterData';
import { useMasterLookups } from '../../hooks/useMasterLookups';
import { useToast } from '../ui/Toast';

export interface DesignerSheetRow {
  id: string;
  projectId: string;
  designerName: string;
  designerId?: string;
  workStage: string;
  cadTool: string;
  partName: string;
  drawingNumber: string;
  revision: string;
  description: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hoursSpent: number;
  status: string;
  cadFileUrl: string;
  remarks: string;
}

const DEFAULT_WORK_STAGES = [
  '3D CAD Modeling',
  '2D Detailing & Drafting',
  'Electrode Design & Extract',
  'CAM Toolpath Generation',
  'FEA & Mold Flow Simulation',
  'Tolerance Stackup & DFM',
  'Revision Change / ECN',
  'BOM & Tool Assembly Layout',
];

const CAD_TOOLS = [
  'SolidWorks',
  'Siemens UG NX',
  'AutoCAD Mechanical',
  'Autodesk PowerMill',
  'MasterCAM',
  'CATIA V5',
];

function calcHours(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 8;
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(eH)) return 8;
  let diffMinutes = eH * 60 + (eM || 0) - (sH * 60 + (sM || 0));
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  return Number((diffMinutes / 60).toFixed(1));
}

interface DesignerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DesignerSheetModal({ isOpen, onClose, onSuccess }: DesignerSheetModalProps) {
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: employees = [] } = useMasterData('employees');
  const { options: workStageOptions } = useMasterLookups('WORK_STAGE');
  const { options: cadToolOptions } = useMasterLookups('CAD_TOOL');
  const createDesignerLogMutation = useCreateGlobalDesignerLog();
  const { success, error } = useToast();

  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchDesignerId, setBatchDesignerId] = useState<string>('');
  const [batchDesignerName, setBatchDesignerName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const createBlankRow = (): DesignerSheetRow => ({
    id: 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    projectId: runningProjects[0]?.id || '',
    designerName: batchDesignerName || 'Lead Designer',
    designerId: batchDesignerId || undefined,
    workStage: '3D CAD Modeling',
    cadTool: 'SolidWorks',
    partName: '',
    drawingNumber: '',
    revision: 'R0',
    description: '',
    workDate: batchDate,
    startTime: '09:00',
    endTime: '11:00',
    hoursSpent: 2,
    status: 'COMPLETED',
    cadFileUrl: '',
    remarks: '',
  });

  const [rows, setRows] = useState<DesignerSheetRow[]>([
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
  ]);

  if (!isOpen) return null;

  const handleRowChange = (id: string, field: keyof DesignerSheetRow, value: any) => {
    setRows((prevRows) =>
      prevRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.hoursSpent = calcHours(updated.startTime, updated.endTime);
        }
        return updated;
      })
    );
  };

  const addRows = (count: number = 1) => {
    const newRows = Array.from({ length: count }, () => createBlankRow());
    setRows((prev) => [...prev, ...newRows]);
  };

  const duplicateRow = (index: number) => {
    const rowToCopy = rows[index];
    const newRow = {
      ...rowToCopy,
      id: 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    };
    const updated = [...rows];
    updated.splice(index + 1, 0, newRow);
    setRows(updated);
  };

  const deleteRow = (index: number) => {
    if (rows.length === 1) {
      setRows([createBlankRow()]);
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const clearSheet = () => {
    setRows([createBlankRow(), createBlankRow(), createBlankRow(), createBlankRow(), createBlankRow()]);
  };

  const handleBatchDesignerSelect = (empId: string) => {
    setBatchDesignerId(empId);
    const emp = employees.find((x: any) => x.id === empId);
    const name = emp ? emp.name : '';
    setBatchDesignerName(name);
    if (name) {
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          designerId: empId,
          designerName: name,
        }))
      );
    }
  };

  const handleBatchDateChange = (dateStr: string) => {
    setBatchDate(dateStr);
    setRows((prev) => prev.map((r) => ({ ...r, workDate: dateStr })));
  };

  const handleSaveAll = async () => {
    const validRows = rows.filter((r) => r.projectId && r.designerName && (r.partName || r.description));
    if (validRows.length === 0) {
      error('Empty Rows', 'Please select a Project and enter Part Name or Description for at least one row.');
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const row of validRows) {
        await createDesignerLogMutation.mutateAsync({
          projectId: row.projectId,
          designerName: row.designerName,
          designerId: row.designerId,
          workStage: `${row.cadTool} - ${row.workStage}`,
          partName: row.partName,
          drawingNumber: row.drawingNumber,
          revision: row.revision,
          description: row.description || `CAD/CAM design on ${row.partName || 'Tooling'}`,
          workDate: row.workDate,
          startTime: row.startTime,
          endTime: row.endTime,
          hoursSpent: Number(row.hoursSpent) || 2,
          status: row.status,
          cadFileUrl: row.cadFileUrl,
          remarks: row.remarks,
        });
        savedCount++;
      }
      success('Designer Sheet Saved', `Successfully recorded ${savedCount} activity entries in the daily register.`);
      clearSheet();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      error('Error Saving Sheet', err.message || 'Failed to save some entries.');
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Import / Export
  const exportTemplateCSV = () => {
    const templateData = [
      {
        ProjectCode: runningProjects[0]?.projectCode || 'PROJ-101',
        DesignerName: batchDesignerName || 'Lead Designer',
        WorkStage: '3D CAD Modeling',
        CADTool: 'SolidWorks',
        PartName: 'Core Insert 01',
        DrawingNumber: 'DRW-1001',
        Revision: 'R0',
        StartTime: '09:00',
        EndTime: '18:00',
        Description: '3D solid modeling of core cavity blocks',
        Status: 'COMPLETED',
      },
    ];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Designer_Activity_Sheet_Register.csv');
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
      complete: (results: any) => {
        const parsedRows: DesignerSheetRow[] = results.data.map((item: any) => {
          const matchedProj = runningProjects.find(
            (p) =>
              p.projectCode?.toLowerCase() === item.ProjectCode?.toLowerCase() ||
              p.name?.toLowerCase() === item.ProjectCode?.toLowerCase()
          );

          return {
            id: 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            projectId: matchedProj ? matchedProj.id : runningProjects[0]?.id || '',
            designerName: item.DesignerName || batchDesignerName || 'Designer',
            designerId: batchDesignerId,
            workStage: item.WorkStage || '3D CAD Modeling',
            cadTool: item.CADTool || 'SolidWorks',
            partName: item.PartName || '',
            drawingNumber: item.DrawingNumber || '',
            revision: item.Revision || 'R0',
            description: item.Description || '',
            workDate: batchDate,
            startTime: item.StartTime || '09:00',
            endTime: item.EndTime || '18:00',
            hoursSpent: calcHours(item.StartTime || '09:00', item.EndTime || '18:00'),
            status: item.Status || 'COMPLETED',
            cadFileUrl: '',
            remarks: '',
          };
        });

        if (parsedRows.length > 0) {
          setRows(parsedRows);
          success('CSV Uploaded', `Imported ${parsedRows.length} rows into Designer Activity Sheet.`);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pl-16 sm:pl-24 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Full Sheet Translucent Container */}
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-slate-700/60 shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Designer Activity Sheet Register
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider border border-white/30">
                  Excel Format Grid
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Full-screen interactive spreadsheet for logging CAD/CAM design stages, drawings & hours across active running projects.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportTemplateCSV}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV Template
            </button>
            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Batch Defaults Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Sheet Date:</label>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => handleBatchDateChange(e.target.value)}
                className="h-8 px-2.5 font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Default Designer:</label>
              <select
                value={batchDesignerId}
                onChange={(e) => handleBatchDesignerSelect(e.target.value)}
                className="h-8 px-2.5 font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Select Designer to fill all rows --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addRows(1)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + 1 Row
            </button>
            <button
              onClick={() => addRows(5)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + 5 Rows
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving Register...' : 'Save All Sheet Rows'}
            </button>
          </div>
        </div>

        {/* Excel Spreadsheet Table Grid */}
        <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 p-0.5">
          <table className="w-full border-collapse text-xs select-none bg-white dark:bg-slate-900">
            {/* Excel Column Headers: A, B, C, D, E, F, G, H, I, J, K */}
            <thead>
              <tr className="bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-mono border-b border-slate-300 dark:border-slate-700">
                <th className="py-1 px-2 text-center w-10 border-r border-slate-300 dark:border-slate-700"></th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">A</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">B</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">C</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">D</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">E</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">F</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">G</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">H</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">I</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">J</th>
                <th className="py-1 px-2 text-center w-16">K</th>
              </tr>

              {/* Functional Headers */}
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-2 px-2 text-center w-10 border-r border-slate-300 dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800">
                  #
                </th>
                <th className="py-2 px-2.5 min-w-[200px] border-r border-slate-300 dark:border-slate-700">
                  Running Project <span className="text-rose-500">*</span>
                </th>
                <th className="py-2 px-2.5 min-w-[150px] border-r border-slate-300 dark:border-slate-700">
                  Designer Name <span className="text-rose-500">*</span>
                </th>
                <th className="py-2 px-2.5 min-w-[170px] border-r border-slate-300 dark:border-slate-700">
                  Design Stage
                </th>
                <th className="py-2 px-2.5 min-w-[140px] border-r border-slate-300 dark:border-slate-700">
                  CAD Tool
                </th>
                <th className="py-2 px-2.5 min-w-[150px] border-r border-slate-300 dark:border-slate-700">
                  Part / Core / Punch Name
                </th>
                <th className="py-2 px-2.5 min-w-[130px] border-r border-slate-300 dark:border-slate-700">
                  Drawing # (Rev)
                </th>
                <th className="py-2 px-2.5 min-w-[80px] text-center border-r border-slate-300 dark:border-slate-700">
                  Start
                </th>
                <th className="py-2 px-2.5 min-w-[80px] text-center border-r border-slate-300 dark:border-slate-700">
                  End
                </th>
                <th className="py-2 px-2.5 w-16 text-right border-r border-slate-300 dark:border-slate-700">
                  Hours
                </th>
                <th className="py-2 px-2.5 min-w-[220px] border-r border-slate-300 dark:border-slate-700">
                  Activity Notes & Descriptions
                </th>
                <th className="py-2 px-2.5 w-16 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-colors">
                  {/* Row Number Sidebar */}
                  <td className="py-1 px-2 text-center text-slate-500 font-mono text-[11px] bg-slate-100/70 dark:bg-slate-800/50 border-r border-slate-300 dark:border-slate-700">
                    {idx + 1}
                  </td>

                  {/* Project Selector */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.projectId}
                      onChange={(e) => handleRowChange(row.id, 'projectId', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    >
                      <option value="">-- Select Active Project --</option>
                      {runningProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.projectCode}] {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Designer Name */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Designer Name"
                      value={row.designerName}
                      onChange={(e) => handleRowChange(row.id, 'designerName', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Work Stage */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.workStage}
                      onChange={(e) => handleRowChange(row.id, 'workStage', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    >
                      {workStageOptions.map((stage) => (
                        <option key={stage.id} value={stage.label}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* CAD Tool */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.cadTool}
                      onChange={(e) => handleRowChange(row.id, 'cadTool', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    >
                      {cadToolOptions.map((tool) => (
                        <option key={tool.id} value={tool.label}>
                          {tool.label}
                        </option>
                      ))}
                    </select>

                  </td>

                  {/* Part Name */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="e.g. Core Insert 01"
                      value={row.partName}
                      onChange={(e) => handleRowChange(row.id, 'partName', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Drawing Number */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="DRW-101 (R0)"
                      value={row.drawingNumber}
                      onChange={(e) => handleRowChange(row.id, 'drawingNumber', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Start Time */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => handleRowChange(row.id, 'startTime', e.target.value)}
                      className="w-full h-8 px-1 text-center font-mono text-[11px] bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* End Time */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => handleRowChange(row.id, 'endTime', e.target.value)}
                      className="w-full h-8 px-1 text-center font-mono text-[11px] bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Hours Spent */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-right">
                    <input
                      type="number"
                      step="0.5"
                      value={row.hoursSpent}
                      onChange={(e) => handleRowChange(row.id, 'hoursSpent', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                      className="w-full h-8 px-1 text-right font-mono font-bold text-blue-600 dark:text-blue-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Description */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="Describe modeling, electrode extraction or toolpathing details..."
                      value={row.description}
                      onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Row Actions */}
                  <td className="p-0.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => duplicateRow(idx)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Duplicate Row"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-3 sm:p-4 bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-5 text-slate-600 dark:text-slate-400 font-medium">
            <span>
              Total Rows: <strong className="text-slate-900 dark:text-slate-100 font-bold">{rows.length}</strong>
            </span>
            <span>
              Total Designer Hours:{' '}
              <strong className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                {rows.reduce((sum, r) => sum + (Number(r.hoursSpent) || 0), 0).toFixed(1)} hrs
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearSheet}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Clear Sheet
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving Register...' : 'Save All Sheet Rows'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
