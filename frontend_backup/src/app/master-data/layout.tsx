'use client';

import React from 'react';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

const TABS = [
  { label: 'Dashboard', path: '/master-data', exact: true },
  { label: 'Customers', path: '/master-data/customers' },
  { label: 'Vendors', path: '/master-data/vendors' },
  { label: 'Materials', path: '/master-data/materials' },
  { label: 'Taxes', path: '/master-data/commercial/taxes' },
  { label: 'Currencies', path: '/master-data/commercial/currencies' },
  { label: 'Payment Terms', path: '/master-data/commercial/payment-terms' },
  { label: 'UOMs', path: '/master-data/commercial/uoms' },
  { label: 'Companies', path: '/master-data/organization/companies' },
  { label: 'Plants', path: '/master-data/organization/plants' },
  { label: 'Departments', path: '/master-data/organization/departments' },
  { label: 'Shifts', path: '/master-data/organization/shifts' },
  { label: 'Cost Centers', path: '/master-data/organization/cost-centers' },
  { label: 'Financial Years', path: '/master-data/organization/financial-years' },
  { label: 'Machines', path: '/master-data/machines' },
  { label: 'Employees', path: '/master-data/employees' },
  { label: 'Tools', path: '/master-data/resources/tools' },
  { label: 'Gauges', path: '/master-data/resources/gauges' },
  { label: 'Fixtures', path: '/master-data/resources/fixtures' },
  { label: 'Operations', path: '/master-data/operations' },
  { label: 'Warehouses', path: '/master-data/warehouses' },
  { label: 'Locations', path: '/master-data/locations' },
  { label: 'Resource Rates', path: '/master-data/rates' },
  { label: 'Custom Fields', path: '/master-data/custom-fields' },
];

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleName="Master Data" basePath="/master-data" tabs={TABS}>
      {children}
    </ModuleLayout>
  );
}
