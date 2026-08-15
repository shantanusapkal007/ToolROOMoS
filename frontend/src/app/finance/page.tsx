"use client";

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  DollarSign, TrendingUp, TrendingDown, Briefcase, Users,
  Clock, PieChart as PieChartIcon, BarChart3, ArrowUpRight,
  ArrowDownRight, Search, Filter, Calendar, Layers,
  CreditCard, Building2, Activity, AlertCircle, CheckCircle2,
  ChevronRight, Download, Edit2, Eye, X, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFinanceDashboard,
  useProjectProfitability,
  usePayrollVsRevenue,
  useCostBreakdown,
  usePayrollFinanceReconciliation,
  useMonthlyPayroll,
  useUpsertMonthlySalary,
} from '@/hooks/useFinance';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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
  const { data: reconciliationRaw, isLoading: reconLoading } = usePayrollFinanceReconciliation(monthYear);
  const { data: payrollRaw, isLoading: payrollLoading } = useMonthlyPayroll(monthYear);

  // Safe data extraction (defensive unwrapping)
  const dashboard = (dashboardRaw as any)?.data || (dashboardRaw as any) || {};
  const profitability = Array.isArray(profitabilityRaw) 
    ? profitabilityRaw 
    : (profitabilityRaw as any)?.data || [];
  const trend = Array.isArray(trendRaw) ? trendRaw : (trendRaw as any)?.data || [];
  const breakdown = (breakdownRaw as any)?.data || (breakdownRaw as any) || { categories: [], total: 0 };
  
  const reconciliation = (reconciliationRaw as any)?.data !== undefined && (reconciliationRaw as any)?.data?.summary !== undefined
    ? (reconciliationRaw as any).data
    : (reconciliationRaw as any) || { summary: {}, projectCosts: [], employeeReconciliation: [] };
    
  const payroll = (payrollRaw as any)?.data !== undefined && (payrollRaw as any)?.data?.summary !== undefined
    ? (payrollRaw as any).data
    : (payrollRaw as any) || { summary: {}, employees: [] };

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
                    transition-all duration-150 cursor-pointer
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
                <PayrollTab payroll={payroll} monthYear={monthYear} loading={payrollLoading} />
              </motion.div>
            )}
            {activeTab === 'reconciliation' && (
              <motion.div key="reconciliation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <ReconciliationTab data={reconciliation} monthYear={monthYear} loading={reconLoading} />
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
          <div key={`skel-dash-${i}`} className="h-32 rounded-[12px] bg-zinc-100 animate-pulse" />
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
          subtitle={`Collected: ${formatCurrency(dashboard.totalCollected || 0)}`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <div className="col-span-1 rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Cost Distribution</h3>
              <p className="text-[11px] text-mute">Direct project cost breakdown</p>
            </div>
            <PieChartIcon className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="space-y-3">
            {categories.map((cat: any, idx: number) => {
              const pct = totalCost > 0 ? ((cat.value / totalCost) * 100).toFixed(1) : '0';
              return (
                <div key={cat.name || `cost-cat-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">{cat.name}</span>
                    <span className="font-semibold text-ink font-mono">{formatCurrency(cat.value)} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-canvas rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.name === 'Material' ? 'bg-emerald-500' :
                        cat.name === 'Labour' ? 'bg-primary-subtle0' :
                        cat.name === 'Machine' ? 'bg-purple-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payroll vs Revenue Trend */}
        <div className="col-span-2 rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Revenue vs Payroll Trend</h3>
              <p className="text-[11px] text-mute">Monthly trajectory</p>
            </div>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="h-48 flex items-end gap-6 px-4 pt-4 border-b border-zinc-100">
            {trend.map((m: any, idx: number) => {
              const maxVal = Math.max(...trend.map((t: any) => Math.max(t.revenue || 0, t.payroll || 0, 1)));
              const revH = ((m.revenue || 0) / maxVal) * 140;
              const payH = ((m.payroll || 0) / maxVal) * 140;
              return (
                <div key={m.month || m.monthYear || m.label || `trend-${idx}`} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex justify-center gap-1.5 items-end h-[140px]">
                    <div
                      className="w-4 bg-emerald-500/80 rounded-t-sm group-hover:bg-emerald-500 transition-colors"
                      style={{ height: `${Math.max(revH, 4)}px` }}
                      title={`Revenue: ${formatCurrency(m.revenue)}`}
                    />
                    <div
                      className="w-4 bg-primary-subtle0/80 rounded-t-sm group-hover:bg-primary-subtle0 transition-colors"
                      style={{ height: `${Math.max(payH, 4)}px` }}
                      title={`Payroll: ${formatCurrency(m.payroll)}`}
                    />
                  </div>
                  <span className="text-[10px] text-mute font-medium mt-1">{m.month || m.label || m.monthYear}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-mute">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
              <span>Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-xs bg-primary-subtle0" />
              <span>Payroll</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== PROFITABILITY TAB ==================== */
function ProfitabilityTab({ data, loading, search, setSearch, sort, setSort }: any) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={`skel-prof-${i}`} className="h-12 rounded-[12px] bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by project, part, or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-[12px] border border-border-gray bg-white focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-mute">Sort by:</span>
          {(['margin', 'revenue', 'cost'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 text-xs rounded-[12px] font-medium transition-colors cursor-pointer ${
                sort === s
                  ? 'bg-zinc-900 text-white'
                  : 'bg-canvas text-mute hover:text-ink border border-border-gray'
              }`}
            >
              {s === 'margin' ? 'Margin %' : s === 'revenue' ? 'Revenue' : 'Total Cost'}
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
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Contract Value</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Material</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Labour</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Machine</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Total Cost</th>
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Profit</th>
              <th className="text-right px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Margin</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-400">
                  <Briefcase className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No project profitability data available
                </td>
              </tr>
            ) : (
              data.map((p: any, idx: number) => (
                <tr key={p.id || p.projectId || p.projectNumber || `profit-row-${idx}`} className="border-b border-zinc-50 hover:bg-canvas/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-ink">{p.projectNumber}</span>
                    <span className="block text-[10px] text-zinc-400 truncate max-w-[140px]">{p.partName}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600">{p.customerName || '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">{formatCurrency(p.revenue)}</td>
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
function PayrollTab({ payroll, monthYear, loading }: { payroll: any; monthYear: string; loading?: boolean }) {
  const summary = payroll.summary || {};
  const employees = payroll.employees || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isWorkLogsModalOpen, setIsWorkLogsModalOpen] = useState(false);
  const [customSalary, setCustomSalary] = useState<number>(0);
  const [customRemarks, setCustomRemarks] = useState('');

  const upsertSalary = useUpsertMonthlySalary();

  // Extract unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e: any) => {
      if (e.department?.name) set.add(e.department.name);
    });
    return Array.from(set);
  }, [employees]);

  const filtered = useMemo(() => {
    let list = [...employees];
    if (selectedDept !== 'ALL') {
      list = list.filter((e: any) => e.department?.name === selectedDept);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e: any) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeCode?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q) ||
        e.department?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, searchQuery, selectedDept]);

  const handleOpenAdjustModal = (emp: any) => {
    setSelectedEmployee(emp);
    setCustomSalary(emp.actualSalary || emp.baseSalaryCalculated || 0);
    setCustomRemarks(emp.remarks || '');
    setIsAdjustModalOpen(true);
  };

  const handleOpenWorkLogsModal = (emp: any) => {
    setSelectedEmployee(emp);
    setIsWorkLogsModalOpen(true);
  };

  const handleSaveAdjustSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    await upsertSalary.mutateAsync({
      employeeId: selectedEmployee.id,
      monthYear,
      actualSalary: Number(customSalary),
      remarks: customRemarks,
    });

    setIsAdjustModalOpen(false);
  };

  const handleExportCSV = () => {
    if (employees.length === 0) return;
    const headers = [
      'Employee Code', 'Name', 'Designation', 'Department', 'Hourly Rate (INR)',
      'Total Hours', 'Standard Hours', 'Base Salary (INR)', 'Actual Salary (INR)', 'Variance (INR)', 'Remarks'
    ];
    const rows = employees.map((e: any) => [
      e.employeeCode,
      `"${e.name}"`,
      `"${e.designation || ''}"`,
      `"${e.department?.name || ''}"`,
      e.hourlyRate,
      e.totalHours,
      e.standardHours,
      e.baseSalaryCalculated,
      e.actualSalary,
      e.variance,
      `"${e.remarks || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payroll_Register_${monthYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[12px] bg-zinc-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-[12px] bg-zinc-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Employees"
          value={String(summary.totalEmployees || employees.length || 0)}
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
          label="Actual Salary Paid"
          value={formatCurrency(summary.totalActualSalary || 0)}
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          color="emerald"
          trend={summary.totalVariance > 0 ? 'up' : summary.totalVariance < 0 ? 'down' : 'neutral'}
          trendLabel={`Var: ${formatCurrency(Math.abs(summary.totalVariance || 0))}`}
        />
      </div>

      {/* Search & Action Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search employees by name, code, designation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-[12px] border border-border-gray bg-white focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
            />
          </div>

          <Select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            containerClassName="w-48"
            size="sm"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          disabled={employees.length === 0}
          className="flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Export Payroll CSV
        </Button>
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
              <th className="text-right px-3 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Variance</th>
              <th className="text-center px-4 py-2.5 font-semibold text-mute uppercase tracking-wider text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-400">
                  <Users className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  No employee records found for this period ({monthYear})
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
                    <button
                      onClick={() => handleOpenWorkLogsModal(emp)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-primary-subtle text-primary-dark hover:bg-primary/20 transition-colors cursor-pointer"
                      title="Click to view work breakdown"
                    >
                      {emp.projectCount || 0} tools <Eye className="w-2.5 h-2.5" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right text-zinc-600">{formatCurrency(emp.baseSalaryCalculated)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">
                    {formatCurrency(emp.actualSalary)}
                    {emp.isCustomSalary && (
                      <span className="ml-1 text-[9px] text-primary font-normal" title={emp.remarks || 'Adjusted salary'}>
                        (adj)
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${
                    emp.variance > 0 ? 'text-rose-600' : emp.variance < 0 ? 'text-emerald-600' : 'text-zinc-400'
                  }`}>
                    {emp.variance > 0 ? '+' : ''}{formatCurrency(emp.variance)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleOpenAdjustModal(emp)}
                      className="p-1 rounded-[6px] hover:bg-zinc-100 text-cool-gray hover:text-ink transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                      title="Adjust actual payout / bonus / deduction"
                    >
                      <Edit2 className="w-3 h-3 text-primary" /> Adjust
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Salary Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Monthly Salary — ${selectedEmployee.name}`}
          subtitle={`Employee: ${selectedEmployee.employeeCode} (${selectedEmployee.designation}) • Month: ${monthYear}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveAdjustSalary} className="space-y-4 text-xs">
            <div className="p-3 bg-canvas border border-border-gray rounded-[10px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-mute">Hourly Rate:</span>
                <span className="font-semibold text-ink">₹{selectedEmployee.hourlyRate} / hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Hours Worked (Tracked):</span>
                <span className="font-semibold text-ink">{selectedEmployee.totalHours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Calculated Base Salary:</span>
                <span className="font-semibold text-ink">{formatCurrency(selectedEmployee.baseSalaryCalculated)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Actual Payout Salary (INR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={customSalary}
                onChange={(e) => setCustomSalary(Number(e.target.value))}
                step="1"
                min="0"
                required
                className="w-full h-10 bg-canvas border border-border-gray px-3 text-sm font-semibold text-ink rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
                Adjustment Reason / Remarks
              </label>
              <input
                type="text"
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="e.g. Overtime allowance, performance bonus, deduction..."
                className="w-full h-9 bg-canvas border border-border-gray px-3 text-xs text-ink rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
              />
            </div>

            <div className="pt-3 border-t border-border-gray flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={upsertSalary.isPending}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Employee Work Logs Drilldown Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isWorkLogsModalOpen}
          onClose={() => setIsWorkLogsModalOpen(false)}
          title={`Work Breakdown — ${selectedEmployee.name}`}
          subtitle={`${selectedEmployee.employeeCode} • ${selectedEmployee.totalHours} hours logged across ${selectedEmployee.projectCount || 0} tools in ${monthYear}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {(!selectedEmployee.projects || selectedEmployee.projects.length === 0) ? (
              <p className="text-center py-8 text-mute">No direct project hours booked in this period.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedEmployee.projects.map((p: any) => (
                  <div key={p.projectId} className="p-3 bg-canvas border border-border-gray rounded-[10px] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-ink">{p.projectNumber}</span>
                        <span className="text-mute ml-2">— {p.partName} ({p.customerName})</span>
                      </div>
                      <span className="font-semibold text-primary">{p.hours} hrs</span>
                    </div>

                    {p.activities && p.activities.length > 0 && (
                      <div className="pl-3 border-l-2 border-primary/30 space-y-1">
                        {p.activities.map((act: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-[11px] text-zinc-600">
                            <span>{act.activityType} ({act.description || 'Task'})</span>
                            <span className="font-mono">{act.hours}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ==================== RECONCILIATION TAB ==================== */
function ReconciliationTab({ data, monthYear, loading }: { data: any; monthYear: string; loading?: boolean }) {
  const summary = data.summary || {};
  const projectCosts = data.projectCosts || [];
  const employeeRecon = data.employeeReconciliation || [];
  const [projectSearch, setProjectSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projectCosts;
    const q = projectSearch.toLowerCase();
    return projectCosts.filter((p: any) =>
      p.projectNumber?.toLowerCase().includes(q) ||
      p.partName?.toLowerCase().includes(q)
    );
  }, [projectCosts, projectSearch]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employeeRecon;
    const q = employeeSearch.toLowerCase();
    return employeeRecon.filter((e: any) =>
      e.name?.toLowerCase().includes(q) ||
      e.employeeCode?.toLowerCase().includes(q)
    );
  }, [employeeRecon, employeeSearch]);

  const gapIsPositive = (summary.reconciliationGap || 0) > 0;

  const handleExportReconciliation = () => {
    if (projectCosts.length === 0 && employeeRecon.length === 0) return;
    const lines = [
      `Payroll & Finance Reconciliation Report — ${monthYear}`,
      `Total Salary Paid,${summary.totalSalaryPaid || 0}`,
      `Total Labour Booked,${summary.totalLabourBooked || 0}`,
      `Total Machine Cost Booked,${summary.totalMachineBooked || 0}`,
      `Reconciliation Gap,${summary.reconciliationGap || 0}`,
      '',
      '--- PROJECT COST ALLOCATION ---',
      'Project Number,Part Name,Labour Cost,Machine Cost,Total Cost'
    ];

    projectCosts.forEach((p: any) => {
      lines.push(`"${p.projectNumber}","${p.partName}",${p.labourCost},${p.machineCost},${p.totalCost}`);
    });

    lines.push('');
    lines.push('--- EMPLOYEE UTILIZATION & RECONCILIATION ---');
    lines.push('Employee Code,Name,Utilization %,Salary Paid,Labour Allocated,Variance');

    employeeRecon.forEach((e: any) => {
      lines.push(`"${e.employeeCode}","${e.name}",${e.utilizationPercent}%,${e.salaryPaid},${e.labourCostAllocated},${e.variance}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reconciliation_Report_${monthYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[12px] bg-zinc-100 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-[12px] bg-zinc-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Salary Paid"
          value={formatCurrency(summary.totalSalaryPaid || 0)}
          icon={<CreditCard className="h-4 w-4 text-primary" />}
          color="blue"
          subtitle={`${summary.totalEmployees || employeeRecon.length || 0} employees`}
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

      {/* Reconciliation visual bar & Header */}
      <div className="rounded-[12px] bg-white border border-border-gray/60 p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">Salary vs Project Allocation Comparison</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportReconciliation}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Reconciliation CSV
          </Button>
        </div>
        <div className="space-y-3">
          <ReconciliationBar label="Salary Paid" value={summary.totalSalaryPaid || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-primary-subtle0" />
          <ReconciliationBar label="Labour Booked" value={summary.totalLabourBooked || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-emerald-500" />
          <ReconciliationBar label="Machine Cost" value={summary.totalMachineBooked || 0} max={Math.max(summary.totalSalaryPaid || 0, summary.totalLabourBooked || 0, 1)} color="bg-purple-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project-level costs */}
        <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle flex flex-col">
          <div className="px-4 py-3 bg-canvas/80 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
              Cost Booked by Project
            </h3>
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 text-[11px] rounded-[6px] border border-border-gray bg-white focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto flex-1">
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
                {filteredProjects.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-zinc-400">No project costs booked for this period</td></tr>
                ) : (
                  filteredProjects.map((p: any) => (
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
        <div className="rounded-[12px] bg-white border border-border-gray/60 overflow-hidden shadow-subtle flex flex-col">
          <div className="px-4 py-3 bg-canvas/80 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              Employee Utilization & Allocation
            </h3>
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={employeeSearch}
                onChange={e => setEmployeeSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 text-[11px] rounded-[6px] border border-border-gray bg-white focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto flex-1">
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
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-zinc-400">No employee reconciliation data</td></tr>
                ) : (
                  filteredEmployees.map((emp: any) => (
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
