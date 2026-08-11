"use client";

import { AppLayout } from "../../components/layout/AppLayout";
import { ActivityLogModule } from "../../modules/activity-log/ActivityLogModule";

export default function ActivityLogPage() {
  return (
    <AppLayout>
      <ActivityLogModule />
    </AppLayout>
  );
}
