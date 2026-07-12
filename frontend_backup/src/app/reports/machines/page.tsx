'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function MachineHealthReport() {
  
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Healthy' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Critical' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  status === 'Attention' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Machine', accessorKey: 'machine', size: 120 },
    { header: 'Health Status', accessorKey: 'status', cell: StatusCell, size: 120 },
    { header: 'Running Hrs (MTD)', accessorKey: 'runningHrs', size: 150 },
    { header: 'Downtime (MTD)', accessorKey: 'downtime', size: 150 },
    { header: 'Maintenance', accessorKey: 'maintenance', size: 120 },
    { header: 'Breakdowns (YTD)', accessorKey: 'breakdowns', size: 150 },
    { header: 'Current OEE', accessorKey: 'oee', size: 100 },
    { header: 'Current Job', accessorKey: 'currentJob', size: 200 },
    { header: 'Operator', accessorKey: 'operator', size: 120 },
    { header: 'Maintenance Due', accessorKey: 'maintenanceDue', size: 140 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      machine: 'VMC-01',
      status: 'Healthy',
      runningHrs: '185 Hrs',
      downtime: '12 Hrs',
      maintenance: '2 Hrs',
      breakdowns: '0',
      oee: '79%',
      currentJob: 'PRJ-901 / Base Plate',
      operator: 'Santosh K.',
      maintenanceDue: '2026-07-15'
    },
    { 
      id: '2', 
      machine: 'EDM-03',
      status: 'Attention',
      runningHrs: '45 Hrs',
      downtime: '48 Hrs',
      maintenance: '48 Hrs',
      breakdowns: '1',
      oee: '40%',
      currentJob: '-',
      operator: '-',
      maintenanceDue: 'Overdue'
    },
    { 
      id: '3', 
      machine: 'WireCut-02',
      status: 'Healthy',
      runningHrs: '210 Hrs',
      downtime: '4 Hrs',
      maintenance: '0 Hrs',
      breakdowns: '0',
      oee: '92%',
      currentJob: 'PRJ-882 / Ejector Profile',
      operator: 'Anil B.',
      maintenanceDue: '2026-07-10'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Machine Health & Diagnostics</h2>
            <p className="text-zinc-400 text-xs mt-1">Track uptime, breakdowns, and preventive maintenance schedules</p>
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
