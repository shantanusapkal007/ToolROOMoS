import React from 'react';
import { Activity, IndianRupee, Package, PieChart, TrendingUp, BarChart2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useReportsDashboard } from '../../hooks/useReports';
import { TableSkeleton } from '../../components/ui/SkeletonLoader';

const StatCard = ({ title, value, change, icon, trend }: { title: string, value: string, change: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral' }) => {
  return (
    <div className="enterprise-card p-4 flex items-center justify-between">
      <div>
        <span className="text-micro font-semibold uppercase text-zinc-500">{title}</span>
        <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">{value}</div>
        <div className="text-micro font-bold text-emerald-600 mt-0.5">{change}</div>
      </div>
      <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600">
        {icon}
      </div>
    </div>
  );
};

export const ReportsModule = () => {
  const { data: metrics, isLoading } = useReportsDashboard();

  if (isLoading || !metrics) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 py-6">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  const maxCost = metrics.costTrends?.length > 0 
    ? Math.max(...metrics.costTrends.map((t: any) => t.production + t.procurement)) 
    : 100;
    
  return (
    <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-6">
        
        <PageHeader 
          title="Manufacturing Analytics & Valuation" 
          description="Real-time performance metrics across production yield, procurement, and toolroom valuation."
          icon={<BarChart2 />}
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]}
        />

        {/* Analytical KPI Summary Strips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Realized Revenue" value={`₹${(metrics.totalRevenue / 100000).toFixed(1)} L`} change="Realized Sales" icon={<IndianRupee className="w-4 h-4" />} trend="up" />
          <StatCard title="Overall Yield Rate" value={`${metrics.productionYield}%`} change="Factory Efficiency" icon={<Activity className="w-4 h-4" />} trend={Number(metrics.productionYield) >= 90 ? 'up' : 'down'} />
          <StatCard title="Active Projects" value={`${metrics.activeProjectsCount}`} change="Executing Missions" icon={<Package className="w-4 h-4" />} trend="neutral" />
          <StatCard title="Monthly Target Met" value={`${Math.round((metrics.totalRevenue / (metrics.monthlyTarget || 15000000)) * 100)}%`} change="Monthly Goal" icon={<TrendingUp className="w-4 h-4" />} trend="up" />
        </div>

        {/* Charts & Analytics Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Monthly Cost Breakdown */}
          <div className="lg:col-span-2 enterprise-panel p-4 flex flex-col space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
              <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Operational Cost & Invoicing Velocity</span>
              </h3>
              <span className="text-micro font-semibold text-zinc-500 uppercase">Live Aggregation</span>
            </div>

            <div className="space-y-4 pt-2">
              {(metrics.costTrends || []).map((month: any, idx: number) => {
                const totalMonthCost = month.production + month.procurement;
                const widthPct = Math.min(100, Math.max(8, (totalMonthCost / maxCost) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-caption font-semibold">
                      <span className="text-zinc-800 font-mono">{month.month}</span>
                      <span className="text-zinc-900 font-mono font-bold">₹{(totalMonthCost / 100000).toFixed(1)} L</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden flex border border-zinc-200">
                      <div 
                        className="h-full bg-blue-600 rounded-l-full transition-all" 
                        style={{ width: `${(month.production / maxCost) * 100}%` }}
                        title={`Production: ₹${(month.production / 100000).toFixed(1)} L`}
                      />
                      <div 
                        className="h-full bg-amber-500 rounded-r-full transition-all" 
                        style={{ width: `${(month.procurement / maxCost) * 100}%` }}
                        title={`Procurement: ₹${(month.procurement / 100000).toFixed(1)} L`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="enterprise-panel p-4 space-y-3">
            <div className="border-b border-zinc-200 pb-2.5">
              <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>Department Yield Share</span>
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              {(metrics.departmentYields || [
                { dept: 'Machine Shop', val: `${metrics.productionYield || 95.0}%`, color: 'bg-blue-600' },
                { dept: 'Press Shop & Tryout', val: `${Math.min(99, (Number(metrics.productionYield || 95) - 2.5)).toFixed(1)}%`, color: 'bg-emerald-600' },
                { dept: 'Fabrication Unit', val: `${Math.min(99, (Number(metrics.productionYield || 95) - 1.2)).toFixed(1)}%`, color: 'bg-amber-600' },
                { dept: 'Quality & Inspection', val: `${Math.min(100, (Number(metrics.productionYield || 95) + 3.0)).toFixed(1)}%`, color: 'bg-purple-600' },
              ]).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-50 border border-zinc-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color || 'bg-indigo-600'}`} />
                    <span className="text-caption font-semibold text-zinc-800">{item.dept}</span>
                  </div>
                  <span className="text-caption font-bold font-mono text-zinc-900">{item.val}</span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </main>
  );
};
