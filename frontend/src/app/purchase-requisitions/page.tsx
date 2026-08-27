"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PurchaseRequisitionsModule } from '@/modules/purchase-requisitions/PurchaseRequisitionsModule';

export default function PurchaseRequisitionsPage() {
  return (
    <AppLayout>
      <PurchaseRequisitionsModule />
    </AppLayout>
  );
}
