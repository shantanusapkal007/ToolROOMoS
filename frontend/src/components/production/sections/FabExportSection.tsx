"use client";

import React from "react";
import { Clock, Truck, ShieldCheck, Package, Globe } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { formatDate } from "@/lib/formatters";

interface FabExportSectionProps {
  data: any[];
  materialIssues?: any[];
  isLoading: boolean;
  onMarkComplete: (item: any) => void;
}

export function FabExportSection({ data, materialIssues = [], isLoading, onMarkComplete }: FabExportSectionProps) {
  const sectionData = data.filter((item: any) => item.section === "FABRICATION_EXPORT");
  const sectionIssues = materialIssues.filter((item: any) => item.section === "FABRICATION_EXPORT");

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
  const totalHrs = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.cuttingTime) || Number(item.hoursSpent) || 0), 0
  );
  const totalOutputQty = sectionData.reduce(
    (acc: number, item: any) => acc + (Number(item.producedQty) || 0), 0
  );
  const uniqueOperators = new Set(sectionData.map((item: any) => item.personName).filter(Boolean));
  const totalLogs = sectionData.length;

  const kpis = [
    {
      label: "Export Jobs Active",
      value: `${totalLogs}`,
      icon: Globe,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200/60",
    },
    {
      label: "Total Operation Hours",
      value: `${totalHrs.toFixed(1)} hrs`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200/60",
    },
    {
      label: "Export Output",
      value: `${totalOutputQty} pcs`,
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200/60",
    },
    {
      label: "Active Operators",
      value: `${uniqueOperators.size}`,
      icon: Truck,
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
      label: "Equipment / Process",
      render: (val: string) => (
        <span className="font-semibold text-zinc-900">{val || "Export Welding"}</span>
      ),
    },
    {
      key: "personName",
      label: "Operator",
      render: (val: string) => (
        <span className="text-zinc-700 font-medium">{val || "Operator"}</span>
      ),
    },
    {
      key: "workStageOrOperation",
      label: "Process Type",
      render: (val: string) => (
        <span className="text-xs font-mono font-medium text-zinc-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
          {val || "Export Fabrication"}
        </span>
      ),
    },
    {
      key: "partOrDrawing",
      label: "Part / Assembly",
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
        <span className="font-mono font-bold text-indigo-600">{val || Number(row?.hoursSpent) || 0}h</span>
      ),
    },
    {
      key: "producedQty",
      label: "Output",
      render: (val: number) => (
        <span className="font-mono font-bold text-zinc-900">{val || 0} pcs</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
          val === "COMPLETED"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-indigo-50 text-indigo-700 border-indigo-200"
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
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
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
        <div className="w-9 h-9 rounded-xl bg-teal-100 border border-teal-200/60 flex items-center justify-center">
          <Globe className="w-4.5 h-4.5 text-teal-700" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-zinc-900">Fab Export</h3>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`p-3.5 rounded-2xl bg-white border ${kpi.border} shadow-xs flex items-center justify-between`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  {kpi.label}
                </span>
                <span className={`text-lg font-bold font-mono mt-0.5 block ${kpi.color}`}>
                  {kpi.value}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
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
          exportFilename="FabExport_Issued_Materials"
        />
      </div>

      {/* Data Table */}
      <SmartTable
        title="Fabrication Export Daily Reports"
        columns={columns}
        data={sectionData}
        isLoading={isLoading}
        exportFilename="Fabrication_Export_Logs"
      />
    </div>
  );
}
