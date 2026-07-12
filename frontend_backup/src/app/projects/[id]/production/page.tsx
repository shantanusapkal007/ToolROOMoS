'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, PlayCircle, Target, Activity } from 'lucide-react';

export default function ProjectProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id.startsWith('PRJ-') ? resolvedParams.id : `PRJ-${resolvedParams.id}`;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Production Control</h2>
          <p className="text-zinc-400 mt-1">Monitor manufacturing orders, machine loading, and WIP for this project.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Cards */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Active Jobs</p>
              <h3 className="text-2xl font-black text-white mt-1">0</h3>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Completed Qty</p>
              <h3 className="text-2xl font-black text-white mt-1">0</h3>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mt-4 border-b border-white/10 pb-2">Production Operations</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => router.push(`/production/planning?project=${projectId}`)}
          className="glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-indigo-500/30 transition-all cursor-pointer group hover:bg-white/[0.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-zinc-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">Production Planning</h3>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Schedule jobs and release MOs</p>
        </div>

        <div 
          onClick={() => router.push(`/production/job-cards?project=${projectId}`)}
          className="glass-panel p-6 rounded-2xl border border-white/[0.05] hover:border-blue-500/30 transition-all cursor-pointer group hover:bg-white/[0.02]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <div className="text-zinc-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Job Cards</h3>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Track active operations on the floor</p>
        </div>
      </div>
    </div>
  );
}
