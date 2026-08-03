"use client";

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalPoModule } from '@/modules/procurement/GlobalPoModule';

export default function PurchaseOrdersPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-4">
          <GlobalPoModule />
        </div>
      </main>
    </div>
  );
}
