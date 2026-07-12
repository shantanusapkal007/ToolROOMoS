'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';

export function GRNFormContent({ grnId, projectId }: { grnId: string; projectId?: string | null }) {
  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const [activeTab, setActiveTab] = useState('items');

  const getNewGRNRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    poRef: prevRow?.poRef || '',
    material: prevRow?.material || '',
    grade: prevRow?.grade || '',
    length: '',
    width: '',
    thickness: '',
    diameter: '',
    weight: '0',
    batch: '',
    heatNo: '',
    supplierBatch: '',
    millCert: 'No',
    orderedQty: '0',
    receivedQty: '0',
    acceptedQty: '0',
    rejectedQty: '0',
    warehouse: prevRow?.warehouse || 'Main',
    rack: prevRow?.rack || '',
    bin: prevRow?.bin || '',
    remarks: '',
  });

  const [grnItems, setGrnItems] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      poRef: 'PO/2026/0041',
      material: 'Aluminium Grade 7075 (RM-001)',
      grade: '7075',
      length: '260',
      width: '190',
      thickness: '50',
      diameter: '',
      weight: '6.9',
      batch: 'B-40501',
      heatNo: 'HT-9921',
      supplierBatch: 'SB-098',
      millCert: 'Yes',
      orderedQty: '2',
      receivedQty: '2',
      acceptedQty: '2',
      rejectedQty: '0',
      warehouse: 'Main Toolroom',
      rack: 'R-14',
      bin: 'B-02',
      remarks: 'Inspected OK',
    }
  ]);

  const summary = useMemo(() => [
    { accessorKey: 'orderedQty', label: 'Total Ordered', type: 'sum' as const },
    { accessorKey: 'receivedQty', label: 'Total Received', type: 'sum' as const },
    { accessorKey: 'acceptedQty', label: 'Total Accepted', type: 'sum' as const },
    { accessorKey: 'rejectedQty', label: 'Total Rejected', type: 'sum' as const },
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
    { header: 'PO Ref', accessorKey: 'poRef', cell: EditableCell, size: 120 },
    { header: 'Material', accessorKey: 'material', cell: EditableCell, size: 200 },
    { header: 'Grade', accessorKey: 'grade', cell: EditableCell, size: 80 },
    { header: 'L', accessorKey: 'length', cell: EditableCell, size: 60 },
    { header: 'W', accessorKey: 'width', cell: EditableCell, size: 60 },
    { header: 'T', accessorKey: 'thickness', cell: EditableCell, size: 60 },
    { header: 'Wt (kg)', accessorKey: 'weight', cell: EditableCell, size: 80 },
    { header: 'Batch', accessorKey: 'batch', cell: EditableCell, size: 100 },
    { header: 'Heat No', accessorKey: 'heatNo', cell: EditableCell, size: 100 },
    { header: 'Sup Batch', accessorKey: 'supplierBatch', cell: EditableCell, size: 100 },
    { header: 'Mill Cert', accessorKey: 'millCert', cell: EditableCell, size: 80 },
    { header: 'Ord Qty', accessorKey: 'orderedQty', cell: EditableCell, size: 80 },
    { header: 'Rcv Qty', accessorKey: 'receivedQty', cell: EditableCell, size: 80 },
    { header: 'Acc Qty', accessorKey: 'acceptedQty', cell: EditableCell, size: 80 },
    { header: 'Rej Qty', accessorKey: 'rejectedQty', cell: EditableCell, size: 80 },
    { header: 'Whse', accessorKey: 'warehouse', cell: EditableCell, size: 120 },
    { header: 'Rack', accessorKey: 'rack', cell: EditableCell, size: 80 },
    { header: 'Bin', accessorKey: 'bin', cell: EditableCell, size: 80 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 150 },
  ], []);

  const documentActions: DocumentAction[] = [
    {
      id: 'receive',
      label: 'Receive Goods',
      icon: CheckCircle,
      variant: 'primary',
      visible: true,
      onClick: () => console.log('Receive')
    },
    {
      id: 'reject',
      label: 'Reject Batch',
      icon: XCircle,
      variant: 'danger',
      visible: true,
      onClick: () => console.log('Reject')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="shrink-0 p-4 flex items-start gap-3 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">GRN: {grnId}</h2>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
            <span className="text-blue-400">PENDING INSPECTION</span>
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

      <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-4 pb-px mt-4 hide-on-print relative z-10">
          <button 
            onClick={() => setActiveTab('items')}
            className={`pb-2 transition-colors ${activeTab === 'items' ? 'text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Receipt Items
          </button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Quality Inspection</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Related Documents</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Attachments (Mill Certs)</button>
        </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2 relative z-10">
        {activeTab === 'items' && (
          <EditableDataGrid 
            columns={columns} 
            data={grnItems} 
            onDataChange={setGrnItems}
            getNewRow={getNewGRNRow}
            summary={summary}
          />
        )}
      </div>
    </div>
  );
}

export default function GRNDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  return <GRNFormContent grnId={resolvedParams.id} projectId={projectId} />;
}

