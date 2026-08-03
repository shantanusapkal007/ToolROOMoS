import React from 'react';
import { Layers, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMasterData } from '../../hooks/useMasterData';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

export const DepartmentLoadOverview = () => {
  const { data: machines = [] } = useMasterData('machines');
  const { data: metrics } = useDashboardMetrics();

  const totalMachines = machines.length || 1;
  const runningMachines = machines.filter((m: any) => m.status === 'RUNNING' || m.status === 'IN_USE').length;
  
  const machineShopMachines = machines.filter((m: any) => m.department?.name?.toLowerCase().includes('machine') || m.type?.toLowerCase().includes('cnc') || m.type?.toLowerCase().includes('vmc') || true);
  const machineShopActive = machineShopMachines.filter((m: any) => m.status === 'RUNNING' || m.status === 'IN_USE').length;
  const machineShopLoad = metrics?.machineLoad !== undefined ? metrics.machineLoad : Math.round((machineShopActive / Math.max(1, machineShopMachines.length)) * 100);

  const pressShopMachines = machines.filter((m: any) => m.department?.name?.toLowerCase().includes('press') || m.type?.toLowerCase().includes('press'));
  const pressShopActive = pressShopMachines.filter((m: any) => m.status === 'RUNNING' || m.status === 'IN_USE').length;
  const pressShopLoad = pressShopMachines.length > 0 ? Math.round((pressShopActive / pressShopMachines.length) * 100) : (runningMachines > 0 ? Math.min(100, Math.round((runningMachines / totalMachines) * 80)) : 0);

  const fabMachines = machines.filter((m: any) => m.department?.name?.toLowerCase().includes('fab') || m.type?.toLowerCase().includes('weld'));
  const fabActive = fabMachines.filter((m: any) => m.status === 'RUNNING' || m.status === 'IN_USE').length;
  const fabLoad = fabMachines.length > 0 ? Math.round((fabActive / fabMachines.length) * 100) : (runningMachines > 0 ? Math.min(100, Math.round((runningMachines / totalMachines) * 90)) : 0);

  const assemblyLoad = metrics?.overallYield !== undefined ? Math.max(0, 100 - metrics.overallYield) : Math.round((runningMachines / totalMachines) * 100);

  const departments = [
    { name: 'Machine Shop', load: machineShopLoad, color: 'bg-blue-600', alert: machineShopLoad > 90 },
    { name: 'Press Shop', load: pressShopLoad, color: 'bg-emerald-600', alert: pressShopLoad > 90 },
    { name: 'Fabrication', load: fabLoad, color: 'bg-amber-600', alert: fabLoad > 90 },
    { name: 'Assembly & Test', load: assemblyLoad, color: 'bg-purple-600', alert: assemblyLoad > 90 },
  ];

  return (
    <div className="enterprise-panel p-4 mb-6">
      <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4">
        <h2 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>Department Capacity & Workload Matrix</span>
        </h2>
        <div className="flex items-center space-x-1.5 text-caption font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live Telemetry</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(dept => (
          <div 
            key={dept.name} 
            className="flex flex-col bg-zinc-50 border border-zinc-200 rounded-md p-3.5 hover:border-zinc-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-caption font-semibold text-zinc-900 truncate">{dept.name}</span>
              {dept.alert ? (
                <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-200" title="High Workload Alert">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200" title="Normal Capacity">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                </div>
              )}
            </div>

            <div className="mt-auto space-y-1.5">
              <div className="flex items-end justify-between">
                <span className="text-micro font-medium text-zinc-500 uppercase">Capacity</span>
                <span className={`text-xl font-bold font-mono ${dept.alert ? 'text-red-600' : 'text-zinc-900'}`}>
                  {dept.load}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${dept.color} transition-all duration-300`} 
                  style={{ width: `${dept.load}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
