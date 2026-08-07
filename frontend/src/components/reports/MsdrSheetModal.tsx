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
  Wrench,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Grid,
} from 'lucide-react';
import Papa from 'papaparse';
import { useActiveRunningProjects, useCreateGlobalMsdrLog } from '../../hooks/useDailyReports';
import { useMasterData } from '../../hooks/useMasterData';
import { useMasterLookups } from '../../hooks/useMasterLookups';
import { useToast } from '../ui/Toast';

export interface MsdrSheetRow {
  id: string;
  projectId: string;
  productionSection: string;
  machineId: string;
  employeeId: string;
  reportDate: string;
  toolNo: string;
  detNo: string;
  description: string;
  rawMatlSize: string;
  finishMatlSize: string;
  producedQty: number;
  startTime: string;
  endTime: string;
  setupTime: number;
  cuttingTime: number;
  remarks: string;
}

function calcCuttingHours(startStr: string, endStr: string, setupHrs: number): number {

  if (!startStr || !endStr) return 7.5;
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(eH)) return 7.5;
  let diffMinutes = eH * 60 + (eM || 0) - (sH * 60 + (sM || 0));
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  const totalHrs = Number((diffMinutes / 60).toFixed(1));
  return Math.max(0, Number((totalHrs - (setupHrs || 0)).toFixed(1)));
}

