'use client';

import React, { useState, useMemo } from 'react';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';

const MACHINES = [
  { id: '1', label: 'VMC-01', rate: 500 },
  { id: '2', label: 'CNC-04', rate: 450 },
  { id: '3', label: 'EDM-02', rate: 600 },
];

const OPERATORS = [
  { id: '1', label: 'Ramesh Kumar', rate: 150 },
  { id: '2', label: 'Suresh Das', rate: 150 },
  { id: '3', label: 'Amit Singh', rate: 200 },
];

export default function ProductionPlanning({ projectId }: { projectId?: string }) {
  const getNewRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    project: prevRow?.project || '',
    part: prevRow?.part || '',
    operation: '',
    machine: '',
    operator: '',
    priority: 'Normal',
    targetStart: '',
    targetFinish: '',
    estHours: '0',
    estMachineCost: 0,
    estLabourCost: 0,
    status: 'Pending',
    
    // Hidden attributes for formulas
    _machineRate: 0,
    _operatorRate: 0,
  });

  const [data, setData] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      project: 'PRJ-901',
      part: 'Base Plate',
      operation: 'Rough Milling',
      machine: 'VMC-01',
      operator: 'Ramesh Kumar',
      priority: 'High',
      targetStart: '2026-07-09',
      targetFinish: '2026-07-10',
      estHours: '12',
      estMachineCost: 6000,
      estLabourCost: 1800,
      status: 'Pending',
      _machineRate: 500,
      _operatorRate: 150,
    }
  ]);

  const formulas = useMemo(() => ({
    estMachineCost: (row: any) => {
      const hrs = parseFloat(row.estHours) || 0;
      return (hrs * (row._machineRate || 0)).toFixed(2);
    },
    estLabourCost: (row: any) => {
      const hrs = parseFloat(row.estHours) || 0;
      return (hrs * (row._operatorRate || 0)).toFixed(2);
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'id', label: 'Total Operations', type: 'count' as const },
    { accessorKey: 'estHours', label: 'Total Est Hours', type: 'sum' as const },
    { accessorKey: 'estMachineCost', label: 'Total M/C Cost', type: 'sum' as const, format: (v: number) => `₹ ${v.toLocaleString()}` },
    { accessorKey: 'estLabourCost', label: 'Total Labour Cost', type: 'sum' as const, format: (v: number) => `₹ ${v.toLocaleString()}` },
  ], []);

  const EditableCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    React.useEffect(() => { setValue(initialValue); }, [initialValue]);
    const onBlur = () => { table.options.meta?.updateData(row.index, column.id, value); };

    if (isActive) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-black/60 border border-blue-500/50 rounded px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') onBlur(); }}
        />
      );
    }
    return <div className="w-full h-full min-h-[24px] truncate" title={value}>{value}</div>;
  };

  const ReadOnlyCell = ({ getValue }: any) => (
    <div className="w-full h-full min-h-[24px] text-zinc-500 font-medium">{getValue()}</div>
  );

  const MachineCell = ({ getValue, row, column, table, isActive }: any) => {
    return (
      <SearchableAutocomplete
        value={getValue()}
        onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
        onSelect={(opt) => {
          if (opt.rate) table.options.meta?.updateData(row.index, '_machineRate', opt.rate);
        }}
        options={MACHINES}
        isActive={isActive}
        placeholder="Select Machine..."
      />
    );
  };

  const OperatorCell = ({ getValue, row, column, table, isActive }: any) => {
    return (
      <SearchableAutocomplete
        value={getValue()}
        onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
        onSelect={(opt) => {
          if (opt.rate) table.options.meta?.updateData(row.index, '_operatorRate', opt.rate);
        }}
        options={OPERATORS}
        isActive={isActive}
        placeholder="Select Operator..."
      />
    );
  };

  const StatusCell = ({ getValue }: any) => {
    const val = getValue();
    const colors: Record<string, string> = {
      'Pending': 'text-zinc-400 bg-zinc-400/10',
      'Ready': 'text-blue-400 bg-blue-400/10',
      'Scheduled': 'text-purple-400 bg-purple-400/10',
    };
    const cls = colors[val] || colors['Pending'];
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/5 ${cls}`}>
        {val}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Project', accessorKey: 'project', cell: EditableCell, size: 100 },
    { header: 'Part', accessorKey: 'part', cell: EditableCell, size: 120 },
    { header: 'Operation', accessorKey: 'operation', cell: EditableCell, size: 150 },
    { header: 'Machine', accessorKey: 'machine', cell: MachineCell, size: 120 },
    { header: 'Operator', accessorKey: 'operator', cell: OperatorCell, size: 120 },
    { header: 'Priority', accessorKey: 'priority', cell: EditableCell, size: 80 },
    { header: 'Target Start', accessorKey: 'targetStart', cell: EditableCell, size: 100 },
    { header: 'Target Finish', accessorKey: 'targetFinish', cell: EditableCell, size: 100 },
    { header: 'Est Hrs', accessorKey: 'estHours', cell: EditableCell, size: 80 },
    { header: 'M/C Cost', accessorKey: 'estMachineCost', cell: ReadOnlyCell, size: 100 },
    { header: 'Lab Cost', accessorKey: 'estLabourCost', cell: ReadOnlyCell, size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  return (
    <>
            <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Production Scheduler</h2>
            <p className="text-zinc-400 text-xs mt-1">Plan machine routing, dates, and estimated costs</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <EditableDataGrid 
            columns={columns} 
            data={data} 
            onDataChange={setData}
            getNewRow={getNewRow}
            formulas={formulas}
            summary={summary}
            enableDnd
          />
        </div>
      </div>
    </>
  );
}
