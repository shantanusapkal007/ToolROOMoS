'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { JobCardFormContent } from './[id]/page';
import { useToast } from '@/components/ui/Toast';

export default function JobCardsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();

  const pathname = usePathname();
  const activeJobCardId = searchParams.get('jobCardId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('jobCardId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('jobCardId');
    router.push(`${pathname}?${params.toString()}`);
  };

  useStandardToolbar({
    featureId: 'job-cards-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString();
      openDrawer(id, projectId || undefined);
    },
    onRefresh: () => toast('info', 'Refreshed', 'Job Cards updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting Job Cards list'),
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
    { header: 'Job Card No', accessorKey: 'jobCardNo', size: 120 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Part No', accessorKey: 'part', size: 150 },
    { header: 'Material', accessorKey: 'material', size: 150 },
    { header: 'Target Date', accessorKey: 'targetDate', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      jobCardNo: 'JC/2026/001',
      project: 'PRJ-901', 
      part: 'Base Plate', 
      material: 'Aluminium Grade 7075',
      targetDate: '2026-07-15',
      status: 'Active'
    },
    { 
      id: '2', 
      jobCardNo: 'JC/2026/002',
      project: 'PRJ-882', 
      part: 'Core Pin', 
      material: 'D2 Tool Steel',
      targetDate: '2026-07-10',
      status: 'Completed'
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
            <h2 className="text-lg font-semibold text-zinc-100">Job Cards</h2>
            <p className="text-zinc-400 text-xs mt-1">Printable routing documents for the shop floor</p>
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
        isOpen={!!activeJobCardId} 
        onClose={closeDrawer} 
        title={activeJobCardId && activeJobCardId.startsWith('new') ? 'Create Job Card' : 'Job Card Execution'}
        subtitle="Route operations and track production"
        width="full"
      >
        {activeJobCardId && <JobCardFormContent jobCardId={activeJobCardId} projectId={projectId} />}
      </PremiumDrawer>
    </>
  );
}
