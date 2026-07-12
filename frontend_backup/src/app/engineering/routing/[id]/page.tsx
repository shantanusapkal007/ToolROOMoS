'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditableDataGrid } from '@/components/tables/EditableDataGrid';
import { SearchableAutocomplete } from '@/components/forms/SearchableAutocomplete';
import { useToolbarStore } from '@/store/useToolbarStore';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useProjectRouting, useUpdateRouting, useApproveRouting } from '@/hooks/useEngineering';
import { useToast } from '@/components/ui/Toast';
import { PrintService } from '@/services/PrintService';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { CheckCircle, Copy, FileCode2 } from 'lucide-react';

const MACHINES = [
  { id: '1', label: 'VMC-01 (Haas VF2)', group: 'VMC' },
  { id: '2', label: 'VMC-02 (Haas VF4)', group: 'VMC' },
  { id: '3', label: 'Wire EDM-01', group: 'EDM' },
  { id: '4', label: 'Surface Grinder SG-02', group: 'Grinding' },
];

const OPERATIONS = [
  { id: '1', label: 'Rough Milling', dept: 'Production' },
  { id: '2', label: 'Finish Milling', dept: 'Production' },
  { id: '3', label: 'Wire Cut', dept: 'Toolroom' },
  { id: '4', label: 'Grinding', dept: 'Toolroom' },
];

