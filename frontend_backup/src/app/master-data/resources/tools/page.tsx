import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { toolRegistry } from '@/modules/settings/registries/toolRegistry';

export default function ToolsPage() {
  return (
    <div className="p-6">
      <EntityView registry={toolRegistry} />
    </div>
  );
}
