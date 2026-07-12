'use client';

import { useMemo } from 'react';

export default function MachineLoading({ projectId }: { projectId?: string }) {
  const machines = [
    {
      id: '1',
      name: 'VMC-01 (Haas VF-2)',
      status: 'Running',
      operator: 'Ramesh Kumar',
      utilization: '85%',
      queue: [
        { id: 'j1', project: 'PRJ-901', part: 'Base Plate', op: 'Rough Milling', est: '4.0', status: 'Running', timeframe: 'Today' },
        { id: 'j2', project: 'PRJ-882', part: 'Core Pin', op: 'Finish Milling', est: '6.0', status: 'Pending', timeframe: 'Tomorrow' },
        { id: 'j3', project: 'PRJ-882', part: 'Ejector Plate', op: 'Pocket Milling', est: '12.0', status: 'Pending', timeframe: 'Later' },
      ]
    },
    {
      id: '2',
      name: 'CNC-04 (Mazak QTN)',
      status: 'Setup',
      operator: 'Suresh Das',
      utilization: '60%',
      queue: [
        { id: 'j4', project: 'PRJ-882', part: 'Guide Pillar', op: 'Rough Turning', est: '2.5', status: 'Pending', timeframe: 'Today' },
        { id: 'j5', project: 'PRJ-901', part: 'Support Pin', op: 'Turning', est: '8.0', status: 'Pending', timeframe: 'Tomorrow' },
      ]
    },
    {
      id: '3',
      name: 'SG-02 (Surface Grinder)',
      status: 'Idle',
      operator: '-',
      utilization: '0%',
      queue: [
        { id: 'j6', project: 'PRJ-701', part: 'Punch', op: 'Finish Grinding', est: '3.0', status: 'Pending', timeframe: 'Today' },
      ]
    }
  ];

  return (
    <>
            <div className="h-full flex flex-col gap-4 px-4 pb-4 overflow-auto custom-scrollbar">
        <div className="shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Machine Loading Queue</h2>
            <p className="text-zinc-400 text-xs mt-1">Simple queue management for operators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 items-start">
          {machines.map(machine => (
            <div key={machine.id} className="glass-panel flex flex-col h-[500px]">
              {/* Machine Header */}
              <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-zinc-100">{machine.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/5 
                    ${machine.status === 'Running' ? 'text-green-400 bg-green-400/10' : 
                      machine.status === 'Setup' ? 'text-blue-400 bg-blue-400/10' : 
                      'text-amber-400 bg-amber-400/10'}`}>
                    {machine.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>{machine.operator}</span>
                  <span>Util: <span className="font-bold text-zinc-200">{machine.utilization}</span></span>
                </div>
              </div>

              {/* Queue List */}
              <div className="flex-1 overflow-auto custom-scrollbar p-2 flex flex-col gap-4">
                
                {/* Today */}
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-1">Today</div>
                  {machine.queue.filter(q => q.timeframe === 'Today').map(job => (
                    <div key={job.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-2 flex flex-col gap-1 cursor-grab hover:bg-white/[0.06] transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-400">{job.project}</span>
                        <span className="text-[10px] text-zinc-500">{job.est} Hrs</span>
                      </div>
                      <div className="text-sm font-medium text-zinc-200 truncate">{job.part}</div>
                      <div className="text-xs text-zinc-400 truncate">{job.op}</div>
                    </div>
                  ))}
                </div>

                {/* Tomorrow */}
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-1 mt-2">Tomorrow</div>
                  {machine.queue.filter(q => q.timeframe === 'Tomorrow').map(job => (
                    <div key={job.id} className="bg-white/[0.02] border border-white/[0.02] rounded-lg p-2 flex flex-col gap-1 cursor-grab hover:bg-white/[0.05] transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-400/70">{job.project}</span>
                        <span className="text-[10px] text-zinc-600">{job.est} Hrs</span>
                      </div>
                      <div className="text-sm font-medium text-zinc-300 truncate">{job.part}</div>
                      <div className="text-xs text-zinc-500 truncate">{job.op}</div>
                    </div>
                  ))}
                </div>

                {/* Later */}
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-1 mt-2">Later</div>
                  {machine.queue.filter(q => q.timeframe === 'Later').map(job => (
                    <div key={job.id} className="bg-white/[0.01] border border-white/[0.01] rounded-lg p-2 flex flex-col gap-1 cursor-grab hover:bg-white/[0.03] transition-colors opacity-70">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-blue-400/50">{job.project}</span>
                        <span className="text-[10px] text-zinc-600">{job.est} Hrs</span>
                      </div>
                      <div className="text-sm font-medium text-zinc-400 truncate">{job.part}</div>
                      <div className="text-xs text-zinc-600 truncate">{job.op}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
