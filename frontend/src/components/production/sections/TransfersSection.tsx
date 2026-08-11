"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, ArrowRight, Package, Clock, Plus } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { InterSectionTransferModal, MaterialTransferRecord } from "../InterSectionTransferModal";

interface TransfersSectionProps {
  projectCode?: string;
}

export function TransfersSection({ projectCode }: TransfersSectionProps) {
  const [transfers, setTransfers] = useState<MaterialTransferRecord[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("toolroom_material_transfers") || "[]");
      setTransfers(stored);
    } catch {
      setTransfers([]);
    }
  }, []);

  const handleTransferSuccess = (newRecord: MaterialTransferRecord) => {
    setTransfers((prev) => [newRecord, ...prev]);
  };

  const sectionLabel = (id: string) => {
    const map: Record<string, string> = {
      TOOL_ROOM_FITTING: "Toolroom Fitting",
      MACHINE_SHOP: "Machine Shop",
      PRESS_SHOP: "Press Shop",
      FABRICATION_INDIAN: "Fabrication",
      FABRICATION_EXPORT: "Fab Export",
    };
    return map[id] || id;
  };

  const sectionColor = (id: string) => {
    const map: Record<string, string> = {
      TOOL_ROOM_FITTING: "bg-purple-50 text-purple-700 border-purple-200",
      MACHINE_SHOP: "bg-purple-50 text-purple-700 border-purple-200",
      PRESS_SHOP: "bg-amber-50 text-amber-700 border-amber-200",
      FABRICATION_INDIAN: "bg-primary-subtle text-primary-dark border-blue-200",
      FABRICATION_EXPORT: "bg-primary-subtle text-primary-dark border-primary/20",
    };
    return map[id] || "bg-zinc-100 text-zinc-700 border-border-gray";
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-zinc-100 border border-border-gray/60 flex items-center justify-center">
            <RefreshCw className="w-4.5 h-4.5 text-zinc-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Inter-Section Material Transfers</h3>
            <p className="text-[11px] text-mute">Track material, parts, and sub-assemblies transferred between production departments</p>
          </div>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="px-3.5 py-2 rounded-[12px] bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-subtle flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[12px] bg-white border border-border-gray/60 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Total Transfers</span>
            <span className="text-lg font-semibold font-mono text-ink mt-0.5 block">{transfers.length}</span>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-zinc-100 flex items-center justify-center">
            <Package className="w-4 h-4 text-zinc-700" />
          </div>
        </div>
        <div className="p-3.5 rounded-[12px] bg-white border border-blue-200/60 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Total Units Moved</span>
            <span className="text-lg font-semibold font-mono text-primary mt-0.5 block">
              {transfers.reduce((acc, t) => acc + (t.quantity || 0), 0)} pcs
            </span>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-primary-subtle flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div className="p-3.5 rounded-[12px] bg-white border border-emerald-200/60 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Received</span>
            <span className="text-lg font-semibold font-mono text-emerald-600 mt-0.5 block">
              {transfers.filter((t) => t.status === "RECEIVED").length}
            </span>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-emerald-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      {transfers.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle p-12 text-center">
          <RefreshCw className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-600">No inter-section transfers recorded yet</p>
          <p className="text-xs text-zinc-400 mt-1">Click &quot;New Transfer&quot; to log material movement between departments</p>
        </div>
      ) : (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border-gray/80 bg-canvas/50">
            <h4 className="font-semibold text-sm text-zinc-950">Material Transfer Register</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-100 text-zinc-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Transfer ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Part / Sub-Assembly</th>
                  <th className="p-3">From</th>
                  <th className="p-3 text-center">→</th>
                  <th className="p-3">To</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">By</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-canvas transition-colors">
                    <td className="p-3 font-mono font-semibold text-ink">{trf.id}</td>
                    <td className="p-3 font-mono text-zinc-600">{trf.transferDate}</td>
                    <td className="p-3 font-semibold text-primary-dark">{trf.projectCode}</td>
                    <td className="p-3 font-semibold text-zinc-950">{trf.partName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${sectionColor(trf.sourceSection)}`}>
                        {sectionLabel(trf.sourceSection)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 inline" />
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${sectionColor(trf.targetSection)}`}>
                        {sectionLabel(trf.targetSection)}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-ink">{trf.quantity} Pcs</td>
                    <td className="p-3 text-mute text-xs max-w-xs truncate">{trf.transferReason}</td>
                    <td className="p-3 text-zinc-700">{trf.transferredBy}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        trf.status === "RECEIVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {trf.status}
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
      />
    </div>
  );
}
