'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState, useMemo } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { GstBreakdown } from '@/components/features/finance/GstBreakdown';
import { Printer, Download, Save, ArrowLeft, ChevronRight, CheckCircle, XCircle, Send } from 'lucide-react';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
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
  
  const [header, setHeader] = useState({
    invNo: `INV/26-27/${resolvedParams.id.padStart(3, '0')}`,
    date: '2026-07-08',
    customer: 'Tata Motors',
    poNo: 'PO-TM-9981',
    dispatch: 'DC/26-27/045',
    terms: 'Net 30 Days',
  });

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/dispatch`
    : '/dispatch/invoices';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Invoices"}
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
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Dispatch</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Tax Invoice</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/dispatch/challans')}>Dispatch</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/dispatch/invoices')}>Invoices</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const getNewRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    part: '',
    qty: '1',
    rate: '0',
    discount: '0',
    gstRate: '18',
    amount: '0',
  });

  const [data, setData] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      part: 'Core Pin (CP-04)',
      qty: '50',
      rate: '25000',
      discount: '0',
      gstRate: '18',
      amount: '1250000',
    }
  ]);

  const [totals, setTotals] = useState({
    freight: '15000',
    packing: '5000',
    roundOff: '0',
  });

  // Dynamic calculations for the grid
  const formulas = useMemo(() => ({
    amount: (row: any) => {
      const q = parseFloat(row.qty) || 0;
      const r = parseFloat(row.rate) || 0;
      const d = parseFloat(row.discount) || 0;
      return (q * (r - d)).toFixed(2);
    }
  }), []);

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

  const columns = useMemo(() => [
    { header: 'Part / Description', accessorKey: 'part', cell: EditableCell, size: 250 },
    { header: 'Qty', accessorKey: 'qty', cell: EditableCell, size: 80 },
    { header: 'Rate (₹)', accessorKey: 'rate', cell: EditableCell, size: 120 },
    { header: 'Discount/Unit', accessorKey: 'discount', cell: EditableCell, size: 120 },
    { header: 'GST %', accessorKey: 'gstRate', cell: EditableCell, size: 80 },
    { header: 'Amount (₹)', accessorKey: 'amount', size: 120 }, // Auto calculated by formula
  ], []);

  // Summary Calculations
  const subtotal = data.reduce((acc, row) => acc + (parseFloat(formulas.amount(row)) || 0), 0);
  const totalGst = data.reduce((acc, row) => {
    const amt = parseFloat(formulas.amount(row)) || 0;
    const gstRate = parseFloat(row.gstRate) || 0;
    return acc + (amt * gstRate) / 100;
  }, 0);
  
  const freight = parseFloat(totals.freight) || 0;
  const packing = parseFloat(totals.packing) || 0;
  const roundOff = parseFloat(totals.roundOff) || 0;
  
  const grandTotal = subtotal + totalGst + freight + packing + roundOff;

  const { toast } = useToast();
  const status: string = 'Draft'; // Mock status

  const documentActions: DocumentAction[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      variant: 'success',
      visible: status === 'Draft',
      confirmation: 'Approve this Invoice?',
      onClick: () => toast('success', 'Invoice Approved', 'Ready to send to customer')
    },
    {
      id: 'send',
      label: 'Send to Customer',
      icon: Send,
      variant: 'primary',
      visible: status === 'Approved',
      onClick: () => toast('success', 'Invoice Sent', 'Emailed to customer')
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: XCircle,
      variant: 'danger',
      visible: status === 'Draft' || status === 'Approved',
      onClick: () => toast('error', 'Invoice Cancelled', 'Document cancelled')
    }
  ];

  return (
    <>
      <div className="h-full flex flex-col w-full relative">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Tax Invoice: {header.invNo}</h2>
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              <span className="text-blue-400">{status}</span>
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
          <button className="pb-2.5 transition-colors text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            Invoice Details
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto custom-scrollbar pt-6">
        
        {/* Editable Header */}
        <div className="glass-panel p-4 shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Invoice No</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500"
              value={header.invNo} onChange={e => setHeader({...header, invNo: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Date</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500" type="date"
              value={header.date} onChange={e => setHeader({...header, date: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Customer</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500"
              value={header.customer} onChange={e => setHeader({...header, customer: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">PO Number</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500"
              value={header.poNo} onChange={e => setHeader({...header, poNo: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Dispatch Ref</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500"
              value={header.dispatch} onChange={e => setHeader({...header, dispatch: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Payment Terms</label>
            <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500"
              value={header.terms} onChange={e => setHeader({...header, terms: e.target.value})} />
          </div>
        </div>

        <div className="flex-1 min-h-[300px]">
          <EditableDataGrid 
            columns={columns} 
            data={data} 
            onDataChange={setData}
            getNewRow={getNewRow}
            formulas={formulas}
          />
        </div>

        {/* Commercial Summary Footer */}
        <div className="shrink-0 flex justify-end">
          <div className="flex flex-col gap-3 w-72">
            <div className="glass-panel p-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Freight</span>
                <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500 w-32 text-right"
                  value={totals.freight} onChange={e => setTotals({...totals, freight: e.target.value})} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Packing & Fwd</span>
                <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500 w-32 text-right"
                  value={totals.packing} onChange={e => setTotals({...totals, packing: e.target.value})} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Round Off</span>
                <input className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-zinc-100 outline-none focus:border-blue-500 w-32 text-right"
                  value={totals.roundOff} onChange={e => setTotals({...totals, roundOff: e.target.value})} />
              </div>
            </div>
            <GstBreakdown 
              subtotal={subtotal + freight + packing} 
              taxAmount={totalGst}
              roundOff={roundOff}
              totalAmount={grandTotal}
            />
          </div>
        </div>

      </div>
      </div>
    </>
  );
}
