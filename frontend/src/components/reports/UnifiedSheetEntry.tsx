"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Cpu,
  Wrench,
  Search,
  ChevronDown,
} from 'lucide-react';
import Papa from 'papaparse';
import { useActiveRunningProjects, useCreateGlobalDesignerLog, useCreateGlobalMsdrLog } from '../../hooks/useDailyReports';
import { useMasterData } from '../../hooks/useMasterData';
import { useToast } from '../ui/Toast';
import { ActiveRunningProject } from '../../services/daily-reports.service';

// --- Interfaces ---
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

// --- Constants ---
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

const PRODUCTION_SECTIONS = [
  { id: 'MACHINE_SHOP', label: 'Machine Shop (CNC/VMC/EDM)' },
  { id: 'PRESS_SHOP', label: 'Press Shop & Tryout' },
  { id: 'TOOL_ROOM_FITTING', label: 'Tool Room Fitting & Assembly' },
  { id: 'FABRICATION_INDIAN', label: 'Fabrication (Domestic)' },
  { id: 'FABRICATION_EXPORT', label: 'Fabrication (Export)' },
  { id: 'QUALITY_INSPECTION', label: 'Quality & CMM Inspection' },
];

// --- Helpers ---
function calcHours(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 8;
  const [sH, sM] = startStr.split(':').map(Number);
  const [eH, eM] = endStr.split(':').map(Number);
  if (isNaN(sH) || isNaN(eH)) return 8;
  let diffMinutes = eH * 60 + (eM || 0) - (sH * 60 + (sM || 0));
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  return Number((diffMinutes / 60).toFixed(1));
}

function calcCuttingHours(startStr: string, endStr: string, setupHrs: number): number {
  const totalHrs = calcHours(startStr, endStr);
  return Math.max(0, Number((totalHrs - (setupHrs || 0)).toFixed(1)));
}

function addHoursToTime(startStr: string, addHours: number): string {
  if (!startStr) return startStr;
  const [sH, sM] = startStr.split(':').map(Number);
  if (isNaN(sH)) return startStr;
  let totalMinutes = (sH * 60) + (sM || 0) + (addHours * 60);
  totalMinutes = Math.round(totalMinutes);
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// â”€â”€â”€ Searchable Project Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SearchableProjectSelectProps {
  value: string;
  projects: ActiveRunningProject[];
  onChange: (projectId: string) => void;
  accentColor?: 'blue' | 'emerald';
}

