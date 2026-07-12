'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter } from 'next/navigation';

export default function Invoices({ projectId }: { projectId?: string }) {
  const router = useRouter();

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Paid' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Sent' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  status === 'Overdue' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Invoice No', accessorKey: 'invNo', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Customer', accessorKey: 'customer', size: 150 },
    { header: 'PO Number', accessorKey: 'poNo', size: 120 },
    { header: 'Challan Ref', accessorKey: 'challanNo', size: 120 },
    { header: 'Amount', accessorKey: 'amount', size: 120 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      invNo: 'INV/26-27/021',
      date: '2026-07-08',
      customer: 'Tata Motors',
      poNo: 'PO-TM-9981', 
      challanNo: 'DC/26-27/045',
      amount: '₹ 12,50,000.00',
      status: 'Sent'
    },
    { 
      id: '2', 
      invNo: 'INV/26-27/020',
      date: '2026-06-15',
      customer: 'Mahindra',
      poNo: 'PO-MH-4421', 
      challanNo: 'DC/26-27/040',
      amount: '₹ 8,75,000.00',
      status: 'Paid'
    },
    { 
      id: '3', 
      invNo: 'INV/26-27/019',
      date: '2026-05-10',
      customer: 'Bajaj Auto',
      poNo: 'PO-BJ-1199', 
      challanNo: 'DC/26-27/038',
      amount: '₹ 4,20,000.00',
      status: 'Overdue'
    }
  ], []);

  const handleRowClick = (row: any) => {
    // If we don't have a projectId prop but we have a row with customer/PO, let's look up project code or use row context if possible. But here, let's assume projectId is passed, or try to infer from project if we have project fields (which this table doesn't, but wait, we can pass it via prop).
    if (projectId) {
      router.push(`/dispatch/invoices/${row.id}?project=${projectId}`);
    } else {
      router.push(`/dispatch/invoices/${row.id}`);
    }
  };

  return (
    <>
            <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Commercial Invoices</h2>
            <p className="text-zinc-400 text-xs mt-1">Manage customer billing and commercial documentation</p>
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
    </>
  );
}
