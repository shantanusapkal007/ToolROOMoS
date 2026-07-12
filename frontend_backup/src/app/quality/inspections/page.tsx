'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToast } from '@/components/ui/Toast';

export default function InspectionsQueue() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();

  useStandardToolbar({
    featureId: 'inspections-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString();
      const url = projectId ? `/quality/inspections/${id}?project=${projectId}` : `/quality/inspections/${id}`;
      router.push(url);
    },
    onRefresh: () => toast('info', 'Refreshed', 'Inspections list updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting list'),
  });

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Under Inspection' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  status === 'Pass' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Fail' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  status === 'Rework' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Inspection ID', accessorKey: 'inspId', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Category', accessorKey: 'category', size: 150 },
    { header: 'Reference', accessorKey: 'reference', size: 150 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Part / Material', accessorKey: 'part', size: 180 },
    { header: 'Inspector', accessorKey: 'inspector', size: 120 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      inspId: 'INS-2026-081',
      date: '2026-07-08',
      category: 'Incoming (GRN)',
      reference: 'GRN-2026-015',
      project: '-', 
      part: 'D2 Tool Steel (RM-002)', 
      inspector: 'Amit Singh',
      status: 'Pending'
    },
    { 
      id: '2', 
      inspId: 'INS-2026-082',
      date: '2026-07-08',
      category: 'In-process',
      reference: 'JC-2026-001 (Op 20)',
      project: 'PRJ-901', 
      part: 'Base Plate', 
      inspector: 'Unassigned',
      status: 'Under Inspection'
    },
    { 
      id: '3', 
      inspId: 'INS-2026-080',
      date: '2026-07-07',
      category: 'Final',
      reference: 'JC-2026-004',
      project: 'PRJ-882', 
      part: 'Core Pin', 
      inspector: 'Amit Singh',
      status: 'Pass'
    },
  ], []);

  const handleRowClick = (row: any) => {
    const projId = projectId || (row.project !== '-' ? row.project : null);
    if (projId) {
      router.push(`/quality/inspections/${row.id}?project=${projId}`);
    } else {
      router.push(`/quality/inspections/${row.id}`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Master Inspection Queue</h2>
            <p className="text-zinc-400 text-xs mt-1">Incoming, In-process, and Final inspections</p>
          </div>
        </div>
      <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </>
  );
}
