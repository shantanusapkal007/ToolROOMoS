"use client";

import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, CheckCircle2, AlertCircle, Zap, Edit3, PackageCheck, TrendingUp, Activity } from "lucide-react";
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
        // Fallback gracefully
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

  const monthlyTarget = metrics?.monthlyTarget || Math.round(estimatedRevenue / 12);
  const mtdRevenue = metrics?.mtdRevenue || 0;
  const targetPct = Math.min(100, Math.round((mtdRevenue / monthlyTarget) * 100));

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

  const rawHistory = metrics?.revenueHistory || [12, 24, 45, 30, 65, 50, 85, 70, 95, 60, 88];
  const maxHistoryVal = Math.max(...rawHistory.map((v: number) => Number(v) || 1), 1);

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-6 pb-24 hide-scrollbar space-y-6">
      
      {/* 1. Operational Narrative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-gray pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">
              Manufacturing Command Center
            </h1>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Real-time shopfloor capacity, project schedule, and financial telemetry.
          </p>
        </div>
      </div>

      {/* 2. Analytical KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Net Sales (Revenue - Success Theme) */}
        <div className="bg-white border border-border-gray rounded-[12px] p-4 sm:p-5 shadow-subtle flex flex-col justify-between hover:shadow-md hover:border-semantic-success/30 transition-all duration-200 group">
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cool-gray leading-tight">Monthly Sales (Excl. GST)</span>
            <div className="w-8 h-8 rounded-lg bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-semantic-success-dark tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.mtdSalesWithoutGst) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.mtdSalesWithoutGst) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue flex items-center justify-between mt-2 pt-2 border-t border-hairline/60 gap-1.5">
            <span className="truncate min-w-0" title="Net Tax-Free Realized">Net Realized</span>
            <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">Invoiced</span>
          </div>
        </div>

        {/* KPI 2: Monthly Realization (Target Tracking - Info Theme) */}
        <div className="bg-white border border-border-gray rounded-[12px] p-4 sm:p-5 shadow-subtle flex flex-col justify-between hover:shadow-md hover:border-semantic-info/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cool-gray leading-tight">Monthly Realization</span>
            <div className="w-8 h-8 rounded-lg bg-semantic-info-subtle text-semantic-info-dark flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-1 gap-2">
            <div className="text-2xl lg:text-3xl font-bold font-mono text-semantic-info-dark tracking-tight truncate" title={formatCurrency(mtdRevenue)}>
              {formatCompactCurrency(mtdRevenue)}
            </div>
            <span className="shrink-0 inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full text-semantic-info-dark bg-semantic-info-subtle border border-semantic-info/20">
              {targetPct}% Met
            </span>
          </div>
          {/* Micro Progress Bar */}
          <div className="w-full bg-hairline rounded-full h-1.5 mt-2 mb-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 bg-semantic-info-dark" 
              style={{ width: `${Math.min(100, targetPct)}%` }} 
            />
          </div>
          <div className="text-caption text-silver-blue flex justify-between items-center gap-1">
            <span className="truncate">Target: <strong className="font-mono text-ink">{formatCompactCurrency(monthlyTarget)}</strong></span>
          </div>
        </div>

        {/* KPI 3: GRN Material Purchase (Procurement - Warning Theme) */}
        <div className="bg-white border border-border-gray rounded-[12px] p-4 sm:p-5 shadow-subtle flex flex-col justify-between hover:shadow-md hover:border-semantic-warning/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cool-gray leading-tight">GRN Material Purchase</span>
            <div className="w-8 h-8 rounded-lg bg-semantic-warning-subtle text-semantic-warning-dark flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-semantic-warning-dark tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.totalGrnPurchaseValue) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.totalGrnPurchaseValue) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue flex items-center justify-between mt-2 pt-2 border-t border-hairline/60 gap-1.5">
            <span className="truncate min-w-0">GRN Total</span>
            <span className="shrink-0 font-mono text-[10px] sm:text-[11px] font-semibold text-semantic-warning-dark bg-semantic-warning-subtle px-1.5 py-0.5 rounded border border-semantic-warning/20 shadow-2xs">
              {metrics?.grnTotalReceiptsCount || 0} Receipts
            </span>
          </div>
        </div>

        {/* KPI 4: Target Deficit (Deficit & Risk Alert - Danger Theme) */}
        <div className="bg-white border border-border-gray rounded-[12px] p-4 sm:p-5 shadow-subtle flex flex-col justify-between hover:shadow-md hover:border-semantic-danger/30 transition-all duration-200">
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cool-gray leading-tight">Target Deficit</span>
            <div className="w-8 h-8 rounded-lg bg-semantic-danger-subtle text-semantic-danger-dark flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-semantic-danger-dark tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.monthlyRemaining) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.monthlyRemaining) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue flex items-center justify-between mt-2 pt-2 border-t border-hairline/60 gap-1.5">
            <span className="truncate min-w-0">Goal Deficit</span>
            <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20">
              Deficit
            </span>
          </div>
        </div>

        {/* KPI 5: Annual Revenue Target (Executive Target - Primary Kraken Theme) */}
        <div 
          onClick={() => { setEditInputValue(String(estimatedRevenue)); setIsEditModalOpen(true); }}
          className="bg-white border border-border-gray rounded-[12px] p-4 sm:p-5 shadow-subtle flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cool-gray leading-tight">Annual Target</span>
            <div className="w-8 h-8 rounded-lg bg-primary-subtle text-primary-dark flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-primary-dark tracking-tight mb-1 truncate" title={formatCurrency(estimatedRevenue)}>
            {formatCompactCurrency(estimatedRevenue)}
          </div>
          <div className="text-caption text-accent-blue-info font-medium flex items-center justify-between mt-2 pt-2 border-t border-hairline/60 gap-1.5">
            <span className="text-silver-blue truncate min-w-0">Estimated Goal</span>
            <span className="shrink-0 text-primary-dark font-semibold underline text-caption group-hover:text-primary-hover flex items-center gap-1">
              Edit
            </span>
          </div>
        </div>

      </div>

      {/* 3. Department Workload Overview Panel */}
      <DepartmentLoadOverview />

      {/* 4. Main Workspace: Active Projects Pipeline & Financial Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Projects Table */}
        <div className="lg:col-span-2 bg-white border border-border-gray rounded-[12px] p-6 shadow-subtle flex flex-col">
          <div className="flex justify-between items-center border-b border-border-gray pb-4 mb-4">
            <h3 className="text-display-xs font-medium text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink" />
              <span>Active Projects Schedule</span>
            </h3>
            <Button 
              variant="white" 
              size="sm"
              onClick={() => router.push('/projects')}
            >
              View All Projects
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm text-ink">
              <thead>
                <tr className="text-eyebrow-uppercase-sm text-mute uppercase font-medium border-b border-border-gray">
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Part Name</th>
                  <th className="pb-3">Stage</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
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
                      className="h-10 hover:bg-hairline/15 cursor-pointer transition-colors"
                    >
                      <td className="font-mono font-medium text-ink">{proj.projectNumber}</td>
                      <td className="font-normal text-body-mid truncate max-w-[160px]">{proj.partName}</td>
                      <td>
                        <span className="text-caption font-medium px-2 py-0.5 rounded-sm bg-canvas border border-border-gray text-ink">
                          {proj.currentStage?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-mute font-mono text-caption">
                        {hasTargetDate ? new Date(proj.targetDeliveryDate).toLocaleDateString() : <span className="text-mute-soft">Not Set</span>}
                      </td>
                      <td className="text-right">
                        {isDelayed ? (
                          <span className="text-caption font-medium px-2 py-0.5 rounded-sm border border-border-gray text-accent-red bg-canvas">
                            OVERDUE
                          </span>
                        ) : daysLeft !== null ? (
                          <span className="text-caption font-medium px-2 py-0.5 rounded-sm border border-border-gray text-accent-green bg-canvas">
                            {daysLeft} Days
                          </span>
                        ) : (
                          <span className="text-caption font-medium px-2 py-0.5 rounded-sm border border-border-gray text-mute bg-canvas">
                            ON TRACK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {activeProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-mute">
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
          <div className="bg-white border border-border-gray rounded-[12px] p-6 shadow-subtle space-y-4">
            <div className="flex justify-between items-center border-b border-border-gray pb-3">
              <h3 className="text-display-xs font-medium text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-green" />
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
                <span className="text-caption text-silver-blue">Open Receivables</span>
                <span className="text-body-sm font-semibold font-mono text-ink">
                  {metrics ? formatCurrency(Number(metrics.openInvoices)) : '₹0'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-caption text-silver-blue">Net Taxable Realization</span>
                <span className="text-body-sm font-semibold font-mono text-ink">
                  {metrics ? formatCurrency(Number(metrics.mtdSalesWithoutGst)) : '₹0'}
                </span>
              </div>
            </div>

            {/* Invoicing Velocity Sparkline */}
            <div className="pt-3 border-t border-hairline space-y-1">
              <span className="text-eyebrow-uppercase-sm font-medium text-mute uppercase">11-Period Velocity</span>
              <div className="h-12 w-full flex items-end gap-1 pt-1 overflow-hidden relative">
                {rawHistory.map((val: number, i: number) => {
                  const numVal = Number(val) || 0;
                  const heightPct = Math.min(100, Math.max(12, (numVal / maxHistoryVal) * 100));
                  return (
                    <div 
                      key={i} 
                      className="flex-1 bg-accent-green/30 hover:bg-accent-green rounded-t-xs transition-colors relative group"
                      style={{ height: `${heightPct}%` }}
                      title={`P${i+1}: ₹${numVal}k`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Critical Alerts Card */}
          <div className="bg-white border border-border-gray border-l-4 border-l-accent-red rounded-[12px] p-6 shadow-subtle">
            <div className="flex justify-between items-center border-b border-border-gray pb-3 mb-4">
              <h3 className="text-display-xs font-medium text-ink flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-red" />
                <span>Critical Shopfloor Alerts</span>
              </h3>
            </div>

            <div className="space-y-2">
              {delayedProjects.slice(0, 3).map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProject(p)}
                  className="p-3 rounded-sm bg-canvas border border-border-gray cursor-pointer hover:bg-hairline/15 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-caption font-semibold text-ink font-mono">{p.projectNumber}</span>
                    <span className="text-caption font-medium text-accent-red border border-border-gray px-1.5 py-0.5 rounded-sm">OVERDUE</span>
                  </div>
                  <p className="text-body-sm text-mute truncate">{p.partName}</p>
                </div>
              ))}

              {delayedProjects.length === 0 && (
                <div className="py-6 text-center text-mute space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-accent-green mx-auto" />
                  <p className="text-body-sm font-medium text-ink">All Systems Nominal</p>
                  <p className="text-caption text-silver-blue">Zero critical delays on the factory floor.</p>
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
            <label className="block text-body-sm-strong text-ink mb-1.5">
              Annual Target Amount (INR ₹)
            </label>
            <input
              type="number"
              value={editInputValue}
              onChange={(e) => setEditInputValue(e.target.value)}
              className="w-full px-4 py-3 border border-border-gray rounded-sm font-mono text-body-md text-ink bg-canvas focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="white" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Target</Button>
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
    <div className="hidden md:flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-sm border border-border-gray shadow-level-1">
      <div className="text-caption font-mono text-ink">
        <span className="text-mute mr-1">USD</span>₹{rates.usd.toFixed(1)}
      </div>
      <span className="text-hairline">|</span>
      <div className="text-caption font-mono text-ink">
        <span className="text-mute mr-1">EUR</span>₹{rates.eur.toFixed(1)}
      </div>
    </div>
  );
}
