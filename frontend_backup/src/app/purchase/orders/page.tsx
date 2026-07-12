'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { PurchaseOrderFormContent } from './[id]/page';
import { usePurchaseOrders, useDeletePurchaseOrder, useGeneratePoFromShortage } from '@/hooks/useProcurement';
import { LoadingState } from '@/components/ui/LoadingState';
import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToast } from '@/components/ui/Toast';
import { Zap } from 'lucide-react';

export default function PurchaseOrderList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const { toast } = useToast();
  
  const { data: posRes, isLoading } = usePurchaseOrders(projectId || '');
  const deletePoMutation = useDeletePurchaseOrder(projectId || '');
  const generatePoMutation = useGeneratePoFromShortage(projectId || '');

  const pathname = usePathname();
  const activePoId = searchParams.get('poId');

  const openDrawer = (id: string, overrideProject?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('poId', id);
    if (overrideProject) params.set('project', overrideProject);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('poId');
    router.push(`${pathname}?${params.toString()}`);
  };

  useStandardToolbar({
    featureId: 'purchase-order-list',
    onNew: () => {
      const id = Math.floor(Math.random() * 1000).toString();
      openDrawer(id, projectId || undefined);
    },
    onRefresh: () => toast('info', 'Refreshed', 'PO list updated'),
    onPrint: () => window.print(),
    onExport: () => toast('info', 'Export', 'Exporting PO list'),
  });

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const columns = useMemo(() => [
    { header: 'PO No.', accessorKey: 'poNumber', size: 150 },
    { header: 'Date', accessorKey: 'poDate', size: 120 },
    { header: 'Status', accessorKey: 'status', size: 100 },
    { header: 'Total Value', accessorKey: 'totalAmount', size: 120 },
    { header: 'Remarks', accessorKey: 'remarks', size: 200 },
  ], []);

  const data = useMemo(() => {
    if (!posRes?.data) return [];
    return posRes.data.map((po: any) => ({
      id: po.id,
      poNumber: po.poNumber,
      poDate: new Date(po.createdAt).toISOString().split('T')[0],
      status: po.status,
      totalAmount: `₹ ${po.totalAmount}`,
      remarks: po.remarks || '-',
    }));
  }, [posRes]);

  const handleRowClick = (row: any) => {
    openDrawer(row.id, projectId || undefined);
  };

  const handleRowSelect = (row: any) => {
    setSelectedRowId(row.id);
  };

  const handleDelete = async () => {
    if (!selectedRowId) return;
    if (confirm('Are you sure you want to delete this Purchase Order?')) {
      await deletePoMutation.mutateAsync(selectedRowId);
      setSelectedRowId(null);
    }
  };

  const handleGenerateFromShortage = async () => {
    if (!projectId) {
      toast('warning', 'No Project', 'Please select a project first.');
      return;
    }
    await generatePoMutation.mutateAsync();
  };

  if (isLoading) return <LoadingState message="Loading Purchase Orders..." />;

  return (
    <>
      <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Purchase Orders</h2>
            <p className="text-zinc-400 text-xs mt-1">Double click a row to view/edit</p>
          </div>
          <div>
            <button 
              onClick={handleGenerateFromShortage}
              disabled={generatePoMutation.isPending}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-md text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Zap size={14} />
              {generatePoMutation.isPending ? 'Generating...' : 'Auto-Generate from BOM'}
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <PremiumDrawer 
        isOpen={!!activePoId} 
        onClose={closeDrawer} 
        title={activePoId && !activePoId.startsWith('PO') ? 'Create Purchase Order' : 'Edit Purchase Order'}
        subtitle="Manage purchasing details and terms"
        width="full"
      >
        {activePoId && <PurchaseOrderFormContent poId={activePoId} projectId={projectId} />}
      </PremiumDrawer>
    </>
  );
}
