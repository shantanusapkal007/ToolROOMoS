"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { vendorRegistry } from '@/modules/settings/registries/vendorRegistry';

export default function VendorsPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={vendorRegistry} />
    </div>
  );
}
