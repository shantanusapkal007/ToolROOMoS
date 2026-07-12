'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { GstBreakdown } from '@/components/features/finance/GstBreakdown';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export default function VendorBillDetail({ params }: { params: Promise<{ id: string }> }) {
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

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/purchasing`
    : '/purchase/vendor-bills';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Bills"}
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
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Purchase</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Vendor Bill</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/purchase/vendor-bills')}>Vendor Bills</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const getNewBillRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    vendorInvoice: prevRow?.vendorInvoice || '',
    invoiceDate: prevRow?.invoiceDate || '',
    po: prevRow?.po || '',
    grn: prevRow?.grn || '',
    part: '',
    qty: '1',
    rate: '0',
    gst: prevRow?.gst || 18,
    discount: '0',
    freight: '0',
    tds: prevRow?.tds || '0',
    total: 0,
    status: 'ACTIVE',
    poRate: '0',
    grnQty: '0',
    matchingStatus: 'MATCHED',
  });

  const [billItems, setBillItems] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      vendorInvoice: 'INV-4451',
      invoiceDate: '2026-07-08',
      po: 'PO/2026/0041',
      grn: 'GRN/2026/01',
      part: 'RM-001',
      poRate: '1500',
      grnQty: '2',
      qty: '2',
      rate: '1500',
      gst: '18',
      discount: '0',
      freight: '150',
      tds: '0',
      total: 3690,
      status: 'ACTIVE',
      matchingStatus: 'MATCHED',
    },
    {
      id: crypto.randomUUID(),
      vendorInvoice: 'INV-4451',
      invoiceDate: '2026-07-08',
      po: 'PO/2026/0041',
      grn: 'GRN/2026/01',
      part: 'RM-002',
      poRate: '1000',
      grnQty: '5',
      qty: '6',
      rate: '1200',
      gst: '18',
      discount: '0',
      freight: '0',
      tds: '0',
      total: 8496,
      status: 'ACTIVE',
      matchingStatus: 'MISMATCH',
    }
  ]);

  const formulas = useMemo(() => ({
    total: (row: any) => {
      const q = parseFloat(row.qty) || 0;
      const r = parseFloat(row.rate) || 0;
      const d = parseFloat(row.discount) || 0;
      const f = parseFloat(row.freight) || 0;
      const g = parseFloat(row.gst) || 0;
      const t = parseFloat(row.tds) || 0;
      
      const base = (q * r) - d;
      const taxAmt = base * (g / 100);
      const tdsAmt = base * (t / 100);
      const grand = base + taxAmt + f - tdsAmt;
      
      return grand.toFixed(2);
    },
    matchingStatus: (row: any) => {
      const q = parseFloat(row.qty) || 0;
      const r = parseFloat(row.rate) || 0;
      const grnQ = parseFloat(row.grnQty) || q;
      const poR = parseFloat(row.poRate) || r;
      if (q === grnQ && r === poR) return 'MATCHED';
      if (q !== grnQ && r !== poR) return 'MISMATCH';
      return 'PARTIAL';
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'qty', label: 'Total Billed Qty', type: 'sum' as const },
    { accessorKey: 'total', label: 'Bill Amount', type: 'sum' as const, format: (v: number) => `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
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

  const ReadOnlyCell = ({ getValue }: any) => (
    <div className="w-full h-full min-h-[24px] text-zinc-500 font-medium">{getValue()}</div>
  );

  const MatchingStatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'MATCHED' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'PARTIAL' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                  'text-red-400 bg-red-400/10 border-red-400/20';
    
    return (
      <div className="w-full h-full flex items-center">
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${color}`}>
          {status}
        </span>
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'Vendor Invoice', accessorKey: 'vendorInvoice', cell: EditableCell, size: 120 },
    { header: 'Inv Date', accessorKey: 'invoiceDate', cell: EditableCell, size: 90 },
    { header: 'PO Ref', accessorKey: 'po', cell: EditableCell, size: 120 },
    { header: 'GRN Ref', accessorKey: 'grn', cell: EditableCell, size: 120 },
    { header: 'Part', accessorKey: 'part', cell: EditableCell, size: 120 },
    { header: 'Qty', accessorKey: 'qty', cell: EditableCell, size: 60 },
    { header: 'Rate', accessorKey: 'rate', cell: EditableCell, size: 80 },
    { header: 'GST%', accessorKey: 'gst', cell: EditableCell, size: 60 },
    { header: 'Disc', accessorKey: 'discount', cell: EditableCell, size: 60 },
    { header: 'Freight', accessorKey: 'freight', cell: EditableCell, size: 80 },
    { header: 'TDS%', accessorKey: 'tds', cell: EditableCell, size: 60 },
    { header: 'Total', accessorKey: 'total', cell: ReadOnlyCell, size: 100 },
    { header: 'Matching', accessorKey: 'matchingStatus', cell: MatchingStatusCell, size: 100 },
  ], []);

  const documentActions: DocumentAction[] = [
    {
      id: 'verify',
      label: 'Verify Bill',
      icon: CheckCircle,
      variant: 'primary',
      visible: true,
      onClick: () => console.log('Verify')
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: XCircle,
      variant: 'danger',
      visible: true,
      onClick: () => console.log('Reject')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#060608]">
      <div className="shrink-0 p-4 border-b border-white/5 flex items-start gap-3 bg-white/[0.01]">
        <button onClick={() => router.push(backUrl)} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/[0.02] hover:bg-white/[0.06] rounded-md transition-all flex items-center justify-center border border-white/[0.04]" title={projectId ? "Back to Project" : "Back to Bills"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Vendor Bill: {resolvedParams.id}</h2>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
            <span className="text-amber-400">PENDING VERIFICATION</span>
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
            Bill Items
          </button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Commercial Verification</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Related Documents</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2 transition-colors">Attachments (Invoice PDF)</button>
        </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2">
        {activeTab === 'items' && (
          <>
            <div className="flex-1 min-h-[300px]">
              <EditableDataGrid 
                columns={columns} 
                data={billItems} 
                onDataChange={setBillItems}
                getNewRow={getNewBillRow}
                formulas={formulas}
                summary={summary}
              />
            </div>
            <div className="shrink-0 flex justify-end px-4">
              <GstBreakdown 
                subtotal={billItems.reduce((acc, row) => acc + (parseFloat(row.qty || 0) * parseFloat(row.rate || 0) - parseFloat(row.discount || 0)), 0)}
                taxAmount={billItems.reduce((acc, row) => {
                  const base = (parseFloat(row.qty || 0) * parseFloat(row.rate || 0)) - parseFloat(row.discount || 0);
                  return acc + base * (parseFloat(row.gst || 0) / 100);
                }, 0)}
                totalAmount={billItems.reduce((acc, row) => acc + parseFloat(formulas.total(row) || '0'), 0)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
