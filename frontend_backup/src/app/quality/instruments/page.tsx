'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function InstrumentManagement() {
  
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Active' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Due' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  'text-amber-400 bg-amber-400/10 border-amber-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Instrument ID', accessorKey: 'instId', size: 120 },
    { header: 'Type', accessorKey: 'type', size: 120 },
    { header: 'Name', accessorKey: 'name', size: 150 },
    { header: 'Range', accessorKey: 'range', size: 100 },
    { header: 'Least Count', accessorKey: 'leastCount', size: 100 },
    { header: 'Make', accessorKey: 'make', size: 100 },
    { header: 'Serial No', accessorKey: 'serial', size: 120 },
    { header: 'Last Calibrated', accessorKey: 'lastCal', size: 120 },
    { header: 'Next Due', accessorKey: 'nextDue', size: 120 },
    { header: 'Agency', accessorKey: 'agency', size: 150 },
    { header: 'Department', accessorKey: 'dept', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      instId: 'CAL-001',
      type: 'Vernier Caliper',
      name: 'Digital Caliper 300mm',
      range: '0 - 300 mm',
      leastCount: '0.01 mm',
      make: 'Mitutoyo',
      serial: 'MT-9901',
      lastCal: '2026-01-15',
      nextDue: '2027-01-14',
      agency: 'NABL Master Labs',
      dept: 'Quality Control',
      status: 'Active'
    },
    { 
      id: '2', 
      instId: 'MIC-014',
      type: 'Micrometer',
      name: 'Outside Micrometer',
      range: '0 - 25 mm',
      leastCount: '0.001 mm',
      make: 'Mitutoyo',
      serial: 'MT-4412',
      lastCal: '2025-07-01',
      nextDue: '2026-06-30',
      agency: 'NABL Master Labs',
      dept: 'Production',
      status: 'Due'
    }
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Instrument Calibration Management</h2>
            <p className="text-zinc-400 text-xs mt-1">Track calibration schedules for all measuring instruments</p>
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
