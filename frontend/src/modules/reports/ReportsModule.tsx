import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, DollarSign, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';

const StatCard = ({ title, value, change, icon, trend }: { title: string, value: string, change: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral' }) => {
  return (
    <div className="glass-panel p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-md text-xs font-semibold ${
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
          trend === 'down' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
          'bg-slate-500/10 text-slate-400 border border-slate-500/20'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '->'} {change}
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
};

export const ReportsModule = () => {
  return (
    <div className="flex-1 h-full flex flex-col relative z-0 pl-32 pr-12 animate-fade-in py-12 overflow-y-auto hide-scrollbar">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="Real-time insights across production, procurement, and inventory."
      />

      <div className="mt-8 space-y-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Revenue" value="$2.4M" change="+12.5%" icon={<DollarSign className="w-5 h-5" />} trend="up" />
          <StatCard title="Production Yield" value="94.2%" change="+1.2%" icon={<Activity className="w-5 h-5" />} trend="up" />
          <StatCard title="Active Projects" value="48" change="-3" icon={<Package className="w-5 h-5" />} trend="down" />
          <StatCard title="Inventory Value" value="$850K" change="+5.4%" icon={<PieChart className="w-5 h-5" />} trend="up" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Placeholder */}
          <div className="lg:col-span-2 glass-panel p-6 h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                Production vs Procurement Costs
              </h3>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none focus:ring-1 focus:ring-blue-500">
                <option>Last 6 Months</option>
                <option>This Year</option>
                <option>All Time</option>
              </select>
            </div>
            
            <div className="flex-1 relative flex items-end justify-between px-4 pb-4">
              {/* Fake Bar Chart */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 pt-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-white/5" />
                ))}
              </div>
              
              {[40, 70, 45, 90, 65, 85].map((val, i) => (
                <div key={i} className="relative w-12 flex flex-col items-center group cursor-pointer z-10 h-full justify-end pb-8">
                  <div className="w-full bg-blue-500/80 rounded-t-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:bg-blue-400" style={{ height: `${val}%` }} />
                  <span className="absolute bottom-0 text-xs font-medium text-slate-400 mt-2">M{i+1}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
                    ${(val * 1200).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="glass-panel p-6 h-96 flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center mb-6">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
              Machine Utilization
            </h3>
            <div className="flex-1 space-y-6">
              {[
                { name: 'CNC Milling', percent: 85, color: 'bg-emerald-500' },
                { name: 'Laser Cutter', percent: 62, color: 'bg-amber-500' },
                { name: '3D Printers', percent: 92, color: 'bg-blue-500' },
                { name: 'Assembly Line', percent: 45, color: 'bg-red-500' },
              ].map(machine => (
                <div key={machine.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300 font-medium">{machine.name}</span>
                    <span className="text-white font-bold">{machine.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#0B1018] rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-white/5">
                    <div className={`h-full ${machine.color} shadow-[0_0_10px_currentColor] rounded-full`} style={{ width: `${machine.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
