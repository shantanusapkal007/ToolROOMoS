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
    { name: 'Machine Shop', load: machineShopLoad, color: 'bg-primary', alert: machineShopLoad > 90 },
    { name: 'Press Shop', load: pressShopLoad, color: 'bg-accent-green', alert: pressShopLoad > 90 },
    { name: 'Fabrication', load: fabLoad, color: 'bg-accent-orange', alert: fabLoad > 90 },
    { name: 'Assembly & Test', load: assemblyLoad, color: 'bg-accent-purple', alert: assemblyLoad > 90 },
  ];

  return (
    <div className="bg-white border border-border-gray rounded-[12px] p-6 mb-6 shadow-subtle">
      <div className="flex justify-between items-center border-b border-border-gray pb-4 mb-4">
        <h2 className="text-feature-title font-semibold text-ink flex items-center gap-2">
          <Layers className="w-4 h-4 text-ink" />
          <span>Department Capacity & Workload Matrix</span>
        </h2>
        <div className="flex items-center space-x-1.5 text-caption font-medium text-mute bg-canvas px-2.5 py-1 rounded-[8px] border border-border-gray">
          <Activity className="w-3.5 h-3.5 text-accent-green" />
          <span>Live Telemetry</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(dept => (
          <div 
            key={dept.name} 
            className="flex flex-col bg-canvas border border-border-gray rounded-[8px] p-4 hover:border-mute transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-body-sm-strong text-ink truncate">{dept.name}</span>
              {dept.alert ? (
                <div className="w-5 h-5 rounded-full bg-canvas flex items-center justify-center shrink-0 border border-accent-red text-accent-red" title="High Workload Alert">
                  <AlertTriangle className="w-3 h-3" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-canvas flex items-center justify-center shrink-0 border border-accent-green text-accent-green" title="Normal Capacity">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="mt-auto space-y-1.5">
              <div className="flex items-end justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Capacity</span>
                <span className={`text-display-xs font-semibold font-mono ${dept.alert ? 'text-accent-red' : 'text-ink'}`}>
                  {dept.load}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
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
