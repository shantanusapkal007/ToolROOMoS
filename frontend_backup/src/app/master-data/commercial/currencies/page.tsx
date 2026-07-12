import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { currencyRegistry } from '@/modules/settings/registries/currencyRegistry';

export default function CurrenciesPage() {
  return (
    <div className="p-6">
      <EntityView registry={currencyRegistry} />
    </div>
  );
}
