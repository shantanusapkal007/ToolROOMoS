import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { departmentRegistry } from '@/modules/settings/registries/departmentRegistry';

export default function DepartmentsPage() {
  return (
    <div className="p-6">
      <EntityView registry={departmentRegistry} />
    </div>
  );
}
