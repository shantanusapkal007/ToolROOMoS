import { ModuleLayout } from "../../../components/layout/ModuleLayout";

const TABS = [
  { label: 'Active Projects', path: '/projects', exact: true }
];

export default function ProjectsListLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Projects" basePath="/projects" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
