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

  const safeProjects = Array.isArray(projects) ? projects : (projects?.data || []);
  const activeProjects = safeProjects.filter((p: any) => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED");
  const delayedProjects = activeProjects.filter((p: any) => p.targetDeliveryDate && new Date(p.targetDeliveryDate) < new Date());
  
  return (
    <div className="flex-1 h-full overflow-y-auto pl-[var(--space-32)] pr-[var(--space-12)] py-[var(--space-12)] pb-[var(--space-32)] animate-fade-in hide-scrollbar">
      
      {/* Massive Typographical Header */}
      <div className="mb-[var(--space-14)] flex items-end justify-between">
        <div>
          <div className="inline-flex items-center space-x-[var(--space-2)] bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 px-[var(--space-3)] py-[var(--space-1-5)] rounded-full mb-[var(--space-6)]">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-info)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--color-info)]"></span>
            </div>
            <span className="text-[var(--color-info)] text-micro font-bold tracking-widest uppercase">System Online · Factory Active</span>
          </div>
          <h1 className="text-h1 font-bold mb-[var(--space-2)] tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-lg">
            {new Date().getHours() < 12 ? 'Good Morning.' : new Date().getHours() < 18 ? 'Good Afternoon.' : 'Good Evening.'}
          </h1>
          <h2 className="text-h4 text-[var(--text-tertiary)] font-medium tracking-wide">Live telemetry and operational intelligence.</h2>
        </div>
        <div className="text-right pb-[var(--space-2)] backdrop-blur-md bg-[var(--bg-surface)] border border-[var(--border-500)] p-[var(--space-4)] rounded-[var(--radius-2xl)] shadow-xl">
          <p className="text-h2 font-black text-[var(--text-primary)] tracking-tighter font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p className="text-caption text-[var(--color-info)] font-semibold tracking-wider uppercase mt-[var(--space-1)]">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <CurrencyWidget />
        </div>
      </div>

      {/* Primary KPI Ribbon - Ultra Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--space-6)] mb-[var(--space-12)]">
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

      <div className="mb-[var(--space-8)]">
        <ProjectGanttChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[var(--space-8)]">
        
        {/* Projects Timeline Overview */}
        <div className="xl:col-span-2 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-info)]/20 to-[var(--color-brand)]/20 rounded-[var(--radius-3xl)] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative glass-panel rounded-[var(--radius-3xl)] p-[var(--space-8)] flex flex-col min-h-[550px] border border-[var(--border-500)] bg-[var(--bg-panel)]/80">
            <div className="flex justify-between items-center mb-[var(--space-8)] border-b border-[var(--border-500)] pb-[var(--space-4)]">
              <h4 className="text-body font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center">
                <Clock className="w-5 h-5 mr-[var(--space-3)] text-[var(--color-info)]" />
                Project Flight Path
              </h4>
              <button className="px-[var(--space-4)] py-[var(--space-1-5)] rounded-[var(--radius-lg)] bg-[var(--hover-600)] hover:bg-[var(--hover-700)] text-caption font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all uppercase tracking-wider border border-[var(--border-500)]">
                View All
              </button>
            </div>
            
            <div className="space-y-[var(--space-4)] overflow-y-auto pr-[var(--space-4)] hide-scrollbar flex-1">
              {activeProjects.map((proj, idx) => {
                const totalDays = 30; 
                const daysLeft = Math.max(0, Math.floor((new Date(proj.targetDeliveryDate || proj.createdAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                const progress = Math.min(100, Math.max(0, ((totalDays - daysLeft) / totalDays) * 100));
                const isDelayed = daysLeft === 0;

                return (
                  <div 
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="relative overflow-hidden bg-[var(--bg-canvas)] border border-[var(--border-500)] p-[var(--space-5)] rounded-[var(--radius-2xl)] hover:border-[var(--color-info)]/30 transition-all cursor-pointer group/item flex items-center shadow-lg"
                    style={{ animation: `slideUp 0.5s ease-out ${idx * 0.1}s forwards`, opacity: mounted ? 1 : 0 }}
                  >
                    <div className="absolute inset-0 bg-[var(--color-info)]/5 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                    
                    <div className="w-[30%] relative z-10">
                      <p className="text-[var(--text-primary)] font-black text-h4 group-hover/item:text-[var(--color-info)] transition-colors tracking-tight">{proj.projectNumber}</p>
                      <p className="text-[var(--text-tertiary)] text-caption truncate font-medium mt-0.5">{proj.partName}</p>
                    </div>
                    
                    <div className="flex-1 px-[var(--space-8)] relative z-10">
                      <div className="flex justify-between text-micro font-bold mb-[var(--space-3)]">
                        <span className="text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-1)] rounded-full border border-[var(--border-500)]">Stage: {proj.currentStage.replace('_', ' ')}</span>
                        <span className={isDelayed ? 'text-[var(--color-error)]' : 'text-[var(--color-success)]'}>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-[var(--bg-surface)] rounded-full overflow-hidden shadow-inner border border-[var(--border-500)]">
                        <div className={`h-full rounded-full transition-all duration-1500 ease-out relative overflow-hidden ${isDelayed ? 'bg-[var(--color-error)]' : 'bg-[var(--color-info)]'}`} style={{ width: mounted ? `${progress}%` : '0%' }}>
                          <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg) translateX(-150%)' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="w-[20%] text-right relative z-10">
                      <p className={`text-h4 font-black tracking-tight ${isDelayed ? 'text-[var(--color-error)] drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-[var(--text-secondary)]'}`}>
                        {isDelayed ? 'OVERDUE' : `${daysLeft} Days`}
                      </p>
                      <p className="text-micro text-[var(--text-tertiary)] mt-[var(--space-1)] font-medium">Due {new Date(proj.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side Contextual Alerts & Financials */}
        <div className="flex flex-col space-y-[var(--space-8)]">
          
          <div className="glass-panel rounded-[var(--radius-3xl)] p-[var(--space-8)] relative overflow-hidden">
            {/* Glowing orb background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-success)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            
            <h4 className="text-body font-bold text-[var(--text-primary)] uppercase tracking-widest mb-[var(--space-6)] flex items-center relative z-10">
              <TrendingUp className="w-5 h-5 mr-[var(--space-3)] text-[var(--color-success)]" />
              Financial Pulse
            </h4>
            
            <div className="space-y-[var(--space-6)] relative z-10">
              <div>
                <p className="text-micro text-[var(--text-tertiary)] font-bold uppercase tracking-widest mb-[var(--space-2)]">MTD Revenue</p>
                <div className="flex items-end space-x-[var(--space-3)]">
                  <p className="text-h1 font-black text-[var(--text-primary)] tracking-tighter drop-shadow-md">
                    &#8377;{metrics ? (metrics.mtdRevenue / 1000).toFixed(1) + 'k' : '0.0k'}
                  </p>
                  <div className={`flex items-center text-body font-bold px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-lg)] border mb-[var(--space-1)] ${metrics && metrics.revenueTrend > 0 ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20' : 'text-[var(--text-tertiary)] bg-[var(--bg-canvas)] border-[var(--border-500)]'}`}>
                    <TrendingUp className="w-4 h-4 mr-[var(--space-1)]" /> {metrics ? `+${metrics.revenueTrend}%` : '+0.0%'}
                  </div>
                </div>
              </div>
              
              {/* Premium CSS Mini Chart */}
              <div className="h-16 w-full mt-[var(--space-4)] flex items-end space-x-[var(--space-1)]">
                {(metrics?.revenueHistory || [0,0,0,0,0,0,0,0,0,0,0]).map((val: number, i: number) => (
                  <div key={i} className={`flex-1 rounded-t-sm relative group cursor-pointer transition-all ${val > 0 ? 'bg-[var(--color-success)]/20 hover:bg-[var(--color-success)]' : 'bg-[var(--hover-600)]'}`} style={{ height: `${Math.max(val, 2)}%` }}>
                    {val > 0 && (
                      <div className="absolute bottom-full mb-[var(--space-1)] opacity-0 group-hover:opacity-100 bg-[var(--bg-panel)] text-[var(--text-primary)] text-micro font-bold px-[var(--space-1-5)] py-[var(--space-0-5)] rounded-[var(--radius-sm)] shadow-lg pointer-events-none transform -translate-x-1/2 left-1/2 transition-opacity">
                        {val}k
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="border-t border-[var(--border-500)] pt-[var(--space-6)] mt-[var(--space-6)]">
                <p className="text-micro text-[var(--text-tertiary)] font-bold uppercase tracking-widest mb-[var(--space-2)]">Open Invoices</p>
                <p className="text-h2 font-black text-[var(--text-primary)] tracking-tight">
                  &#8377;{metrics?.openInvoices ? metrics.openInvoices.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-3xl)] p-[var(--space-8)] flex-1 border-t-4 border-t-[var(--color-error)]/50 bg-gradient-to-b from-[var(--color-error)]/5 to-transparent">
            <h4 className="text-body font-bold text-[var(--text-primary)] uppercase tracking-widest mb-[var(--space-6)] flex items-center">
              <Zap className="w-5 h-5 mr-[var(--space-3)] text-[var(--color-error)]" />
              Critical Action Required
            </h4>
            
            <div className="space-y-[var(--space-4)]">
              {delayedProjects.slice(0, 3).map(p => (
                <div key={p.id} className="group cursor-pointer p-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--color-error)]/5 border border-[var(--color-error)]/10 hover:bg-[var(--color-error)]/10 hover:border-[var(--color-error)]/30 transition-all shadow-inner" onClick={() => onSelectProject(p)}>
                  <div className="flex items-center justify-between mb-[var(--space-2)]">
                    <div className="flex items-center">
                      <span className="relative flex h-2.5 w-2.5 mr-[var(--space-3)]">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-error)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-error)]"></span>
                      </span>
                      <p className="text-[var(--text-primary)] text-body font-black group-hover:text-[var(--color-error)] transition-colors tracking-wide">{p.projectNumber}</p>
                    </div>
                    <span className="text-micro font-bold bg-[var(--color-error)]/20 text-[var(--color-error)] px-[var(--space-2)] py-[var(--space-0-5)] rounded-[var(--radius-md)]">OVERDUE</span>
                  </div>
                  <p className="text-[var(--text-tertiary)] text-caption leading-relaxed font-medium pl-[var(--space-5)]">{p.partName} is delayed by {Math.floor((new Date().getTime() - new Date(p.deliveryDate).getTime()) / (1000 * 3600 * 24))} days.</p>
                </div>
              ))}
              {delayedProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-[var(--space-10)] h-full">
                  <div className="w-16 h-16 rounded-[var(--radius-2xl)] bg-[var(--color-success)]/10 flex items-center justify-center mb-[var(--space-4)] border border-[var(--color-success)]/20 shadow-[var(--shadow-glow)]">
                    <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
                  </div>
                  <p className="text-[var(--color-success)] font-bold text-h4">All Systems Nominal</p>
                  <p className="text-[var(--text-tertiary)] text-body mt-[var(--space-2)] font-medium">No critical alerts detected in the factory.</p>
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
    blue: 'from-[var(--color-info)]/20 to-[var(--color-info)]/5 border-[var(--color-info)]/20 text-[var(--color-info)] shadow-[var(--shadow-glow)]',
    emerald: 'from-[var(--color-success)]/20 to-[var(--color-success)]/5 border-[var(--color-success)]/20 text-[var(--color-success)] shadow-[var(--shadow-glow)]',
    red: 'from-[var(--color-error)]/20 to-[var(--color-error)]/5 border-[var(--color-error)]/20 text-[var(--color-error)] shadow-[var(--shadow-glow)]',
    purple: 'from-[var(--color-brand)]/20 to-[var(--color-brand)]/5 border-[var(--color-brand)]/20 text-[var(--color-brand)] shadow-[var(--shadow-glow)]',
    slate: 'from-[var(--hover-600)] to-[var(--hover-500)] border-[var(--border-500)] text-[var(--text-tertiary)] shadow-[var(--shadow-elevation)]',
  };

  const glowMap = {
    blue: 'bg-[var(--color-info)]',
    emerald: 'bg-[var(--color-success)]',
    red: 'bg-[var(--color-error)]',
    purple: 'bg-[var(--color-brand)]',
    slate: 'bg-[var(--border-500)]',
  };

  return (
    <div 
      className="glass-panel p-[var(--space-6)] rounded-[var(--radius-3xl)] relative overflow-hidden group cursor-default transition-all duration-500 hover:border-[var(--color-brand)]/50"
      style={{ animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay} both` }}
    >
      {/* Dynamic Hover Glow */}
      <div className={`absolute -inset-24 opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-700 pointer-events-none rounded-full ${glowMap[color]}`}></div>
      
      <div className="flex justify-between items-start mb-[var(--space-6)] relative z-10">
        <div className={`w-12 h-12 rounded-[var(--radius-2xl)] flex items-center justify-center border bg-gradient-to-br ${colorMap[color]} shadow-inner`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6' })}
        </div>
        {trend !== 'neutral' && (
          <div className={`px-[var(--space-3)] py-[var(--space-1-5)] rounded-[var(--radius-lg)] text-micro font-black tracking-wider shadow-sm border ${trend === 'up' ? 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20' : 'text-[var(--color-error)] bg-[var(--color-error)]/10 border-[var(--color-error)]/20'}`}>
            {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? '+2.4%' : '-1.2%'}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-h2 font-black text-[var(--text-primary)] tracking-tighter drop-shadow-md mb-[var(--space-2)]">{value}</h3>
        <p className="text-micro font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{title}</p>
        <p className="text-micro text-[var(--text-secondary)] font-medium mt-[var(--space-1)]">{subtext}</p>
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
      <div className="flex space-x-[var(--space-4)] mt-[var(--space-3)] pt-[var(--space-3)] border-t border-[var(--border-500)] animate-pulse">
        <div className="h-8 w-12 bg-[var(--hover-600)] rounded"></div>
        <div className="h-8 w-12 bg-[var(--hover-600)] rounded"></div>
        <div className="h-8 w-12 bg-[var(--hover-600)] rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex space-x-[var(--space-3)] mt-[var(--space-4)] pt-[var(--space-4)] border-t border-[var(--border-500)]">
      <div className="flex items-center space-x-[var(--space-3)] bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-xl)] group hover:bg-[var(--color-success)]/10 hover:border-[var(--color-success)]/40 transition-all cursor-default shadow-[var(--shadow-glow)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-success)]/0 via-[var(--color-success)]/10 to-[var(--color-success)]/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center text-[var(--color-success)] font-black text-xs group-hover:scale-110 transition-transform border border-[var(--color-success)]/30 shadow-inner">
          $
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-[var(--color-success)]/70 font-bold uppercase tracking-widest leading-none mb-1.5">USD / INR</span>
          <span className="text-body font-black text-[var(--color-success)] leading-none">&#8377;{rates.usd.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-[var(--space-3)] bg-[var(--color-info)]/5 border border-[var(--color-info)]/20 px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-xl)] group hover:bg-[var(--color-info)]/10 hover:border-[var(--color-info)]/40 transition-all cursor-default shadow-[var(--shadow-glow)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-info)]/0 via-[var(--color-info)]/10 to-[var(--color-info)]/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-[var(--color-info)]/20 flex items-center justify-center text-[var(--color-info)] font-black text-xs group-hover:scale-110 transition-transform border border-[var(--color-info)]/30 shadow-inner">
          &#8364;
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-[var(--color-info)]/70 font-bold uppercase tracking-widest leading-none mb-1.5">EUR / INR</span>
          <span className="text-body font-black text-[var(--color-info)] leading-none">&#8377;{rates.eur.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-[var(--space-3)] bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/20 px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-xl)] group hover:bg-[var(--color-brand)]/10 hover:border-[var(--color-brand)]/40 transition-all cursor-default shadow-[var(--shadow-glow)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand)]/0 via-[var(--color-brand)]/10 to-[var(--color-brand)]/0 w-full translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
        <div className="w-7 h-7 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[var(--color-brand)] font-black text-xs group-hover:scale-110 transition-transform border border-[var(--color-brand)]/30 shadow-inner">
          &#163;
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-[var(--color-brand)]/70 font-bold uppercase tracking-widest leading-none mb-1.5">GBP / INR</span>
          <span className="text-body font-black text-[var(--color-brand)] leading-none">&#8377;{rates.gbp.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
