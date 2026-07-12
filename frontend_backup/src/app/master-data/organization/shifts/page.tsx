import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { shiftRegistry } from '@/modules/settings/registries/shiftRegistry';

export default function ShiftsPage() {
  return (
    <div className="p-6">
      <EntityView registry={shiftRegistry} />
    </div>
  );
}
