'use client';

import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ReportsModule } from '../../modules/reports/ReportsModule';

export default function ReportsPage() {
  return (
    <AppLayout>
      <ReportsModule />
    </AppLayout>
  );
}
