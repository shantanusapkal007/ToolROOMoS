"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calculator,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  IndianRupee,
  Save,
  Zap,
  Briefcase,
  ExternalLink,
  Link as LinkIcon,
  X,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RfqService } from "@/services/rfq.service";
import { useProjects } from "@/hooks/useProjects";

interface RfqDetailDrawerProps {
  rfqId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_BADGE_MAP: Record<string, { variant: string; label: string }> = {
  NEW: { variant: "info", label: "New" },
  ESTIMATION: { variant: "warning", label: "Estimation" },
  QUOTED: { variant: "purple", label: "Quoted" },
  REVISION: { variant: "warning", label: "Revision" },
  WON: { variant: "success", label: "Won" },
  LOST: { variant: "danger", label: "Lost" },
  CANCELLED: { variant: "cancelled", label: "Cancelled" },
};

export function RfqDetailDrawer({ rfqId, isOpen, onClose, onUpdated }: RfqDetailDrawerProps) {
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"details" | "estimation" | "quotation">("details");
  const [saving, setSaving] = useState(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedLinkProjectId, setSelectedLinkProjectId] = useState("");

  const { data: projects = [] } = useProjects();

  // ─── Cost Estimation State ────────────────────────────────
  const [estimates, setEstimates] = useState<Record<string, any>>({});

  // ─── Quotation Generation State ───────────────────────────
  const [markupPercent, setMarkupPercent] = useState(15);
  const [taxPercent, setTaxPercent] = useState(18);
  const [validityDays, setValidityDays] = useState(30);
  const [termsAndConditions, setTermsAndConditions] = useState("");

  // ─── Fetch RFQ ────────────────────────────────────────────
  const fetchRfq = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RfqService.getRfqById(rfqId);
      setRfq(data);
      // Initialize estimates from existing data
      const estMap: Record<string, any> = {};
      data.items?.forEach((item: any) => {
        if (item.costEstimate) {
          estMap[item.id] = { ...item.costEstimate };
        } else {
          estMap[item.id] = {
            materialCost: 0,
            machiningHours: 0,
            machiningCost: 0,
            labourHours: 0,
            labourCost: 0,
            subcontractCost: 0,
            overheadPercent: 10,
          };
        }
      });
      setEstimates(estMap);
    } catch {
      setRfq(null);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    if (isOpen && rfqId) fetchRfq();
  }, [isOpen, rfqId, fetchRfq]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatCurrency = (v: number | string) => {
    const n = Number(v || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);
  };

