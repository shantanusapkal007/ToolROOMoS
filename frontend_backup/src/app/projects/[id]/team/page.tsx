'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [team, setTeam] = useState([]);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/team`).then(res => setTeam(res.data?.data || [])).catch(console.error);
    }
  }, [projectId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-white mb-4">Project Team</h2>
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
        {(!team || team.length === 0) ? (
          <p className="text-zinc-500">No team members assigned.</p>
        ) : (
          <ul className="space-y-2">
            {team.map((t: any) => (
              <li key={t.id} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg">
                <span className="text-white font-medium">{t.employeeId}</span>
                <span className="text-emerald-400 text-sm">{t.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
