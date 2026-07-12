"use client";

import { EntityView } from '@/modules/settings/components/EntityView';
import { employeeRegistry } from '@/modules/settings/registries/employeeRegistry';

export default function EmployeesPage() {
  return (
    <div className="h-full w-full">
      <EntityView registry={employeeRegistry} />
    </div>
  );
}
