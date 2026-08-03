"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { ShieldCheck, Plus, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

export default function ProjectQualityPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const inspectionLogs = project?.inspectionHeaders || [];

  const columns = [
    { key: 'inspectionNumber', label: 'Inspection #' },
    { key: 'inspectorName', label: 'Inspector' },
    { key: 'stage', label: 'Stage' },
    { key: 'status', label: 'Verdict' },
    { key: 'createdAt', label: 'Date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            <span>Quality Inspection & Verification Register</span>
          </h2>
          <p className="text-xs text-zinc-500">CMM reports, surface finish checks, and final PDI sign-offs.</p>
        </div>

        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>New Inspection Entry</span>
        </Button>
      </div>

      <SmartTable 
        title="Quality Log Headers"
        columns={columns}
        data={inspectionLogs}
        isLoading={false}
        exportFilename="Quality_Inspections"
      />
    </div>
  );
}
