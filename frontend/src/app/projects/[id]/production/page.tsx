"use client";

import React, { useState } from 'react';
import { Activity, Wrench, PackageMinus, Plus, Factory, CheckCircle, Clock, FileText, ChevronRight, PlayCircle } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { MsdrTableForm } from "@/components/production/MsdrTableForm";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "@/hooks/useProjects";
import { useMasterData } from "@/hooks/useMasterData";
import { useInventoryBatches } from "@/hooks/useInventory";
import { 
  useJobCards, useMSDRs, useMaterialIssues, 
  useGenerateJobCards, useUpdateJobCardStatus, useLogMSDR, useIssueMaterial
} from "@/hooks/useProduction";
import { formatDate } from "@/lib/formatters";

export default function ProductionTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: machines } = useMasterData('machines');
  const { data: employees } = useMasterData('employees');
  const { data: availableBatches } = useInventoryBatches(projectId);
  
  const [activeSection, setActiveSection] = useState<string>('MACHINE_SHOP');
  const [activeTab, setActiveTab] = useState<'JOB_CARDS' | 'MSDR' | 'ISSUES'>('JOB_CARDS');

  // Fetch MSDRs specifically for the active section
  const { data: msdrs = [] } = useMSDRs(projectId, activeSection);
  const { data: jobCards = [] } = useJobCards(projectId);
  const { data: issues = [] } = useMaterialIssues(projectId);

  const generateJobCardsMutation = useGenerateJobCards(projectId);
  const updateJobCardStatusMutation = useUpdateJobCardStatus(projectId);
  const logMSDRMutation = useLogMSDR(projectId);
  const issueMaterialMutation = useIssueMaterial(projectId);

  // Drawer states
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Forms
  const [msdrForm, setMsdrForm] = useState({ reportDate: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '17:00', machineId: '', employeeId: '', setupTime: 0, cuttingTime: 0 });
  const [issueForm, setIssueForm] = useState({ issueNumber: `ISS-${Date.now().toString().slice(-6)}`, items: [{ batchId: '', qty: 1 }] });

  if (projectLoading || !project) return null;

  const handleGenerateJobCards = async () => {
    try {
      await generateJobCardsMutation.mutateAsync();
      success("Job Cards Generated", "Routing operations converted to Job Cards");
    } catch (err: any) {}
  };

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

  const handleLogMSDR = async () => {
    try {
      await logMSDRMutation.mutateAsync({
        ...msdrForm,
        jobCardId: selectedItem?.id,
        routingOperationId: selectedItem?.routingOperationId,
        setupTime: Number(msdrForm.setupTime),
        cuttingTime: Number(msdrForm.cuttingTime),
        productionSection: activeSection,
      });
      setDrawerMode(null);
      success("MSDR Logged", "Production hours logged successfully");
    } catch (err: any) {}
  };

  const SECTION_LABELS: Record<string, string> = {
    MACHINE_SHOP: 'Machine Shop',
    PRESS_SHOP: 'Press Shop',
    FABRICATION_INDIAN: 'Fabrication (Indian)',
    FABRICATION_EXPORT: 'Fabrication (Export)',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header and Quick Stats */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-indigo-400" /> {SECTION_LABELS[activeSection] || 'Shop Floor Control'}
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage {SECTION_LABELS[activeSection]?.toLowerCase() || 'manufacturing'} operations, issues, and daily reports</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setSelectedItem(null); setDrawerMode('MSDR'); }} 
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-elevation text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Log {SECTION_LABELS[activeSection] || 'Daily'} Report
          </button>
          <button 
            onClick={() => setDrawerMode('ISSUE')} 
            className="flex items-center px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-all text-sm font-medium"
          >
            <PackageMinus className="w-4 h-4 mr-2" /> Issue Material
          </button>
          <button 
            onClick={handleGenerateJobCards} 
            className="flex items-center px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-all text-sm font-medium"
          >
            <Wrench className="w-4 h-4 mr-2" /> Generate Job Cards
          </button>
        </div>
      </div>

      {/* Sections Sub-Navigation */}
      <div className="flex gap-2 pb-4 overflow-x-auto">
        {[
          { id: 'MACHINE_SHOP', label: 'Machine Shop' },
          { id: 'PRESS_SHOP', label: 'Press Shop' },
          { id: 'FABRICATION_INDIAN', label: 'Fabrication (Indian)' },
          { id: 'FABRICATION_EXPORT', label: 'Fabrication (Export)' }
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeSection === section.id ? 'bg-indigo-600 text-white shadow-elevation' : 'bg-black/5 text-zinc-600 hover:bg-black/10'}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/10 pb-px">
        {['JOB_CARDS', 'MSDR', 'ISSUES'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content based on tab */}
      <div className="bg-black/5 border border-black/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        {activeTab === 'JOB_CARDS' && (
          <SmartTable 
            data={jobCards}
            isLoading={false}
            columns={[
              { key: 'id', label: 'ID', render: (val) => val.slice(-6).toUpperCase() },
              { key: 'routingOperation', label: 'Operation', render: (val) => val?.operation?.operationName || 'Unknown' },
              { key: 'machine', label: 'Planned Machine', render: (val) => val?.machineName || 'Any' },
              { key: 'status', label: 'Status' },
              { 
                key: 'actions', 
                label: '', 
                render: (_, row) => (
                  <button onClick={() => { setSelectedItem(row); setDrawerMode('MSDR'); }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg transition-colors flex items-center">
                    <PlayCircle className="w-3 h-3 mr-1" /> Log Work
                  </button>
                )
              }
            ]}
          />
        )}
        
        {activeTab === 'MSDR' && (
          <SmartTable 
            data={msdrs}
            isLoading={false}
            columns={[
              { key: 'reportDate', label: 'Date', render: (v) => formatDate(v) },
              { key: 'productionSection', label: 'Section', render: (v) => (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                  {SECTION_LABELS[v] || v || 'Machine Shop'}
                </span>
              )},
              { key: 'machine', label: 'Machine', render: (v) => v?.machineName },
              { key: 'employee', label: 'Operator', render: (v) => v?.firstName },
              { key: 'msdrNumber', label: 'Report No' },
              { key: 'operations', label: 'Operations', render: (v) => v?.length || 0 }
            ]}
          />
        )}

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
      </div>

      {/* Premium Drawers for Forms */}
      <PremiumDrawer
        isOpen={drawerMode === 'ISSUE'}
        onClose={() => setDrawerMode(null)}
        title="Issue Material"
        subtitle="Issue raw materials or components to the shop floor"
      >
        <div className="space-y-4 p-1">
          <Input label="Issue Number" value={issueForm.issueNumber} onChange={e => setIssueForm({...issueForm, issueNumber: e.target.value})} />
          {issueForm.items.map((item, idx) => (
            <div key={idx} className="p-4 bg-black/[0.02] border border-black/10/[0.05] rounded-xl space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
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
          <button onClick={() => setIssueForm({...issueForm, items: [...issueForm.items, {batchId:'', qty:1}]})} className="w-full py-3 mt-4 border border-black/10 bg-black/[0.02] hover:bg-white/[0.05] hover:border-black/20 text-indigo-400 hover:text-indigo-300 font-bold rounded-xl transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" /> Add another item
          </button>
          
          <div className="pt-6">
            <button onClick={handleIssueMaterial} className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 shadow-elevation rounded-xl text-indigo-300 hover:text-white font-bold text-sm transition-all">
              Complete Issue
            </button>
          </div>
        </div>
      </PremiumDrawer>

      {drawerMode === 'MSDR' && (
        <MsdrTableForm
          projectId={projectId}
          productionSection={activeSection}
          onClose={() => setDrawerMode(null)}
          onSuccess={() => { setDrawerMode(null); }}
        />
      )}

    </div>
  );
}
