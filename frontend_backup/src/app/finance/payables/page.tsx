'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function Payables() {
  
  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Paid' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Partial' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' :
                  status === 'Overdue' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const CurrencyCell = ({ getValue }: any) => {
    return <span className="font-medium text-zinc-300">₹ {getValue().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>;
  };

  const OutstandingCell = ({ getValue }: any) => {
    const val = parseFloat(getValue());
    return <span className={`font-bold ${val > 0 ? 'text-red-400' : 'text-green-400'}`}>₹ {val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>;
  };

  const columns = useMemo(() => [
    { header: 'Vendor Bill No', accessorKey: 'billNo', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Vendor', accessorKey: 'vendor', size: 150 },
    { header: 'PO Ref', accessorKey: 'poRef', size: 120 },
    { header: 'Bill Amount', accessorKey: 'billAmount', cell: CurrencyCell, size: 140 },
    { header: 'Paid Amount', accessorKey: 'paidAmount', cell: CurrencyCell, size: 140 },
    { header: 'Outstanding', accessorKey: 'outstanding', cell: OutstandingCell, size: 140 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      billNo: 'VB-2026-088',
      date: '2026-07-01',
      vendor: 'Bohler Steel',
      poRef: 'PO-2026-112',
      billAmount: 180000,
      paidAmount: 0,
      outstanding: 180000,
      status: 'Pending'
    },
    { 
      id: '2', 
      billNo: 'VB-2026-075',
      date: '2026-06-20',
      vendor: 'Sandvik Coromant',
      poRef: 'PO-2026-098',
      billAmount: 45000,
      paidAmount: 25000,
      outstanding: 20000,
      status: 'Partial'
    },
    { 
      id: '3', 
      billNo: 'VB-2026-062',
      date: '2026-05-15',
      vendor: 'Accurate Heat Treaters',
      poRef: 'PO-2026-085',
      billAmount: 12500,
      paidAmount: 12500,
      outstanding: 0,
      status: 'Paid'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-purple-400">Accounts Payable</h2>
            <p className="text-zinc-400 text-xs mt-1">Track vendor bills, partial payments, and upcoming liabilities</p>
          </div>
          <div className="flex gap-4 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Liability</span>
              <span className="text-xl font-black text-red-400">₹ 2,00,000.00</span>
            </div>
          </div>
        </div>
      <div className="flex-1 min-h-0">
          <UniversalTable 
            columns={columns} 
            data={data} 
          />
        </div>
      </div>
    </>
  );
}
