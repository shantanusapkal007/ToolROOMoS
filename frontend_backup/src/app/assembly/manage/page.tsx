'use client';

import { useMemo } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter } from 'next/navigation';

export default function AssemblyManagement({ projectId }: { projectId?: string }) {
  const router = useRouter();

  const StatusCell = ({ getValue }: any) => {
    const status = getValue();
    const color = status === 'Ready' ? 'text-green-400 bg-green-400/10 border-green-400/20' :
                  status === 'In Progress' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  status === 'Part Shortage' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                  status === 'Waiting QC' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                  'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${color}`}>
        {status}
      </span>
    );
  };

  const columns = useMemo(() => [
    { header: 'Assembly No', accessorKey: 'asmNo', size: 120 },
    { header: 'Project', accessorKey: 'project', size: 100 },
    { header: 'Customer', accessorKey: 'customer', size: 150 },
    { header: 'Assembly Name', accessorKey: 'name', size: 200 },
    { header: 'Total Parts', accessorKey: 'total', size: 100 },
    { header: 'Installed', accessorKey: 'installed', size: 100 },
    { header: 'Missing', accessorKey: 'missing', size: 100 },
    { header: 'Target Date', accessorKey: 'target', size: 120 },
    { header: 'Status', accessorKey: 'status', cell: StatusCell, size: 120 },
  ], []);

  const data = useMemo(() => [
    { 
      id: '1', 
      asmNo: 'ASM-2026-041',
      project: 'PRJ-901', 
      customer: 'Tata Motors',
      name: 'Main Die Assembly',
      total: 125,
      installed: 120,
      missing: 5,
      target: '2026-07-20',
      status: 'Part Shortage'
    },
    { 
      id: '2', 
      asmNo: 'ASM-2026-038',
      project: 'PRJ-882', 
      customer: 'Mahindra',
      name: 'Core & Cavity Block',
      total: 45,
      installed: 45,
      missing: 0,
      target: '2026-07-15',
      status: 'Waiting QC'
    },
    { 
      id: '3', 
      asmNo: 'ASM-2026-042',
      project: 'PRJ-901', 
      customer: 'Tata Motors',
      name: 'Ejector System',
      total: 60,
      installed: 0,
      missing: 60,
      target: '2026-07-22',
      status: 'Ready'
    },
  ], []);

  const handleRowClick = (row: any) => {
    const projId = projectId || (row.project !== '-' ? row.project : null);
    if (projId) {
      router.push(`/assembly/manage/${row.id}?project=${projId}`);
    } else {
      router.push(`/assembly/manage/${row.id}`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4">
        <div className="glass-panel p-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Assembly Management</h2>
            <p className="text-zinc-400 text-xs mt-1">Track part shortages, installed components, and assembly progress</p>
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
