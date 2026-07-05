"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { locationRegistry } from '@/modules/settings/registries/locationRegistry';

export default function LocationsPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={locationRegistry} />
    </div>
  );
}
