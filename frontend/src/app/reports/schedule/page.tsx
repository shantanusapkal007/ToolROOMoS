"use client";

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { CalendarDays, Factory, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';

export default function SchedulingDashboard() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/v1/production/scheduling');
        setSchedules(res.data.data);
      } catch (err) {
        console.error('Failed to fetch schedules', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-cyan-400 font-mono animate-pulse">Loading Production Schedule...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-cyan-400" />
            Production Schedule
          </h1>
          <p className="text-mute mt-2 font-mono text-sm">Machine Capacity and Job Card Assignments</p>
        </div>
      </div>

      <div className="bg-black/5 backdrop-blur-xl border border-border-gray rounded-[12px] overflow-hidden">
        <div className="p-6 border-b border-border-gray flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Factory className="w-5 h-5 text-cyan-400" />
            Scheduled Jobs
          </h2>
          <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
            {schedules.length} Jobs Queued
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-gray/60 bg-black/5">
                <th className="p-4 text-xs font-semibold text-mute uppercase tracking-wider">Project / Part</th>
                <th className="p-4 text-xs font-semibold text-mute uppercase tracking-wider">Operation</th>
                <th className="p-4 text-xs font-semibold text-mute uppercase tracking-wider">Assigned Machine</th>
                <th className="p-4 text-xs font-semibold text-mute uppercase tracking-wider">Start Time</th>
                <th className="p-4 text-xs font-semibold text-mute uppercase tracking-wider">Est. Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {schedules.map((row: any) => (
                <tr key={row.id} className="hover:bg-black/5 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-ink">{row.project?.projectNumber}</div>
                    <div className="text-mute text-xs truncate max-w-[200px]">{row.project?.partName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-zinc-700">
                      {row.jobCard?.routingOperation?.operation?.operationName || 'Unknown Op'}
                    </div>
                    <div className="text-mute text-xs flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {Number(row.estimatedHours).toFixed(1)} hrs
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-2 bg-primary-subtle0/10 border border-blue-500/20 px-3 py-1.5 rounded-[12px]">
                      <Factory className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-300 font-mono text-xs font-semibold">
                        {row.machine?.machineName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-ink font-mono text-sm">
                    {formatDate(row.scheduledStartTime)}
                  </td>
                  <td className="p-4 text-emerald-400 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      {formatDate(row.scheduledEndTime)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-mono text-sm">
              No jobs currently scheduled on the floor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
