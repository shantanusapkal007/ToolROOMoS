'use client';

import React from 'react';
import { ShoppingCart, TrendingUp, AlertTriangle, Clock, CheckCircle, Database, ArrowUpRight } from 'lucide-react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PurchaseDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const handleNavigation = (path: string) => {
    if (projectId) {
      router.push(`${path}?project=${projectId}`);
    } else {
      router.push(path);
    }
  };

  const kpiData = [
    { label: "Total PO Value", value: "₹ 8,45,000", icon: <Database />, color: "text-blue-400" },
    { label: "Active POs", value: "45", icon: <ShoppingCart />, color: "text-zinc-100" },
    { label: "Pending Approvals", value: "8", icon: <Clock />, color: "text-amber-400" },
    { label: "Delayed Deliveries", value: "12", icon: <AlertTriangle />, color: "text-red-400" },
    { label: "GRN Completed", value: "24", icon: <CheckCircle />, color: "text-green-400" },
  ];

  const recentOrders = [
    { id: '1', date: '2026-07-08', poNumber: 'PO/2026/089', vendor: 'ABC Steel Ltd', value: '₹ 1,50,000', status: 'Approved' },
    { id: '2', date: '2026-07-07', poNumber: 'PO/2026/088', vendor: 'XYZ Tools', value: '₹ 45,000', status: 'Pending' },
  ];

  const columns = [
    { header: 'Date', accessorKey: 'date', size: 120 },
    { header: 'PO Number', accessorKey: 'poNumber', size: 150 },
    { header: 'Vendor', accessorKey: 'vendor', size: 200 },
    { header: 'Value', accessorKey: 'value', size: 120 },
    { header: 'Status', accessorKey: 'status', size: 120 },
  ];

  return (
    <>
      <div className="h-full flex flex-col gap-4 p-4 overflow-auto custom-scrollbar">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 shrink-0">
          {kpiData.map((kpi, i) => (
            <div key={i} className="glass-panel p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-medium uppercase tracking-wider">{kpi.label}</span>
                {React.cloneElement(kpi.icon as React.ReactElement<{ className?: string }>, { className: 'w-3 h-3' })}
              </div>
              <div className={`text-lg font-bold ${kpi.color}`}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="glass-panel flex flex-col flex-1 min-h-[300px]">
          <div className="p-3 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-100">Recent Purchase Orders</h3>
            <button onClick={() => handleNavigation('/purchase/orders')} className="text-xs text-blue-400 font-bold hover:text-blue-300">View All</button>
          </div>
          <div className="flex-1 min-h-0">
            <UniversalTable columns={columns} data={recentOrders} />
          </div>
        </div>

        {/* Workbenches Grid */}
        <div className="mt-4">
          <h2 className="text-lg font-bold text-white mb-4">Purchasing Workbenches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel p-4 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all border border-white/[0.04]">
              <div>
                <h4 className="font-bold text-zinc-200">Purchase Orders</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Manage vendor POs.</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => handleNavigation('/purchase/orders')} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1">
                  Open <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="glass-panel p-4 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all border border-white/[0.04]">
              <div>
                <h4 className="font-bold text-zinc-200">Vendor Bills</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Process vendor invoices.</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => handleNavigation('/purchase/bills')} className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1">
                  Open <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
