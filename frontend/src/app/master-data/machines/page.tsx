"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { machineRegistry } from '@/modules/settings/registries/machineRegistry';

export default function MachinesPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={machineRegistry} />
    </div>
  );
}
