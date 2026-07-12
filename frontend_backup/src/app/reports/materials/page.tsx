'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function MaterialConsumptionReport() {
  
  const UtilizationCell = ({ getValue }: any) => {
    const val = parseFloat(getValue());
    const color = val >= 85 ? 'text-green-400 font-black' : val >= 70 ? 'text-blue-400 font-bold' : 'text-red-400 font-bold';
    return <span className={color}>{val}%</span>;
  };

  const columns = useMemo(() => [
    { header: 'Material', accessorKey: 'material', size: 250 },
    { header: 'Purchased Qty', accessorKey: 'purchased', size: 120 },
    { header: 'Issued to Floor', accessorKey: 'issued', size: 120 },
    { header: 'Consumed in Parts', accessorKey: 'consumed', size: 140 },
    { header: 'Remaining Stock', accessorKey: 'remaining', size: 140 },
    { header: 'Generated Off-cut', accessorKey: 'offcut', size: 140 },
    { header: 'Generated Scrap', accessorKey: 'scrap', size: 120 },
    { header: 'Utilization', accessorKey: 'utilization', cell: UtilizationCell, size: 100 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      material: 'EN31 Block (100x100x50)',
      purchased: '500 kg',
      issued: '250 kg',
      consumed: '210 kg',
      remaining: '250 kg',
      offcut: '25 kg',
      scrap: '15 kg',
      utilization: '84.0',
    },
    { 
      id: '2', 
      material: 'P20 Steel Plate (200x200x25)',
      purchased: '1200 kg',
      issued: '1200 kg',
      consumed: '1100 kg',
      remaining: '0 kg',
      offcut: '80 kg',
      scrap: '20 kg',
      utilization: '91.6',
    },
    { 
      id: '3', 
      material: 'Aluminum 6061 Bar (D50)',
      purchased: '100 kg',
      issued: '50 kg',
      consumed: '30 kg',
      remaining: '50 kg',
      offcut: '5 kg',
      scrap: '15 kg',
      utilization: '60.0',
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Material Consumption & Yield</h2>
            <p className="text-zinc-400 text-xs mt-1">Track material utilization, scrap generation, and off-cut recovery</p>
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
