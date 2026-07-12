'use client';

import { useMemo, Suspense, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { RoutingFormContent } from './[id]/page';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useGlobalRoutings, useDeleteRouting, useDuplicateRouting } from '@/hooks/useEngineering';
import { formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/Toast';
import { ExcelEngine } from '@/lib/excel-engine';
import { useToolbarStore } from '@/store/useToolbarStore';

function RoutingListContent({ overrideProjectId }: { overrideProjectId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = overrideProjectId || searchParams.get('project') || undefined;
  
  const { data: routingResponse, isLoading, refetch } = useGlobalRoutings(projectId);
  const { toast } = useToast();
  const [selection, setSelection] = useState<any[]>([]);
  
  const columns = useMemo(() => [
    { header: 'Routing No.', accessorKey: 'routingNumber', size: 150 },
    { header: 'Project Ref', accessorKey: 'project.projectNumber', size: 150 },
    { header: 'Status', accessorKey: 'status', size: 100 },
    { header: 'Approval', accessorKey: 'approvalStatus', size: 100 },
    { header: 'Revision', accessorKey: 'revision', size: 80 },
    { header: 'Last Updated', accessorKey: 'updatedAt', size: 150, cell: (info: any) => formatDate(info.getValue()) },
  ], []);

  const data = useMemo(() => {
    if (!routingResponse?.data) return [];
    return routingResponse.data;
  }, [routingResponse]);

  const pathname = usePathname();
  const activeRoutingId = searchParams.get('routingId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('routingId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('routingId');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRowClick = (row: any) => {
    openDrawer(row.id, projectId || undefined);
  };

  const deleteRouting = useDeleteRouting(projectId || '');
  const duplicateRouting = useDuplicateRouting(projectId || '');

  useStandardToolbar({
    featureId: 'routing-list',
    selection,
    onNew: () => openDrawer('new'),
    onRefresh: () => refetch(),
    onPrint: () => {
      toast('info', 'Printing...', 'Preparing document for print layout...');
      setTimeout(() => window.print(), 500);
    },
    onExport: () => {
      toast('info', 'Exporting...', 'Downloading Routing list as CSV...');
      if (selection.length > 0) {
        ExcelEngine.exportSelection(data, selection.map(s => s.id), 'routing_export.csv');
      } else {
        ExcelEngine.exportToCSV(data, 'routings_all.csv');
      }
    },
    onImport: () => {
      useToolbarStore.getState().setImportOpen(true);
    },
    onHistory: () => {
      if (selection.length > 0) {
        useToolbarStore.getState().setHistoryOpen(true);
      } else {
        toast('warning', 'No selection', 'Select a Routing to view its history');
      }
    },
    onAttachments: () => {
      if (selection.length > 0) {
        useToolbarStore.getState().setAttachmentsOpen(true);
      } else {
        toast('warning', 'No selection', 'Select a Routing to view attachments');
      }
    },
    onDuplicate: () => {
      if (selection.length > 0) {
        duplicateRouting.mutate(selection[0].id);
      }
    },
    onDelete: () => {
      if (selection.length > 0) {
        deleteRouting.mutate(selection[0].id);
      }
    }
  });

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 min-h-0">
        <UniversalTable 
          columns={columns} 
          data={data} 
          isLoading={isLoading}
          onRowClick={handleRowClick} 
          onSelectionChange={setSelection}
        />
      </div>

      <PremiumDrawer 
        isOpen={!!activeRoutingId} 
        onClose={closeDrawer} 
        title={activeRoutingId === 'new' ? 'Create Routing' : 'Edit Routing'}
        subtitle="Manage manufacturing operations sequence"
        width="full"
      >
        {activeRoutingId && <RoutingFormContent routingId={activeRoutingId} />}
      </PremiumDrawer>
    </div>
  );
}

export default function RoutingList({ projectId }: { projectId?: string }) {
  return (
    <Suspense fallback={<div>Loading Routings...</div>}>
      <RoutingListContent overrideProjectId={projectId} />
    </Suspense>
  );
}
