"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { Truck, Plus, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

export default function ProjectDispatchPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading } = useProject(id);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const dispatchNotes = project?.dispatchNotes || [];

  const columns = [
    { key: 'dispatchNumber', label: 'Challan #' },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'driverName', label: 'Driver' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Dispatch Date' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-600" />
            <span>Dispatch & Logistics Register</span>
          </h2>
          <p className="text-xs text-zinc-500">Outward delivery gate passes, transport logistics, and customer receipt acknowledgments.</p>
        </div>

        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>Generate Dispatch Note</span>
        </Button>
      </div>

      <SmartTable 
        title="Dispatch Challans"
        columns={columns}
        data={dispatchNotes}
        isLoading={false}
        exportFilename="Dispatch_Challans"
      />
    </div>
  );
}
