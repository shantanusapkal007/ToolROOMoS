'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function NonConformanceReports() {

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Open' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  status === 'Closed' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  'text-amber-400 bg-amber-400/10 border-amber-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };
  
  const DispositionCell = ({ getValue }: any) => {
    const status = getValue();
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold text-zinc-300 bg-white/5 rounded border border-white/10 uppercase">
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'NCR No', accessorKey: 'ncrNo', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Source', accessorKey: 'source', size: 120 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Part / Material', accessorKey: 'part', size: 150 },
    { header: 'Machine', accessorKey: 'machine', size: 100 },
    { header: 'Description', accessorKey: 'description', size: 200 },
    { header: 'Disposition', accessorKey: 'disposition', cell: DispositionCell, size: 120 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      ncrNo: 'NCR-2026-042',
      date: '2026-07-07',
      source: 'In-process QC',
      project: 'PRJ-901', 
      part: 'Core Pin', 
      machine: 'VMC-01',
      description: 'Pocket oversized by 0.05mm',
      disposition: 'Rework',
      status: 'Open'
    },
    { 
      id: '2', 
      ncrNo: 'NCR-2026-041',
      date: '2026-07-05',
      source: 'Incoming QC',
      project: '-', 
      part: 'Aluminium 7075 Block', 
      machine: '-',
      description: 'Surface dents on delivery',
      disposition: 'Use As Is',
      status: 'Closed'
    },
    { 
      id: '3', 
      ncrNo: 'NCR-2026-040',
      date: '2026-07-04',
      source: 'Final QC',
      project: 'PRJ-882', 
      part: 'Base Plate', 
      machine: 'SG-02',
      description: 'Hardness failed (55 HRC)',
      disposition: 'Scrap',
      status: 'Closed'
    }
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-red-400">Non-Conformance Reports (NCR)</h2>
            <p className="text-zinc-400 text-xs mt-1">Independent tracking of rejects, root causes, and corrective actions</p>
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
