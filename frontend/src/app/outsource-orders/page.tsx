"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalSubcontractModule } from "@/modules/subcontracting/GlobalSubcontractModule";

export default function OutsourceOrdersPage() {
  return (
    <AppLayout>
      <GlobalSubcontractModule />
    </AppLayout>
  );
}
