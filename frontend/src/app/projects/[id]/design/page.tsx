"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGlobalDailyReports } from "@/hooks/useDailyReports";
import { Layers, Clock, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { formatDate } from "@/lib/formatters";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import Link from "next/link";

export default function ProjectDesignPage() {
  const params = useParams();
  const id = params?.id as string;

  // Fetch designer activity reports filtered specifically for this project
  const { data: logsResponse, isLoading } = useGlobalDailyReports({
    projectId: id,
    type: 'DESIGNER',
  });

  const extractLogs = (res: any) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const logs = extractLogs(logsResponse);

  const columns = [
    { key: 'logDate', label: 'Work Date', render: (val: string) => <span className="font-mono">{val ? formatDate(val) : 'N/A'}</span> },
    { key: 'personName', label: 'Designer / Employee', render: (val: string) => <span className="font-medium text-ink">{val || 'Designer'}</span> },
    { key: 'workStageOrOperation', label: 'CAD / Design Stage', render: (val: string) => <span className="font-semibold text-ink">{val || '3D CAD Modeling'}</span> },
    { key: 'partOrDrawing', label: 'Part / Drawing #', render: (val: string) => <span className="font-mono text-zinc-600">{val || 'N/A'}</span> },
    { key: 'hoursSpent', label: 'Hours Spent', render: (val: number) => <span className="font-mono font-semibold text-primary">{val || 0} hrs</span> },
    { key: 'description', label: 'Activity Description', render: (val: string) => <span className="text-xs text-zinc-600 truncate max-w-xs">{val || '-'}</span> },
    { key: 'status', label: 'Status', render: (val: string) => <span className="px-2 py-0.5 rounded text-micro font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{val || 'COMPLETED'}</span> },
  ];

  if (isLoading) {
    return <SkeletonBox className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Navigation to Employee Daily Report */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>3D CAD & Tooling Design Workstation Register</span>
          </h2>
          <p className="text-xs text-mute">
            Design activity logs and CAD timesheets for this project (sourced from Employee Daily Report).
          </p>
        </div>

        <Link
          href="/employee-daily-report"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[12px] border border-border-gray bg-white hover:bg-canvas text-zinc-700 text-xs font-semibold shadow-subtle transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <span>Open Employee Daily Report Sheet</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="enterprise-card p-4 flex items-center justify-between">
          <div>
            <span className="text-micro font-semibold uppercase text-mute">Project Design Logs</span>
            <div className="text-2xl font-semibold font-mono text-ink mt-1">{logs.length}</div>
          </div>
          <div className="w-8 h-8 rounded bg-primary-subtle border border-blue-200 flex items-center justify-center text-primary">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="enterprise-card p-4 flex items-center justify-between">
          <div>
            <span className="text-micro font-semibold uppercase text-mute">Total Hours Invested</span>
            <div className="text-2xl font-semibold font-mono text-primary mt-1">
              {logs.reduce((acc: number, item: any) => acc + (Number(item.hoursSpent) || Number(item.cuttingTime) || 0), 0)} hrs
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="enterprise-card p-4 flex items-center justify-between">
          <div>
            <span className="text-micro font-semibold uppercase text-mute">Completed Stages</span>
            <div className="text-2xl font-semibold font-mono text-emerald-700 mt-1">
              {logs.filter((l: any) => l.status === 'COMPLETED' || !l.status).length}
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Logs Table */}
      <SmartTable
        title="Project Design Activity Register"
        columns={columns}
        data={logs}
        isLoading={isLoading}
        exportFilename="Project_Designer_Work_Logs"
      />

    </div>
  );
}
