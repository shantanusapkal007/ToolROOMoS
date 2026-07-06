"use client";

import React from 'react';
import { Activity, Gauge, BatteryCharging, Zap } from 'lucide-react';

export default function OeeDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-400" />
            OEE Telemetry
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">Overall Equipment Effectiveness historical analytics</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
          <span className="text-purple-400 text-xs font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
            NIGHTLY BATCH MODE
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Gauge className="w-16 h-16 text-purple-400" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Fleet OEE</p>
          <p className="text-4xl font-black text-white">0.0%</p>
          <p className="text-purple-400 text-xs mt-2 flex items-center gap-1"><Zap className="w-3 h-3"/> Awaiting midnight cron</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <BatteryCharging className="w-16 h-16 text-blue-400" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Availability</p>
          <p className="text-4xl font-black text-white">0.0%</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Activity className="w-16 h-16 text-orange-400" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Performance</p>
          <p className="text-4xl font-black text-white">0.0%</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Activity className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Quality</p>
          <p className="text-4xl font-black text-white">0.0%</p>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
        <Gauge className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Historical Data</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          The OEE Telemetry engine aggregates machine shop daily reports at midnight. Data will appear here after the first cron execution.
        </p>
      </div>
    </div>
  );
}
