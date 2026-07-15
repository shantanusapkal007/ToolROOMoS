"use client";

import React, { useState } from 'react';
import { Settings, Edit2, CheckCircle2, ShieldCheck, PlayCircle, Plus } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "@/hooks/useProjects";
import { formatDate } from "@/lib/formatters";
import {
  useAssemblyOrders,
  useProjectTrials,
  useCreateAssemblyOrder,
  useUpdateAssemblyStatus,
  useCreateProjectTrial,
  useUpdateTrialStatus,
  useSignOffTrial,
  useLinkSubAssembly
} from "@/hooks/useAssembly";

export default function AssemblyTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  
  const { data: assemblyOrders = [] } = useAssemblyOrders(projectId);
  const { data: trials = [] } = useProjectTrials(projectId);

  const createAssemblyOrderMutation = useCreateAssemblyOrder(projectId);
  const updateAssemblyStatusMutation = useUpdateAssemblyStatus(projectId);
  const createTrialMutation = useCreateProjectTrial(projectId);
  const updateTrialMutation = useUpdateTrialStatus(projectId);
  const signOffTrialMutation = useSignOffTrial(projectId);
  const linkSubAssemblyMutation = useLinkSubAssembly(projectId);
  
  const [activeTab, setActiveTab] = useState<'PRODUCT_TREE' | 'ASSEMBLY' | 'TRIALS'>('PRODUCT_TREE');
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
  // Forms state
  const [assemblyName, setAssemblyName] = useState('');
  const [trialRemarks, setTrialRemarks] = useState('');
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  
  // Link Sub-Assembly State
  const [linkParentId, setLinkParentId] = useState('');
  const [linkChildId, setLinkChildId] = useState('');

  if (projectLoading || !project) return null;

  const handleCreateAssembly = async () => {
    try {
      await createAssemblyOrderMutation.mutateAsync({ assemblyName });
      success("Assembly Order Created", "The assembly work order was generated successfully.");
      setDrawerMode(null);
      setAssemblyName('');
    } catch (err: any) {
      error("Failed to create", err.message || "Failed to create assembly order");
    }
  };

  const handleUpdateAssemblyStatus = async (id: string, status: string) => {
    try {
      await updateAssemblyStatusMutation.mutateAsync({ id, status });
      success("Status Updated", `Assembly order marked as ${status}`);
    } catch (err: any) {
      error("Failed to update status", err.message || "Error updating assembly order");
    }
  };

  const handleCreateTrial = async () => {
    try {
      await createTrialMutation.mutateAsync({ remarks: trialRemarks });
      success("Trial Logged", "New project trial session created successfully.");
      setDrawerMode(null);
      setTrialRemarks('');
    } catch (err: any) {
      error("Failed to log trial", err.message || "Error creating trial");
    }
  };

  const handleSignOffTrial = async (id: string) => {
    try {
      await signOffTrialMutation.mutateAsync(id);
      success("Trial Signed Off", "The trial passed and customer accepted. Dispatch is now unlocked.");
    } catch (err: any) {
      error("Failed to sign off", err.message || "Error signing off trial");
    }
  };

  const handleLinkSubAssembly = async () => {
    if (!linkParentId || !linkChildId) {
      error("Missing Input", "Please select both a parent and a child assembly");
      return;
    }
    if (linkParentId === linkChildId) {
      error("Invalid", "Cannot link an assembly to itself");
      return;
    }
    try {
      await linkSubAssemblyMutation.mutateAsync({ parentId: linkParentId, childId: linkChildId });
      success("Sub-Assembly Linked", "Successfully added sub-assembly to parent.");
      setLinkParentId('');
      setLinkChildId('');
    } catch (err: any) {
      error("Failed to link", err.message || "Error linking sub-assembly");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-400" /> Assembly & Trials
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Manage final assembly work orders and customer acceptance trials</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setDrawerMode('ASSEMBLY')} 
          >
            <Plus className="w-4 h-4 mr-2" /> New Assembly Order
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setDrawerMode('TRIAL')} 
          >
            <PlayCircle className="w-4 h-4 mr-2" /> Log Trial Session
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/5 pb-2">
        <button
          onClick={() => setActiveTab('PRODUCT_TREE')}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'PRODUCT_TREE' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          Product Tree
          {activeTab === 'PRODUCT_TREE' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full shadow-elevation" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ASSEMBLY')}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'ASSEMBLY' ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          Assembly Work Orders ({assemblyOrders.length})
          {activeTab === 'ASSEMBLY' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full shadow-elevation" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('TRIALS')}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'TRIALS' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-900'}`}
        >
          Project Trials ({trials.length})
          {activeTab === 'TRIALS' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500 rounded-t-full shadow-elevation" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PRODUCT_TREE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sub-Assembly Linker */}
          <div className="col-span-1 lg:col-span-1 bg-black/5 border border-black/5 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Link Sub-Products</h3>
            <p className="text-sm text-zinc-500 mb-6">Build the product tree by attaching a sub-assembly to a parent assembly.</p>
            
            <div className="space-y-4">
              <Select label="Parent Assembly" value={linkParentId} onChange={e => setLinkParentId(e.target.value)}>
                <option value="">Select Parent...</option>
                {assemblyOrders.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.assemblyNumber} - {a.assemblyName}</option>
                ))}
              </Select>
              
              <div className="flex justify-center text-slate-500 py-2">
                <Plus className="w-5 h-5" />
              </div>
              
              <Select label="Child Sub-Assembly" value={linkChildId} onChange={e => setLinkChildId(e.target.value)}>
                <option value="">Select Child...</option>
                {assemblyOrders.filter((a: any) => !a.parentAssemblyId && a.id !== linkParentId).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.assemblyNumber} - {a.assemblyName}</option>
                ))}
              </Select>
              
              <Button variant="primary" className="w-full mt-4" onClick={handleLinkSubAssembly}>Link to Parent</Button>
            </div>
          </div>
          
          {/* Product Tree Visualizer */}
          <div className="col-span-1 lg:col-span-2 bg-black/5 border border-black/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col h-full min-h-[400px]">
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Hierarchy Overview</h3>
            <div className="flex-1 rounded-xl bg-black/[0.02] border border-black/10/[0.05] p-6 overflow-y-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              {assemblyOrders.filter((a: any) => !a.parentAssemblyId).length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No assemblies found.</div>
              ) : (
                <div className="space-y-4">
                  {assemblyOrders.filter((a: any) => !a.parentAssemblyId).map((parent: any) => (
                    <div key={parent.id} className="space-y-2">
                      <div className="flex items-center px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300 font-medium">
                        <Settings className="w-4 h-4 mr-3 text-indigo-400" />
                        {parent.assemblyNumber} - {parent.assemblyName}
                      </div>
                      
                      {/* Render Children (1 level deep for now) */}
                      {parent.subAssemblies && parent.subAssemblies.map((child: any) => (
                        <div key={child.id} className="flex items-center pl-8">
                          <div className="w-6 border-b border-l border-black/10 h-6 -mt-6 mr-2 rounded-bl-lg" />
                          <div className="flex-1 flex items-center px-4 py-2 bg-black/5 border border-black/10 rounded-lg text-zinc-600 text-sm">
                            <Settings className="w-3.5 h-3.5 mr-3 text-zinc-500" />
                            {child.assemblyNumber} - {child.assemblyName}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ASSEMBLY' && (
        <div className="space-y-4">
          <SmartTable 
            data={assemblyOrders}
            isLoading={false}
            columns={[
              { 
                key: "assemblyNumber", 
                label: "Order No.",
                render: (val, row) => (
                  <div className="flex items-center text-indigo-300 font-medium">
                    <Edit2 className="w-4 h-4 mr-2 text-indigo-500/50" />
                    {val}
                  </div>
                )
              },
              { key: "assemblyName", label: "Assembly Name" },
              { 
                key: "createdAt", 
                label: "Date",
                render: (val) => formatDate(val)
              },
              { 
                key: "status", 
                label: "Status",
                render: (val) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    val === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    val === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-zinc-600 border-slate-500/20'
                  }`}>
                    {val}
                  </span>
                )
              },
              {
                key: "actions",
                label: "",
                render: (_, row) => (
                  <div className="flex gap-2 justify-end">
                    {row.status === 'DRAFT' && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateAssemblyStatus(row.id, 'IN_PROGRESS')}>Start Assembly</Button>
                    )}
                    {row.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="primary" onClick={() => handleUpdateAssemblyStatus(row.id, 'COMPLETED')}>Complete</Button>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {activeTab === 'TRIALS' && (
        <div className="space-y-4">
          <SmartTable 
            data={trials}
            isLoading={false}
            columns={[
              { 
                key: "trialNumber", 
                label: "Trial No.",
                render: (val) => (
                  <div className="flex items-center text-emerald-300 font-medium">
                    <PlayCircle className="w-4 h-4 mr-2 text-emerald-500/50" />
                    {val}
                  </div>
                )
              },
              { 
                key: "trialDate", 
                label: "Date",
                render: (val) => formatDate(val)
              },
              { key: "remarks", label: "Remarks" },
              { 
                key: "status", 
                label: "Result",
                render: (val, row) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    val === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    val === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {val}
                  </span>
                )
              },
              {
                key: "customerSignoff",
                label: "Customer Acceptance",
                render: (val, row) => (
                  val ? (
                    <div className="flex items-center text-emerald-400 text-sm">
                      <ShieldCheck className="w-4 h-4 mr-1.5" /> 
                      Signed off by {row.signoffBy}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm italic">Pending Signoff</span>
                  )
                )
              },
              {
                key: "actions",
                label: "",
                render: (_, row) => (
                  <div className="flex gap-2 justify-end">
                    {row.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => updateTrialMutation.mutate({ id: row.id, status: 'FAILED', remarks: row.remarks })}>Fail</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateTrialMutation.mutate({ id: row.id, status: 'PASSED', remarks: row.remarks })}>Pass</Button>
                      </>
                    )}
                    {row.status === 'PASSED' && !row.customerSignoff && (
                      <Button size="sm" variant="primary" onClick={() => handleSignOffTrial(row.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Sign Off
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}

      {/* Drawers */}
      <PremiumDrawer
        isOpen={drawerMode === 'ASSEMBLY'}
        onClose={() => setDrawerMode(null)}
        title="New Assembly Order"
        subtitle="Create an assembly work order for the final product"
      >
        <div className="space-y-5 mt-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">Assembly Name</label>
            <Input 
              value={assemblyName}
              onChange={e => setAssemblyName(e.target.value)}
              placeholder="e.g. Core Cavity Assembly Phase 1"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-black/5">
            <Button variant="ghost" onClick={() => setDrawerMode(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateAssembly} disabled={!assemblyName}>Create Order</Button>
          </div>
        </div>
      </PremiumDrawer>

      <PremiumDrawer
        isOpen={drawerMode === 'TRIAL'}
        onClose={() => setDrawerMode(null)}
        title="Log Project Trial"
        subtitle="Record trial metrics, results, and observations"
      >
        <div className="space-y-5 mt-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5 block">Trial Remarks & Observations</label>
            <textarea 
              className="w-full h-32 bg-slate-900/50 border border-black/10 rounded-xl p-3 text-sm text-zinc-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              value={trialRemarks}
              onChange={e => setTrialRemarks(e.target.value)}
              placeholder="Enter flashing details, dimensional accuracies, shot weight variations, etc."
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-black/5">
            <Button variant="ghost" onClick={() => setDrawerMode(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTrial}>Save Trial Log</Button>
          </div>
        </div>
      </PremiumDrawer>

    </div>
  );
}
