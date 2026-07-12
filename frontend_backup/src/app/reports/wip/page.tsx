'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function WipReport() {
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Running' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Delayed' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  status === 'Waiting QC' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-blue-400 bg-blue-400/10 border-blue-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const CurrencyCell = ({ getValue }: any) => {
    return <span className="font-medium text-zinc-300">₹ {getValue().toLocaleString()}</span>;
  };

  const columns = useMemo(() => [
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Customer', accessorKey: 'customer', size: 150 },
    { header: 'Part / Material', accessorKey: 'part', size: 200 },
    { header: 'Current Operation', accessorKey: 'operation', size: 150 },
    { header: 'Machine', accessorKey: 'machine', size: 100 },
    { header: 'Days in WIP', accessorKey: 'daysWip', size: 100 },
    { header: 'Delay', accessorKey: 'delay', size: 90 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
    { header: 'Mat Cost', accessorKey: 'matCost', cell: CurrencyCell, size: 120 },
    { header: 'M/C Cost', accessorKey: 'mcCost', cell: CurrencyCell, size: 120 },
    { header: 'Lab Cost', accessorKey: 'labCost', cell: CurrencyCell, size: 120 },
    { header: 'Total WIP Value', accessorKey: 'totalValue', cell: CurrencyCell, size: 140 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      project: 'PRJ-901',
      customer: 'Tata Motors',
      part: 'Base Plate',
      operation: 'Rough Milling',
      machine: 'VMC-01',
      daysWip: 5,
      delay: '0 Days',
      status: 'Running',
      matCost: 45000,
      mcCost: 12000,
      labCost: 4500,
      totalValue: 61500,
    },
    { 
      id: '2', 
      project: 'PRJ-882',
      customer: 'Mahindra',
      part: 'Core Pin',
      operation: 'Heat Treatment',
      machine: 'Outsource',
      daysWip: 12,
      delay: '4 Days',
      status: 'Delayed',
      matCost: 15000,
      mcCost: 8000,
      labCost: 2000,
      totalValue: 25000,
    },
    { 
      id: '3', 
      project: 'PRJ-901',
      customer: 'Tata Motors',
      part: 'Guide Pillar',
      operation: 'Final Inspection',
      machine: 'CMM',
      daysWip: 8,
      delay: '1 Day',
      status: 'Waiting QC',
      matCost: 25000,
      mcCost: 20000,
      labCost: 5000,
      totalValue: 50000,
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Work In Progress (WIP) Tracking</h2>
            <p className="text-zinc-400 text-xs mt-1">Operational bottlenecks and financial value locked on the shop floor</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Value Locked</span>
              <span className="text-xl font-black text-blue-400">₹ 1,36,500.00</span>
            </div>
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
