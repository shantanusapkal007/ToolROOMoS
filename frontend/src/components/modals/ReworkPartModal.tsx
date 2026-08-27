"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useCreatePartReworkOrder } from "@/hooks/usePartRework";
import { useMasterData } from "@/hooks/useMasterData";
import {
  Wrench,
  AlertTriangle,
  RotateCcw,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface ReworkPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialPartName?: string;
  initialPartNumber?: string;
  initialBomItemId?: string;
  initialSourceStage?: string;
  initialTrialId?: string;
  initialNcrId?: string;
  initialDefectReason?: string;
  initialDescription?: string;
  initialQuantity?: number;
}

const REWORK_TYPES = [
  { id: "CORRECTIVE_MACHINING", label: "CNC/VMC Corrective Machining", desc: "Re-machining profile, pocket, or face" },
  { id: "EDM_EROSION", label: "Die Sinker EDM Spark Erosion", desc: "Re-sparking hardened cavity / fine ribs" },
  { id: "WIRE_CUT", label: "Wire Cut EDM Correction", desc: "Trimming punch/die clearance & contours" },
  { id: "GRINDING_POLISHING", label: "Surface / Cylindrical Grinding", desc: "Precision face grinding & mirror polishing" },
  { id: "WELD_AND_REMILL", label: "Argon / Laser Weld & Re-machine", desc: "Weld build-up on undersized edges and re-mill" },
  { id: "HEAT_TREATMENT_STRESS_RELIEF", label: "Stress Relieving / Re-hardening", desc: "De-stressing distorted or cracked tool steel" },
  { id: "FITTING_DEBURR", label: "Toolroom Fitting & Deburring", desc: "Manual spot grinding, clearance scraping, deburring" },
  { id: "REBORE_ALIGN", label: "Hole Re-boring & Alignment", desc: "Boring out offset guide pillar/pin holes" },
  { id: "SHIM_ADJUSTMENT", label: "Shimming & Height Tuning", desc: "Adding precision ground shims for shut height" },
  { id: "OTHER", label: "Other Toolroom Rework", desc: "Custom correction process" },
];

const DEFECT_REASONS = [
  { id: "DIMENSION_OVERSIZE", label: "Dimension Oversize (Material Excess)" },
  { id: "DIMENSION_UNDERSIZE", label: "Dimension Undersize (Needs Weld/Shim)" },
  { id: "CLEARANCE_TIGHT", label: "Punch & Die Clearance Tight (Burr/Jamming)" },
  { id: "CLEARANCE_EXCESSIVE", label: "Punch & Die Clearance Too Wide" },
  { id: "HOLE_MISALIGNMENT", label: "Hole Pitch / Dowel Pin Offset" },
  { id: "WARPAGE_DISTORTION", label: "Warpage / Hardening Distortion" },
  { id: "SURFACE_DEFECT", label: "Tool Marks / Chattering / Bad Finish" },
  { id: "BURR_IN_TRIAL", label: "Trial Defect — Heavy Burr on Stamping" },
  { id: "WRINKLING_SPRINGBACK", label: "Trial Defect — Sheet Wrinkling / Springback" },
  { id: "HARDENING_DEVIATION", label: "Hardness Out of Spec (HRC Deviation)" },
  { id: "ASSEMBLY_INTERFERENCE", label: "Assembly / Kitting Interference" },
  { id: "OTHER", label: "Other Technical Defect" },
];

const SOURCE_STAGES = [
  { id: "ENGINEERING", label: "Engineering & BOM Review" },
  { id: "MACHINING", label: "Machine Shop / CNC Machining" },
  { id: "FITTING", label: "Toolroom Fitting & Assembly" },
  { id: "TRIAL", label: "Press / Mold Tryout (T0 - T3)" },
  { id: "QUALITY_INSPECTION", label: "3-Stage Quality Control / PDI" },
  { id: "CUSTOMER_BUYOFF", label: "Customer Buyoff Inspection" },
];

const TARGET_DEPARTMENTS = [
  { id: "MACHINE_SHOP", label: "Machine Shop (VMC / CNC / Lathe)" },
  { id: "TOOL_ROOM_FITTING", label: "Toolroom Fitting Shop" },
  { id: "EDM_SECTION", label: "EDM & Wire Cut Section" },
  { id: "GRINDING_SECTION", label: "Precision Grinding Section" },
  { id: "WELDING_SECTION", label: "Welding & Metal Additive Section" },
  { id: "SUBCONTRACTOR", label: "External Subcontractor" },
];

