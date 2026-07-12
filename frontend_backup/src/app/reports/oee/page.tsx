'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function OEEReport() {
  
  const OeeProgressBar = ({ getValue }: any) => {
    const val = parseFloat(getValue()) || 0;
    // OEE Industry Standards: < 65% Poor (Red), 65-85% Fair (Amber), > 85% World Class (Green)
    const color = val >= 85 ? 'bg-green-500' : val >= 65 ? 'bg-amber-500' : 'bg-red-500';
    
    // ASCII block simulation for the design requested
    const totalBlocks = 10;
    const filledBlocks = Math.round((val / 100) * totalBlocks);
    
    return (
      <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-400">
        <div className="flex w-[100px]">
          <span className={color.replace('bg-', 'text-')}>{Array(filledBlocks).fill('█').join('')}</span>
          <span>{Array(totalBlocks - filledBlocks).fill('░').join('')}</span>
        </div>
        <span className={`w-8 font-bold font-sans text-xs ${color.replace('bg-', 'text-')}`}>{val}%</span>
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'Machine', accessorKey: 'machine', size: 120 },
    { header: 'Shift', accessorKey: 'shift', size: 100 },
    { header: 'Operator', accessorKey: 'operator', size: 120 },
    { header: 'Availability', accessorKey: 'availability', cell: OeeProgressBar, size: 180 },
    { header: 'Performance', accessorKey: 'performance', cell: OeeProgressBar, size: 180 },
    { header: 'Quality', accessorKey: 'quality', cell: OeeProgressBar, size: 180 },
    { header: 'OEE', accessorKey: 'oee', cell: OeeProgressBar, size: 180 },
    { header: 'Major Downtime Reason', accessorKey: 'downtime', size: 200 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      machine: 'VMC-01',
      shift: 'Shift 1',
      operator: 'Santosh K.',
      availability: 92,
      performance: 88,
      quality: 98,
      oee: 79,
      downtime: 'Tool Change / Setup'
    },
    { 
      id: '2', 
      machine: 'EDM-03',
      shift: 'Shift 1',
      operator: 'Rajesh P.',
      availability: 45,
      performance: 90,
      quality: 100,
      oee: 40,
      downtime: 'Preventive Maintenance'
    },
    { 
      id: '3', 
      machine: 'WireCut-02',
      shift: 'Shift 1',
      operator: 'Anil B.',
      availability: 98,
      performance: 95,
      quality: 99,
      oee: 92,
      downtime: 'None'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Overall Equipment Effectiveness (OEE)</h2>
            <p className="text-zinc-400 text-xs mt-1">Availability × Performance × Quality</p>
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
