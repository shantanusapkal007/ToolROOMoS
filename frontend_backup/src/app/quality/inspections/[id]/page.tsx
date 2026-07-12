'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { InventoryLookupPanel } from '@/components/panels/InventoryLookupPanel';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, History, Printer, FileCode2 } from 'lucide-react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useToast } from '@/components/ui/Toast';

export default function QualityInspectionDetail({ params }: { params: Promise<{ id: string }> }) {
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
  const [activeTab, setActiveTab] = useState('parameters');
  const { toast } = useToast();

  const status: string = 'Pending'; // Mock status

  const documentActions: DocumentAction[] = [
    {
      id: 'pass',
      label: 'Pass',
      icon: CheckCircle,
      variant: 'success',
      visible: status === 'Pending',
      onClick: () => toast('success', 'Inspection Passed', 'Items moved to approved stock')
    },
    {
      id: 'fail',
      label: 'Fail',
      icon: XCircle,
      variant: 'danger',
      visible: status === 'Pending',
      onClick: () => toast('error', 'Inspection Failed', 'Items moved to quarantine')
    },
    {
      id: 'rework',
      label: 'Rework',
      icon: AlertTriangle,
      variant: 'secondary',
      visible: status === 'Pending',
      onClick: () => toast('info', 'Rework Required', 'Items sent for rework')
    },
    {
      id: 'revision',
      label: 'Revision',
      icon: FileCode2,
      visible: status === 'Completed',
      onClick: () => toast('info', 'Revision', 'Not implemented')
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      visible: status === 'Completed',
      onClick: () => toast('info', 'History', 'Not implemented')
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      visible: status === 'Completed',
      onClick: () => window.print()
    }
  ];

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/quality`
    : '/quality/inspections';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Inspections"}
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
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Quality</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Inspection Detail</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/quality')}>Quality Control</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/quality/inspections')}>Inspections</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const getNewRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    characteristic: '',
    nominal: '',
    lowerLimit: '',
    upperLimit: '',
    actual: '',
    unit: 'mm',
    instrument: '',
    result: 'Pending',
    remarks: '',
  });

  const [data, setData] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      characteristic: 'Overall Length',
      nominal: '250.00',
      lowerLimit: '-0.05',
      upperLimit: '+0.05',
      actual: '250.02',
      unit: 'mm',
      instrument: 'Vernier Caliper',
      result: 'Pass',
      remarks: '',
    },
    {
      id: crypto.randomUUID(),
      characteristic: 'Pocket Depth',
      nominal: '25.00',
      lowerLimit: '-0.02',
      upperLimit: '+0.02',
      actual: '25.05',
      unit: 'mm',
      instrument: 'Depth Micrometer',
      result: 'Fail',
      remarks: 'Oversize',
    },
    {
      id: crypto.randomUUID(),
      characteristic: 'Surface Hardness',
      nominal: '58',
      lowerLimit: '-2',
      upperLimit: '+2',
      actual: '',
      unit: 'HRC',
      instrument: 'Hardness Tester',
      result: 'Pending',
      remarks: '',
    }
  ]);

  const formulas = useMemo(() => ({
    result: (row: any) => {
      if (!row.actual || row.actual.trim() === '') return 'Pending';
      const act = parseFloat(row.actual);
      const nom = parseFloat(row.nominal);
      const ll = parseFloat(row.lowerLimit) || 0;
      const ul = parseFloat(row.upperLimit) || 0;
      
      if (isNaN(act) || isNaN(nom)) return 'Pending';

      const min = nom + ll;
      const max = nom + ul;

      if (act >= min && act <= max) return 'Pass';
      return 'Fail';
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'id', label: 'Total Parameters', type: 'count' as const },
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

  const ActualCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    React.useEffect(() => { setValue(initialValue); }, [initialValue]);
    const onBlur = () => { table.options.meta?.updateData(row.index, column.id, value); };

    // Determine color based on result formula
    const res = formulas.result({ ...row.original, actual: initialValue });
    let colorClass = '';
    if (res === 'Fail') colorClass = 'text-red-400 font-bold bg-red-400/10 px-1 rounded border border-red-400/20';
    if (res === 'Pass') colorClass = 'text-green-400 font-bold bg-green-400/10 px-1 rounded border border-green-400/20';

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
    return (
      <div className="w-full h-full min-h-[24px] flex items-center">
        <span className={colorClass || 'text-zinc-300'}>{initialValue}</span>
      </div>
    );
  };

  const ResultCell = ({ getValue }: any) => {
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
    { header: 'Characteristic', accessorKey: 'characteristic', cell: EditableCell, size: 200 },
    { header: 'Nominal', accessorKey: 'nominal', cell: EditableCell, size: 80 },
    { header: 'Lower Limit', accessorKey: 'lowerLimit', cell: EditableCell, size: 90 },
    { header: 'Upper Limit', accessorKey: 'upperLimit', cell: EditableCell, size: 90 },
    { header: 'Actual', accessorKey: 'actual', cell: ActualCell, size: 100 },
    { header: 'Unit', accessorKey: 'unit', cell: EditableCell, size: 70 },
    { header: 'Instrument', accessorKey: 'instrument', cell: EditableCell, size: 150 },
    { header: 'Result', accessorKey: 'result', cell: ResultCell, size: 100 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 200 },
  ], []);

  return (
    <>
      <div className="flex flex-col h-full w-full relative">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Inspection: {resolvedParams.id}</h2>
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              <span className={status === 'Pending' ? "text-amber-400" : "text-emerald-400"}>{status}</span>
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

        <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-4 pb-px mt-6 hide-on-print">
          <button 
            onClick={() => setActiveTab('parameters')}
            className={`pb-2.5 transition-colors ${activeTab === 'parameters' ? 'text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-600 hover:text-zinc-300'}`}>
            Inspection Parameters
          </button>
          <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">NCR Link</button>
          <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Related Documents</button>
        </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2 gap-3">
        {/* Inspection Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 shrink-0">
          <div className="col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Project / Part</div>
            <div className="text-sm font-bold text-zinc-100">PRJ-901 / Base Plate</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-zinc-500 mb-1">Material (Batch)</div>
            <div className="text-sm font-medium text-blue-400">Aluminium 7075 (B-40501)</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Type</div>
            <div className="text-sm font-medium text-zinc-100">In-process</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Reference</div>
            <div className="text-sm font-medium text-zinc-100">JC-2026-001</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Status</div>
            <div className="text-sm font-bold text-blue-400">Under Inspection</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Pass Rate</div>
            <div className="text-sm font-bold text-zinc-100">
              {Math.round((data.filter(d => d.result === 'Pass').length / data.filter(d => d.result !== 'Pending').length || 0) * 100)}%
            </div>
          </div>
        </div>

        {activeTab === 'parameters' && (
          <EditableDataGrid 
            columns={columns} 
            data={data} 
            onDataChange={setData}
            getNewRow={getNewRow}
            formulas={formulas}
            summary={summary}
          />
        )}
      </div>
      </div>
    </>
  );
}
