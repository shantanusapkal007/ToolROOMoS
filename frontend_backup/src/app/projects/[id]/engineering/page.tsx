'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function EngineeringTab() {
  const params = useParams();
  const projectIdRaw = params.id as string;
  const projectId = projectIdRaw.startsWith('PRJ-') ? projectIdRaw : `PRJ-${projectIdRaw.padStart(3, '0')}`;
  
  const [ecrs, setEcrs] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      api.get(`/engineering/projects/${projectId}/ecr`).then(res => setEcrs(res.data?.data || [])).catch(console.error);
    }
  }, [projectId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-6">Engineering Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bill of Materials Summary */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-2">Bill of Materials</h3>
            <p className="text-sm text-zinc-400 mb-4">Manage the multi-level material requirements for this project.</p>
            <Link href={`/engineering/bom?project=${projectId}&bomId=new`} className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300">
              Create New BOM &rarr;
            </Link>
          </div>
        </div>

        {/* Routing Summary */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-2">Routing & Operations</h3>
            <p className="text-sm text-zinc-400 mb-4">Define standard sequence of operations and cycle times.</p>
            <Link href={`/engineering/routing?project=${projectId}&routingId=new`} className="inline-flex items-center text-sm font-medium text-purple-400 hover:text-purple-300">
              Create New Routing &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* Engineering Change Requests (ECR) */}
      <div className="mt-8 bg-white/[0.02] border border-white/[0.05] rounded-xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Engineering Change Requests (ECR)</h3>
            <p className="text-xs text-zinc-500 mt-1">Track requested deviations or improvements for this project's design.</p>
          </div>
          <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-sm text-white rounded-lg transition-colors border border-white/[0.05]">
            + New Request
          </button>
        </div>

        {ecrs.length === 0 ? (
          <div className="text-center py-10 bg-black/20 rounded-lg border border-dashed border-white/[0.1]">
            <p className="text-zinc-500 text-sm">No engineering changes requested yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ecrs.map(ecr => (
              <div key={ecr.id} className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] rounded-lg transition-colors flex justify-between items-center group">
                <div>
                  <h4 className="text-white font-medium group-hover:text-emerald-400 transition-colors">{ecr.requestTitle}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{ecr.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    ecr.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ecr.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {ecr.status}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {new Date(ecr.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
