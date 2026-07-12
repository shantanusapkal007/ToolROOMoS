'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function OffcutManagement() {
  const ActionCell = ({ getValue }: any) => {
    return (
      <button className="px-2 py-1 bg-white/5 hover:bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold rounded border border-white/10 hover:border-blue-500/30 transition-colors">
        Direct Issue
      </button>
    );
  };
  
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Available' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Reserved' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Material', accessorKey: 'material', size: 180 },
    { header: 'Grade', accessorKey: 'grade', size: 80 },
    { header: 'Original Size', accessorKey: 'originalSize', size: 100 },
    { header: 'Remaining Size', accessorKey: 'remainingSize', size: 120 },
    { header: 'Weight', accessorKey: 'weight', size: 80 },
    { header: 'Heat Number', accessorKey: 'heatNo', size: 100 },
    { header: 'Batch', accessorKey: 'batch', size: 100 },
    { header: 'Location', accessorKey: 'location', size: 100 },
    { header: 'Est Value', accessorKey: 'value', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 90 },
    { header: 'Action', accessorKey: 'action', cell: ActionCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      material: 'Aluminium Block', 
      grade: '7075', 
      originalSize: '260x190x50',
      remainingSize: '100x190x50', 
      weight: '2.6 Kg', 
      heatNo: 'HT-9921',
      batch: 'B-40501',
      location: 'Main / R-14',
      value: '₹ 3,900',
      status: 'Available'
    },
    { 
      id: '2', 
      material: 'D2 Tool Steel', 
      grade: 'D2', 
      originalSize: 'Round ø50 L200',
      remainingSize: 'Round ø50 L80', 
      weight: '1.2 Kg', 
      heatNo: 'HT-8812',
      batch: 'B-40602',
      location: 'Main / R-12',
      value: '₹ 1,440',
      status: 'Reserved'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Off-cut Management</h2>
            <p className="text-zinc-400 text-xs mt-1">Track and reuse scrap materials</p>
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
