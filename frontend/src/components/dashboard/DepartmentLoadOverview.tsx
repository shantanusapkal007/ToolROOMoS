import React from 'react';
import { Layers, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export const DepartmentLoadOverview = () => {
  const departments = [
    { 
      name: 'Machine Shop', 
      load: 85, 
      color: 'from-blue-500 to-indigo-500', 
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-900',
      iconText: 'text-blue-600',
      alert: false 
    },
    { 
      name: 'Press Shop', 
      load: 45, 
      color: 'from-emerald-400 to-teal-500', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-900',
      iconText: 'text-emerald-600',
      alert: false 
    },
    { 
      name: 'Fabrication', 
      load: 92, 
      color: 'from-red-500 to-rose-600', 
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-900',
      iconText: 'text-red-600',
      alert: true 
    },
    { 
      name: 'Assembly & Test', 
      load: 60, 
      color: 'from-purple-500 to-fuchsia-500', 
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-900',
      iconText: 'text-purple-600',
      alert: false 
    },
  ];

  return (
    <div className="glass-panel spotlight-card p-8 mb-8 relative overflow-hidden group/matrix transition-all duration-500 hover:shadow-elevation">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity duration-700 opacity-50 group-hover/matrix:opacity-100" />

      <div className="flex justify-between items-center border-b border-black/5 pb-6 mb-6 relative z-10">
        <h2 className="text-sm font-bold text-zinc-900 tracking-widest uppercase flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mr-3 shadow-sm">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          Department Workload Matrix
        </h2>
        <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-zinc-500 bg-black/[0.02] px-3 py-1.5 rounded-lg border border-black/5">
          <Activity className="w-3.5 h-3.5 mr-1" />
          Live Telemetry
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
        {departments.map(dept => (
          <div 
            key={dept.name} 
            className="flex flex-col bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-floating hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Soft background tint on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${dept.bg} pointer-events-none`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <span className="text-zinc-900 font-bold text-sm tracking-tight leading-tight max-w-[70%]">{dept.name}</span>
              {dept.alert ? (
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-sm border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              )}
            </div>

            <div className="mt-auto relative z-10">
              <div className="flex items-end justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capacity</span>
                <span className={`text-2xl font-black tracking-tighter leading-none ${dept.alert ? 'text-red-600' : 'text-zinc-900'}`}>
                  {dept.load}<span className="text-sm text-zinc-400 font-bold ml-0.5">%</span>
                </span>
              </div>
              
              {/* Premium Progress Bar */}
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden shadow-inner border border-zinc-200/60 p-0.5 relative">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${dept.color} shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] relative overflow-hidden`} 
                  style={{ width: `${dept.load}%` }}
                >
                  {/* Subtle inner glare */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-full" />
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-3">
                {dept.alert ? (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-red-50 border border-red-100 py-1 px-2 rounded-md inline-block">
                    Critical Load
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    Optimal Range
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
