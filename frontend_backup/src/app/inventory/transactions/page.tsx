'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';

export default function InventoryTransactions() {
  const columns = useMemo(() => [
    { header: 'Date', accessorKey: 'date', size: 90 },
    { header: 'Time', accessorKey: 'time', size: 70 },
    { header: 'Type', accessorKey: 'type', size: 100 },
    { header: 'Ref Doc', accessorKey: 'ref', size: 120 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Material', accessorKey: 'material', size: 180 },
    { header: 'Batch', accessorKey: 'batch', size: 100 },
    { header: 'Heat No', accessorKey: 'heatNo', size: 100 },
    { header: 'Warehouse', accessorKey: 'warehouse', size: 100 },
    { header: 'Rack/Bin', accessorKey: 'rackBin', size: 80 },
    { header: 'Qty In', accessorKey: 'qtyIn', size: 80 },
    { header: 'Qty Out', accessorKey: 'qtyOut', size: 80 },
    { header: 'Balance', accessorKey: 'balance', size: 100 },
    { header: 'User', accessorKey: 'user', size: 100 },
    { header: 'Remarks', accessorKey: 'remarks', size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      date: '2026-07-08', 
      time: '10:30',
      type: 'GRN', 
      ref: 'GRN/2026/012', 
      project: '-',
      material: 'Aluminium Block (RM-001)', 
      batch: 'B-40501',
      heatNo: 'HT-9921',
      warehouse: 'Main',
      rackBin: 'R-14/B-02',
      qtyIn: '50 Kg', 
      qtyOut: '-', 
      balance: '450 Kg',
      user: 'Store Admin',
      remarks: 'Inspected OK'
    },
    { 
      id: '2', 
      date: '2026-07-08', 
      time: '11:15',
      type: 'MATERIAL ISSUE', 
      ref: 'MI/2026/045', 
      project: 'PRJ-901',
      material: 'Aluminium Block (RM-001)', 
      batch: 'B-40501',
      heatNo: 'HT-9921',
      warehouse: 'Main',
      rackBin: 'R-14/B-02',
      qtyIn: '-', 
      qtyOut: '12 Kg', 
      balance: '438 Kg',
      user: 'Prod Admin',
      remarks: 'Rough Milling'
    },
  ], []);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Inventory Ledger</h2>
            <p className="text-zinc-400 text-xs mt-1">Full transaction history with running balances</p>
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
