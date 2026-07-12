import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { taxRegistry } from '@/modules/settings/registries/taxRegistry';

export default function TaxesPage() {
  return (
    <div className="p-6">
      <EntityView registry={taxRegistry} />
    </div>
  );
}
