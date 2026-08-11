"use client";

import { AppLayout } from "../../components/layout/AppLayout";
import { SettingsModule } from "../../modules/settings/SettingsModule";

export default function SettingsPage() {
  return (
    <AppLayout>
      <SettingsModule />
    </AppLayout>
  );
}
