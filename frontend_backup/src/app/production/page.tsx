'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Play, Square, Pause, User, Clock, Monitor } from 'lucide-react';

export default function ShopFloorDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = () => {
    setLoading(true);
    api.get('/production/job-cards/active')
      .then(res => setJobs(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  const handleStart = async (jobId: string) => {
    try {
      // Mock operator ID for now
      await api.post(`/production/job-cards/${jobId}/start`, { operatorId: 'OPR-123' });
      alert('Machine started successfully');
      loadJobs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start job');
    }
  };

  const handleComplete = async (jobId: string) => {
    try {
      await api.post(`/production/job-cards/${jobId}/complete`, {});
      alert('Job completed & WIP updated');
      loadJobs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete job');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">Operator Terminal</h2>
        <p className="text-zinc-400 mt-2 text-lg">Select a machine and start your operation.</p>
      </div>

      {loading ? (
        <div className="text-zinc-500 font-mono flex items-center gap-2">
          <Monitor className="animate-pulse" /> Scanning floor...
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-zinc-500 p-12 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
          No active job cards found on the floor.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="relative group bg-zinc-900/50 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:border-indigo-500/30 hover:bg-zinc-900/80">
              {/* Status Glow */}
              <div className={`absolute -inset-0.5 rounded-3xl blur opacity-20 transition duration-500 group-hover:opacity-40 
                ${job.status === 'READY' ? 'bg-zinc-500' : 
                  job.status === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}>
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {job.project?.projectCode || 'No Project'}
                    </h3>
                    <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest">
                      {job.routingOperation?.operationName || 'Operation'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border 
                    ${job.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {job.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl border border-white/5">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Machine Allocated</div>
                      <div className="font-semibold text-sm">{job.machine?.name || job.machineId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-300 bg-black/40 p-3 rounded-xl border border-white/5">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Target Time</div>
                      <div className="font-mono text-sm">{job.routingOperation?.standardTime || 0} Hours</div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleStart(job.id)}
                    disabled={job.status !== 'READY'}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Play className="w-8 h-8 fill-white" />
                    START
                  </button>
                  <button 
                    onClick={() => handleComplete(job.id)}
                    disabled={job.status !== 'IN_PROGRESS'}
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 text-white font-bold tracking-wide shadow-lg shadow-blue-900/50 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Square className="w-8 h-8 fill-white" />
                    COMPLETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
