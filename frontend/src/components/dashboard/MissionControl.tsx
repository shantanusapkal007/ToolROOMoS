"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Factory, Package, ArrowRight, Activity, TrendingUp, DollarSign, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useMasterData } from '../../hooks/useMasterData';
import { ProjectGanttChart } from './ProjectGanttChart';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

interface MissionControlProps {
  projects: any[];
  onSelectProject: (proj: any) => void;
}

export function MissionControl({ projects, onSelectProject }: MissionControlProps) {
  const { data: machines = [] } = useMasterData('machines');
  const { data: metrics } = useDashboardMetrics();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const activeProjects = projects.filter(p => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED");
  const delayedProjects = activeProjects.filter(p => p.targetDeliveryDate && new Date(p.targetDeliveryDate) < new Date());
  
  return (
    <div className="flex-1 h-full overflow-y-auto pl-32 pr-12 py-12 pb-32 animate-fade-in hide-scrollbar">
      
      {/* Massive Typographical Header */}
      <div className="mb-14 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full mb-6">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">System Online · Factory Active</span>
          </div>
          <h1 className="text-7xl font-bold mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-lg">
            {new Date().getHours() < 12 ? 'Good Morning.' : new Date().getHours() < 18 ? 'Good Afternoon.' : 'Good Evening.'}
          </h1>
          <h2 className="text-xl text-slate-400 font-medium tracking-wide">Live telemetry and operational intelligence.</h2>
        </div>
        <div className="text-right pb-2 backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-2xl shadow-xl">
          <p className="text-4xl font-black text-white tracking-tighter font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="text-sm text-blue-400 font-semibold tracking-wider uppercase mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <CurrencyWidget />
        </div>
      </div>

      {/* Primary KPI Ribbon - Ultra Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <PremiumKpiCard title="Active Projects" value={activeProjects.length.toString()} subtext={`${projects.length} Total Lifetime`} icon={<Package />} trend="up" color="blue" delay="0ms" />
        <PremiumKpiCard title="Delayed Commitments" value={delayedProjects.length.toString()} subtext="Requires Attention" icon={<AlertCircle />} trend={delayedProjects.length > 0 ? "down" : "neutral"} color={delayedProjects.length > 0 ? "red" : "emerald"} delay="100ms" />
        <PremiumKpiCard 
          title="Overall Yield (OTD)" 
          value={metrics && metrics.totalProjects > 0 ? `${metrics.overallYield}%` : "N/A"} 
          subtext={metrics && metrics.totalProjects > 0 ? `+${metrics.yieldTrend}% from last month` : "No historical data"} 
          icon={<CheckCircle2 />} 
          trend={metrics && metrics.totalProjects > 0 ? "up" : "neutral"} 
          color={metrics && metrics.totalProjects > 0 ? "emerald" : "slate"} 
          delay="200ms" 
        />
        <PremiumKpiCard 
          title="Live Machine Load" 
          value={metrics ? `${metrics.machineLoad}%` : '--%'} 
          subtext={metrics ? `${metrics.activeMachines} of ${metrics.totalMachines} VMCs Active` : 'Loading...'} 
          icon={<Factory />} 
          trend="neutral" 
          color="purple" 
          delay="300ms" 
        />
      </div>

      <div className="mb-8">
        <ProjectGanttChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Projects Timeline Overview */}
        <div className="xl:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative glass-panel rounded-3xl p-8 flex flex-col min-h-[550px] border border-white/10 bg-[#0B1018]/80">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                <Clock className="w-5 h-5 mr-3 text-blue-400" />
                Project Flight Path
              </h4>
              <button className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all uppercase tracking-wider border border-white/5 hover:border-white/20">
                View All
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-4 hide-scrollbar flex-1">
              {activeProjects.map((proj, idx) => {
                const totalDays = 30; 
                const daysLeft = Math.max(0, Math.floor((new Date(proj.targetDeliveryDate || proj.createdAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
                const isDelayed = daysLeft === 0;

                return (
                  <div 
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="relative overflow-hidden bg-gradient-to-r from-[#050A14]/90 to-[#0B1018]/90 border border-white/5 p-5 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group/item flex items-center shadow-lg"
                    style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s forwards`, opacity: mounted ? 1 : 0 }}
                  >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                    
                    <div className="w-[30%] relative z-10">
                      <p className="text-white font-black text-xl group-hover/item:text-blue-400 transition-colors tracking-tight">{proj.projectNumber}</p>
                      <p className="text-slate-400 text-sm truncate font-medium mt-0.5">{proj.partName}</p>
                    </div>
                    
                    <div className="flex-1 px-8 relative z-10">
                      <div className="flex justify-between text-xs font-bold mb-3">
                        <span className="text-slate-400 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">Stage: {proj.currentStage.replace('_', ' ')}</span>
                        <span className={isDelayed ? 'text-red-400' : 'text-emerald-400'}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden shadow-inner border border-white/5">
                        <div className={`h-full rounded-full transition-all duration-1500 ease-out relative overflow-hidden ${isDelayed ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'}`} style={{ width: mounted ? `${progress}%` : '0%' }}>
                          <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg) translateX(-150%)' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[20%] text-right relative z-10">
                      <p className={`text-lg font-black tracking-tight ${isDelayed ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-200'}`}>
                        {isDelayed ? 'OVERDUE' : `${daysLeft} Days`}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Due {new Date(proj.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side Contextual Alerts & Financials */}
        <div className="flex flex-col space-y-8">
          
          <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
            {/* Glowing orb background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center relative z-10">
              <TrendingUp className="w-5 h-5 mr-3 text-emerald-400" />
              Financial Pulse
            </h4>
            
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">MTD Revenue</p>
                <div className="flex items-end space-x-3">
                  <p className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                    &#8377;{metrics ? (metrics.mtdRevenue / 1000).toFixed(1) + 'k' : '0.0k'}
                  </p>
                  <div className={`flex items-center text-sm font-bold px-2 py-1 rounded-lg border mb-1 ${metrics && metrics.revenueTrend > 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                    <TrendingUp className="w-4 h-4 mr-1" /> {metrics ? `+${metrics.revenueTrend}%` : '+0.0%'}
                  </div>
                </div>
              </div>
              
              {/* Premium CSS Mini Chart */}
              <div className="h-16 w-full mt-4 flex items-end space-x-1">
                {(metrics?.revenueHistory || [0,0,0,0,0,0,0,0,0,0,0]).map((val: number, i: number) => (
                  <div key={i} className={`flex-1 rounded-t-sm relative group cursor-pointer transition-all ${val > 0 ? 'bg-emerald-500/20 hover:bg-emerald-400' : 'bg-slate-500/10'}`} style={{ height: `${Math.max(val, 2)}%` }}>
                    {val > 0 && (
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 left-1/2 transition-opacity">
                        {val}k
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-6 mt-6">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-2">Open Invoices</p>
                <p className="text-2xl font-black text-white tracking-tight">
                  &#8377;{metrics ? metrics.openInvoices.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 flex-1 border-t-4 border-t-red-500/50 bg-gradient-to-b from-red-500/5 to-transparent">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center">
              <Zap className="w-5 h-5 mr-3 text-red-400" />
              Critical Action Required
            </h4>
            
            <div className="space-y-4">
              {delayedProjects.slice(0, 3).map(p => (
                <div key={p.id} className="group cursor-pointer p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all shadow-inner" onClick={() => onSelectProject(p)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="relative flex h-2.5 w-2.5 mr-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <p className="text-white text-sm font-black group-hover:text-red-400 transition-colors tracking-wide">{p.projectNumber}</p>
                    </div>
                    <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md">OVERDUE</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium pl-5">{p.partName} is delayed by {Math.floor((new Date().getTime() - new Date(p.deliveryDate).getTime()) / (1000 * 3600 * 24))} days.</p>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">All Systems Nominal</p>
                  <p className="text-slate-400 text-sm mt-2 font-medium">No critical alerts detected in the factory.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: skewX(-20deg) translateX(200%); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

function PremiumKpiCard({ title, value, subtext, icon, trend, color, delay }: { title: string, value: string, subtext: string, icon: React.ReactNode, trend: string, color: 'blue' | 'emerald' | 'red' | 'purple' | 'slate', delay: string }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
    slate: 'from-slate-500/20 to-slate-600/5 border-slate-500/20 text-slate-400 shadow-[0_0_15px_rgba(100,116,139,0.1)]',
  };

  const glowMap = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-500',
  };

  return (
    <div 
      className="glass-panel p-6 rounded-3xl relative overflow-hidden group cursor-default transition-all duration-500 hover:border-white/20"
      style={{ animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both` }}
    >
      {/* Dynamic Hover Glow */}
      <div className={`absolute -inset-24 opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full ${glowMap[color]}`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${colorMap[color]} shadow-inner`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
        </div>
        {trend !== 'neutral' && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider shadow-sm border ${trend === 'up' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
            {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? '+2.4%' : '-1.2%'}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-4xl font-black text-white tracking-tighter drop-shadow-md mb-2">{value}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-xs text-slate-500 font-medium mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function CurrencyWidget() {
  const [rates, setRates] = useState<{ usd: number, eur: number, gbp: number } | null>(null);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        const inr = data.rates.INR;
        const eur = inr / data.rates.EUR;
        const gbp = inr / data.rates.GBP;
        
        setRates({ usd: inr, eur, gbp });
      })
      .catch(err => console.error("Failed to fetch currency rates", err));
  }, []);

  if (!rates) {
    return (
      <div className="flex space-x-4 mt-3 pt-3 border-t border-white/10 animate-pulse">
        <div className="h-8 w-12 bg-white/5 rounded"></div>
        <div className="h-8 w-12 bg-white/5 rounded"></div>
        <div className="h-8 w-12 bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex space-x-3 mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center space-x-3 bg-emerald-500/5 border border-emerald-500/20 px-4 py-2 rounded-xl group hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all cursor-default shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs group-hover:scale-110 transition-transform border border-emerald-500/30 shadow-inner">
          $
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-emerald-400/70 font-bold uppercase tracking-widest leading-none mb-1.5">USD / INR</span>
          <span className="text-sm font-black text-emerald-400 leading-none drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">&#8377;{rates.usd.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-3 bg-blue-500/5 border border-blue-500/20 px-4 py-2 rounded-xl group hover:bg-blue-500/10 hover:border-blue-500/40 transition-all cursor-default shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs group-hover:scale-110 transition-transform border border-blue-500/30 shadow-inner">
          &#8364;
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-blue-400/70 font-bold uppercase tracking-widest leading-none mb-1.5">EUR / INR</span>
          <span className="text-sm font-black text-blue-400 leading-none drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">&#8377;{rates.eur.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-purple-500/5 border border-purple-500/20 px-4 py-2 rounded-xl group hover:bg-purple-500/10 hover:border-purple-500/40 transition-all cursor-default shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs group-hover:scale-110 transition-transform border border-purple-500/30 shadow-inner">
          &#163;
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-purple-400/70 font-bold uppercase tracking-widest leading-none mb-1.5">GBP / INR</span>
          <span className="text-sm font-black text-purple-400 leading-none drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">&#8377;{rates.gbp.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
