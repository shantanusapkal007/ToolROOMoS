"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { RfqModule } from '@/modules/rfq/RfqModule';

export default function RfqPage() {
  return (
    <AppLayout>
      <RfqModule />
    </AppLayout>
  );
}
