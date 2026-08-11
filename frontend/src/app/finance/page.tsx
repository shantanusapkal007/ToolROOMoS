"use client";

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  DollarSign, TrendingUp, TrendingDown, Briefcase, Users,
  Clock, PieChart as PieChartIcon, BarChart3, ArrowUpRight,
  ArrowDownRight, Search, Filter, Calendar, Layers,
  CreditCard, Building2, Activity, AlertCircle, CheckCircle2,
  ChevronRight, Download, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFinanceDashboard,
  useProjectProfitability,
  usePayrollVsRevenue,
  useCostBreakdown,
  usePayrollFinanceReconciliation,
  useMonthlyPayroll,
} from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import Link from 'next/link';

type TabKey = 'overview' | 'profitability' | 'payroll' | 'reconciliation';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [monthYear, setMonthYear] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [profitSearch, setProfitSearch] = useState('');
  const [profitSort, setProfitSort] = useState<'margin' | 'revenue' | 'cost'>('margin');

  // Data hooks
  const { data: dashboardRaw, isLoading: dashLoading } = useFinanceDashboard();
  const { data: profitabilityRaw, isLoading: profitLoading } = useProjectProfitability();
  const { data: trendRaw } = usePayrollVsRevenue(6);
  const { data: breakdownRaw } = useCostBreakdown();
  const { data: reconciliationRaw } = usePayrollFinanceReconciliation(monthYear);
  const { data: payrollRaw } = useMonthlyPayroll(monthYear);

  // Safe data extraction
  const dashboard = (dashboardRaw as any) || {};
  const profitability = Array.isArray(profitabilityRaw) ? profitabilityRaw : (profitabilityRaw as any)?.data || [];
  const trend = Array.isArray(trendRaw) ? trendRaw : (trendRaw as any)?.data || [];
  const breakdown = (breakdownRaw as any) || { categories: [], total: 0 };
  const reconciliation = (reconciliationRaw as any) || { summary: {}, projectCosts: [], employeeReconciliation: [] };
  const payroll = (payrollRaw as any) || { summary: {}, employees: [] };

  // Filtered and sorted profitability
  const filteredProfit = useMemo(() => {
    let list = [...profitability];
    if (profitSearch) {
      const q = profitSearch.toLowerCase();
      list = list.filter((p: any) =>
        p.projectNumber?.toLowerCase().includes(q) ||
        p.partName?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q)
      );
    }
    list.sort((a: any, b: any) => {
      if (profitSort === 'margin') return (b.margin || 0) - (a.margin || 0);
      if (profitSort === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
      return (b.totalCost || 0) - (a.totalCost || 0);
    });
    return list;
  }, [profitability, profitSearch, profitSort]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Layers className="h-3.5 w-3.5" /> },
    { key: 'profitability', label: 'Project P&L', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { key: 'payroll', label: 'Payroll', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { key: 'reconciliation', label: 'Reconciliation', icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  return (
    <AppLayout noPadding>
      <main className="flex-1 w-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-border-gray">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-8 w-8 rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-xl font-semibold text-ink tracking-tight">Finance & Payroll</h1>
                </div>
                <p className="text-xs text-mute ml-[42px]">Integrated cost tracking, payroll analytics & project profitability</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-canvas border border-border-gray">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="month"
                    value={monthYear}
                    onChange={e => setMonthYear(e.target.value)}
                    className="text-xs font-medium text-zinc-700 bg-transparent border-none outline-none w-[110px]"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mt-4">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-[12px] text-xs font-medium
                    transition-all duration-150
                    ${activeTab === tab.key
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-mute hover:text-ink hover:bg-zinc-100'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <OverviewTab dashboard={dashboard} trend={trend} breakdown={breakdown} loading={dashLoading} />
              </motion.div>
            )}
            {activeTab === 'profitability' && (
              <motion.div key="profitability" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <ProfitabilityTab
                  data={filteredProfit}
                  loading={profitLoading}
                  search={profitSearch}
                  setSearch={setProfitSearch}
                  sort={profitSort}
                  setSort={setProfitSort}
                />
              </motion.div>
            )}
            {activeTab === 'payroll' && (
              <motion.div key="payroll" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <PayrollTab payroll={payroll} monthYear={monthYear} />
              </motion.div>
            )}
            {activeTab === 'reconciliation' && (
              <motion.div key="reconciliation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <ReconciliationTab data={reconciliation} monthYear={monthYear} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </AppLayout>
  );
}

/* ==================== HERO METRIC CARD ==================== */
function MetricCard({ label, value, subtitle, icon, trend, trendLabel, color = 'zinc' }: {
  label: string; value: string; subtitle?: string; icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/8 to-teal-500/5 border-emerald-200/40',
    blue: 'from-blue-500/8 to-indigo-500/5 border-blue-200/40',
    purple: 'from-purple-500/8 to-violet-500/5 border-purple-200/40',
    amber: 'from-amber-500/8 to-orange-500/5 border-amber-200/40',
    rose: 'from-rose-500/8 to-pink-500/5 border-rose-200/40',
    zinc: 'from-zinc-500/5 to-zinc-400/3 border-border-gray/40',
  };

  return (
    <motion.div
      whileHover={{ y: -1, boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.12 }}
      className={`relative overflow-hidden rounded-[12px] bg-gradient-to-br ${colorMap[color] || colorMap.zinc} border backdrop-blur-sm p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-[12px] bg-white/80 border border-white/60 flex items-center justify-center shadow-subtle">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
            trend === 'down' ? 'bg-rose-100 text-rose-700' :
            'bg-zinc-100 text-zinc-600'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-2.5 w-2.5" /> : trend === 'down' ? <ArrowDownRight className="h-2.5 w-2.5" /> : null}
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-mute uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-semibold text-ink tracking-tight">{value}</p>
      {subtitle && <p className="text-[10px] text-zinc-400 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

/* ==================== OVERVIEW TAB ==================== */
function OverviewTab({ dashboard, trend, breakdown, loading }: { dashboard: any; trend: any[]; breakdown: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-[12px] bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const categories = breakdown?.categories || [];
  const totalCost = breakdown?.total || 0;

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(dashboard.totalRevenue || 0)}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          color="emerald"
          trend={dashboard.totalRevenue > 0 ? 'up' : 'neutral'}
          trendLabel={dashboard.totalRevenue > 0 ? 'Active' : '—'}
          subtitle={`${dashboard.totalProjectsCount || 0} projects`}
        />
        <MetricCard
          label="Total Cost"
          value={formatCurrency(dashboard.totalCost || 0)}
          icon={<CreditCard className="h-4 w-4 text-primary" />}
          color="blue"
          subtitle={`Labour: ${formatCurrency(dashboard.totalLabourCost || 0)}`}
        />
        <MetricCard
          label="Gross Profit"
          value={formatCurrency(dashboard.grossProfit || 0)}
          icon={<DollarSign className="h-4 w-4 text-purple-600" />}
          color={dashboard.grossProfit >= 0 ? 'purple' : 'rose'}
          trend={dashboard.grossProfit >= 0 ? 'up' : 'down'}
          trendLabel={`${dashboard.netMargin || 0}% margin`}
        />
        <MetricCard
          label="Outstanding"
          value={formatCurrency(dashboard.totalOutstanding || 0)}
          icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
          color="amber"
          subtitle={`${dashboard.activeProjectsCount || 0} active projects`}
        />
      </div>

      {/* Second row: Labour + Machine + Employees */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Labour Cost"
          value={formatCurrency(dashboard.totalLabourCost || 0)}
          icon={<Users className="h-4 w-4 text-teal-600" />}
          color="emerald"
          subtitle={`${dashboard.totalEmployees || 0} active employees`}
        />
        <MetricCard
          label="Machine Cost"
          value={formatCurrency(dashboard.totalMachineCost || 0)}
          icon={<Building2 className="h-4 w-4 text-primary" />}
          color="blue"
        />
        <MetricCard
          label="Outside Process"
          value={formatCurrency(dashboard.totalOutsideProcessCost || 0)}
          icon={<Briefcase className="h-4 w-4 text-violet-600" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Cost Breakdown Donut */}
        <div className="rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-zinc-400" />
            Cost Breakdown
          </h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <DonutChart data={categories} total={totalCost} />
            </div>
            <div className="flex-1 space-y-2">
              {categories.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-zinc-600">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{formatCurrency(c.value)}</span>
                    <span className="text-zinc-400 w-10 text-right">
                      {totalCost > 0 ? `${((c.value / totalCost) * 100).toFixed(0)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-zinc-400 italic">No cost data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Payroll vs Revenue Trend */}
        <div className="rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            Payroll vs Revenue (6 months)
          </h3>
          <TrendBarChart data={trend} />
        </div>
      </div>
    </div>
  );
}

/* ==================== DONUT CHART ==================== */
function DonutChart({ data, total }: { data: any[]; total: number }) {
  if (!data.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full border-[12px] border-zinc-100 mx-auto" />
          <p className="text-[10px] text-zinc-400 mt-2">No data</p>
        </div>
      </div>
    );
  }

  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d: any, i: number) => {
        const pct = total > 0 ? d.value / total : 0;
        const dashArray = pct * circumference;
        const dashOffset = -offset * circumference;
        offset += pct;

        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-500"
            opacity={0.85}
          />
        );
      })}
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-zinc-900 text-sm font-semibold">
        {total > 100000 ? `₹${(total / 100000).toFixed(1)}L` : formatCurrency(total)}
      </text>
      <text x={size / 2} y={size / 2 + 10} textAnchor="middle" className="fill-zinc-400 text-[9px]">
        Total Cost
      </text>
    </svg>
  );
}

