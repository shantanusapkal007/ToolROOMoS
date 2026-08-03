"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

export default function ProjectAssemblyPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const trials = project?.projectTrials || [];

  const columns = [
    { key: 'trialNumber', label: 'Trial #' },
    { key: 'machineName', label: 'Press / Machine' },
    { key: 'result', label: 'Trial Result' },
    { key: 'remarks', label: 'Observations' },
    { key: 'createdAt', label: 'Date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>Bench Assembly & Die Tryout Register</span>
          </h2>
          <p className="text-xs text-zinc-500">Tooling assembly, spotting logs, and press trial performance results (T0, T1, T2).</p>
        </div>

        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>Record Trial Run</span>
        </Button>
      </div>

      <SmartTable 
        title="Die Tryouts & Assembly Logs"
        columns={columns}
        data={trials}
        isLoading={false}
        exportFilename="Die_Tryouts"
      />
    </div>
  );
}