  // ─── Update Estimate Field ────────────────────────────────
  const updateEstimate = (itemId: string, field: string, value: number) => {
    setEstimates((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  // ─── Save Estimates ───────────────────────────────────────
  const handleSaveEstimates = async () => {
    setSaving(true);
    try {
      const estArray = Object.entries(estimates).map(([rfqItemId, est]) => ({
        rfqItemId,
        materialCost: Number(est.materialCost || 0),
        machiningHours: Number(est.machiningHours || 0),
        machiningCost: Number(est.machiningCost || 0),
        labourHours: Number(est.labourHours || 0),
        labourCost: Number(est.labourCost || 0),
        subcontractCost: Number(est.subcontractCost || 0),
        overheadPercent: Number(est.overheadPercent || 10),
      }));
      await RfqService.saveCostEstimates(rfqId, estArray);
      await fetchRfq();
      onUpdated();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  // ─── Generate Quotation ───────────────────────────────────
  const handleGenerateQuotation = async () => {
    setSaving(true);
    try {
      await RfqService.generateQuotation(rfqId, {
        markupPercent,
        taxPercent,
        validityDays,
        termsAndConditions: termsAndConditions.trim() || undefined,
      });
      await fetchRfq();
      onUpdated();
      setActiveSection("details");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  // ─── Status Actions ───────────────────────────────────────
  const handleStatusChange = async (status: string, lostReason?: string) => {
    setSaving(true);
    try {
      await RfqService.updateStatus(rfqId, { status, lostReason });
      await fetchRfq();
      onUpdated();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  // ─── Convert to Project ───────────────────────────────────
  const handleConvert = async () => {
    setSaving(true);
    try {
      const plants = rfq?.customer?.company?.plants;
      const plantId = plants?.[0]?.id || "";
      await RfqService.convertToProject(rfqId, plantId);
      await fetchRfq();
      onUpdated();
      setShowConvertConfirm(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  // ─── Link to Project ──────────────────────────────────────
  const handleLinkProject = async () => {
    if (!selectedLinkProjectId) return;
    setSaving(true);
    try {
      await RfqService.linkToProject(rfqId, selectedLinkProjectId);
      await fetchRfq();
      onUpdated();
      setShowLinkModal(false);
      setSelectedLinkProjectId("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkProject = async () => {
    if (!confirm("Are you sure you want to unlink this RFQ from its project?")) return;
    setSaving(true);
    try {
      await RfqService.unlinkFromProject(rfqId);
      await fetchRfq();
      onUpdated();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-body-sm text-ink bg-white border border-border-gray rounded-[10px] placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  if (!isOpen) return null;

  const badge = rfq ? STATUS_BADGE_MAP[rfq.status] || STATUS_BADGE_MAP.NEW : STATUS_BADGE_MAP.NEW;
  const linkedProject = rfq?.project || rfq?.primaryProjects?.[0];

  return (
    <PremiumDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={rfq ? `${rfq.rfqNumber} — ${rfq.subject}` : "Loading..."}
      subtitle={rfq ? `${rfq.customer?.companyName} • ${badge.label}` : undefined}
      width="3xl"
    >
      {loading || !rfq ? (
        <div className="flex items-center justify-center py-16 text-mute">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── Project Association Banner ─────────────────── */}
          {linkedProject ? (
            <div className="bg-primary-subtle/50 border border-primary/20 rounded-[12px] p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-primary text-white shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-semibold text-primary uppercase tracking-wider">Linked Project</span>
                    <span className="text-caption font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-white text-ink border border-border-gray">
                      {linkedProject.projectNumber}
                    </span>
                  </div>
                  <p className="text-body-sm text-ink font-semibold mt-0.5">{linkedProject.partName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${linkedProject.projectNumber || linkedProject.id}/overview`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-border-gray text-ink hover:text-primary text-caption font-semibold shadow-subtle transition-colors"
                >
                  <span>Open Project Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Button variant="ghost" size="sm" onClick={handleUnlinkProject} title="Unlink Project">
                  <X className="w-3.5 h-3.5 text-mute hover:text-semantic-danger-dark" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-canvas border border-border-gray rounded-[12px] p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-hairline/20 text-mute shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-caption font-semibold text-cool-gray uppercase tracking-wider">Project Association</p>
                  <p className="text-body-sm text-mute mt-0.5">Pre-sales enquiry (Not currently attached to a project)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<LinkIcon className="h-3.5 w-3.5" />}
                  onClick={() => setShowLinkModal(true)}
                >
                  Link to Existing Project
                </Button>
              </div>
            </div>
          )}

          {/* ─── Link to Existing Project Modal Inset ───────── */}
          {showLinkModal && (
            <div className="bg-white border border-primary/30 rounded-[12px] p-4 shadow-subtle space-y-3">
              <h4 className="text-body-sm font-semibold text-ink">Select Project to Link</h4>
              <select
                value={selectedLinkProjectId}
                onChange={(e) => setSelectedLinkProjectId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose an active project...</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} — {p.partName} ({p.customer?.companyName || "No Customer"})
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowLinkModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" disabled={!selectedLinkProjectId} isLoading={saving} onClick={handleLinkProject}>
                  Confirm Link
                </Button>
              </div>
            </div>
          )}

          {/* ─── Section Tabs ──────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-border-gray pb-3">
            {(["details", "estimation", "quotation"] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                className={`px-4 py-1.5 text-caption font-medium rounded-[8px] transition-all cursor-pointer ${
                  activeSection === sec
                    ? "bg-primary text-white shadow-subtle font-semibold"
                    : "text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]"
                }`}
              >
                {sec === "details" ? "Enquiry Details" : sec === "estimation" ? "Cost Estimation" : "Quotation & Commercials"}
              </button>
            ))}
          </div>

          {/* ─── Details Section ───────────────────────────── */}
          {activeSection === "details" && (
            <div className="space-y-6">
              {/* Status + Actions */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <StatusBadge status={badge.label} variant={badge.variant as any} />
                <div className="flex items-center gap-2 flex-wrap">
                  {rfq.status === "NEW" && (
                    <Button variant="secondary" size="sm" leftIcon={<Calculator className="h-3.5 w-3.5" />} onClick={() => setActiveSection("estimation")}>
                      Start Estimation
                    </Button>
                  )}
                  {(rfq.status === "ESTIMATION" || rfq.status === "REVISION") && (
                    <Button variant="primary" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />} onClick={() => setActiveSection("quotation")}>
                      Generate Quotation
                    </Button>
                  )}
                  {rfq.status === "QUOTED" && (
                    <>
                      <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => handleStatusChange("WON")}>
                        Mark Won
                      </Button>
                      <Button variant="danger" size="sm" leftIcon={<XCircle className="h-3.5 w-3.5" />} onClick={() => handleStatusChange("LOST")}>
                        Mark Lost
                      </Button>
                    </>
                  )}
                  {rfq.status === "WON" && !linkedProject && (
                    <Button variant="primary" size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />} onClick={() => setShowConvertConfirm(true)}>
                      Convert to New Project
                    </Button>
                  )}
                </div>
              </div>

              {/* Convert Confirmation */}
              {showConvertConfirm && (
                <div className="bg-semantic-success-subtle border border-semantic-success/20 rounded-[12px] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-semantic-success-dark font-semibold">
                    <PlusCircle className="w-5 h-5" />
                    <span>Create New Manufacturing Project</span>
                  </div>
                  <p className="text-body-sm text-ink">
                    This will automatically create a new Project Workspace with contract value, customer details, and initial BOM items generated from this RFQ enquiry.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowConvertConfirm(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" isLoading={saving} onClick={handleConvert}>
                      Confirm & Create Project
                    </Button>
                  </div>
                </div>
              )}

              {/* Header Info */}
              <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5">
                <h3 className="text-body font-semibold text-ink mb-4">Customer & Commercial Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-mute mt-0.5 shrink-0" />
                    <div>
                      <p className="text-caption text-mute">Contact Person</p>
                      <p className="text-body-sm text-ink">{rfq.contactPerson || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-mute mt-0.5 shrink-0" />
                    <div>
                      <p className="text-caption text-mute">Email</p>
                      <p className="text-body-sm text-ink">{rfq.contactEmail || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-mute mt-0.5 shrink-0" />
                    <div>
                      <p className="text-caption text-mute">Phone</p>
                      <p className="text-body-sm text-ink">{rfq.contactPhone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-mute mt-0.5 shrink-0" />
                    <div>
                      <p className="text-caption text-mute">Received Date</p>
                      <p className="text-body-sm text-ink">{formatDate(rfq.receivedDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-mute mt-0.5 shrink-0" />
                    <div>
                      <p className="text-caption text-mute">Target Delivery</p>
                      <p className="text-body-sm text-ink">{formatDate(rfq.expectedDeliveryDate)}</p>
                    </div>
                  </div>
                </div>
                {rfq.description && (
                  <div className="mt-4 pt-4 border-t border-border-gray">
                    <p className="text-caption text-mute mb-1">Scope & Specifications</p>
                    <p className="text-body-sm text-ink">{rfq.description}</p>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
                <div className="px-5 py-4 border-b border-border-gray">
                  <h3 className="text-body font-semibold text-ink flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Tooling & Part Requirements ({rfq.items?.length || 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-gray bg-[rgba(148,151,169,0.04)]">
                        <th className="text-left px-5 py-2.5 text-caption font-semibold text-cool-gray">#</th>
                        <th className="text-left px-5 py-2.5 text-caption font-semibold text-cool-gray">Part Name</th>
                        <th className="text-left px-5 py-2.5 text-caption font-semibold text-cool-gray">Description</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Qty</th>
                        <th className="text-left px-5 py-2.5 text-caption font-semibold text-cool-gray">UOM</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-gray">
                      {rfq.items?.map((item: any, idx: number) => (
                        <tr key={item.id} className="hover:bg-[rgba(148,151,169,0.04)]">
                          <td className="px-5 py-3 text-caption text-mute">{idx + 1}</td>
                          <td className="px-5 py-3 text-body-sm text-ink font-medium">{item.partName}</td>
                          <td className="px-5 py-3 text-body-sm text-cool-gray">{item.partDescription || "—"}</td>
                          <td className="px-5 py-3 text-right text-body-sm text-ink font-mono">{Number(item.quantity)}</td>
                          <td className="px-5 py-3 text-body-sm text-mute">{item.uom}</td>
                          <td className="px-5 py-3 text-right text-body-sm text-ink font-mono">
                            {item.costEstimate ? formatCurrency(item.costEstimate.totalEstimatedCost) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quotations List */}
              {rfq.quotations?.length > 0 && (
                <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-gray">
                    <h3 className="text-body font-semibold text-ink flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Quotations Generated ({rfq.quotations.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-border-gray">
                    {rfq.quotations.map((q: any) => (
                      <div key={q.id} className="px-5 py-3.5 flex items-center justify-between">
                        <div>
                          <p className="text-body-sm text-ink font-medium font-mono">{q.quotationNumber}</p>
                          <p className="text-caption text-mute">Revision {q.revision} • {formatDate(q.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-body-sm text-ink font-semibold font-mono">{formatCurrency(q.totalAmount)}</p>
                          <StatusBadge status={q.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Estimation Section ───────────────────────── */}
          {activeSection === "estimation" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-semibold text-ink">Cost Estimation Worksheet</h3>
                  <p className="text-caption text-mute">Break down material, machining hours, labour, subcontract, and factory overheads</p>
                </div>
                <Button variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} isLoading={saving} onClick={handleSaveEstimates}>
                  Save Estimates
                </Button>
              </div>
              {rfq.items?.map((item: any) => {
                const est = estimates[item.id] || {};
                const direct = Number(est.materialCost || 0) + Number(est.machiningCost || 0) + Number(est.labourCost || 0) + Number(est.subcontractCost || 0);
                const overhead = direct * (Number(est.overheadPercent || 10) / 100);
                const total = direct + overhead;
                return (
                  <div key={item.id} className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-body-sm text-ink font-semibold">{item.partName}</h4>
                        {item.partDescription && <p className="text-caption text-mute">{item.partDescription}</p>}
                      </div>
                      <span className="font-mono text-body text-primary font-bold">{formatCurrency(total)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Material (₹)</label>
                        <input type="number" value={est.materialCost || ""} onChange={(e) => updateEstimate(item.id, "materialCost", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Machining Hrs</label>
                        <input type="number" value={est.machiningHours || ""} onChange={(e) => updateEstimate(item.id, "machiningHours", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Machining (₹)</label>
                        <input type="number" value={est.machiningCost || ""} onChange={(e) => updateEstimate(item.id, "machiningCost", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Labour Hrs</label>
                        <input type="number" value={est.labourHours || ""} onChange={(e) => updateEstimate(item.id, "labourHours", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Labour (₹)</label>
                        <input type="number" value={est.labourCost || ""} onChange={(e) => updateEstimate(item.id, "labourCost", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Subcontract (₹)</label>
                        <input type="number" value={est.subcontractCost || ""} onChange={(e) => updateEstimate(item.id, "subcontractCost", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-caption font-semibold text-cool-gray mb-1">Overhead %</label>
                        <input type="number" value={est.overheadPercent || ""} onChange={(e) => updateEstimate(item.id, "overheadPercent", Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="flex items-end">
                        <div className="w-full px-3 py-2 bg-canvas border border-border-gray rounded-[10px] text-body-sm text-mute font-mono">
                          OH: {formatCurrency(overhead)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Quotation Generation Section ─────────────── */}
          {activeSection === "quotation" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-body font-semibold text-ink">Commercial Quotation Builder</h3>
                <p className="text-caption text-mute">Set markup margin, tax, payment terms and generate formal offer</p>
              </div>

              <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-caption font-semibold text-cool-gray mb-1">Markup Margin %</label>
                    <input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-caption font-semibold text-cool-gray mb-1">GST %</label>
                    <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-caption font-semibold text-cool-gray mb-1">Validity (days)</label>
                    <input type="number" value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-caption font-semibold text-cool-gray mb-1">Terms & Conditions</label>
                    <textarea value={termsAndConditions} onChange={(e) => setTermsAndConditions(e.target.value)} rows={3} placeholder="50% Advance with PO, 40% on Trial signoff, 10% on Dispatch..." className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
                <div className="px-5 py-4 border-b border-border-gray flex items-center justify-between">
                  <h4 className="text-body font-semibold text-ink">Quotation Commercial Summary</h4>
                  <span className="text-caption text-primary font-semibold">Applying +{markupPercent}% Margin</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-gray bg-[rgba(148,151,169,0.04)]">
                        <th className="text-left px-5 py-2.5 text-caption font-semibold text-cool-gray">Part</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Qty</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Est. Unit Cost</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Quoted Unit Rate</th>
                        <th className="text-right px-5 py-2.5 text-caption font-semibold text-cool-gray">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-gray">
                      {rfq.items?.map((item: any) => {
                        const estCost = item.costEstimate ? Number(item.costEstimate.totalEstimatedCost) : 0;
                        const unitPrice = estCost * (1 + markupPercent / 100);
                        const qty = Number(item.quantity);
                        return (
                          <tr key={item.id}>
                            <td className="px-5 py-3 text-body-sm text-ink font-medium">{item.partName}</td>
                            <td className="px-5 py-3 text-right font-mono text-body-sm text-ink">{qty}</td>
                            <td className="px-5 py-3 text-right font-mono text-body-sm text-mute">{formatCurrency(estCost)}</td>
                            <td className="px-5 py-3 text-right font-mono text-body-sm text-ink font-medium">{formatCurrency(unitPrice)}</td>
                            <td className="px-5 py-3 text-right font-mono text-body-sm text-ink font-bold">{formatCurrency(unitPrice * qty)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-4 border-t border-border-gray bg-[rgba(148,151,169,0.04)]">
                  {(() => {
                    const subtotal = rfq.items?.reduce((sum: number, item: any) => {
                      const estCost = item.costEstimate ? Number(item.costEstimate.totalEstimatedCost) : 0;
                      const unitPrice = estCost * (1 + markupPercent / 100);
                      return sum + unitPrice * Number(item.quantity);
                    }, 0) || 0;
                    const tax = subtotal * (taxPercent / 100);
                    return (
                      <div className="space-y-1 text-right max-w-xs ml-auto">
                        <div className="flex justify-between text-body-sm text-cool-gray">
                          <span>Subtotal:</span>
                          <span className="font-mono text-ink font-medium">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-body-sm text-cool-gray">
                          <span>GST ({taxPercent}%):</span>
                          <span className="font-mono text-ink font-medium">{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between text-body font-bold text-ink border-t border-border-gray pt-2">
                          <span>Grand Total:</span>
                          <span className="font-mono text-primary">{formatCurrency(subtotal + tax)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setActiveSection("details")}>Back</Button>
                <Button variant="primary" leftIcon={<Send className="h-4 w-4" />} isLoading={saving} onClick={handleGenerateQuotation}>
                  Generate Official Quotation
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PremiumDrawer>
  );
}
