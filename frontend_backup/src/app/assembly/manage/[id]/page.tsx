'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, CheckCircle, PauseCircle } from 'lucide-react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';

export default function AssemblyDetail({ params }: { params: Promise<{ id: string }> }) {
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
  const getNewRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    partNo: '',
    partName: '',
    quantity: '1',
    installedQty: '0',
    missingQty: '1',
    inspectionStatus: 'Pending',
    remarks: '',
  });

  const [data, setData] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      partNo: 'BP-01',
      partName: 'Base Plate',
      quantity: '1',
      installedQty: '1',
      missingQty: '0',
      inspectionStatus: 'Pass',
      remarks: '',
    },
    {
      id: crypto.randomUUID(),
      partNo: 'GP-04',
      partName: 'Guide Pillar',
      quantity: '4',
      installedQty: '2',
      missingQty: '2',
      inspectionStatus: 'Pass',
      remarks: 'Waiting on surface grinding for remaining 2',
    },
    {
      id: crypto.randomUUID(),
      partNo: 'EJ-12',
      partName: 'Ejector Pin D6',
      quantity: '12',
      installedQty: '0',
      missingQty: '12',
      inspectionStatus: 'Fail',
      remarks: 'Rejected at QC, re-ordering',
    }
  ]);

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/assembly`
    : '/assembly/manage';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Assemblies"}
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
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Assembly</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Assembly Details</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/assembly')}>Assembly</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/assembly/manage')}>Manage</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const formulas = useMemo(() => ({
    missingQty: (row: any) => {
      const q = parseFloat(row.quantity) || 0;
      const i = parseFloat(row.installedQty) || 0;
      return Math.max(0, q - i).toString();
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'quantity', label: 'Total Parts', type: 'sum' as const },
    { accessorKey: 'installedQty', label: 'Total Installed', type: 'sum' as const },
    { accessorKey: 'missingQty', label: 'Total Missing', type: 'sum' as const },
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
          className="w-full h-full bg-black/60 border border-blue-500/50 rounded px-1.5 py-0.5 text-sm text-zinc-100 focus:outline-none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') onBlur(); }}
        />
      );
    }
    return <div className="w-full h-full min-h-[24px] truncate" title={value}>{value}</div>;
  };

  const MissingQtyCell = ({ getValue }: any) => {
    const val = parseFloat(getValue()) || 0;
    return (
      <div className={`w-full h-full min-h-[24px] font-bold ${val > 0 ? 'text-red-400' : 'text-green-400'}`}>
        {val}
      </div>
    );
  };

  const StatusCell = ({ getValue }: any) => {
    const val = getValue();
    const colors: Record<string, string> = {
      'Pending': 'text-zinc-400 bg-zinc-400/10',
      'Pass': 'text-green-400 bg-green-400/10',
      'Fail': 'text-red-400 bg-red-400/10',
      'Rework': 'text-amber-400 bg-amber-400/10',
    };
    const cls = colors[val] || colors['Pending'];
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/5 ${cls}`}>
        {val}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Part No', accessorKey: 'partNo', cell: EditableCell, size: 120 },
    { header: 'Part Name', accessorKey: 'partName', cell: EditableCell, size: 200 },
    { header: 'Req Qty', accessorKey: 'quantity', cell: EditableCell, size: 90 },
    { header: 'Installed Qty', accessorKey: 'installedQty', cell: EditableCell, size: 100 },
    { header: 'Missing Qty', accessorKey: 'missingQty', cell: MissingQtyCell, size: 100 },
    { header: 'QC Status', accessorKey: 'inspectionStatus', cell: StatusCell, size: 120 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 250 },
  ], []);

  const documentActions: DocumentAction[] = [
    {
      id: 'complete',
      label: 'Complete Assembly',
      icon: CheckCircle,
      variant: 'success',
      visible: true,
      onClick: () => console.log('Complete')
    },
    {
      id: 'hold',
      label: 'Hold',
      icon: PauseCircle,
      variant: 'danger',
      visible: true,
      onClick: () => console.log('Hold')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#060608]">
      <div className="shrink-0 p-4 border-b border-white/5 flex items-start gap-3 bg-white/[0.01]">
        <button onClick={() => router.push(backUrl)} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/[0.02] hover:bg-white/[0.06] rounded-md transition-all flex items-center justify-center border border-white/[0.04]" title={projectId ? "Back to Project" : "Back to Assemblies"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Assembly: {resolvedParams.id}</h2>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
            <span className="text-blue-400">IN PROGRESS</span>
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
          <button className="pb-2 text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-colors">Component List (Flat)</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Related Documents</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Timeline</button>
        </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2 gap-3">
        {/* Assembly Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 shrink-0">
          <div className="col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Project / Customer</div>
            <div className="text-sm font-bold text-zinc-100">PRJ-901 / Tata Motors</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Assembly Name</div>
            <div className="text-sm font-medium text-blue-400">Main Die Assembly</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Target Date</div>
            <div className="text-sm font-medium text-zinc-100">2026-07-20</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Status</div>
            <div className="text-sm font-bold text-red-400">Part Shortage</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Completion %</div>
            <div className="text-sm font-bold text-green-400">
              {Math.round((data.reduce((acc, row) => acc + (parseFloat(row.installedQty) || 0), 0) / 
               data.reduce((acc, row) => acc + (parseFloat(row.quantity) || 0), 0)) * 100)}%
            </div>
          </div>
        </div>
      <div className="flex-1 min-h-0">
          <EditableDataGrid 
            columns={columns} 
            data={data} 
            onDataChange={setData}
            getNewRow={getNewRow}
            formulas={formulas}
            summary={summary}
          />
        </div>
      </div>
    </div>
  );
}
