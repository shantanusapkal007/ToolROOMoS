"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Activity, TrendingUp, DollarSign, CheckCircle2, AlertCircle, Zap, Target, Edit3, PackageCheck } from "lucide-react";

import { useRouter } from 'next/navigation';
import { DepartmentLoadOverview } from './DepartmentLoadOverview';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { formatCurrency } from '../../lib/formatters';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';

interface MissionControlProps {
  projects: any[];
  onSelectProject: (proj: any) => void;
}

export function MissionControl({ projects, onSelectProject }: MissionControlProps) {
  const { data: metrics } = useDashboardMetrics();
  const router = useRouter();
  const toast = useToast();
  const [estimatedRevenue, setEstimatedRevenue] = useState<number>(15000000);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editInputValue, setEditInputValue] = useState<string>('15000000');

  useEffect(() => {
    let isSubscribed = true;
    async function fetchRevenueTarget() {
      try {
        const res: any = await api.get('settings/preferences/estimated_revenue_target');
        const val = res.data !== undefined ? res.data : res;
        if (isSubscribed && val && !isNaN(Number(val))) {
          setEstimatedRevenue(Number(val));
        }
      } catch (e) {
        // Fallback gracefully if preference server endpoint is unreachable or booting
      }

    }
    fetchRevenueTarget();
    return () => { isSubscribed = false; };
  }, []);

  const handleSaveEstimatedRevenue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(editInputValue);
    if (!isNaN(num) && num >= 0) {
      setEstimatedRevenue(num);
      try {
        await api.post('settings/preferences', { key: 'estimated_revenue_target', value: num });
        setIsEditModalOpen(false);
        toast.success('Revenue Target updated successfully.');
      } catch (err) {
        toast.error('Failed to save revenue target.');
      }
    } else {
      toast.error('Enter a valid numeric amount');
    }
  };

  const activeProjects = projects.filter(p => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED");
  const delayedProjects = activeProjects.filter(p => p.targetDeliveryDate && new Date(p.targetDeliveryDate).getTime() < new Date().getTime());

  const monthlyTarget = metrics?.monthlyTarget || 15000000;
  const mtdRevenue = metrics?.mtdRevenue || 0;
  const targetPct = Math.min(100, Math.round((mtdRevenue / monthlyTarget) * 100));

  // Compact currency formatter to avoid card text overflows
  const formatCompactCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '₹0.0 L';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    }
    return formatCurrency(amount);
  };

  // Sparkline data normalization
  const rawHistory = metrics?.revenueHistory || [12, 24, 45, 30, 65, 50, 85, 70, 95, 60, 88];
  const maxHistoryVal = Math.max(...rawHistory.map((v: number) => Number(v) || 1), 1);

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-6 pb-24 hide-scrollbar space-y-6">
      
      {/* 1. Operational Narrative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-4 gap-4">
        <div>
          <h1 className="text-page-title font-bold text-zinc-900 tracking-tight">
            Manufacturing Command Center
          </h1>
          <p className="text-body text-zinc-500 font-normal mt-0.5">
            Real-time shopfloor capacity, project schedule, and financial telemetry.
          </p>
        </div>

        {/* Live Clock & FX Widget */}
        <div className="flex items-center gap-3">
          <div className="text-right bg-white px-3 py-1.5 rounded-md border border-zinc-200 shadow-xs">
            <div className="text-caption font-bold font-mono text-zinc-900">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-micro font-semibold text-blue-600">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
            </div>
          </div>
          <CurrencyWidget />
        </div>
      </div>

      {/* 2. Analytical KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Net Sales */}
        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-zinc-500 mb-2">
            <span className="text-micro font-semibold uppercase text-zinc-500">Monthly Sales (Excl. GST)</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.mtdSalesWithoutGst) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.mtdSalesWithoutGst) : "₹0.0 L"}
          </div>
          <div className="text-caption text-zinc-500 truncate">
            Net tax-free realized invoices
          </div>
        </div>

        {/* KPI 2: Monthly Realization */}
        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-micro font-semibold uppercase text-zinc-500">Monthly Realization</span>
            <span className={`inline-flex items-center text-micro font-bold px-1.5 py-0.5 rounded border ${targetPct >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
              {targetPct}% Target
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight mb-1 truncate" title={formatCurrency(mtdRevenue)}>
            {formatCompactCurrency(mtdRevenue)}
          </div>
          <div className="text-caption text-zinc-500 flex justify-between items-center truncate">
            <span>Target: {formatCompactCurrency(monthlyTarget)}</span>
            <span className="font-semibold text-emerald-600">{targetPct}% Met</span>
          </div>
        </div>

        {/* KPI 3: GRN Purchase Realization (All Projects) */}
        <div className="enterprise-card p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 border border-emerald-200/80 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-micro font-extrabold uppercase text-emerald-900 tracking-wider">GRN Material Purchase</span>
            <PackageCheck className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950 tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.totalGrnPurchaseValue) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.totalGrnPurchaseValue) : "₹0.0 L"}
          </div>
          <div className="text-caption text-emerald-800 font-medium flex items-center justify-between truncate">
            <span>All Projects GRN Total</span>
            <span className="font-mono font-bold text-emerald-900 text-[10px] bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">
              {metrics?.grnTotalReceiptsCount || 0} Receipts
            </span>
          </div>
        </div>

        {/* KPI 4: Deficit */}
        <div className="enterprise-card p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-micro font-semibold uppercase text-zinc-500">Target Deficit</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.monthlyRemaining) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.monthlyRemaining) : "₹0.0 L"}
          </div>
          <div className="text-caption text-zinc-500 truncate">
            Deficit left to achieve target
          </div>
        </div>

        {/* KPI 5: Annual Revenue Target */}
        <div 
          onClick={() => { setEditInputValue(String(estimatedRevenue)); setIsEditModalOpen(true); }}
          className="enterprise-card p-4 flex flex-col justify-between cursor-pointer hover:border-zinc-300 transition-colors group"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-micro font-semibold uppercase text-zinc-500">Annual Target</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setEditInputValue(String(estimatedRevenue)); setIsEditModalOpen(true); }}
              className="p-1 text-zinc-400 hover:text-zinc-900 rounded transition-colors"
              title="Edit Target Amount"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 tracking-tight mb-1 truncate" title={formatCurrency(estimatedRevenue)}>
            {formatCompactCurrency(estimatedRevenue)}
          </div>
          <div className="text-caption text-blue-600 font-semibold flex items-center justify-between">
            <span>Estimated Goal</span>
            <span className="underline group-hover:text-blue-700">Edit</span>
          </div>
        </div>

      </div>


      {/* 3. Department Workload Overview Panel */}
      <DepartmentLoadOverview />

      {/* 4. Main Workspace: Active Projects Pipeline & Financial Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Projects Table */}
        <div className="lg:col-span-2 enterprise-panel p-4 flex flex-col">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-3">
            <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Active Projects Schedule</span>
            </h3>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/projects')}
            >
              View All Projects
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-caption text-zinc-800">
              <thead>
                <tr className="text-micro text-zinc-400 uppercase font-bold border-b border-zinc-200">
                  <th className="pb-2.5">Project</th>
                  <th className="pb-2.5">Part Name</th>
                  <th className="pb-2.5">Stage</th>
                  <th className="pb-2.5">Due Date</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {activeProjects.slice(0, 8).map((proj) => {
                  const hasTargetDate = !!proj.targetDeliveryDate;
                  const isDelayed = hasTargetDate && new Date(proj.targetDeliveryDate).getTime() < new Date().getTime();
                  const daysLeft = hasTargetDate 
                    ? Math.max(0, Math.ceil((new Date(proj.targetDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
                    : null;

                  return (
                    <tr 
                      key={proj.id} 
                      onClick={() => onSelectProject(proj)}
                      className="h-9 hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <td className="font-bold text-zinc-900 font-mono">{proj.projectNumber}</td>
                      <td className="font-medium text-zinc-700 truncate max-w-[160px]">{proj.partName}</td>
                      <td>
                        <span className="text-micro font-semibold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                          {proj.currentStage?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-zinc-500 font-mono text-xs">
                        {hasTargetDate ? new Date(proj.targetDeliveryDate).toLocaleDateString() : <span className="text-zinc-300">Not Set</span>}
                      </td>
                      <td className="text-right">
                        {isDelayed ? (
                          <span className="text-micro font-bold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">
                            OVERDUE
                          </span>
                        ) : daysLeft !== null ? (
                          <span className="text-micro font-bold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                            {daysLeft} Days
                          </span>
                        ) : (
                          <span className="text-micro font-medium px-2 py-0.5 rounded border text-zinc-600 bg-zinc-50 border-zinc-200">
                            ON TRACK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {activeProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No active projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Financial Pulse & Critical Alerts */}
        <div className="space-y-6">
          
          {/* Financial Telemetry Card */}
          <div className="enterprise-panel p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
              <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Financial Pulse</span>
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/reports')}
              >
                Reports
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-caption text-zinc-500">Open Receivables</span>
                <span className="text-body font-bold font-mono text-zinc-900">
                  {metrics ? formatCurrency(Number(metrics.openInvoices)) : '₹0'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-caption text-zinc-500">Net Taxable Realization</span>
                <span className="text-body font-bold font-mono text-zinc-900">
                  {metrics ? formatCurrency(Number(metrics.mtdSalesWithoutGst)) : '₹0'}
                </span>
              </div>
            </div>

            {/* Invoicing Velocity Sparkline (Capped & Contained Height) */}
            <div className="pt-2 border-t border-zinc-200 space-y-1">
              <span className="text-micro font-semibold text-zinc-500 uppercase">11-Period Velocity</span>
              <div className="h-12 w-full flex items-end gap-1 pt-1 overflow-hidden relative">
                {rawHistory.map((val: number, i: number) => {
                  const numVal = Number(val) || 0;
                  const heightPct = Math.min(100, Math.max(12, (numVal / maxHistoryVal) * 100));
                  return (
                    <div 
                      key={i} 
                      className="flex-1 bg-emerald-500/30 hover:bg-emerald-600 rounded-t transition-colors relative group"
                      style={{ height: `${heightPct}%` }}
                      title={`P${i+1}: ₹${numVal}k`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Critical Alerts Card */}
          <div className="enterprise-panel p-4 border-l-4 border-l-red-500">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5 mb-3">
              <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-600" />
                <span>Critical Shopfloor Alerts</span>
              </h3>
            </div>

            <div className="space-y-2">
              {delayedProjects.slice(0, 3).map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p)}
                  className="p-2.5 rounded bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100/60 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-caption font-bold text-zinc-900 font-mono">{p.projectNumber}</span>
                    <span className="text-micro font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">OVERDUE</span>
                  </div>
                  <p className="text-caption text-zinc-600 truncate">{p.partName}</p>
                </div>
              ))}

              {delayedProjects.length === 0 && (
                <div className="py-6 text-center text-zinc-500 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="text-caption font-semibold text-zinc-800">All Systems Nominal</p>
                  <p className="text-micro text-zinc-400">Zero critical delays on the factory floor.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Target Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Estimated Revenue Target"
        subtitle="Set the annual estimated revenue target for shopfloor telemetry."
      >
        <form onSubmit={handleSaveEstimatedRevenue} className="space-y-4">
          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">
              Annual Target Amount (INR &#8377;)
            </label>
            <input
              type="number"
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md font-mono text-body font-bold"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Target</Button>
          </div>
        </form>
      </Modal>

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
      .catch(() => {});
  }, []);

  if (!rates) return null;

  return (
    <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-zinc-200 shadow-xs">
      <div className="text-caption font-mono text-zinc-700">
        <span className="text-zinc-400 mr-1">USD</span>₹{rates.usd.toFixed(1)}
      </div>
      <span className="text-zinc-200">|</span>
      <div className="text-caption font-mono text-zinc-700">
        <span className="text-zinc-400 mr-1">EUR</span>₹{rates.eur.toFixed(1)}
      </div>
    </div>
  );
}
