"use client";

import { Sidebar } from "../../components/layout/Sidebar";
import { ActivityLogModule } from "../../modules/activity-log/ActivityLogModule";

export default function ActivityLogPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <ActivityLogModule />
    </div>
  );
}