interface MsdrSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MsdrSheetModal({ isOpen, onClose, onSuccess }: MsdrSheetModalProps) {
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: machines = [] } = useMasterData('machines');
  const { data: employees = [] } = useMasterData('employees');
  const { options: sectionOptions } = useMasterLookups('PRODUCTION_SECTION');
  const createMsdrLogMutation = useCreateGlobalMsdrLog();

  const { success, error } = useToast();

  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchMachineId, setBatchMachineId] = useState<string>('');
  const [batchEmployeeId, setBatchEmployeeId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const createBlankRow = (): MsdrSheetRow => ({
    id: 'msdr-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    projectId: runningProjects[0]?.id || '',
    productionSection: 'MACHINE_SHOP',
    machineId: batchMachineId || machines[0]?.id || '',
    employeeId: batchEmployeeId || employees[0]?.id || '',
    reportDate: batchDate,
    toolNo: '',
    detNo: '',
    description: '',
    rawMatlSize: '',
    finishMatlSize: '',
    producedQty: 1,
    startTime: '08:30',
    endTime: '17:30',
    setupTime: 0.5,
    cuttingTime: 8.5,
    remarks: '',
  });

  const [rows, setRows] = useState<MsdrSheetRow[]>([
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
    createBlankRow(),
  ]);

  if (!isOpen) return null;

  const handleRowChange = (id: string, field: keyof MsdrSheetRow, value: any) => {
    setRows((prevRows) =>
      prevRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.cuttingTime = calcHours(updated.startTime, updated.endTime);
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
      id: 'msdr-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
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

  const handleBatchDateChange = (dateStr: string) => {
    setBatchDate(dateStr);
    setRows((prev) => prev.map((r) => ({ ...r, reportDate: dateStr })));
  };

  const handleBatchMachineSelect = (mId: string) => {
    setBatchMachineId(mId);
    if (mId) {
      setRows((prev) => prev.map((r) => ({ ...r, machineId: mId })));
    }
  };

  const handleBatchEmployeeSelect = (empId: string) => {
    setBatchEmployeeId(empId);
    if (empId) {
      setRows((prev) => prev.map((r) => ({ ...r, employeeId: empId })));
    }
  };

  const handleSaveAll = async () => {
    const validRows = rows.filter((r) => r.projectId && r.machineId && r.employeeId);
    if (validRows.length === 0) {
      error('Cannot Save Empty Sheet', 'Please ensure Project, Machine/Tool, and Operator are selected for at least one row.');
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const row of validRows) {
        await createMsdrLogMutation.mutateAsync({
          projectId: row.projectId,
          productionSection: row.productionSection,
          machineId: row.machineId,
          employeeId: row.employeeId,
          reportDate: row.reportDate,
          toolNo: row.toolNo,
          detNo: row.detNo,
          description: row.description || `Machining on tool ${row.toolNo || 'N/A'}`,
          rawMatlSize: row.rawMatlSize,
          finishMatlSize: row.finishMatlSize,
          producedQty: Number(row.producedQty) || 1,
          startTime: row.startTime,
          endTime: row.endTime,
          setupTime: Number(row.setupTime) || 0,
          cuttingTime: Number(row.cuttingTime) || 0,
          remarks: row.remarks,
        });
        savedCount++;
      }
      success('MSDR Sheet Saved', `Successfully recorded ${savedCount} shopfloor operation entries in the register.`);
      clearSheet();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      error('Error Saving MSDR Sheet', err.message || 'Failed to save MSDR rows.');
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Import / Export
  const exportTemplateCSV = () => {
    const templateData = [
      {
        ProjectCode: runningProjects[0]?.projectCode || 'PROJ-101',
        Section: 'MACHINE_SHOP',
        MachineCode: machines[0]?.machineCode || 'CNC-01',
        OperatorCode: employees[0]?.employeeCode || 'EMP-01',
        ToolNo: 'TL-2024-01',
        DetNo: 'DET-05',
        Description: 'CNC Rough Milling & Finishing Cavity',
        StartTime: '08:30',
        EndTime: '17:30',
        SetupTime: 0.5,
        CuttingTime: 8.5,
        Qty: 1,
      },
    ];
    const csv = Papa.unparse(templateData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'MSDR_Operation_Sheet_Register.csv');
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
        const parsedRows: MsdrSheetRow[] = results.data.map((item: any) => {
          const matchedProj = runningProjects.find(
            (p) =>
              p.projectCode?.toLowerCase() === item.ProjectCode?.toLowerCase() ||
              p.name?.toLowerCase() === item.ProjectCode?.toLowerCase()
          );

          const matchedMach = machines.find(
            (m: any) => m.machineCode?.toLowerCase() === item.MachineCode?.toLowerCase()
          );

          const matchedEmp = employees.find(
            (emp: any) =>
              emp.employeeCode?.toLowerCase() === item.OperatorCode?.toLowerCase() ||
              emp.name?.toLowerCase() === item.OperatorCode?.toLowerCase()
          );

          return {
            id: 'msdr-row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            projectId: matchedProj ? matchedProj.id : runningProjects[0]?.id || '',
            productionSection: item.Section || 'MACHINE_SHOP',
            machineId: matchedMach ? matchedMach.id : batchMachineId || machines[0]?.id || '',
            employeeId: matchedEmp ? matchedEmp.id : batchEmployeeId || employees[0]?.id || '',
            reportDate: batchDate,
            toolNo: item.ToolNo || '',
            detNo: item.DetNo || '',
            description: item.Description || '',
            rawMatlSize: '',
            finishMatlSize: '',
            producedQty: Number(item.Qty) || 1,
            startTime: item.StartTime || '08:30',
            endTime: item.EndTime || '17:30',
            setupTime: Number(item.SetupTime) || 0.5,
            cuttingTime: Number(item.CuttingTime) || calcCuttingHours(item.StartTime || '08:30', item.EndTime || '17:30', Number(item.SetupTime) || 0.5),
            remarks: '',
          };
        });

        if (parsedRows.length > 0) {
          setRows(parsedRows);
          success('CSV Uploaded', `Imported ${parsedRows.length} rows into MSDR Operation Sheet.`);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 pl-16 sm:pl-24 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Full Sheet Translucent Container */}
      <div className="relative w-full max-w-7xl max-h-[92vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-slate-700/60 shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                MSDR Operation Sheet Register
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono uppercase tracking-wider border border-white/30">
                  Excel Format Grid
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Full-screen interactive spreadsheet for logging machining, G-code cutting, setup hours & tool assembly operations.
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
              <label className="font-semibold text-slate-600 dark:text-slate-400">Default Machine:</label>
              <select
                value={batchMachineId}
                onChange={(e) => handleBatchMachineSelect(e.target.value)}
                className="h-8 px-2.5 font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Select Machine to fill all rows --</option>
                {machines.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    [{m.machineCode}] {m.machineName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600 dark:text-slate-400">Default Operator:</label>
              <select
                value={batchEmployeeId}
                onChange={(e) => handleBatchEmployeeSelect(e.target.value)}
                className="h-8 px-2.5 font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Select Operator to fill all rows --</option>
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
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + 1 Row
            </button>
            <button
              onClick={() => addRows(5)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + 5 Rows
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving MSDR...' : 'Save All MSDR Rows'}
            </button>
          </div>
        </div>

        {/* Excel Spreadsheet Table Grid */}
        <div className="flex-1 overflow-auto bg-slate-200/50 dark:bg-slate-950 p-0.5">
          <table className="w-full border-collapse text-xs select-none bg-white dark:bg-slate-900">
            {/* Excel Column Headers: A, B, C, D, E, F, G, H, I, J, K, L, M */}
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
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">K</th>
                <th className="py-1 px-2 text-center border-r border-slate-300 dark:border-slate-700">L</th>
                <th className="py-1 px-2 text-center w-16">M</th>
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
                  Production Section
                </th>
                <th className="py-2 px-2.5 min-w-[160px] border-r border-slate-300 dark:border-slate-700">
                  Machine / Tool <span className="text-rose-500">*</span>
                </th>
                <th className="py-2 px-2.5 min-w-[150px] border-r border-slate-300 dark:border-slate-700">
                  Operator / Machinist <span className="text-rose-500">*</span>
                </th>
                <th className="py-2 px-2.5 min-w-[110px] border-r border-slate-300 dark:border-slate-700">
                  Tool No
                </th>
                <th className="py-2 px-2.5 min-w-[110px] border-r border-slate-300 dark:border-slate-700">
                  Det No
                </th>
                <th className="py-2 px-2.5 min-w-[80px] text-center border-r border-slate-300 dark:border-slate-700">
                  Start
                </th>
                <th className="py-2 px-2.5 min-w-[80px] text-center border-r border-slate-300 dark:border-slate-700">
                  End
                </th>
                <th className="py-2 px-2.5 w-20 text-right border-r border-slate-300 dark:border-slate-700">
                  Hours (h)
                </th>
                <th className="py-2 px-2.5 w-14 text-center border-r border-slate-300 dark:border-slate-700">
                  Qty
                </th>
                <th className="py-2 px-2.5 min-w-[220px] border-r border-slate-300 dark:border-slate-700">
                  Machining / Fitting Operation Description
                </th>
                <th className="py-2 px-2.5 w-16 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors">
                  {/* Row Number Sidebar */}
                  <td className="py-1 px-2 text-center text-slate-500 font-mono text-[11px] bg-slate-100/70 dark:bg-slate-800/50 border-r border-slate-300 dark:border-slate-700">
                    {idx + 1}
                  </td>

                  {/* Project Selector */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.projectId}
                      onChange={(e) => handleRowChange(row.id, 'projectId', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    >
                      <option value="">-- Select Active Project --</option>
                      {runningProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.projectCode}] {p.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Production Section */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.productionSection}
                      onChange={(e) => handleRowChange(row.id, 'productionSection', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    >
                      {sectionOptions.map((sec) => (
                        <option key={sec.id} value={sec.code}>
                          {sec.label}
                        </option>
                      ))}

                    </select>
                  </td>

                  {/* Machine Dropdown */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.machineId}
                      onChange={(e) => handleRowChange(row.id, 'machineId', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    >
                      <option value="">-- Select Machine --</option>
                      {machines.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          [{m.machineCode}] {m.machineName}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Operator Dropdown */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select
                      value={row.employeeId}
                      onChange={(e) => handleRowChange(row.id, 'employeeId', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                    >
                      <option value="">-- Select Operator --</option>
                      {employees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Tool No */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="TL-01"
                      value={row.toolNo}
                      onChange={(e) => handleRowChange(row.id, 'toolNo', e.target.value)}
                      className="w-full h-8 px-2 font-mono text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Det No */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="DET-01"
                      value={row.detNo}
                      onChange={(e) => handleRowChange(row.id, 'detNo', e.target.value)}
                      className="w-full h-8 px-2 font-mono text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Start Time */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => handleRowChange(row.id, 'startTime', e.target.value)}
                      className="w-full h-8 px-1 text-center font-mono text-[11px] bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* End Time */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => handleRowChange(row.id, 'endTime', e.target.value)}
                      className="w-full h-8 px-1 text-center font-mono text-[11px] bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Hours */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-right">
                    <input
                      type="number"
                      step="0.1"
                      value={row.cuttingTime}
                      onChange={(e) => handleRowChange(row.id, 'cuttingTime', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                      className="w-full h-8 px-1 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Produced Qty */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800 text-center">
                    <input
                      type="number"
                      value={row.producedQty}
                      onChange={(e) => handleRowChange(row.id, 'producedQty', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                      className="w-full h-8 px-1 text-center font-mono bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Description */}
                  <td className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      placeholder="CNC roughing, Wirecut contouring, Fitting details..."
                      value={row.description}
                      onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                      className="w-full h-8 px-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                    />
                  </td>

                  {/* Row Actions */}
                  <td className="p-0.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => duplicateRow(idx)}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
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
              Total Hours:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                {rows.reduce((sum, r) => sum + (Number(r.cuttingTime) || 0), 0).toFixed(1)} h
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
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving Register...' : 'Save All MSDR Rows'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
