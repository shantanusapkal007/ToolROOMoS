"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Activity, Wrench, PackageMinus, Plus, Factory } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { formatDate } from "../../../../lib/formatters";

export default function ProductionTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  
  const [activeSubTab, setActiveSubTab] = useState<'MSDR' | 'ISSUES'>('MSDR');

  // Modals
  const [showMsdrModal, setShowMsdrModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Lists
  const [msdrs, setMsdrs] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  
  // Lookups
  const [machines, setMachines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  // MSDR Form
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [setupTime, setSetupTime] = useState(2);
  const [cuttingTime, setCuttingTime] = useState(8);

  // Issue Form
  const [issueNumber, setIssueNumber] = useState(`ISS-${Date.now().toString().slice(-6)}`);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [issueQty, setIssueQty] = useState(1);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
    loadMachines();
    loadEmployees();
    loadAvailableBatches();
    loadProductionData(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const loadProductionData = async (projectId: string) => {
    try {
      const [msdrRes, issueRes] = await Promise.all([
        api.get(`projects/${projectId}/machine-shop-reports`),
        api.get(`projects/${projectId}/material-issues`),
      ]);
      setMsdrs(msdrRes.data || []);
      setIssues(issueRes.data || []);
    } catch (err) { console.error(err); }
  }

  const loadMachines = async () => {
    const res = await api.get("master-data/machines");
    setMachines(res.data || []);
    if (res.data?.length > 0) setSelectedMachineId(res.data[0].id);
  };
  
  const loadEmployees = async () => {
    const res = await api.get("master-data/employees");
    setEmployees(res.data || []);
    if (res.data?.length > 0) setSelectedEmployeeId(res.data[0].id);
  };

  const loadAvailableBatches = async () => {
    try {
      const res = await api.get(`inventory-batches`);
      setAvailableBatches(res.data || []);
      if (res.data?.length > 0) setSelectedBatchId(res.data[0].id);
    } catch (err) { console.error("Could not load batches", err); }
  };

  const handleLogMsdr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/machine-shop-reports`, {
        machineId: selectedMachineId,
        employeeId: selectedEmployeeId,
        reportDate: new Date().toISOString(),
        startTime: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        setupTime: setupTime,
        cuttingTime: cuttingTime,
        producedQty: 1,
      });
      setShowMsdrModal(false);
      success("Log Saved", "Machine time logged successfully.");
      loadProductionData(project.id);
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed", err.message); }
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/material-issues`, {
        issueNumber,
        items: [{
          inventoryBatchId: selectedBatchId,
          issuedQty: issueQty
        }]
      });
      setShowIssueModal(false);
      success("Material Issued", `Issue slip ${issueNumber} generated.`);
      loadProductionData(project.id);
      loadAvailableBatches();
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed", err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-h3 font-bold text-white flex items-center">
            <Factory className="h-6 w-6 mr-3 text-cyan-400" />
            Production Floor
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage Material Consumption and Machine Work Centers</p>
        </div>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-white/10 shrink-0">
        <button 
          onClick={() => setActiveSubTab('MSDR')} 
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeSubTab === 'MSDR' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Activity className="h-4 w-4 inline mr-2" /> Machine Logs
        </button>
        <button 
          onClick={() => setActiveSubTab('ISSUES')} 
          className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 ${activeSubTab === 'ISSUES' ? 'border-purple-400 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <PackageMinus className="h-4 w-4 inline mr-2" /> Material Issues
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {activeSubTab === 'MSDR' && (
          <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-bold text-white">Machine Shop Daily Reports</h3>
              <button onClick={() => setShowMsdrModal(true)} className="btn-primary bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center text-xs py-2 px-4">
                <Plus className="h-4 w-4 mr-2" /> Log Machine Time
              </button>
            </div>
            
            {msdrs.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <Wrench className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No machine logs recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {msdrs.map(m => (
                  <div key={m.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex justify-between items-center group">
                    <div>
                       <span className="font-bold text-white text-sm">Machine: {m.machine?.name || 'Unknown'}</span>
                       <span className="text-slate-400 text-xs ml-4 border-l border-slate-600 pl-4">Operator: {m.employee?.name || 'Unknown'}</span>
                       <div className="text-xs text-slate-500 mt-1">Logged: {formatDate(m.reportDate)}</div>
                    </div>
                    <div className="text-right">
                       <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded text-xs font-bold mr-3">Setup: {m.setupTime}h</span>
                       <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-xs font-bold">Cut: {m.cuttingTime}h</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'ISSUES' && (
          <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-lg font-bold text-white">Material Issues (Consumption)</h3>
              <button onClick={() => setShowIssueModal(true)} className="btn-primary bg-purple-600 hover:bg-purple-500 text-white border-none shadow-[0_0_15px_rgba(147,51,234,0.3)] flex items-center text-xs py-2 px-4">
                <Plus className="h-4 w-4 mr-2" /> Issue Material
              </button>
            </div>
            
            {issues.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <PackageMinus className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No materials issued for this project.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {issues.map(i => (
                  <div key={i.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-bold text-white text-sm">{i.issueNumber}</span>
                       <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">{i.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-3">{formatDate(i.issueDate)}</div>
                    
                    <div className="pl-4 border-l-2 border-purple-500/30 space-y-2">
                      {i.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm bg-black/20 p-2 rounded">
                           <span className="text-slate-300">
                             {item.inventoryBatch?.material?.materialName} <span className="text-slate-500 text-xs ml-2">(Batch: {item.inventoryBatch?.batchNumber})</span>
                           </span>
                           <span className="font-mono text-purple-400 font-bold">{item.issuedQty} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showMsdrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up border border-cyan-500/20">
            <h2 className="text-h4 font-bold mb-6 text-white">Log Machine Time</h2>
            <form onSubmit={handleLogMsdr} className="space-y-4">
              <Select
                label="Machine"
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                options={machines.map(m => ({ label: m.name, value: m.id }))}
              />
              <Select
                label="Operator"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                options={employees.map(e => ({ label: e.name, value: e.id }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Setup Time (hrs)"
                  type="number"
                  value={setupTime}
                  onChange={(e) => setSetupTime(Number(e.target.value))}
                  required
                />
                <Input
                  label="Cutting Time (hrs)"
                  type="number"
                  value={cuttingTime}
                  onChange={(e) => setCuttingTime(Number(e.target.value))}
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowMsdrModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)]">Log Time</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up border border-purple-500/20">
            <h2 className="text-h4 font-bold mb-6 text-white">Issue Material</h2>
            <form onSubmit={handleIssueMaterial} className="space-y-4">
              <Input
                label="Issue Slip Number"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Inventory Batch</label>
                <select
                  required
                  className="input-field w-full"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">Choose Batch...</option>
                  {availableBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.material?.materialName} - {b.batchNumber} (Qty: {b.currentQty})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Qty to Issue"
                type="number"
                min="1"
                step="0.01"
                value={issueQty}
                onChange={(e) => setIssueQty(Number(e.target.value))}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowIssueModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium shadow-[0_0_15px_rgba(147,51,234,0.3)]">Submit Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
