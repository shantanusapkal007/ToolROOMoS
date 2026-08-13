"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, ArrowRight, Package, CheckCircle2, Plus, Sparkles, Filter, Search } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { InterSectionTransferModal, MaterialTransferRecord } from "../InterSectionTransferModal";

interface TransfersSectionProps {
  projectCode?: string;
  materialIssues?: any[];
  onTransferComplete?: (record: MaterialTransferRecord) => void;
}

export function TransfersSection({ projectCode = "KTD-433", materialIssues = [], onTransferComplete }: TransfersSectionProps) {
  const [transfers, setTransfers] = useState<MaterialTransferRecord[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState("ALL");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("toolroom_material_transfers") || "[]");
      // Filter for this project if projectCode is provided
      const filtered = projectCode ? stored.filter((t: any) => !t.projectCode || t.projectCode === projectCode) : stored;
      setTransfers(filtered);
    } catch {
      setTransfers([]);
    }
  }, [projectCode]);

  const handleTransferSuccess = (newRecord: MaterialTransferRecord) => {
    setTransfers((prev) => [newRecord, ...prev]);
    if (onTransferComplete) onTransferComplete(newRecord);
  };

  const sectionLabel = (id: string) => {
    const map: Record<string, string> = {
      TOOL_ROOM_FITTING: "Toolroom Fitting",
      MACHINE_SHOP: "Machine Shop",
      PRESS_SHOP: "Press Shop",
      FABRICATION_INDIAN: "Fabrication (India)",
      FABRICATION_EXPORT: "Fabrication (Foreign)",
    };
    return map[id] || id.replace(/_/g, ' ');
  };

  const sectionBadge = (id: string) => {
    const map: Record<string, string> = {
      TOOL_ROOM_FITTING: "bg-primary-subtle text-primary border-primary/20",
      MACHINE_SHOP: "bg-primary-subtle text-primary border-primary/20",
      PRESS_SHOP: "bg-semantic-warning-subtle text-semantic-warning-dark border-semantic-warning/20",
      FABRICATION_INDIAN: "bg-semantic-info-subtle text-semantic-info-dark border-semantic-info/20",
      FABRICATION_EXPORT: "bg-semantic-info-subtle text-semantic-info-dark border-semantic-info/20",
    };
    return map[id] || "bg-[rgba(148,151,169,0.1)] text-cool-gray border-border-gray";
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch = 
      (t.partName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.transferredBy || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.transferReason || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSection = 
      filterSection === "ALL" || 
      t.sourceSection === filterSection || 
      t.targetSection === filterSection;

    return matchesSearch && matchesSection;
  });

  const totalUnitsMoved = transfers.reduce((acc, t) => acc + (t.quantity || 0), 0);

  return (
    <div className="space-y-5 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center font-semibold shadow-micro shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-ink">Inter-Section Material Transfers</h3>
              <span className="text-[10px] font-mono font-semibold bg-primary-subtle text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {projectCode}
              </span>
            </div>
            <p className="text-xs text-silver-blue mt-0.5">Direct stock-bounded material & component movements between production departments</p>
          </div>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="px-4 py-2.5 rounded-[10px] bg-primary hover:bg-primary-hover active:bg-primary-deep text-white text-xs font-semibold shadow-subtle flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Inter-Section Transfer</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-[12px] bg-white border border-border-gray shadow-micro flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray block">Total Transfers Logged</span>
            <span className="text-xl font-bold font-mono text-ink mt-1 block">{transfers.length}</span>
          </div>
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(148,151,169,0.08)] text-cool-gray flex items-center justify-center">
            <Package className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-white border border-border-gray shadow-micro flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray block">Total Units Transferred</span>
            <span className="text-xl font-bold font-mono text-primary mt-1 block">
              {totalUnitsMoved} pcs
            </span>
          </div>
          <div className="w-9 h-9 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center">
            <RefreshCw className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="p-4 rounded-[12px] bg-white border border-border-gray shadow-micro flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray block">Transfer Status</span>
            <span className="text-sm font-semibold text-semantic-success-dark mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-semantic-success-dark" />
              100% Direct Transferred
            </span>
          </div>
          <div className="w-9 h-9 rounded-[10px] bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Transfers Table / Register */}
      {transfers.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-border-gray shadow-micro p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-subtle text-primary flex items-center justify-center mx-auto mb-3">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-ink">No inter-section transfers recorded yet</p>
          <p className="text-xs text-cool-gray mt-1 max-w-sm mx-auto">
            Click &quot;New Inter-Section Transfer&quot; to transfer available materials from Machine Shop, Toolroom Fitting, Press Shop or Fabrication.
          </p>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-[10px] text-xs font-semibold shadow-micro hover:bg-primary-hover transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record First Transfer</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-border-gray shadow-micro overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-border-gray flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[rgba(148,151,169,0.02)]">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-ink">Material Transfer Register</h4>
              <span className="text-xs text-cool-gray bg-[rgba(148,151,169,0.08)] px-2.5 py-0.5 rounded-full font-mono font-medium">
                {filteredTransfers.length} entries
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-silver-blue absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-border-gray rounded-[8px] text-ink placeholder:text-silver-blue focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary w-48 shadow-micro"
                />
              </div>

              {/* Section Filter */}
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-border-gray rounded-[8px] text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-micro"
              >
                <option value="ALL">All Sections</option>
                <option value="MACHINE_SHOP">Machine Shop</option>
                <option value="TOOL_ROOM_FITTING">Toolroom Fitting</option>
                <option value="PRESS_SHOP">Press Shop</option>
                <option value="FABRICATION_INDIAN">Fabrication (India)</option>
                <option value="FABRICATION_EXPORT">Fabrication (Foreign)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[rgba(148,151,169,0.06)] text-cool-gray font-semibold uppercase tracking-wider text-[10px] border-b border-border-gray">
                <tr>
                  <th className="p-3.5">Transfer Slip #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Project</th>
                  <th className="p-3.5 min-w-[180px]">Material / Component</th>
                  <th className="p-3.5">From Section</th>
                  <th className="p-3.5 text-center">→</th>
                  <th className="p-3.5">To Section</th>
                  <th className="p-3.5 text-center">Quantity</th>
                  <th className="p-3.5 min-w-[200px]">Reason / Notes</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/60">
                {filteredTransfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-[rgba(148,151,169,0.02)] transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-ink">{trf.id}</td>
                    <td className="p-3.5 font-mono text-cool-gray">{trf.transferDate}</td>
                    <td className="p-3.5 font-semibold text-primary">{trf.projectCode}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-ink">{trf.partName}</div>
                      {trf.batchNumber && trf.batchNumber !== '-' && (
                        <div className="text-[10px] text-silver-blue font-mono">Batch: {trf.batchNumber}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold uppercase border ${sectionBadge(trf.sourceSection)}`}>
                        {sectionLabel(trf.sourceSection)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <ArrowRight className="w-3.5 h-3.5 text-silver-blue inline" />
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold uppercase border ${sectionBadge(trf.targetSection)}`}>
                        {sectionLabel(trf.targetSection)}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-ink">
                      {trf.quantity} pcs
                    </td>
                    <td className="p-3.5 text-cool-gray text-xs max-w-xs truncate" title={trf.transferReason}>
                      {trf.transferReason}
                    </td>
                    <td className="p-3.5 text-ink font-medium">{trf.transferredBy}</td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Transferred
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <InterSectionTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={handleTransferSuccess}
        defaultProjectCode={projectCode}
        materialIssues={materialIssues}
        existingTransfers={transfers}
      />
    </div>
  );
}
