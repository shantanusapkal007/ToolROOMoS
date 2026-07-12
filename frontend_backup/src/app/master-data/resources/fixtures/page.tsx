import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { fixtureRegistry } from '@/modules/settings/registries/fixtureRegistry';

export default function FixturesPage() {
  return (
    <div className="p-6">
      <EntityView registry={fixtureRegistry} />
    </div>
  );
}
