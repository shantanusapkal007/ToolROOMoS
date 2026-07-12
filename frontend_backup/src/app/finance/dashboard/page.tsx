'use client';

import React from 'react';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import { UniversalTable } from '@/components/tables/UniversalTable';

import { useDashboardSummary } from '@/hooks/useFinance';

export default function FinanceDashboard() {
  const { data, isLoading } = useDashboardSummary();
  const summary = data?.data || {
    kpis: { totalReceivables: 0, totalPayables: 0, outstanding: 0, avgMargin: '0%' },
    watchlist: [],
    upcomingPayments: []
  };

  const formatCurrency = (val: number) => {
    return '₹ ' + val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const kpis = [
    { label: 'Total Receivables', value: formatCurrency(summary.kpis.totalReceivables), icon: <IndianRupee className="w-4 h-4 text-blue-400" /> },
    { label: 'Total Payables', value: formatCurrency(summary.kpis.totalPayables), icon: <Briefcase className="w-4 h-4 text-purple-400" /> },
    { label: 'Outstanding (Overdue)', value: formatCurrency(summary.kpis.outstanding), icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    { label: 'Avg Project Margin', value: summary.kpis.avgMargin, icon: <ArrowUpRight className="w-4 h-4 text-green-400" /> },
  ];

  const highCostProjects = summary.watchlist;
  const upcomingPayments = summary.upcomingPayments;

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        </div>
      <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {kpis.map((kpi, i) => (
            <div key={i} className="glass-panel p-4 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs font-bold uppercase tracking-wider">{kpi.label}</span>
                {kpi.icon}
              </div>
              <div className="text-2xl font-black text-zinc-100">{kpi.value}</div>
            </div>
          ))}
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          
          {/* Projects Margin Watchlist */}
          <div className="glass-panel flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-sm font-semibold text-zinc-100">Project Margin Watchlist</h3>
            </div>
      <div className="flex-1 p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Project</th>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Customer</th>
                    <th className="py-2 px-3 text-right font-bold text-[10px] uppercase tracking-wider text-zinc-500">Actual Cost</th>
                    <th className="py-2 px-3 text-right font-bold text-[10px] uppercase tracking-wider text-zinc-500">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {highCostProjects.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-medium text-zinc-300">{row.projectNumber}</td>
                      <td className="py-3 px-3 text-zinc-400">{row.customerName || 'N/A'}</td>
                      <td className="py-3 px-3 text-right font-bold text-zinc-100">{formatCurrency(row.actualCost)}</td>
                      <td className={`py-3 px-3 text-right font-bold ${row.margin < 15 ? 'text-amber-400' : 'text-green-400'}`}>
                        {row.marginStr}
                      </td>
                    </tr>
                  ))}
                  {highCostProjects.length === 0 && !isLoading && (
                    <tr><td colSpan={4} className="py-4 text-center text-zinc-500">No project margin data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Cash Flow */}
          <div className="glass-panel flex flex-col">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-sm font-semibold text-zinc-100">Upcoming Cash Flow</h3>
            </div>
      <div className="flex-1 p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Reference</th>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Entity</th>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Type</th>
                    <th className="py-2 px-3 text-left font-bold text-[10px] uppercase tracking-wider text-zinc-500">Due Date</th>
                    <th className="py-2 px-3 text-right font-bold text-[10px] uppercase tracking-wider text-zinc-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPayments.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-medium text-zinc-300">{row.reference}</td>
                      <td className="py-3 px-3 text-zinc-400">{row.entity}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          row.type === 'Receivable' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                        }`}>{row.type}</span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{new Date(row.dueDate).toLocaleDateString()}</td>
                      <td className={`py-3 px-3 text-right font-bold ${row.type === 'Receivable' ? 'text-blue-400' : 'text-purple-400'}`}>
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                  {upcomingPayments.length === 0 && !isLoading && (
                    <tr><td colSpan={5} className="py-4 text-center text-zinc-500">No upcoming payments</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
