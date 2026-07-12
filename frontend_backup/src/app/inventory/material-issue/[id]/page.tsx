'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { InventoryLookupPanel } from '@/components/panels/InventoryLookupPanel';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Send, CheckCircle } from 'lucide-react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';

export default function MaterialIssueDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();

  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [activeTab, setActiveTab] = useState('items');
  const [activeMaterial, setActiveMaterial] = useState<{name: string, grade?: string} | null>(null);

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/stores`
    : '/inventory/material-issue';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Issue Slips"}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center text-[12px] font-medium text-zinc-500">
        {projectId ? (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/projects')}>Projects</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(`/projects/${projectId.replace('PRJ-', '')}/overview`)}>{projectId}</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Inventory</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Material Issue Detail</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/inventory')}>Inventory</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/inventory/material-issue')}>Material Issues</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const getNewIssueRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    project: prevRow?.project || '',
    department: prevRow?.department || 'Production',
    machine: prevRow?.machine || '',
    operation: prevRow?.operation || '',
    material: '',
    batch: '',
    heatNo: '',
    length: '',
    width: '',
    thickness: '',
    weight: '0',
    availableQty: '10',
    issuedQty: '1',
    remainingQty: '9',
    offcutQty: '0',
    issueType: prevRow?.issueType || 'Production',
    remarks: '',
  });

  const [issueItems, setIssueItems] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      project: 'PRJ-901',
      department: 'Production',
      machine: 'VMC-01',
      operation: 'Rough Milling',
      material: 'Aluminium Grade 7075 (RM-001)',
      batch: 'B-40501',
      heatNo: 'HT-9921',
      length: '260',
      width: '190',
      thickness: '50',
      weight: '6.9', // Kg
      availableQty: '10',
      issuedQty: '1',
      remainingQty: '9',
      offcutQty: '0',
      issueType: 'Production',
      remarks: 'First piece issue',
    }
  ]);

  const summary = useMemo(() => [
    { accessorKey: 'issuedQty', label: 'Total Issued Qty', type: 'sum' as const },
    { accessorKey: 'weight', label: 'Total Issued Weight', type: 'sum' as const, format: (v: number) => `${v.toFixed(2)} Kg` },
  ], []);

  const EditableCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    React.useEffect(() => { setValue(initialValue); }, [initialValue]);
    const onBlur = () => { table.options.meta?.updateData(row.index, column.id, value); };
    if (isActive) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-black/60 border border-blue-500/50 rounded px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none focus:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') onBlur(); }}
        />
      );
    }
    return <div className="w-full h-full min-h-[24px] truncate" title={value}>{value}</div>;
  };

  const columns = useMemo(() => [
    { header: 'Project', accessorKey: 'project', cell: EditableCell, size: 100 },
    { header: 'Dept', accessorKey: 'department', cell: EditableCell, size: 100 },
    { header: 'Machine', accessorKey: 'machine', cell: EditableCell, size: 100 },
    { header: 'Operation', accessorKey: 'operation', cell: EditableCell, size: 120 },
    { header: 'Material', accessorKey: 'material', cell: EditableCell, size: 180 },
    { header: 'Batch', accessorKey: 'batch', cell: EditableCell, size: 100 },
    { header: 'Heat No', accessorKey: 'heatNo', cell: EditableCell, size: 100 },
    { header: 'L', accessorKey: 'length', cell: EditableCell, size: 60 },
    { header: 'W', accessorKey: 'width', cell: EditableCell, size: 60 },
    { header: 'T', accessorKey: 'thickness', cell: EditableCell, size: 60 },
    { header: 'Wt (kg)', accessorKey: 'weight', cell: EditableCell, size: 80 },
    { header: 'Avail Qty', accessorKey: 'availableQty', cell: EditableCell, size: 80 },
    { header: 'Iss Qty', accessorKey: 'issuedQty', cell: EditableCell, size: 80 },
    { header: 'Rem Qty', accessorKey: 'remainingQty', cell: EditableCell, size: 80 },
    { header: 'Off-cut', accessorKey: 'offcutQty', cell: EditableCell, size: 80 },
    { header: 'Type', accessorKey: 'issueType', cell: EditableCell, size: 100 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 120 },
  ], []);

  const documentActions: DocumentAction[] = [
    {
      id: 'issue',
      label: 'Issue Material',
      icon: Send,
      variant: 'primary',
      visible: true,
      onClick: () => console.log('Issue')
    },
    {
      id: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      variant: 'success',
      visible: true,
      onClick: () => console.log('Approve')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#060608]">
      <div className="shrink-0 p-4 border-b border-white/5 flex items-start gap-3 bg-white/[0.01]">
        <button onClick={() => router.push(backUrl)} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/[0.02] hover:bg-white/[0.06] rounded-md transition-all flex items-center justify-center border border-white/[0.04]" title={projectId ? "Back to Project" : "Back to Issue Slips"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Material Issue: {resolvedParams.id}</h2>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
            <span className="text-blue-400">DRAFT</span>
            <DocumentActions actions={documentActions} />
            {projectId && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Project: {projectId}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-4 pb-px mt-4 hide-on-print">
          <button 
            onClick={() => setActiveTab('items')}
            className={`pb-2 transition-colors ${activeTab === 'items' ? 'text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Issue Items
          </button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Related Documents</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Attachments (Issue Slip)</button>
        </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2">
        {activeTab === 'items' && (
          <EditableDataGrid 
            columns={columns} 
            data={issueItems} 
            onDataChange={setIssueItems}
            getNewRow={getNewIssueRow}
            summary={summary}
            onRowFocus={(row: any) => {
              if (row.material) {
                setActiveMaterial({ name: row.material });
              } else {
                setActiveMaterial(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
