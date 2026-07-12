import { ModuleLayout } from '../../components/layout/ModuleLayout';

const TABS = [
  { label: 'Document Browser', path: '/documents', exact: true }
];

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Documents" basePath="/documents" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
