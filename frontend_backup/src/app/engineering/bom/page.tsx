'use client';

import { useMemo, Suspense, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { BOMFormContent } from './[id]/page';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useGlobalBOMs, useDeleteBOM, useDuplicateBOM } from '@/hooks/useEngineering';
import { formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/Toast';

import { ExcelEngine } from '@/lib/excel-engine';
import { useToolbarStore } from '@/store/useToolbarStore';

function BOMListContent({ overrideProjectId }: { overrideProjectId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = overrideProjectId || searchParams.get('project') || undefined;
  
  const { data: bomsResponse, isLoading, refetch } = useGlobalBOMs(projectId);
  const { toast } = useToast();
  const [selection, setSelection] = useState<any[]>([]);
  
  const columns = useMemo(() => [
    { header: 'BOM No.', accessorKey: 'documentNumber', size: 150 },
    { header: 'Project Ref', accessorKey: 'project.projectNumber', size: 150 },
    { header: 'Status', accessorKey: 'status', size: 100 },
    { header: 'Approval', accessorKey: 'approvalStatus', size: 100 },
    { header: 'Items', accessorKey: '_count.items', size: 100 },
    { header: 'Revision', accessorKey: 'revision', size: 80 },
    { header: 'Last Updated', accessorKey: 'updatedAt', size: 150, cell: (info: any) => formatDate(info.getValue()) },
  ], []);

  const data = useMemo(() => {
    if (!bomsResponse) return [];
    return Array.isArray(bomsResponse) ? bomsResponse : (bomsResponse.data || []);
  }, [bomsResponse]);

  const pathname = usePathname();
  const activeBomId = searchParams.get('bomId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('bomId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('bomId');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRowClick = (row: any) => {
    openDrawer(row.id, row.projectId);
  };

  const deleteBom = useDeleteBOM(projectId || '');
  const duplicateBom = useDuplicateBOM(projectId || '');

  useStandardToolbar({
    featureId: 'bom-list',
    selection,
    onNew: () => openDrawer('new'),
    onRefresh: () => refetch(),
    onPrint: () => {
      toast('info', 'Printing...', 'Preparing document for print layout...');
      setTimeout(() => window.print(), 500);
    },
    onExport: () => {
      toast('info', 'Exporting...', 'Downloading BOM list as CSV...');
      if (selection.length > 0) {
        ExcelEngine.exportSelection(data, selection.map(s => s.id), 'bom_export.csv');
      } else {
        ExcelEngine.exportToCSV(data, 'boms_all.csv');
      }
    },
    onImport: () => {
      useToolbarStore.getState().setImportOpen(true);
    },
    onHistory: () => {
      if (selection.length > 0) {
        useToolbarStore.getState().setHistoryOpen(true);
      } else {
        toast('warning', 'No selection', 'Select a BOM to view its history');
      }
    },
    onAttachments: () => {
      if (selection.length > 0) {
        useToolbarStore.getState().setAttachmentsOpen(true);
      } else {
        toast('warning', 'No selection', 'Select a BOM to view attachments');
      }
    },
    onDuplicate: () => {
      if (selection.length > 0) {
        // Just duplicate the first one for now as bulk is not fully orchestrated
        duplicateBom.mutate(selection[0].id);
      }
    },
    onDelete: () => {
      if (selection.length > 0) {
        deleteBom.mutate(selection[0].id);
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
        isOpen={!!activeBomId} 
        onClose={closeDrawer} 
        title={activeBomId === 'new' ? 'Create BOM' : 'Edit BOM'}
        subtitle="Manage bill of materials details"
        width="full"
      >
        {activeBomId && <BOMFormContent bomId={activeBomId} />}
      </PremiumDrawer>
    </div>
  );
}

export default function BOMList({ projectId }: { projectId?: string }) {
  return (
    <Suspense fallback={<div>Loading BOMs...</div>}>
      <BOMListContent overrideProjectId={projectId} />
    </Suspense>
  );
}
