"use client";

import React, { useState } from "react";
import { PartReworkOrder } from "@/services/part-rework.service";
import { useUpdatePartReworkStatus, useDeletePartReworkOrder } from "@/hooks/usePartRework";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  CheckSquare,
  XCircle,
  Cpu,
  Wrench,
  Search,
  Filter,
  User,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatters";

interface PartReworkListProps {
  projectId: string;
  reworkOrders: PartReworkOrder[];
  isLoading?: boolean;
  onOpenNewReworkModal?: () => void;
}

export function PartReworkList({
  projectId,
  reworkOrders = [],
  isLoading = false,
  onOpenNewReworkModal,
}: PartReworkListProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<PartReworkOrder | null>(null);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("IN_REWORK");
  const [actualHours, setActualHours] = useState<string>("0");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [inspectionResult, setInspectionResult] = useState<string>("PASSED");

  const updateStatusMutation = useUpdatePartReworkStatus(projectId);
  const deleteMutation = useDeletePartReworkOrder(projectId);

  const filteredOrders = reworkOrders.filter((order) => {
    const matchesSearch =
      (order.partName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.reworkNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.partNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "ALL") return true;
    if (filterStatus === "ACTIVE") {
      return order.status === "REQUESTED" || order.status === "APPROVED" || order.status === "IN_REWORK" || order.status === "RE_INSPECTION";
    }
    return order.status === filterStatus;
  });

  const handleOpenStatusModal = (order: PartReworkOrder, targetStatus: string) => {
    setSelectedOrder(order);
    setNewStatus(targetStatus);
    setActualHours(String(order.actualHours || order.estimatedHours || 0));
    setResolutionNotes(order.resolutionNotes || "");
    setInspectionResult(order.inspectionResult || "PASSED");
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedOrder.id,
        payload: {
          status: newStatus,
          actualHours: Number(actualHours) || 0,
          resolutionNotes: resolutionNotes.trim() || undefined,
          inspectionResult: newStatus === "COMPLETED" ? inspectionResult : undefined,
        },
      });
      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {}
  };

  const formatStage = (stage?: string) => {
    if (!stage) return "Machining";
    switch (stage) {
      case "ENGINEERING": return "Engineering BOM";
      case "MACHINING": return "Machine Shop";
      case "FITTING": return "Toolroom Fitting";
      case "TRIAL": return "Press Tryout";
      case "QUALITY_INSPECTION": return "Quality PDI";
      case "CUSTOMER_BUYOFF": return "Customer Buyoff";
      default: return stage.replace(/_/g, ' ');
    }
  };

  const formatReworkType = (type?: string) => {
    if (!type) return "Corrective Machining";
    switch (type) {
      case "CORRECTIVE_MACHINING": return "CNC / VMC Machining";
      case "EDM_EROSION": return "Die Sinker EDM";
      case "WIRE_CUT": return "Wire Cut EDM";
      case "GRINDING_POLISHING": return "Surface Grinding";
      case "WELD_AND_REMILL": return "Argon Weld & Re-mill";
      case "HEAT_TREATMENT_STRESS_RELIEF": return "Stress Relief";
      case "FITTING_DEBURR": return "Fitting & Deburr";
      case "REBORE_ALIGN": return "Hole Re-bore & Align";
      case "SHIM_ADJUSTMENT": return "Shimming";
      default: return type.replace(/_/g, ' ');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Requested
          </span>
        );
      case "IN_REWORK":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
            In Rework
          </span>
        );
      case "RE_INSPECTION":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
            Re-Inspection
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
            Completed
          </span>
        );
      case "REJECTED_SCRAPPED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20">
            Scrapped
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-canvas text-mute border border-border-gray">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input
              type="text"
              placeholder="Search part, rework #, or defect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-[10px] border border-border-gray bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56 font-medium"
            />
          </div>

          <div className="flex items-center p-1 bg-canvas rounded-[10px] border border-border-gray gap-1">
            {["ALL", "ACTIVE", "REQUESTED", "IN_REWORK", "RE_INSPECTION", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-ink shadow-subtle"
                    : "text-mute hover:text-ink"
                }`}
              >
                {st === "ALL" ? "All Reworks" : st === "ACTIVE" ? "Active" : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {onOpenNewReworkModal && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewReworkModal}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-3.5 py-1.5 shrink-0"
          >
            Rework A Part
          </Button>
        )}
      </div>

      {/* Rework Orders Table / Cards */}
      <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Rework # & Part</th>
                  <th className="p-3">Source Stage</th>
                  <th className="p-3">Defect & Instructions</th>
                  <th className="p-3">Operation / Target Shop</th>
                  <th className="p-3 text-center">Hours</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold bg-primary-subtle text-primary border border-primary/20 shrink-0">
                          {order.reworkNumber}
                        </span>
                        {order.severity === "CRITICAL" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/10 text-red-600 border border-red-500/20">
                            Critical
                          </span>
                        )}
                        {order.severity === "URGENT" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-ink text-xs mt-1">{order.partName}</div>
                      {order.partNumber && (
                        <div className="text-[10px] font-mono text-cool-gray">Det #: {order.partNumber} ({order.quantity || 1} pcs)</div>
                      )}
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-canvas border border-border-gray text-ink">
                        {formatStage(order.sourceStage)}
                      </span>
                      {order.trial && (
                        <div className="text-[10px] font-mono text-primary mt-1">
                          Via {order.trial.trialNumber}
                        </div>
                      )}
                    </td>

                    <td className="p-3 max-w-[260px]">
                      <div className="font-semibold text-semantic-warning-dark text-[11px]">
                        {order.defectReason.replace(/_/g, ' ')}
                      </div>
                      <p className="text-[11px] text-cool-gray line-clamp-2 mt-0.5 leading-tight">
                        {order.description}
                      </p>
                      {order.resolutionNotes && (
                        <div className="mt-1 text-[10px] text-semantic-success-dark bg-semantic-success-subtle/50 px-1.5 py-0.5 rounded border border-semantic-success/20">
                          <strong>Fix:</strong> {order.resolutionNotes}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-ink text-[11px]">
                        {formatReworkType(order.reworkType)}
                      </div>
                      <div className="text-[10px] text-mute mt-0.5">
                        Shop: {order.targetDepartment.replace(/_/g, ' ')}
                      </div>
                      {order.assignedTo && (
                        <div className="text-[10px] text-cool-gray flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-mute" />
                          <span>{order.assignedTo}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="font-mono font-semibold text-ink text-xs">
                        {Number(order.actualHours) > 0 ? `${order.actualHours}h act.` : `${order.estimatedHours || 0}h est.`}
                      </div>
                      <div className="text-[10px] text-mute">Qty: {order.quantity || 1}</div>
                    </td>

                    <td className="p-3 text-center">
                      {renderStatusBadge(order.status)}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {order.status === "REQUESTED" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenStatusModal(order, "IN_REWORK")}
                            leftIcon={<Play className="w-3 h-3" />}
                            className="px-2.5 py-1 text-[10px] font-semibold"
                          >
                            Start Rework
                          </Button>
                        )}

                        {order.status === "IN_REWORK" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenStatusModal(order, "RE_INSPECTION")}
                            leftIcon={<CheckSquare className="w-3 h-3" />}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Send to Inspection
                          </Button>
                        )}

                        {order.status === "RE_INSPECTION" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenStatusModal(order, "COMPLETED")}
                            leftIcon={<CheckCircle2 className="w-3 h-3" />}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-semantic-success-dark hover:bg-semantic-success-dark/90 text-white"
                          >
                            Pass & Complete
                          </Button>
                        )}

                        {order.status === "COMPLETED" && (
                          <span className="text-[10px] font-semibold text-semantic-success-dark inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success-dark" />
                            Passed
                          </span>
                        )}

                        {order.status !== "COMPLETED" && order.status !== "REJECTED_SCRAPPED" && (
                          <button
                            onClick={() => handleOpenStatusModal(order, "REJECTED_SCRAPPED")}
                            className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                            title="Scrap Component"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete rework order ${order.reworkNumber}?`)) {
                              deleteMutation.mutate(order.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-canvas text-mute hover:text-red-600 transition-colors"
                          title="Delete Rework Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-canvas">
            <div className="w-10 h-10 rounded-[12px] bg-primary-subtle text-primary mx-auto flex items-center justify-center mb-2">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="font-semibold text-ink text-sm">No Part Rework Orders Found</div>
            <p className="text-xs text-mute mt-1 max-w-sm mx-auto">
              {searchQuery || filterStatus !== "ALL"
                ? "No rework orders match your current filter criteria."
                : "All components are within tolerance and passing trials without rework."}
            </p>
            {onOpenNewReworkModal && (
              <Button
                variant="white"
                size="sm"
                onClick={onOpenNewReworkModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="mt-3 text-xs"
              >
                Create Part Rework Order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {showStatusModal && selectedOrder && (
        <Modal
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={`Update Rework Status: ${selectedOrder.reworkNumber}`}
          subtitle={`Moving "${selectedOrder.partName}" to ${newStatus.replace(/_/g, ' ')}.`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmStatusUpdate} className="space-y-4">
            <div className="bg-canvas border border-border-gray rounded-[10px] p-3 text-xs space-y-1">
              <div><strong>Part:</strong> {selectedOrder.partName} {selectedOrder.partNumber ? `(${selectedOrder.partNumber})` : ''}</div>
              <div><strong>Defect:</strong> {selectedOrder.defectReason.replace(/_/g, ' ')}</div>
              <div><strong>Operation:</strong> {formatReworkType(selectedOrder.reworkType)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-semibold"
                >
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="IN_REWORK">IN REWORK</option>
                  <option value="RE_INSPECTION">RE-INSPECTION</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REJECTED_SCRAPPED">REJECTED / SCRAPPED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Actual Hours Spent (hrs)</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-mono"
                />
              </div>
            </div>

            {newStatus === "COMPLETED" && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">QC Re-Inspection Result</label>
                <select
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink font-semibold"
                >
                  <option value="PASSED">PASSED — Within Tolerance</option>
                  <option value="PASSED_WITH_DEVIATION">PASSED WITH APPROVED DEVIATION</option>
                  <option value="FAILED_SCRAP">FAILED — Part Scrapped</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Resolution / Machining Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Ground top face by 0.04mm. Measured with micrometer, result 32.00mm exact."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-gray">
              <Button
                type="button"
                variant="white"
                size="sm"
                onClick={() => setShowStatusModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                className="text-xs font-semibold"
              >
                Save Status Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
