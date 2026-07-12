'use client';

import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const TABS = [
  { label: 'Dashboard', path: '/reports', exact: true },
  { label: 'OEE', path: '/reports/oee' },
  { label: 'Machines', path: '/reports/machines' },
  { label: 'Operators', path: '/reports/operators' },
  { label: 'WIP', path: '/reports/wip' },
  { label: 'Delays', path: '/reports/delays' },
  { label: 'Materials', path: '/reports/materials' },
  { label: 'Schedule', path: '/reports/schedule' },
];

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Reports" basePath="/reports" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
