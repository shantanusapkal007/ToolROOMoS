import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { gaugeRegistry } from '@/modules/settings/registries/gaugeRegistry';

export default function GaugesPage() {
  return (
    <div className="p-6">
      <EntityView registry={gaugeRegistry} />
    </div>
  );
}
