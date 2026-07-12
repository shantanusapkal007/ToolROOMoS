'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function VendorBillList({ projectId }: { projectId?: string }) {
  const router = useRouter();
  
  const columns = useMemo(() => [
    { header: 'Bill No.', accessorKey: 'billNo', size: 150 },
    { header: 'Invoice No.', accessorKey: 'invoiceNo', size: 150 },
    { header: 'Date', accessorKey: 'date', size: 120 },
    { header: 'Vendor', accessorKey: 'vendor', size: 200 },
    { header: 'Matching Status', accessorKey: 'matching', size: 120 },
    { header: 'Total Value', accessorKey: 'total', size: 120 },
  ], []);

  const data = useMemo(() => [
    { id: '1', billNo: 'VB/2026/012', invoiceNo: 'INV-4451', date: '2026-07-08', vendor: 'Global Steel Suppliers Corp', matching: 'MATCHED', total: '₹ 45,000' },
    { id: '2', billNo: 'VB/2026/013', invoiceNo: 'PF-908', date: '2026-07-08', vendor: 'Precision Fasteners', matching: 'MISMATCH', total: '₹ 14,500' },
  ], []);

  const handleRowDoubleClick = (row: any) => {
    if (projectId) {
      router.push(`/purchase/vendor-bills/${row.id}?project=${projectId}`);
    } else {
      router.push(`/purchase/vendor-bills/${row.id}`);
    }
  };

  return (
    <>
            <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Vendor Bills</h2>
            <p className="text-zinc-400 text-xs mt-1">Double click a row to view/edit</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
            onRowDoubleClick={handleRowDoubleClick} 
          />
        </div>
      </div>
    </>
  );
}
