"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { materialRegistry } from '@/modules/settings/registries/materialRegistry';

export default function MaterialsPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={materialRegistry} />
    </div>
  );
}