export function RoutingFormContent({ routingId, projectId }: { routingId: string; projectId?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: routingResponse, isLoading } = useProjectRouting(projectId || '');
  const updateRouting = useUpdateRouting(projectId || '');
  const approveRouting = useApproveRouting(projectId || '');

  const [activeTab, setActiveTab] = useState('items');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const { setDirty } = useToolbarStore();
  const { toast } = useToast();

  const routingHeader = routingResponse?.data || null;
  const isNew = routingId === 'new';
  const isApproved = routingHeader?.approvalStatus === 'APPROVED';

  const [routingItems, setRoutingItems] = useState<any[]>([]);

  useEffect(() => {
    if (routingHeader && routingHeader.operations && !isNew) {
      setRoutingItems(routingHeader.operations.map((op: any) => ({
        id: op.id,
        sequence: op.sequenceOrder?.toString() || '',
        operationId: op.operationId || '',
        operation: op.operation?.name || '',
        department: op.operation?.department || 'Production',
        plannedMachineId: op.plannedMachineId || '',
        machine: op.plannedMachine?.name || '',
        machineGroup: op.plannedMachine?.group || '',
        skill: op.skillLevel || 'High',
        setupTime: op.estimatedSetupTime?.toString() || '0',
        machineTime: op.estimatedHours?.toString() || '0',
        inspectionReq: op.inspectionRequired ? 'Yes' : 'No',
        toolUsed: op.toolingRequired || '',
        fixtureUsed: op.fixtureRequired || '',
        outsource: op.isOutsourced ? 'Yes' : 'No',
        remarks: op.remarks || '',
      })));
      setDirty(false);
    } else if (isNew && routingItems.length === 0) {
      setRoutingItems([getNewRoutingRow()]);
      setDirty(true);
    }
  }, [routingHeader, isNew]);

  const handleDataChange = (newData: any[]) => {
    const resequenced = newData.map((row, idx) => ({
      ...row,
      sequence: ((idx + 1) * 10).toString()
    }));
    setRoutingItems(resequenced);
    setDirty(true);
  };

  const handleSave = () => {
    if (!projectId) {
      toast('error', 'Missing Project', 'Cannot save Routing without a project context.');
      return;
    }

    const payload = {
      operations: routingItems.map((item, idx) => ({
        sequenceOrder: (idx + 1) * 10,
        operationId: item.operationId,
        plannedMachineId: item.plannedMachineId,
        estimatedSetupTime: parseFloat(item.setupTime) || 0,
        estimatedHours: parseFloat(item.machineTime) || 0,
        remarks: item.remarks,
      }))
    };

    updateRouting.mutate(payload, {
      onSuccess: () => {
        setDirty(false);
        if (isNew) {
          router.replace(`/engineering/routing`);
        }
      }
    });
  };

  const handleApprove = () => {
    if (!projectId || !routingHeader?.id) return;
    return approveRouting.mutateAsync(routingHeader.id, {
      onSuccess: () => {
        toast('success', 'Routing Approved', 'Manufacturing operations frozen.');
      }
    });
  };

  const documentActions: DocumentAction[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: CheckCircle,
      variant: 'success',
      visible: !isApproved && !isNew,
      confirmation: 'Are you sure you want to approve this Routing? This will freeze the sequence.',
      onClick: handleApprove
    }
  ];

  useStandardToolbar({
    featureId: `routing-${routingId}`,
    selection: selectedRows,
    onSave: handleSave,
    onDelete: !isApproved ? () => toast('error', 'Delete', 'Not implemented') : undefined,
    onPrint: () => PrintService.print('routing-template', routingItems),
    onDuplicate: () => toast('info', 'Duplicate', 'Not implemented'),
    onRevision: isApproved ? () => toast('info', 'Revision', 'Not implemented') : undefined,
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const getNewRoutingRow = (prevRow?: any) => ({
    id: crypto.randomUUID(),
    sequence: '10', // formula handles actual update
    operationId: '',
    operation: '',
    department: prevRow?.department || 'Production',
    plannedMachineId: '',
    machine: '',
    machineGroup: prevRow?.machineGroup || '',
    skill: prevRow?.skill || 'High',
    setupTime: '0.0',
    machineTime: '0.0',
    inspectionReq: 'No',
    toolUsed: '',
    fixtureUsed: '',
    outsource: 'No',
    remarks: '',
  });

  const summary = useMemo(() => [
    { accessorKey: 'id', label: 'Total Operations', type: 'count' as const },
    { accessorKey: 'setupTime', label: 'Total Setup', type: 'sum' as const, format: (v: number) => `${v.toFixed(1)} Hr` },
    { accessorKey: 'machineTime', label: 'Total Run Time', type: 'sum' as const, format: (v: number) => `${v.toFixed(1)} Hr` },
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
    <div className="w-full h-full min-h-[30px] px-2 py-1.5 text-[13px] text-zinc-500 font-medium flex items-center truncate">{getValue()}</div>
  );

  const MachineCell = ({ getValue, row, column, table, isActive }: any) => {
    const value = getValue();
    if (isApproved) return <ReadOnlyCell getValue={getValue} />;
    return (
      <div className="w-full h-full min-h-[30px] flex items-center">
        <SearchableAutocomplete
          value={value}
          onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
          onSelect={(opt) => {
            table.options.meta?.updateData(row.index, 'plannedMachineId', opt.id);
            if (opt.group) table.options.meta?.updateData(row.index, 'machineGroup', opt.group);
          }}
          options={MACHINES}
          isActive={isActive}
          placeholder="Select Machine..."
        />
      </div>
    );
  };

  const OperationCell = ({ getValue, row, column, table, isActive }: any) => {
    const value = getValue();
    if (isApproved) return <ReadOnlyCell getValue={getValue} />;
    return (
      <div className="w-full h-full min-h-[30px] flex items-center">
        <SearchableAutocomplete
          value={value}
          onChange={(newVal) => table.options.meta?.updateData(row.index, column.id, newVal)}
          onSelect={(opt) => {
            table.options.meta?.updateData(row.index, 'operationId', opt.id);
            if (opt.dept) table.options.meta?.updateData(row.index, 'department', opt.dept);
          }}
          options={OPERATIONS}
          isActive={isActive}
          placeholder="Select Op..."
        />
      </div>
    );
  };

  const columns = useMemo(() => [
    { header: 'Seq', accessorKey: 'sequence', cell: ReadOnlyCell, size: 60 },
    { header: 'Operation', accessorKey: 'operation', cell: OperationCell, size: 150 },
    { header: 'Dept', accessorKey: 'department', cell: EditableCell, size: 100 },
    { header: 'Machine', accessorKey: 'machine', cell: MachineCell, size: 180 },
    { header: 'Group', accessorKey: 'machineGroup', cell: EditableCell, size: 100 },
    { header: 'Skill', accessorKey: 'skill', cell: EditableCell, size: 80 },
    { header: 'Setup (Hr)', accessorKey: 'setupTime', cell: EditableCell, size: 80 },
    { header: 'Run (Hr)', accessorKey: 'machineTime', cell: EditableCell, size: 80 },
    { header: 'Insp?', accessorKey: 'inspectionReq', cell: EditableCell, size: 60 },
    { header: 'Tool', accessorKey: 'toolUsed', cell: EditableCell, size: 120 },
    { header: 'Fixture', accessorKey: 'fixtureUsed', cell: EditableCell, size: 120 },
    { header: 'Outsource', accessorKey: 'outsource', cell: EditableCell, size: 80 },
    { header: 'Remarks', accessorKey: 'remarks', cell: EditableCell, size: 150 },
  ], [isApproved]);

  const activeRow = selectedRows.length === 1 ? selectedRows[0] : null;

  if (isLoading) {
    return <div className="p-8 text-zinc-500">Loading Routing...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex items-center gap-4 px-4 pt-4 hide-on-print">
        <button onClick={() => {
          if (projectId) {
            router.push(`/projects/${projectId.replace('PRJ-', '')}/engineering`);
          } else {
            router.push('/engineering/routing');
          }
        }} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/[0.02] hover:bg-white/[0.06] rounded-md transition-all flex items-center justify-center border border-white/[0.04]" title={projectId ? "Back to Project" : "Back to Routing"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{isNew ? 'New Machine Routing' : `Routing: ${routingHeader?.routingNumber || routingId}`}</h2>
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
          Routing Sequence
        </button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Related Documents</button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Attachments</button>
        <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">History</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 h-full flex flex-col pt-2 pb-2 px-2 min-w-0">
          {activeTab === 'items' && (
            <EditableDataGrid 
              columns={columns} 
              data={routingItems} 
              onDataChange={handleDataChange}
              getNewRow={getNewRoutingRow}
              summary={summary}
              enableDnd={!isApproved}
              onRowFocus={(row) => setSelectedRows([row])}
              readOnly={isApproved}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoutingFeaturePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <RoutingFormContent routingId={resolvedParams.id} projectId={projectId} />
    </Suspense>
  );
}
