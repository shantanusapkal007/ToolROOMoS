"use client";

import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, CheckCircle2, AlertCircle, Zap, Edit3, PackageCheck, TrendingUp } from "lucide-react";
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

  const monthlyTarget = metrics?.monthlyTarget || 15000000;
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
          <h1 className="text-display-sm font-semibold text-ink tracking-tight">
            Manufacturing Command Center
          </h1>
          <p className="text-body-md text-mute mt-0.5">
            Real-time shopfloor capacity, project schedule, and financial telemetry.
          </p>
        </div>
      </div>

      {/* 2. Analytical KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Net Sales */}
        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-center text-mute mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Monthly Sales (Excl. GST)</span>
            <DollarSign className="w-4 h-4 text-ink" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.mtdSalesWithoutGst) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.mtdSalesWithoutGst) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue truncate">
            Net tax-free realized invoices
          </div>
        </div>

        {/* KPI 2: Monthly Realization */}
        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Monthly Realization</span>
            <span className={`inline-flex items-center text-caption font-medium px-2 py-0.5 rounded-sm border ${targetPct >= 80 ? 'text-accent-green bg-canvas border-hairline' : 'text-accent-orange bg-canvas border-hairline'}`}>
              {targetPct}% Target
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight mb-1 truncate" title={formatCurrency(mtdRevenue)}>
            {formatCompactCurrency(mtdRevenue)}
          </div>
          <div className="text-caption text-silver-blue flex justify-between items-center truncate">
            <span>Target: {formatCompactCurrency(monthlyTarget)}</span>
            <span className="font-medium text-accent-green">{targetPct}% Met</span>
          </div>
        </div>

        {/* KPI 3: GRN Purchase Realization (All Projects) */}
        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-eyebrow-uppercase-sm font-medium uppercase text-ink">GRN Material Purchase</span>
            <PackageCheck className="w-4.5 h-4.5 text-accent-green" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.totalGrnPurchaseValue) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.totalGrnPurchaseValue) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue font-medium flex items-center justify-between truncate">
            <span>All Projects GRN Total</span>
            <span className="font-mono text-caption text-ink bg-canvas px-1.5 py-0.5 rounded-sm border border-border-gray">
              {metrics?.grnTotalReceiptsCount || 0} Receipts
            </span>
          </div>
        </div>

        {/* KPI 4: Deficit */}
        <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Target Deficit</span>
            <AlertCircle className="w-4 h-4 text-accent-orange" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight mb-1 truncate" title={metrics ? formatCurrency(metrics.monthlyRemaining) : '₹0'}>
            {metrics ? formatCompactCurrency(metrics.monthlyRemaining) : "₹0.0 L"}
          </div>
          <div className="text-caption text-silver-blue truncate">
            Deficit left to achieve target
          </div>
        </div>

        {/* KPI 5: Annual Revenue Target */}
        <div 
          onClick={() => { setEditInputValue(String(estimatedRevenue)); setIsEditModalOpen(true); }}
          className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors group"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Annual Target</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setEditInputValue(String(estimatedRevenue)); setIsEditModalOpen(true); }}
              className="p-1 text-mute hover:text-ink rounded-sm transition-colors"
              title="Edit Target Amount"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight mb-1 truncate" title={formatCurrency(estimatedRevenue)}>
            {formatCompactCurrency(estimatedRevenue)}
          </div>
          <div className="text-caption text-accent-blue-info font-medium flex items-center justify-between">
            <span>Estimated Goal</span>
            <span className="underline group-hover:text-accent-blue-deep">Edit</span>
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
