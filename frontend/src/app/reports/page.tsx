'use client';

import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { ReportsModule } from '../../modules/reports/ReportsModule';

export default function ReportsPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <ReportsModule />
    </div>
  );
}
