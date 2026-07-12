'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { GRNFormContent } from './[id]/page';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToast } from '@/components/ui/Toast';

export default function GRNList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();

  const pathname = usePathname();
  const activeGrnId = searchParams.get('grnId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('grnId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('grnId');
    router.push(`${pathname}?${params.toString()}`);
  };

  useStandardToolbar({
    featureId: 'grn-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString();
      openDrawer(id, projectId || undefined);
    },
    onRefresh: () => toast('info', 'Refreshed', 'GRN list updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting list'),
  });
  
  const columns = useMemo(() => [
    { header: 'GRN No.', accessorKey: 'grnNo', size: 150 },
    { header: 'Date', accessorKey: 'date', size: 120 },
    { header: 'Supplier', accessorKey: 'supplier', size: 200 },
    { header: 'PO Ref', accessorKey: 'poRef', size: 150 },
    { header: 'Status', accessorKey: 'status', size: 100 },
  ], []);

  const data = useMemo(() => [
    { id: '1', grnNo: 'GRN/2026/012', date: '2026-07-08', supplier: 'Global Steel Suppliers Corp', poRef: 'PO/2026/0041', status: 'RECEIVED' },
  ], []);

  const handleRowClick = (row: any) => {
    openDrawer(row.id, projectId || undefined);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Goods Receipt Notes</h2>
            <p className="text-zinc-400 text-xs mt-1">Double click a row to view/edit</p>
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
        isOpen={!!activeGrnId} 
        onClose={closeDrawer} 
        title={activeGrnId && !activeGrnId.startsWith('GRN') ? 'Create GRN' : 'Edit GRN'}
        subtitle="Manage goods receipt details"
        width="full"
      >
        {activeGrnId && <GRNFormContent grnId={activeGrnId} projectId={projectId} />}
      </PremiumDrawer>
    </>
  );
}