export function ReworkPartModal({
  isOpen,
  onClose,
  projectId,
  initialPartName = "",
  initialPartNumber = "",
  initialBomItemId = "",
  initialSourceStage = "MACHINING",
  initialTrialId = "",
  initialNcrId = "",
  initialDefectReason = "DIMENSION_OVERSIZE",
  initialDescription = "",
  initialQuantity = 1,
}: ReworkPartModalProps) {
  const [partName, setPartName] = useState(initialPartName);
  const [partNumber, setPartNumber] = useState(initialPartNumber);
  const [sourceStage, setSourceStage] = useState(initialSourceStage);
  const [reworkType, setReworkType] = useState("CORRECTIVE_MACHINING");
  const [defectReason, setDefectReason] = useState(initialDefectReason);
  const [description, setDescription] = useState(initialDescription);
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [severity, setSeverity] = useState("NORMAL");
  const [targetDepartment, setTargetDepartment] = useState("MACHINE_SHOP");
  const [assignedTo, setAssignedTo] = useState("");
  const [machineId, setMachineId] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("2.5");

  const { data: employees = [] } = useMasterData("employees");
  const { data: machines = [] } = useMasterData("machines");

  const createReworkMutation = useCreatePartReworkOrder(projectId);

  useEffect(() => {
    if (isOpen) {
      setPartName(initialPartName || "");
      setPartNumber(initialPartNumber || "");
      setSourceStage(initialSourceStage || "MACHINING");
      setDefectReason(initialDefectReason || "DIMENSION_OVERSIZE");
      setDescription(initialDescription || "");
      setQuantity(initialQuantity || 1);
    }
  }, [isOpen, initialPartName, initialPartNumber, initialSourceStage, initialDefectReason, initialDescription, initialQuantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    try {
      await createReworkMutation.mutateAsync({
        partName: partName.trim(),
        partNumber: partNumber.trim() || undefined,
        bomItemId: initialBomItemId || undefined,
        sourceStage,
        reworkType,
        defectReason,
        description: description.trim() || `Rework requested for ${partName} (${defectReason.replace(/_/g, ' ')})`,
        quantity: Number(quantity) || 1,
        severity,
        targetDepartment,
        assignedTo: assignedTo || undefined,
        machineId: machineId || undefined,
        estimatedHours: Number(estimatedHours) || 0,
        trialId: initialTrialId || undefined,
        ncrId: initialNcrId || undefined,
      });
      onClose();
    } catch (err) {
      // Handled in mutation hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Part Rework"
      subtitle="Issue a formal toolroom corrective rework order for defective or out-of-tolerance components."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Alert */}
        <div className="bg-semantic-warning-subtle border border-semantic-warning/20 rounded-[12px] p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-semantic-warning-dark shrink-0 mt-0.5" />
          <div className="text-xs text-semantic-warning-dark leading-relaxed">
            <span className="font-bold">Toolroom Rework Rule:</span> Flagging a part for rework creates an auditable
            rework order in the system, schedules corrective machining/fitting hours, and alerts the quality & machine shop leads.
          </div>
        </div>

        {/* Part Identity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1">
              Part / Component Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Upper Punch Insert Det #04"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Det # / Part Number
            </label>
            <input
              type="text"
              placeholder="e.g. DET-04 / PIN-02"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Stage & Defect Reason Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Detected Stage <span className="text-red-500">*</span>
            </label>
            <select
              value={sourceStage}
              onChange={(e) => setSourceStage(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            >
              {SOURCE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Defect Category <span className="text-red-500">*</span>
            </label>
            <select
              value={defectReason}
              onChange={(e) => setDefectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            >
              {DEFECT_REASONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rework Operation Type */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Required Rework Operation <span className="text-red-500">*</span>
          </label>
          <select
            value={reworkType}
            onChange={(e) => setReworkType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
          >
            {REWORK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} — {t.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Target Department, Machine & Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-ink mb-1">
              Target Shop / Department
            </label>
            <select
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {TARGET_DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Priority
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                severity === "CRITICAL"
                  ? "text-red-600"
                  : severity === "URGENT"
                  ? "text-amber-600"
                  : "text-ink"
              }`}
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent (Hold assembly)</option>
              <option value="CRITICAL">Critical (Line Stoppage)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Est. Hours (hrs)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="2.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Assigned Machinist & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Assign Machinist / Fitter (Optional)
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">-- Unassigned / Pool --</option>
              {employees.map((emp: any) => (
                <option key={emp.id || emp.name} value={emp.name || emp.employeeCode}>
                  {emp.name} ({emp.designation || "Technician"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Quantity to Rework (pcs)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Detailed Technical Instructions */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Technical Instructions & Deviation Details <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="e.g. Surface grind top face by -0.04mm to achieve 32.00 +/-0.01mm shut height. Re-spark EDM slot to remove 0.03mm burr."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-gray">
          <Button
            type="button"
            variant="white"
            size="sm"
            onClick={onClose}
            className="px-4 py-2 text-xs"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createReworkMutation.isPending}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="px-5 py-2 text-xs font-semibold shadow-subtle"
          >
            Issue Part Rework Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
