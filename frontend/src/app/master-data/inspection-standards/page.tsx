"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { inspectionStandardRegistry } from '@/modules/settings/registries/inspectionStandardRegistry';

export default function InspectionStandardsPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={inspectionStandardRegistry} />
    </div>
  );
}
