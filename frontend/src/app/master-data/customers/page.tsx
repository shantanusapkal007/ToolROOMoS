"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { customerRegistry } from '@/modules/settings/registries/customerRegistry';

export default function CustomersPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={customerRegistry} />
    </div>
  );
}
