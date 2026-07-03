"use client";

import { Sidebar } from "../../components/layout/Sidebar";
import { SettingsModule } from "../../modules/settings/SettingsModule";

export default function SettingsPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <SettingsModule />
    </div>
  );
}
