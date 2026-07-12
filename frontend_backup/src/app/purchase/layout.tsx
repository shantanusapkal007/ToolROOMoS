'use client';

import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const TABS = [
  { label: 'Dashboard', path: '/purchase', exact: true },
  { label: 'Purchase Orders', path: '/purchase/orders' },
  { label: 'Vendor Bills', path: '/purchase/bills' },
];

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Purchase" basePath="/purchase" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
