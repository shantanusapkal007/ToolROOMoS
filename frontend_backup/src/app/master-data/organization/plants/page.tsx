import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { plantRegistry } from '@/modules/settings/registries/plantRegistry';

export default function PlantsPage() {
  return (
    <div className="p-6">
      <EntityView registry={plantRegistry} />
    </div>
  );
}
