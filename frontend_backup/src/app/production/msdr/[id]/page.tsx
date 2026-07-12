'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, ChevronRight, Play, Pause, CheckCircle, Printer, History, Paperclip } from 'lucide-react';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';

// --- MOCK MASTER DATA ---
const PROJECTS = [
  { id: 'PRJ-901', label: 'PRJ-901', customer: 'Tata Motors', partName: 'Base Plate', drawingNo: 'TM-BP-001', rev: 'A' },
  { id: 'PRJ-882', label: 'PRJ-882', customer: 'Mahindra', partName: 'Core Pin', drawingNo: 'MH-CP-04', rev: 'B' },
];

const ROUTING_OPS = {
  'PRJ-901': [
    { id: 'OP-10', label: '10 - Rough Milling', name: 'Rough Milling', machineGroup: 'VMC', estHours: 4, cycleTime: 120 },
    { id: 'OP-20', label: '20 - Finish Milling', name: 'Finish Milling', machineGroup: 'VMC', estHours: 3, cycleTime: 90 },
  ],
  'PRJ-882': [
    { id: 'OP-10', label: '10 - CNC Turning', name: 'CNC Turning', machineGroup: 'CNC', estHours: 6, cycleTime: 45 },
  ]
};

const MACHINES = [
  { id: 'M1', label: 'VMC-01', code: 'VMC-01', rate: 1200, dept: 'Milling', type: 'Haas VF2' },
  { id: 'M2', label: 'CNC-04', code: 'CNC-04', rate: 800, dept: 'Turning', type: 'Jyoti DX' },
];

const OPERATORS = [
  { id: 'O1', label: 'Ramesh Kumar', code: 'EMP001', dept: 'Production', rate: 250, skill: 'Senior CNC' },
  { id: 'O2', label: 'Suresh Das', code: 'EMP002', dept: 'Production', rate: 200, skill: 'CNC Operator' },
];

