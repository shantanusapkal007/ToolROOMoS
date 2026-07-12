'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function FinishedGoodsInventory() {
  
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Dispatched' ? 'text-gray-400 bg-gray-400/10 border-gray-400/20' :
                  status === 'In Store' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' :
                  status === 'Pass' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Part / Component', accessorKey: 'part', size: 180 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Assembly', accessorKey: 'assembly', size: 120 },
    { header: 'Customer', accessorKey: 'customer', size: 120 },
    { header: 'Qty', accessorKey: 'quantity', size: 80 },
    { header: 'Weight', accessorKey: 'weight', size: 80 },
    { header: 'Location', accessorKey: 'location', size: 100 },
    { header: 'QC Status', accessorKey: 'qcStatus', cell: StatusCell, size: 100 },
    { header: 'Dispatch', accessorKey: 'dispatchStatus', cell: StatusCell, size: 120 },
    { header: 'Remarks', accessorKey: 'remarks', size: 150 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      part: 'Core Pin (CP-04)',
      project: 'PRJ-901', 
      assembly: '-',
      customer: 'Tata Motors',
      quantity: 50,
      weight: '12.5 kg',
      location: 'Rack A-12',
      qcStatus: 'Pass',
      dispatchStatus: 'In Store',
      remarks: 'Waiting for packing'
    },
    { 
      id: '2', 
      part: 'Main Die Assembly',
      project: 'PRJ-882', 
      assembly: 'ASM-2026-038',
      customer: 'Mahindra',
      quantity: 1,
      weight: '450 kg',
      location: 'Dispatch Bay',
      qcStatus: 'Pass',
      dispatchStatus: 'Dispatched',
      remarks: 'Challan #CH-042'
    }
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-purple-400">Finished Goods Inventory</h2>
            <p className="text-zinc-400 text-xs mt-1">QC-passed parts and assemblies waiting for dispatch</p>
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
