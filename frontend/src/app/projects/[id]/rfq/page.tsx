"use client";

import React from "react";
import { useParams } from "next/navigation";
import { RfqModule } from "@/modules/rfq/RfqModule";
import { useProject } from "@/hooks/useProjects";

export default function ProjectRfqPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project } = useProject(id);

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <RfqModule
        projectId={id}
        title={`RFQs & Quotations — ${project?.partName || project?.projectNumber || "Project"}`}
        subtitle="Manage sales enquiries, tooling modifications, engineering change quotes, and cost estimates for this project"
        hideHeader={false}
      />
    </div>
  );
}
