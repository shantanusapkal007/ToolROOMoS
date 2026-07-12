import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { companyRegistry } from '@/modules/settings/registries/companyRegistry';

export default function CompaniesPage() {
  return (
    <div className="p-6">
      <EntityView registry={companyRegistry} />
    </div>
  );
}
