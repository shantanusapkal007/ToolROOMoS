'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter } from 'next/navigation';

export default function DeliveryChallans({ projectId }: { projectId?: string }) {
  const router = useRouter();

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Dispatched' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  status === 'Draft' ? 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' :
                  'text-green-400 bg-green-400/10 border-green-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Challan No', accessorKey: 'challanNo', size: 120 },
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Customer', accessorKey: 'customer', size: 150 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Vehicle', accessorKey: 'vehicle', size: 120 },
    { header: 'LR Number', accessorKey: 'lrNo', size: 120 },
    { header: 'Packages', accessorKey: 'packages', size: 90 },
    { header: 'Weight', accessorKey: 'weight', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      challanNo: 'DC/26-27/045',
      date: '2026-07-08',
      customer: 'Tata Motors',
      project: 'PRJ-901', 
      vehicle: 'MH 12 AB 1234',
      lrNo: 'LR-99882211',
      packages: '2 Boxes',
      weight: '45.0 kg',
      status: 'Dispatched'
    },
    { 
      id: '2', 
      challanNo: 'DC/26-27/046',
      date: '2026-07-09',
      customer: 'Mahindra',
      project: 'PRJ-882', 
      vehicle: 'TBD',
      lrNo: '-',
      packages: '1 Pallet',
      weight: '450.0 kg',
      status: 'Draft'
    }
  ], []);

  const handleRowClick = (row: any) => {
    const projId = projectId || (row.project !== '-' ? row.project : null);
    if (projId) {
      router.push(`/dispatch/challans/${row.id}?project=${projId}`);
    } else {
      router.push(`/dispatch/challans/${row.id}`);
    }
  };

  return (
    <>
            <div className="h-full flex flex-col gap-4 px-4 pb-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Delivery Challans</h2>
            <p className="text-zinc-400 text-xs mt-1">Manage dispatch notes, logistics, and E-Way Bills</p>
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
