"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { operationRegistry } from '@/modules/settings/registries/operationRegistry';

export default function OperationsPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={operationRegistry} />
    </div>
  );
}
