"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EntityView } from '@/modules/settings/components/EntityView';
import { customerRegistry } from '@/modules/settings/registries/customerRegistry';

export default function MasterDataPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/master-data/customers');
  }, [router]);

  return (
    <div className="h-full w-full">
      <EntityView registry={customerRegistry} />
    </div>
  );
}
