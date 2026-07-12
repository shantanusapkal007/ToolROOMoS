import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const TABS = [
  { label: 'Stock Dashboard', path: '/inventory', exact: true },
  { label: 'Goods Receipt (GRN)', path: '/inventory/grn' },
  { label: 'Material Issue', path: '/inventory/material-issue' },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Inventory" basePath="/inventory" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
