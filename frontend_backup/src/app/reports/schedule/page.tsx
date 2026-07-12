'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function MasterSchedule() {
  
  const UtilizationCell = ({ getValue }: any) => {
    const val = parseFloat(getValue());
    const color = val > 90 ? 'bg-red-500' : val > 75 ? 'bg-green-500' : 'bg-amber-500';
    return (
      <div className="flex items-center gap-2">
        <span className="w-8 text-right font-medium">{val}%</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${val}%` }} />
        </div>
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'Machine', accessorKey: 'machine', size: 120 },
    { header: 'Operator', accessorKey: 'operator', size: 120 },
    { header: 'Current Job', accessorKey: 'currentJob', size: 200 },
    { header: 'Priority', accessorKey: 'priority', size: 100 },
    { header: 'Expected Finish', accessorKey: 'expectedFinish', size: 140 },
    { header: 'Next Job', accessorKey: 'nextJob', size: 150 },
    { header: 'Queue Depth', accessorKey: 'queueLength', size: 120 },
    { header: 'Avail Hrs', accessorKey: 'availHrs', size: 100 },
    { header: 'Booked Hrs', accessorKey: 'bookedHrs', size: 100 },
    { header: 'Utilization', accessorKey: 'utilization', cell: UtilizationCell, size: 150 },
    { header: 'Maintenance Due', accessorKey: 'maintenance', size: 150 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      machine: 'VMC-01',
      operator: 'Santosh K.',
      currentJob: 'PRJ-901 / Base Plate (Roughing)',
      priority: 'High',
      expectedFinish: 'Today, 14:30',
      nextJob: 'PRJ-882 / Core Block',
      queueLength: '4 Jobs',
      availHrs: '120',
      bookedHrs: '115',
      utilization: '95',
      maintenance: '2026-07-15'
    },
    { 
      id: '2', 
      machine: 'EDM-03',
      operator: 'Rajesh P.',
      currentJob: 'PRJ-901 / Cavity Sparking',
      priority: 'Normal',
      expectedFinish: 'Tomorrow, 10:00',
      nextJob: '-',
      queueLength: '0 Jobs',
      availHrs: '120',
      bookedHrs: '45',
      utilization: '37.5',
      maintenance: '2026-08-01'
    },
    { 
      id: '3', 
      machine: 'WireCut-02',
      operator: 'Anil B.',
      currentJob: 'PRJ-882 / Ejector Profile',
      priority: 'Urgent',
      expectedFinish: 'Today, 22:00',
      nextJob: 'PRJ-901 / Insert Profile',
      queueLength: '2 Jobs',
      availHrs: '120',
      bookedHrs: '98',
      utilization: '81.6',
      maintenance: '2026-07-10'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Factory Master Schedule</h2>
            <p className="text-zinc-400 text-xs mt-1">Machine loading, queue depth, and utilization mapping</p>
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
