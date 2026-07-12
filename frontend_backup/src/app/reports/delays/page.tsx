'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function DelayReport() {
  
  const TypeCell = ({ getValue }: any) => {
    const type = getValue();
    const colors: Record<string, string> = {
      'Project': 'text-purple-400 bg-purple-400/10',
      'Operation': 'text-blue-400 bg-blue-400/10',
      'Purchase': 'text-amber-400 bg-amber-400/10',
      'Inspection': 'text-orange-400 bg-orange-400/10',
      'Dispatch': 'text-gray-400 bg-gray-400/10',
    };
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-white/5 ${colors[type] || 'text-zinc-400 bg-zinc-400/10'}`}>
        {type}
      </span>
    );
  };

  const DeptCell = ({ getValue }: any) => {
    return <span className="font-bold text-zinc-300">{getValue()}</span>;
  };

  const columns = useMemo(() => [
    { header: 'Delay Type', accessorKey: 'type', cell: TypeCell, size: 120 },
    { header: 'Reference', accessorKey: 'reference', size: 150 },
    { header: 'Description', accessorKey: 'description', size: 250 },
    { header: 'Delay Duration', accessorKey: 'duration', size: 120 },
    { header: 'Reason', accessorKey: 'reason', size: 250 },
    { header: 'Responsible Dept', accessorKey: 'department', cell: DeptCell, size: 150 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      type: 'Purchase',
      reference: 'PO-2026-105',
      description: 'P20 Steel Plate (200x200x25)',
      duration: '4 Days',
      reason: 'Supplier transport strike',
      department: 'Procurement',
    },
    { 
      id: '2', 
      type: 'Operation',
      reference: 'PRJ-901 / Core Pin',
      description: 'Heat Treatment (Outsource)',
      duration: '2 Days',
      reason: 'Vendor capacity issue',
      department: 'Subcontracting',
    },
    { 
      id: '3', 
      type: 'Inspection',
      reference: 'ASM-2026-038',
      description: 'Final Assembly QC',
      duration: '1 Day',
      reason: 'CMM machine under maintenance',
      department: 'Quality',
    },
    { 
      id: '4', 
      type: 'Project',
      reference: 'PRJ-882',
      description: 'Main Die Delivery',
      duration: '5 Days',
      reason: 'Cumulative delays in operations and QC',
      department: 'Production',
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-red-400">Delay & Bottleneck Report</h2>
            <p className="text-zinc-400 text-xs mt-1">Unified view of all delays across projects, purchasing, manufacturing, and quality</p>
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
