'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProjectMilestonesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/milestones`).then(res => setMilestones(res.data?.data || [])).catch(console.error);
    }
  }, [projectId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Project Milestones</h2>
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        {milestones.length === 0 ? (
          <p className="text-zinc-500">No milestones found.</p>
        ) : (
          <ul className="space-y-2">
            {milestones.map((m: any) => (
              <li key={m.id} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg">
                <span className="text-white font-medium">{m.title}</span>
                <span className="text-emerald-400 text-sm">{m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
