import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { costCenterRegistry } from '@/modules/settings/registries/costCenterRegistry';

export default function CostCentersPage() {
  return (
    <div className="p-6">
      <EntityView registry={costCenterRegistry} />
    </div>
  );
}
