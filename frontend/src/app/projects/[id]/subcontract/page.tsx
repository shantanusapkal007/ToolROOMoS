"use client";

import React, { use } from "react";
import { SubcontractingModule } from "../../../../modules/subcontracting/SubcontractingModule";

export default function SubcontractPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="animate-slide-up flex-1 flex flex-col min-h-0 overflow-hidden pb-6">
      <SubcontractingModule projectId={resolvedParams.id} />
    </div>
  );
}
