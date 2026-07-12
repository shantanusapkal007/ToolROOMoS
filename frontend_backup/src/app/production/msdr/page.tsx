'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { MSDRFormContent } from './[id]/page';
import { useToast } from '@/components/ui/Toast';

export default function MSDRList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();

  const pathname = usePathname();
  const activeMsdrId = searchParams.get('msdrId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('msdrId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('msdrId');
    router.push(`${pathname}?${params.toString()}`);
  };

  useStandardToolbar({
    featureId: 'msdr-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      openDrawer(id, projectId || undefined);
    },
    onRefresh: () => toast('info', 'Refreshed', 'MSDR list updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting MSDR list'),
  });

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Active' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'MSDR No', accessorKey: 'msdrNo', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 120 },
    { header: 'Shift', accessorKey: 'shift', size: 100 },
    { header: 'Department', accessorKey: 'department', size: 150 },
    { header: 'Total Ops', accessorKey: 'totalOps', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '045', 
      msdrNo: 'MSDR-045',
      date: '2026-07-08', 
      shift: 'Shift 1', 
      department: 'Milling',
      totalOps: 12,
      status: 'Completed'
    },
    { 
      id: '046', 
      msdrNo: 'MSDR-046',
      date: '2026-07-09', 
      shift: 'Shift 1', 
      department: 'Milling',
      totalOps: 5,
      status: 'Active'
    },
  ], []);

  const handleRowClick = (row: any) => {
    openDrawer(row.id, projectId || undefined);
  };

  return (
    <>
      <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Machine Shop Daily Reports</h2>
            <p className="text-zinc-400 text-xs mt-1">Daily production execution and machine utilization records</p>
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

      <PremiumDrawer 
        isOpen={!!activeMsdrId} 
        onClose={closeDrawer} 
        title={activeMsdrId && activeMsdrId.includes('new') ? 'Create MSDR' : 'Edit MSDR'}
        subtitle="Manage daily execution metrics"
        width="full"
      >
        {activeMsdrId && <MSDRFormContent msdrId={activeMsdrId} projectId={projectId} />}
      </PremiumDrawer>
    </>
  );
}
