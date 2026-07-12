'use client';

import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const TABS = [
  { label: 'Dashboard', path: '/engineering', exact: true },
  { label: 'Bill of Materials', path: '/engineering/bom' },
  { label: 'Machine Routing', path: '/engineering/routing' },
  { label: 'Attachments', path: '/engineering/attachments' },
  { label: 'Revision History', path: '/engineering/history' },
  { label: 'Cost Estimation', path: '/engineering/costing' },
];

export default function EngineeringLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Engineering" basePath="/engineering" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
