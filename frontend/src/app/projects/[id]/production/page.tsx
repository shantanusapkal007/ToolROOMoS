"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Activity } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";

export default function ProductionTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  
  const [showMsdrModal, setShowMsdrModal] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [setupTime, setSetupTime] = useState(2);
  const [cuttingTime, setCuttingTime] = useState(8);
  
  const [machines, setMachines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
    loadMachines();
    loadEmployees();
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

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
      loadProjectDetails(project.id);
    } catch (err: any) { alert(err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Production & Manufacturing</h2>
            <p className="text-slate-400 mt-1">Manage Shop Floor Routing and Machine Operations.</p>
          </div>
          <button onClick={() => setShowMsdrModal(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium">Log Machine Time</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <Activity className="h-6 w-6 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-white">Machine Logs (MSDR)</h3>
            <p className="text-sm text-slate-500 mt-1">{project.machineShopReports?.length || 0} operations logged</p>
          </div>
        </div>
      </div>

      {showMsdrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
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
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium">Log Time</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
