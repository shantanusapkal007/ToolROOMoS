"use client";

import React from "react";
import { useParams } from "next/navigation";
import { SubcontractingModule } from "@/modules/subcontracting/SubcontractingModule";

export default function ProjectSubcontractPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-6">
      <SubcontractingModule projectId={id} />
    </div>
  );
}
