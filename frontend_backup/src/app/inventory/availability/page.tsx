'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function StockAvailabilityList({ projectId }: { projectId?: string }) {
  const router = useRouter();

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Available' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'Low Stock' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-red-400 bg-red-400/10 border-red-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${color}`}>
        {status}
      </span>
    );
  };
  
  const columns = useMemo(() => [
    { header: 'Material', accessorKey: 'material', size: 180 },
    { header: 'Grade', accessorKey: 'grade', size: 80 },
    { header: 'Dimensions', accessorKey: 'dimensions', size: 100 },
    { header: 'Current Stock', accessorKey: 'currentStock', size: 100 },
    { header: 'Reserved', accessorKey: 'reserved', size: 80 },
    { header: 'Available', accessorKey: 'available', size: 80 },
    { header: 'Incoming PO', accessorKey: 'incomingPO', size: 100 },
    { header: 'Avail Off-cuts', accessorKey: 'offcuts', size: 100 },
    { header: 'Avg Cost', accessorKey: 'avgCost', size: 80 },
    { header: 'Total Value', accessorKey: 'totalValue', size: 100 },
    { header: 'Reorder Level', accessorKey: 'reorder', size: 100 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: 'MAT-001', 
      material: 'Aluminium Block (RM-001)', 
      grade: '7075', 
      dimensions: '260x190x50', 
      currentStock: '450 Kg', 
      reserved: '50 Kg', 
      available: '400 Kg', 
      incomingPO: '120 Kg', 
      offcuts: '2 Pcs', 
      avgCost: '₹ 1500', 
      totalValue: '₹ 6,75,000', 
      reorder: '100 Kg', 
      status: 'Available' 
    },
    { 
      id: 'MAT-002', 
      material: 'D2 Tool Steel (RM-002)', 
      grade: 'D2', 
      dimensions: 'Round ø50', 
      currentStock: '12 Kg', 
      reserved: '10 Kg', 
      available: '2 Kg', 
      incomingPO: '0', 
      offcuts: '0', 
      avgCost: '₹ 1200', 
      totalValue: '₹ 14,400', 
      reorder: '25 Kg', 
      status: 'Low Stock' 
    }
  ], []);

  const handleRowDoubleClick = (row: any) => {
    if (projectId) {
      router.push(`/inventory/availability/${row.id}?project=${projectId}`);
    } else {
      router.push(`/inventory/availability/${row.id}`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Stock Availability</h2>
            <p className="text-zinc-400 text-xs mt-1">Double click a material for 360° visibility</p>
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
