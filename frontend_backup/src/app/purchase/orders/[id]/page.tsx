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
import { ArrowLeft, ChevronRight, Send, XCircle, Copy, Mail, Printer, History } from 'lucide-react';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useToast } from '@/components/ui/Toast';
import { usePurchaseOrders, useApprovePurchaseOrder } from '@/hooks/useProcurement';

const MATERIALS = [
  { id: '1', label: 'Aluminium Grade 7075', grade: '7075', hsn: '7601', gst: 18, cost: 15 },
  { id: '2', label: 'D2 Tool Steel', grade: 'D2', hsn: '7224', gst: 18, cost: 85 },
];

export function PurchaseOrderFormContent({ poId, projectId }: { poId: string; projectId?: string | null }) {
  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const [activeTab, setActiveTab] = useState('items');
  const [activeMaterial, setActiveMaterial] = useState<{name: string, grade: string} | null>(null);
  const { toast } = useToast();

  const { data: posRes } = usePurchaseOrders(projectId || '');
  const approvePoMutation = useApprovePurchaseOrder(projectId || '');

  const po = posRes?.data?.find((p: any) => p.id === poId) || null;
  const isIssued = po?.approvalStatus === 'APPROVED' || po?.status === 'ISSUED';
  
  const handleApprove = async () => {
    if (!po) return;
    await approvePoMutation.mutateAsync(po.id);
  };
  
  const documentActions: DocumentAction[] = [
    {
      id: 'issue',
      label: approvePoMutation.isPending ? 'Issuing...' : 'Approve & Issue',
      icon: Send,
      variant: 'primary',
      visible: !isIssued,
      confirmation: 'Are you sure you want to approve and issue this Purchase Order?',
      onClick: handleApprove
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: XCircle,
      variant: 'danger',
      visible: true,
      onClick: () => toast('info', 'Cancel', 'Not implemented')
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      visible: !isIssued,
      onClick: () => toast('info', 'Duplicate', 'Not implemented')
    },
    {
      id: 'email',
      label: 'Email Vendor',
      icon: Mail,
      visible: !isIssued,
      onClick: () => toast('info', 'Email', 'Not implemented')
    },
    {
      id: 'print',
      label: 'Print',
      icon: Printer,
      visible: isIssued,
      onClick: () => window.print()
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      visible: isIssued,
      onClick: () => toast('info', 'History', 'Not implemented')
    }
  ];

  const getNewPORow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    partNo: '',
    description: '',
    material: prevRow?.material || '',
    grade: prevRow?.grade || '',
    length: '',
    width: '',
    thickness: '',
    diameter: '',
    quantity: '1',
    unit: 'NO',
    rate: prevRow?.rate || 0,
    discount: '0',
    gst: prevRow?.gst || 18,
    hsn: prevRow?.hsn || '',
    freight: '0',
    deliveryDate: '',
    remarks: '',
    total: 0,
  });

  const [poItems, setPoItems] = useState<any[]>([]);

  React.useEffect(() => {
    if (po && po.items && po.items.length > 0) {
      setPoItems(po.items.map((item: any) => ({
        id: item.id,
        materialId: item.materialId,
        material: item.material?.name || item.materialId,
        quantity: item.orderedQty,
        rate: item.agreedRate,
        discount: item.discount || 0,
        gst: item.gstPercent || 0,
        freight: 0,
        total: item.lineTotal,
        remarks: item.remarks || '',
      })));
    }
  }, [po]);

  const formulas = useMemo(() => ({
    total: (row: any) => {
      const q = parseFloat(row.quantity) || 0;
      const r = parseFloat(row.rate) || 0;
      const d = parseFloat(row.discount) || 0;
      const f = parseFloat(row.freight) || 0;
      const g = parseFloat(row.gst) || 0;
      
      const base = q * r;
      const afterDiscount = base - d;
      const taxAmt = afterDiscount * (g / 100);
      const grand = afterDiscount + taxAmt + f;
      
      return grand.toFixed(2);
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'id', label: 'Items', type: 'count' as const },
    { accessorKey: 'quantity', label: 'Total Qty', type: 'sum' as const },
    { accessorKey: 'total', label: 'Grand Total', type: 'sum' as const, format: (v: number) => `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
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

  const MaterialCell = ({ getValue, row, column, table, isActive }: any) => {
    const value = getValue();
    return (
      <SearchableAutocomplete
        value={value}
        onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
        onSelect={(opt) => {
          if (opt.grade) table.options.meta?.updateData(row.index, 'grade', opt.grade);
          if (opt.hsn) table.options.meta?.updateData(row.index, 'hsn', opt.hsn);
          if (opt.gst) table.options.meta?.updateData(row.index, 'gst', opt.gst);
          if (opt.cost) table.options.meta?.updateData(row.index, 'rate', opt.cost);
        }}
        options={MATERIALS}
        isActive={isActive}
        placeholder="Search..."
      />
    );
  };

  const columns = useMemo(() => [
    { header: 'Part No', accessorKey: 'partNo', cell: EditableCell, size: 80 },
    { header: 'Description', accessorKey: 'description', cell: EditableCell, size: 150 },
    { header: 'Material', accessorKey: 'material', cell: MaterialCell, size: 150 },
    { header: 'Grade', accessorKey: 'grade', cell: EditableCell, size: 80 },
    { header: 'L', accessorKey: 'length', cell: EditableCell, size: 60 },
    { header: 'W', accessorKey: 'width', cell: EditableCell, size: 60 },
    { header: 'T', accessorKey: 'thickness', cell: EditableCell, size: 60 },
    { header: 'Qty', accessorKey: 'quantity', cell: EditableCell, size: 60 },
    { header: 'Unit', accessorKey: 'unit', cell: EditableCell, size: 60 },
    { header: 'Rate', accessorKey: 'rate', cell: EditableCell, size: 80 },
    { header: 'Disc', accessorKey: 'discount', cell: EditableCell, size: 60 },
    { header: 'GST%', accessorKey: 'gst', cell: EditableCell, size: 60 },
    { header: 'Freight', accessorKey: 'freight', cell: EditableCell, size: 80 },
    { header: 'Delivery', accessorKey: 'deliveryDate', cell: EditableCell, size: 100 },
    { header: 'Total', accessorKey: 'total', cell: ReadOnlyCell, size: 100 },
  ], []);

  return (
      <div className="flex flex-col h-full w-full relative bg-transparent">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Purchase Order: {poId}</h2>
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              <span className={isIssued ? "text-emerald-400" : "text-blue-400"}>
                {isIssued ? 'ISSUED' : 'DRAFT'}
              </span>
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

        <div className="flex items-center justify-between px-4 mt-6 hide-on-print border-b border-white/5 pb-px relative z-10">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('items')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'items' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            >
              Order Items
            </button>
            <button 
              onClick={() => setActiveTab('terms')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'terms' ? 'text-emerald-400 border-emerald-400' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
            >
              Terms & Conditions
            </button>
          </div>
        </div>

      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col z-10">
        {/* Document Header (Sticky) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 shrink-0 bg-white/[0.01] border-b border-white/[0.02]">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Items</div>
            <div className="text-sm font-medium text-zinc-100">{poItems.length} (Qty: {poItems.reduce((a,b)=>a+(parseFloat(b.quantity)||0), 0)})</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Material Cost</div>
            <div className="text-sm font-medium text-zinc-100">₹ {poItems.reduce((a,b)=>a+((parseFloat(b.quantity)||0)*(parseFloat(b.rate)||0)), 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Discount</div>
            <div className="text-sm font-medium text-red-400">- ₹ {poItems.reduce((a,b)=>a+(parseFloat(b.discount)||0), 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total GST</div>
            <div className="text-sm font-medium text-zinc-100">₹ {poItems.reduce((a,b)=>a+(((parseFloat(b.quantity)||0)*(parseFloat(b.rate)||0)-(parseFloat(b.discount)||0))*(parseFloat(b.gst)||0)/100), 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Freight</div>
            <div className="text-sm font-medium text-zinc-100">₹ {poItems.reduce((a,b)=>a+(parseFloat(b.freight)||0), 0).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Grand Total</div>
            <div className="text-sm font-bold text-green-400">₹ {poItems.reduce((a,b)=>a+parseFloat(b.total||0), 0).toLocaleString()}</div>
          </div>
        </div>

        {activeTab === 'items' && (
          <EditableDataGrid 
            columns={columns} 
            data={poItems} 
            onDataChange={setPoItems}
            getNewRow={getNewPORow}
            formulas={formulas}
            summary={summary}
            onRowFocus={(row: any) => {
              if (row.material) setActiveMaterial({ name: row.material, grade: row.grade });
              else setActiveMaterial(null);
            }}
          />
        )}
      </div>
      </div>
  );
}

export default function PurchaseOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  return <PurchaseOrderFormContent poId={resolvedParams.id} projectId={projectId} />;
}
