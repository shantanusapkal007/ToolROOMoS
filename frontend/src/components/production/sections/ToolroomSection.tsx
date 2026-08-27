"use client";

import React from "react";
import { Clock, Cpu, Settings, Package, Gauge, PackageCheck } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { formatDate } from "@/lib/formatters";

interface ToolroomSectionProps {
  data: any[];
  materialIssues?: any[];
  isLoading: boolean;
  onMarkComplete: (item: any) => void;
  onReworkPart?: (item: any) => void;
}

export function ToolroomSection({ data, materialIssues = [], isLoading, onMarkComplete, onReworkPart }: ToolroomSectionProps) {
  // Filter for toolroom-related sections
  const sectionData = data.filter((item: any) => {
    const s = item.section;
    return s === "TOOL_ROOM_FITTING" || s === "MACHINE_SHOP" || !s;
  });

  const sectionIssues = materialIssues.filter((item: any) => {
    const s = item.section;
    return s === "TOOL_ROOM_FITTING" || s === "MACHINE_SHOP" || !s;
  });

  const issueColumns = [
    { key: 'issueNumber', label: 'Issue #' },
    { key: 'materialName', label: 'Material' },
    { key: 'batchNumber', label: 'Batch #' },
    { key: 'issuedQty', label: 'Issued Qty' },
    { key: 'date', label: 'Date' },
    { key: 'remarks', label: 'Remarks' },
  ];

  // KPI calculations
  const totalMachineHrs = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.cuttingTime) || 0), 0
  );
  const totalSetupHrs = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.setupTime) || 0), 0
  );
  const totalOutputQty = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.producedQty) || 0), 0
  );
  const uniqueMachines = new Set(sectionData.map((item: any) => item.machineOrTool).filter(Boolean));
  const avgSetup = sectionData.length > 0 ? (totalSetupHrs / sectionData.length).toFixed(1) : "0";

  const kpis = [
    {
      label: "Total Machine Hours",
      value: `${totalMachineHrs.toFixed(1)} hrs`,
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200/60",
    },
    {
      label: "Active Machines Used",
      value: `${uniqueMachines.size}`,
      icon: Cpu,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200/60",
    },
    {
      label: "Avg Setup Time",
      value: `${avgSetup} hrs`,
      icon: Settings,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200/60",
    },
    {
      label: "Total Output",
      value: `${totalOutputQty} pcs`,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary-subtle",
      border: "border-blue-200/60",
    },
  ];

  const columns = [
    {
      key: "logDate",
      label: "Shift Date",
      render: (val: string) => (
        <span className="font-mono text-zinc-700">{val ? formatDate(val) : "N/A"}</span>
      ),
    },
    {
      key: "machineOrTool",
      label: "Machine (CNC/VMC/EDM/Grinder)",
      render: (val: string) => (
        <span className="font-semibold text-ink">{val || "CNC Milling"}</span>
      ),
    },
    {
      key: "personName",
      label: "Operator / Fitter",
      render: (val: string) => (
        <span className="text-zinc-700 font-medium">{val || "Operator"}</span>
      ),
    },
    {
      key: "workStageOrOperation",
      label: "Operation",
      render: (val: string) => (
        <span className="text-xs font-mono font-medium text-zinc-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
          {val || "Machining"}
        </span>
      ),
    },
    {
      key: "partOrDrawing",
      label: "Tool # / Det #",
      render: (val: string) => (
        <span className="font-mono text-zinc-600 text-[11px]">{val || "N/A"}</span>
      ),
    },
    {
      key: "setupTime",
      label: "Setup Hrs",
      render: (val: number) => (
        <span className="font-mono text-amber-600 font-medium">{val || 0}h</span>
      ),
    },
    {
      key: "cuttingTime",
      label: "Cutting Hrs",
      render: (val: number) => (
        <span className="font-mono font-semibold text-emerald-600">{val || 0}h</span>
      ),
    },
    {
      key: "producedQty",
      label: "Output Qty",
      render: (val: number) => (
        <span className="font-mono font-semibold text-ink">{val || 0} pcs</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
          val === "COMPLETED" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {val || "IN PROGRESS"}
        </span>
      ),
    },
    {
      key: "_actions",
      label: "",
      render: (_: any, row: any) => (
        <div className="flex items-center justify-end gap-1.5">
          {onReworkPart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReworkPart(row);
              }}
              className="px-2 py-1 rounded-[10px] text-[10px] font-semibold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer whitespace-nowrap"
              title="Rework this Part"
            >
              Rework
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkComplete(row);
            }}
            className="px-2.5 py-1 rounded-[12px] text-[10px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Complete → Move
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[12px] bg-purple-100 border border-purple-200/60 flex items-center justify-center">
          <Cpu className="w-4.5 h-4.5 text-purple-700" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Toolroom</h3>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`p-3.5 rounded-[12px] bg-white border ${kpi.border} shadow-subtle flex items-center justify-between`}
            >
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  {kpi.label}
                </span>
                <span className={`text-lg font-semibold font-mono mt-0.5 block ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-[12px] ${kpi.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Received Raw Materials Section */}
      <div className="pt-2">
        <SmartTable
          title="Received Section Raw Materials & Dispatched Batches"
          columns={issueColumns}
          data={sectionIssues}
          isLoading={false}
          exportFilename="Toolroom_Issued_Materials"
        />
      </div>

      {/* Data Table */}
      <SmartTable
        title="Toolroom Machine Shop Daily Reports"
        columns={columns}
        data={sectionData}
        isLoading={isLoading}
        exportFilename="Toolroom_Production_Logs"
      />
    </div>
  );
}
