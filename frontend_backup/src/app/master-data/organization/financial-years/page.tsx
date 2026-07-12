import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { financialYearRegistry } from '@/modules/settings/registries/financialYearRegistry';

export default function FinancialYearsPage() {
  return (
    <div className="p-6">
      <EntityView registry={financialYearRegistry} />
    </div>
  );
}
