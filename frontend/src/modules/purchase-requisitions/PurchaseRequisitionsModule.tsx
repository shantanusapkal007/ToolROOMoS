"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Printer, 
  Download, 
  Eye, 
  Trash2, 
  RefreshCw,
  Send,
  Layers
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonBox } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { 
  PurchaseRequisition, 
  PrnSummary, 
  PurchaseRequisitionsService 
} from '@/services/purchase-requisitions.service';
import { CreatePrnModal } from './CreatePrnModal';
import { PrnDetailDrawer } from './PrnDetailDrawer';
import { AuthenticPrnDocument } from './AuthenticPrnDocument';
import { ConvertToPoModal } from './ConvertToPoModal';
import { exportPrnToExcel } from './prnExcelExporter';

interface PurchaseRequisitionsModuleProps {
  projectId?: string;
}

export function PurchaseRequisitionsModule({ projectId }: PurchaseRequisitionsModuleProps) {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'converted' | 'urgent'>('all');
  const [prns, setPrns] = useState<PurchaseRequisition[]>([]);
  const [summary, setSummary] = useState<PrnSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals & Drawers State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrn, setSelectedPrn] = useState<PurchaseRequisition | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [printPrn, setPrintPrn] = useState<PurchaseRequisition | null>(null);
  const [convertingPrn, setConvertingPrn] = useState<PurchaseRequisition | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam: string | undefined = undefined;
      let priorityParam: string | undefined = undefined;

      if (activeTab === 'pending') statusParam = 'PENDING';
      if (activeTab === 'approved') statusParam = 'APPROVED';
      if (activeTab === 'converted') statusParam = 'CONVERTED';
      if (activeTab === 'urgent') priorityParam = 'URGENT';

      const [prnData, summaryData] = await Promise.all([
        PurchaseRequisitionsService.listPrns({
          projectId,
          status: statusParam,
          priority: priorityParam,
          category: categoryFilter || undefined,
          search: searchQuery || undefined,
        }),
        PurchaseRequisitionsService.getSummary(projectId),
      ]);

      setPrns(Array.isArray(prnData) ? prnData : []);
      setSummary(summaryData);
    } catch (err: any) {
      console.warn('Failed to load PRNs:', err);
      setPrns([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, projectId, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (prn: PurchaseRequisition) => {
    if (!window.confirm(`Are you sure you want to delete Requisition "${prn.prNumber}"? This cannot be undone.`)) {
      return;
    }

    try {
      await PurchaseRequisitionsService.deletePrn(prn.id);
      success('Requisition Deleted', `PRN ${prn.prNumber} has been removed.`);
      fetchData();
    } catch (err: any) {
      error('Delete Failed', err?.response?.data?.message || err?.message || 'Failed to delete requisition.');
    }
  };

  const handleOpenDetail = (prn: PurchaseRequisition) => {
    setSelectedPrn(prn);
    setIsDrawerOpen(true);
  };

  const filteredPrns = prns.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.prNumber.toLowerCase().includes(q) ||
      p.requestedBy?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.project?.projectNumber.toLowerCase().includes(q) ||
      p.project?.partName.toLowerCase().includes(q)
    );
  });

  // If in Print Voucher preview mode
  if (printPrn) {
    return (
      <div className="space-y-6">
        <AuthenticPrnDocument prn={printPrn} onBack={() => setPrintPrn(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-ink font-sans pb-20">
      {/* Design System Header */}
      {!projectId ? (
        <PageHeader
          title="Purchase Requisition Notes (PRN)"
          description="Internal material requisitions, shop-floor demands, and managerial authorization for tooling procurement"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Procurement', href: '/purchase-orders' },
            { label: 'Purchase Requisitions' },
          ]}
          icon={<FileText className="w-5 h-5 text-primary" />}
          actions={
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Requisition (PRN)
            </Button>
          }
        />
      ) : (
        <div className="flex items-center justify-between bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Project Material Requisitions (PRN)
            </h2>
            <p className="text-caption text-mute">Requisitions and material demands raised for this project</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Project PRN
          </Button>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 hide-on-print">
        {/* Total Requisitions */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Total PRNs</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{summary?.totalCount ?? 0}</div>
            <div className="text-caption text-mute mt-0.5">All raised requisitions</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-semantic-warning-dark uppercase tracking-wider">Pending Approval</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{summary?.pendingApproval ?? 0}</div>
            <div className="text-caption text-mute mt-0.5">Awaiting manager sign-off</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-warning-subtle flex items-center justify-center text-semantic-warning-dark">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approved (Ready for PO) */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-semantic-success-dark uppercase tracking-wider">Approved (Ready)</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{summary?.approved ?? 0}</div>
            <div className="text-caption text-mute mt-0.5">Authorized for PO issuance</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Converted to PO */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">Converted to PO</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{summary?.convertedToPo ?? 0}</div>
            <div className="text-caption text-mute mt-0.5">Active Purchase Orders</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle flex items-center justify-center text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Total Est. Value */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Total Est. Value</div>
            <div className="text-xl font-bold text-ink mt-0.5 font-mono">
              ₹{Number(summary?.totalEstimatedValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-caption text-mute mt-0.5">Requisitioned material cost</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-canvas border border-border-gray flex items-center justify-center text-ink">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden space-y-4 p-5">
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-gray pb-4">
          <Tabs
            activeTab={activeTab}
            onChange={(t) => setActiveTab(t as any)}
            tabs={[
              { id: 'all', label: `All (${summary?.totalCount ?? 0})` },
              { id: 'pending', label: `Pending Approval (${summary?.pendingApproval ?? 0})`, icon: <Clock className="w-3.5 h-3.5" /> },
              { id: 'approved', label: `Approved (${summary?.approved ?? 0})`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              { id: 'converted', label: `PO Issued (${summary?.convertedToPo ?? 0})`, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
              { id: 'urgent', label: `Urgent (${summary?.urgentCount ?? 0})`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
            ]}
          />

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Search PRN #, requester, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="white"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchData}
              title="Refresh register"
            />
          </div>
        </div>

        {/* PRN Data Table */}
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <SkeletonBox className="h-10 w-full" />
            <SkeletonBox className="h-10 w-full" />
            <SkeletonBox className="h-10 w-full" />
          </div>
        ) : filteredPrns.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6 text-cool-gray" />}
            title="No Purchase Requisitions Found"
            description={
              searchQuery
                ? 'No requisitions matched your search query.'
                : 'No Purchase Requisitions created yet. Click "New Requisition (PRN)" to raise a material demand.'
            }
            actionLabel="Create Requisition"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-border-gray text-cool-gray font-semibold">
                <tr>
                  <th className="py-3 px-3 w-28">PRN Number</th>
                  <th className="py-3 px-3 min-w-[140px]">Project / Tool No</th>
                  <th className="py-3 px-3 min-w-[120px]">Department</th>
                  <th className="py-3 px-3 min-w-[120px]">Requested By</th>
                  <th className="py-3 px-3 text-center w-24">Priority</th>
                  <th className="py-3 px-3 text-center w-16">Items</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">Est. Total (₹)</th>
                  <th className="py-3 px-3 text-center w-28">Status</th>
                  <th className="py-3 px-3 text-center w-28">Date</th>
                  <th className="py-3 px-3 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {filteredPrns.map((prn) => (
                  <tr
                    key={prn.id}
                    className="hover:bg-canvas/60 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(prn)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-primary flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span>{prn.prNumber}</span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-ink">
                      {prn.project ? (
                        <div>
                          <span className="font-mono text-ink block">{prn.project.projectNumber}</span>
                          <span className="text-[11px] text-mute font-normal block truncate max-w-[180px]">
                            {prn.project.partName || prn.project.customer?.companyName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-cool-gray italic">General / Crib</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-cool-gray font-medium">
                      {prn.department || 'Stores'}
                    </td>

                    <td className="py-3 px-3 text-ink">
                      <span className="font-medium block">{prn.requestedBy || 'Supervisor'}</span>
                      <span className="text-[10px] text-mute font-mono">
                        Req: {prn.requiredDate ? new Date(prn.requiredDate).toLocaleDateString('en-GB') : 'Immediate'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prn.priority === 'CRITICAL'
                            ? 'bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/30'
                            : prn.priority === 'URGENT'
                            ? 'bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/30'
                            : 'bg-canvas border border-border-gray text-cool-gray'
                        }`}
                      >
                        {prn.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-ink">
                      {prn.items?.length || 0}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                      ₹{Number(prn.estimatedTotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prn.status === 'APPROVED'
                            ? 'bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30'
                            : prn.status === 'REJECTED'
                            ? 'bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/30'
                            : prn.status === 'PO_CREATED'
                            ? 'bg-primary-subtle text-primary border border-primary/30'
                            : 'bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/30'
                        }`}
                      >
                        {prn.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-mute text-[11px]">
                      {prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : '-'}
                    </td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(prn)}
                          className="p-1.5 rounded hover:bg-primary-subtle text-cool-gray hover:text-primary transition-colors"
                          title="Inspect Requisition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintPrn(prn)}
                          className="p-1.5 rounded hover:bg-canvas text-cool-gray hover:text-ink transition-colors"
                          title="Print Authentic PRN Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => exportPrnToExcel(prn)}
                          className="p-1.5 rounded hover:bg-canvas text-cool-gray hover:text-ink transition-colors"
                          title="Download Excel"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {prn.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => setConvertingPrn(prn)}
                            className="p-1.5 rounded bg-primary-subtle text-primary hover:bg-primary hover:text-white transition-colors"
                            title="Convert to Purchase Order"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {prn.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(prn)}
                            className="p-1.5 rounded hover:bg-semantic-danger-subtle text-mute hover:text-semantic-danger-dark transition-colors"
                            title="Delete Draft PRN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <CreatePrnModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          defaultProjectId={projectId}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* PRN Inspection Drawer */}
      {isDrawerOpen && selectedPrn && (
        <PrnDetailDrawer
          prn={selectedPrn}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedPrn(null);
          }}
          onUpdate={() => {
            fetchData();
            if (selectedPrn) {
              PurchaseRequisitionsService.getPrnById(selectedPrn.id).then(setSelectedPrn);
            }
          }}
          onOpenPrintVoucher={(prn) => {
            setIsDrawerOpen(false);
            setPrintPrn(prn);
          }}
        />
      )}

      {/* Quick Convert To PO Modal */}
      {convertingPrn && (
        <ConvertToPoModal
          isOpen={!!convertingPrn}
          onClose={() => setConvertingPrn(null)}
          prn={convertingPrn}
          onSuccess={() => {
            setConvertingPrn(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
