"use client";

import React, { useState } from 'react';
import { Package, Plus, PackageMinus } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "@/hooks/useProjects";
import { useInventoryBatches } from "@/hooks/useInventory";
import { useIssueMaterial } from "@/hooks/useProduction";
import { formatDate } from "@/lib/formatters";

export default function InventoryTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: availableBatches } = useInventoryBatches(projectId);
  const issueMaterialMutation = useIssueMaterial(projectId);
  
  const [activeTab, setActiveTab] = useState<'ISSUES' | 'GRN'>('ISSUES');
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
  const [issueForm, setIssueForm] = useState({ 
    issueNumber: `ISS-${Date.now().toString().slice(-6)}`, 
    items: [{ batchId: '', qty: 1 }] 
  });

  if (projectLoading || !project) return null;

  const issues = project.materialIssueHeaders || [];
  const grns = project.goodsReceiptHeaders || [];

  const handleIssueMaterial = async () => {
    try {
      await issueMaterialMutation.mutateAsync({
        issueNumber: issueForm.issueNumber,
        items: issueForm.items.map(i => ({ inventoryBatchId: i.batchId, issuedQty: Number(i.qty) }))
      });
      setDrawerMode(null);
      success("Material Issued", "Successfully issued material to shop floor");
    } catch (err: any) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center">
            <Package className="w-5 h-5 mr-2 text-purple-400" /> Inventory & Material Control
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Project material ledger, inbound receipts, and shop floor issues</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setIssueForm({ issueNumber: `ISS-${Date.now().toString().slice(-6)}`, items: [{ batchId: '', qty: 1 }] });
              setDrawerMode('ISSUE');
            }} 
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all shadow-elevation text-sm font-medium"
          >
            <PackageMinus className="w-4 h-4 mr-2" /> Issue Material
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10 pb-px">
        {['ISSUES', 'GRN'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            {tab === 'GRN' ? 'Goods Receipts' : 'Material Issues'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-black/5 border border-black/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        {activeTab === 'ISSUES' && (
          <SmartTable 
            data={issues}
            isLoading={false}
            columns={[
              { key: 'issueNumber', label: 'Issue No' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
              { key: 'items', label: 'Items', render: (v) => v?.length || 0 }
            ]}
          />
        )}
        
        {activeTab === 'GRN' && (
          <SmartTable 
            data={grns}
            isLoading={false}
            columns={[
              { key: 'grnNumber', label: 'GRN No' },
              { key: 'supplierChallan', label: 'Supplier Challan' },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
              { key: 'items', label: 'Items', render: (v) => v?.length || 0 }
            ]}
          />
        )}
      </div>

      <PremiumDrawer
        isOpen={drawerMode === 'ISSUE'}
        onClose={() => setDrawerMode(null)}
        title="Issue Material"
        subtitle="Issue raw materials or components to the shop floor"
      >
        <div className="space-y-4 p-1">
          <Input label="Issue Number" value={issueForm.issueNumber} onChange={e => setIssueForm({...issueForm, issueNumber: e.target.value})} />
          {issueForm.items.map((item, idx) => (
            <div key={idx} className="p-4 bg-black/5 border border-black/10 rounded-xl space-y-4">
              <Select label="Select Batch" value={item.batchId} onChange={e => {
                const newItems = [...issueForm.items];
                newItems[idx].batchId = e.target.value;
                setIssueForm({...issueForm, items: newItems});
              }}>
                <option value="">Select a batch...</option>
                {availableBatches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.material?.materialName} (Available: {b.availableQty})</option>
                ))}
              </Select>
              <Input label="Quantity" type="number" value={item.qty} onChange={e => {
                const newItems = [...issueForm.items];
                newItems[idx].qty = Number(e.target.value);
                setIssueForm({...issueForm, items: newItems});
              }} />
            </div>
          ))}
          <button onClick={() => setIssueForm({...issueForm, items: [...issueForm.items, {batchId:'', qty:1}]})} className="text-sm text-purple-400 font-medium flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add another item
          </button>
          
          <div className="pt-6">
            <button onClick={handleIssueMaterial} className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-colors">
              Complete Issue
            </button>
          </div>
        </div>
      </PremiumDrawer>

    </div>
  );
}
