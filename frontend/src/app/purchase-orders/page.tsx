"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlobalPoModule } from '@/modules/procurement/GlobalPoModule';

export default function PurchaseOrdersPage() {
  return (
    <AppLayout>
      <GlobalPoModule />
    </AppLayout>
  );
}
