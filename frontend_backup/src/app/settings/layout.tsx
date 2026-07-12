import { ModuleLayout } from "../../components/layout/ModuleLayout";

const TABS = [
  { label: 'System Settings', path: '/settings', exact: true }
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Settings" basePath="/settings" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
