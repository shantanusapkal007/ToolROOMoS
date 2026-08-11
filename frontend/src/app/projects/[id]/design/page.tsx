"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useGlobalDailyReports } from "@/hooks/useDailyReports";
import { Layers, Clock, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { Button } from "@/components/ui/Button";
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
    { key: 'logDate', label: 'Work Date', render: (val: string) => <span className="font-mono text-ink">{val ? formatDate(val) : 'N/A'}</span> },
    { key: 'personName', label: 'Designer / Employee', render: (val: string) => <span className="font-medium text-ink">{val || 'Designer'}</span> },
    { key: 'workStageOrOperation', label: 'CAD / Design Stage', render: (val: string) => <span className="font-semibold text-ink">{val || '3D CAD Modeling'}</span> },
    { key: 'partOrDrawing', label: 'Part / Drawing #', render: (val: string) => <span className="font-mono text-cool-gray">{val || 'N/A'}</span> },
    { key: 'hoursSpent', label: 'Hours Spent', render: (val: number) => <span className="font-mono font-semibold text-primary">{val || 0} hrs</span> },
    { key: 'description', label: 'Activity Description', render: (val: string) => <span className="text-xs text-cool-gray truncate max-w-xs">{val || '-'}</span> },
    { key: 'status', label: 'Status', render: (val: string) => <span className="px-2 py-0.5 rounded text-micro font-semibold bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">{val || 'COMPLETED'}</span> },
  ];

  if (isLoading) {
    return <SkeletonBox className="h-96 w-full" />;
  }

  const totalHours = logs.reduce((acc: number, item: any) => acc + (Number(item.hoursSpent) || Number(item.cuttingTime) || 0), 0);
  const completedStagesCount = logs.filter((l: any) => l.status === 'COMPLETED' || !l.status).length;

  return (
    <div className="space-y-6">
      
      {/* Standard Module Header Card */}
      <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink tracking-tight">
              3D CAD & Tooling Design Workstation Register
            </h1>
          </div>
          <p className="text-xs text-mute ml-[42px]">
            Design activity logs and CAD timesheets for this project (sourced from Employee Daily Report).
          </p>
        </div>

        <Link href="/employee-daily-report">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-primary" />}
          >
            Open Employee Daily Report Sheet
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* KPI 1: Project Design Logs */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase text-cool-gray tracking-wider">Project Design Logs</span>
            <div className="text-2xl font-semibold font-mono text-ink mt-1">{logs.length}</div>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-primary-subtle text-primary flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Total Hours Invested */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase text-cool-gray tracking-wider">Total Hours Invested</span>
            <div className="text-2xl font-semibold font-mono text-primary mt-1">
              {totalHours} hrs
            </div>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-primary-subtle text-primary flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: Completed Stages */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase text-cool-gray tracking-wider">Completed Stages</span>
            <div className="text-2xl font-semibold font-mono text-semantic-success-dark mt-1">
              {completedStagesCount}
            </div>
          </div>
          <div className="w-8 h-8 rounded-[12px] bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center">
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
