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
      color: "text-primary",
      bg: "bg-primary-subtle",
      border: "border-primary/20",
    },
    {
      label: "Total Operation Hours",
      value: `${totalHrs.toFixed(1)} hrs`,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary-subtle",
      border: "border-primary/20",
    },
    {
      label: "Export Output",
      value: `${totalOutputQty} pcs`,
      icon: Package,
      color: "text-semantic-success-dark",
      bg: "bg-semantic-success-subtle",
      border: "border-semantic-success/20",
    },
    {
      label: "Active Operators",
      value: `${uniqueOperators.size}`,
      icon: Truck,
      color: "text-semantic-warning-dark",
      bg: "bg-semantic-warning-subtle",
      border: "border-semantic-warning/20",
    },
  ];

  const columns = [
    {
      key: "logDate",
      label: "Date",
      render: (val: string) => (
        <span className="font-mono text-ink">{val ? formatDate(val) : "N/A"}</span>
      ),
    },
    {
      key: "machineOrTool",
      label: "Equipment / Process",
      render: (val: string) => (
        <span className="font-semibold text-ink">{val || "Export Welding"}</span>
      ),
    },
    {
      key: "personName",
      label: "Operator",
      render: (val: string) => (
        <span className="text-cool-gray font-medium">{val || "Operator"}</span>
      ),
    },
    {
      key: "workStageOrOperation",
      label: "Process Type",
      render: (val: string) => (
        <span className="text-xs font-mono font-medium text-ink bg-primary-subtle px-2 py-0.5 rounded border border-primary/20">
          {val || "Export Fabrication"}
        </span>
      ),
    },
    {
      key: "partOrDrawing",
      label: "Part / Assembly",
      render: (val: string) => (
        <span className="font-mono text-cool-gray text-[11px]">{val || "N/A"}</span>
      ),
    },
    {
      key: "description",
      label: "Work Description",
      render: (val: string) => (
        <span className="text-xs text-cool-gray truncate max-w-[160px] block">{val || "-"}</span>
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
            ? "bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/20"
            : "bg-primary-subtle text-primary border-primary/20"
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
          className="px-2.5 py-1 rounded-[12px] text-[10px] font-semibold bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer whitespace-nowrap"
        >
          Complete → Move
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[12px] bg-primary-subtle border border-primary/20 flex items-center justify-center">
          <Globe className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Fabrication (Foreign / Export)</h3>
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
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cool-gray block">
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
          exportFilename="FabForeign_Issued_Materials"
        />
      </div>

      {/* Data Table */}
      <SmartTable
        title="Fabrication (Foreign) Daily Reports"
        columns={columns}
        data={sectionData}
        isLoading={isLoading}
        exportFilename="Fabrication_Foreign_Logs"
      />
    </div>
  );
}
