"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  FileCheck,
  BarChart3,
  Briefcase,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RfqService } from "@/services/rfq.service";
import { CreateRfqModal } from "./CreateRfqModal";
import { RfqDetailDrawer } from "./RfqDetailDrawer";
import { QuotationPreview } from "./QuotationPreview";

// ─── Status → Badge variant mapping ───────────────────────────
const STATUS_BADGE_MAP: Record<string, { variant: string; label: string }> = {
  NEW: { variant: "info", label: "New" },
  ESTIMATION: { variant: "warning", label: "Estimation" },
  QUOTED: { variant: "purple", label: "Quoted" },
  REVISION: { variant: "warning", label: "Revision" },
  WON: { variant: "success", label: "Won" },
  LOST: { variant: "danger", label: "Lost" },
  CANCELLED: { variant: "cancelled", label: "Cancelled" },
};

// ─── Pipeline stage colors for the Kanban cards ───────────────
const PIPELINE_STAGES = [
  { id: "NEW", label: "New Enquiries", icon: FileText, color: "bg-semantic-info-subtle", textColor: "text-primary" },
  { id: "ESTIMATION", label: "Estimation", icon: BarChart3, color: "bg-semantic-warning-subtle", textColor: "text-semantic-warning-dark" },
  { id: "QUOTED", label: "Quoted", icon: FileCheck, color: "bg-primary-subtle", textColor: "text-primary" },
  { id: "WON", label: "Won", icon: CheckCircle2, color: "bg-semantic-success-subtle", textColor: "text-semantic-success-dark" },
  { id: "LOST", label: "Lost", icon: XCircle, color: "bg-semantic-danger-subtle", textColor: "text-semantic-danger-dark" },
];

type TabId = "pipeline" | "all" | "quotations";

