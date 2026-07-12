'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [budget, setBudget] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/budget`).then(res => setBudget(res.data?.data || null)).catch(console.error);
    }
  }, [projectId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Project Budget</h2>
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-6">
        {!budget ? (
          <p className="text-zinc-500">No budget defined yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.03] p-4 rounded-lg">
              <div className="text-zinc-500 text-xs mb-1">Total Budget</div>
              <div className="text-xl text-white font-mono">₹{budget.totalBudget}</div>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-lg">
              <div className="text-zinc-500 text-xs mb-1">Consumed</div>
              <div className="text-xl text-red-400 font-mono">₹{budget.consumed}</div>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-lg">
              <div className="text-zinc-500 text-xs mb-1">Material Budget</div>
              <div className="text-xl text-blue-400 font-mono">₹{budget.materialBudget}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
