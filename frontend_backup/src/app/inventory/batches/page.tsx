'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function BatchHeatTracking() {
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Active' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Depleted' ? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' :
                  'text-amber-400 bg-amber-400/10 border-amber-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Batch Number', accessorKey: 'batch', size: 120 },
    { header: 'Heat Number', accessorKey: 'heatNo', size: 120 },
    { header: 'Material', accessorKey: 'material', size: 180 },
    { header: 'Supplier', accessorKey: 'supplier', size: 150 },
    { header: 'GRN Ref', accessorKey: 'grn', size: 120 },
    { header: 'Initial Stock', accessorKey: 'initialStock', size: 100 },
    { header: 'Remaining Wt', accessorKey: 'remainingWt', size: 120 },
    { header: 'Location', accessorKey: 'location', size: 120 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      batch: 'B-40501', 
      heatNo: 'HT-9921',
      material: 'Aluminium Block (RM-001)', 
      supplier: 'Metals Corp Ltd',
      grn: 'GRN/2026/012',
      initialStock: '50 Kg',
      remainingWt: '38 Kg',
      location: 'Main / R-14',
      status: 'Active'
    },
    { 
      id: '2', 
      batch: 'B-30211', 
      heatNo: 'HT-7734',
      material: 'D2 Tool Steel (RM-002)', 
      supplier: 'Steel Authority',
      grn: 'GRN/2026/008',
      initialStock: '100 Kg',
      remainingWt: '0 Kg',
      location: 'Main / R-12',
      status: 'Depleted'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Batch & Heat Tracking</h2>
            <p className="text-zinc-400 text-xs mt-1">Full traceability for aerospace/automotive audits</p>
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
