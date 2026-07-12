"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { warehouseRegistry } from '@/modules/settings/registries/warehouseRegistry';

export default function WarehousesPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={warehouseRegistry} />
    </div>
  );
}
