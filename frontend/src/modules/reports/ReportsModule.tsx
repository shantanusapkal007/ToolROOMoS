import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, IndianRupee, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

import { useReportsDashboard } from '../../hooks/useReports';

const StatCard = ({ title, value, change, icon, trend }: { title: string, value: string, change: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral' }) => {
  return (
    <div className="glass-panel p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center text-zinc-600">
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-black tracking-widest uppercase ${
          trend === 'up' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 
          trend === 'down' ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm' : 
          'bg-zinc-50 text-zinc-700 border border-zinc-200 shadow-sm'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '->'} {change}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

export const ReportsModule = () => {
  const { data: metrics, isLoading } = useReportsDashboard();

  if (isLoading || !metrics) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black/10"></div>
        <div className="text-zinc-500 mt-4 text-sm font-bold tracking-widest uppercase">Aggregating Metrics...</div>
      </div>
    );
  }

  // Find max for scaling the chart
  const maxCost = metrics.costTrends?.length > 0 
    ? Math.max(...metrics.costTrends.map((t: any) => t.production + t.procurement)) 
    : 100; // Default to 100 to avoid division by zero
    
  return (
    <div className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem] pr-8 animate-fade-in py-8 overflow-y-auto hide-scrollbar">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="Real-time insights across production, procurement, and inventory."
      />

      <div className="mt-8 space-y-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value={`₹${(metrics.totalRevenue / 1000000).toFixed(2)}M`} change="Live" icon={<IndianRupee className="w-5 h-5" />} trend="up" />
          <StatCard title="Production Yield" value={`${metrics.productionYield}%`} change="Live" icon={<Activity className="w-5 h-5" />} trend={Number(metrics.productionYield) >= 90 ? 'up' : 'down'} />
          <StatCard title="Active Projects" value={`${metrics.activeProjectsCount}`} change="Live" icon={<Package className="w-5 h-5" />} trend="neutral" />
          <StatCard title="Inventory Value" value={`₹${(metrics.inventoryValue / 1000).toFixed(1)}K`} change="Live" icon={<PieChart className="w-5 h-5" />} trend="up" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Cost Trends (Last 6 Months)
              </h3>
              <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-wider">
                 <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-sm mr-2" /> Production</div>
                 <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 rounded-sm mr-2" /> Procurement</div>
              </div>
            </div>
            
            <div className="flex-1 relative flex items-end justify-between px-4 pb-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-black/5" />
                ))}
              </div>
              
              {metrics.costTrends?.map((trend: any, i: number) => {
                const total = trend.production + trend.procurement;
                const heightPct = total === 0 ? 0 : Math.max(5, (total / maxCost) * 100);
                const prodPct = total === 0 ? 0 : (trend.production / total) * 100;
                const procPct = total === 0 ? 0 : (trend.procurement / total) * 100;

                return (
                  <div key={i} className="relative w-16 flex flex-col items-center group cursor-pointer z-10 h-full justify-end pb-8">
                    <div className="w-full rounded-t-sm transition-all duration-300 flex flex-col justify-end overflow-hidden" style={{ height: `${heightPct}%` }}>
                       <div className="w-full bg-blue-500/80 hover:bg-blue-400 transition-colors" style={{ height: `${prodPct}%` }} />
                       <div className="w-full bg-amber-500/80 hover:bg-amber-400 transition-colors" style={{ height: `${procPct}%` }} />
                    </div>
                    <span className="absolute bottom-0 text-xs font-medium text-zinc-500 mt-2">{trend.month}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-zinc-900 text-xs px-3 py-2 rounded-xl pointer-events-none whitespace-nowrap z-50 shadow-md border border-zinc-200">
                      <div className="font-black mb-1">Total: ₹{total.toLocaleString()}</div>
                      <div className="text-blue-600 font-bold">Prod: ₹{trend.production.toLocaleString()}</div>
                      <div className="text-amber-600 font-bold">Proc: ₹{trend.procurement.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              
              {(!metrics.costTrends || metrics.costTrends.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  No cost data in last 6 months.
                </div>
              )}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="glass-panel p-6 h-96 flex flex-col">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center mb-6">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Machine Utilization
            </h3>
            <div className="flex-1 space-y-6 overflow-y-auto pr-2 hide-scrollbar">
              {metrics.machineUtilization?.map((machine: any, i: number) => {
                const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
                const color = colors[i % colors.length];
                
                return (
                  <div key={machine.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600 font-medium">{machine.name}</span>
                      <span className="text-zinc-900 font-bold">{machine.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F4F4F6] rounded-full overflow-hidden shadow-inner border border-black/5">
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${machine.percent}%` }} />
                    </div>
                  </div>
                );
              })}
              
              {(!metrics.machineUtilization || metrics.machineUtilization.length === 0) && (
                <div className="text-slate-500 text-sm text-center py-8">
                  No machine utilization data.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
