import React from 'react';
import { EntityView } from '@/modules/settings/components/EntityView';
import { paymentTermRegistry } from '@/modules/settings/registries/paymentTermRegistry';

export default function PaymentTermsPage() {
  return (
    <div className="p-6">
      <EntityView registry={paymentTermRegistry} />
    </div>
  );
}
