"use client";

import { AlertTriangle, Clock, Factory, Package, ArrowRight, Activity, TrendingUp } from "lucide-react";

interface MissionControlProps {
  projects: any[];
  onSelectProject: (proj: any) => void;
}

export function MissionControl({ projects, onSelectProject }: MissionControlProps) {
  // Aggregate data for the Mission Control dashboard
  const activeProjects = projects.filter(p => p.status !== "COMPLETED");
  const delayedProjects = activeProjects.filter(p => new Date(p.deliveryDate) < new Date());
  
  return (
    <div className="flex-1 h-full overflow-y-auto pl-32 pr-12 py-12 pb-32 animate-fade-in">
      
      {/* Massive Typographical Header */}
      <div className="mb-16">
        <h3 className="text-blue-500 text-tiny font-bold tracking-[0.2em] mb-4 flex items-center">
          <Activity className="h-4 w-4 mr-2" />
          SYSTEM ONLINE
        </h3>
        <h1 className="text-h1 text-white mb-2 tracking-tight">Good Morning.</h1>
        <h2 className="text-h2 text-slate-400 font-normal">Here is today's factory status.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Core Metrics via Typographical layout rather than boxed cards */}
        <div className="col-span-1 xl:col-span-2 grid grid-cols-2 gap-8">
          
          <MetricBlock 
            label="Active Projects" 
            value={activeProjects.length} 
            subValue={`${projects.length} Total Projects`}
            color="text-blue-400"
          />
          
          <MetricBlock 
            label="Delayed Commitments" 
            value={delayedProjects.length} 
            subValue="Requires Immediate Attention"
            color={delayedProjects.length > 0 ? "text-red-400" : "text-emerald-400"}
          />
          
          <MetricBlock 
            label="Today's Material Arrivals" 
            value="3" 
            subValue="Pending GRN Processing"
            color="text-emerald-400"
          />
          
          <MetricBlock 
            label="Live Machine Utilization" 
            value="82%" 
            subValue="12 of 14 VMCs Active"
            color="text-purple-400"
          />
        </div>

        {/* Right side contextual alerts */}
        <div className="glass-panel p-8 flex flex-col justify-between">
          <div>
            <h4 className="text-tiny text-slate-500 mb-6">CRITICAL ALERTS</h4>
            <div className="space-y-4">
              {delayedProjects.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-start group cursor-pointer" onClick={() => onSelectProject(p)}>
                  <div className="mt-1 h-2 w-2 rounded-full bg-red-500 mr-3 group-hover:animate-ping"></div>
                  <div>
                    <p className="text-white text-small font-medium group-hover:text-blue-400 transition-colors">{p.projectNumber}</p>
                    <p className="text-slate-400 text-tiny">Delivery overdue by {Math.floor((new Date().getTime() - new Date(p.deliveryDate).getTime()) / (1000 * 3600 * 24))} days</p>
                  </div>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="flex items-center text-emerald-400 text-small">
                  <Package className="h-4 w-4 mr-2" /> All deliveries are on track.
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            <button className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors">
              View All Factory Alerts <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Timeline Overview */}
      <div className="mt-16">
        <h4 className="text-tiny text-slate-500 mb-6">PROJECT FLIGHT PATH</h4>
        <div className="space-y-4">
          {activeProjects.map(proj => (
            <div 
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="glass-panel p-4 px-6 flex items-center justify-between cursor-pointer group"
            >
              <div className="w-1/4">
                <p className="text-white font-medium text-lg">{proj.projectNumber}</p>
                <p className="text-slate-400 text-sm">{proj.partName}</p>
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider flex items-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mr-2 animate-pulse"></div>
                  STAGE: {proj.currentStage}
                </div>
              </div>

              <div className="w-1/4 text-right flex flex-col items-end">
                <p className="text-slate-300 text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Due {new Date(proj.deliveryDate).toLocaleDateString()}
                </p>
                <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[45%]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, subValue, color }: { label: string, value: string | number, subValue: string, color: string }) {
  return (
    <div className="group border-l-2 border-white/10 pl-6 hover:border-blue-500 transition-colors duration-300">
      <p className="text-tiny text-slate-500 mb-2 group-hover:text-slate-400 transition-colors">{label}</p>
      <p className={`text-h2 font-bold ${color} mb-1 drop-shadow-lg`}>{value}</p>
      <p className="text-slate-400 text-sm">{subValue}</p>
    </div>
  );
}