interface RfqModuleProps {
  projectId?: string;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

export function RfqModule({ projectId, title, subtitle, hideHeader = false }: RfqModuleProps) {
  const [activeTab, setActiveTab] = useState<TabId>(projectId ? "all" : "pipeline");
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ─── Modals & Drawers ─────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  // ─── Data Fetching ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rfqData, pipelineData] = await Promise.all([
        RfqService.listRfqs({ projectId, search, status: statusFilter || undefined }),
        projectId ? Promise.resolve(null) : RfqService.getPipelineSummary(),
      ]);
      setRfqs(Array.isArray(rfqData) ? rfqData : []);
      setPipelineSummary(pipelineData);
    } catch {
      setRfqs([]);
      setPipelineSummary(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, search, statusFilter]);

  const fetchQuotations = useCallback(async () => {
    try {
      const data = await RfqService.listQuotations();
      const filtered = projectId
        ? data.filter((q: any) => q.rfqHeader?.projectId === projectId || q.rfqHeader?.primaryProjects?.some((p: any) => p.id === projectId))
        : data;
      setQuotations(Array.isArray(filtered) ? filtered : []);
    } catch {
      setQuotations([]);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "quotations") {
      fetchQuotations();
    }
  }, [activeTab, fetchQuotations]);

  const handleRfqCreated = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const handleRfqUpdated = () => {
    fetchData();
    if (activeTab === "quotations") fetchQuotations();
  };

  // ─── Tab Config ───────────────────────────────────────────
  const tabs: TabItem<TabId>[] = [
    ...(projectId ? [] : [{ id: "pipeline" as TabId, label: "Pipeline", icon: <TrendingUp className="h-3.5 w-3.5" /> }]),
    { id: "all" as TabId, label: projectId ? "Project RFQs" : "All RFQs", icon: <FileText className="h-3.5 w-3.5" />, count: rfqs.length },
    { id: "quotations" as TabId, label: "Quotations", icon: <FileCheck className="h-3.5 w-3.5" />, count: quotations.length },
  ];

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatCurrency = (v: number | string) => {
    const n = Number(v || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────── */}
      {!hideHeader && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-heading-xl text-ink tracking-tight">{title || "RFQ & Quotations"}</h1>
            <p className="text-body-sm text-mute mt-1">
              {subtitle || "Manage customer enquiries, cost estimation, and quotation pipeline"}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            {projectId ? "New Project RFQ" : "New RFQ"}
          </Button>
        </div>
      )}

      {/* ─── Tabs & Controls ──────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2">
          {hideHeader && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setShowCreateModal(true)}
            >
              New RFQ
            </Button>
          )}
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── TAB: Pipeline ────────────────────────────────────── */}
      {activeTab === "pipeline" && !projectId && (
        <div className="space-y-6">
          {/* KPI Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PIPELINE_STAGES.map((stage) => {
              const count = pipelineSummary?.pipeline?.[stage.id] ?? 0;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  onClick={() => { setStatusFilter(stage.id); setActiveTab("all"); }}
                  className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5 text-left transition-all duration-150 hover:shadow-level-2 hover:border-primary/30 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-9 w-9 rounded-[10px] ${stage.color} flex items-center justify-center`}>
                      <Icon className={`h-4.5 w-4.5 ${stage.textColor}`} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-mute opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-display-xs font-semibold text-ink">{count}</p>
                  <p className="text-caption text-mute mt-0.5">{stage.label}</p>
                </button>
              );
            })}
          </div>

          {/* Total Pipeline Value */}
          {pipelineSummary && (
            <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[10px] bg-primary-subtle flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-caption text-mute">Total Pipeline Value (Quoted + Won)</p>
                  <p className="text-feature-title text-ink font-semibold">
                    {formatCurrency(pipelineSummary.totalPipelineValue)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent RFQs Quick List */}
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle">
            <div className="px-5 py-4 border-b border-border-gray">
              <h3 className="text-body font-semibold text-ink">Recent Enquiries</h3>
            </div>
            <div className="divide-y divide-border-gray">
              {rfqs.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No RFQs yet"
                  description="Create your first Request for Quotation to start tracking your sales pipeline."
                  actionLabel="New RFQ"
                  onAction={() => setShowCreateModal(true)}
                />
              ) : (
                rfqs.slice(0, 8).map((rfq) => {
                  const badge = STATUS_BADGE_MAP[rfq.status] || STATUS_BADGE_MAP.NEW;
                  const relProject = rfq.project || rfq.primaryProjects?.[0];
                  return (
                    <button
                      key={rfq.id}
                      onClick={() => setSelectedRfqId(rfq.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[rgba(148,151,169,0.04)] transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="font-mono text-caption text-primary font-medium shrink-0">
                          {rfq.rfqNumber}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm text-ink font-medium truncate">{rfq.subject}</p>
                          <div className="flex items-center gap-2 text-caption text-mute mt-0.5">
                            <span>{rfq.customer?.companyName}</span>
                            {relProject && (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-primary px-1.5 py-0.2 bg-primary-subtle rounded-[4px]">
                                <Briefcase className="w-3 h-3" />
                                {relProject.projectNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-caption text-mute hidden sm:block">{formatDate(rfq.createdAt)}</span>
                        <StatusBadge status={badge.label} variant={badge.variant as any} size="sm" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: All RFQs ────────────────────────────────────── */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search RFQs by number, subject, customer, or project..."
                className="w-full pl-10 pr-4 py-2 text-body-sm text-ink bg-white border border-border-gray rounded-[10px] placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-body-sm text-ink bg-white border border-border-gray rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ESTIMATION">Estimation</option>
              <option value="QUOTED">Quoted</option>
              <option value="REVISION">Revision</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            {statusFilter && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter("")}>
                Clear Filter
              </Button>
            )}
          </div>

          {/* RFQ Table */}
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-5 w-5 text-mute animate-spin" />
              </div>
            ) : rfqs.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title={projectId ? "No RFQs for this project" : "No RFQs found"}
                description={search || statusFilter ? "No RFQs match your filters. Try adjusting your search." : "Create an RFQ enquiry to get started."}
                actionLabel={!search && !statusFilter ? "New RFQ" : undefined}
                onAction={!search && !statusFilter ? () => setShowCreateModal(true) : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-gray bg-[rgba(148,151,169,0.04)]">
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">RFQ #</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Subject</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Project Association</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Customer</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Items</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Quote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {rfqs.map((rfq) => {
                      const badge = STATUS_BADGE_MAP[rfq.status] || STATUS_BADGE_MAP.NEW;
                      const latestQuote = rfq.quotations?.[0];
                      const relProject = rfq.project || rfq.primaryProjects?.[0];
                      return (
                        <tr
                          key={rfq.id}
                          onClick={() => setSelectedRfqId(rfq.id)}
                          className="hover:bg-[rgba(148,151,169,0.04)] transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5 font-mono text-body-sm text-primary font-medium">{rfq.rfqNumber}</td>
                          <td className="px-5 py-3.5 text-body-sm text-ink font-medium max-w-[220px] truncate">{rfq.subject}</td>
                          <td className="px-5 py-3.5 text-body-sm">
                            {relProject ? (
                              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-primary-subtle text-primary border border-primary/20">
                                <Briefcase className="w-3 h-3" />
                                {relProject.projectNumber}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-medium text-xs text-mute px-2 py-0.5 rounded-[6px] bg-hairline/20">
                                <PlusCircle className="w-3 h-3" />
                                Prospective (New)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-body-sm text-cool-gray">{rfq.customer?.companyName ?? "—"}</td>
                          <td className="px-5 py-3.5 text-body-sm text-cool-gray font-mono">{rfq.items?.length ?? 0}</td>
                          <td className="px-5 py-3.5 text-caption text-mute font-mono">{formatDate(rfq.createdAt)}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={badge.label} variant={badge.variant as any} size="sm" /></td>
                          <td className="px-5 py-3.5 text-body-sm text-cool-gray">
                            {latestQuote ? (
                              <span className="font-mono text-ink font-semibold">{formatCurrency(latestQuote.totalAmount)}</span>
                            ) : (
                              <span className="text-mute">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Quotations ──────────────────────────────────── */}
      {activeTab === "quotations" && (
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
          {quotations.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="h-6 w-6" />}
              title="No quotations yet"
              description="Generate a quotation from an RFQ to start tracking your commercial offers."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-gray bg-[rgba(148,151,169,0.04)]">
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Quote #</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">RFQ Ref</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Project</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Rev</th>
                    <th className="text-right px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Subtotal</th>
                    <th className="text-right px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Total</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold text-cool-gray uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {quotations.map((q) => {
                    const qProj = q.rfqHeader?.project || q.rfqHeader?.primaryProjects?.[0];
                    return (
                      <tr
                        key={q.id}
                        onClick={() => setSelectedQuotationId(q.id)}
                        className="hover:bg-[rgba(148,151,169,0.04)] transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-mono text-body-sm text-primary font-medium">{q.quotationNumber}</td>
                        <td className="px-5 py-3.5 font-mono text-body-sm text-cool-gray">{q.rfqHeader?.rfqNumber ?? "—"}</td>
                        <td className="px-5 py-3.5 text-body-sm">
                          {qProj ? (
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-primary-subtle text-primary">
                              {qProj.projectNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-mute font-medium">New Enquiry</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-body-sm text-ink">{q.rfqHeader?.customer?.companyName ?? "—"}</td>
                        <td className="px-5 py-3.5 text-body-sm text-mute font-mono">R{q.revision}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-body-sm text-cool-gray">{formatCurrency(q.subtotal)}</td>
                        <td className="px-5 py-3.5 text-right font-mono text-body-sm text-ink font-bold">{formatCurrency(q.totalAmount)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={q.status} size="sm" /></td>
                        <td className="px-5 py-3.5 text-caption text-mute font-mono">{formatDate(q.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Modals & Drawers ─────────────────────────────────── */}
      <CreateRfqModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRfqCreated}
        initialProjectId={projectId}
      />

      {selectedRfqId && (
        <RfqDetailDrawer
          rfqId={selectedRfqId}
          isOpen={!!selectedRfqId}
          onClose={() => setSelectedRfqId(null)}
          onUpdated={handleRfqUpdated}
        />
      )}

      {selectedQuotationId && (
        <QuotationPreview
          quotationId={selectedQuotationId}
          isOpen={!!selectedQuotationId}
          onClose={() => setSelectedQuotationId(null)}
        />
      )}
    </div>
  );
}
