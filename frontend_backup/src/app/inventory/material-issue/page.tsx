'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToast } from '@/components/ui/Toast';

export default function MaterialIssueList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();

  useStandardToolbar({
    featureId: 'material-issue-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString();
      const url = projectId ? `/inventory/material-issue/${id}?project=${projectId}` : `/inventory/material-issue/${id}`;
      router.push(url);
    },
    onRefresh: () => toast('info', 'Refreshed', 'Material Issues updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting list'),
  });
  const columns = useMemo(() => [
    { header: 'Issue No.', accessorKey: 'issueNo', size: 150 },
    { header: 'Date', accessorKey: 'date', size: 120 },
    { header: 'Project Ref', accessorKey: 'projectRef', size: 150 },
    { header: 'Issue Type', accessorKey: 'issueType', size: 120 },
    { header: 'Status', accessorKey: 'status', size: 100 },
  ], []);

  const data = useMemo(() => [
    { id: '1', issueNo: 'MI/2026/045', date: '2026-07-08', projectRef: 'PRJ-901', issueType: 'Production', status: 'ISSUED' },
  ], []);

  const handleRowDoubleClick = (row: any) => {
    const projId = projectId || (row.projectRef !== '-' ? row.projectRef : null);
    if (projId) {
      router.push(`/inventory/material-issue/${row.id}?project=${projId}`);
    } else {
      router.push(`/inventory/material-issue/${row.id}`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Material Issue</h2>
            <p className="text-zinc-400 text-xs mt-1">Double click a row to view/edit</p>
          </div>
        </div>
      <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
            onRowDoubleClick={handleRowDoubleClick} 
          />
        </div>
      </div>
    </>
  );
}
