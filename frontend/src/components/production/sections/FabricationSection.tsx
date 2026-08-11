"use client";

import React from "react";
import { Clock, Flame, Users, Layers, Wrench } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { formatDate } from "@/lib/formatters";

interface FabricationSectionProps {
  data: any[];
  materialIssues?: any[];
  isLoading: boolean;
  onMarkComplete: (item: any) => void;
}

export function FabricationSection({ data, materialIssues = [], isLoading, onMarkComplete }: FabricationSectionProps) {
  const sectionData = data.filter(
    (item: any) => item.section === "FABRICATION_INDIAN" || item.section === "FABRICATION"
  );
  const sectionIssues = materialIssues.filter(
    (item: any) => item.section === "FABRICATION_INDIAN" || item.section === "FABRICATION"
  );

  const issueColumns = [
    { key: 'issueNumber', label: 'Issue #' },
    { key: 'materialName', label: 'Material' },
    { key: 'batchNumber', label: 'Batch #' },
    { key: 'heatNumber', label: 'Heat #' },
    { key: 'issuedQty', label: 'Issued Qty' },
    { key: 'date', label: 'Date' },
    { key: 'remarks', label: 'Remarks' },
  ];

  // KPIs
  const totalWeldHrs = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.cuttingTime) || Number(item.hoursSpent) || 0), 0
  );
  const totalOutputQty = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.producedQty) || 0), 0
  );
  const uniqueWelders = new Set(sectionData.map((item: any) => item.personName).filter(Boolean));
  const totalLogs = sectionData.length;

  const kpis = [
    {
      label: "Total Welding / Fab Hours",
      value: `${totalWeldHrs.toFixed(1)} hrs`,
      icon: Flame,
      color: "text-primary",
      bg: "bg-primary-subtle",
      border: "border-blue-200/60",
    },
    {
      label: "Assemblies / Structures",
      value: `${totalOutputQty}`,
      icon: Layers,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200/60",
    },
    {
      label: "Active Welders / Fitters",
      value: `${uniqueWelders.size}`,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200/60",
    },
    {
      label: "Total Operations Logged",
      value: `${totalLogs}`,
      icon: Wrench,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200/60",
    },
  ];

  const columns = [
    {
      key: "logDate",
      label: "Date",
      render: (val: string) => (
        <span className="font-mono text-zinc-700">{val ? formatDate(val) : "N/A"}</span>
      ),
    },
    {
      key: "machineOrTool",
      label: "Equipment / Welding Type",
      render: (val: string) => (
        <span className="font-semibold text-ink">{val || "TIG Welder"}</span>
      ),
    },
    {
      key: "personName",
      label: "Welder / Fitter",
      render: (val: string) => (
        <span className="text-zinc-700 font-medium">{val || "Welder"}</span>
      ),
    },
    {
      key: "workStageOrOperation",
      label: "Operation",
      render: (val: string) => (
        <span className="text-xs font-mono font-medium text-zinc-800 bg-primary-subtle px-2 py-0.5 rounded border border-blue-200/60">
          {val || "Welding"}
        </span>
      ),
    },
    {
      key: "partOrDrawing",
      label: "Assembly / Structure",
      render: (val: string) => (
        <span className="font-mono text-zinc-600 text-[11px]">{val || "N/A"}</span>
      ),
    },
    {
      key: "description",
      label: "Work Description",
      render: (val: string) => (
        <span className="text-xs text-zinc-600 truncate max-w-[160px] block">{val || "-"}</span>
      ),
    },
    {
      key: "cuttingTime",
      label: "Operation Hrs",
      render: (val: number, row: any) => (
        <span className="font-mono font-semibold text-primary">{val || Number(row?.hoursSpent) || 0}h</span>
      ),
    },
    {
      key: "producedQty",
      label: "Output",
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
            : "bg-primary-subtle text-primary-dark border-blue-200"
        }`}>
          {val || "IN PROGRESS"}
        </span>
      ),
    },
    {
      key: "_actions",
      label: "",
      render: (_: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkComplete(row);
          }}
          className="px-2.5 py-1 rounded-[12px] text-[10px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          Complete → Move
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[12px] bg-blue-100 border border-blue-200/60 flex items-center justify-center">
          <Flame className="w-4.5 h-4.5 text-primary-dark" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Fabrication</h3>
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
          exportFilename="Fabrication_Issued_Materials"
        />
      </div>

      {/* Data Table */}
      <SmartTable
        title="Fabrication (Domestic) Daily Reports"
        columns={columns}
        data={sectionData}
        isLoading={isLoading}
        exportFilename="Fabrication_Domestic_Logs"
      />
    </div>
  );
}