/* ==================== TREND BAR CHART ==================== */
function TrendBarChart({ data }: { data: any[] }) {
  if (!data.length) {
    return <div className="h-48 flex items-center justify-center text-xs text-zinc-400">No trend data available</div>;
  }

  const maxVal = Math.max(...data.map((d: any) => Math.max(d.payroll || 0, d.revenue || 0, 1)));
  const barHeight = 160;

  return (
    <div className="flex items-end justify-between gap-2 h-48 px-2">
      {data.map((d: any, i: number) => {
        const payrollH = maxVal > 0 ? ((d.payroll || 0) / maxVal) * barHeight : 0;
        const revenueH = maxVal > 0 ? ((d.revenue || 0) / maxVal) * barHeight : 0;

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="flex items-end gap-0.5 h-40">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: payrollH }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="w-3.5 rounded-t bg-gradient-to-t from-blue-400 to-blue-500 opacity-75 group-hover:opacity-100 transition-opacity relative"
                title={`Payroll: ${formatCurrency(d.payroll)}`}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: revenueH }}
                transition={{ duration: 0.4, delay: i * 0.05 + 0.1 }}
                className="w-3.5 rounded-t bg-gradient-to-t from-emerald-400 to-emerald-500 opacity-75 group-hover:opacity-100 transition-opacity"
                title={`Revenue: ${formatCurrency(d.revenue)}`}
              />
            </div>
            <span className="text-[9px] text-zinc-400 font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ==================== PROFITABILITY TAB ==================== */
function ProfitabilityTab({ data, loading, search, setSearch, sort, setSort }: {
  data: any[]; loading: boolean; search: string; setSearch: (v: string) => void;
  sort: string; setSort: (v: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-[12px] border border-border-gray bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-[12px] bg-canvas border border-border-gray">
          <Filter className="h-3 w-3 text-zinc-400" />
          {(['margin', 'revenue', 'cost'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-1 text-[10px] font-medium rounded ${
                sort === s ? 'bg-zinc-900 text-white' : 'text-mute hover:text-ink'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-canvas/80 border-b border-zinc-100">
              <th className="text-left px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Project</th>
              <th className="text-left px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Customer</th>
              <th className="text-left px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Stage</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Revenue</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Material</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Labour</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Machine</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Total Cost</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Profit</th>
              <th className="text-right px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Margin</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(10)].map((_, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-zinc-400">
                  <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No project data found
                </td>
              </tr>
            ) : (
              data.map((p: any) => (
                <tr key={p.id} className="border-b border-zinc-50 hover:bg-canvas/50 transition-colors group">
                  <td className="px-4 py-2.5">
                    <Link href={`/projects/${p.id}`} className="group-hover:text-primary transition-colors">
                      <span className="font-semibold text-ink">{p.projectNumber}</span>
                      <span className="block text-[10px] text-zinc-400 truncate max-w-[140px]">{p.partName}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 truncate max-w-[120px]">{p.customerName}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded bg-zinc-100 text-zinc-600">
                      {p.currentStage?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium text-ink">{formatCurrency(p.revenue)}</td>
                  <td className="px-3 py-2.5 text-right text-mute">{formatCurrency(p.materialCost)}</td>
                  <td className="px-3 py-2.5 text-right text-mute">{formatCurrency(p.labourCost)}</td>
                  <td className="px-3 py-2.5 text-right text-mute">{formatCurrency(p.machineCost)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-zinc-700">{formatCurrency(p.totalCost)}</td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(p.profit)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      p.margin > 20 ? 'bg-emerald-50 text-emerald-700' :
                      p.margin > 0 ? 'bg-amber-50 text-amber-700' :
                      p.margin === 0 ? 'bg-canvas text-mute' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                      {p.margin > 0 ? '+' : ''}{p.margin}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==================== PAYROLL TAB ==================== */
function PayrollTab({ payroll, monthYear }: { payroll: any; monthYear: string }) {
  const summary = payroll.summary || {};
  const employees = payroll.employees || [];
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter((e: any) =>
      e.name?.toLowerCase().includes(q) ||
      e.employeeCode?.toLowerCase().includes(q) ||
      e.department?.name?.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Employees"
          value={String(summary.totalEmployees || 0)}
          icon={<Users className="h-4 w-4 text-primary" />}
          color="blue"
        />
        <MetricCard
          label="Total Hours Worked"
          value={`${(summary.totalHoursWorked || 0).toFixed(0)} hrs`}
          icon={<Clock className="h-4 w-4 text-primary" />}
          color="purple"
        />
        <MetricCard
          label="Base Salary (Calculated)"
          value={formatCurrency(summary.totalBaseSalary || 0)}
          icon={<CreditCard className="h-4 w-4 text-teal-600" />}
          color="emerald"
        />
        <MetricCard
          label="Actual Salary"
          value={formatCurrency(summary.totalActualSalary || 0)}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          color="emerald"
          trend={summary.totalVariance > 0 ? 'up' : summary.totalVariance < 0 ? 'down' : 'neutral'}
          trendLabel={`Var: ${formatCurrency(Math.abs(summary.totalVariance || 0))}`}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-[12px] border border-border-gray bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>

      {/* Payroll Table */}
      <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-canvas/80 border-b border-zinc-100">
              <th className="text-left px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Employee</th>
              <th className="text-left px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Dept</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Rate/hr</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Hours</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Projects</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Base Salary</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Actual Salary</th>
              <th className="text-right px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Variance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-400">
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No employee data for this period
                </td>
              </tr>
            ) : (
              filtered.map((emp: any) => (
                <tr key={emp.id} className="border-b border-zinc-50 hover:bg-canvas/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-ink">{emp.name}</span>
                    <span className="block text-[10px] text-zinc-400">{emp.employeeCode} · {emp.designation}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">{emp.department?.name || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-zinc-600">₹{emp.hourlyRate}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`font-medium ${emp.totalHours > 0 ? 'text-ink' : 'text-zinc-400'}`}>
                      {emp.totalHours}
                    </span>
                    <span className="text-zinc-400">/{emp.standardHours}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="inline-flex px-1.5 py-0.5 text-[9px] font-semibold rounded bg-primary-subtle text-primary-dark">
                      {emp.projectCount}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-zinc-600">{formatCurrency(emp.baseSalaryCalculated)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{formatCurrency(emp.actualSalary)}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    emp.variance > 0 ? 'text-rose-600' : emp.variance < 0 ? 'text-emerald-600' : 'text-zinc-400'
                  }`}>
                    {emp.variance > 0 ? '+' : ''}{formatCurrency(emp.variance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==================== RECONCILIATION TAB ==================== */
function ReconciliationTab({ data, monthYear }: { data: any; monthYear: string }) {
  const summary = data.summary || {};
  const projectCosts = data.projectCosts || [];
  const employeeRecon = data.employeeReconciliation || [];

  const gapIsPositive = (summary.reconciliationGap || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Reconciliation Summary */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Salary Paid"
          value={formatCurrency(summary.totalSalaryPaid || 0)}
          icon={<CreditCard className="h-4 w-4 text-primary" />}
          color="blue"
          subtitle={`${summary.totalEmployees || 0} employees`}
        />
        <MetricCard
          label="Labour Booked to Projects"
          value={formatCurrency(summary.totalLabourBooked || 0)}
          icon={<Briefcase className="h-4 w-4 text-emerald-600" />}
          color="emerald"
          subtitle={`${summary.totalHoursWorked || 0} hours tracked`}
        />
        <MetricCard
          label="Machine Cost Booked"
          value={formatCurrency(summary.totalMachineBooked || 0)}
          icon={<Building2 className="h-4 w-4 text-purple-600" />}
          color="purple"
        />
        <MetricCard
          label="Reconciliation Gap"
          value={formatCurrency(Math.abs(summary.reconciliationGap || 0))}
          icon={gapIsPositive
            ? <AlertCircle className="h-4 w-4 text-amber-600" />
            : <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          }
          color={gapIsPositive ? 'amber' : 'emerald'}
          trend={gapIsPositive ? 'up' : 'down'}
          trendLabel={gapIsPositive ? 'Overhead' : 'Surplus'}
          subtitle={gapIsPositive
            ? 'Salary exceeds project-allocated labour'
            : 'Labour booked exceeds salary paid'
          }
        />
      </div>

      {/* Reconciliation visual bar */}
      <div className="rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-ink mb-3">Salary vs Project Allocation</h3>
        <div className="space-y-3">
          <ReconciliationBar label="Salary Paid" value={summary.totalSalaryPaid || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-primary-subtle0" />
          <ReconciliationBar label="Labour Booked" value={summary.totalLabourBooked || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-emerald-500" />
          <ReconciliationBar label="Machine Cost" value={summary.totalMachineBooked || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Project-level costs */}
        <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle">
          <div className="px-4 py-3 bg-canvas/80 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
              Cost Booked by Project
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-4 py-2 font-medium text-mute text-[10px]">Project</th>
                  <th className="text-right px-3 py-2 font-medium text-mute text-[10px]">Labour</th>
                  <th className="text-right px-3 py-2 font-medium text-mute text-[10px]">Machine</th>
                  <th className="text-right px-4 py-2 font-medium text-mute text-[10px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {projectCosts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-zinc-400">No project costs this period</td></tr>
                ) : (
                  projectCosts.map((p: any) => (
                    <tr key={p.projectId} className="border-b border-zinc-50 hover:bg-canvas/50">
                      <td className="px-4 py-2">
                        <span className="font-medium text-ink">{p.projectNumber}</span>
                        <span className="block text-[10px] text-zinc-400 truncate max-w-[120px]">{p.partName}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-600">{formatCurrency(p.labourCost)}</td>
                      <td className="px-3 py-2 text-right text-zinc-600">{formatCurrency(p.machineCost)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-ink">{formatCurrency(p.totalCost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee allocation */}
        <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle">
          <div className="px-4 py-3 bg-canvas/80 border-b border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              Employee Utilization & Allocation
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-4 py-2 font-medium text-mute text-[10px]">Employee</th>
                  <th className="text-right px-3 py-2 font-medium text-mute text-[10px]">Util %</th>
                  <th className="text-right px-3 py-2 font-medium text-mute text-[10px]">Paid</th>
                  <th className="text-right px-3 py-2 font-medium text-mute text-[10px]">Allocated</th>
                  <th className="text-right px-4 py-2 font-medium text-mute text-[10px]">Gap</th>
                </tr>
              </thead>
              <tbody>
                {employeeRecon.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-zinc-400">No employee data</td></tr>
                ) : (
                  employeeRecon.map((emp: any) => (
                    <tr key={emp.id} className="border-b border-zinc-50 hover:bg-canvas/50">
                      <td className="px-4 py-2">
                        <span className="font-medium text-ink">{emp.name}</span>
                        <span className="block text-[10px] text-zinc-400">{emp.employeeCode}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                emp.utilizationPercent > 80 ? 'bg-emerald-500' :
                                emp.utilizationPercent > 40 ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(emp.utilizationPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-zinc-600 w-8 text-right">{emp.utilizationPercent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-600">{formatCurrency(emp.salaryPaid)}</td>
                      <td className="px-3 py-2 text-right text-zinc-600">{formatCurrency(emp.labourCostAllocated)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${
                        emp.variance > 0 ? 'text-amber-600' : emp.variance < 0 ? 'text-emerald-600' : 'text-zinc-400'
                      }`}>
                        {emp.variance > 0 ? '+' : ''}{formatCurrency(emp.variance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== RECONCILIATION BAR ==================== */
function ReconciliationBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-6 bg-canvas rounded-[12px] overflow-hidden border border-zinc-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color} rounded-[12px] flex items-center justify-end pr-2`}
        >
          {pct > 15 && (
            <span className="text-[10px] font-semibold text-white">{formatCurrency(value)}</span>
          )}
        </motion.div>
      </div>
      {pct <= 15 && (
        <span className="text-[10px] font-medium text-zinc-600 w-20">{formatCurrency(value)}</span>
      )}
    </div>
  );
}
