"use client";

import React from 'react';
import { useProject } from "../../../../hooks/useProjects";
import { History, Activity } from "lucide-react";

export default function HistoryTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: project, isLoading } = useProject(resolvedParams.id);
  
  if (isLoading || !project) return null;

  return (
    <div className="flex-1 h-full flex flex-col animate-fade-in min-h-0">
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 mr-3 text-teal-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Audit Log & History</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Unified System Activity</p>
          </div>
        </div>
      </div>

      <div className="flex space-x-6 mb-4 border-b border-white/5 px-2 shrink-0 overflow-x-auto hide-scrollbar">
        <button className="pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 border-teal-400 text-teal-400">
          Audit Log
        </button>
        <button className="pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 border-transparent text-slate-500 hover:text-slate-300">
          Revision History
        </button>
        <button className="pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 border-transparent text-slate-500 hover:text-slate-300">
          Comments
        </button>
        <button className="pb-2 font-bold text-xs uppercase tracking-wider transition-all border-b-2 border-transparent text-slate-500 hover:text-slate-300">
          System Activity
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex items-center justify-center">
         <div className="text-center text-slate-500 max-w-sm">
           <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
           <p className="text-sm">Complete immutable ledger of all activity, revisions, and comments related to this project.</p>
           <p className="text-[10px] mt-4 uppercase tracking-widest text-slate-600">Pending Log Integration</p>
         </div>
      </div>
    </div>
  );
}
