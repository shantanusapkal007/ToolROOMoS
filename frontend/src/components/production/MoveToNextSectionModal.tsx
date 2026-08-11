"use client";

import React, { useState } from "react";
import { ArrowRight, X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "../ui/Toast";

interface MoveToNextSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
  currentSection: string;
  projectCode?: string;
  onMoveComplete?: (item: any, targetSection: string) => void;
}

const SECTION_FLOW: Record<string, { label: string; color: string; next: string[] }> = {
  MACHINE_SHOP: {
    label: "Machine Shop",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    next: ["TOOL_ROOM_FITTING", "PRESS_SHOP", "FABRICATION_INDIAN", "FABRICATION_EXPORT"],
  },
  TOOL_ROOM_FITTING: {
    label: "Toolroom Fitting & Assembly",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    next: ["PRESS_SHOP", "FABRICATION_INDIAN", "FABRICATION_EXPORT"],
  },
  PRESS_SHOP: {
    label: "Press Shop & Tryout",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    next: ["TOOL_ROOM_FITTING", "FABRICATION_INDIAN", "FABRICATION_EXPORT"],
  },
  FABRICATION_INDIAN: {
    label: "Fabrication (Domestic)",
    color: "bg-primary-subtle text-primary-dark border-blue-200",
    next: ["TOOL_ROOM_FITTING", "PRESS_SHOP", "FABRICATION_EXPORT"],
  },
  FABRICATION_EXPORT: {
    label: "Fabrication (Export)",
    color: "bg-primary-subtle text-primary-dark border-primary/20",
    next: ["TOOL_ROOM_FITTING", "PRESS_SHOP", "FABRICATION_INDIAN"],
  },
};

const ALL_SECTIONS: Record<string, string> = {
  MACHINE_SHOP: "Machine Shop",
  TOOL_ROOM_FITTING: "Toolroom Fitting & Assembly",
  PRESS_SHOP: "Press Shop & Tryout",
  FABRICATION_INDIAN: "Fabrication (Domestic)",
  FABRICATION_EXPORT: "Fabrication (Export)",
};

export function MoveToNextSectionModal({
  isOpen,
  onClose,
  item,
  currentSection,
  projectCode,
  onMoveComplete,
}: MoveToNextSectionModalProps) {
  const { success, error } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [transferredBy, setTransferredBy] = useState<string>("");

  if (!isOpen || !item) return null;

  const currentInfo = SECTION_FLOW[currentSection] || {
    label: currentSection,
    color: "bg-zinc-100 text-zinc-700 border-border-gray",
    next: Object.keys(SECTION_FLOW),
  };

  const availableTargets = currentInfo.next;

  const handleMove = () => {
    if (!selectedTarget) {
      error("Select Target", "Please select which section to move this item to.");
      return;
    }

    if (!transferredBy.trim()) {
      error("Field Required", "Please enter the name of the person authorizing this transfer.");
      return;
    }

    // Create a transfer record and store it
    const transferRecord = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      transferDate: new Date().toISOString().split("T")[0],
      projectCode: projectCode || item.projectCode || "N/A",
      partName: item.partOrDrawing || item.workStageOrOperation || "Component",
      sourceSection: currentSection,
      targetSection: selectedTarget,
      quantity,
      transferReason: remarks || `Completed in ${currentInfo.label}, moving to ${ALL_SECTIONS[selectedTarget]}`,
      transferredBy,
      status: "TRANSFERRED" as const,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("toolroom_material_transfers") || "[]");
      localStorage.setItem("toolroom_material_transfers", JSON.stringify([transferRecord, ...existing]));
    } catch (err) {
      console.warn("Storage error:", err);
    }

    success(
      "Section Transfer Completed",
      `Item moved from ${currentInfo.label} → ${ALL_SECTIONS[selectedTarget]}`
    );

    if (onMoveComplete) onMoveComplete(item, selectedTarget);
    onClose();

    // Reset
    setSelectedTarget("");
    setRemarks("");
    setQuantity(1);
    setTransferredBy("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border-gray rounded-[12px] w-full max-w-lg shadow-level-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border-gray flex items-center justify-between bg-canvas/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-emerald-600 text-white flex items-center justify-center font-semibold shadow-subtle">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">
                Mark Complete & Move to Next Section
              </h3>
              <p className="text-xs text-mute">
                Work completed — transfer to the next production department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[12px] hover:bg-zinc-200 text-mute transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Current Item Info */}
          <div className="bg-canvas rounded-[12px] border border-border-gray/80 p-3.5 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Completed Item Details
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-mute">Operation:</span>
                <span className="ml-1 font-semibold text-ink">
                  {item.workStageOrOperation || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-mute">Part/Drawing:</span>
                <span className="ml-1 font-semibold text-ink">
                  {item.partOrDrawing || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-mute">Operator:</span>
                <span className="ml-1 font-semibold text-zinc-700">
                  {item.personName || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-mute">Machine:</span>
                <span className="ml-1 font-semibold text-zinc-700">
                  {item.machineOrTool || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Transfer Flow */}
          <div className="bg-canvas rounded-[12px] border border-border-gray/80 p-3.5 space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Transfer Route
            </div>

            {/* Current Section Badge */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-mute block mb-1">FROM (Current Section)</span>
                <span
                  className={`inline-block px-3 py-1.5 rounded-[12px] text-xs font-semibold uppercase border ${currentInfo.color}`}
                >
                  {currentInfo.label}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-mute block mb-1">TO (Next Section)</span>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-border-gray rounded-[12px] text-xs font-semibold text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">— Select target section —</option>
                  {availableTargets.map((targetId) => (
                    <option key={targetId} value={targetId}>
                      {ALL_SECTIONS[targetId]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quantity & Authorized By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-border-gray rounded-[12px] font-mono font-semibold text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
                Authorized By
              </label>
              <input
                type="text"
                value={transferredBy}
                onChange={(e) => setTransferredBy(e.target.value)}
                placeholder="Supervisor / Engineer name"
                className="w-full px-3 py-2 bg-white border border-border-gray rounded-[12px] font-semibold text-zinc-950 outline-none focus:ring-2 focus:ring-emerald-500/30"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Transfer Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any notes about completion or handover specifications..."
              className="w-full px-3 py-2 bg-white border border-border-gray rounded-[12px] text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-[12px] text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              className="px-4 py-2 rounded-[12px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-subtle flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Complete & Move to Section</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