const ROW_STATUSES = [
  { id: 'Pending', label: 'Pending' },
  { id: 'Running', label: 'Running' },
  { id: 'Paused', label: 'Paused' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Hold', label: 'Hold' },
  { id: 'Cancelled', label: 'Cancelled' },
];

export function MSDRFormContent({ msdrId, projectId }: { msdrId: string; projectId?: string | null }) {
  const { toast } = useToast();

  const [header, setHeader] = useState({
    no: `MSDR-${msdrId}`,
    date: new Date().toISOString().split('T')[0],
    shift: 'General',
    department: 'Milling',
    supervisor: 'Rajesh Verma',
    remarks: '',
  });

  const [status, setStatus] = useState<string>('Draft');

  useStandardToolbar({
    featureId: 'msdr-detail',
    onSave: () => toast('success', 'Saved', 'MSDR saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting MSDR...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const documentActions: DocumentAction[] = [
    {
      id: 'start',
      label: 'Start Shift',
      icon: Play,
      variant: 'primary',
      visible: status === 'Draft' || status === 'Paused',
      onClick: () => { setStatus('Active'); toast('success', 'Shift Started', 'MSDR active.'); }
    },
    {
      id: 'pause',
      label: 'Pause Shift',
      icon: Pause,
      variant: 'secondary',
      visible: status === 'Active',
      onClick: () => { setStatus('Paused'); toast('info', 'Shift Paused', 'Shift paused.'); }
    },
    {
      id: 'complete',
      label: 'Complete Shift',
      icon: CheckCircle,
      variant: 'success',
      visible: status === 'Active',
      onClick: () => { setStatus('Completed'); toast('success', 'Shift Completed', 'Data synced.'); }
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      visible: true,
      onClick: () => window.print()
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      visible: true,
      onClick: () => toast('info', 'History', 'Not implemented')
    }
  ];

  const getNewRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    serialNo: prevRow ? parseInt(prevRow.serialNo) + 1 : 1,
    machineId: prevRow?.machineId || '',
    machineName: prevRow?.machineName || '',
    machineRate: prevRow?.machineRate || 0,
    operatorId: prevRow?.operatorId || '',
    operatorName: prevRow?.operatorName || '',
    labourRate: prevRow?.labourRate || 0,
    projectId: prevRow?.projectId || '',
    customer: prevRow?.customer || '',
    partName: prevRow?.partName || '',
    drawingNo: prevRow?.drawingNo || '',
    toolNo: '',
    operationId: '',
    operationName: '',
    quantity: '0',
    rejectedQty: '0',
    startTime: '',
    endTime: '',
    runningHours: '0',
    machineCost: '0',
    labourCost: '0',
    productionCost: '0',
    remarks: '',
    status: 'Pending',
  });

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Initial row
    if (data.length === 0) {
      setData([getNewRow()]);
    }
  }, []);

  // Time difference in hours
  const calcHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(`2000-01-01T${start}`);
    const e = new Date(`2000-01-01T${end}`);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    let diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
    if (diff < 0) diff += 24; // Cross midnight
    return diff;
  };

  const formulas = useMemo(() => ({
    runningHours: (row: any) => calcHours(row.startTime, row.endTime).toFixed(2),
    machineHours: (row: any) => calcHours(row.startTime, row.endTime).toFixed(2),
    machineCost: (row: any) => (calcHours(row.startTime, row.endTime) * (parseFloat(row.machineRate) || 0)).toFixed(2),
    labourCost: (row: any) => (calcHours(row.startTime, row.endTime) * (parseFloat(row.labourRate) || 0)).toFixed(2),
    productionCost: (row: any) => {
      const m = calcHours(row.startTime, row.endTime) * (parseFloat(row.machineRate) || 0);
      const l = calcHours(row.startTime, row.endTime) * (parseFloat(row.labourRate) || 0);
      return (m + l).toFixed(2);
    }
  }), []);

  const EditableCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    React.useEffect(() => { setValue(initialValue); }, [initialValue]);
    const onBlur = () => { table.options.meta?.updateData(row.index, column.id, value); };

    if (isActive) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-black/60 border border-emerald-500/50 rounded px-2 py-1 text-[13px] text-white focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] shadow-inner"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') onBlur(); }}
        />
      );
    }
    return (
      <div 
        className={`w-full h-full min-h-[30px] px-2 py-1.5 rounded-md border text-[13px] transition-colors flex items-center cursor-text 
          bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] truncate
          ${value ? 'border-white/5 text-zinc-300' : 'border-white/10 border-dashed text-zinc-600 hover:text-zinc-400'}
          hover:border-emerald-500/40 hover:bg-black/60
        `} 
        title={value}
      >
        {value || '...'}
      </div>
    );
  };

  const TimeCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    React.useEffect(() => { setValue(initialValue); }, [initialValue]);
    const onBlur = () => { table.options.meta?.updateData(row.index, column.id, value); };

    if (isActive) {
      return (
        <input
          type="time"
          autoFocus
          className="w-full h-full bg-black/60 border border-emerald-500/50 rounded px-2 py-1 text-[13px] text-white focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] shadow-inner"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') onBlur(); }}
        />
      );
    }
    return (
      <div 
        className={`w-full h-full min-h-[30px] px-2 py-1.5 rounded-md border text-[13px] transition-colors flex items-center cursor-text 
          bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] truncate
          ${value ? 'border-white/5 text-zinc-300' : 'border-white/10 border-dashed text-zinc-600 hover:text-zinc-400'}
          hover:border-emerald-500/40 hover:bg-black/60
        `} 
        title={value}
      >
        {value || '...'}
      </div>
    );
  };

  const ReadOnlyCell = ({ getValue }: any) => (
    <div className="w-full h-full min-h-[30px] px-2 py-1.5 text-[13px] text-zinc-500 font-medium flex items-center truncate">{getValue()}</div>
  );

  const AutocompleteCell = ({ getValue, row, column, table, isActive, options, onSelect }: any) => {
    return (
      <div className="w-full h-full min-h-[30px] flex items-center">
        <SearchableAutocomplete
          value={getValue()}
          onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
          onSelect={(opt) => onSelect(opt, row.index, table.options.meta)}
          options={options}
          isActive={isActive}
          placeholder="Select..."
        />
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'S.No', accessorKey: 'serialNo', cell: EditableCell, size: 60 },
    { 
      header: 'Machine', 
      accessorKey: 'machineName', 
      size: 140,
      cell: (props: any) => <AutocompleteCell {...props} options={MACHINES} onSelect={(opt: any, idx: number, meta: any) => {
        meta?.updateData(idx, 'machineName', opt.label);
        meta?.updateData(idx, 'machineId', opt.id);
        meta?.updateData(idx, 'machineRate', opt.rate);
      }}/>
    },
    { 
      header: 'Operator', 
      accessorKey: 'operatorName', 
      size: 140,
      cell: (props: any) => <AutocompleteCell {...props} options={OPERATORS} onSelect={(opt: any, idx: number, meta: any) => {
        meta?.updateData(idx, 'operatorName', opt.label);
        meta?.updateData(idx, 'operatorId', opt.id);
        meta?.updateData(idx, 'labourRate', opt.rate);
      }}/>
    },
    { 
      header: 'Project', 
      accessorKey: 'projectId', 
      size: 120,
      cell: (props: any) => <AutocompleteCell {...props} options={PROJECTS} onSelect={(opt: any, idx: number, meta: any) => {
        meta?.updateData(idx, 'projectId', opt.id);
        meta?.updateData(idx, 'customer', opt.customer);
        meta?.updateData(idx, 'partName', opt.partName);
        meta?.updateData(idx, 'drawingNo', opt.drawingNo);
        meta?.updateData(idx, 'operationName', ''); // Clear operation if project changes
      }}/>
    },
    { header: 'Part / Drg', accessorKey: 'drawingNo', cell: ReadOnlyCell, size: 140 },
    { header: 'Tool No', accessorKey: 'toolNo', cell: EditableCell, size: 100 },
    { 
      header: 'Operation', 
      accessorKey: 'operationName', 
      size: 180,
      cell: (props: any) => {
        const projId = props.row.original.projectId;
        const ops = projId && ROUTING_OPS[projId as keyof typeof ROUTING_OPS] ? ROUTING_OPS[projId as keyof typeof ROUTING_OPS] : [];
        return <AutocompleteCell {...props} options={ops} onSelect={(opt: any, idx: number, meta: any) => {
          meta?.updateData(idx, 'operationName', opt.label);
          meta?.updateData(idx, 'operationId', opt.id);
        }}/>
      }
    },
    { header: 'Qty', accessorKey: 'quantity', cell: EditableCell, size: 70 },
    { header: 'Rej', accessorKey: 'rejectedQty', cell: EditableCell, size: 70 },
    { header: 'Start', accessorKey: 'startTime', cell: TimeCell, size: 90 },
    { header: 'End', accessorKey: 'endTime', cell: TimeCell, size: 90 },
    { header: 'Hrs', accessorKey: 'runningHours', cell: ReadOnlyCell, size: 70 },
    { header: 'M/C Rate', accessorKey: 'machineRate', cell: ReadOnlyCell, size: 80 },
    { header: 'M/C Cost', accessorKey: 'machineCost', cell: ReadOnlyCell, size: 90 },
    { header: 'Lab Rate', accessorKey: 'labourRate', cell: ReadOnlyCell, size: 80 },
    { header: 'Lab Cost', accessorKey: 'labourCost', cell: ReadOnlyCell, size: 90 },
    { header: 'Prod Cost', accessorKey: 'productionCost', cell: ReadOnlyCell, size: 100 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 150 },
    { 
      header: 'Status', 
      accessorKey: 'status', 
      size: 120,
      cell: (props: any) => <AutocompleteCell {...props} options={ROW_STATUSES} onSelect={(opt: any, idx: number, meta: any) => {
        meta?.updateData(idx, 'status', opt.label);
      }}/>
    },
  ], []);

  // Summary Calcs
  const validRows = data.filter(r => parseFloat(formulas.runningHours(r)) > 0 || parseFloat(r.quantity) > 0);
  const totalOps = data.length;
  const completedOps = data.filter(r => r.status === 'Completed').length;
  const pendingOps = totalOps - completedOps;
  const totalQty = data.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0);
  const totalRej = data.reduce((acc, r) => acc + (parseFloat(r.rejectedQty) || 0), 0);
  const totalRunHrs = data.reduce((acc, r) => acc + (parseFloat(formulas.runningHours(r)) || 0), 0);
  const totalMachineCost = data.reduce((acc, r) => acc + (parseFloat(formulas.machineCost(r)) || 0), 0);
  const totalLabourCost = data.reduce((acc, r) => acc + (parseFloat(formulas.labourCost(r)) || 0), 0);
  const totalProdCost = totalMachineCost + totalLabourCost;

  return (
      <div className="h-full flex flex-col w-full relative bg-transparent">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">MSDR: {msdrId}</h2>
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              <span className={status === 'Completed' ? "text-emerald-400" : "text-blue-400"}>
                {status.toUpperCase()}
              </span>
              <DocumentActions actions={documentActions} />
              {projectId && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">Project: {projectId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col mt-4 hide-on-print z-10">
          {/* Header Editor */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 shrink-0 bg-white/[0.01] border-b border-white/[0.02]">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Date</label>
              <input type="date" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" value={header.date} onChange={e=>setHeader({...header, date: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Shift</label>
              <select className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" value={header.shift} onChange={e=>setHeader({...header, shift: e.target.value})}>
                <option>General</option>
                <option>Shift 1</option>
                <option>Shift 2</option>
                <option>Shift 3</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Department</label>
              <select className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" value={header.department} onChange={e=>setHeader({...header, department: e.target.value})}>
                <option>Milling</option>
                <option>Turning</option>
                <option>Grinding</option>
                <option>Assembly</option>
                <option>Wire Cut</option>
                <option>EDM</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Supervisor</label>
              <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" value={header.supervisor} onChange={e=>setHeader({...header, supervisor: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Remarks</label>
              <input type="text" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" value={header.remarks} onChange={e=>setHeader({...header, remarks: e.target.value})} placeholder="Optional..." />
            </div>
          </div>

          <EditableDataGrid 
            columns={columns} 
            data={data} 
            onDataChange={setData}
            getNewRow={getNewRow}
            formulas={formulas}
            onRowFocus={(row) => {
              if (row && row.projectId) {
                // Preload project specific contextual data in future
              }
            }}
          />
          
          {/* Footer Summary */}
          <div className="grid grid-cols-3 md:grid-cols-7 gap-4 p-4 shrink-0 bg-white/[0.01] border-t border-white/[0.02]">
            <div>
              <div className="text-xs text-zinc-500">Ops Logged</div>
              <div className="text-sm font-bold text-zinc-100">{totalOps}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Ops Pending</div>
              <div className="text-sm font-bold text-amber-400">{pendingOps}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Total Qty</div>
              <div className="text-sm font-bold text-blue-400">{totalQty} / {totalRej} Rej</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Total Hours</div>
              <div className="text-sm font-bold text-zinc-100">{totalRunHrs.toFixed(2)} Hrs</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">M/C Cost</div>
              <div className="text-sm font-bold text-zinc-100">₹{totalMachineCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Labour Cost</div>
              <div className="text-sm font-bold text-zinc-100">₹{totalLabourCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Prod Cost</div>
              <div className="text-sm font-bold text-emerald-400">₹{totalProdCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
            </div>
          </div>
        </div>

        {/* --- PRINTABLE A4 LAYOUT --- */}
        <div className="hidden print:block w-full max-w-[297mm] bg-white text-black min-h-[210mm] p-8 font-sans mx-auto text-[10px]" id="printable-msdr">
          <div className="text-center mb-4 border-b-2 border-black pb-2">
            <h1 className="text-2xl font-black uppercase tracking-widest">MACHINE SHOP DAILY REPORT</h1>
            <p className="font-bold mt-1 text-gray-700">Enterprise ToolRoom Limited</p>
          </div>
          
          <div className="flex justify-between font-bold mb-4 text-xs">
            <div>MSDR No: {header.no}</div>
            <div>Date: {header.date}</div>
            <div>Shift: {header.shift}</div>
            <div>Department: {header.department}</div>
          </div>

          <table className="w-full border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-center w-8">S.No</th>
                <th className="border border-black p-1 text-left">Machine</th>
                <th className="border border-black p-1 text-left">Operator</th>
                <th className="border border-black p-1 text-left">Project</th>
                <th className="border border-black p-1 text-left">Part / Drg</th>
                <th className="border border-black p-1 text-left">Operation</th>
                <th className="border border-black p-1 text-center w-12">Qty</th>
                <th className="border border-black p-1 text-center w-12">Rej</th>
                <th className="border border-black p-1 text-center w-16">Start</th>
                <th className="border border-black p-1 text-center w-16">End</th>
                <th className="border border-black p-1 text-center w-16">Hrs</th>
                <th className="border border-black p-1 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1 text-center">{row.serialNo}</td>
                  <td className="border border-black p-1 font-bold">{row.machineName}</td>
                  <td className="border border-black p-1">{row.operatorName}</td>
                  <td className="border border-black p-1 font-bold">{row.projectId}</td>
                  <td className="border border-black p-1 truncate max-w-[100px]">{row.partName} {row.drawingNo}</td>
                  <td className="border border-black p-1">{row.operationName}</td>
                  <td className="border border-black p-1 text-center font-bold">{row.quantity}</td>
                  <td className="border border-black p-1 text-center">{row.rejectedQty}</td>
                  <td className="border border-black p-1 text-center">{row.startTime}</td>
                  <td className="border border-black p-1 text-center">{row.endTime}</td>
                  <td className="border border-black p-1 text-center font-bold">{formulas.runningHours(row)}</td>
                  <td className="border border-black p-1 truncate max-w-[100px]">{row.remarks}</td>
                </tr>
              ))}
              {/* Fill empty rows to make it look like a register */}
              {Array.from({ length: Math.max(0, 20 - data.length) }).map((_, i) => (
                <tr key={'empty-'+i}>
                  <td className="border border-black p-1 h-6"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-12 font-bold uppercase text-xs">
            <div className="border-t border-black pt-1 w-48 text-center">Operator Signature</div>
            <div className="border-t border-black pt-1 w-48 text-center">Supervisor Signature</div>
            <div className="border-t border-black pt-1 w-48 text-center">Production Manager</div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
          }
        `}} />
      </div>
  );
}

export default function MSDRDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  return <MSDRFormContent msdrId={resolvedParams.id} projectId={projectId} />;
}

