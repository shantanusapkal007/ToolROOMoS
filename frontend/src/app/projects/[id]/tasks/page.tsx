"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

export default function ProjectTasksPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const tasks = project?.tasks || [];

  const columns = [
    { key: 'title', label: 'Action Item / Task' },
    { key: 'assignee', label: 'Assigned To' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>Project Action Plan & Task List</span>
          </h2>
          <p className="text-xs text-zinc-500">Milestone checklists, ECN / ECO engineering change action items, and departmental tasks.</p>
        </div>

        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>Create Task Item</span>
        </Button>
      </div>

      <SmartTable 
        title="Project Task Register"
        columns={columns}
        data={tasks}
        isLoading={false}
        exportFilename="Project_Tasks"
      />
    </div>
  );
}