function SearchableProjectSelect({ value, projects, onChange, accentColor = 'blue' }: SearchableProjectSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find((p) => p.id === value);

  const filtered = search.trim()
    ? projects.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.projectCode?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.toolName?.toLowerCase().includes(q)
        );
      })
    : projects;

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Open upward: bottom of dropdown aligns with top of trigger
      setPos({
        top: rect.top - 4, // 4px gap above trigger
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Close on outside click (check both trigger and portal panel)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on scroll (parent scroll would desync position) â€” but not panel's own scroll
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return; // allow scrolling inside dropdown
      setIsOpen(false);
      setSearch('');
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [isOpen]);

  // Focus the search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-project-item]');
      if (items[highlightIdx]) {
        items[highlightIdx].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIdx, isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIdx((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIdx((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[highlightIdx]) {
            onChange(filtered[highlightIdx].id);
            setIsOpen(false);
            setSearch('');
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearch('');
          break;
      }
    },
    [isOpen, filtered, highlightIdx, onChange]
  );

  const accent = accentColor === 'emerald'
    ? { ring: 'focus-within:ring-emerald-500/40', border: 'focus-within:border-emerald-500', highlight: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' }
    : { ring: 'focus-within:ring-blue-500/40', border: 'focus-within:border-blue-500', highlight: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' };

  const dropdownPanel = isOpen && pos
    ? ReactDOM.createPortal(
        <div
          ref={panelRef}
          onKeyDown={handleKeyDown}
          style={{
            position: 'fixed',
            left: pos.left,
            top: pos.top,
            transform: 'translateY(-100%)',
            zIndex: 9999,
          }}
          className="w-[280px] max-h-[260px] flex flex-col rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/50 dark:border-slate-700/60 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200/60 dark:border-slate-700/50">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search projectsâ€¦"
              className="flex-1 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="overflow-y-auto flex-1 py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No projects found
              </div>
            ) : (
              filtered.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  data-project-item
                  onClick={() => {
                    onChange(p.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-xs transition-colors cursor-pointer ${
                    idx === highlightIdx
                      ? accent.highlight
                      : value === p.id
                        ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${accent.badge} shrink-0`}>
                    {p.projectCode}
                  </span>
                  <span className="truncate font-medium">{p.name}</span>
                  {value === p.id && <span className="ml-auto text-[10px] opacity-50">âœ“</span>}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-8 px-2 flex items-center gap-1.5 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent ${accent.border} ${accent.ring} focus-within:ring-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition-all cursor-pointer`}
      >
        <span className="flex-1 text-left truncate">
          {selectedProject
            ? <><span className="text-[10px] font-bold opacity-60">[{selectedProject.projectCode}]</span> {selectedProject.name}</>
            : <span className="text-slate-400 font-normal">Search projectâ€¦</span>}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownPanel}
    </div>
  );
}



export function UnifiedSheetEntry({ onComplete }: { onComplete?: () => void }) {
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: machines = [] } = useMasterData('machines');
  const { data: employees = [] } = useMasterData('employees');
  
  const createDesignerLogMutation = useCreateGlobalDesignerLog();
  const createMsdrLogMutation = useCreateGlobalMsdrLog();
  const { success, error } = useToast();

  const [activeRole, setActiveRole] = useState<'DESIGNER' | 'MSDR'>('DESIGNER');
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [batchEmployeeId, setBatchEmployeeId] = useState<string>('');
  const [batchMachineId, setBatchMachineId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Designer State & Logic ---
  const createBlankDesignerRow = (startTimeOverride?: string): DesignerSheetRow => ({
    id: 'des-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    projectId: '',
    designerName: '',
    designerId: batchEmployeeId || undefined,
    workStage: '3D CAD Modeling',
    cadTool: 'SolidWorks',
    partName: '',
    drawingNumber: '',
    revision: 'R0',
    description: '',
    workDate: batchDate,
    startTime: startTimeOverride || '09:00',
    endTime: addHoursToTime(startTimeOverride || '09:00', 2),
    hoursSpent: 2,
    status: 'COMPLETED',
    cadFileUrl: '',
    remarks: '',
  });

  const [designerRows, setDesignerRows] = useState<DesignerSheetRow[]>([
    createBlankDesignerRow()
  ]);

  const handleDesignerRowChange = (id: string, field: keyof DesignerSheetRow, value: any) => {
    setDesignerRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.hoursSpent = calcHours(updated.startTime, updated.endTime);
        } else if (field === 'hoursSpent') {
          updated.endTime = addHoursToTime(updated.startTime, Number(value) || 0);
        }
        return updated;
      })
    );
  };

  const addDesignerRow = () => setDesignerRows((prev) => {
    const lastRow = prev[prev.length - 1];
    return [...prev, createBlankDesignerRow(lastRow?.endTime)];
  });
  
  const duplicateDesignerRow = (index: number) => {
    const newRow = { ...designerRows[index], id: 'des-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) };
    const updated = [...designerRows];
    updated.splice(index + 1, 0, newRow);
    setDesignerRows(updated);
  };

  const deleteDesignerRow = (index: number) => {
    if (designerRows.length === 1) return setDesignerRows([createBlankDesignerRow()]);
    setDesignerRows(designerRows.filter((_, i) => i !== index));
  };

  // --- MSDR State & Logic ---
  const createBlankMsdrRow = (startTimeOverride?: string): MsdrSheetRow => ({
    id: 'msdr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    projectId: '',
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
    startTime: startTimeOverride || '08:30',
    endTime: addHoursToTime(startTimeOverride || '08:30', 9),
    setupTime: 0.5,
    cuttingTime: 8.5,
    remarks: '',
  });

  const [msdrRows, setMsdrRows] = useState<MsdrSheetRow[]>([
    createBlankMsdrRow()
  ]);

  const handleMsdrRowChange = (id: string, field: keyof MsdrSheetRow, value: any) => {
    setMsdrRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          updated.cuttingTime = calcCuttingHours(updated.startTime, updated.endTime, Number(updated.setupTime) || 0);
        } else if (field === 'setupTime') {
          // Keep end time fixed, adjust cutting time
          updated.cuttingTime = calcCuttingHours(updated.startTime, updated.endTime, Number(value) || 0);
        } else if (field === 'cuttingTime') {
          updated.endTime = addHoursToTime(updated.startTime, (Number(updated.setupTime) || 0) + (Number(value) || 0));
        }
        return updated;
      })
    );
  };

  const addMsdrRow = () => setMsdrRows((prev) => {
    const lastRow = prev[prev.length - 1];
    return [...prev, createBlankMsdrRow(lastRow?.endTime)];
  });
  
  const duplicateMsdrRow = (index: number) => {
    const newRow = { ...msdrRows[index], id: 'msdr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) };
    const updated = [...msdrRows];
    updated.splice(index + 1, 0, newRow);
    setMsdrRows(updated);
  };

  const deleteMsdrRow = (index: number) => {
    if (msdrRows.length === 1) return setMsdrRows([createBlankMsdrRow()]);
    setMsdrRows(msdrRows.filter((_, i) => i !== index));
  };

  // --- Batch Updates ---
  const handleBatchDateChange = (dateStr: string) => {
    setBatchDate(dateStr);
    if (activeRole === 'DESIGNER') {
      setDesignerRows((prev) => prev.map((r) => ({ ...r, workDate: dateStr })));
    } else {
      setMsdrRows((prev) => prev.map((r) => ({ ...r, reportDate: dateStr })));
    }
  };

  const handleBatchEmployeeSelect = (empId: string) => {
    setBatchEmployeeId(empId);
    const emp = employees.find((x: any) => x.id === empId);
    if (activeRole === 'DESIGNER' && emp) {
      setDesignerRows((prev) => prev.map((r) => ({ ...r, designerId: empId, designerName: emp.name })));
    } else if (activeRole === 'MSDR' && emp) {
      setMsdrRows((prev) => prev.map((r) => ({ ...r, employeeId: empId })));
    }
  };

  const handleBatchMachineSelect = (mId: string) => {
    setBatchMachineId(mId);
    if (activeRole === 'MSDR' && mId) {
      setMsdrRows((prev) => prev.map((r) => ({ ...r, machineId: mId })));
    }
  };

  const clearSheet = () => {
    if (activeRole === 'DESIGNER') {
      setDesignerRows([createBlankDesignerRow(), createBlankDesignerRow(), createBlankDesignerRow()]);
    } else {
      setMsdrRows([createBlankMsdrRow(), createBlankMsdrRow(), createBlankMsdrRow()]);
    }
  };

  // --- Save Logic ---
  const handleSaveAll = async () => {
    setIsSaving(true);
    let savedCount = 0;
    try {
      if (activeRole === 'DESIGNER') {
        if (designerRows.some((r) => !r.projectId)) {
          error('Validation Error', 'Please select a Running Project for all rows.');
          setIsSaving(false);
          return;
        }
        const validRows = designerRows.filter((r) => r.designerName);
        if (validRows.length === 0) {
          error('Cannot Save Empty Sheet', 'Please ensure Designer Name is provided for at least one row.');
          setIsSaving(false);
          return;
        }
        for (const row of validRows) {
          await createDesignerLogMutation.mutateAsync({
            projectId: row.projectId,
            designerName: row.designerName,
            designerId: row.designerId,
            workStage: row.workStage,
            partName: row.partName,
            drawingNumber: row.drawingNumber,
            revision: row.revision,
            description: row.description || `Design activity on ${row.partName || 'Tooling'}`,
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
        success('Sheet Saved', `Successfully logged ${savedCount} designer activity entries.`);
      } else {
        if (msdrRows.some((r) => !r.projectId)) {
          error('Validation Error', 'Please select a Running Project for all rows.');
          setIsSaving(false);
          return;
        }
        const validRows = msdrRows.filter((r) => r.machineId && r.employeeId);
        if (validRows.length === 0) {
          error('Cannot Save Empty Sheet', 'Please ensure Machine/Tool and Operator are selected for at least one row.');
          setIsSaving(false);
          return;
        }
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
        success('MSDR Sheet Saved', `Successfully logged ${savedCount} MSDR operation entries.`);
      }
      clearSheet();
      if (onComplete) onComplete();
    } catch (err: any) {
      error('Error Saving Sheet', err.message || 'Failed to save rows.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Renderers ---
  const renderDesignerTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold tracking-wider select-none">
            <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-700/60">#</th>
            <th className="py-2.5 px-3 min-w-[180px] border-r border-slate-200/60 dark:border-slate-700/60">Running Project <span className="text-rose-500">*</span></th>
            <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/60">Designer Name <span className="text-rose-500">*</span></th>
            <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200/60 dark:border-slate-700/60">Design Work Stage</th>
            <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/60">Part / Insert Name</th>
            <th className="py-2.5 px-3 min-w-[120px] border-r border-slate-200/60 dark:border-slate-700/60">Drawing # (Rev)</th>
            <th className="py-2.5 px-3 min-w-[85px] border-r border-slate-200/60 dark:border-slate-700/60 text-center">Start</th>
            <th className="py-2.5 px-3 min-w-[85px] border-r border-slate-200/60 dark:border-slate-700/60 text-center">End</th>
            <th className="py-2.5 px-3 min-w-[100px] border-r border-slate-200/60 dark:border-slate-700/60 text-right">Hrs</th>
            <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-200/60 dark:border-slate-700/60">Activity Description</th>
            <th className="py-2.5 px-3 w-20 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
          {designerRows.map((row, idx) => (
            <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group">
              <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-200/60 dark:border-slate-700/60 select-none">
                {idx + 1}
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <SearchableProjectSelect
                  value={row.projectId}
                  projects={runningProjects}
                  onChange={(id) => handleDesignerRowChange(row.id, 'projectId', id)}
                  accentColor="blue"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="Designer Name"
                  value={row.designerName}
                  onChange={(e) => handleDesignerRowChange(row.id, 'designerName', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <select
                  value={row.workStage}
                  onChange={(e) => handleDesignerRowChange(row.id, 'workStage', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                >
                  {DEFAULT_WORK_STAGES.map((stage) => (<option key={stage} value={stage}>{stage}</option>))}
                </select>
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="e.g. Cavity Block A"
                  value={row.partName}
                  onChange={(e) => handleDesignerRowChange(row.id, 'partName', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="DRW-101"
                  value={row.drawingNumber}
                  onChange={(e) => handleDesignerRowChange(row.id, 'drawingNumber', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-center">
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => handleDesignerRowChange(row.id, 'startTime', e.target.value)}
                  className="w-full h-8 px-1 text-center font-mono text-[11px] rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-center">
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => handleDesignerRowChange(row.id, 'endTime', e.target.value)}
                  className="w-full h-8 px-1 text-center font-mono text-[11px] rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-right">
                <input
                  type="number"
                  step="0.5"
                  value={row.hoursSpent}
                  onChange={(e) => handleDesignerRowChange(row.id, 'hoursSpent', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  className="w-full h-8 px-1 text-right font-mono font-bold text-blue-600 dark:text-blue-400 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="Details of work..."
                  value={row.description}
                  onChange={(e) => handleDesignerRowChange(row.id, 'description', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-blue-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => duplicateDesignerRow(idx)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Duplicate Row"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteDesignerRow(idx)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete Row"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMsdrTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold tracking-wider select-none">
            <th className="py-2.5 px-3 w-10 text-center border-r border-slate-200/60 dark:border-slate-700/60">#</th>
            <th className="py-2.5 px-3 min-w-[180px] border-r border-slate-200/60 dark:border-slate-700/60">Running Project <span className="text-rose-500">*</span></th>
            <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/60">Production Section</th>
            <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-200/60 dark:border-slate-700/60">Machine / Tool <span className="text-rose-500">*</span></th>
            <th className="py-2.5 px-3 min-w-[140px] border-r border-slate-200/60 dark:border-slate-700/60">Operator <span className="text-rose-500">*</span></th>
            <th className="py-2.5 px-3 min-w-[110px] border-r border-slate-200/60 dark:border-slate-700/60">Tool No</th>
            <th className="py-2.5 px-3 min-w-[110px] border-r border-slate-200/60 dark:border-slate-700/60">Det No</th>
            <th className="py-2.5 px-3 min-w-[85px] border-r border-slate-200/60 dark:border-slate-700/60 text-center">Start</th>
            <th className="py-2.5 px-3 min-w-[85px] border-r border-slate-200/60 dark:border-slate-700/60 text-center">End</th>
            <th className="py-2.5 px-3 min-w-[100px] border-r border-slate-200/60 dark:border-slate-700/60 text-right">Setup</th>
            <th className="py-2.5 px-3 min-w-[100px] border-r border-slate-200/60 dark:border-slate-700/60 text-right">Cut</th>
            <th className="py-2.5 px-3 w-14 border-r border-slate-200/60 dark:border-slate-700/60 text-center">Qty</th>
            <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-200/60 dark:border-slate-700/60">Machining / Fitting Description</th>
            <th className="py-2.5 px-3 w-20 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
          {msdrRows.map((row, idx) => (
            <tr key={row.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors group">
              <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[11px] bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-200/60 dark:border-slate-700/60 select-none">
                {idx + 1}
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <SearchableProjectSelect
                  value={row.projectId}
                  projects={runningProjects}
                  onChange={(id) => handleMsdrRowChange(row.id, 'projectId', id)}
                  accentColor="emerald"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <select
                  value={row.productionSection}
                  onChange={(e) => handleMsdrRowChange(row.id, 'productionSection', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                >
                  {PRODUCTION_SECTIONS.map((sec) => (<option key={sec.id} value={sec.id}>{sec.label}</option>))}
                </select>
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <select
                  value={row.machineId}
                  onChange={(e) => handleMsdrRowChange(row.id, 'machineId', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                >
                  <option value="">-- Select Machine --</option>
                  {machines.map((m: any) => (<option key={m.id} value={m.id}>[{m.machineCode}] {m.machineName}</option>))}
                </select>
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <select
                  value={row.employeeId}
                  onChange={(e) => handleMsdrRowChange(row.id, 'employeeId', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-all"
                >
                  <option value="">-- Select Operator --</option>
                  {employees.map((emp: any) => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                </select>
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="TL-01"
                  value={row.toolNo}
                  onChange={(e) => handleMsdrRowChange(row.id, 'toolNo', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="DET-01"
                  value={row.detNo}
                  onChange={(e) => handleMsdrRowChange(row.id, 'detNo', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-center">
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => handleMsdrRowChange(row.id, 'startTime', e.target.value)}
                  className="w-full h-8 px-1 text-center font-mono text-[11px] rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-center">
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => handleMsdrRowChange(row.id, 'endTime', e.target.value)}
                  className="w-full h-8 px-1 text-center font-mono text-[11px] rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-right">
                <input
                  type="number"
                  step="0.1"
                  value={row.setupTime}
                  onChange={(e) => handleMsdrRowChange(row.id, 'setupTime', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  className="w-full h-8 px-1 text-right font-mono font-semibold text-amber-600 dark:text-amber-400 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-right">
                <input
                  type="number"
                  step="0.1"
                  value={row.cuttingTime}
                  onChange={(e) => handleMsdrRowChange(row.id, 'cuttingTime', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  className="w-full h-8 px-1 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60 text-center">
                <input
                  type="number"
                  value={row.producedQty}
                  onChange={(e) => handleMsdrRowChange(row.id, 'producedQty', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                  className="w-full h-8 px-1 text-center font-mono text-slate-900 dark:text-slate-100 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 border-r border-slate-200/60 dark:border-slate-700/60">
                <input
                  type="text"
                  placeholder="CNC roughing, Wirecut contouring..."
                  value={row.description}
                  onChange={(e) => handleMsdrRowChange(row.id, 'description', e.target.value)}
                  className="w-full h-8 px-2 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500 text-xs text-slate-900 dark:text-slate-100 focus:outline-none transition-all"
                />
              </td>
              <td className="p-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => duplicateMsdrRow(idx)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Duplicate Row"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteMsdrRow(idx)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete Row"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Unified Header & Controls */}
      <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        
        {/* Top Segmented Control & Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Daily Report Sheet Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select the role/department below to adapt the sheet columns.
            </p>
          </div>

          <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveRole('DESIGNER')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                activeRole === 'DESIGNER'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" /> Designer (CAD/CAM)
            </button>
            <button
              onClick={() => setActiveRole('MSDR')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                activeRole === 'MSDR'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" /> Shopfloor (MSDR)
            </button>
          </div>
        </div>

        {/* Batch Inputs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Log Date:</label>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => handleBatchDateChange(e.target.value)}
                className="h-9 px-3 text-xs font-bold rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
              <label className="text-xs font-semibold text-slate-500">Employee:</label>
              <select
                value={batchEmployeeId}
                onChange={(e) => handleBatchEmployeeSelect(e.target.value)}
                className="h-9 px-3 text-xs font-medium rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">-- Apply to Sheet --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {activeRole === 'MSDR' && (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                <label className="text-xs font-semibold text-slate-500">Machine:</label>
                <select
                  value={batchMachineId}
                  onChange={(e) => handleBatchMachineSelect(e.target.value)}
                  className="h-9 px-3 text-xs font-medium rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">-- Apply Machine --</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>[{m.machineCode}] {m.machineName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={activeRole === 'DESIGNER' ? addDesignerRow : addMsdrRow}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                activeRole === 'DESIGNER'
                  ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all flex items-center gap-1.5 ${
                activeRole === 'DESIGNER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
              }`}
            >
              <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save All Sheet Rows'}
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeRole === 'DESIGNER' ? renderDesignerTable() : renderMsdrTable()}

        {/* Footer Toolbar */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>
              Total Rows: <strong className="text-slate-900 dark:text-slate-100">
                {activeRole === 'DESIGNER' ? designerRows.length : msdrRows.length}
              </strong>
            </span>
            {activeRole === 'DESIGNER' ? (
              <span>
                Total Hours:{' '}
                <strong className="text-blue-600 dark:text-blue-400">
                  {designerRows.reduce((sum, r) => sum + (Number(r.hoursSpent) || 0), 0).toFixed(1)} hrs
                </strong>
              </span>
            ) : (
              <>
                <span>
                  Total Setup Hrs:{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {msdrRows.reduce((sum, r) => sum + (Number(r.setupTime) || 0), 0).toFixed(1)} h
                  </strong>
                </span>
                <span>
                  Total Cutting Hrs:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {msdrRows.reduce((sum, r) => sum + (Number(r.cuttingTime) || 0), 0).toFixed(1)} h
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearSheet}
              className="px-3 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              Clear Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
