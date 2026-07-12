import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { uomRegistry } from '@/modules/settings/registries/uomRegistry';

export default function UomsPage() {
  return (
    <div className="p-6">
      <EntityView registry={uomRegistry} />
    </div>
  );
}
