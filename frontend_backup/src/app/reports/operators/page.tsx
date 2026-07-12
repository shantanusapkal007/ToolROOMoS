'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function OperatorProductivityReport() {
  
  const EfficiencyCell = ({ getValue }: any) => {
    const val = parseFloat(getValue());
    const color = val >= 90 ? 'text-green-400 font-black' : val >= 75 ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold';
    return <span className={color}>{val}%</span>;
  };

  const columns = useMemo(() => [
    { header: 'Operator', accessorKey: 'operator', size: 150 },
    { header: 'Current Shift', accessorKey: 'shift', size: 120 },
    { header: 'Machine', accessorKey: 'machine', size: 120 },
    { header: 'Logged Hrs (MTD)', accessorKey: 'hours', size: 140 },
    { header: 'Operations Completed', accessorKey: 'operations', size: 180 },
    { header: 'Rejected Qty', accessorKey: 'rejectedQty', size: 120 },
    { header: 'Efficiency', accessorKey: 'efficiency', cell: EfficiencyCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      operator: 'Santosh K.',
      shift: 'Shift 1 (08:00 - 16:30)',
      machine: 'VMC-01',
      hours: '142 Hrs',
      operations: '45',
      rejectedQty: '0',
      efficiency: '94.5',
    },
    { 
      id: '2', 
      operator: 'Anil B.',
      shift: 'Shift 1 (08:00 - 16:30)',
      machine: 'WireCut-02',
      hours: '150 Hrs',
      operations: '82',
      rejectedQty: '2',
      efficiency: '91.2',
    },
    { 
      id: '3', 
      operator: 'Rajesh P.',
      shift: 'Leave',
      machine: '-',
      hours: '80 Hrs',
      operations: '12',
      rejectedQty: '4',
      efficiency: '72.4',
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Operator Productivity</h2>
            <p className="text-zinc-400 text-xs mt-1">Track logged hours, operation completion, and individual efficiency</p>
          </div>
        </div>
      <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
          />
        </div>
      </div>
    </>
  );
}
