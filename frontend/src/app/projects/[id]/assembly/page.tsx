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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-600 tracking-tight flex items-center drop-shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mr-4">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Assembly & Trials
          </h2>
          <p className="text-zinc-500 mt-2 font-medium">Manage final assembly work orders and customer acceptance trials</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setDrawerMode('ASSEMBLY')} 
            className="group relative px-5 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-indigo-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center text-zinc-700 font-bold text-sm"
          >
            <Plus className="w-4 h-4 mr-2 text-indigo-500" /> New Assembly Order
          </button>
          <button 
            onClick={() => setDrawerMode('TRIAL')} 
            className="group relative px-5 py-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 text-white font-bold text-sm flex items-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <PlayCircle className="w-4 h-4 mr-2" /> Log Trial Session
          </button>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="inline-flex p-1 bg-black/5 rounded-2xl mb-6 backdrop-blur-md border border-black/5 shadow-inner">
        <button
          onClick={() => setActiveTab('PRODUCT_TREE')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'PRODUCT_TREE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'}`}
        >
          Product Tree
        </button>
        <button
          onClick={() => setActiveTab('ASSEMBLY')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'ASSEMBLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'}`}
        >
          Assembly Work Orders ({assemblyOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('TRIALS')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${activeTab === 'TRIALS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800 hover:bg-white/50'}`}
        >
          Project Trials ({trials.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'PRODUCT_TREE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sub-Assembly Linker */}
          <div className="col-span-1 lg:col-span-1 glass-panel p-6 rounded-[2rem] border border-white/40 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[20px] -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
            <h3 className="text-lg font-black text-zinc-900 mb-2 relative z-10">Link Sub-Products</h3>
            <p className="text-xs text-zinc-500 mb-6 font-medium relative z-10">Build the product tree by attaching a sub-assembly to a parent assembly.</p>
            
            <div className="space-y-4 relative z-10">
              <Select label="Parent Assembly" value={linkParentId} onChange={e => setLinkParentId(e.target.value)}>
                <option value="">Select Parent...</option>
                {assemblyOrders.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.assemblyNumber} - {a.assemblyName}</option>
                ))}
              </Select>
              
              <div className="flex justify-center text-indigo-300 py-1">
                <Plus className="w-5 h-5 bg-indigo-50 rounded-full p-0.5" />
              </div>
              
              <Select label="Child Sub-Assembly" value={linkChildId} onChange={e => setLinkChildId(e.target.value)}>
                <option value="">Select Child...</option>
                {assemblyOrders.filter((a: any) => !a.parentAssemblyId && a.id !== linkParentId).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.assemblyNumber} - {a.assemblyName}</option>
                ))}
              </Select>
              
              <button className="w-full mt-6 py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all" onClick={handleLinkSubAssembly}>
                Link to Parent
              </button>
            </div>
          </div>
          
          {/* Product Tree Visualizer */}
          <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-[2rem] border border-white/40 shadow-xl flex flex-col h-full min-h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[40px] -mr-20 -mt-20 pointer-events-none group-hover:bg-purple-500/10 transition-all duration-500" />
            <h3 className="text-lg font-black text-zinc-900 mb-4 relative z-10">Hierarchy Overview</h3>
            
            <div className="flex-1 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 p-6 overflow-y-auto shadow-inner relative z-10 hide-scrollbar">
              {assemblyOrders.filter((a: any) => !a.parentAssemblyId).length === 0 ? (
                <div className="text-center text-zinc-400 mt-10 font-medium bg-white/50 py-8 rounded-xl border border-dashed border-zinc-200">No assemblies found.</div>
              ) : (
                <div className="space-y-5">
                  {assemblyOrders.filter((a: any) => !a.parentAssemblyId).map((parent: any) => (
                    <div key={parent.id} className="space-y-3">
                      <div className="flex items-center px-5 py-4 bg-white/80 border border-white shadow-sm hover:shadow-md transition-shadow rounded-xl text-zinc-900 font-bold group/parent">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mr-3 group-hover/parent:scale-105 transition-transform">
                          <Settings className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="font-mono text-indigo-600 mr-2">{parent.assemblyNumber}</span> 
                        {parent.assemblyName}
                      </div>
                      
                      {/* Render Children (1 level deep for now) */}
                      {parent.subAssemblies && parent.subAssemblies.length > 0 && (
                        <div className="pl-6 space-y-2">
                          {parent.subAssemblies.map((child: any) => (
                            <div key={child.id} className="flex items-center relative">
                              <div className="absolute left-0 top-0 w-px h-full bg-indigo-500/20 -ml-2" />
                              <div className="w-6 border-b-2 border-indigo-500/20 h-px mr-3" />
                              
                              <div className="flex-1 flex items-center px-4 py-3 bg-white/60 hover:bg-white/90 border border-white shadow-sm rounded-xl text-zinc-700 text-sm font-medium transition-colors">
                                <Settings className="w-3.5 h-3.5 mr-3 text-zinc-400" />
                                <span className="font-mono text-zinc-500 mr-2">{child.assemblyNumber}</span> 
                                {child.assemblyName}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ASSEMBLY' && (
        <div className="glass-panel p-6 rounded-[2rem] border border-white/40 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[40px] -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 bg-white/40 rounded-2xl border border-white/60 p-2 shadow-sm">
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
        </div>
      )}

      {activeTab === 'TRIALS' && (
        <div className="glass-panel p-6 rounded-[2rem] border border-white/40 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[40px] -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 bg-white/40 rounded-2xl border border-white/60 p-2 shadow-sm">
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
            <label className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-1.5 block">Trial Remarks & Observations</label>
            <textarea 
              className="w-full h-32 bg-white/50 border border-black/10 rounded-xl p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
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
