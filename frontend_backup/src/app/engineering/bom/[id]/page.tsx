'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';
import { useProjectBOM, useUpdateBOM, useApproveBOM } from '@/hooks/useEngineering';
import { useToast } from '@/components/ui/Toast';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { CheckCircle, Copy, FileCode2, PlayCircle } from 'lucide-react';

const MATERIALS = [
  { id: '1', label: 'Aluminium Grade 7075', grade: '7075', density: 2.81, cost: 15 },
  { id: '2', label: 'D2 Tool Steel', grade: 'D2', density: 7.85, cost: 85 },
  { id: '3', label: 'H13 Die Steel', grade: 'H13', density: 7.80, cost: 95 },
  { id: '4', label: 'EN31 Alloy Steel', grade: 'EN31', density: 7.84, cost: 45 },
];

export function BOMFormContent({ bomId, projectId }: { bomId: string; projectId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { data: bomResponse, isLoading } = useProjectBOM(bomId === 'new' ? '' : bomId);
  const updateBom = useUpdateBOM(projectId || '');
  const approveBom = useApproveBOM(projectId || '');
  
  const [activeTab, setActiveTab] = useState('items');
  const [bomItems, setBomItems] = useState<any[]>([]);
  const { setDirty } = useToolbarStore();
  const { toast } = useToast();

  const bomHeader = Array.isArray(bomResponse) ? bomResponse[0] : (bomResponse?.data || bomResponse || null);
  const isNew = bomId === 'new';
  const isApproved = bomHeader?.status === 'APPROVED' || bomHeader?.approvalStatus === 'APPROVED';

  // Load existing data
  useEffect(() => {
    if (bomHeader && bomHeader.items && !isNew) {
      const getIndent = (id: string, items: any[], depth = 0): number => {
        if (depth > 10) return depth;
        const item = items.find(i => i.id === id);
        if (!item || !item.parentId) return depth;
        return getIndent(item.parentId, items, depth + 1);
      };

      setBomItems(bomHeader.items.map((i: any) => ({
        id: i.id,
        partNo: i.partNo || '',
        partName: i.partName || '',
        materialId: i.materialId || '',
        material: i.material?.name || '',
        grade: i.material?.grade || '',
        rawSize: i.rawSize || '',
        finishSize: i.finishSize || '',
        quantity: i.requiredQty || 1,
        weight: i.calculatedWeight || 0,
        unitCost: i.unitCost || 0,
        scrapPercent: i.scrapPercent || 0,
        estProcessCost: i.estimatedProcessCost || 0,
        estCost: i.estimatedCost || 0,
        density: i.material?.density || 0,
        materialRate: i.material?.standardCost || 0,
        supplier: i.supplier || '',
        isAssembly: i.isAssembly || false,
        parentId: i.parentId || null,
        indentLevel: getIndent(i.id, bomHeader.items),
        remarks: i.remarks || '',
      })));
      setDirty(false);
    } else if (isNew && bomItems.length === 0) {
      setBomItems([getNewBOMRow()]);
      setDirty(true);
    }
  }, [bomHeader, isNew]);

  const handleDataChange = (newData: any[]) => {
    setBomItems(newData);
    setDirty(true);
  };

  const handleSave = () => {
    if (!projectId) {
      toast('error', 'Missing Project', 'Cannot save BOM without a project context.');
      return;
    }
    
    const payload = {
      items: bomItems.map(item => ({
        materialId: item.materialId,
        partNo: item.partNo,
        partName: item.partName,
        finishSize: item.finishSize,
        rawSize: item.rawSize,
        supplier: item.supplier,
        calculatedWeight: parseFloat(item.weight) || 0,
        requiredQty: parseFloat(item.quantity) || 1,
        unitCost: parseFloat(item.unitCost) || 0,
        scrapPercent: parseFloat(item.scrapPercent) || 0,
        estimatedProcessCost: parseFloat(item.estProcessCost) || 0,
        estimatedCost: parseFloat(item.estCost) || 0,
        isAssembly: item.isAssembly || false,
        parentId: item.parentId || null,
        id: item.id,
        remarks: item.remarks,
      }))
    };

    updateBom.mutate(payload, {
      onSuccess: () => {
        setDirty(false);
        if (isNew) {
          router.replace(`/engineering/bom`); // Ideally redirect to new ID, but we can just go back for now
        }
      }
    });
  };

  const handleApprove = () => {
    if (!projectId || !bomHeader?.id) return;
    return approveBom.mutateAsync(bomHeader.id, {
      onSuccess: () => {
        toast('success', 'BOM Approved', 'Document has been frozen.');
      }
    });
  };

  const handleIssue = () => {
    toast('success', 'BOM Issued', 'BOM has been issued to Production.');
  };

  const documentActions: DocumentAction[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      variant: 'success',
      visible: !isApproved && !isNew,
      confirmation: 'Are you sure you want to approve this BOM? This will freeze the materials list.',
      onClick: handleApprove
    },
    {
      id: 'issue',
      label: 'Issue to Production',
      icon: PlayCircle,
      variant: 'primary',
      visible: isApproved && !isNew,
      confirmation: 'Are you sure you want to issue this BOM to production?',
      onClick: handleIssue
    }
  ];

  useStandardToolbar({
    featureId: `bom-${bomId}`,
    onSave: handleSave,
    onDelete: !isApproved ? () => toast('error', 'Delete', 'Not implemented') : undefined,
    onPrint: () => window.print(),
    onDuplicate: () => toast('info', 'Duplicate', 'Not implemented'),
    onRevision: isApproved ? () => toast('info', 'Revision', 'Not implemented') : undefined,
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const getNewBOMRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    isAssembly: false,
    parentId: prevRow?.parentId || null,
    indentLevel: prevRow?.indentLevel || 0,
    partNo: '',
    partName: '',
    materialId: prevRow?.materialId || '',
    material: prevRow?.material || '',
    grade: prevRow?.grade || '',
    length: '',
    width: '',
    thickness: '',
    diameter: '',
    finishSize: '',
    rawSize: '',
    quantity: '1',
    weight: '0',
    unitCost: '0',
    scrapPercent: '0',
    estProcessCost: '0',
    estCost: '0',
    density: prevRow?.density || 0,
    materialRate: prevRow?.materialRate || 0,
    supplier: prevRow?.supplier || '',
    remarks: '',
  });

  // Formula Engine mappings
  const formulas = useMemo(() => ({
    weight: (row: any) => {
      // Very basic weight calc if L,W,T are used (assuming string manipulation of rawSize if needed, but for now just fallback to manual)
      return parseFloat(row.weight) > 0 ? row.weight : '0';
    },
    estCost: (row: any) => {
      const wgt = parseFloat(row.weight) || 0;
      const rate = parseFloat(row.materialRate) || 0;
      const qty = parseFloat(row.quantity) || 1;
      const unitCost = parseFloat(row.unitCost) || 0;
      const scrap = parseFloat(row.scrapPercent) || 0;
      const processCost = parseFloat(row.estProcessCost) || 0;
      
      let baseMaterialCost = wgt > 0 ? (wgt * rate) : rate;
      if (unitCost > 0) baseMaterialCost = unitCost; // Unit cost overrides calculated weight*rate if set

      const totalMaterialCost = baseMaterialCost * qty;
      const totalScrapCost = totalMaterialCost * (scrap / 100);
      const totalProcessCost = processCost * qty;

      return (totalMaterialCost + totalScrapCost + totalProcessCost).toFixed(2);
    }
  }), []);

  const summary = useMemo(() => [
    { accessorKey: 'id', label: 'Total Items', type: 'count' as const },
    { accessorKey: 'quantity', label: 'Total Qty', type: 'sum' as const },
    { accessorKey: 'weight', label: 'Total Weight', type: 'sum' as const, format: (v: number) => `${v.toFixed(2)} Kg` },
    { accessorKey: 'estCost', label: 'Est Material Cost', type: 'sum' as const, format: (v: number) => `$${v.toFixed(2)}` },
  ], []);

  const EditableCell = ({ getValue, row, column, table, isActive }: any) => {
    const initialValue = getValue();
    const [value, setValue] = useState(initialValue);
    
    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    const onBlur = () => {
      table.options.meta?.updateData(row.index, column.id, value);
    };

    if (isActive && !isApproved) {
      return (
        <input
          autoFocus
          className="w-full h-full bg-black/60 border border-emerald-500/50 rounded-md px-2 py-1 text-[13px] text-white focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] shadow-inner"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onBlur();
          }}
        />
      );
    }

    return (
      <div 
        className={`w-full h-full min-h-[30px] px-2 py-1.5 rounded-md border text-[13px] transition-colors flex items-center cursor-text 
          bg-black/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] truncate
          ${value ? 'border-white/5 text-zinc-300' : 'border-white/10 border-dashed text-zinc-600 hover:text-zinc-400'}
          hover:border-emerald-500/40 hover:bg-black/60
        `} 
        title={value}
      >
        {value || 'Click to edit'}
      </div>
    );
  };

  const ReadOnlyCell = ({ getValue }: any) => (
    <div className="w-full h-full min-h-[30px] px-2 py-1.5 text-[13px] text-zinc-500 font-medium flex items-center">{getValue()}</div>
  );

  const IndentedCell = ({ getValue, row, column, table, isActive }: any) => {
    const indent = row.original.indentLevel || 0;
    const isAssy = row.original.isAssembly;
    return (
      <div className="flex items-center w-full h-full gap-2" style={{ paddingLeft: `${indent * 1.5}rem` }}>
        {isAssy && <span className="text-emerald-500 text-xs">▼</span>}
        {!isAssy && indent > 0 && <span className="text-zinc-600 text-xs pl-1">↳</span>}
        <div className="flex-1">
          <EditableCell getValue={getValue} row={row} column={column} table={table} isActive={isActive} />
        </div>
      </div>
    );
  };

  const MaterialCell = ({ getValue, row, column, table, isActive }: any) => {
    const value = getValue();
    if (isApproved) return <ReadOnlyCell getValue={getValue} />;
    
    return (
      <div className="w-full h-full min-h-[30px] flex items-center">
        <SearchableAutocomplete
          value={value}
          onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
          onSelect={(opt) => {
            table.options.meta?.updateData(row.index, 'materialId', opt.id);
            if (opt.grade) table.options.meta?.updateData(row.index, 'grade', opt.grade);
            if (opt.density) table.options.meta?.updateData(row.index, 'density', opt.density);
            if (opt.cost) table.options.meta?.updateData(row.index, 'materialRate', opt.cost);
          }}
          options={MATERIALS}
          isActive={isActive}
          placeholder="Search material..."
        />
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'Part No', accessorKey: 'partNo', cell: IndentedCell, size: 140 },
    { header: 'Part Name', accessorKey: 'partName', cell: EditableCell, size: 150 },
    { header: 'Material', accessorKey: 'material', cell: MaterialCell, size: 200 },
    { header: 'Grade', accessorKey: 'grade', cell: EditableCell, size: 80 },
    { header: 'Raw Size', accessorKey: 'rawSize', cell: EditableCell, size: 120 },
    { header: 'Finish Size', accessorKey: 'finishSize', cell: EditableCell, size: 120 },
    { header: 'Qty', accessorKey: 'quantity', cell: EditableCell, size: 60 },
    { header: 'Wt (kg)', accessorKey: 'weight', cell: EditableCell, size: 80 },
    { header: 'Unit Cost', accessorKey: 'unitCost', cell: EditableCell, size: 90 },
    { header: 'Scrap %', accessorKey: 'scrapPercent', cell: EditableCell, size: 80 },
    { header: 'Process Cost', accessorKey: 'estProcessCost', cell: EditableCell, size: 100 },
    { header: 'Total Est Cost ($)', accessorKey: 'estCost', cell: EditableCell, size: 120 },
    { header: 'Supplier', accessorKey: 'supplier', cell: EditableCell, size: 120 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 150 },
  ], [isApproved]);

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading BOM...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center gap-4 px-4 pt-4 hide-on-print">
        <button onClick={() => {
          if (projectId) {
            router.push(`/projects/${projectId.replace('PRJ-', '')}/engineering`);
          } else {
            router.push('/engineering/bom');
          }
        }} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/[0.02] hover:bg-white/[0.06] rounded-md transition-all flex items-center justify-center border border-white/[0.04]" title={projectId ? "Back to Project" : "Back to BOMs"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{isNew ? 'New Bill of Materials' : `BOM: ${bomHeader?.bomNumber || bomId}`}</h2>
          <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
            <span className={isApproved ? "text-emerald-400" : "text-blue-400"}>
              {isApproved ? 'APPROVED' : 'DRAFT'}
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

      <div className="flex gap-6 text-[13px] font-bold tracking-wider uppercase border-b border-white/5 px-4 pb-px mt-6 hide-on-print">
        <button 
          onClick={() => setActiveTab('items')}
          className={`pb-2.5 transition-colors ${activeTab === 'items' ? 'text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-600 hover:text-zinc-300'}`}>
          BOM Items
        </button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Cost Estimation</button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Related Documents</button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Attachments</button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">History</button>
      </div>
      <div className="h-full flex flex-col pt-2 pb-2 px-2">
        {activeTab === 'items' && (
          <EditableDataGrid 
            columns={columns} 
            data={bomItems} 
            onDataChange={handleDataChange}
            getNewRow={getNewBOMRow}
            formulas={formulas}
            summary={summary}
            readOnly={isApproved}
          />
        )}
      </div>
    </div>
  );
}

export default function BOMFormPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <BOMFormContent bomId={resolvedParams.id} projectId={projectId} />
    </Suspense>
  );
}
