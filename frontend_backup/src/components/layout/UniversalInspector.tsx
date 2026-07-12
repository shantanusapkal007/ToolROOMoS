'use client';

import React from 'react';
import { useToolbarStore } from '@/store/useToolbarStore';
import { X, Info, Clock, Activity, FileText } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface InspectorProps {
  onClose?: () => void;
}

export function UniversalInspector({ onClose }: InspectorProps) {
  const { selection } = useToolbarStore();
  const selected = selection.length === 1 ? selection[0] : null;

  if (!selected) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
        <Info className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm">Select an item to view its details.</p>
      </div>
    );
  }

  // Generic document fields
  const docNumber = selected.documentNumber || selected.routingNumber || selected.id;
  const status = selected.status || 'Draft';
  const approval = selected.approvalStatus || 'Pending';
  const dateStr = selected.updatedAt || selected.createdAt;

  return (
    <div className="h-full flex flex-col bg-[#09090B] border border-white/5 rounded-xl overflow-hidden glass-panel relative animate-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileText size={14} />
          </div>
          <h3 className="font-semibold text-white truncate max-w-[180px]">
            {docNumber}
          </h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* Properties Section */}
        <section>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Properties</h4>
          <div className="space-y-3">
            <PropertyRow label="Status" value={
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
              }`}>{status}</span>
            } />
            <PropertyRow label="Approval" value={
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                approval === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
              }`}>{approval}</span>
            } />
            {selected.revision !== undefined && (
              <PropertyRow label="Revision" value={`Rev ${selected.revision}`} />
            )}
            {selected.totalEstimatedCost !== undefined && (
              <PropertyRow label="Est. Cost" value={`$${Number(selected.totalEstimatedCost).toFixed(2)}`} />
            )}
            {selected.project?.projectNumber && (
              <PropertyRow label="Project" value={selected.project.projectNumber} />
            )}
          </div>
        </section>

        {/* Metadata Section */}
        <section>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Metadata</h4>
          <div className="space-y-3">
            <PropertyRow label="ID" value={<span className="font-mono text-xs opacity-70">{selected.id.split('-')[0]}</span>} />
            <PropertyRow label="Updated" value={dateStr ? formatDate(dateStr) : '-'} />
            <PropertyRow label="Created By" value={selected.createdBy || 'System'} />
          </div>
        </section>

        {/* Audit Mini-Feed */}
        <section>
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={12} /> Recent Activity
          </h4>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {/* Fake activity feed for now */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white/20 bg-black text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Clock size={8} />
              </div>
              <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] text-xs text-zinc-400 p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-white">System</span> created document.
                <div className="text-[10px] text-zinc-600 mt-1">Just now</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

function PropertyRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
