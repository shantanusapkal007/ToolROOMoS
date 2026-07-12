'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React, { useState } from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { Database, Package, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export default function MaterialAvailabilityDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();

  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [activeTab, setActiveTab] = useState('overview');

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/stores`
    : '/inventory/availability';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Stock List"}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center text-[12px] font-medium text-zinc-500">
        {projectId ? (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/projects')}>Projects</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(`/projects/${projectId.replace('PRJ-', '')}/overview`)}>{projectId}</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Inventory</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Stock Details</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/inventory')}>Inventory</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/inventory/availability')}>Stock Availability</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );

  const txnColumns = [
    { header: 'Date', accessorKey: 'date', size: 100 },
    { header: 'Type', accessorKey: 'type', size: 100 },
    { header: 'Ref', accessorKey: 'ref', size: 120 },
    { header: 'In', accessorKey: 'qtyIn', size: 60 },
    { header: 'Out', accessorKey: 'qtyOut', size: 60 },
    { header: 'Balance', accessorKey: 'balance', size: 80 },
  ];

  const txnData = [
    { id: '1', date: '2026-07-08', type: 'GRN', ref: 'GRN/2026/012', qtyIn: '50', qtyOut: '-', balance: '450' },
    { id: '2', date: '2026-07-08', type: 'ISSUE', ref: 'MI/2026/045', qtyIn: '-', qtyOut: '12', balance: '438' },
  ];

  return (
    <UniversalLayout breadcrumb={breadcrumb} toolbar={<UniversalToolbar />}>
      <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-2 pb-px mt-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-2 ${activeTab === 'overview' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
            360° Overview
          </button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2">All Transactions</button>
          <button className="text-zinc-500 hover:text-zinc-300 pb-2">Related Documents</button>
        </div>
      <div className="h-full flex flex-col gap-4 p-4 overflow-auto custom-scrollbar">
        {/* Header Summary */}
        <div className="glass-panel p-4 flex gap-8 items-center shrink-0">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Material</div>
            <div className="text-lg font-bold text-zinc-100">Aluminium Block (RM-001)</div>
            <div className="text-sm text-zinc-400">Grade: 7075 | Dimensions: 260x190x50</div>
          </div>
          <div className="h-10 w-px bg-white/10 mx-2"></div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Total Available Stock</div>
            <div className="text-2xl font-bold text-green-400">400 Kg</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Current Value</div>
            <div className="text-xl font-medium text-blue-400">₹ 6,75,000</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Status</div>
            <span className="px-2 py-0.5 text-xs font-bold rounded border text-green-400 bg-green-400/10 border-green-400/20">
              Available
            </span>
          </div>
        </div>

        {/* 360 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
          {/* Left Column: Stats & Projects */}
          <div className="flex flex-col gap-4">
            <div className="glass-panel p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-100 border-b border-white/10 pb-2">Stock Summary</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Current Physical Stock</span>
                <span className="font-medium text-zinc-100">450 Kg</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Reserved (Production)</span>
                <span className="font-medium text-amber-400">50 Kg</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Incoming (PO)</span>
                <span className="font-medium text-blue-400">120 Kg</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Available Off-cuts</span>
                <span className="font-medium text-zinc-100">2 Pcs</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                <span className="text-zinc-400">Average Cost</span>
                <span className="font-medium text-zinc-100">₹ 1500 / Kg</span>
              </div>
            </div>

            <div className="glass-panel p-4 flex flex-col gap-3 flex-1">
              <h3 className="text-sm font-semibold text-zinc-100 border-b border-white/10 pb-2">Related Links</h3>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-sm text-blue-400 hover:underline">View 3 Active Purchase Orders</a>
                <a href="#" className="text-sm text-blue-400 hover:underline">View 15 Recent GRNs</a>
                <a href="#" className="text-sm text-blue-400 hover:underline">View 42 Material Issues</a>
                <a href="#" className="text-sm text-blue-400 hover:underline">View 8 Related Projects</a>
              </div>
            </div>
          </div>

          {/* Right Column: Transactions & Offcuts */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="glass-panel flex flex-col flex-1">
              <div className="p-3 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-zinc-100">Recent Transactions</h3>
                <span className="text-xs text-blue-400 cursor-pointer hover:underline">View All</span>
              </div>
              <div className="flex-1 min-h-0">
                <UniversalTable columns={txnColumns} data={txnData} />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </UniversalLayout>
  );
}
