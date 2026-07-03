'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { ReportsModule } from '../../modules/reports/ReportsModule';

export default function ReportsPage() {
  return (
    <div className="flex h-screen bg-transparent relative w-full overflow-hidden">
      <Sidebar />
      <ReportsModule />
    </div>
  );
}
